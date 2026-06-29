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
| #006 | Carga de Producto | Fallo en el fetch de datos (nombre/precio) desde la base de datos o API. | Pendiente |
| #007 | Validación de Tallas | El validator requiere talla incluso en productos que no la usan (boolean check erróneo). | Pendiente |
| #008 | Botón WhatsApp | Alineación incorrecta en el contenedor (posible error de flexbox o margin). | Pendiente |
| #009 | Contraste (Light Mode) | Color de fuente demasiado oscuro sobre fondo claro (violación WCAG). | Pendiente |
| #010 | Menú Desplegable | Error de event listener: el menú se cierra al hacer blur o clic fuera accidental. | Pendiente |
| #011 | Promociones (Contraste) | Texto informativo sin legibilidad sobre el fondo en modo light. | Pendiente |
| #012 | Imagen Promoción | Fallo en la carga de activos (assets); imagen rota o ruta inexistente. | Pendiente |
| #013 | Info. Promociones | Falta de contraste severo en componentes de texto dinámico. | Pendiente |
| #014 | Icono Carrito | Problema de color de SVG/icono que no cambia según el tema (light/dark). | Pendiente |
| #015 | Redes Sociales | Faltan iconos en los botones y los enlaces no tienen href configurado. | Pendiente |
| #016 | Iconos Inicio | Fallo en la carga de fuentes de iconos (FontAwesome/Material Icons) o CDN. | Pendiente |
| #017 | Filtro "Todo" | El renderizado de secciones vacías ocupa espacio en el DOM, empujando contenido hacia abajo. | Pendiente |
| #018 | Filtro de Tallas | Filtro incompleto o datos no cargados totalmente en el array de tallas disponibles. | Pendiente |

## Recomendaciones base

- Prioridad alta: #001, #002, #006, #014, #017 afectan conversión/usabilidad base.
- **Nueva prioridad alta**: sub-issue Jerseys dentro de #004 — filtro activo pero productos tienen categoría `uniformes` en vez de `jersey`.
- Gestión de temas: revisar `themes.css` / estilos globales para #009, #011, #013, #014, #016.
- Validaciones: revisar lógica de producto (#007) para hacer la talla condicional (`if product.hasSizes`).

## Sesión actual

- Fecha: 2026-06-29
- Scope: #001, #004 (incluyendo sub-issue Jerseys), #005
- Estado: cerrada. #004 ahora completo.

## Próxima sesión — inicio recomendado

1. Revisar `TEMP.md` y elegir el siguiente fix prioritario. Recomendados según impacto: #006 (carga de producto), #014 (icono carrito), #017 (filtro "Todo" vacío).
