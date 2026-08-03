/**
 * MXZONE STORE — Worker de preview social para las fichas de producto.
 *
 * EL PROBLEMA QUE RESUELVE
 * ------------------------
 * Los crawlers de WhatsApp, Facebook, Twitter y Telegram NO ejecutan JavaScript.
 * `js/product-detail.js` escribe los og: correctos, pero lo hace DESPUES de que
 * el HTML ya se sirvio, asi que el crawler solo ve el HTML crudo, donde el head
 * todavia dice "Cargando producto...". Resultado: un link de producto pegado en
 * WhatsApp sale sin foto, sin nombre y sin precio.
 *
 * Esto no es un detalle cosmetico: WhatsApp es el canal #1 de MXZONESTORE
 * (33 clicks a WhatsApp vs 6 llegadas a /checkout en 30 dias).
 *
 * COMO LO RESUELVE
 * ----------------
 * El sitio sigue siendo assets-only para el 99% del trafico. Este worker se
 * activa SOLO en /product y /product.html (ver `run_worker_first` en
 * wrangler.jsonc) y ahi:
 *
 *   - Si el visitante es una PERSONA -> devuelve el asset tal cual, sin tocar
 *     nada y sin pedirle datos a nadie. Cero latencia agregada, cero riesgo.
 *   - Si es un CRAWLER -> trae el producto de la MISMA fuente que las cards
 *     (`/api/public/products?project=1`), y reescribe el head con HTMLRewriter.
 *
 * POR QUE SOLO PARA CRAWLERS (decision deliberada, no atajo):
 *   1. Latencia: reescribir exige tener el producto ANTES de responder. Meterle
 *      una llamada a la API a cada carga humana en movil no se paga con nada.
 *   2. Radio de explosion: si 4ULAB se cae, el peor caso es que el preview salga
 *      generico. Nunca que la ficha no cargue. El fallback es el asset crudo.
 *   No hay cloaking: el contenido que ve el crawler es el mismo que termina
 *   viendo la persona una vez que corre el JS.
 *
 * UNA SOLA FUENTE DE VERDAD
 * -------------------------
 * Este worker replica a proposito la misma API, la misma paginacion y el mismo
 * `createProductSlug()` que `js/products.js` + `js/utils.js`. Si cambia el slug
 * del lado del cliente y no cambia aca, los previews apuntan a productos que no
 * existen. Es el mismo error que congelo las fichas con los 326 JSON estaticos.
 * SI TOCAS EL SLUG, TOCALO EN LOS DOS LADOS.
 */

const SITE = 'https://www.mxzonestore.com';
const API = 'https://4-ulab.vercel.app/api/public/products?project=1';
const PAGE_SIZE = 200;
const MAX_PAGES = 10;

/** Cuanto vive el catalogo en el cache del edge (seg). */
const CATALOG_TTL = 300;
/** Cuanto vive el HTML ya reescrito, por slug (seg). */
const PAGE_TTL = 600;

/**
 * WhatsApp manda `WhatsApp/2.xx`. Facebook `facebookexternalhit`. Se incluye
 * tambien a Googlebot: renderiza JS y no lo necesita, pero darle el head ya
 * resuelto le ahorra el render y le llega igual de correcto.
 */
const CRAWLER_RE = /(whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|discordbot|slackbot|slack-imgproxy|pinterest|skypeuripreview|redditbot|embedly|vkshare|applebot|googlebot|bingbot|yandexbot|duckduckbot|iframely|snapchat)/i;

/**
 * WhatsApp no renderiza og:image en formato WebP: muestra el link sin foto.
 * 120 de los 281 productos de MX tienen la foto en .webp. La conversion pide
 * Cloudflare Image Transformations, que HOY NO ESTA HABILITADO en la zona
 * (/cdn-cgi/image/... devuelve 404 — medido el 2026-08-03).
 *
 * Cuando se habilite en el dashboard (Images -> Transformations -> enable for
 * zone), poner esto en true y los webp pasan a servirse como JPEG. El resto de
 * los formatos (jpg/jpeg/png/jfif) ya funcionan hoy y no pasan por aca.
 */
const IMAGE_TRANSFORM_ENABLED = false;

/** Foto de respaldo cuando el producto no tiene ninguna. */
const FALLBACK_IMAGE = SITE + '/assets/logo/logo.png';

// ---------------------------------------------------------------------------
// Helpers — espejo de js/utils.js y js/products.js
// ---------------------------------------------------------------------------

/**
 * Marcas diacriticas combinantes (U+0300..U+036F), las que deja sueltas
 * `normalize('NFD')`. Se construye con `new RegExp` a proposito: escrito como
 * literal `/[..]/` el fuente queda con caracteres combinantes INVISIBLES que
 * cualquier editor o pipeline de texto puede comerse en silencio, y ahi todo
 * producto con tilde genera un slug distinto al del cliente.
 */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/** ESPEJO EXACTO de createProductSlug() en js/utils.js. No divergir. */
function createProductSlug(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** ESPEJO de getCategoryLabel() en js/product-detail.js. */
const CATEGORY_LABELS = {
  cascos: 'Cascos',
  uniformes: 'Uniformes',
  botas: 'Botas',
  protecciones: 'Protecciones',
  accesorios: 'Accesorios',
  jersey: 'Jerseys',
  gafas: 'Gafas',
  gorras: 'Gorras',
  guantes: 'Guantes',
  maletas: 'Maletas',
};

function categoryLabel(category) {
  const c = String(category || '').toLowerCase().trim();
  return CATEGORY_LABELS[c] || (c || 'Producto');
}

/** ESPEJO del formateo de precio de adaptProductFrom4ULAB(). */
function formatPrice(raw) {
  if (raw == null || raw === '' || isNaN(Number(raw))) return '';
  return '$' + Math.floor(Number(raw)).toLocaleString('es-CO');
}

/** Escapa para meterlo DENTRO de un atributo HTML entre comillas dobles. */
function attr(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Resuelve la foto de compartir a una URL absoluta.
 * Las fotos de 4ULAB ya vienen absolutas desde R2, pero el catalogo tiene
 * historia y todavia puede aparecer alguna ruta relativa.
 */
function shareImage(product) {
  const raw = product.metaImageUrl || (Array.isArray(product.images) ? product.images[0] : '') || '';
  if (!raw) return FALLBACK_IMAGE;

  let url = String(raw).trim();
  // Bug historico de datos: rutas guardadas como "/https://..."
  if (url.startsWith('/https:') || url.startsWith('/http:')) url = url.slice(1);
  if (!/^https?:/i.test(url)) url = SITE + '/' + url.replace(/^\//, '');
  url = url.replace(/ /g, '%20');

  if (IMAGE_TRANSFORM_ENABLED && /\.webp(\?|$)/i.test(url)) {
    return SITE + '/cdn-cgi/image/width=1200,height=630,fit=cover,format=jpeg/' + url;
  }
  return url;
}

/**
 * El texto que WhatsApp muestra debajo del titulo. Arranca con el PRECIO a
 * proposito: es el dato que decide si alguien abre el link o no.
 * `js/product-detail.js` construye exactamente el mismo string — si cambia uno,
 * cambian los dos.
 */
function shareDescription(product) {
  const price = formatPrice(product.price);
  const label = categoryLabel(product.category);
  const stock = Number(product.stock);
  const agotado = !(stock > 0);
  const head = agotado ? 'AGOTADO' : (price || 'Consultar precio');
  return `${head} — ${label} para motocross y enduro en Colombia. Envío a todo el país desde Cali. MXZONE STORE.`;
}

// ---------------------------------------------------------------------------
// Catalogo
// ---------------------------------------------------------------------------

/**
 * Trae el catalogo COMPLETO paginando de a 200.
 *
 * OJO CON LA PAGINACION: el catalogo ronda los 281 productos. Un fetch suelto
 * con el limite por defecto se comeria ~81 productos y esas fichas darian
 * "no encontrado" en el preview sin explicacion visible.
 *
 * Se apoya en el cache del edge (`cf.cacheTtl`) en vez de un KV: son 2 llamadas
 * cada 5 minutos como maximo, compartidas por todos los crawlers del colo.
 */
async function fetchCatalog() {
  let all = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(`${API}&limit=${PAGE_SIZE}&offset=${offset}`, {
      headers: { Accept: 'application/json' },
      cf: { cacheTtl: CATALOG_TTL, cacheEverything: true },
    });
    if (!res.ok) throw new Error('4ULAB HTTP ' + res.status);

    const data = await res.json();
    const batch = data && data.products;
    if (!Array.isArray(batch) || batch.length === 0) break;

    all = all.concat(batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

async function findProduct(slug) {
  const catalog = await fetchCatalog();
  return catalog.find((p) => createProductSlug(p.name) === slug) || null;
}

// ---------------------------------------------------------------------------
// Reescritura del head
// ---------------------------------------------------------------------------

function buildHead(product, slug) {
  const name = product.name || 'Producto';
  const label = categoryLabel(product.category);
  const price = formatPrice(product.price);
  const desc = shareDescription(product);
  const image = shareImage(product);
  const canonical = `${SITE}/product?product=${encodeURIComponent(slug)}`;
  const title = `${name} - ${label} | Motocross Colombia | MXZONE STORE`;
  const inStock = Number(product.stock) > 0;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    image: [image],
    description: product.description || desc,
    category: label,
    sku: product.sku || undefined,
    brand: {
      '@type': 'Brand',
      name: product.brand || (product.attributes && product.attributes.marca) || 'MXZONE',
    },
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'COP',
      price: product.price != null ? String(product.price) : undefined,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'MXZONE STORE' },
    },
  };

  // El titulo del preview es el nombre pelado: WhatsApp corta temprano y
  // "| Motocross Colombia | MXZONE STORE" se come el nombre del producto.
  return `
<title>${attr(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${attr(canonical)}">
<meta property="og:site_name" content="MXZONE STORE">
<meta property="og:locale" content="es_CO">
<meta property="og:type" content="product">
<meta property="og:url" content="${attr(canonical)}">
<meta property="og:title" content="${attr(name)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:image" content="${attr(image)}">
<meta property="og:image:alt" content="${attr(name)}">
<meta property="product:price:amount" content="${attr(product.price != null ? String(product.price) : '')}">
<meta property="product:price:currency" content="COP">
<meta property="product:availability" content="${inStock ? 'in stock' : 'out of stock'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@mxzonestore">
<meta name="twitter:creator" content="@mxzonestore">
<meta name="twitter:url" content="${attr(canonical)}">
<meta name="twitter:title" content="${attr(name)}">
<meta name="twitter:description" content="${attr(desc)}">
<meta name="twitter:image" content="${attr(image)}">
<meta name="twitter:image:alt" content="${attr(name)}">
<script type="application/ld+json" data-mx-og="server">${JSON.stringify(schema)}</script>
<!-- head inyectado por worker/index.js — precio ${attr(price || 'n/d')} -->`.trim();
}

/**
 * `product.html` trae DOS juegos de tags sociales: uno estatico arriba y otro
 * con id="dynamic-*" mas abajo que dice "Cargando...". Con etiquetas duplicadas
 * cada crawler elige distinto (Facebook toma la primera, otros la ultima), asi
 * que no alcanza con pisar una: hay que BORRAR todas y dejar un solo bloque.
 */
function rewriteHead(response, product, slug) {
  return new HTMLRewriter()
    .on('head title', { element: (el) => el.remove() })
    .on('head meta', {
      element(el) {
        const prop = (el.getAttribute('property') || '').toLowerCase();
        const nm = (el.getAttribute('name') || '').toLowerCase();
        if (prop.startsWith('og:') || prop.startsWith('product:')) return el.remove();
        if (nm.startsWith('twitter:') || nm === 'description') return el.remove();
      },
    })
    .on('head link[rel="canonical"]', { element: (el) => el.remove() })
    .on('head script[type="application/ld+json"]', { element: (el) => el.remove() })
    .on('head', {
      element(el) {
        el.append(buildHead(product, slug), { html: true });
      },
    })
    .transform(response);
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Todo lo que no sea la ficha de producto ni siquiera deberia llegar aca
    // (lo acota run_worker_first), pero el worker no confia en la config.
    const isProductPage = url.pathname === '/product' || url.pathname === '/product.html';
    if (!isProductPage) return env.ASSETS.fetch(request);

    const slug = url.searchParams.get('product');
    const forced = url.searchParams.get('_og') === '1'; // para verificar sin fingir UA
    const ua = request.headers.get('user-agent') || '';
    const isCrawler = CRAWLER_RE.test(ua);

    // Persona: el asset crudo, intacto. Es el 99% del trafico.
    if (!slug || (!isCrawler && !forced)) return env.ASSETS.fetch(request);

    // Crawler: el head resuelto del lado del servidor.
    const cache = caches.default;
    const cacheKey = new Request(`${SITE}/__og/product/${encodeURIComponent(slug)}`, {
      method: 'GET',
    });

    if (!forced) {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    }

    // Cualquier fallo cae al asset crudo: el preview sale generico, pero la
    // ficha NUNCA deja de responder por culpa de este worker.
    let product = null;
    try {
      product = await findProduct(slug);
    } catch (err) {
      const fallback = await env.ASSETS.fetch(request);
      const res = new Response(fallback.body, fallback);
      res.headers.set('x-mx-og', 'error:' + String(err && err.message).slice(0, 60));
      return res;
    }

    const assetRes = await env.ASSETS.fetch(request);

    if (!product) {
      const res = new Response(assetRes.body, assetRes);
      res.headers.set('x-mx-og', 'miss:' + slug);
      return res;
    }

    const rewritten = rewriteHead(assetRes, product, slug);
    const res = new Response(rewritten.body, rewritten);
    res.headers.set('content-type', 'text/html; charset=utf-8');
    res.headers.set('cache-control', `public, max-age=${PAGE_TTL}`);
    res.headers.set('x-mx-og', 'hit:' + slug);

    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  },
};
