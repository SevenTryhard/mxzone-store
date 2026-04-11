/**
 * MXZONE STORE - Dynamic Product Loader
 * Carga productos desde los archivos JSON del CMS
 */

const WHATSAPP_NUMBER = '573176692997';

// Función para cargar productos desde JSON
async function loadProducts() {
  try {
    // Cargar todos los productos desde la carpeta cms/productos
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

// Función para crear el HTML de una tarjeta de producto
function createProductCard(product) {
  const whatsappMessage = encodeURIComponent(`Estoy interesado en ${product.name}`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  const badgeHTML = product.badge ?
    `<span class="product-badge">${product.badge}</span>` : '';

  return `
    <div class="product-card" data-category="${product.category}">
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

  // Renderizar productos destacados en home (primeros 3 de cada categoría)
  const categories = ['cascos', 'uniformes', 'botas', 'protecciones'];

  categories.forEach(category => {
    const categoryProducts = products.filter(p => p.category === category).slice(0, 3);
    const container = document.querySelector(`[data-products="${category}"]`);

    if (container && categoryProducts.length > 0) {
      container.innerHTML = categoryProducts.map(createProductCard).join('');
    }
  });
}

// Función para renderizar todos los productos en la tienda
async function renderShopProducts() {
  const products = await loadProducts();
  const container = document.getElementById('productsGrid');

  if (container && products.length > 0) {
    container.innerHTML = products.map(createProductCard).join('');
    initializeFilters();
  }
}

// Función para inicializar filtros de la tienda
function initializeFilters() {
  const searchInput = document.getElementById('productSearch');
  const categoryFilters = document.querySelectorAll('.category-filter');

  // Filtro de búsqueda
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterProducts(e.target.value, getSelectedCategories());
    });
  }

  // Filtros de categoría
  categoryFilters.forEach(filter => {
    filter.addEventListener('change', () => {
      updateCategoryFilters();
      filterProducts(searchInput?.value || '', getSelectedCategories());
    });
  });
}

// Función para actualizar checkboxes de categoría
function updateCategoryFilters() {
  const allCheckbox = document.querySelector('.category-filter[data-category="all"]');
  const categoryCheckboxes = document.querySelectorAll('.category-filter:not([data-category="all"])');

  if (allCheckbox.checked) {
    categoryCheckboxes.forEach(cb => cb.checked = false);
  } else {
    const anyChecked = Array.from(categoryCheckboxes).some(cb => cb.checked);
    if (!anyChecked) {
      allCheckbox.checked = true;
    }
  }
}

// Función para obtener categorías seleccionadas
function getSelectedCategories() {
  const allCheckbox = document.querySelector('.category-filter[data-category="all"]');

  if (allCheckbox.checked) {
    return ['all'];
  }

  const selected = [];
  document.querySelectorAll('.category-filter:checked').forEach(cb => {
    selected.push(cb.dataset.category);
  });

  return selected;
}

// Función para filtrar productos
function filterProducts(searchTerm, categories) {
  const cards = document.querySelectorAll('.product-card');

  cards.forEach(card => {
    const name = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
    const category = card.dataset.category;

    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesCategory = categories.includes('all') || categories.includes(category);

    card.style.display = matchesSearch && matchesCategory ? 'block' : 'none';
  });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Verificar en qué página estamos
  const isHomePage = document.querySelector('[data-products]');
  const isShopPage = document.getElementById('productsGrid');

  if (isHomePage) {
    renderFeaturedProducts();
  }

  if (isShopPage) {
    renderShopProducts();
  }
});
