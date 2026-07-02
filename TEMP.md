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

## Sesión 2026-07-02 (MODO NIGHT) — carrito, quickview, product.html deshabilitada + deploy

- **Carrito (boton cerrar inaccesible en mobile)**: root cause identico al checkout —
  `.cart-modal-content { height: 95vh }` con `.cart-modal { align-items: flex-end }`
  empujaba el header (donde vive el boton X) por detras del chrome del navegador iOS.
  Fix: fallback `height: 95dvh` en las DOS media queries `@media (max-width:768px)`
  de `.cart-modal-content` (`css/styles.css`). Ahora el header y el boton cerrar
  siempre quedan dentro del viewport visible.
- **Boton "Ver" -> solo quickview**: en `js/products.js` el "Ver" era un
  `<a href="product.html">`. Ahora es `<button class="btn btn-secondary btn-ver">`
  sin navegacion. En `js/main.js` se quito `.btn-secondary` de la lista de exclusiones
  del click de la card, asi el click en "Ver" burbujea y abre el quickview (#productModal).
- **product.html deshabilitada**: agregado `<script>window.location.replace('shop.html')</script>`
  al inicio del `<head>` + `robots: noindex,nofollow`. Cualquier acceso directo redirige
  a la tienda. Verificado en vivo: `/product.html` -> 308 -> `/product` -> 200 sirviendo
  el redirect a shop.html. (Cloudflare static assets sirve las paginas sin `.html`.)
- **Cache-busting**: bump global de TODOS los `?t=\d{12}` a `202607020300` (111 refs, 27 HTML).
- **Deploy**: commit `7011faa` pushed a `main` + `node deploy.js` (486 assets, version
  `3fad60d5`). Verificado en vivo en **www.mxzonestore.com** (HTTP 200, 0.4s) sirviendo el
  nuevo build.
- **⚠️ PENDIENTE INFRA (no es codigo)**: el apex `mxzonestore.com` (sin www) sigue en
  **HTTP 522** ~39s. `www.mxzonestore.com` esta perfecto (200) y es el dominio canonico
  (canonical/og:url ya apuntan a www). El apex esta proxeado por Cloudflare pero rutea a
  un origin muerto. Fix (dashboard Cloudflare, 1 paso): agregar `mxzonestore.com` como
  **Custom Domain** del worker `mxzonestore` (igual que www) O crear una Redirect Rule
  `mxzonestore.com/* -> https://www.mxzonestore.com/$1` (301). NO se toco DNS de forma
  autonoma por falta de visibilidad del dashboard.

## Sesión 2026-07-02 (MODO NIGHT) — CRM lead capture desde checkout WhatsApp

- **Objetivo**: que cada comprador que envía el pedido por WhatsApp quede
  registrado como contacto (lead) en el CRM de 4ULAB (pedido explícito del usuario).
- **4ULAB (backend)**: nuevo endpoint público `POST /api/public/leads?project=1`
  (`src/app/api/public/leads/route.ts`). Upsert por teléfono (solo dígitos) o email,
  rate limit anti-spam (máx 20 leads/día por teléfono-email), dedupe de doble-submit
  (no repite interacción idéntica en 60s), crea contacto `status: lead` + interacción
  `type: whatsapp` con el detalle del pedido. Commit 4ULAB `5c35459`, deployed a Vercel.
- **MX (frontend)**: `js/cart.js` nueva función `captureLeadTo4ULAB()` (fire-and-forget,
  try/catch + `keepalive:true`, no bloquea el checkout). Se llama en los DOS handlers de
  envío (`#checkoutSubmit` centrado y `#checkoutBtn` lateral) junto a `trackCheckoutConversion()`.
  Manda name, phone, email, city, address, paymentMethod, total, cart[], source. Usa
  `window.__4ULAB_PROJECT_ID__` (=1). Cache-buster global → `202607020400`.
- **Deploy**: MX commit `617c26c` + `node deploy.js` (version `3e726be5`). 4ULAB pushed a main.
- **Verificado en vivo** (curl a Vercel): OPTIONS→200, POST válido→201 `{success,contactId,created:true}`,
  upsert mismo teléfono→200 `created:false`, sin name→400, project inválido→404.
- **⚠️ Limpieza pendiente**: quedó un contacto de prueba "TEST NIGHT Lead" (id 1) en el
  CRM de project 1. Borrarlo desde la UI del CRM cuando se revise.

## Sesión 2026-07-01 — WEB STATS botones + carrito UX + product id fix + deploy

- **Tracking de botones site-wide** (`js/main.js`, IIFE `init4ULabButtonTracking` al final):
  listener delegado en fase de captura que deduce el label por data-attrs/href/texto y
  dispara `fourUTrackTraffic('click', {label})`. Cubre PC + hamburguesa mobile + markup
  inyectado dinámicamente, sin tocar los 27 HTML. Reglas del cliente respetadas:
  categorías (todo/cascos/uniformes/...) suman al MISMO contador vengan de mobile o PC;
  "ver-catalogo" y "nav-tienda" (misma URL shop.html) tienen contadores SEPARADOS;
  todos los WhatsApp suman a UN solo `whatsapp`; excluye `[data-4u-track]` (los maneja el
  snippet) y el interior de `#cartModal`/`#checkoutOverlay` (las ventas NO cuentan como click).
- **Fix productos vacíos "más vistos"/"más agregados"** (`js/products.js`): `adaptProductFrom4ULAB`
  devolvía `_4ulabId` pero NO `id`, así que las cards renderizaban `data-4u-product-id=""`
  y `/api/public/track` descartaba (skip silencioso) todos los eventos por productId desconocido.
  Se agregó `id: p.id` como primera prop del objeto. Cascada: card data-attr + view/addToCart
  del snippet + `id` del item de carrito, todos arreglados de una.
- **Carrito UX** (`js/cart.js` + `css/styles.css`): (a) auto-abre el carrito al agregar
  (`safelyOpenCart`/`openCart`); (b) contador ya existía; (c) badge y botón titilan en ROJO
  cuando hay productos (`.cart-badge--alert` / `.cart-btn--alert`, keyframes `cartAlertPulse`/
  `cartBtnAlertGlow`, respeta `prefers-reduced-motion`). Lead capture del checkout INTACTO.
- **Cache-busting**: bump global `202607020400` → `202607020500` (111 refs, 27 HTML).
- **Deploy**: `node deploy.js` OK, version `be5caa6a-e60d-4d6c-9cf7-5f0489654ecd`.
  El worker directo (`mxzonestore.motocross.workers.dev`) sirve el build nuevo verificado:
  HTML con `?t=202607020500`, `main.js` con `init4ULabButtonTracking`, 2788 líneas.
- **⚠️ DESCUBRIMIENTO IMPORTANTE (infra, no código) — www sirve STALE**: `www.mxzonestore.com`
  está fronteado por una **Cache Rule de Cloudflare** que cachea los assets estáticos con
  `Cache-Control: public, max-age=31536000` (1 año) **e ignora el query string**. Evidencia:
  con `?t=202607020500` Y con `?fresh=RANDOM` www devuelve el `main.js` VIEJO (0 matches de
  tracking, `cf-cache-status: HIT`), con etag `5f8a702d...` distinto al del worker
  (`0d94b84b...`, `max-age=0`). CONSECUENCIA: la estrategia de cache-busting `?t=` NO alcanza
  en www — hace falta **purgar la cache de Cloudflare** (dashboard → Caching → Purge Everything,
  o purge por URL de `/js/*.js` y `/css/*.css`) para que los clientes vean los cambios.
  Las "verificaciones en vivo" de sesiones previas solo comprobaron HTTP 200, no el contenido.
  Mismo tipo de item que el apex 522: requiere dashboard, NO se toca autónomamente.

## Sesión 2026-07-02 — Rediseño carrito (PC + mobile) + deploy

- **Bug PC identificado y corregido** (`css/styles.css`, bloque override al final del archivo):
  `.cart-modal-content` es flex-column, pero el wrapper `#cartStep1` (`.cart-step`) NO tenía
  propiedades flex → tomaba altura natural y el footer (Total/COMPRAR) quedaba flotando a mitad
  de panel con un hueco vacío debajo. Fix: `.cart-step { flex:1; display:flex; flex-direction:column;
  min-height:0 }` + `#cartItemsContainer { flex:1; min-height:0 }` + `.cart-footer { margin-top:auto }`.
- **PC (≥769px)**: panel más ajustado (`max-width:430px`), header/footer glass (`backdrop-filter:blur`),
  sombra lateral, header sticky, cards de item con hover sutil.
- **Mobile (≤768px)**: carrito a **pantalla completa** (`height:100dvh`, `width:100%`, sin border-radius),
  header sticky con `env(safe-area-inset-top)` → **el botón cerrar siempre visible**; footer pinneado con
  `env(safe-area-inset-bottom)`; `overflow-wrap:anywhere` en item/nombre → **nada se sale de pantalla**.
- **Cache-busting**: bump `202607020500` → `202607021200` (111 refs, 27 HTML, vía PowerShell).
- **Deploy**: `node deploy.js` OK, version `43cb3316-57b8-4ecc-a821-e8f8aa294a2f`.
- **⚠️ RECORDATORIO**: www.mxzonestore.com sigue detrás de la Cache Rule de Cloudflare (1 año, ignora
  query string). Para que los clientes vean el rediseño hay que **PURGAR la cache de Cloudflare**
  (dashboard → Caching → Purge Everything). El worker directo ya sirve el build nuevo.

## Próxima sesión — inicio recomendado

1. **LEER PRIMERO `C:\Users\seven\4ULAB\APP\NEXTUPDATE.md`** — contiene la visión conceptual del próximo gran paso del proyecto.
2. Verificar en vivo WEB STATS en MX (snippet cargando + eventos llegando) cuando el 522 se resuelva.
3. Luego revisar `TEMP.md` y atacar #015 (redes sociales sin iconos/links) y #016 (iconos de inicio no cargan fuentes CDN).
