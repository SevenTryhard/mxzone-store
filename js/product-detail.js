/**
 * MXZONE STORE - Product Detail Page
 * Carga dinámicamente los detalles del producto desde el CMS
 */

// Usar window.WHATSAPP_NUMBER para evitar redeclaración entre scripts
window.WHATSAPP_NUMBER = window.WHATSAPP_NUMBER || '573186467646';

// Obtener descripción por categoría
function getCategoryDescription(category, productName) {
  const descriptions = {
    cascos: `El ${productName} es un casco de alto rendimiento diseñado para pilotos exigentes.
             Con certificación DOT y ECE, ofrece máxima protección sin comprometer la comodidad.
             Sistema de ventilación optimizado para mantener la frescura en las carreras más intensas.`,
    uniformes: `Este conjunto completo incluye jersey y pantalón diseñados para competición.
                Tejidos transpirables, costuras reforzadas y ajuste ergonómico para máximo rendimiento.
                Los materiales de alta calidad garantizan durabilidad en las condiciones más extremas.`,
    botas: `Botas de motocross de alto rendimiento con sistema de protección avanzado.
            Suela antideslizante, cierre de hebillas reforzadas y soporte de tobillo para máxima estabilidad.
            Diseñadas para ofrecer control preciso y protección en cualquier terreno.`,
    protecciones: `Equipo de protección certificado para máxima seguridad en pista y trail.
                   Materiales impact-absorbentes y diseño ergonómico que se adapta a tu cuerpo.
                   Protección sin comprometer la movilidad ni la comodidad.`
  };
  return descriptions[category] || descriptions.cascos;
}

// Obtener características por categoría
function getCategoryFeatures(category) {
  const features = {
    cascos: [
      'Calota de policarbonato/fibra de alta resistencia',
      'Sistema de ventilación avanzado con múltiples entradas',
      'Forro interior desmontable y lavable',
      'Sistema de retención de doble anillo en D',
      'Visera ajustable con tornillos de desplazamiento',
      'Certificación DOT y ECE 22.05',
      'Peso ligero para menor fatiga'
    ],
    uniformes: [
      'Tejidos transpirables de secado rápido',
      'Costuras reforzadas para mayor durabilidad',
      'Ajuste ergonómico pre-curvado',
      'Refuerzos en zonas de alto impacto',
      'Diseño moderno con gráficos exclusivos',
      'Compatible con protecciones'
    ],
    botas: [
      'Sistema de cierre de hebillas de aluminio',
      'Suela antideslizante compuesta',
      'Protección de tobillo reforzada',
      'Plantilla extraíble',
      'Panel lateral ajustable',
      'Resistente al agua y barro'
    ],
    protecciones: [
      'Materiales certificados de alto impacto',
      'Diseño ergonómico que se adapta al cuerpo',
      'Correas ajustables para ajuste personalizado',
      'Ventilación optimizada',
      'Ligero y cómodo para uso prolongado',
      'Fácil instalación y remoción'
    ]
  };
  return features[category] || features.cascos;
}

// Versión de imágenes - actualizar cuando se cambien las fotos
const IMAGE_VERSION = 'v4-20260418';

// Verificar si es URL de CloudCannon
function isCloudCannonUrl(url) {
  return url && url.includes('cloudvent.net');
}

// Obtener imagen principal del producto (primera del array images o image singular)
function getProductImage(product) {
  let imageSrc = '';

  // Primero intentar con images (array)
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    imageSrc = product.images[0];
  }
  // Fallback a image (singular) - formato legacy
  else if (product.image) {
    imageSrc = product.image;
  }

  // Si es CloudCannon, corregir formato y no agregar cache buster
  if (isCloudCannonUrl(imageSrc)) {
    return imageSrc.replace(/^\/https:/, 'https:');
  }
  // Quitar slash inicial si existe
  const cleanPath = imageSrc.replace(/^\//, '');
  return encodeImagePath(cleanPath) + '?' + IMAGE_VERSION;
}

// Obtener todas las imágenes del producto (soporta array images o image singular)
function getProductImages(product) {
  // Si tiene array images
  if (product.images && Array.isArray(product.images)) {
    return product.images.filter(img => img && img.trim() !== '');
  }
  // Fallback a image (singular) - formato legacy
  if (product.image) {
    return [product.image];
  }
  return [];
}

// Crear HTML del producto
function createProductHTML(product) {
  const brand = getBrand(product.name);
  const whatsappMessage = encodeURIComponent(`Estoy interesado en ${product.name}`);
  const whatsappUrl = `https://wa.me/${window.WHATSAPP_NUMBER}?text=${whatsappMessage}`;
  const description = product.description || getCategoryDescription(product.category, product.name);
  const features = getCategoryFeatures(product.category);
  const requiresSize = shouldRequireSize(product.sizes);
  const sizes = product.sizes ? product.sizes.split('/').map(s => s.trim()).filter(s => s !== '') : ['Única'];

  const imageSrc = getProductImage(product);
  const badgeHTML = product.badge ?
    `<span class="product-detail-badge">${product.badge}</span>` : '';

  const agotadoHTML = product.agotado === true ?
    `<span class="product-badge-agotado">AGOTADO</span>` : '';

  const stockHTML = (product.stock_quantity !== undefined && product.stock_quantity <= 0) ?
    '<div class="product-stock-status" style="color:#dc2626;font-weight:600;margin-top:8px;">Sin stock disponible</div>' :
    (product.stock_quantity !== undefined && product.stock_quantity <= (product.stock_min || 5)) ?
    '<div class="product-stock-status" style="color:#f59e0b;font-weight:600;margin-top:8px;">Pocas unidades: ' + product.stock_quantity + '</div>' :
    '';

  const skuHTML = product.sku ?
    `<div class="product-sku">SKU: ${escapeHtml(product.sku)}</div>` : '';
  const colorHTML = product.color ?
    `<div class="product-color">Color: ${escapeHtml(product.color)}</div>` : '';

  // Obtener todas las imágenes
  const allImages = getProductImages(product);
  const imageVersion = Date.now();

  // Procesar URLs
  const processImageUrl = (img) => {
    if (isCloudCannonUrl(img)) {
      return img.replace(/^\/https:/, 'https:');
    }
    return encodeImagePath(img.replace(/^\//, '')) + '?' + imageVersion;
  };

  const processedImages = allImages.map(processImageUrl);
  const mainImage = processedImages.length > 0 ? processedImages[0] : imageSrc;

  // Crear thumbnails
  const thumbnails = processedImages.map((img, idx) => `
    <div class="thumbnail${idx === 0 ? ' active' : ''}">
      <img src="${img}" alt="${product.name}" onerror="this.style.display='none';">
    </div>
  `).join('');

  const whatsappBtn = product.agotado === true ?
    `<button class="btn btn-whatsapp btn-large" disabled style="opacity:0.5;cursor:not-allowed;">
      <img src="../assets/whatsapp-logo.webp" alt="WhatsApp" class="btn-whatsapp-icon"> Producto Agotado
    </button>` :
    `<a href="${whatsappUrl}" class="btn btn-whatsapp btn-large" target="_blank">
      <img src="../assets/whatsapp-logo.webp" alt="WhatsApp" class="btn-whatsapp-icon"> Comprar por WhatsApp
    </a>`;

  return `
    <div class="product-detail-grid">
      <!-- Galería de Imágenes -->
      <div class="product-detail-gallery">
        <div class="main-image-container">
          <img src="${mainImage}" alt="${product.name}" class="product-main-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="product-image-placeholder-large" style="display:none;">MX</div>
          ${badgeHTML}
        </div>

        <!-- Miniaturas para múltiples imágenes -->
        ${processedImages.length > 1 ? `
        <div class="thumbnail-container">
          ${thumbnails}
        </div>
        ` : ''}
      </div>

      <!-- Información del Producto -->
      <div class="product-detail-content">
        <!-- Brand Badge -->
        <div class="product-brand-badge">
          <span class="brand-icon">${brand.icon}</span>
          <span class="brand-name">${brand.name}</span>
        </div>

        <!-- Categoría -->
        <span class="product-detail-category">${getCategoryLabel(product.category)}</span>

        <!-- Nombre -->
        <h1 class="product-detail-title">${product.name}</h1>

        ${skuHTML}
        ${colorHTML}

        <!-- Precio -->
        <div class="product-detail-price">${product.price}</div>

        ${stockHTML}

        ${agotadoHTML}

        <!-- Tallas -->
        <div class="product-sizes-section">
          <div class="product-size-wrapper">
            <select class="product-size-select" id="productSizeSelect" aria-label="Seleccionar talla" ${requiresSize ? '' : 'disabled'}>
              ${requiresSize
                ? `<option value="" disabled selected>TALLA</option>` + sizes.map(size => `<option value="${size.trim()}">${size.trim()}</option>`).join('')
                : `<option value="Única" selected>ÚNICA</option>`}
            </select>
          </div>
          ${requiresSize ? `
          <p class="size-guide-link">
            Dudas con tu talla? <a href="sizes.html" target="_blank">Ver guia de tallas</a>
          </p>` : ''}
        </div>

        <!-- Descripción -->
        <div class="product-description-section">
          <h4 class="description-title">Descripción</h4>
          <p class="description-text">${description}</p>
        </div>

        <!-- Reviews 4ULAB -->
        <div id="ulab-reviews-target"></div>
        <script>
          window.ULAB_PROJECT_ID = 1;
          window.ULAB_PRODUCT_ID = ${product._4ulabId || 'null'};
        </script>
        <script src="https://4-ulab.vercel.app/review-snippet.js"></script>

        <!-- Características -->
        <div class="product-features-section">
          <h4 class="features-title">Características</h4>
          <ul class="features-list">
            ${features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>

        <!-- Acciones -->
        <div class="product-actions-section">
          ${whatsappBtn}
          <a href="shop.html" class="btn btn-secondary btn-large">
            <span>🛒</span> Volver a la Tienda
          </a>
        </div>

        <!-- Badges de Confianza -->
        <div class="trust-badges">
          <div class="trust-badge">
            <span class="trust-icon">🚚</span>
            <span class="trust-text">Envíos a todo Colombia</span>
          </div>
          <div class="trust-badge">
            <span class="trust-icon">✓</span>
            <span class="trust-text">Producto 100% Original</span>
          </div>
          <div class="trust-badge">
            <span class="trust-icon">🛡️</span>
            <span class="trust-text">Garantía Oficial</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Obtener label de categoría
function getCategoryLabel(category) {
  const labels = {
    'cascos': 'Cascos',
    'uniformes': 'Uniformes',
    'botas': 'Botas',
    'protecciones': 'Protecciones',
    'accesorios': 'Accesorios',
    'jersey': 'Jerseys',
    'gafas': 'Gafas',
    'gorras': 'Gorras',
    'guantes': 'Guantes',
    'maletas': 'Maletas'
  };
  return labels[category] || category;
}

/**
 * UNA SOLA FUENTE DE VERDAD.
 *
 * La ficha lee EXACTAMENTE la misma lista que pintan las cards de la tienda:
 * `window.MXZONE_Products.loadProducts()` (js/products.js), ya pasada por
 * `adaptProductFrom4ULAB`. Misma API, mismo adaptador, misma normalizacion.
 *
 * POR QUE ESTO IMPORTA (el bug historico):
 * antes esta ficha pegaba a `${cmsApiUrl}/api/store/products`, un endpoint que
 * NO EXISTE en 4ULAB — los publicos son `/api/public/*`. O sea que la llamada
 * fallaba SIEMPRE y caia al fallback: 326 JSON estaticos en `cms/productos/`
 * que nadie regeneraba. Por eso al editar un producto la card se actualizaba
 * al instante y la ficha seguia mostrando lo viejo. La divergencia estaba
 * garantizada por construccion; no era un bug intermitente.
 *
 * OJO CON LA PAGINACION: la API devuelve de a 200 y el catalogo ronda los 282
 * productos. `loadProducts()` ya recorre las paginas. Un `fetch` suelto se
 * comeria ~82 productos y esas fichas dirian "no encontrado" sin explicacion.
 *
 * Se memoiza: la ficha necesita el catalogo dos veces (el producto y los
 * relacionados) y no tiene sentido traerlo dos veces por pagina.
 */
let _catalogPromise = null;

async function getCatalog() {
  if (_catalogPromise) return _catalogPromise;

  _catalogPromise = (async () => {
    // products.js se carga antes que este archivo, pero si alguien reordena
    // los <script> preferimos esperar a que aparezca antes que romper.
    for (let i = 0; i < 20; i++) {
      if (window.MXZONE_Products && typeof window.MXZONE_Products.loadProducts === 'function') {
        return await window.MXZONE_Products.loadProducts();
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    mxLog('[CRITICAL] getCatalog: js/products.js nunca cargo. La ficha no puede hidratarse.');
    return [];
  })();

  return _catalogPromise;
}

async function loadProduct(productSlug) {
  const products = await getCatalog();
  if (!products || products.length === 0) {
    mxLog('[CRITICAL] loadProduct: catalogo vacio para', productSlug);
    return null;
  }
  const found = products.find((p) => createProductSlug(p.name) === productSlug);
  if (!found) mxLog('loadProduct: no hay producto con slug', productSlug);
  return found || null;
}

// Cargar productos relacionados desde CMS API
async function loadRelatedProducts(currentProduct, currentSlug) {
  try {
    // Mismo catalogo memoizado que usa loadProduct: una sola traida por pagina.
    const products = await getCatalog();
    if (!products || products.length === 0) return [];
    const categoryProducts = products.filter(p => p.category === currentProduct.category && createProductSlug(p.name) !== currentSlug).slice(0, 4);
    return categoryProducts;
  } catch (e) {
    mxLog('Error cargando relacionados:', e);
    return [];
  }
}

// Crear tarjeta de producto relacionado
function createRelatedProductCard(product) {
  const whatsappMessage = encodeURIComponent(`Estoy interesado en ${product.name}`);
  const whatsappUrl = `https://wa.me/${window.WHATSAPP_NUMBER}?text=${whatsappMessage}`;
  const brand = getBrand(product.name);

  const imageSrc = getProductImage(product);

  const badgeHTML = product.badge ?
    `<span class="product-badge">${product.badge}</span>` : '';

  return `
    <div class="product-card" data-category="${product.category}" data-brand="${brand.name.toLowerCase()}">
      <div class="product-image">
        <img src="${imageSrc}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <span class="product-image-placeholder" style="display:none;">MX</span>
        ${badgeHTML}
      </div>
      <div class="product-info">
        <span class="product-category">${getCategoryLabel(product.category)}</span>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-meta">
          <span class="product-size">Talla: <span>${product.sizes}</span></span>
          <span class="product-price">${product.price}</span>
        </div>
        <div class="product-actions">
          <a href="${whatsappUrl}" class="btn btn-whatsapp" target="_blank">Comprar</a>
        </div>
      </div>
    </div>
  `;
}

/**
 * El texto que se muestra debajo del titulo cuando el link se comparte.
 *
 * ESPEJO EXACTO de shareDescription() en worker/index.js. El worker lo escribe
 * en el HTML crudo para los crawlers (que no ejecutan JS) y esta funcion lo
 * escribe para Googlebot, que si renderiza. Si los dos textos no coinciden, el
 * mismo producto se describe distinto segun quien lo lea. SI TOCAS UNO,
 * TOCA EL OTRO.
 *
 * Arranca con el PRECIO a proposito: es el dato que decide si alguien abre el
 * link o lo pasa de largo.
 */
function shareDescription(product) {
  const head = product.agotado === true
    ? 'AGOTADO'
    : (product.price || 'Consultar precio');
  return head + ' — ' + getCategoryLabel(product.category) +
    ' para motocross y enduro en Colombia. Envío a todo el país desde Cali. MXZONE STORE.';
}

/** Crea o actualiza un <meta> del head sin depender de que exista en el HTML. */
function setMeta(attr, key, value) {
  if (!value) return;
  let el = document.head.querySelector('meta[' + attr + '="' + key + '"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

/**
 * Reemplaza el JSON-LD generico del head por uno con los datos REALES del
 * producto. Es lo que le permite a Google mostrar precio y disponibilidad en
 * el resultado de busqueda.
 *
 * ESTO SOLO SIRVE PARA QUIEN EJECUTA JS (Googlebot si; WhatsApp, Facebook y
 * Twitter NO). El preview social se resuelve del lado del SERVIDOR en
 * `worker/index.js`, que reescribe el head con HTMLRewriter antes de que el
 * HTML salga. Los dos caminos tienen que decir lo mismo: ver shareDescription()
 * aca arriba y su espejo en el worker.
 */
function mountProductSchema(product, canonicalUrl, imageUrl) {
  try {
    const priceRaw = product._4ulabPriceRaw != null
      ? String(product._4ulabPriceRaw).replace(/[^0-9.]/g, '')
      : String(product.price || '').replace(/[^0-9]/g, '');

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: imageUrl ? [imageUrl] : undefined,
      description: product.description || getCategoryDescription(product.category, product.name),
      category: getCategoryLabel(product.category),
      brand: { '@type': 'Brand', name: product.brand || getBrand(product.name).name || 'MXZONE' },
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'COP',
        price: priceRaw || undefined,
        availability: product.agotado === true
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'MXZONE STORE' }
      }
    };

    document.querySelectorAll('script[data-mx-product-schema]').forEach((n) => n.remove());
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.setAttribute('data-mx-product-schema', '');
    tag.textContent = JSON.stringify(schema);
    document.head.appendChild(tag);
  } catch (e) {
    mxLog('mountProductSchema:', e.message);
  }
}

// Renderizar producto principal
async function renderProduct(productSlug) {
  const layout = document.getElementById('productDetailLayout');

  if (!productSlug) {
    layout.innerHTML = `
      <div class="product-error">
        <h2>Producto no encontrado</h2>
        <p>El producto que buscas no está disponible.</p>
        <a href="shop.html" class="btn btn-primary btn-large">Ver Tienda</a>
      </div>
    `;
    return;
  }

  const product = await loadProduct(productSlug);

  if (!product) {
    layout.innerHTML = `
      <div class="product-error">
        <h2>Producto no encontrado</h2>
        <p>El producto "${productSlug}" no está disponible actualmente.</p>
        <a href="shop.html" class="btn btn-primary btn-large">Ver Tienda</a>
      </div>
    `;
    return;
  }

  // Actualizar SEO dinámico
  document.title = product.name + ' - ' + getCategoryLabel(product.category) + ' | Motocross Colombia | MXZONE STORE';

  const sharedDesc = shareDescription(product);

  const dynamicDesc = document.getElementById('dynamic-desc');
  if (dynamicDesc) {
    dynamicDesc.setAttribute('content', sharedDesc);
  }

  // Canonical SIN .html: Workers Assets sirve la extensionless y /product.html
  // responde 307 hacia /product. Apuntar al .html mandaba a Google por un
  // redirect innecesario en cada ficha.
  const canonicalUrl = 'https://www.mxzonestore.com/product?product=' + encodeURIComponent(productSlug);

  const dynamicCanonical = document.getElementById('dynamic-canonical');
  if (dynamicCanonical) {
    dynamicCanonical.setAttribute('href', canonicalUrl);
  }

  // og:image es lo que decide si el link se ve como una tarjeta con foto o
  // como texto pelado cuando alguien lo pega. Ver la nota de mountProductSchema
  // sobre el limite real de esto.
  const shareImage = getProductImage(product);
  const absoluteImage = /^https?:/.test(shareImage)
    ? shareImage
    : 'https://www.mxzonestore.com/' + String(shareImage).replace(/^\//, '');

  setMeta('property', 'og:url', canonicalUrl);
  setMeta('property', 'og:type', 'product');
  setMeta('property', 'og:image', absoluteImage);
  setMeta('name', 'twitter:url', canonicalUrl);
  setMeta('name', 'twitter:image', absoluteImage);
  setMeta('name', 'twitter:title', product.name);

  mountProductSchema(product, canonicalUrl, absoluteImage);

  const dynamicOgTitle = document.getElementById('dynamic-og-title');
  if (dynamicOgTitle) {
    dynamicOgTitle.setAttribute('content', product.name);
  }

  const dynamicOgDesc = document.getElementById('dynamic-og-desc');
  if (dynamicOgDesc) {
    dynamicOgDesc.setAttribute('content', sharedDesc);
  }

  // INTERES REAL: llegar a la ficha es una decision explicita. Mismo evento
  // que dispara el quickview, asi las dos superficies suman al mismo contador.
  try {
    if (product.id && typeof window.fourUTrack === 'function') {
      window.fourUTrack('detailView', product.id);
    }
  } catch (e) {
    mxLog('detailView:', e.message);
  }

  // Renderizar producto
  layout.innerHTML = createProductHTML(product);

  // Montar widget de resenas de 4ULAB (usa el id numerico de producto en 4ULAB)
  mountUlabReviews(product);

  // Inicializar selector de tallas
  initSizeSelector();

  // Cargar productos relacionados
  loadRelatedProductsForLayout(product, productSlug);
}

// Monta el widget de resenas 4ULAB de forma 100% defensiva.
// La pagina recarga por completo al cambiar de producto (?product=slug),
// asi que el snippet corre una sola vez leyendo las window.* vars.
function mountUlabReviews(product) {
  try {
    if (!product || !product.id) return;
    window.ULAB_PROJECT_ID = 1;
    window.ULAB_PRODUCT_ID = product.id;
    window.ULAB_ACCENT = '#FF6B00';
    if (document.getElementById('ulab-reviews-script')) return;
    var s = document.createElement('script');
    s.id = 'ulab-reviews-script';
    s.src = 'https://4-ulab.vercel.app/review-snippet.js?t=202607011200';
    s.async = true;
    document.body.appendChild(s);
  } catch (e) {
    if (typeof mxLog === 'function') mxLog('mountUlabReviews error:', e && e.message);
  }
}

// Cargar productos relacionados para el layout
async function loadRelatedProductsForLayout(currentProduct, currentSlug) {
  const relatedProducts = await loadRelatedProducts(currentProduct, currentSlug);
  const container = document.getElementById('relatedProducts');

  if (container && relatedProducts.length > 0) {
    container.innerHTML = relatedProducts.map(createRelatedProductCard).join('');

    // Re-inicializar modal para productos relacionados
    setTimeout(() => {
      if (window.MXZONE && window.MXZONE.InitProductModal) {
        window.MXZONE.InitProductModal();
      }
    }, 100);
  } else if (container) {
    container.innerHTML = '<p style="text-align: center; color: var(--gray-text);">No hay productos relacionados disponibles.</p>';
  }
}

// Inicializar selector de tallas
function initSizeSelector() {
  const sizeSelect = document.getElementById('productSizeSelect');
  if (!sizeSelect) return;

  sizeSelect.addEventListener('change', () => {
    const selectedSize = sizeSelect.value;
    if (selectedSize) {
      // Highlight opcion seleccionada con borde naranja
      sizeSelect.style.borderColor = 'var(--orange-primary)';
    } else {
      sizeSelect.style.borderColor = '';
    }
  });
}

// Obtener slug del URL
function getProductSlugFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('product');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const productSlug = getProductSlugFromURL();

  if (productSlug) {
    renderProduct(productSlug);
  } else {
    // Si no hay slug, mostrar error o redirigir
    document.getElementById('productDetailLayout').innerHTML = `
      <div class="product-error">
        <h2>Producto no especificado</h2>
        <p>Debes seleccionar un producto para ver sus detalles.</p>
        <a href="shop.html" class="btn btn-primary btn-large">Ver Tienda</a>
      </div>
    `;
  }
});

