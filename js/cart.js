/**
 * MXZONE STORE - Carrito de Compras
 * Sistema de carrito que envía pedidos a WhatsApp
 */

const CART_STORAGE_KEY = 'mxzone_cart';
const WHATSAPP_NUMBER = '573176692997';

// Función para codificar URLs de imágenes correctamente (maneja espacios)
function encodeImagePath(path) {
  return path.replace(/ /g, '%20');
}

// Verificar si es URL de CloudCannon
function isCloudCannonUrl(url) {
  return url && url.includes('cloudvent.net');
}

// Obtener imagen del producto (image + galeria)
function getProductImage(product) {
  let imageSrc = '';
  // Primero usar image principal
  if (product.image) {
    imageSrc = product.image;
  }
  // Si no, usar galeria (puede ser string o array)
  else if (product.galeria) {
    if (Array.isArray(product.galeria)) {
      imageSrc = product.galeria[0] || '';
    } else {
      imageSrc = product.galeria;
    }
  }
  // Si es CloudCannon, corregir formato
  if (isCloudCannonUrl(imageSrc)) {
    return imageSrc.replace(/^\/https:/, 'https:');
  }
  return encodeImagePath(imageSrc);
}

// Estado del carrito
let cart = [];
let selectedPaymentMethod = '';

// ==================== FUNCIONES DEL CARRITO ====================

// Cargar carrito desde localStorage
function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      cart = JSON.parse(saved);
    }
  } catch (e) {
    cart = [];
  }
  updateCartCount();
  updateFloatingWhatsApp();
}

// Guardar carrito en localStorage
function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartCount();
  updateFloatingWhatsApp();
}

// Agregar producto al carrito
function addToCart(product, size, quantity = 1) {
  const existingIndex = cart.findIndex(item =>
    item.name === product.name && item.selectedSize === size
  );

  if (existingIndex !== -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      name: product.name,
      price: product.price,
      priceNum: parseInt(product.price.replace(/[^0-9]/g, '')),
      image: getProductImage(product),
      category: product.category,
      selectedSize: size,
      quantity: quantity,
      slug: createProductSlug(product.name)
    });
  }

  saveCart();
  showNotification(`${product.name} agregado al carrito`, 'success');
  updateCartModal();
}

// Eliminar producto del carrito
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartModal();
}

// Actualizar cantidad de un producto
function updateQuantity(index, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(index);
    return;
  }
  cart[index].quantity = newQuantity;
  saveCart();
  updateCartModal();
}

// Cambiar talla de un producto en el carrito
function updateSize(index, newSize) {
  cart[index].selectedSize = newSize;
  saveCart();
}

// Vaciar carrito
function clearCart() {
  cart = [];
  saveCart();
  updateCartModal();
}

// Obtener total del carrito
function getCartTotal() {
  return cart.reduce((total, item) => total + (item.priceNum * item.quantity), 0);
}

// Formatear precio
function formatPrice(priceNum) {
  return '$' + priceNum.toLocaleString('es-CO');
}

// ==================== ACTUALIZAR UI ====================

// Actualizar contador del carrito
function updateCartCount() {
  const countEl = document.getElementById('cartCount');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (countEl) {
    countEl.textContent = totalItems;
    countEl.style.display = totalItems > 0 ? 'flex' : 'none';
  }
}

// Actualizar modal del carrito
function updateCartModal() {
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalSection = document.getElementById('cartTotal');
  const cartEmptyEl = document.getElementById('cartEmpty');
  const cartContentEl = document.getElementById('cartContent');
  const cartTotalValueEl = document.getElementById('cartTotalValue');

  if (!cartItemsEl) {
    console.log('updateCartModal: elementos del DOM no disponibles aún');
    return;
  }

  if (cart.length === 0) {
    if (cartEmptyEl) cartEmptyEl.style.display = 'block';
    if (cartContentEl) cartContentEl.style.display = 'none';
    if (cartTotalSection) cartTotalSection.style.display = 'none';
    return;
  }

  if (cartEmptyEl) cartEmptyEl.style.display = 'none';
  if (cartContentEl) cartContentEl.style.display = 'block';
  if (cartTotalSection) cartTotalSection.style.display = 'block';

  // Renderizar items
  cartItemsEl.innerHTML = cart.map((item, index) => {
    const sizesArray = item.selectedSize ? item.selectedSize.split('/') : ['Única'];
    const sizeOptions = sizesArray.map(size =>
      `<option value="${size.trim()}" ${item.selectedSize === size.trim() ? 'selected' : ''}>${size.trim()}</option>`
    ).join('');

    return `
      <div class="cart-item" data-index="${index}">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">
        </div>
        <div class="cart-item-info">
          <h4 class="cart-item-name">${item.name}</h4>
          <p class="cart-item-category">${getCategoryLabel(item.category)}</p>
          <div class="cart-item-details">
            <div class="cart-item-size">
              <span>Talla:</span>
              <select class="size-select" onchange="updateSize(${index}, this.value)">
                ${sizeOptions}
              </select>
            </div>
            <div class="cart-item-quantity">
              <button class="qty-btn minus" onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn plus" onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
            </div>
          </div>
          <p class="cart-item-price">${formatPrice(item.priceNum * item.quantity)}</p>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${index})" title="Eliminar">
          <span>&times;</span>
        </button>
      </div>
    `;
  }).join('');

  if (cartTotalValueEl) {
    cartTotalValueEl.textContent = formatPrice(getCartTotal());
  }
}

// ==================== WHATSAPP CHECKOUT ====================

// Enviar pedido a WhatsApp
function checkoutToWhatsApp() {
  if (cart.length === 0) {
    showNotification('El carrito está vacío', 'error');
    return;
  }

  if (!selectedPaymentMethod) {
    showNotification('Por favor selecciona un método de pago', 'error');
    return;
  }

  const message = buildWhatsAppMessage();
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// Construir mensaje de WhatsApp
function buildWhatsAppMessage() {
  let message = `*¡Hola MXZONE STORE! 🏍️*\n\n`;
  message += `*QUIERO REALIZAR EL SIGUIENTE PEDIDO:*\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Agrupar productos por categoría
  const byCategory = {};
  cart.forEach(item => {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  });

  // Listar productos por categoría
  const categoryNames = {
    cascos: '*🪖 CASCOS*',
    uniformes: '*👕 UNIFORMES*',
    botas: '*👢 BOTAS*',
    protecciones: '*🛡️ PROTECCIONES*'
  };

  Object.keys(byCategory).forEach(category => {
    message += `${categoryNames[category] || category}:\n\n`;

    byCategory[category].forEach((item, idx) => {
      message += `▫️ *${item.name}*\n`;
      message += `   Talla: ${item.selectedSize}\n`;
      message += `   Cantidad: ${item.quantity}\n`;
      message += `   Precio: ${formatPrice(item.priceNum * item.quantity)}\n\n`;
    });
  });

  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `*TOTAL DEL PEDIDO: ${formatPrice(getCartTotal())}*\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Método de pago seleccionado
  const paymentMethodNames = {
    'nequi': '📱 Nequi',
    'daviplata': '📱 Daviplata',
    'transferencia': '🏦 Transferencia bancaria',
    'efectivo': '💵 Efectivo contra entrega',
    'tarjeta': '💳 Tarjeta de crédito/débito (Próximamente)'
  };

  message += `*MÉTODO DE PAGO SELECCIONADO:*\n`;
  message += `${paymentMethodNames[selectedPaymentMethod] || selectedPaymentMethod}\n\n`;

  if (selectedPaymentMethod === 'tarjeta') {
    message += `⚠️ *Nota:* El pago con tarjeta estará disponible próximamente. Por favor coordina otro método de pago con la tienda.\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  }

  message += `Por favor, confirmen disponibilidad y me indican los pasos a seguir para completar mi compra. ¡Gracias! 🙌`;

  return message;
}

// Seleccionar método de pago
function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  console.log('Método de pago seleccionado:', method);

  // Actualizar UI - remover clase active de todos y agregar al seleccionado
  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.payment-method-btn[data-method="${method}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// ==================== UTILIDADES ====================

function createProductSlug(productName) {
  return productName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCategoryLabel(category) {
  const labels = {
    cascos: 'Cascos',
    uniformes: 'Uniformes',
    botas: 'Botas',
    protecciones: 'Protecciones'
  };
  return labels[category] || category;
}

function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '100px',
    right: '30px',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: '600',
    zIndex: '1000',
    animation: 'fadeInUp 0.3s ease',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    background: type === 'success' ? '#25D366' : type === 'error' ? '#E63946' : '#FF6600'
  });

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'fadeInUp 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ==================== INICIALIZACIÓN ====================

// Hacer funciones disponibles globalmente INMEDIATAMENTE
window.MXZONECart = {
  loadCart: () => {}, // Se redefine después
  addToCart,
  removeFromCart,
  updateQuantity,
  updateSize,
  clearCart,
  getCartTotal,
  getCartItems: () => cart
};

// Funciones de UI globales
window.openCart = function() {
  const cartModal = document.getElementById('cartModal');
  if (cartModal) {
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateCartModal();
  }
};

window.closeCart = function() {
  const cartModal = document.getElementById('cartModal');
  if (cartModal) {
    cartModal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// Cargar carrito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Redefinir loadCart en el objeto global
  window.MXZONECart.loadCart = loadCart;

  // Ejecutar carga inicial
  loadCart();

  // Abrir modal del carrito - usar delegación de eventos
  document.addEventListener('click', (e) => {
    if (e.target.id === 'cartBtn' || e.target.closest('#cartBtn')) {
      e.preventDefault();
      const cartModal = document.getElementById('cartModal');
      if (cartModal) {
        cartModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateCartModal();
      }
    }

    if (e.target.id === 'cartClose' || e.target.closest('#cartClose')) {
      closeCart();
    }

    if (e.target.id === 'cartOverlay' || e.target.closest('#cartOverlay')) {
      closeCart();
    }

    if (e.target.id === 'checkoutBtn' || e.target.closest('#checkoutBtn')) {
      checkoutToWhatsApp();
    }

    if (e.target.id === 'clearCartBtn' || e.target.closest('#clearCartBtn')) {
      if (confirm('¿Estás seguro de vaciar el carrito?')) {
        clearCart();
      }
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    const cartModal = document.getElementById('cartModal');
    if (e.key === 'Escape' && cartModal && cartModal.classList.contains('active')) {
      closeCart();
    }
  });
});

// Actualizar WhatsApp flotante con productos del carrito
function updateFloatingWhatsApp() {
  const floatBtn = document.getElementById('whatsappFloat');
  if (!floatBtn) return;

  if (cart.length === 0) {
    // Sin productos - mensaje genérico
    floatBtn.href = `https://wa.me/${WHATSAPP_NUMBER}`;
    floatBtn.title = 'Contactar por WhatsApp';
  } else {
    // Con productos - mensaje con lista del carrito
    const message = `Hola MXZONE! 👋\n\nTengo estos productos en mi carrito:\n\n${cart.map((item, i) => `${i + 1}. ${item.name} (${item.selectedSize}) - $${item.price}`).join('\n')}\n\n*Total: ${getCartTotal()}*\n\n¿Me ayudan con el pedido?`;
    floatBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    floatBtn.title = `WhatsApp (${cart.length} productos)`;
  }
}

// Exportar funciones globales
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.updateSize = updateSize;
window.checkoutToWhatsApp = checkoutToWhatsApp;
window.MXZONECart = {
  loadCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  getCartTotal,
  getCartItems: () => cart
};
