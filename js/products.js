/**
 * MXZONE STORE - Dynamic Product Loader
 * Carga TODOS los productos desde los archivos JSON del CMS automáticamente
 */

// WHATSAPP_NUMBER se define en cart.js - usar la variable global

// Mapeo de marcas basado en nombres de producto
function getBrand(productName) {
  const name = productName.toLowerCase();
  if (name.includes('fox')) return 'fox';
  if (name.includes('fly')) return 'fly';
  if (name.includes('alpinestars') || name.includes('alpine')) return 'alpinestars';
  if (name.includes('leatt')) return 'leatt';
  if (name.includes('troy lee')) return 'troy-lee';
  if (name.includes('oneal')) return 'oneal';
  if (name.includes('airoh')) return 'airoh';
  if (name.includes('acerbis')) return 'acerbis';
  if (name.includes('gaerne')) return 'gaerne';
  if (name.includes('fxr')) return 'fxr';
  if (name.includes('thor')) return 'thor';
  if (name.includes('ktm')) return 'ktm';
  return 'other';
}

// Función para descubrir y cargar TODOS los productos del CMS
// NOTA: Para agregar nuevos productos, simplemente añade el archivo JSON en cms/productos/
// y agrega el nombre del archivo a la lista productFiles abajo.
async function loadProducts() {
  try {
    const cmsBaseUrl = 'cms/productos/';

    // Lista de todos los productos (113 productos)
    // Para agregar un producto nuevo: añade su archivo JSON a esta lista
    const productFiles = [
      // Botas
      'botas-alpinestars-tech-3.json',
      'botas-alpinestars-tech-3-enduro.json',
      'botas-alpinestars-tech-7.json',
      'botas-fly-maverick-lt-enduro.json',
      'botas-gaerne-sg12-enduro.json',
      'botas-gaerne-sg12-enduro-gravel.json',
      'botas-gaerne-sg12-realm.json',
      'botas-leatt-3-5.json',
      'botas-leatt-4-5.json',
      'botas-leatt-4-5-citrus.json',
      'botas-leatt-4-5-naranja.json',
      'botas-leatt-4-5-negro.json',
      'botas-pvc-impermeables-gris-dakar.json',

      // Cascos
      'casco-airoh-twist.json',
      'casco-airoh-twist-3-dynasty.json',
      'casco-airoh-twist-3-dynasty-rosso.json',
      'casco-airoh-wraap-feel.json',
      'casco-airoh-wraap-feel-azul-rojo.json',
      'casco-alpinestar-sm5-action-2.json',
      'casco-alpinestars-force-negro-morado.json',
      'casco-alpinestars-radium-negro-blanco.json',
      'casco-alpinestars-radium-negro-rojo.json',
      'casco-alpinestars-s-m5-bond.json',
      'casco-alpinestars-s-m5-rayon.json',
      'casco-alpinestars-s-m5-rover.json',
      'casco-alpinestars-s-m5-solid.json',
      'casco-fly-formula-cp.json',
      'casco-fly-kinetic-crest-mx.json',
      'casco-fly-kinetic-k-120.json',
      'casco-fly-kinetic-menace.json',
      'casco-fly-kinetic-verdict.json',
      'casco-fly-racing-formula.json',
      'casco-fly-racing-kinetic-blk-red.json',
      'casco-fly-v1-interfere-gris.json',
      'casco-fox-v1-bnkr.json',
      'casco-fox-v1-dpth-verde.json',
      'casco-fox-v1-dpth-verde-negro.json',
      'casco-fox-v1-emotion-naranja.json',
      'casco-fox-v1-flora-dark-indigo.json',
      'casco-fox-v1-karrera.json',
      'casco-fox-v1-kozmiK.json',
      'casco-fox-v1-leed.json',
      'casco-fox-v1-leed-fluo-red.json',
      'casco-fox-v1-nitro-camuflaje.json',
      'casco-fox-v1-race-spec-f74.json',
      'casco-fox-v1-solid-matte-black.json',
      'casco-fox-v1-toxsyk-negro.json',
      'casco-leatt-moto-2-5-v24.json',
      'casco-oneal-5-srs-attack.json',
      'casco-racing-formula.json',
      'casco-tipo-fox.json',
      'casco-troy-lee-se5-gasgas.json',
      'casco-v1-nukr-verde-negro.json',

      // Uniformes
      'uniforme-alpinestars-fluid-apex.json',
      'uniforme-alpinestars-fluid-grid.json',
      'uniforme-alpinestars-fluid-grid-red-black-purple.json',
      'uniforme-fly-evolution-dst.json',
      'uniforme-fly-f16.json',
      'uniforme-fly-f-16-black-white.json',
      'uniforme-fly-f-16-dark-blue-white.json',
      'uniforme-fly-kinetic.json',
      'uniforme-fly-kinetic-jet.json',
      'uniforme-fly-kinetic-jet-black-green.json',
      'uniforme-fly-kinetic-jet-blue-grey-white.json',
      'uniforme-fly-kinetic-kore.json',
      'uniforme-fly-kinetic-prix.json',
      'uniforme-fly-kinetic-stoke.json',
      'uniforme-fly-mesh.json',
      'uniforme-fox-180-flora.json',
      'uniforme-fox-180-goat-strafER.json',
      'uniforme-fox-180-leed-blue.json',
      'uniforme-fox-180-leed-dark-shadow.json',
      'uniforme-fox-180-stl-gry.json',
      'uniforme-fox-ballast.json',
      'uniforme-fox-ballast-180.json',
      'uniforme-fox-race-spec-pale-green.json',
      'uniforme-fxr-revo-comp.json',
      'uniforme-oneal-element-blk-red.json',
      'uniforme-oneal-element-v6-blk-gry.json',
      'uniforme-thor-tarmac.json',
      'uniforme-tipo-fox-1-1.json',
      'uniforme-troy-lee-gp-air-team-81.json',
      'pantalon-fox-180-czar.json',
      'pantalon-fox-180-fyce.json',

      // Protecciones
      'chaleco-columna.json',
      'coderas-leatt-contour.json',
      'coderas-leatt-countour-flint.json',
      'coderas-titan-race.json',
      'kit-rodillera-y-codera-valkiria.json',
      'pechera-acerbis-kids-gravity.json',
      'pechera-acerbis-po35-l1.json',
      'pechera-alpinestar-a-1-bionic-action.json',
      'pechera-alpinestar-a1-roost-guard.json',
      'pechera-alpinestars-a1-bionic.json',
      'pechera-fly-revel-race.json',
      'pechera-fox-r3.json',
      'pechera-fox-raceframe.json',
      'pechera-fox-raceframe-roost.json',
      'rinionera-acerbis-profile.json',
      'rinionera-fly-barricade.json',
      'rinionera-fox-titan-race.json',
      'rinionera-ktm-orange.json',
      'rinionera-oneal-adulto.json',
      'rodillera-leatt-3df-5-0-zip.json',
      'rodillera-leatt-3df-hybrid.json',
      'rodillera-leatt-3df-hybrid-ext.json',
      'rodillera-tipo-leatt-3df.json',
      'rodilleras-acerbis-soft.json',
      'rodilleras-fox-launch-d30.json',
      'rodilleras-leatt-3df-hybrid.json',
      'rodilleras-nucleon-plasma-alpinestar.json',
      'rodilleras-nucleon-plasma-alpinestars.json'
    ];

    const products = [];

    // Caché para evitar recargar productos en la misma sesión
    const cacheKey = 'mxzone_products_cache';
    const cachedData = sessionStorage.getItem(cacheKey);

    if (cachedData) {
      const { products: cachedProducts, timestamp } = JSON.parse(cachedData);
      // Usar caché por 5 minutos
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        console.log('Productos cargados desde caché:', cachedProducts.length);
        return cachedProducts;
      }
    }

    // Cargar todos los archivos en paralelo
    const promises = productFiles.map(async (file) => {
      try {
        const response = await fetch(cmsBaseUrl + file);
        if (response.ok) {
          const product = await response.json();
          return product;
        }
      } catch (e) {
        console.warn(`No se pudo cargar ${file}:`, e);
      }
      return null;
    });

    const results = await Promise.all(promises);
    const validProducts = results.filter(p => p !== null);

    // Guardar en caché
    sessionStorage.setItem(cacheKey, JSON.stringify({
      products: validProducts,
      timestamp: Date.now()
    }));

    console.log('Productos cargados:', validProducts.length);
    return validProducts;

  } catch (error) {
    console.error('Error cargando productos:', error);
    return [];
  }
}

// Función para crear el slug del producto (para la URL)
function createProductSlug(productName) {
  return productName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Función para crear el HTML de una tarjeta de producto
function createProductCard(product) {
  const whatsappMessage = encodeURIComponent(`Estoy interesado en ${product.name}`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;
  const brand = getBrand(product.name);
  const priceNum = parseInt(product.price.replace(/[^0-9]/g, ''));
  const productSlug = createProductSlug(product.name);

  // Soporte para múltiples imágenes o imagen única
  const images = product.images || (product.image ? [product.image] : []);
  const mainImage = images.length > 0 ? images[0] : product.image || '';
  const badgeHTML = product.badge ?
    `<span class="product-badge">${product.badge}</span>` : '';

  // Parsear tallas
  const sizesArray = product.sizes.split('/').map(s => s.trim());
  const sizeOptions = sizesArray.map(size => `<option value="${size}">${size}</option>`).join('');

  return `
    <div class="product-card"
         data-category="${product.category}"
         data-brand="${brand}"
         data-price="${priceNum}"
         data-image="${mainImage}"
         data-images='${JSON.stringify(images).replace(/'/g, "&#39;")}'
         data-slug="${productSlug}"
         data-sizes="${product.sizes}">
      <div class="product-image">
        <img src="${mainImage}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <span class="product-image-placeholder" style="display:none;">MX</span>
        ${badgeHTML}
      </div>
      <div class="product-info">
        <span class="product-category">${getCategoryLabel(product.category)}</span>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-price-wrapper">
          <span class="product-price">${product.price}</span>
        </div>
        <div class="product-sizes-selector">
          <select class="card-size-select" aria-label="Seleccionar talla">
            ${sizeOptions}
          </select>
        </div>
        <div class="product-actions">
          <a href="product.html?product=${productSlug}" class="btn btn-secondary" target="_blank">
            Ver
          </a>
          <button class="btn btn-cart-add" onclick="addProductToCart('${productSlug}')">
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
    'botas': 'Botas',
    'protecciones': 'Protecciones'
  };
  return labels[category] || category;
}

// Función para renderizar productos en la página principal
async function renderFeaturedProducts() {
  console.log('renderFeaturedProducts: iniciando...');
  const products = await loadProducts();
  console.log('renderFeaturedProducts:', products.length, 'productos cargados');

  const categories = ['cascos', 'uniformes', 'botas', 'protecciones'];

  categories.forEach(category => {
    const categoryProducts = products.filter(p => p.category === category).slice(0, 4);
    const container = document.querySelector(`[data-products="${category}"]`);
    console.log(`renderFeaturedProducts: ${category} tiene ${categoryProducts.length} productos, container:`, container);

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
    'botas': { label: 'Botas', icon: '👢' },
    'cascos': { label: 'Cascos', icon: '⛑️' },
    'uniformes': { label: 'Uniformes', icon: '👕' },
    'protecciones': { label: 'Protecciones', icon: '🛡️' }
  };
  const catData = labels[category] || { label: category, icon: icon || '📦' };

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
  console.log('renderShopProducts: iniciando...');

  const container = document.getElementById('productsGrid');
  console.log('renderShopProducts: container productsGrid:', container);

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
  console.log('renderShopProducts:', products.length, 'productos cargados');

  if (container && products.length > 0) {
    // Ordenar productos por categoría para agruparlos
    const categoryOrder = ['botas', 'cascos', 'uniformes', 'protecciones'];
    const sortedProducts = [...products].sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.category);
      const indexB = categoryOrder.indexOf(b.category);
      return (indexA !== -1 ? indexA : 999) - (indexB !== -1 ? indexB : 999);
    });

    // Renderizar productos con separadores
    let html = '';
    let lastCategory = null;

    sortedProducts.forEach(product => {
      // Agregar separador si cambia la categoría
      if (product.category !== lastCategory) {
        html += createCategoryDivider(product.category);
        lastCategory = product.category;
      }
      html += createProductCard(product);
    });

    container.innerHTML = html;
    console.log('renderShopProducts: productos renderizados en el grid con separadores');

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
      // Initialize mobile filter chips
      if (window.initMobileFilterChips) {
        window.initMobileFilterChips();
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
    console.warn('Producto no encontrado:', slug);
    return;
  }

  const sizeSelect = card.querySelector('.card-size-select');
  const selectedSize = sizeSelect ? sizeSelect.value : 'Única';

  // Obtener datos del producto
  const name = card.querySelector('.product-name').textContent;
  const price = card.querySelector('.product-price').textContent;
  const category = card.dataset.category;
  const image = card.dataset.image;
  const sizes = card.dataset.sizes || selectedSize;

  const product = { name, price, category, image, sizes };

  console.log('Agregando al carrito:', product, 'Talla:', selectedSize);

  // Agregar al carrito - usar directamente la función global
  if (typeof window.MXZONECart !== 'undefined' && typeof window.MXZONECart.addToCart === 'function') {
    window.MXZONECart.addToCart(product, selectedSize);
  } else {
    // Fallback: intentar con la función directa
    try {
      addToCart(product, selectedSize);
    } catch (e) {
      console.error('Error al agregar al carrito:', e);
      alert('Hubo un error al agregar el producto. Por favor recarga la página.');
    }
  }
}

// Exportar funciones para uso externo
window.MXZONE_Products = {
  loadProducts,
  renderShopProducts,
  renderFeaturedProducts
};
