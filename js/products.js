/**
 * MXZONE STORE - Dynamic Product Loader v7.1
 * Actualizado: 2026-06-04 — Fix: eliminada función loadProducts() duplicada que causaba fetch a /api/store/products (CORS fail)
 * 
 * Carga productos desde 4ULAB CMS via API pública (/api/public/products)
 * Fallback a OLD_CMS si 4ULAB no responde.
 * 
 * Para ver el sistema anterior (archivado):
 *   Ver OLD_CMS/TIPODEUSO.md
 *   Backup en OLD_CMS/products.js.backup
 */

// Usar window.WHATSAPP_NUMBER para evitar redeclaración entre scripts
window.WHATSAPP_NUMBER = window.WHATSAPP_NUMBER || '573186467646';

function escapeHtml(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 🔴 2026-09-08: este bloque nacio ADENTRO de createProductCard y por eso
// `adaptProductFrom4ULAB` —que corre antes y esta mas arriba— tiraba
// "todasLasTallasAgotadas is not defined" en CADA producto. El adaptador
// entero fallaba, `loadProductsFrom4ULAB` se iba por el catch y la tienda
// caia al catalogo viejo de respaldo: 22 jerseys en vez de 33. Una funcion
// declarada adentro de otra solo existe adentro de esa otra.
// Vive aca arriba, en el tope del archivo, porque la usan los dos.

/**
 * STOCK POR TALLA — 2026-09-08
 *
 * Hasta hoy la tienda recibia UN numero de stock para todo el producto. Con eso
 * ofrecia la XL aunque la unica unidad fuera una S. Caso medido en produccion:
 * RODILLERA LEATT 3DF HYBRID, stock 1, tallas S/M/L/XL.
 *
 * Ahora `/api/public/products` manda ademas `variantes: [{talla, stock, sku}]`.
 *
 * LA REGLA QUE NO SE PUEDE ROMPER: `null` es "no lo conte" y NO agota. El dia
 * que se lleno esa tabla, las 314 filas nacieron en null; si null agotara, el
 * catalogo entero de un comercio amaneceria vacio. Solo un numero contado que
 * sea 0 o menos saca una talla de la venta.
 */
function claveDeTalla(talla) {
  return String(talla == null ? '' : talla).trim().toUpperCase();
}

/** De la lista que manda el API a un objeto `{ TALLA: stock }`. */
function mapaDeStockPorTalla(variantes) {
  const mapa = {};
  if (!Array.isArray(variantes)) return mapa;
  variantes.forEach(v => {
    if (!v) return;
    const k = claveDeTalla(v.talla);
    if (!k) return;
    mapa[k] = (v.stock === null || v.stock === undefined) ? null : Number(v.stock);
  });
  return mapa;
}

/** Si una talla se puede vender. Sin dato => si, igual que antes de todo esto. */
function hayStockDeTalla(mapa, talla) {
  if (!mapa) return true;
  const k = claveDeTalla(talla);
  if (!(k in mapa)) return true;      // esa talla no tiene fila todavia
  const n = mapa[k];
  if (n === null || n === undefined) return true;  // contada nunca
  return Number(n) > 0;
}

/**
 * Si TODAS las tallas del producto estan contadas en cero. Solo entonces el
 * producto entero se marca agotado: con una sola talla disponible se sigue
 * vendiendo, y el selector se encarga del resto.
 */
/**
 * PRIORIDAD DENTRO DE LA TALLA — 2026-09-08
 *
 * El catalogo ya tiene un orden comercial por PRODUCTO (`sortOrder`, que la
 * tienda respeta desde el 2026-08-23). Esto agrega el segundo nivel que pidio
 * Seven: dentro de una misma talla, que se pueda decir cual va primero.
 *
 * Para que signifique algo tienen que pasar dos cosas a la vez: que el
 * comprador este mirando UNA sola talla, y que el duenio haya posicionado algo
 * en esa talla. Si no, no se toca nada y manda el orden de siempre.
 *
 * `null` = "no lo posicione" y va al final, detras de todo lo posicionado.
 * `0` es una posicion valida y significa "primero de todos", igual que en
 * products.sortOrder. Por eso no se puede usar 0 como "sin poner".
 */
function ordenDeTallaDe(variantes, talla) {
  if (!Array.isArray(variantes)) return null;
  const k = claveDeTalla(talla);
  for (let i = 0; i < variantes.length; i++) {
    const v = variantes[i];
    if (v && claveDeTalla(v.talla) === k) {
      const n = v.sortOrder;
      return (n === null || n === undefined) ? null : Number(n);
    }
  }
  return null;
}

/**
 * Compara dos cards para ordenarlas dentro de una talla. Devuelve 0 cuando
 * ninguna esta posicionada, para que quien llama deje el orden que ya tenia —
 * el comercial del catalogo— en vez de inventar uno.
 */
function compararPorOrdenDeTalla(ordenA, ordenB) {
  const a = (ordenA === null || ordenA === undefined) ? null : Number(ordenA);
  const b = (ordenB === null || ordenB === undefined) ? null : Number(ordenB);
  if (a === null && b === null) return 0;   // ninguna posicionada: no se toca
  if (a === null) return 1;                 // sin posicionar va DESPUES
  if (b === null) return -1;
  return a - b;
}

function todasLasTallasAgotadas(mapa, tallas) {
  if (!mapa || !Array.isArray(tallas) || tallas.length === 0) return false;
  const conocidas = tallas.filter(t => claveDeTalla(t) in mapa);
  if (conocidas.length === 0) return false;
  if (conocidas.length !== tallas.length) return false;  // alguna sin fila: no se afirma
  return conocidas.every(t => !hayStockDeTalla(mapa, t));
}

// ═════════════════════════════════════════════════════════════
// ADAPTADOR 4ULAB CMS → FORMATO MXZONESTORE
// ═════════════════════════════════════════════════════════════

/**
 * Convierte un producto de 4ULAB al formato que espera createProductCard().
 * 
 * Formato 4ULAB:
 *   { id, name, slug, description, price, pricePrevious, stock, sku,
 *     metaImageUrl, images, attributes, category, categoryId }
 * 
 * Formato MXZONESTORE esperado:
 *   { name, category, price, sizes, badge, image, images, agotado }
 */
function adaptProductFrom4ULAB(p) {
  // Extraer tallas desde attributes
  let sizes = 'Consultar';
  if (p.attributes && p.attributes.tallas) {
    if (Array.isArray(p.attributes.tallas)) {
      sizes = p.attributes.tallas.join('/').toUpperCase();
    } else if (typeof p.attributes.tallas === 'string') {
      sizes = p.attributes.tallas.toUpperCase();
    }
  }

  // Extraer marca desde attributes
  let badge = p.attributes && p.attributes.marca ? p.attributes.marca : '';
  if (p.featured) {
    badge = 'Destacado';
  }

  // Determinar categoría
  let category = (p.category || '').toLowerCase().trim();
  const nameLower = (p.name || '').toLowerCase();

  // Mapear algunas categorías específicas si es necesario
  const categoryMap = {
    'cascos': 'cascos',
    'uniformes': 'uniformes',
    'jersey': 'jersey',
    'botas': 'botas',
    'protecciones': 'protecciones'
  };
  category = categoryMap[category] || category || 'sin-categoria';

  // FIX sub-issue Jerseys (#004): corrección híbrida por nombre + categoría
  const looksLikeJersey = nameLower.includes('jersey') || nameLower.includes('jerseys');
  const looksLikePantalon = nameLower.includes('pantalon') || nameLower.includes('pantalón') || nameLower.includes('pant');

  if (category === 'jersey' && looksLikePantalon && !looksLikeJersey) {
    // Producto mal categorizado como jersey pero es pantalón
    category = 'pantalones';
  } else if (category !== 'jersey' && category !== 'uniformes-ninos' && looksLikeJersey) {
    // Producto con nombre de jersey pero no está en categoría jersey -> forzar a jersey
    category = 'jersey';
  }

  // Formatear precio (viene como string "449000.00" o number)
  let priceStr = p.price || 'Consultar';
  if (priceStr && !isNaN(Number(priceStr))) {
    const num = Math.floor(Number(priceStr));
    priceStr = '$' + num.toLocaleString('es-CO');
  }

  // Imagen principal
  const image = p.metaImageUrl || (p.images && p.images[0]) || 'assets/placeholder.jpg';

  return {
    // ID real de 4ULAB: sin esto, data-4u-product-id salia vacio y el endpoint
    // /api/public/track descartaba TODOS los eventos view/addToCart (productId
    // inexistente en la tabla products) -> paneles "mas vistos" / "mas agregados"
    // quedaban vacios para siempre. Tambien alimenta el id del item del carrito
    // para atribuir la conversion por producto.
    id: p.id,
    name: p.name || 'Producto sin nombre',
    category: category,
    brand: p.brand || ((p.attributes && p.attributes.marca) ? String(p.attributes.marca).trim() : ''),
    price: priceStr,
    sizes: sizes,
    badge: badge,
    image: image,
    images: p.images || (p.metaImageUrl ? [p.metaImageUrl] : []),
    // Usar stock real de 4ULAB: stock=0 o stock null => agotado
    //
    // 2026-09-08: se suma el caso "TODAS las tallas contadas en cero". Un
    // producto asi esta agotado aunque el `stock` general diga otra cosa, y la
    // tienda ya esconde lo agotado (ver createProductCard: `if (agotado) return ''`).
    //
    // Se ata corto a proposito: `todasLasTallasAgotadas` exige que TODAS las
    // tallas tengan fila Y esten contadas. Con una sola sin contar devuelve
    // false y el producto se sigue mostrando. Hoy las 314 filas estan en null,
    // asi que esta linea no esconde absolutamente nada — recien empieza a
    // actuar cuando el duenio termina de contar un producto entero.
    agotado:
      !(p.stock && Number(p.stock) > 0) ||
      todasLasTallasAgotadas(
        mapaDeStockPorTalla(p.variantes),
        String(sizes || '').split('/').map(t => t.trim()).filter(Boolean)
      ),
    // Campos adicionales de 4ULAB que pueden ser útiles
    _4ulabId: p.id,
    _4ulabSlug: p.slug,
    _4ulabAttributes: p.attributes || {},
    _4ulabPriceRaw: p.price,
    _4ulabStock: p.stock,
    // Stock por talla. Las tiendas viejas del API no lo mandan: sin el, todo se
    // comporta como antes y nada se rompe.
    variantes: Array.isArray(p.variantes) ? p.variantes : []
  };
}

/**
 * Adaptador de carga desde 4ULAB CMS.
 * Carga TODOS los productos con paginacion hasta que no haya mas.
 */
async function loadProductsFrom4ULAB() {
  try {
    const IMAGE_VERSION = window.MXZONE_CONFIG ? window.MXZONE_CONFIG.imageVersion : 'v10';
    const BASE_URL = 'https://4-ulab.vercel.app/api/public/products?project=1';
    let allProducts = [];
    let offset = 0;
    const limit = 200;
    let pageCount = 0;

    while (true) {
      var apiUrl = BASE_URL + '&limit=' + limit + '&offset=' + offset;
      mxLog('[4ULAB] Cargando pagina', pageCount + 1, ':', apiUrl);

      const response = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      const data = await response.json();
      if (!data.products || data.products.length === 0) {
        mxLog('[4ULAB] No hay mas productos en pagina', pageCount + 1);
        break;
      }

      allProducts = allProducts.concat(data.products);
      mxLog('[4ULAB] Pagina', pageCount + 1, ':', data.products.length, 'productos. Total:', allProducts.length);

      if (data.products.length < limit) {
        mxLog('[4ULAB] Ultima pagina alcanzada');
        break;
      }

      offset += limit;
      pageCount += 1;

      // Safety: no mas de 10 paginas (2000 productos)
      if (pageCount > 10) {
        mxLog('[4ULAB] Safety break: mas de 2000 productos');
        break;
      }
    }

    if (allProducts.length === 0) {
      throw new Error('Sin productos');
    }

    // Adaptar todos los productos al formato MXZONESTORE
    const products = allProducts.map(adaptProductFrom4ULAB)
      .filter(p => {
        // FIX #006: no renderizar productos sin nombre o precio inválido
        const hasName = p.name && String(p.name).trim() !== '' && p.name !== 'Producto sin nombre';
        const priceNum = parseInt((p.price || '0').toString().replace(/[^0-9]/g, ''));
        const hasPrice = priceNum > 0;
        if (!hasName || !hasPrice) {
          mxLog('[FILTER] Producto omitido por datos inválidos:', p.name || '(sin nombre)', 'price:', p.price, 'category:', p.category);
        }
        return hasName && hasPrice;
      });

    mxLog('[4ULAB] Total productos cargados:', products.length);
    return products;

  } catch (error) {
    mxLog('[4ULAB] Error:', error.message);
    // Signal para fallback
    throw new Error('4ULAB_FAILED');
  }
}

// Función para descubrir y cargar TODOS los productos automáticamente
async function loadProducts() {
  try {
    // ══════════════════════════════════════════════════════════
    // PRIMERA OPCIÓN: 4ULAB CMS (sistema nuevo)
    // ══════════════════════════════════════════════════════════
    try {
      const products4ULAB = await loadProductsFrom4ULAB();
      if (products4ULAB && products4ULAB.length > 0) {
        return products4ULAB;
      }
    } catch (e4ulab) {
      mxLog('[4ULAB] No disponible, intentando OLD_CMS...');
    }

    // ══════════════════════════════════════════════════════════
    // SEGUNDA OPCIÓN: OLD_CMS (sistema anterior archivado)
    // ══════════════════════════════════════════════════════════
    const cmsApiUrl = 'https://growisoulsand.pages.dev';
    const IMAGE_VERSION = window.MXZONE_CONFIG ? window.MXZONE_CONFIG.imageVersion : 'v10';
    
    try {
      var projectKey = '';
      var apiUrl = cmsApiUrl + '/api/store/products';
      if (projectKey) {
        apiUrl += '?project=' + encodeURIComponent(projectKey);
      }
      mxLog('[OLD_CMS] Cargando productos desde CMS API:', apiUrl);
      const apiResponse = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        if (apiData.products) {
          const products = apiData.products.map(function(p) {
            if (p.images && p.images.length > 0) {
              p.images = p.images.filter(function(img) { return img != null && typeof img === 'string' && img.trim() !== ''; }).map(function(img) { return encodeImagePath(img) + '?' + IMAGE_VERSION; });
            }
            if (p.image) {
              p.image = encodeImagePath(p.image) + '?' + IMAGE_VERSION;
            }
            return p;
          });
          mxLog('[OLD_CMS] Productos cargados:', products.length);
          return products;
        }
      }
      mxLog('[WARN] OLD_CMS API respondio con error. Intentando fallback a JSON locales...');
    } catch(e) {
      mxLog('[WARN] Error en OLD_CMS API:', e.message);
    }

    // ══════════════════════════════════════════════════════════
    // TERCERA OPCIÓN: archivos JSON estáticos locales
    // ══════════════════════════════════════════════════════════
    const cmsBaseUrl = window.MXZONE_CONFIG ? window.MXZONE_CONFIG.cmsBaseUrl : 'cms/productos/';
    mxLog('[FILES] Fallback: cargando productos desde archivos estáticos');

    const noCache = 'nocache=' + Date.now();
    let productFiles = [];
    try {
      const indexResponse = await fetch(cmsBaseUrl + 'index.json?' + noCache);
      if (indexResponse.ok) {
        const indexData = await indexResponse.json();
        productFiles = indexData.files || [];
        mxLog('[OK] index.json cargado:', productFiles.length, 'archivos');
      } else {
        mxLog('[WARN] index.json respondió con estado:', indexResponse.status);
      }
    } catch (e) {
      mxLog('[ERROR] Error cargando index.json:', e);
    }

    if (productFiles.length === 0) {
      mxLog('[ERROR] No se pudo cargar index.json');
      return [];
    }

    productFiles = productFiles.filter(f => f !== 'index.json');
    mxLog('[LOAD] Cargando', productFiles.length, 'productos estáticos...');

    const promises = productFiles.map(async (file) => {
      try {
        const response = await fetch(cmsBaseUrl + encodeURIComponent(file) + '?' + noCache);
        if (response.ok) {
          const product = await response.json();
          if (product.images && product.images.length > 0) {
            product.images = product.images.filter(img => img != null && typeof img === 'string' && img.trim() !== '').map(img => encodeImagePath(img) + '?' + IMAGE_VERSION);
          }
          if (product.image) {
            product.image = encodeImagePath(product.image) + '?' + IMAGE_VERSION;
          }
          return product;
        } else {
          mxLog('[WARN] No se pudo cargar', file);
        }
      } catch (e) {
        mxLog('[ERROR] Error cargando', file + ':', e.message);
      }
      return null;
    });

    const results = await Promise.all(promises);
    const validProducts = results.filter(p => p !== null);
    mxLog('[OK] Productos estáticos cargados:', validProducts.length, 'de', productFiles.length);
    return validProducts;

  } catch (error) {
    mxLog('[ERROR] Error critico cargando productos:', error);
    return [];
  }
}

// Función para crear el HTML de una tarjeta de producto
function createProductCard(product) {
  // NO renderizar productos agotados en la tienda
  if (product.agotado === true) return '';

  const whatsappMessage = encodeURIComponent(`Estoy interesado en ${product.name}`);
  const whatsappUrl = `https://wa.me/${window.WHATSAPP_NUMBER}?text=${whatsappMessage}`;
  const rawBrand = product.brand || (product.attributes && product.attributes.marca) || '';
  const brandFrom4U = String(rawBrand).trim();
  const brandObj = (brandFrom4U && brandFrom4U !== 'otro')
    ? getBrand(brandFrom4U)  // normaliza a { name, icon } para que slugs coincidan
    : getBrand(product.name);
  const brand = normalizeBrandSlug(brandObj.name);
  const priceNum = parseInt((product.price || '0').toString().replace(/[^0-9]/g, '')) || 0;
  const productSlug = createProductSlug(product.name);

  // Soporte para múltiples imágenes (array images)
  const isCloudCannonUrl = (url) => url && url.includes('cloudvent.net');

  let images = [];
  // IMPORTANTE: Los JSON del CMS usan "image" (singular), no "images" (array)
  // Primero intentar con images (array), luego fallback a image (singular)
  if (product.images && Array.isArray(product.images)) {
    images = product.images.filter(img => img != null && typeof img === 'string' && img.trim() !== '');
  }
  // Fallback: usar product.image (singular) si no hay array
  if (!images.length && product.image) {
    images = [product.image];
  }

  // Agregar cache buster solo a imágenes locales (no CloudCannon)
  const imageVersion = window.MXZONE_CONFIG ? window.MXZONE_CONFIG.imageVersion : 'v10';
  images = images.map(img => {
    // Corregir formato de URL rota de CloudCannon (/https:/ -> https://)
    if (img && img.startsWith('/https:/')) {
      img = img.replace('/https:/', 'https://');
    }
    if (isCloudCannonUrl(img)) {
      // URLs de CloudCannon (cloudvent.net) se usan directamente
      return img;
    }
    // Rutas locales: usar ruta absoluta directa sin modificar
    return img + '?v=' + imageVersion;
  });

  const mainImage = images.length > 0 ? images[0] : '';
  const badgeHTML = product.badge ?
    `<span class="product-badge">${product.badge}</span>` : '';

  // Parsear tallas
  const requiresSize = shouldRequireSize(product.sizes);
  const sizesArray = product.sizes ? product.sizes.split('/').map(s => s.trim()).filter(s => s !== '') : ['Única'];
  // El stock por talla llega en `variantes`. Se guarda tambien en la card para
  // que `addProductToCart` pueda decidir sin volver a pedirle nada al servidor.
  const stockTallas = mapaDeStockPorTalla(product.variantes);

  // Orden por talla, para que main.js pueda reordenar sin volver a pedir nada.
  const ordenTallas = {};
  (Array.isArray(product.variantes) ? product.variantes : []).forEach(v => {
    if (!v) return;
    const k = claveDeTalla(v.talla);
    if (k) ordenTallas[k] = (v.sortOrder === null || v.sortOrder === undefined) ? null : Number(v.sortOrder);
  });

  // Una talla agotada se muestra pero NO se puede elegir. Esconderla seria
  // peor: el cliente que busca su talla creeria que el producto nunca la tuvo,
  // en vez de entender que hoy no hay y puede volver.
  const sizeOptions = requiresSize
    ? `<option value="" disabled selected>TALLA</option>` + sizesArray.map(size => {
        const sinStock = !hayStockDeTalla(stockTallas, size);
        return `<option value="${size}"${sinStock ? ' disabled' : ''}>${size}${sinStock ? ' — agotada' : ''}</option>`;
      }).join('')
    : `<option value="Única" selected>ÚNICA</option>`;

  return `
    <div class="product-card"
         data-4u-product-id="${product.id || ''}"
         data-stock="${product._4ulabStock ?? ''}"
         data-category="${product.category || 'sin-categoria'}"
         data-brand="${brand}"
         data-price="${priceNum}"
         data-image="${mainImage}"
         data-images='${JSON.stringify(images).replace(/'/g, "&#39;")}'
         data-slug="${productSlug}"
         data-sizes="${product.sizes || 'Única'}"
         data-stock-tallas='${JSON.stringify(stockTallas).replace(/'/g, "&#39;")}'
         data-orden-tallas='${JSON.stringify(ordenTallas).replace(/'/g, "&#39;")}'>
      <div class="product-image">
        <img src="${mainImage}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <span class="product-image-placeholder" style="display:none;">MX</span>
        ${badgeHTML}
      </div>
      <div class="product-info">
        <span class="product-category">${getCategoryLabel(product.category)}</span>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-price-wrapper">
          <span class="product-price">${product.price || 'Consultar precio'}</span>
        </div>
        <div class="product-sizes-selector">
          <select class="card-size-select" aria-label="Seleccionar talla">
            ${sizeOptions}
          </select>
        </div>
        <div class="product-actions">
          <button type="button" class="btn btn-secondary btn-ver" data-4u-track="click" data-4u-product-id="${product.id || ''}">
            Ver
          </button>
          <button class="btn btn-cart-add" onclick="addProductToCart('${productSlug}')" data-4u-track="addToCart" data-4u-product-id="${product.id || ''}">
            Agregar
          </button>
        </div>
      </div>
    </div>
  `;
}

// Función para obtener el label de la categoría
function getCategoryLabel(category) {
  const labels = {
    'cascos': 'Cascos',
    'uniformes': 'Uniformes',
    'jersey': 'Jerseys',
    'pantalones': 'Pantalones',
    'botas': 'Botas',
    'protecciones': 'Protecciones',
    'accesorios': 'Accesorios',
    'jersey': 'Jerseys',
    'gafas': 'Gafas',
    'gorras': 'Gorras',
    'guantes': 'Guantes',
    'maletas': 'Maletas',
    'uniformes-ninos': 'Uniformes Niños',
    'cascos-ninos': 'Cascos Niños',
    'botas-ninos': 'Botas Niños',
    'guantes-ninos': 'Guantes Niños',
    'infantil': 'Niños / Infantil',
    'uniformes-ninos': 'Uniformes Niños',
    'cascos-ninos': 'Cascos Niños',
    'botas-ninos': 'Botas Niños',
    'guantes-ninos': 'Guantes Niños',
    'gafas-ninos': 'Gafas Niños',
    'protecciones-ninos': 'Protecciones Niños'
  };
  return labels[category] || category || 'Sin categoría';
}

// Función para renderizar productos en la página principal
async function renderFeaturedProducts() {
  mxLog('renderFeaturedProducts: iniciando...');
    const products = await loadProducts();
    mxLog('renderFeaturedProducts:', products.length, 'productos cargados');

    const categories = ['cascos', 'uniformes', 'jersey', 'botas', 'protecciones'];

    categories.forEach(category => {
      const categoryProducts = products.filter(p => p.category === category).slice(0, 4);
    const container = document.querySelector(`[data-products="${category}"]`);
    mxLog(`renderFeaturedProducts: ${category} tiene ${categoryProducts.length} productos, container:`, container);

    if (container && categoryProducts.length > 0) {
      container.innerHTML = categoryProducts.map(createProductCard).join('');

      // Re-inicializar modal después de cargar productos en home
      setTimeout(() => {
        if (window.MXZONE && window.MXZONE.InitProductModal) {
          window.MXZONE.InitProductModal();
        }
      }, 100);
    }
  });
}

// ── CATEGORY CARDS DEL HOME (feedback del jefe 2026-07-02) ──────────────
// Reemplaza las 4 cards estáticas con clip-art por TODAS las categorías con
// una FOTO REAL de producto (fondo blanco) y el conteo real. El markup
// hardcodeado de index.html queda como fallback no-JS.
async function renderCategoryCards() {
  const grid = document.querySelector('#categorias .categories-grid');
  if (!grid) return; // no estamos en el home

  const products = await loadProducts();
  if (!products.length) return;

  // Orden y agrupación curada. 'ninos' agrupa todas las subcategorías -ninos.
  // 'prefer': producto cuya foto representa la categoría (pedido del jefe).
  const CATEGORY_CARDS = [
    { slug: 'cascos', label: 'Cascos', prefer: 'kozmik' },
    { slug: 'uniformes', label: 'Uniformes' },
    { slug: 'jersey', label: 'Jerseys' },
    { slug: 'botas', label: 'Botas' },
    { slug: 'guantes', label: 'Guantes' },
    { slug: 'protecciones', label: 'Protecciones' },
    { slug: 'gafas', label: 'Gafas' },
    { slug: 'gorras', label: 'Gorras' },
    { slug: 'maletas', label: 'Maletas' },
    { slug: 'accesorios', label: 'Accesorios' },
    { slug: 'ninos', label: 'Niños', match: (c) => c === 'ninos' || (c || '').endsWith('-ninos') },
  ];

  // Imagen representativa: 1) producto preferido (curado), 2) destacado con
  // foto, 3) primero con foto.
  function pickImage(items, prefer) {
    const withImage = items.filter((p) => {
      const img = (Array.isArray(p.images) && p.images[0]) || p.image;
      return img && String(img).trim() !== '' && p.agotado !== true;
    });
    if (!withImage.length) return '';
    let chosen = null;
    if (prefer) {
      chosen = withImage.find((p) => (p.name || '').toLowerCase().includes(prefer));
    }
    if (!chosen) {
      chosen = withImage.find((p) => p.badge || p.destacado || p.featured) || withImage[0];
    }
    return (Array.isArray(chosen.images) && chosen.images[0]) || chosen.image || '';
  }

  const cards = CATEGORY_CARDS.map((cat) => {
    const matcher = cat.match || ((c) => c === cat.slug);
    const items = products.filter((p) => matcher(p.category));
    if (!items.length) return ''; // no mostrar categorías vacías
    const img = pickImage(items, cat.prefer);
    const count = items.length;
    const photo = img
      ? `<div class="category-photo"><img src="${img}" alt="${cat.label}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`
      : '';
    return `
      <a href="shop.html?cat=${cat.slug}" class="category-card category-card--photo" data-4u-track="click" data-4u-label="categoria-${cat.slug}">
        ${photo}
        <div class="category-content">
          <h3 class="category-name">${cat.label}</h3>
          <span class="category-count">${count} producto${count === 1 ? '' : 's'}</span>
        </div>
      </a>
    `;
  }).filter(Boolean);

  if (cards.length) {
    grid.innerHTML = cards.join('');
  }
}

// Función para renderizar productos RECOMENDADOS (los más caros) en carrusel
async function renderRecomendados() {
  const container = document.getElementById('recomendadosCarousel');
  if (!container) return;

    const products = await loadProducts();
    if (products.length === 0) return;

    // Ordenar por precio (mayor a menor) y tomar los top 8
    const sortedProducts = [...products].sort((a, b) => {
      const priceA = parseInt(a.price.replace(/[^0-9]/g, ''));
      const priceB = parseInt(b.price.replace(/[^0-9]/g, ''));
      return priceB - priceA;
    });

  const topProducts = sortedProducts.slice(0, 8);
  container.innerHTML = topProducts.map(product => createProductCard(product)).join('');

  // Re-inicializar modal después de cargar recomendados
  setTimeout(() => {
    if (window.MXZONE && window.MXZONE.InitProductModal) {
      window.MXZONE.InitProductModal();
    }
  }, 100);
}

// Función para crear un separador de categoría
function createCategoryDivider(category, icon) {
  const labels = {
    'botas': { label: 'Botas', icon: '' },
    'cascos': { label: 'Cascos', icon: '' },
    'uniformes': { label: 'Uniformes', icon: '' },
    'jersey': { label: 'Jerseys', icon: '' },
    'pantalones': { label: 'Pantalones', icon: '' },
    'guantes': { label: 'Guantes', icon: '' },
    'gorras': { label: 'Gorras', icon: '' },
    'protecciones': { label: 'Protecciones', icon: '' },
    'accesorios': { label: 'Accesorios', icon: '' },
    'maletas': { label: 'Maletas', icon: '' },
    'gafas': { label: 'Gafas', icon: '' },
    'infantil': { label: 'Niños / Infantil', icon: '' },
    'uniformes-ninos': { label: 'Uniformes Niños', icon: '' },
    'cascos-ninos': { label: 'Cascos Niños', icon: '' },
    'botas-ninos': { label: 'Botas Niños', icon: '' },
    'guantes-ninos': { label: 'Guantes Niños', icon: '' },
    'gafas-ninos': { label: 'Gafas Niños', icon: '' },
    'protecciones-ninos': { label: 'Protecciones Niños', icon: '' }
  };
  const catData = labels[category] || { label: category, icon: '' };

  return `
    <div class="category-divider" data-category="${category}">
      <div class="category-divider-line"></div>
      <div class="category-divider-content">
        <span class="category-divider-icon">${catData.icon}</span>
        <h3 class="category-divider-title">${catData.label}</h3>
      </div>
      <div class="category-divider-line"></div>
    </div>
  `;
}

// Función para renderizar productos en la tienda con separadores por categoría
async function renderShopProducts() {
  mxLog('renderShopProducts: iniciando...');

  const container = document.getElementById('productsGrid');
  mxLog('renderShopProducts: container productsGrid:', container);

  // Mostrar loading state
  if (container) {
    container.innerHTML = `
      <div class="loading-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; gap: 1.5rem;">
        <div class="loading-spinner" style="width: 50px; height: 50px; border: 3px solid rgba(255, 102, 0, 0.2); border-top-color: var(--orange-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="color: var(--gray-text); font-size: 1rem;">Cargando productos...</p>
      </div>
    `;
  }

  const products = await loadProducts();
  mxLog('renderShopProducts:', products.length, 'productos cargados');

  if (container && products.length > 0) {
    // Ordenar productos por categoría para agruparlos
    const categoryOrder = ['botas', 'cascos', 'uniformes', 'jersey', 'guantes', 'gorras', 'protecciones', 'accesorios', 'maletas', 'gafas', 'uniformes-ninos', 'cascos-ninos', 'botas-ninos', 'guantes-ninos', 'gafas-ninos', 'protecciones-ninos'];
    const sortedProducts = [...products].sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.category);
      const indexB = categoryOrder.indexOf(b.category);
      return (indexA !== -1 ? indexA : 999) - (indexB !== -1 ? indexB : 999);
    });

    // FIX #017: no renderizar separadores de categorías vacías.
    // Agrupar productos por categoría y omitir grupos sin productos visibles.
    const productsByCategory = {};
    sortedProducts.forEach(product => {
      const cat = product.category || 'sin-categoria';
      if (!productsByCategory[cat]) {
        productsByCategory[cat] = [];
      }
      productsByCategory[cat].push(product);
    });

    let html = '';
    Object.keys(productsByCategory).forEach(category => {
      const group = productsByCategory[category];
      // Renderizar solo categorías con al menos un producto visible
      const visibleCards = group.map(createProductCard).filter(card => card !== '');
      if (visibleCards.length > 0) {
        html += createCategoryDivider(category);
        html += visibleCards.join('');
      }
    });

    container.innerHTML = html;
    mxLog('renderShopProducts: productos renderizados en el grid con separadores');

    // Re-inicializar filtros y modal después de cargar productos
    setTimeout(() => {
      if (window.MXZONE && window.MXZONE.InitShopFilters) {
        window.MXZONE.InitShopFilters();
      }
      if (window.MXZONE && window.MXZONE.InitProductModal) {
        window.MXZONE.InitProductModal();
      }
      if (window.MXZONE && window.MXZONE.InitPriceSlider) {
        window.MXZONE.InitPriceSlider();
      }
      // Initialize mobile filter chips and quick filter chips
      if (window.initMobileFilterChips) {
        window.initMobileFilterChips();
      }
      // Re-initialize quick filter chips after filters are set up
      if (window.initQuickFilterChips) {
        window.initQuickFilterChips();
      }
      updateResultsCount();
    }, 100);
  } else if (container && products.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; gap: 1rem;">
        <span style="font-size: 4rem;">📦</span>
        <h3 style="color: var(--white);">No hay productos disponibles</h3>
        <p style="color: var(--gray-text);">Intenta recargar la página o contacta con soporte</p>
      </div>
    `;
  }
}

// Actualizar contador de resultados
//
// 🔴 FIX 2026-09-07 — entrando por un link con categoria (shop?cat=jersey, que
// es como se llega desde el menu del inicio) el encabezado decia "0 productos
// encontrados" con 34 jerseys listados abajo. Tocando la categoria con el mouse
// el numero salia bien, asi que el bug SOLO se veia por el camino por el que
// entra la gente desde afuera.
//
// Son dos archivos escribiendo el mismo numero. filterProducts() de main.js lo
// deja bien, y 100ms despues renderShopProducts llama a esta funcion, que lo
// pisa. El pisoton daba 0 por como contaba:
//
//   '.product-card[style="display: block"]'
//
// Eso compara el ATRIBUTO style como texto exacto. Cuando el JS hace
// `card.style.display = 'block'`, el navegador escribe `style="display: block;"`
// —con punto y coma— y la comparacion exacta no matchea NINGUNA. La segunda
// mitad del selector, `:not([style*="display"])`, tampoco: a esa altura todas
// las cards tienen display puesto. Cero de 288.
//
// Ahora se mide la realidad —que la card no este oculta— en vez de adivinarla
// desde la forma del atributo. Da lo mismo que filterProducts, asi que los dos
// escritores coinciden y ya no importa cual va ultimo.
function updateResultsCount() {
  const resultsCount = document.getElementById('resultsCount');
  if (!resultsCount) return;

  const visibleCards = Array.from(document.querySelectorAll('.product-card'))
    .filter(card => card.style.display !== 'none')
    .length;

  resultsCount.textContent = visibleCards;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const isHomePage = document.querySelector('[data-products]');
  const isShopPage = document.getElementById('productsGrid');
  const isRecomendadosPage = document.getElementById('recomendadosCarousel');

  if (isHomePage) {
    renderFeaturedProducts();
    renderCategoryCards();
  }

  if (isRecomendadosPage) {
    renderRecomendados();
  }

  if (isShopPage) {
    renderShopProducts();
  }
});

// Función global para agregar producto al carrito desde la tarjeta
function addProductToCart(slug) {
  const card = document.querySelector(`.product-card[data-slug="${slug}"]`);
  if (!card) {
    mxLog('Producto no encontrado:', slug);
    return;
  }

  // BLOQUEO: producto agotado
  if (card.classList.contains('product-agotado')) {
    showAgotadoAlert(card.querySelector('.product-name')?.textContent || 'Este producto');
    return;
  }

  const sizeSelect = card.querySelector('.card-size-select');
  const rawSizes = card.dataset.sizes || '';
  const selectedSize = sizeSelect ? sizeSelect.value : 'Unica';

  // FIX #007: solo exigir talla si el producto realmente tiene tallas configuradas
  if (shouldRequireSize(rawSizes) && (!selectedSize || selectedSize === '')) {
    showNotification('Selecciona una talla primero', 'error');
    if (sizeSelect) {
      sizeSelect.style.border = '2px solid var(--red-accent)';
      setTimeout(() => { sizeSelect.style.border = ''; }, 1500);
    }
    return;
  }

  // BLOQUEO POR TALLA — 2026-09-08.
  //
  // El `<option>` de una talla agotada ya sale `disabled`, asi que por el camino
  // normal ni se puede elegir. Este chequeo es la segunda puerta, y existe
  // porque la primera es solo visual: un `disabled` se saca desde la consola en
  // dos segundos, y ademas el stock pudo llegar a cero DESPUES de que esta
  // pagina se cargara. Vender algo que no esta cuesta una devolucion y un
  // cliente; el chequeo cuesta cuatro lineas.
  let stockPorTalla = null;
  try {
    stockPorTalla = JSON.parse(card.dataset.stockTallas || 'null');
  } catch (e) {
    stockPorTalla = null;  // dato roto: se comporta como antes, no bloquea
  }

  if (stockPorTalla && !hayStockDeTalla(stockPorTalla, selectedSize)) {
    showNotification(`No queda talla ${selectedSize} de este producto`, 'error');
    if (sizeSelect) {
      sizeSelect.style.border = '2px solid var(--red-accent)';
      setTimeout(() => { sizeSelect.style.border = ''; }, 1500);
    }
    return;
  }

  // Obtener datos del producto
  const name = card.querySelector('.product-name').textContent;
  const price = card.querySelector('.product-price').textContent;
  const category = card.dataset.category;
  const image = card.dataset.image;
  const sizes = card.dataset.sizes || selectedSize;
  
  // Parsear images array del data-attribute
  let images = [];
  try {
    if (card.dataset.images) {
      images = JSON.parse(card.dataset.images);
    }
  } catch (e) {
    images = image ? [image] : [];
  }

  // Recuperar id y stock desde los data-attributes de la tarjeta.
  // El id es necesario para el tracking de conversion; el stock para no
  // bloquear falsamente el add-to-cart (null/undefined != agotado).
  const rawId = card.getAttribute('data-4u-product-id');
  const id = rawId ? Number(rawId) : null;
  const rawStock = card.getAttribute('data-stock');
  const _4ulabStock = (rawStock !== null && rawStock !== '') ? Number(rawStock) : null;

  const product = { id, name, price, category, image, images, sizes, _4ulabStock };

  mxLog('Agregando al carrito:', product, 'Talla:', selectedSize);

  // Agregar al carrito - usar directamente la funcion global
  if (typeof window.MXZONECart !== 'undefined' && typeof window.MXZONECart.addToCart === 'function') {
    window.MXZONECart.addToCart(product, selectedSize);
  } else {
    // Fallback: intentar con la funcion directa
    try {
      addToCart(product, selectedSize);
    } catch (e) {
      mxLog('Error al agregar al carrito:', e);
      if (typeof showNotification === 'function') {
        showNotification('Error al agregar el producto. Intenta de nuevo.', 'error');
      }
    }
  }
}

// Exportar funciones para uso externo
window.MXZONE_Products = {
  loadProducts,
  renderShopProducts,
  renderFeaturedProducts
};

