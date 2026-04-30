/**
 * MXZONE STORE - Configuración Centralizada
 * Categorías, marcas y configuración global
 * 
 * NOTA: Las categorías se cargan dinámicamente desde el CMS de Categorías
 * Este archivo es un fallback por si el CMS no está disponible
 */

window.MXZONE_CONFIG = {
  version: 'v6-20260430',
  
  // Categorías base (se sobrescriben con las del CMS si están disponibles)
  categories: {
    'cascos': { label: 'Cascos', icon: '⛑️', order: 1, parent: '' },
    'uniformes': { label: 'Uniformes', icon: '👕', order: 2, parent: '' },
    'jersey': { label: 'Jerseys', icon: '👕', order: 3, parent: '' },
    'botas': { label: 'Botas', icon: '👢', order: 4, parent: '' },
    'guantes': { label: 'Guantes', icon: '🧤', order: 5, parent: '' },
    'gafas': { label: 'Gafas', icon: '👓', order: 6, parent: '' },
    'protecciones': { label: 'Protecciones', icon: '🛡️', order: 7, parent: '' },
    'gorras': { label: 'Gorras', icon: '🧢', order: 8, parent: '' },
    'maletas': { label: 'Maletas', icon: '🎒', order: 9, parent: '' },
    'accesorios': { label: 'Accesorios', icon: '🔧', order: 10, parent: '' },
    'uniformes-ninos': { label: 'Uniformes Niños', icon: '👶', order: 11, parent: 'ninos' },
    'cascos-ninos': { label: 'Cascos Niños', icon: '🧒', order: 12, parent: 'ninos' },
    'botas-ninos': { label: 'Botas Niños', icon: '👣', order: 13, parent: 'ninos' },
    'guantes-ninos': { label: 'Guantes Niños', icon: '🤚', order: 14, parent: 'ninos' },
    'gafas-ninos': { label: 'Gafas Niños', icon: '👓', order: 15, parent: 'ninos' },
    'protecciones-ninos': { label: 'Protecciones Niños', icon: '🛡️', order: 16, parent: 'ninos' }
  },
  
  // Categorías Padre
  parentCategories: {
    'todos': { label: 'Todo', icon: '📦', order: 0 },
    'ninos': { label: 'Niños', icon: '🧒', order: 100 }
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
  imageVersion: 'v6-20260430',
  
  // URL base del CMS
  cmsBaseUrl: 'cms/productos/',
  
  // URL base del CMS de Categorías
  categoriesBaseUrl: 'cms/categorias/'
};

// Función para cargar categorías desde el CMS
async function loadCategoriesFromCMS() {
  try {
    const response = await fetch(window.MXZONE_CONFIG.categoriesBaseUrl + 'index.json?v=' + window.MXZONE_CONFIG.imageVersion);
    if (!response.ok) {
      console.warn('⚠️ No se pudo cargar index.json de categorías, usando configuración local');
      return false;
    }
    
    const indexData = await response.json();
    const categoryFiles = indexData.files || [];
    
    if (categoryFiles.length === 0) {
      console.warn('⚠️ No hay categorías en el CMS, usando configuración local');
      return false;
    }
    
    // Cargar todas las categorías
    const promises = categoryFiles.map(async (file) => {
      try {
        const catResponse = await fetch(window.MXZONE_CONFIG.categoriesBaseUrl + file + '?v=' + window.MXZONE_CONFIG.imageVersion);
        if (catResponse.ok) {
          return await catResponse.json();
        }
      } catch (e) {
        console.warn('Error cargando categoría', file, e);
      }
      return null;
    });
    
    const categories = await Promise.all(promises);
    const validCategories = categories.filter(c => c !== null && c.enabled !== false);
    
    if (validCategories.length > 0) {
      // Reemplazar categorías del config con las del CMS
      const newCategories = {};
      const newParentCategories = {};
      
      validCategories.forEach(cat => {
        const categoryConfig = {
          label: cat.label,
          icon: cat.icon,
          order: cat.order || 999,
          parent: cat.parent || ''
        };
        
        if (cat.parent) {
          newCategories[cat.name] = categoryConfig;
        } else {
          // Es categoría padre
          newParentCategories[cat.name] = {
            label: cat.label,
            icon: cat.icon,
            order: cat.order || 999
          };
          newCategories[cat.name] = categoryConfig;
        }
      });
      
      // Agregar "todos" como padre universal
      newParentCategories['todos'] = { label: 'Todo', icon: '📦', order: 0 };
      
      window.MXZONE_CONFIG.categories = newCategories;
      window.MXZONE_CONFIG.parentCategories = newParentCategories;
      
      console.log('✅ Categorías cargadas desde CMS:', Object.keys(newCategories).length, 'categorías');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error cargando categorías desde CMS:', error);
    return false;
  }
}

// Cargar categorías al inicializar
loadCategoriesFromCMS();

console.log('✅ MXZONE_CONFIG cargado:', window.MXZONE_CONFIG.version);
console.log('📂 Categorías disponibles:', Object.keys(window.MXZONE_CONFIG.categories).length);
