/**
 * MXZONE STORE - Configuración CMS
 * Actualizado: 2026-06-04
 * 
 * SISTEMA ACTIVO: 4ULAB CMS (PostgreSQL + Vercel)
 * https://4ulab.vercel.app
 * 
 * SISTEMA ANTERIOR ARCHIVADO: OLD_CMS/
 * Ver OLD_CMS/TIPODEUSO.md para documentación del sistema viejo.
 */

window.MXZONE_CONFIG = {
  version: 'v11-20260604-4ULAB',

  // ═════════════════════════════════════════════
  // 4ULAB CMS (ACTIVO)
  // ═════════════════════════════════════════════
  // El frontend ahora carga productos desde el CMS de 4ULAB.
  // La API pública devuelve JSON con formato unificado.
  cmsApiUrl: 'https://4ulab.vercel.app',
  projectKey: 'mxzonestore', // Project ID en base de datos

  // Endpoint público de productos (CORS abierto)
  publicProductsEndpoint: '/api/public/products',

  // ═════════════════════════════════════════════
  // OLD_CMS (ARCHIVADO — Solo como fallback de emergencia)
  // ═════════════════════════════════════════════
  // Para reactivar el CMS anterior, copiar desde OLD_CMS/
  // Ver OLD_CMS/TIPODEUSO.md
  
  oldCmsBaseUrl: 'cms/productos/',
  oldCategoriesBaseUrl: 'cms/categorias/',
  oldCmsApiUrl: 'https://growisoulsand.pages.dev',

  imageVersion: 'v10-20260604',
};

// ═════════════════════════════════════════════
// FUNCIONES DEL CMS ACTUAL
// ═════════════════════════════════════════════

/**
 * Carga productos desde 4ULAB CMS (API pública).
 * Fallback a OLD_CMS si el servidor responde con error.
 */
async function loadProductsFrom4ULAB() {
  try {
    const apiUrl = window.MXZONE_CONFIG.cmsApiUrl + 
                   window.MXZONE_CONFIG.publicProductsEndpoint + 
                   '?project=1';
    
    console.log('[4ULAB-CMS] Cargando productos desde:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const data = await response.json();
    const products = data.products || [];

    console.log('[4ULAB-CMS] Productos cargados:', products.length);
    return products;

  } catch (error) {
    console.warn('[4ULAB-CMS] Error:', error.message);
    console.log('[4ULAB-CMS] Fallback a OLD_CMS...');
    return loadProductsFromOldCMS();
  }
}

/**
 * Fallback: Carga desde OLD_CMS (Cloudflare Pages anterior).
 * Solo se ejecuta si 4ULAB CMS no responde.
 */
async function loadProductsFromOldCMS() {
  try {
    const apiUrl = window.MXZONE_CONFIG.oldCmsApiUrl + '/api/store/products';
    const response = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } });
    
    if (!response.ok) throw new Error('HTTP ' + response.status);
    
    const data = await response.json();
    console.log('[OLD_CMS] Fallback exitoso:', data.products ? data.products.length : 0, 'productos');
    return data.products || [];

  } catch (error) {
    console.error('[OLD_CMS] Fallback fallido:', error.message);
    return [];
  }
}

// ═════════════════════════════════════════════
// CATEGORÍAS (Carga desde API de 4ULAB)
// ═════════════════════════════════════════════

async function loadCategoriesFrom4ULAB() {
  try {
    // Por ahora las categorías están hardcodeadas como fallback
    // En el futuro se puede crear /api/public/categories
    return false;
  } catch (error) {
    console.warn('[4ULAB-CMS] Error cargando categorías:', error);
    return false;
  }
}

// ═════════════════════════════════════════════
// INICIALIZACIÓN
// ═════════════════════════════════════════════

console.log('[4ULAB-CMS] Configuración cargada:', window.MXZONE_CONFIG.version);
console.log('[4ULAB-CMS] Endpoint activo:', window.MXZONE_CONFIG.cmsApiUrl + window.MXZONE_CONFIG.publicProductsEndpoint);

// Para compatibilidad con js/products.js
var loadProducts = loadProductsFrom4ULAB;
