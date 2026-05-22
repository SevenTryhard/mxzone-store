# MXZONE STORE

**Tienda online de equipamiento premium para motocross y enduro.**

[![Cloudflare Pages Status](https://img.shields.io/badge/deployed%20on-Cloudflare%20Pages-orange)](https://pages.cloudflare.com/)
[![CMS Sync](https://github.com/SevenTryhard/mxzone-store/actions/workflows/sync-cms-to-json.yml/badge.svg)](https://github.com/SevenTryhard/mxzone-store/actions/workflows/sync-cms-to-json.yml)

---

## Sobre el Proyecto

MXZONE STORE es una tienda de e-commerce estática especializada en equipamiento de motocross, enduro y off-road. Desarrollada con HTML5, CSS3 y JavaScript vanilla, está diseñada para ser rápida, accesible y fácil de mantener.

- **Sitio en vivo:** [www.mxzonestore.com](https://www.mxzonestore.com/)
- **Ubicación:** Cali, Colombia
- **Instagram:** [@mxzoneoficial](https://www.instagram.com/mxzoneoficial/)

---

## Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **HTML5** | Estructura semántica y SEO-friendly |
| **CSS3** | Diseño responsive con variables CSS y animaciones |
| **JavaScript (Vanilla)** | Lógica de negocio, carrito, filtros y carga dinámica de productos |
| **Cloudflare Pages** | Hosting y deploy automático desde GitHub |
| **Cloudflare Workers** | CMS API (Growisoulsand) para gestión de productos |
| **GitHub Actions** | Sincronización automatizada de productos cada hora |

---

## Estructura del Proyecto

```
mxzone-store/
├── index.html              # Página de inicio
├── shop.html               # Catálogo de productos
├── product.html            # Detalle de producto individual
├── about.html              # Sobre nosotros
├── contact.html            # Contacto
├── css/
│   └── styles.css          # Estilos globales
├── js/
│   ├── products.js         # Motor de carga y renderizado de productos
│   ├── product-detail.js   # Detalle de producto y recomendados
│   ├── main.js             # Interacciones: filtros, carrito, animaciones
│   └── cart.js             # Lógica del carrito de compras
├── cms/
│   ├── productos/          # JSONs de productos (espejo del CMS)
│   ├── categorias/         # Definiciones de categorías
│   └── config.js           # Configuración global de la tienda
├── assets/
│   ├── images/             # Imágenes de productos y branding
│   └── logo/               # Logotipos
├── .github/workflows/
│   └── sync-cms-to-json.yml  # Sincronización automática horaria
└── README.md
```

---

## Cómo Funciona el Sistema de Productos

Los productos se gestionan desde el CMS (`growisoulsand.pages.dev`). Desde allí, los vendedores agregan, editan o eliminan productos.

### Flujo de sincronización

1. **CMS:** El administrador actualiza un producto.
2. **GitHub:** El CMS hace `git push` con los cambios al repo.
3. **Cloudflare Pages:** Detecta el push y redeploya el sitio automáticamente.
4. **Sitio Web:** Carga los productos vía API directamente al abrir la página.

### Sincronización horaria (GitHub Action)

Adicionalmente, una **GitHub Action** corre cada una hora para:
- Descargar todos los productos desde la API del CMS.
- Actualizar los archivos JSON locales en `cms/productos/`.
- Borrar productos que ya no existan en el CMS.
- Mantener `cms/productos/index.json` al día.

Esto garantiza que, incluso si la API tiene una interrupción momentánea, el sitio pueda seguir funcionando con los datos más recientes almacenados localmente.

---

## Guía Rápida para Desarrolladores

### Requisitos previos

- Git
- Node.js (opcional, solo si querés ejecutar scripts de sincronización)
- Un editor de código (VS Code recomendado)

### Clonar y correr localmente

```bash
git clone https://github.com/SevenTryhard/mxzone-store.git
cd mxzone-store
npx serve .
```

Abre `http://localhost:3000` en tu navegador.

### Notas importantes para contribuidores

- **NO edites los archivos JSON en `cms/productos/` manualmente.** Son un espejo del CMS y serán sobreescritos por la GitHub Action.
- **Si modificás `js/products.js`, probá en modo incógnito.** El navegador cachea agresivamente los archivos JS.
- **Toda función nueva que cargue productos debe incluir un fallback** a los JSON locales en caso de que la API no responda.
- **Validá los datos que vienen de la API** antes de manipularlos (asumí que pueden ser `null`, números o strings vacíos).

---

## Reportar Problemas o Sugerencias

Si encontrás un bug o querés proponer una mejora:

1. Abrí un [Issue en GitHub](https://github.com/SevenTryhard/mxzone-store/issues).
2. Incluí el paso a paso para reproducirlo.
3. Adjuntá capturas de pantalla si es necesario.

---

## Contacto

- **WhatsApp:** +57 317 669 2997
- **Instagram:** [@mxzoneoficial](https://www.instagram.com/mxzoneoficial/)
- **TikTok:** [@mx_zonestore](https://www.tiktok.com/@mx_zonestore)
- **Email:** MXZONEOFICIAL

---

© 2026 MXZONE STORE. Todos los derechos reservados.
