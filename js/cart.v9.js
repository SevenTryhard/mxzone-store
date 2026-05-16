/**
 * MXZONE STORE - Carrito de Compras
 * Sistema de carrito que envia pedidos a WhatsApp
 */

const CART_STORAGE_KEY = 'mxzone_cart';
const WHATSAPP_NUMBER = '573176692997';

// Funcion para codificar URLs de imagenes correctamente (maneja espacios)
function encodeImagePath(path) {
  return path.replace(/ /g, '%20');
}

// Verificar si es URL de CloudCannon
function isCloudCannonUrl(url) {
  return url && url.includes('cloudvent.net');
}

// Obtener imagen del producto (primera del array images)
function getProductImage(product) {
  let imageSrc = '';
  // Usar primera imagen del array images
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    imageSrc = product.images[0];
  }
  // Si es CloudCannon, corregir formato
  if (isCloudCannonUrl(imageSrc)) {
    return imageSrc.replace(/^\/https:/, 'https:');
  }
  // Si es ruta relativa, convertir a absoluta usando el host actual
  if (imageSrc && imageSrc.startsWith('/')) {
    return window.location.origin + imageSrc;
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
      images: product.images || [],
      category: product.category,
      selectedSize: size,
      sizes: product.sizes || 'Unica',
      quantity: quantity,
      slug: createProductSlug(product.name)
    });
  }

  saveCart();
  showNotification(product.name + ' agregado al carrito', 'success');
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
    const sizesArray = item.sizes ? item.sizes.split('/') : ['Unica'];
    const sizeOptions = sizesArray.map(size =>
      '<option value="' + size.trim() + '" ' + (item.selectedSize === size.trim() ? 'selected' : '') + '>' + size.trim() + '</option>'
    ).join('');
    
    // Convertir imagen relativa a absoluta para vista previa
    var imagePath = item.image || '';
    if (imagePath && !imagePath.startsWith('http')) {
      if (!imagePath.startsWith('/')) imagePath = '/' + imagePath;
      imagePath = window.location.origin + imagePath;
    }
}

// ==================== CHECKOUT ====================

function openCheckout() {
  if (cart.length === 0) {
    showNotification('El carrito esta vacio', 'error');
    return;
  }
  // CERRAR CARRITO PRIMERO para que el checkout sea visible
  closeCart();
  // Esperar a que el carrito termine de cerrarse (transicion CSS)
  setTimeout(function() {
    const overlay = document.getElementById('checkoutOverlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      // Resetear metodo de pago
      selectedPaymentMethod = '';
      document.querySelectorAll('.payment-method-btn').forEach(btn => btn.classList.remove('active'));
    }
  }, 50);
}

function closeCheckout() {
  const overlay = document.getElementById('checkoutOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Construir mensaje de WhatsApp (con datos de formulario)
function buildWhatsAppMessage(name, phone, city, address) {
  let message = 'Hola MXZONE STORE!\n\n';
  message += 'QUIERO REALIZAR EL SIGUIENTE PEDIDO:\n\n';
  message += '---\n\n';

  // Datos del comprador
  message += 'DATOS DEL COMPRADOR:\n';
  message += 'Nombre: ' + name + '\n';
  message += 'Telefono: ' + phone + '\n';
  const email = document.getElementById('checkoutEmail')?.value;
  if (email) message += 'Email: ' + email + '\n';
  message += 'Ciudad: ' + city + '\n';
  message += 'Direccion: ' + address + '\n\n';
  message += '---\n\n';

  // Agrupar productos por categoria
  const byCategory = {};
  cart.forEach(item => {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  });

  // Listar productos por categoria
  const categoryNames = {
    cascos: 'CASCOS',
    uniformes: 'UNIFORMES',
    botas: 'BOTAS',
    protecciones: 'PROTECCIONES'
  };

  message += 'PRODUCTOS:\n';
  Object.keys(byCategory).forEach(category => {
    message += '\n' + (categoryNames[category] || category.toUpperCase()) + ':\n\n';
    byCategory[category].forEach((item) => {
      message += '- ' + item.name + '\n';
      message += '  Talla: ' + item.selectedSize + '\n';
      message += '  Cantidad: ' + item.quantity + '\n';
      message += '  Precio: ' + formatPrice(item.priceNum * item.quantity) + '\n\n';
    });
  });

  message += '---\n\n';
  message += 'TOTAL DEL PEDIDO: ' + formatPrice(getCartTotal()) + '\n\n';
  message += '---\n\n';

  // Metodo de pago seleccionado
  const paymentMethodNames = {
    'nequi': 'Nequi',
    'daviplata': 'Daviplata',
    'transferencia': 'Transferencia bancaria',
    'efectivo': 'Efectivo contra entrega',
    'tarjeta': 'Tarjeta de credito/debito (Proximamente)'
  };

  message += 'METODO DE PAGO: ' + (paymentMethodNames[selectedPaymentMethod] || selectedPaymentMethod) + '\n\n';
  message += '---\n\n';

  message += 'Por favor, confirmen disponibilidad y me indican los pasos a seguir para completar mi compra. Gracias!';

  return message;
}

// Seleccionar metodo de pago
function selectPaymentMethod(method) {
  if (method === 'tarjeta') {
    return; // Deshabilitado
  }
  selectedPaymentMethod = method;

  // Actualizar UI
  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector('.payment-method-btn[data-method="' + method + '"]');
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

function showNotification(message, type) {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'notification notification-' + type;
  notification.textContent = message;

  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '100px',
    right: '30px',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: '600',
    zIndex: '10000',
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

// ==================== GLOBALES ====================

window.MXZONECart = {
  loadCart: loadCart,
  addToCart: addToCart,
  removeFromCart: removeFromCart,
  updateQuantity: updateQuantity,
  updateSize: updateSize,
  clearCart: clearCart,
  getCartTotal: getCartTotal,
  getCartItems: function() { return cart; }
};

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

// ==================== INICIALIZACION ====================

document.addEventListener('DOMContentLoaded', () => {
  loadCart();

  // Delegacion de eventos para clicks en el documento
  document.addEventListener('click', (e) => {
    // Abrir carrito (boton header)
    if (e.target.id === 'cartBtn' || e.target.closest('#cartBtn')) {
      e.preventDefault();
      const cartModal = document.getElementById('cartModal');
      if (cartModal) {
        cartModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateCartModal();
      } else {
        window.location.href = 'shop.html?opencart=1';
      }
    }

    // Cerrar carrito (boton X)
    if (e.target.id === 'cartClose' || e.target.closest('#cartClose')) {
      closeCart();
    }

    // Cerrar carrito (overlay)
    if (e.target.id === 'cartOverlay' || e.target.closest('#cartOverlay')) {
      closeCart();
    }

    // Boton COMPRAR -> abrir checkout
    if (e.target.id === 'buyBtn' || e.target.closest('#buyBtn')) {
      e.preventDefault();
      openCheckout();
    }

    // Boton VOLVER AL CARRITO
    if (e.target.id === 'backToCartBtn' || e.target.closest('#backToCartBtn')) {
      e.preventDefault();
      closeCheckout();
      window.openCart();
    }

    // Boton ENVIAR PEDIDO POR WHATSAPP
    if (e.target.id === 'checkoutBtn' || e.target.closest('#checkoutBtn')) {
      e.preventDefault();

      const name = document.getElementById('checkoutName')?.value.trim();
      const phone = document.getElementById('checkoutPhone')?.value.trim();
      const city = document.getElementById('checkoutCity')?.value.trim();
      const address = document.getElementById('checkoutAddress')?.value.trim();

      if (!name || !phone || !city || !address) {
        showNotification('Completa todos los campos obligatorios', 'error');
        return;
      }
      if (!selectedPaymentMethod) {
        showNotification('Selecciona un metodo de pago', 'error');
        return;
      }

      const message = buildWhatsAppMessage(name, phone, city, address);
      const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
      window.open(url, '_blank');
    }

    // Vaciar carrito
    if (e.target.id === 'clearCartBtn' || e.target.closest('#clearCartBtn')) {
      if (confirm('Estas seguro de vaciar el carrito?')) {
        clearCart();
      }
    }

    // Cerrar checkout con click en overlay
    if (e.target.id === 'checkoutOverlay' || e.target.closest('#checkoutOverlay')) {
      closeCheckout();
    }

    // Boton X del checkout
    if (e.target.id === 'checkoutClose' || e.target.closest('#checkoutClose')) {
      closeCheckout();
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const cartModal = document.getElementById('cartModal');
      const checkoutOverlay = document.getElementById('checkoutOverlay');
      if (checkoutOverlay && checkoutOverlay.classList.contains('active')) {
        closeCheckout();
      } else if (cartModal && cartModal.classList.contains('active')) {
        closeCart();
      }
    }
  });

  // Auto-open si viene de otra pagina con ?opencart=1
  if (window.location.search.includes('opencart=1')) {
    setTimeout(() => {
      const cartModal = document.getElementById('cartModal');
      if (cartModal) {
        cartModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateCartModal();
      }
      // Limpiar param sin recargar
      if (window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('opencart');
        window.history.replaceState({}, document.title, url.toString());
      }
    }, 500);
  }
});

// Actualizar WhatsApp flotante con productos del carrito
function updateFloatingWhatsApp() {
  const floatBtn = document.getElementById('whatsappFloat');
  if (!floatBtn) return;

  if (cart.length === 0) {
    // Sin productos - mensaje generico
    floatBtn.href = 'https://wa.me/' + WHATSAPP_NUMBER;
    floatBtn.title = 'Contactar por WhatsApp';
  } else {
    // Con productos - mensaje con lista del carrito
    const itemsList = cart.map((item, i) => (i + 1) + '. ' + item.name + ' (' + item.selectedSize + ') - ' + item.price).join('\n');
    const message = 'Hola MXZONE!\n\nTengo estos productos en mi carrito:\n\n' + itemsList + '\n\nTotal: ' + formatPrice(getCartTotal()) + '\n\nMe ayudan con el pedido?';
    floatBtn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
    floatBtn.title = 'WhatsApp (' + cart.length + ' productos)';
  }
}
