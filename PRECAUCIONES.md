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

### 2. Cache-busting de archivos JS

Cloudflare Pages cachea assets agresivamente. Cada vez que se edita un archivo JS, **subir la versión** en todas las páginas HTML que lo cargan.

Ejemplo:

```html
<script src="js/products.js?v=17"></script>
```

**Regla:** Mantener la misma versión en TODOS los HTML. No mezclar `v=10` en index y `v=16` en shop.

### 3. URL de 4ULAB

- **Real:** `https://4-ulab.vercel.app` (con guion `-`)
- **NO ES:** `https://4ulab.vercel.app`

**Consecuencia:** CORS falla, tienda no carga productos.

### 4. Categorías `null` de 4ULAB

Algunos productos vienen con `category: null`. Antes se forzaban a "accesorios", lo que rompía filtros.

Ahora se marcan como `sin-categoria` y se renderizan, pero el cliente debe revisar/categorizarlos en 4ULAB.

---

## ✅ VERIFICACIÓN POST-CAMBIO

Después de editar cualquier archivo JS o HTML:

1. `node --check js/products.js`
2. `node --check js/cart.js`
3. `node --check js/product-detail.js`
4. Subir versión `?v=X` en todos los HTML.
5. Un solo commit/push por sesión.
6. Esperar deploy automático de Cloudflare Pages.
7. Probar en incógnita: home, shop, producto, carrito, checkout.

---

## 📞 CONTACTO

Si algo se rompe: `git revert HEAD` o usar el backup tag más reciente.

**Backup actual:** `backup-before-mx-priority-fixes-20260628-1557`

**Última actualización:** 2026-06-28
