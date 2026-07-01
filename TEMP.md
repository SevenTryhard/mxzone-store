# TEMP.md — MXZONESTORE Bugs & Fixes Tracker

> Archivo temporal de bugs activos. Se elimina cuando todos los items estén resueltos.
> Regla del proyecto: si se elimina, documentar en `BASURA.md` y `HISTORIAL.md`.

## Registro de errores MX STOREID

| ID | Error | Detalle | Estado |
|---|---|---|---|
| #001 | Salida del Carrito | Falta botón de cierre (Close/Back) en la interfaz móvil. | **SOLUCIONADO** |
| #002 | Buscador (Redirección) | El query de búsqueda redirige al home/catálogo sin filtrar resultados. | Solucionado anteriormente |
| #003 | Buscador/Menú (Funcionalidad) | Pérdida de estado (state) de los elementos al navegar a secciones internas. | Solucionado anteriormente |
| #004 | Filtros (Diseño) | Errores en el CSS/Grid de los filtros, provocando superposición o desorden. En mobile los botones (TODO/CASCOS) no filtran. **sub-issue Jerseys** — el chip Jerseys se activa pero muestra productos de Uniformes. | **SOLUCIONADO** |
| #005 | Control de Cantidad | Falta la lógica de los botones + / - en el selector de producto. El carrito corta items en mobile/PC y no se ve el botón para sumar. | **SOLUCIONADO** |
| #006 | Carga de Producto | Fallo en el fetch de datos (nombre/precio) desde la base de datos o API. | **SOLUCIONADO** (parche frontend; corregir IDs 154, 1877, 1878 en CMS) |
| #007 | Validación de Tallas | El validator requiere talla incluso en productos que no la usan (boolean check erróneo). | **SOLUCIONADO** (función `shouldRequireSize` en `utils.js`; aplica en tarjeta, modal y product-detail) |
| #008 | Botón WhatsApp | Alineación incorrecta en el contenedor (posible error de flexbox o margin). | Pendiente |
| #009 | Contraste (Light Mode) | Color de fuente demasiado oscuro sobre fondo claro (violación WCAG). | Pendiente |
| #010 | Menú Desplegable | Error de event listener: el menú se cierra al hacer blur o clic fuera accidental. | Pendiente |
| #011 | Promociones (Contraste) | Texto informativo sin legibilidad sobre el fondo en modo light. | **SEMI-RESUELTO** (impacto mínimo; no tocar por riesgo de regresión) |
| #012 | Imagen Promoción | Fallo en la carga de activos (assets); imagen rota o ruta inexistente. | Pendiente |
| #013 | Info. Promociones | Falta de contraste severo en componentes de texto dinámico. | **SEMI-RESUELTO** (impacto mínimo; no tocar por riesgo de regresión) |
| #014 | Icono Carrito | Problema de color de SVG/icono que no cambia según el tema (light/dark). Además, en 24 páginas el botón del carrito estaba vacío (sin SVG). | **SOLUCIONADO** |
| #015 | Redes Sociales | Faltan iconos en los botones y los enlaces no tienen href configurado. | Pendiente (siguiente prioridad) |
| #016 | Iconos Inicio | Fallo en la carga de fuentes de iconos (FontAwesome/Material Icons) o CDN. | Pendiente (siguiente prioridad) |
| #017 | Filtro "Todo" | El renderizado de secciones vacías ocupa espacio en el DOM, empujando contenido hacia abajo. | **SOLUCIONADO** |
| #018 | Filtro de Tallas | Filtro incompleto o datos no cargados totalmente en el array de tallas disponibles. | Pendiente |

## Recomendaciones base

- Prioridad alta: #001, #002, #006, #014, #017 afectan conversión/usabilidad base.
- **Nueva prioridad alta**: sub-issue Jerseys dentro de #004 — filtro activo pero productos tienen categoría `uniformes` en vez de `jersey`.
- Gestión de temas: revisar `themes.css` / estilos globales para #009, #011, #013, #014, #016.
- Validaciones: revisar lógica de producto (#007) para hacer la talla condicional (`if product.hasSizes`).

## Sesión actual

- Fecha: 2026-06-30 (noche)
- Scope: menú mobile scrolleable y sin iconos feos en `index.html`; links "Inicio" definitivos con `href="index.html"` y texto "Inicio" en 17 páginas; cache-busting a `202606300128`; commit/push a `main`.
- Estado: cerrada. Pendientes conscientes: #011/#013 semi-resueltos; próxima sesión recomendada #015/#015.

## Sesión 2026-07-01 — Promociones en tiempo real desde 4ULAB

- Scope: conectar la página de promociones al CMS de 4ULAB (Pilar 7 de NEXTUPDATE.md).
- `js/promotions.js`: `loadPromotions()` ahora lee la API pública en tiempo real
  (`https://4-ulab.vercel.app/api/public/promotions?project=1`) y mapea la forma
  de la API a la forma interna del storefront (selector de tallas y checkout por
  WhatsApp intactos). Antes leía 4 JSON estáticos que mostraban combos inexistentes.
- **Borrado** (documentado aquí por falta de `BASURA.md` en este repo):
  - `cms/promociones/combo-principiante.json`
  - `cms/promociones/combo-intermedio.json`
  - `cms/promociones/combo-profesional.json`
  - `cms/promociones/combo-premium.json`
  - Motivo: reemplazados por las promos reales administradas en el CMS.
- Las 4 promos de prueba viven en 4ULAB (projectId 1), estrategia `fixed_total`.

## Sesión 2026-07-01 — WEB STATS: tracking site-wide + conversiones

- Scope: cablear el nuevo sub-app WEB STATS del CMS de 4ULAB en la tienda MX.
- **Snippet de tracking site-wide**: `https://4-ulab.vercel.app/tracking-snippet.js`
  ahora se carga en las 27 páginas (antes solo index/product/shop, y encima el
  endpoint devolvía 404 → el tracking NUNCA disparaba). Se inyectó
  `window.__4ULAB_PROJECT_ID__ = 1;` + el `<script>` del snippet antes de `</body>`
  en las 24 páginas que faltaban. Cache-buster de `cart.js` subido a `202607011500`.
- **Conversión en checkout WhatsApp** (`js/cart.js`): nueva función
  `trackCheckoutConversion()` (100% defensiva, try/catch) que dispara
  `fourUTrackTraffic('conversion', {label:'whatsapp-checkout'})` + una conversión
  por producto (`fourUTrack('conversion', item.id)`) al enviar el pedido. Se agregó
  el campo `id: product.id || null` al `cart.push` para poder atribuir por producto.
- Los product cards de `js/products.js` YA tenían `data-4u-track`/`data-4u-product-id`;
  solo faltaba que el snippet cargara. Ahora vistas/clicks/addToCart se registran solos.
- **Pendiente de verificación**: comprobar en vivo una vez que el origin de
  mxzonestore.com (HTTP 522) se recupere. Commit MX `2b4bd3e`, pushed a `main`.

## Próxima sesión — inicio recomendado

1. **LEER PRIMERO `C:\Users\seven\4ULAB\APP\NEXTUPDATE.md`** — contiene la visión conceptual del próximo gran paso del proyecto.
2. Verificar en vivo WEB STATS en MX (snippet cargando + eventos llegando) cuando el 522 se resuelva.
3. Luego revisar `TEMP.md` y atacar #015 (redes sociales sin iconos/links) y #016 (iconos de inicio no cargan fuentes CDN).
