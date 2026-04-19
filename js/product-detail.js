/**
 * MXZONE STORE - Product Detail Page
 * Carga dinámicamente los detalles del producto desde el CMS
 */

const WHATSAPP_NUMBER = '573176692997';

// Mapeo de marcas
function getBrand(productName) {
  const name = productName.toLowerCase();
  if (name.includes('fox')) return { name: 'Fox', icon: '🦊' };
  if (name.includes('fly')) return { name: 'Fly', icon: '🪰' };
  if (name.includes('alpinestars') || name.includes('alpine')) return { name: 'Alpinestars', icon: '⭐' };
  if (name.includes('leatt')) return { name: 'Leatt', icon: '🛡️' };
  if (name.includes('troy lee')) return { name: 'Troy Lee', icon: '🎨' };
  if (name.includes('oneal')) return { name: 'Oneal', icon: '⚡' };
  if (name.includes('airoh')) return { name: 'Airoh', icon: '🇮🇹' };
  if (name.includes('acerbis')) return { name: 'Acerbis', icon: '🔧' };
  if (name.includes('gaerne')) return { name: 'Gaerne', icon: '👢' };
  if (name.includes('fxr')) return { name: 'FXR', icon: '❄️' };
  if (name.includes('thor')) return { name: 'Thor', icon: '⚡' };
  if (name.includes('ktm')) return { name: 'KTM', icon: '🧡' };
  return { name: 'Otro', icon: '📦' };
}

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

// Función para codificar URLs de imágenes correctamente (maneja espacios)
function encodeImagePath(path) {
  return path.replace(/ /g, '%20');
}

// Verificar si es URL de CloudCannon
function isCloudCannonUrl(url) {
  return url && url.includes('cloudvent.net');
}

// Obtener imagen principal del producto (primera del array images)
function getProductImage(product) {
  let imageSrc = '';

  // Usar primera imagen del array
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    imageSrc = product.images[0];
  }

  // Si es CloudCannon, corregir formato y no agregar cache buster
  if (isCloudCannonUrl(imageSrc)) {
    return imageSrc.replace(/^\/https:/, 'https:');
  }
  // Quitar slash inicial si existe
  const cleanPath = imageSrc.replace(/^\//, '');
  return encodeImagePath(cleanPath) + '?' + IMAGE_VERSION;
}

// Obtener todas las imágenes del producto
function getProductImages(product) {
  if (product.images && Array.isArray(product.images)) {
    return product.images.filter(img => img && img.trim() !== '');
  }
  return [];
}

// Crear HTML del producto
function createProductHTML(product) {
  const brand = getBrand(product.name);
  const whatsappMessage = encodeURIComponent(`Estoy interesado en ${product.name}`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;
  const description = getCategoryDescription(product.category, product.name);
  const features = getCategoryFeatures(product.category);
  const sizes = product.sizes.split('/').map(s => s.trim());

  const imageSrc = getProductImage(product);
  const badgeHTML = product.badge ?
    `<span class="product-detail-badge">${product.badge}</span>` : '';

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

        <!-- Precio -->
        <div class="product-detail-price">${product.price}</div>

        <!-- Tallas -->
        <div class="product-sizes-section">
          <h4 class="sizes-title">Tallas Disponibles:</h4>
          <div class="product-size-selector">
            ${sizes.map(size => `
              <button class="size-btn-product" data-size="${size.trim()}">${size.trim()}</button>
            `).join('')}
          </div>
          <p class="size-guide-link">
            ¿Dudas con tu talla? <a href="sizes.html" target="_blank">Ver guía de tallas</a>
          </p>
        </div>

        <!-- Descripción -->
        <div class="product-description-section">
          <h4 class="description-title">Descripción</h4>
          <p class="description-text">${description}</p>
        </div>

        <!-- Características -->
        <div class="product-features-section">
          <h4 class="features-title">Características</h4>
          <ul class="features-list">
            ${features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>

        <!-- Acciones -->
        <div class="product-actions-section">
          <a href="${whatsappUrl}" class="btn btn-whatsapp btn-large" target="_blank">
            <img src="../assets/whatsapp-logo.webp" alt="WhatsApp" class="btn-whatsapp-icon"> Comprar por WhatsApp
          </a>
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
    'protecciones': 'Protecciones'
  };
  return labels[category] || category;
}

// Cargar producto desde JSON
async function loadProduct(productSlug) {
  try {
    const response = await fetch(`cms/productos/${productSlug}.json`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error cargando producto:', error);
    return null;
  }
}

// Cargar productos relacionados
async function loadRelatedProducts(currentProduct, currentSlug) {
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
    const categoryProducts = [];

    for (const file of productFiles) {
      try {
        const response = await fetch(file);
        if (response.ok) {
          const product = await response.json();
          products.push(product);

          // Filtrar productos de la misma categoría (excluyendo el actual)
          if (product.category === currentProduct.category &&
              file !== `cms/productos/${currentSlug}.json`) {
            categoryProducts.push(product);
          }
        }
      } catch (e) {
        console.warn(`No se pudo cargar ${file}:`, e);
      }
    }

    // Retornar máximo 4 productos relacionados de la misma categoría
    return categoryProducts.slice(0, 4);
  } catch (error) {
    console.error('Error cargando productos relacionados:', error);
    return [];
  }
}

// Crear tarjeta de producto relacionado
function createRelatedProductCard(product) {
  const whatsappMessage = encodeURIComponent(`Estoy interesado en ${product.name}`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;
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

  // Actualizar breadcrumb
  document.getElementById('breadcrumbProduct').textContent = product.name;

  // Actualizar título de la página
  document.title = `${product.name} | MXZONE STORE`;

  // Actualizar meta descripción
  document.querySelector('meta[name="description"]').setAttribute('content',
    `Compra ${product.name} en MXZONE STORE. ${product.price}. Tallas: ${product.sizes}`);

  // Renderizar producto
  layout.innerHTML = createProductHTML(product);

  // Inicializar selector de tallas
  initSizeSelector();

  // Cargar productos relacionados
  loadRelatedProductsForLayout(product, productSlug);
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
  const sizeBtns = document.querySelectorAll('.size-btn-product');
  if (!sizeBtns.length) return;

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remover clase active de todos
      sizeBtns.forEach(b => b.classList.remove('active'));
      // Agregar clase active al seleccionado
      btn.classList.add('active');
    });
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
