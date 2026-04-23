/**
 * MXZONE STORE - Dynamic Product Loader v5
 * Carga TODOS los productos desde los archivos JSON del CMS automáticamente
 * Usa index.json para descubrimiento automático de productos
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

// Función para descubrir y cargar TODOS los productos del CMS automáticamente
async function loadProducts() {
  try {
    const cmsBaseUrl = window.MXZONE_CONFIG ? window.MXZONE_CONFIG.cmsBaseUrl : 'cms/productos/';
    const IMAGE_VERSION = window.MXZONE_CONFIG ? window.MXZONE_CONFIG.imageVersion : 'v5-20260423';

    // Función para codificar URLs de imágenes correctamente (maneja espacios)
    function encodeImagePath(path) {
      return path.replace(/ /g, '%20');
    }

    console.log('🚀 Cargando productos automáticamente desde:', cmsBaseUrl);
    console.log('📦 Versión de imágenes:', IMAGE_VERSION);

    // Paso 1: Obtener lista de archivos desde index.json
    let productFiles = [];
    try {
      const indexResponse = await fetch(cmsBaseUrl + 'index.json?v=' + IMAGE_VERSION);
      if (indexResponse.ok) {
        const indexData = await indexResponse.json();
        productFiles = indexData.files || [];
        console.log('✅ index.json cargado:', productFiles.length, 'archivos encontrados');
      } else {
        console.warn('⚠️ index.json respondió con estado:', indexResponse.status);
      }
    } catch (e) {
      console.error('❌ Error cargando index.json:', e);
    }

    // Si no hay index.json o está vacío, mostrar error
    if (productFiles.length === 0) {
      console.error('❌ No se pudo cargar index.json. Verifica que el archivo exista en', cmsBaseUrl);
      return [];
    }

    // Filtrar index.json de la lista (por si acaso)
    productFiles = productFiles.filter(f => f !== 'index.json');

    console.log('📋 Cargando', productFiles.length, 'productos...');

    // Cargar todos los archivos en paralelo con cache buster
    const promises = productFiles.map(async (file) => {
      try {
        const response = await fetch(cmsBaseUrl + file + '?v=' + IMAGE_VERSION);
        if (response.ok) {
          const product = await response.json();
          
          // Procesar imágenes: codificar espacios y agregar versión
          if (product.images && product.images.length > 0) {
            product.images = product.images.map(img => encodeImagePath(img) + '?' + IMAGE_VERSION);
          }
          if (product.image) {
            product.image = encodeImagePath(product.image) + '?' + IMAGE_VERSION;
          }
          
          return product;
        } else {
          console.warn('⚠️ No se pudo cargar', file, '- Estado:', response.status);
        }
      } catch (e) {
        console.warn('❌ Error cargando', file + ':', e.message);
      }
      return null;
    });

    const results = await Promise.all(promises);
    const validProducts = results.filter(p => p !== null);

    console.log('✅ Productos cargados exitosamente:', validProducts.length, 'de', productFiles.length);
    
    // Mostrar productos con categoría inválida
    const invalidCategories = validProducts.filter(p => !p.category || p.category.trim() === '');
    if (invalidCategories.length > 0) {
      console.warn('⚠️', invalidCategories.length, 'productos sin categoría válida:', invalidCategories.map(p => p.name));
    }
    
    return validProducts;

  } catch (error) {
    console.error('❌ Error crítico cargando productos:', error);
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

  // Soporte para múltiples imágenes (array images)
  const isCloudCannonUrl = (url) => url && url.includes('cloudvent.net');

  let images = [];
  // IMPORTANTE: Los JSON del CMS usan "image" (singular), no "images" (array)
  // Primero intentar con images (array), luego fallback a image (singular)
  if (product.images && Array.isArray(product.images)) {
    images = product.images.filter(img => img && img.trim() !== '');
  }
  // Fallback: usar product.image (singular) si no hay array
  if (!images.length && product.image) {
    images = [product.image];
  }

  // Agregar cache buster solo a imágenes locales (no CloudCannon)
  const imageVersion = Date.now();
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
  const sizeOptions = sizesArray.map(size => `<option value="${size}">${size}</option>`).join('');

  return `
    <div class="product-card"
         data-category="${product.category || 'sin-categoria'}"
         data-brand="${brand}"
         data-price="${priceNum}"
         data-image="${mainImage}"
         data-images='${JSON.stringify(images).replace(/'/g, "&#39;")}'
         data-slug="${productSlug}"
         data-sizes="${product.sizes || 'Única'}">
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
    'jersey': 'Jerseys',
    'pantalones': 'Pantalones',
    'botas': 'Botas',
    'protecciones': 'Protecciones',
    'accesorios': 'Accesorios',
    'jersey': 'Jerseys',
    'gafas': 'Gafas',
    'gorras': 'Gorras',
    'guantes': 'Guantes',
    'maletas': 'Maletas'
  };
  return labels[category] || category || 'Sin categoría';
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
    'jersey': { label: 'Jerseys', icon: '👕' },
    'guantes': { label: 'Guantes', icon: '🧤' },
    'gorras': { label: 'Gorras', icon: '🧢' },
    'protecciones': { label: 'Protecciones', icon: '🛡️' },
    'accesorios': { label: 'Accesorios', icon: '🔧' },
    'maletas': { label: 'Maletas', icon: '🎒' },
    'gafas': { label: 'Gafas', icon: '👓' }
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
    const categoryOrder = ['botas', 'cascos', 'uniformes', 'jersey', 'guantes', 'gorras', 'protecciones', 'accesorios', 'maletas', 'gafas'];
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
