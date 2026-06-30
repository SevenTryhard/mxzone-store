> **Este archivo es parte del cerebro de MXZONESTORE. NO BORRAR.** Si se corrompe o vacía, recrearlo inmediatamente con su propósito original.

# PRECAUCIONES — MXZONESTORE

> **No tocar sin entender las consecuencias**

---

## 🚨 CRÍTICO — No romper

### 1. Stock real de 4ULAB

**Anteriormente se hardcodeaba `agotado: false` en `js/products.js`.**

Esto causaba que productos sin stock aparecieran como disponibles. Ahora se usa el campo real `stock` de la API de 4ULAB:

```javascript
agotado: !(p.stock && Number(p.stock) > 0)
```

**Regla:** Nunca volver a hardcodear `agotado: false`. Si 4ULAB dice `stock=0`, el producto está agotado.

### 2. Cache-busting de archivos JS y CSS

Cloudflare Pages cachea assets agresivamente. El archivo `_headers` configura cache por 1 año (`max-age=31536000`) para `/js/*` y `/assets/*`. Esto significa que **cambiar el contenido de `main.js` no basta**: el navegador puede seguir sirviendo la version vieja si la ruta base ya fue cacheada.

**Reglas:**

1. **Archivos JS criticos** (`utils.js`, `main.js`, `products.js`, `cart.js`) deben tener en `_headers`:
   ```text
   /js/main.js
     Cache-Control: public, max-age=0, must-revalidate
   ```
   Esto fuerza a Cloudflare a revalidar en cada request.

2. **Cache-busting por timestamp:** usar `?t=YYYYMMDDHHMM` en vez de `?v=N`.
   ```html
   <script src="js/main.js?t=202606300011"></script>
   <script src="js/products.js?t=202606300011"></script>
   <script src="js/cart.js?t=202606300011"></script>
   <script src="js/utils.js?t=202606300011"></script>
   <link rel="stylesheet" href="css/styles.css?t=202606300011">
   ```

3. **Mantener el mismo timestamp en TODOS los HTML.** No mezclar `t=202606300011` en index y `t=202606290303` en shop.

4. **Script de cache-busting:** existe un script helper en el equipo (`bump-cache-timestamp.ps1`) que actualiza todos los HTML con el timestamp actual.

> **Consecuencia real #1 (cache-busting insuficiente):** mezclar versiones entre `index.html` (`v=27`) y `shop.html` (`v=29`) provocó que `main.js` antiguo coexistiera con `products.js` nuevo. Eso ocultó un `TypeError: sizes.map is not a function` en `renderSizeChips` al seleccionar "Jerseys".

> **Consecuencia real #2 (cache de 1 año):** aunque se subio `main.js` con fix para #017, el navegador seguia cargando `main.js?v=32` porque Cloudflare Pages cacheaba `/js/*` por `max-age=31536000`. El fix no llego a produccion hasta que se cambio `_headers` a `max-age=0, must-revalidate` y se uso `?t=TIMESTAMP`.

### 3. Consistencia del header entre páginas

Todas las páginas deben compartir el **mismo header**: mismo logo, mismos nav links, mismo botón de carrito con SVG, mismo theme toggle. Si una página tiene el botón del carrito vacío o links absolutos diferentes, los indicadores de navegación activa y el icono del carrito fallan.

> **Consecuencia real:** `promociones.html`, `about.html`, `contact.html` y otras 21 páginas tenían el carrito sin SVG, y usaban URLs absolutas (`https://www.mxzonestore.com/...`) en los nav links. El active state solo funcionaba en `index.html` y el icono no se veía en el resto.

### 3. URL de 4ULAB

- **Real:** `https://4-ulab.vercel.app` (con guion `-`)
- **NO ES:** `https://4ulab.vercel.app`

**Consecuencia:** CORS falla, tienda no carga productos.

### 4. Categorías `null` de 4ULAB

Algunos productos vienen con `category: null`. Antes se forzaban a "accesorios", lo que rompía filtros.

Ahora se marcan como `sin-categoria` y se renderizan, pero el cliente debe revisar/categorizarlos en 4ULAB.

### 5. Productos con nombre vacío o precio 0 en 4ULAB

Ejemplos encontrados en producción (project 1): IDs 154, 1877, 1878. Se detectan tarjetas con:
- Nombre: "Producto sin nombre"
- Precio: `$0`
- Categoría: `General` o vacía

**Regla:** El frontend los filtra y no los renderiza. El cliente debe corregir/eliminar esos productos directamente en el dashboard de 4ULAB (`https://4-ulab.vercel.app/dashboard/mxzonestore/products`).

---

## ✅ VERIFICACIÓN POST-CAMBIO

Después de editar cualquier archivo JS, CSS o HTML:

1. `node --check js/products.js`
2. `node --check js/cart.js`
3. `node --check js/product-detail.js`
4. `node --check js/main.js`
5. Actualizar timestamp `?t=YYYYMMDDHHMM` en todos los HTML con `bump-cache-timestamp.ps1`.
6. Verificar que `_headers` tenga `max-age=0, must-revalidate` para `utils.js`, `main.js`, `products.js`, `cart.js`.
7. Un solo commit/push por sesión.
8. Esperar deploy automático de Cloudflare Pages.
9. Probar en incógnita + hard refresh (Ctrl+Shift+R): home, shop, producto, carrito, checkout.
10. En consola, verificar que se cargó el JS nuevo:
   ```js
   document.querySelector('script[src*="main.js"]')?.src
   ```

---

## 📞 CONTACTO

Si algo se rompe: `git revert HEAD` o usar el backup tag más reciente.

**Backup actual:** `backup-before-mx-priority-fixes-20260628-1557`

**Última actualización:** 2026-06-28
