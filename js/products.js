/**
 * MXZONE STORE - Dynamic Product Loader
 * Carga productos desde los archivos JSON del CMS
 */

const WHATSAPP_NUMBER = '573176692997';

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

// Función para cargar productos desde JSON
async function loadProducts() {
  try {
    const productFiles = [
      'cms/productos/casco-fly-formula-cp.json',
      'cms/productos/casco-fox-v1-toxsyk-negro.json',
      'cms/productos/casco-airoh-wraap-feel-azul-rojo.json',
      'cms/productos/uniforme-thor-tarmac.json',
      'cms/productos/uniforme-fly-kinetic-kore.json',
      'cms/productos/uniforme-fox-180-stl-gry.json',
      'cms/productos/botas-leatt-4-5-naranja.json',
      'cms/productos/botas-alpinestars-tech-3.json',
      'cms/productos/botas-fly-maverick-lt-enduro.json',
      'cms/productos/pechera-fox-raceframe-roost.json',
      'cms/productos/rodilleras-fox-launch-d30.json',
      'cms/productos/rinionera-fox-titan-race.json'
    ];

    const products = [];

    for (const file of productFiles) {
      try {
        const response = await fetch(file);
        if (response.ok) {
          const product = await response.json();
          products.push(product);
        }
      } catch (e) {
        console.warn(`No se pudo cargar ${file}:`, e);
      }
    }

    return products;
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

  const badgeHTML = product.badge ?
    `<span class="product-badge">${product.badge}</span>` : '';

  return `
    <div class="product-card"
         data-category="${product.category}"
         data-brand="${brand}"
         data-price="${priceNum}"
         data-image="${product.image}"
         data-slug="${productSlug}">
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
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
          <a href="product.html?product=${productSlug}" class="btn btn-secondary" target="_blank">
            Ver Detalles
          </a>
          <a href="${whatsappUrl}" class="btn btn-whatsapp" target="_blank">Comprar</a>
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
  const products = await loadProducts();

  const categories = ['cascos', 'uniformes', 'botas', 'protecciones'];

  categories.forEach(category => {
    const categoryProducts = products.filter(p => p.category === category).slice(0, 3);
    const container = document.querySelector(`[data-products="${category}"]`);

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

// Función para renderizar todos los productos en la tienda
async function renderShopProducts() {
  const products = await loadProducts();
  const container = document.getElementById('productsGrid');

  if (container && products.length > 0) {
    container.innerHTML = products.map(createProductCard).join('');

    // Re-inicializar filtros y modal después de cargar productos
    setTimeout(() => {
      if (window.MXZONE && window.MXZONE.InitShopFilters) {
        window.MXZONE.InitShopFilters();
      }
      if (window.MXZONE && window.MXZONE.InitProductModal) {
        window.MXZONE.InitProductModal();
      }
      updateResultsCount();
    }, 100);
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

  if (isHomePage) {
    renderFeaturedProducts();
  }

  if (isShopPage) {
    renderShopProducts();
  }
});

// Exportar funciones para uso externo
window.MXZONE_Products = {
  loadProducts,
  renderShopProducts,
  renderFeaturedProducts
};
