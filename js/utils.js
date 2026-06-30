/**
 * MXZONE STORE - Shared Utilities
 * Centralized helpers used across main.js, products.js, cart.js, product-detail.js
 */

// Production-safe logger: only emits on localhost / 127.0.0.1
function mxLog(...args) {
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') {
    console.log(...args);
  }
}

// Brand detector — returns {name, icon} object
function getBrand(productName) {
  const n = productName.toLowerCase();
  if (n.includes('fox')) return { name: 'Fox', icon: '🦊' };
  if (n.includes('fly')) return { name: 'Fly', icon: '🪰' };
  if (n.includes('alpinestars') || n.includes('alpine')) return { name: 'Alpinestars', icon: '⭐' };
  if (n.includes('leatt')) return { name: 'Leatt', icon: '🛡️' };
  if (n.includes('troy lee')) return { name: 'Troy Lee', icon: '🎨' };
  if (n.includes('oneal')) return { name: 'Oneal', icon: '⚡' };
  if (n.includes('airoh')) return { name: 'Airoh', icon: '🇮🇹' };
  if (n.includes('acerbis')) return { name: 'Acerbis', icon: '🔧' };
  if (n.includes('gaerne')) return { name: 'Gaerne', icon: '👢' };
  if (n.includes('fxr')) return { name: 'FXR', icon: '❄️' };
  if (n.includes('thor')) return { name: 'Thor', icon: '⚡' };
  if (n.includes('ktm')) return { name: 'KTM', icon: '🧡' };
  return { name: 'Otro', icon: '📦' };
}

// Create URL-safe slug from product name
function createProductSlug(productName) {
  return productName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Normalize any brand string to a consistent slug used in chips and cards
function normalizeBrandSlug(brand) {
  if (!brand || typeof brand !== 'string') return 'otro';
  return brand
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Encode spaces in image paths to %20
function encodeImagePath(path) {
  return path.replace(/ /g, '%20');
}

/**
 * Determina si un producto requiere que el usuario seleccione una talla.
 * Reglas:
 *   - Sin tallas, vacío, null/undefined, "Consultar" o "Única" → NO requiere.
 *   - Una sola talla real (ej: "M") → SÍ requiere, porque el usuario debe elegir.
 *   - Múltiples tallas → SÍ requiere.
 */
function shouldRequireSize(sizes) {
  if (!sizes || typeof sizes !== 'string') return false;
  const normalized = sizes.trim().toUpperCase();
  if (!normalized || normalized === 'CONSULTAR' || normalized === 'ÚNICA' || normalized === 'UNICA') return false;

  // Si tras separar por / queda solo un token vacío o Única, no requiere
  const parts = normalized
    .split('/')
    .map(s => s.trim())
    .filter(s => s !== '' && s !== 'UNICA' && s !== 'ÚNICA');

  return parts.length >= 1;
}
