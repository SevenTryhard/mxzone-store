/**
 * MXZONE STORE - Promotions System
 * Carga y gestión de combos/promociones desde CMS
 */

const PROMOS_CMS_URL = 'cms/promociones/';
let currentPromo = null;
let allPromos = [];

// ==================== CARGAR PROMOCIONES ====================

async function loadPromotions() {
  try {
    // Lista de archivos de promociones
    const promoFiles = [
      'combo-principiante.json',
      'combo-intermedio.json',
      'combo-profesional.json',
      'combo-premium.json'
    ];

    const promos = [];

    for (const file of promoFiles) {
      try {
        const response = await fetch(PROMOS_CMS_URL + file);
        if (response.ok) {
          const promo = await response.json();
          promos.push(promo);
        }
      } catch (e) {
        console.warn(`No se pudo cargar ${file}:`, e);
      }
    }

    allPromos = promos;
    console.log('Promociones cargadas:', promos.length);
    return promos;

  } catch (error) {
    console.error('Error cargando promociones:', error);
    return [];
  }
}

// ==================== RENDERIZAR PROMOS ====================

function createPromoCard(promo) {
  const discountPercent = Math.round(((promo.regularTotal - promo.promoPrice) / promo.regularTotal) * 100);
  const productsCount = promo.products ? promo.products.length : 0;

  return `
    <div class="promo-card" data-category="${promo.category || 'all'}" data-slug="${promo.slug || promo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">
      <div class="promo-card-image">
        <img src="${promo.image || promo.products?.[0]?.image || ''}" alt="${promo.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="promo-image-placeholder" style="display:none;">${promo.name.substring(0, 2).toUpperCase()}</div>
        <span class="promo-discount-badge">-${discountPercent}%</span>
        ${promo.badge ? `<span class="promo-card-badge">${promo.badge}</span>` : ''}
      </div>

      <div class="promo-card-content">
        <span class="promo-card-category">${getCategoryLabel(promo.category || 'general')}</span>
        <h3 class="promo-card-name">${promo.name}</h3>
        <p class="promo-card-products-count">📦 ${productsCount} productos incluidos</p>

        <div class="promo-card-pricing">
          <span class="promo-regular-price">$${promo.regularTotal?.toLocaleString('es-CO') || '0'}</span>
          <span class="promo-sale-price">$${promo.promoPrice?.toLocaleString('es-CO') || '0'}</span>
        </div>

        <div class="promo-card-actions">
          <button class="btn btn-secondary" onclick="openPromoModal('${promo.slug || promo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}')">
            Ver Detalles
          </button>
          <button class="btn btn-primary" onclick="addPromoToCart('${promo.slug || promo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}')">
            Agregar Combo
          </button>
        </div>
      </div>
    </div>
  `;
}

async function renderPromotions(filter = 'all') {
  const promos = await loadPromotions();
  const container = document.getElementById('promosGrid');

  if (!container) return;

  const filteredPromos = filter === 'all'
    ? promos
    : promos.filter(p => p.category === filter);

  if (filteredPromos.length === 0) {
    container.innerHTML = `
      <div class="promos-empty">
        <span class="empty-icon">📦</span>
        <p>No hay promociones disponibles en esta categoría</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredPromos.map(createPromoCard).join('');
}

// ==================== MODAL DE PROMOCIONES ====================

function openPromoModal(promoSlug) {
  const promo = allPromos.find(p => {
    const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return slug === promoSlug;
  });

  if (!promo) {
    console.warn('Promoción no encontrada:', promoSlug);
    return;
  }

  currentPromo = promo;
  const modal = document.getElementById('promoModal');

  // Header
  document.getElementById('promoModalBadge').textContent = promo.badge || 'Combo';
  document.getElementById('promoModalTitle').textContent = promo.name;
  document.getElementById('promoModalDescription').textContent = promo.description || 'Combo especial de productos';

  // Gallery
  const mainImage = document.getElementById('promoMainImage');
  const placeholder = document.getElementById('galleryPlaceholder');
  const images = promo.images || (promo.image ? [promo.image] : []);

  if (images.length > 0) {
    mainImage.src = images[0];
    mainImage.style.display = 'block';
    placeholder.style.display = 'none';

    // Thumbnails
    const thumbnailsContainer = document.getElementById('galleryThumbnails');
    if (images.length > 1) {
      thumbnailsContainer.innerHTML = images.map((img, idx) => `
        <img src="${img}" alt="Imagen ${idx + 1}" class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="changeGalleryImage('${img}', this)">
      `).join('');
      thumbnailsContainer.style.display = 'flex';
    } else {
      thumbnailsContainer.style.display = 'none';
    }
  } else {
    mainImage.style.display = 'none';
    placeholder.style.display = 'flex';
    document.getElementById('galleryThumbnails').style.display = 'none';
  }

  // Products List con selector de tallas
  const productsList = document.getElementById('promoProductsList');
  if (promo.products && promo.products.length > 0) {
    productsList.innerHTML = promo.products.map((product, idx) => {
      const sizesArray = product.sizes ? product.sizes.split('/').map(s => s.trim()) : ['Única'];
      const sizeOptions = sizesArray.map(size => `<option value="${size}">${size}</option>`).join('');

      return `
        <div class="promo-product-item" data-product-index="${idx}">
          <div class="product-item-image">
            <img src="${product.image || ''}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <span class="product-item-placeholder" style="display:none;">${product.name.substring(0, 2).toUpperCase()}</span>
          </div>
          <div class="product-item-info">
            <h4 class="product-item-name">${product.name}</h4>
            <p class="product-item-category">${getCategoryLabel(product.category)}</p>
            <div class="product-item-size-selector">
              <label>Talla:</label>
              <select class="promo-product-size-select" data-product="${idx}">
                ${sizeOptions}
              </select>
            </div>
            <span class="product-item-price">$${product.price?.toLocaleString('es-CO') || '0'}</span>
          </div>
          <div class="product-item-badge">Incluido</div>
        </div>
      `;
    }).join('');
  }

  // Pricing
  const discountPercent = Math.round(((promo.regularTotal - promo.promoPrice) / promo.regularTotal) * 100);
  document.getElementById('regularPrice').textContent = '$' + (promo.regularTotal?.toLocaleString('es-CO') || '0');
  document.getElementById('discountPrice').textContent = '-$' + ((promo.regularTotal - promo.promoPrice)?.toLocaleString('es-CO') || '0');
  document.getElementById('totalPrice').textContent = '$' + (promo.promoPrice?.toLocaleString('es-CO') || '0');

  // Show modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePromoModal() {
  const modal = document.getElementById('promoModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  currentPromo = null;
}

function changeGalleryImage(src, thumb) {
  document.getElementById('promoMainImage').src = src;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

function addPromoToCart(promoSlug) {
  const promo = allPromos.find(p => {
    const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return slug === promoSlug;
  });

  if (!promo || !promo.products) return;

  // Agregar cada producto del combo al carrito con la talla seleccionada
  promo.products.forEach((product, idx) => {
    const sizeSelect = document.querySelector(`.promo-product-size-select[data-product="${idx}"]`);
    const selectedSize = sizeSelect ? sizeSelect.value : (product.sizes || 'Única').split('/')[0].trim();

    window.MXZONECart.addToCart({
      name: product.name,
      price: '$' + (product.price?.toLocaleString('es-CO') || '0'),
      priceNum: product.price || 0,
      image: product.image || '',
      category: product.category || 'general'
    }, selectedSize);
  });

  // Mostrar notificación
  showNotification(`Combo "${promo.name}" agregado al carrito`, 'success');

  // Cerrar modal y abrir carrito
  closePromoModal();
  setTimeout(() => {
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
      const cartModal = document.getElementById('cartModal');
      if (cartModal) {
        cartModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateCartModal();
      }
    }
  }, 500);
}

function getCategoryLabel(category) {
  const labels = {
    'cascos': 'Cascos',
    'uniformes': 'Uniformes',
    'botas': 'Botas',
    'protecciones': 'Protecciones',
    'general': 'General',
    'principiante': 'Principiante',
    'intermedio': 'Intermedio',
    'profesional': 'Profesional',
    'premium': 'Premium'
  };
  return labels[category] || category;
}

// ==================== WHATSAPP MESSAGE FOR COMBOS ====================

function buildComboWhatsAppMessage(promo, selectedSizes) {
  const discountPercent = Math.round(((promo.regularTotal - promo.promoPrice) / promo.regularTotal) * 100);

  let message = `*¡Hola MXZONE STORE! 🏍️*\n\n`;
  message += `*QUIERO EL SIGUIENTE COMBO:*\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `*🎁 ${promo.name}*\n\n`;
  message += `${promo.description || 'Combo especial de productos'}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `*PRODUCTOS INCLUIDOS:*\n\n`;

  // Agrupar productos por categoría
  const byCategory = {};
  promo.products.forEach((product, idx) => {
    if (!byCategory[product.category]) {
      byCategory[product.category] = [];
    }
    byCategory[product.category].push({
      ...product,
      selectedSize: selectedSizes[idx] || 'Única'
    });
  });

  const categoryNames = {
    cascos: '*🪖 CASCOS*',
    uniformes: '*👕 UNIFORMES*',
    botas: '*👢 BOTAS*',
    protecciones: '*🛡️ PROTECCIONES*',
    accesorios: '*🧤 ACCESORIOS*'
  };

  Object.keys(byCategory).forEach(category => {
    message += `${categoryNames[category] || category}:\n\n`;

    byCategory[category].forEach((product) => {
      message += `▫️ *${product.name}*\n`;
      message += `   Talla: ${product.selectedSize}\n`;
      message += `   Precio individual: $${product.price?.toLocaleString('es-CO') || '0'}\n\n`;
    });
  });

  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `*RESUMEN DE PRECIOS:*\n\n`;
  message += `Precio regular: *$${promo.regularTotal.toLocaleString('es-CO')}*\n`;
  message += `Descuento (${discountPercent}%): *-$${(promo.regularTotal - promo.promoPrice).toLocaleString('es-CO')}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `*TOTAL COMBO: *$${promo.promoPrice.toLocaleString('es-CO')}*\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `*AHORRAS: $${(promo.regularTotal - promo.promoPrice).toLocaleString('es-CO')} 💰*\n\n`;
  message += `Por favor, confírmenme disponibilidad de tallas y los pasos para completar mi pedido. ¡Gracias! 🙌`;

  return message;
}

// ==================== WHATSAPP CHECKOUT FOR COMBOS ====================

function checkoutComboToWhatsApp() {
  if (!currentPromo) return;

  // Obtener tallas seleccionadas
  const selectedSizes = [];
  currentPromo.products.forEach((product, idx) => {
    const sizeSelect = document.querySelector(`.promo-product-size-select[data-product="${idx}"]`);
    selectedSizes.push(sizeSelect ? sizeSelect.value : (product.sizes || 'Única').split('/')[0].trim());
  });

  const message = buildComboWhatsAppMessage(currentPromo, selectedSizes);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// ==================== FILTROS ====================

function initPromoFilters() {
  const tabs = document.querySelectorAll('.promo-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderPromotions(tab.dataset.filter);
    });
  });
}

// ==================== EFECTOS 3D DEL BIKER ====================

function initBiker3DEffect() {
  const bikerContainer = document.getElementById('bikerContainer');
  const biker3D = document.getElementById('biker3D');

  if (!bikerContainer || !biker3D) return;

  // Mouse move effect
  bikerContainer.addEventListener('mousemove', (e) => {
    const rect = bikerContainer.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    const rotateX = y * -15; // Rotate X based on Y position
    const rotateY = x * 15;  // Rotate Y based on X position

    biker3D.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  });

  bikerContainer.addEventListener('mouseleave', () => {
    biker3D.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
  });

  // Parallax effect for biker image
  const bikerImage = document.getElementById('bikerImage');
  if (bikerImage) {
    bikerContainer.addEventListener('mousemove', (e) => {
      const rect = bikerContainer.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const moveX = (x - 0.5) * 20;
      const moveY = (y - 0.5) * 20;

      bikerImage.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
    });

    bikerContainer.addEventListener('mouseleave', () => {
      bikerImage.style.transform = 'translate(0, 0) scale(1)';
    });
  }
}

// ==================== PARTICULAS ====================

function initPromoParticles() {
  const container = document.getElementById('promoParticles');
  if (!container) return;

  const particleCount = 40;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'dust-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 5 + 's';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
    particle.style.setProperty('--mouse-x', '0');
    particle.style.setProperty('--mouse-y', '0');
    container.appendChild(particle);
  }
}

function initBikerParticles() {
  const container = document.getElementById('bikerParticles');
  if (!container) return;

  const particleCount = 20;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'dust-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 3 + 's';
    particle.style.setProperty('--mouse-x', '0');
    particle.style.setProperty('--mouse-y', '0');
    container.appendChild(particle);
  }
}

// Efecto interactivo de partículas con el mouse
function initParticleInteraction() {
  const heroSection = document.querySelector('.promo-hero');
  if (!heroSection) return;

  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;

    // Actualizar todas las partículas
    document.querySelectorAll('.dust-particle').forEach(particle => {
      const particleX = parseFloat(particle.style.left) / 100;
      const particleY = parseFloat(particle.style.top) / 100;

      // Calcular distancia desde el mouse
      const dx = mouseX - particleX;
      const dy = mouseY - particleY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Si el mouse está cerca, empujar la partícula
      const maxDistance = 0.3;
      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        const moveX = dx * force * 100;
        const moveY = dy * force * 100;
        particle.style.setProperty('--mouse-x', `${moveX}px`);
        particle.style.setProperty('--mouse-y', `${moveY}px`);
      } else {
        particle.style.setProperty('--mouse-x', '0');
        particle.style.setProperty('--mouse-y', '0');
      }
    });
  });
}

// ==================== COUNT UP ANIMATION ====================

function initCountUp() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const numbers = entry.target.querySelectorAll('.stat-number[data-count]');
        numbers.forEach(num => {
          const target = parseInt(num.dataset.count);
          animateCountUp(num, target);
        });
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const statsSection = document.querySelector('.promo-stats');
  if (statsSection) {
    observer.observe(statsSection);
  }
}

function animateCountUp(element, target) {
  let current = 0;
  const increment = target / 50;
  const duration = 2000;
  const stepTime = duration / 50;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, stepTime);
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', () => {
  renderPromotions();
  initPromoFilters();
  initBiker3DEffect();
  initPromoParticles();
  initBikerParticles();
  initParticleInteraction();
  initCountUp();

  // Modal handlers
  const modalClose = document.getElementById('promoModalClose');
  const modalOverlay = document.getElementById('promoOverlay');
  const addToCartBtn = document.getElementById('addToCartComboBtn');
  const checkoutComboBtn = document.getElementById('checkoutComboBtn');

  if (modalClose) {
    modalClose.addEventListener('click', closePromoModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', closePromoModal);
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      if (currentPromo) {
        addPromoToCart(currentPromo.slug || currentPromo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      }
    });
  }

  // Checkout combo to WhatsApp
  if (checkoutComboBtn) {
    checkoutComboBtn.addEventListener('click', () => {
      if (currentPromo) {
        checkoutComboToWhatsApp();
      }
    });
  }

  // Escape key
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('promoModal');
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closePromoModal();
    }
  });

  // Make functions global
  window.openPromoModal = openPromoModal;
  window.addPromoToCart = addPromoToCart;
  window.changeGalleryImage = changeGalleryImage;
  window.checkoutComboToWhatsApp = checkoutComboToWhatsApp;
});
