/**
 * MXZONE STORE - Configuración Centralizada
 * Categorías, marcas y configuración global
 * 
 * NOTA: Las categorías se cargan dinámicamente desde el CMS de Categorías
 * Este archivo es un fallback por si el CMS no está disponible
 */

window.MXZONE_CONFIG = {
  version: 'v9-20260510',
  
  projectKey: 'SevenTryhard/mxzone-store',
  cmsBaseUrl: 'cms/productos/',
  categoriesBaseUrl: 'cms/categorias/',
  imageVersion: 'v9-20260510',
  cmsApiUrl: 'https://growisoulsand.pages.dev'
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
var catCount = window.MXZONE_CONFIG.categories ? Object.keys(window.MXZONE_CONFIG.categories).length : 0;
console.log('📂 Categorías disponibles:', catCount);
