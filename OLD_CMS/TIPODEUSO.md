# OLD_CMS — Documentación del Sistema Anterior (Backup)

> **Estado:** ARCHIVADO — Este sistema fue reemplazado por 4ULAB CMS.  
> **Fecha de backup:** 2026-06-04  
> **Autor:** MXZONE STORE Team  
> **Razón de archivo:** Transición a 4ULAB CMS (PostgreSQL + Vercel)

---

## ¿Qué era este sistema?

CMS híbrido que combinaba:
- **Cloudflare Pages** (hosting estático)
- **Cloudflare D1** (base de datos SQLite serverless)
- **CloudCannon** (admin visual para editores no técnicos)
- **Cloudflare Workers** (API REST sobre D1)
- **GitHub Actions** (sync automático JSON → repo)

---

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CloudCannon   │────▶│  Cloudflare D1  │────▶│ Cloudflare      │
│   (Admin UI)      │     │   (SQLite DB)     │     │   Workers       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Edición visual          Almacenamiento        API REST:
   de productos          de productos          /api/store/products
                                                     │
                                                     ▼
                                              ┌─────────────────┐
                                              │  GitHub Actions │
                                              │   (Sync JSON)    │
                                              └─────────────────┘
                                                     │
                                                     ▼
                                              ┌─────────────────┐
                                              │ Cloudflare Pages │
                                              │ (Frontend estático)
                                              └─────────────────┘
```

---

## Configuración

Archivo original: `cms/config.js`

```javascript
window.MXZONE_CONFIG = {
  version: 'v9-20260510',
  projectKey: 'SevenTryhard/mxzone-store',
  cmsBaseUrl: 'cms/productos/',
  categoriesBaseUrl: 'cms/categorias/',
  imageVersion: 'v9-20260510',
  cmsApiUrl: 'https://growisoulsand.pages.dev'  // Cloudflare Pages del CMS
};
```

---

## Flujo de datos

### 1. Almacenamiento de productos

Cada producto era un archivo JSON en `cms/productos/`:

```json
{
  "name": "CASCO FOX V1 TOXSYK NEGRO",
  "category": "cascos",
  "price": "$1.429.900",
  "sizes": "S/M/L",
  "badge": "Top Ventas",
  "image": "assets/images/cascos/casco-fox.jpg",
  "images": ["assets/images/cascos/casco-fox-1.jpg"],
  "agotado": false
}
```

### 2. Indexación

`cms/productos/index.json` listaba todos los archivos:
```json
{
  "files": ["casco-fox.json", "casco-alpinestars.json", ...]
}
```

### 3. Carga en el frontend

`js/products.js` cargaba en este orden:
1. **Intentar API REST** (`cmsApiUrl + /api/store/products`)
2. **Fallback a archivos JSON** (`cmsBaseUrl + index.json`)
3. **Renderizado** con `createProductCard()` usando templates HTML

### 4. Sistema de imágenes

- Imágenes locales en `assets/images/`
- Imágenes CloudCannon en `cloudvent.net` (CDN automático)
- Versionado con `?v=IMAGE_VERSION` para cache busting

---

## APIs del sistema viejo

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/store/products` | Lista todos los productos (D1) |
| `GET /api/store/products?category=X` | Productos por categoría |
| `GET cms/productos/index.json` | Índice de archivos JSON |
| `GET cms/productos/{slug}.json` | Producto individual |

---

## Categorías soportadas

```javascript
'cascos': 'Cascos',
'uniformes': 'Uniformes',
'jersey': 'Jerseys',
'pantalones': 'Pantalones',
'botas': 'Botas',
'protecciones': 'Protecciones',
'gafas': 'Gafas',
'guantes': 'Guantes',
'infantil': 'Niños / Infantil'
```

---

## Funciones principales (resumen)

### `loadProducts()`
Carga productos desde API primero, falla a JSON estáticos.

### `createProductCard(product)`
Genera HTML de tarjeta de producto con:
- Imagen principal + galería
- Selector de tallas
- Botón "Ver" (a product.html)
- Botón "Agregar" al carrito

### `encodeImagePath(path)`
Corrige rutas CloudCannon rotas (`/https:/` → `https://`).

### `renderFeaturedProducts()`
Renderiza productos destacados en la homepage por categoría.

### `renderRecomendados()`
Renderiza carrusel de productos más caros.

---
## Problemas conocidos

1. **API externa no controlable** (`growisoulsand.pages.dev`) — Tercero gestionaba los datos
2. **Cache agresivo** — Requería `?nocache=` en desarrollo
3. **Formato JSON fragmentado** — Productos en archivos separados, difícil de versionar
4. **Sin sistema de autenticación** — Cualquiera podía editar en CloudCannon
5. **Sin historial de cambios** — No se podía ver quién editó qué y cuándo
6. **D1 limitado** — 500MB gratis, sin backups automáticos

---

## ¿Cómo restaurar este sistema?

Si necesitás volver a este CMS:

1. **Restaurar `cms/config.js`** desde backup:  
   `cp OLD_CMS/config.js.backup cms/config.js`

2. **Restaurar `js/products.js`** desde backup:  
   `cp OLD_CMS/products.js.backup js/products.js`

3. **Reactivar CloudCannon** (si seguís pagando) o usar JSON locales

4. **Commit y push**:
   ```bash
   git add -A
   git commit -m "Rollback to OLD_CMS"
   git push origin main
   ```

---

## Contacto y soporte

- **Repositorio:** `https://github.com/SevenTryhard/mxzone-store`
- **CMS anterior:** `https://growisoulsand.pages.dev`
- **Actual (4ULAB):** `https://4ulab.vercel.app`

---

**Documentación generada automáticamente el 2026-06-04**  
**Para consultas técnicas:** Revisar `OLD_CMS/` en el repositorio.
