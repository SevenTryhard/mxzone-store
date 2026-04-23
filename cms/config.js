/**
 * MXZONE STORE - Configuración Centralizada
 * Categorías, marcas y configuración global
 */

window.MXZONE_CONFIG = {
  version: 'v5-20260423',
  
  categories: {
    'cascos': { label: 'Cascos', icon: '⛑️', order: 1 },
    'uniformes': { label: 'Uniformes', icon: '👕', order: 2 },
    'jersey': { label: 'Jerseys', icon: '👕', order: 3 },
    'pantalones': { label: 'Pantalones', icon: '👖', order: 4 },
    'botas': { label: 'Botas', icon: '👢', order: 5 },
    'guantes': { label: 'Guantes', icon: '🧤', order: 6 },
    'gafas': { label: 'Gafas', icon: '👓', order: 7 },
    'protecciones': { label: 'Protecciones', icon: '🛡️', order: 8 },
    'gorras': { label: 'Gorras', icon: '🧢', order: 9 },
    'maletas': { label: 'Maletas', icon: '🎒', order: 10 },
    'accesorios': { label: 'Accesorios', icon: '🔧', order: 11 }
  },
  
  brands: {
    'fox': { label: 'Fox', icon: '🦊' },
    'fly': { label: 'Fly', icon: '🪰' },
    'alpinestars': { label: 'Alpinestars', icon: '⭐' },
    'leatt': { label: 'Leatt', icon: '🛡️' },
    'troy-lee': { label: 'Troy Lee', icon: '🎨' },
    'oneal': { label: 'Oneal', icon: '1️⃣' },
    'airoh': { label: 'Airoh', icon: '🅰️' },
    'acerbis': { label: 'Acerbis', icon: '🔺' },
    'gaerne': { label: 'Gaerne', icon: '👢' },
    'fxr': { label: 'FXR', icon: '❌' },
    'thor': { label: 'Thor', icon: '🔨' },
    'ktm': { label: 'KTM', icon: '🟠' },
    'other': { label: 'Otras', icon: '📦' }
  },
  
  // Cache buster para imágenes - actualizar cuando se cambien fotos
  imageVersion: 'v5-20260423',
  
  // URL base del CMS
  cmsBaseUrl: 'cms/productos/'
};

console.log('✅ MXZONE_CONFIG cargado:', window.MXZONE_CONFIG.version);
