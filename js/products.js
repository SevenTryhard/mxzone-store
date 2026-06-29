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
window.WHATSAPP_NUMBER = window.WHATSAPP_NUMBER || '573176692997';

function escapeHtml(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
    name: p.name || 'Producto sin nombre',
    category: category,
    brand: p.brand || ((p.attributes && p.attributes.marca) ? String(p.attributes.marca).trim() : ''),
    price: priceStr,
    sizes: sizes,
    badge: badge,
    image: image,
    images: p.images || (p.metaImageUrl ? [p.metaImageUrl] : []),
    // Usar stock real de 4ULAB: stock=0 o stock null => agotado
    agotado: !(p.stock && Number(p.stock) > 0),
    // Campos adicionales de 4ULAB que pueden ser útiles
    _4ulabId: p.id,
    _4ulabSlug: p.slug,
    _4ulabAttributes: p.attributes || {},
    _4ulabPriceRaw: p.price,
    _4ulabStock: p.stock
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
    const products = allProducts.map(adaptProductFrom4ULAB);

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
  const sizesArray = product.sizes ? product.sizes.split('/').map(s => s.trim()) : ['Única'];
  const sizeOptions = `<option value="" disabled selected>TALLA</option>` + sizesArray.map(size => `<option value="${size}">${size}</option>`).join('');

  return `
    <div class="product-card"
         data-4u-product-id="${product.id || ''}"
         data-category="${product.category || 'sin-categoria'}"
         data-brand="${brand}"
         data-price="${priceNum}"
         data-image="${mainImage}"
         data-images='${JSON.stringify(images).replace(/'/g, "&#39;")}'
         data-slug="${productSlug}"
         data-sizes="${product.sizes || 'Única'}">
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
          <a href="product.html?product=${productSlug}" class="btn btn-secondary" target="_blank" data-4u-track="click" data-4u-product-id="${product.id || ''}">
            Ver
          </a>
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

    // Renderizar productos con separadores
    let html = '';
    let lastCategory = null;

    sortedProducts.forEach(product => {
      try {
        // Agregar separador si cambia la categoría
        if (product.category !== lastCategory) {
          html += createCategoryDivider(product.category);
          lastCategory = product.category;
        }
        html += createProductCard(product);
      } catch (e) {
        mxLog('[RENDER] Producto malformado omitido:', product.name || 'sin-nombre', e.message);
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
function updateResultsCount() {
  const resultsCount = document.getElementById('resultsCount');
  const visibleCards = document.querySelectorAll('.product-card[style="display: block"], .product-card:not([style*="display"])').length;
  if (resultsCount) {
    resultsCount.textContent = visibleCards;
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const isHomePage = document.querySelector('[data-products]');
  const isShopPage = document.getElementById('productsGrid');
  const isRecomendadosPage = document.getElementById('recomendadosCarousel');

  if (isHomePage) {
    renderFeaturedProducts();
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
  const selectedSize = sizeSelect ? sizeSelect.value : 'Unica';

  if (!selectedSize || selectedSize === '') {
    showNotification('Selecciona una talla primero', 'error');
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

  const product = { name, price, category, image, images, sizes };

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

