# 🚀 Decap CMS en Cloudflare Pages - Guía de Configuración

## ¿Por qué Decap CMS?

Decap CMS (antes Netlify CMS) es un CMS open-source gratuito que funciona con **cualquier host estático**, incluyendo Cloudflare Pages. A diferencia de CloudCannon:

| Característica | CloudCannon | Decap CMS |
|----------------|-------------|-----------|
| Precio | Gratis (1 sitio) | **100% Gratis** |
| Límite commits | 100/mes | **Ilimitado** |
| Almacenamiento | 1GB | **Ilimitado** |
| Host | Cualquier Git | **Cualquier Git** |
| Autenticación | CloudCannon ID | **GitHub OAuth** |

---

## 📋 PASOS PARA CONFIGURAR (10 minutos)

### Paso 1: Subir tu sitio a GitHub (Ya hecho ✅)

Tu repositorio ya está en: `https://github.com/SevenTryhard/mxzone-store`

### Paso 2: Actualizar Callback URL en GitHub ⚠️

1. Ve a https://github.com/settings/developers
2. Click en tu OAuth App **"MXZONE Store CMS"**
3. Click en **"Edit"**
4. Actualiza el **Authorization callback URL** a:
   ```
   https://mxzonestore.motocross.workers.dev/admin/
   ```
   (O tu dominio personalizado si ya lo configuraste en Cloudflare Pages)
5. **Importante:** El Client ID ya está configurado en el código, solo necesitas actualizar el callback URL
6. Click en **"Update application"**

### Paso 4: Configurar Decap CMS ✅

¡Ya está configurado! Las credenciales de GitHub OAuth ya están en `admin/index.html`.

### Paso 5: Desplegar en Cloudflare Pages

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. Click en **"Create application"** → **"Pages"** → **"Connect to Git"**
3. Selecciona tu repositorio `mxzone-store`
4. Configuración de build:
   - **Build command:** `echo "No build needed"`
   - **Build output directory:** `.`
   - **Root directory:** `mxzone-landing` (si aplica)
5. Click en **"Save and Deploy"**

### Paso 6: Configurar Variables de Entorno (Opcional)

Si quieres usar autenticación más robusta:

1. En Cloudflare Pages → Tu proyecto → **Settings** → **Environment variables**
2. Agrega:
   - `GITHUB_CLIENT_ID` = tu Client ID
   - `GITHUB_CLIENT_SECRET` = tu Client Secret

### Paso 7: Acceder al CMS

1. Una vez desplegado, ve a `https://tudominio.com/admin/`
2. Decap CMS te redirigirá a GitHub para autorizar
3. Click en **"Authorize SevenTryhard/mxzone-store"**
4. ¡Listo! Ya puedes editar

---

## 🎨 CÓMO EDITAR TU SITIO

### Acceder al Panel

Entra a `https://tudominio.com/admin/`

### Editar Productos

1. Click en **"Productos"** en el menú izquierdo
2. Click en un producto para editar o **"New Entry"** para crear
3. Campos:
   - **Nombre**: Nombre completo del producto
   - **Precio**: Formato `$1.234.567`
   - **Tallas**: Ej: `S/M/L/XL` o `38/39/40/41`
   - **Imagen**: Sube la foto (drag & drop)
   - **Badge**: Etiqueta opcional (Premium, Nuevo, Oferta, etc.)
   - **Categoría**: Cascos, Uniformes, Botas, Protecciones
4. Click en **"Save"** (arriba a la derecha)

### Editar Promociones / Combos

1. Click en **"Promociones / Combos"**
2. Click en **"New Entry"** para crear un combo
3. Campos:
   - **Nombre**: Ej: "Combo Principiante - Kit Completo"
   - **Categoría**: Principiante, Intermedio, Profesional, Premium
   - **Badge**: Mas Vendido, Nuevo, Recomendado, etc.
   - **Imagen Principal**: Foto del combo
   - **Precio Regular**: Precio sin descuento
   - **Precio Promocional**: Precio con descuento
   - **Productos Incluidos**: Lista de productos (nombre, categoría, precio, imagen)
4. Click en **"Save"**

### Editar Testimonios

1. Click en **"Testimonios"**
2. Click en un testimonio para editar o **"New Entry"** para crear
3. Campos:
   - **Nombre**: Nombre del cliente
   - **Ubicación**: Ciudad, Departamento
   - **Testimonio**: Opinión completa
   - **Avatar**: 2 letras (iniciales)
4. Click en **"Save"**

### Editar Configuración General

1. Click en **"Configuracion"** → **"Datos Generales"**
2. Edita los datos de contacto:
   - WhatsApp (solo números, ej: `573176692997`)
   - Dirección física
   - Email
   - Redes sociales (URLs completas)
3. Click en **"Save"**

---

## 🔄 ¿Cómo Funciona?

```
Editas en Decap CMS → Commit automático en GitHub → Cloudflare detecta cambio → Deploy automático
```

**Tiempo de actualización:** 30-60 segundos después de guardar.

---

## ✅ Checklist Final

- [ ] OAuth App creado en GitHub
- [ ] Client ID y Secret generados
- [ ] Sitio desplegado en Cloudflare Pages
- [ ] Dominio configurado (si usas dominio personalizado)
- [ ] Probaste editar un producto de prueba

---

## 🆘 Solución de Problemas

### "No veo el botón de Save"
- Revisa la consola (F12) para errores
- Asegúrate de estar logueado con GitHub
- Hard refresh (Ctrl + F5)

### "Las imágenes no se suben"
- Verifica que el tamaño sea < 5MB
- Las imágenes se guardan en `assets/images/cms/`

### "Error de autenticación"
- Verifica que el OAuth App tenga el callback URL correcto: `https://tudominio.com/admin/`
- Asegúrate de que el repo `SevenTryhard/mxzone-store` esté accesible

### "Los cambios no se ven en la página"
- Cloudflare Pages tarda ~30 segundos en hacer deploy
- Revisa el deploy log en Cloudflare Dashboard
- Hard refresh del navegador (Ctrl + F5)

---

## 📊 Planes y Precios

| Característica | Decap CMS | CloudCannon (Free) |
|----------------|-----------|-------------------|
| Sitios | **Ilimitados** | 1 |
| Usuarios | **Ilimitados** | 3 |
| Commits/mes | **Ilimitados** | 100 |
| Almacenamiento | **Ilimitado** | 1GB |
| Imágenes optimizadas | ❌ (manual) | ✅ |
| Vista previa | ❌ | ✅ |
| Precio | **$0** | $0 (1 sitio) |

---

## 🎯 Ventajas de Decap CMS sobre CloudCannon

1. **Sin límites**: Commits y almacenamiento ilimitados
2. **Más rápido**: Sin JavaScript externo pesado
3. **Open source**: Puedes modificarlo si necesitas
4. **Funciona con cualquier Git**: GitHub, GitLab, Bitbucket
5. **Sin dependencia**: No estás atado a un servicio específico

---

## 🔗 Enlaces Útiles

- [Documentación de Decap CMS](https://decapcms.org/docs/intro/)
- [Decap CMS en GitHub](https://github.com/decaporg/decap-cms)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [GitHub OAuth Apps](https://github.com/settings/developers)

---

**¡Listo! Ya puedes editar tu MXZONE STORE sin tocar código.** 🏍️
