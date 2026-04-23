# 🏗️ MXZONE STORE - Configuración CloudCannon CMS

## ¿Qué es CloudCannon?

CloudCannon es un CMS visual que te permite editar tu sitio web estático como si fuera un "Elementor" para sitios GitHub. Es **100% GRATIS para 1 sitio** y no tiene límites de tokens.

---

## 📋 PASOS PARA CONFIGURAR (5 minutos)

### Paso 1: Subir tu sitio a GitHub

```bash
cd mxzone-landing

# Crear repositorio en GitHub primero (desde github.com)
# Luego conectar tu repositorio local:

git remote add origin https://github.com/TU_USUARIO/mxzone-store.git
git branch -M main
git push -u origin main
```

### Paso 2: Crear cuenta en CloudCannon

1. Ve a [**cloudcannon.com**](https://cloudcannon.com)
2. Click en **"Get Started"** o **"Sign Up Free"**
3. Inicia sesión con tu cuenta de **GitHub** (la misma donde subiste el repo)

### Paso 3: Conectar tu repositorio

1. En CloudCannon, click en **"New Project"** → **"Connect Repository"**
2. Busca tu repositorio `mxzone-store` y selecciónalo
3. CloudCannon leerá automáticamente el archivo `cloudcannon.config.yml`
4. Click en **"Connect"**

### Paso 4: Desplegar en Netlify (o Vercel)

**Opción A - Netlify (Recomendado):**
1. Ve a [netlify.com](https://netlify.com) y crea cuenta
2. Click **"Add new site"** → **"Import an existing project"**
3. Conecta con GitHub y selecciona `mxzone-store`
4. Build command: `echo "No build needed"`
5. Publish directory: `.` (déjalo vacío)
6. Click **"Deploy site"**

**Opción B - Vercel:**
1. Ve a [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Importa tu repositorio `mxzone-store`
4. Click **"Deploy"**

### Paso 5: Actualizar la URL en CloudCannon

1. Una vez desplegado, copia tu URL (ej: `mxzone-store.netlify.app`)
2. En CloudCannon, ve a **Settings** → **Site Settings**
3. En **Base URL**, pega tu URL real
4. Guarda los cambios

---

## 🎨 CÓMO EDITAR TU SITIO

### Acceder al Panel

Entra a [**app.cloudcannon.com**](https://app.cloudcannon.com) y verás tu sitio.

### Editar Productos

1. Click en **"Collections"** en el menú izquierdo
2. Selecciona la categoría:
   - 🪖 **Cascos**
   - 👕 **Uniformes**
   - 👢 **Botas**
   - 🛡️ **Protecciones**
3. Click en un producto para editar o **"New Entry"** para crear uno nuevo
4. Llena los campos:
   - **Nombre**: Nombre completo del producto
   - **Precio**: Formato `$1.234.567`
   - **Tallas**: Ej: `S/M/L/XL` o `38/39/40/41`
   - **Imagen**: Sube la foto (drag & drop)
   - **Badge**: Etiqueta opcional (Premium, Nuevo, Oferta, etc.)
5. Click en **"Save"** (arriba a la derecha)

### Editar Testimonios

1. Click en **"Collections"** → **"Testimonios"**
2. Click en un testimonio para editar o **"New Entry"** para crear
3. Campos:
   - **Nombre**: Nombre del cliente
   - **Ubicación**: Ciudad, Departamento
   - **Testimonio**: Opinión completa
   - **Avatar**: 2 letras (iniciales del nombre)
4. Click en **"Save"**

### Editar Configuración General

1. Click en **"Collections"** → **"Configuración"**
2. Edita los datos de contacto:
   - WhatsApp (solo números, ej: `573176692997`)
   - Dirección física
   - Email
   - Redes sociales (URLs completas)
3. Click en **"Save"**

---

## 📁 Estructura del CMS

| Colección | Carpeta | Formato | Qué editar |
|-----------|---------|---------|------------|
| Cascos | `cms/cascos/` | JSON | Productos de cascos |
| Uniformes | `cms/uniformes/` | JSON | Kits de uniformes |
| Botas | `cms/botas/` | JSON | Calzado |
| Protecciones | `cms/protecciones/` | JSON | Rodilleras, pecheras, etc. |
| Testimonios | `cms/testimonials/` | JSON | Opiniones de clientes |
| Configuración | `cms/settings/` | YAML | Datos de contacto |

---

## 🖼️ Gestión de Imágenes

Las imágenes se guardan en `assets/images/cms/`

- Tamaño máximo: **5MB** por imagen
- Tamaño recomendado: **800x800px** para productos
- CloudCannon optimiza automáticamente las imágenes

---

## 🔄 ¿Cómo Funciona?

```
Editas en CloudCannon → Commit automático en GitHub → Netlify detecta cambio → Deploy automático
```

**Tiempo de actualización:** 30-60 segundos después de guardar.

---

## ✅ Checklist Final

- [ ] Repositorio subido a GitHub
- [ ] Cuenta creada en CloudCannon
- [ ] Repositorio conectado en CloudCannon
- [ ] Sitio desplegado en Netlify/Vercel
- [ ] URL actualizada en `cloudcannon.config.yml`
- [ ] Probaste editar un producto de prueba

---

## 🆘 Solución de Problemas

### "No veo los cambios en mi sitio"
- Espera 1-2 minutos (Netlify tarda en hacer deploy)
- Revisa el deploy log en Netlify
- Hard refresh del navegador (Ctrl + F5)

### "Las imágenes no se ven"
- Verifica que la ruta en el JSON sea correcta
- Las imágenes deben estar en `assets/images/cms/`

### "CloudCannon no detecta mi configuración"
- Asegúrate que `cloudcannon.config.yml` esté en la raíz del repo
- Revisa que el nombre del archivo sea exacto (minúsculas)

### "No puedo guardar cambios"
- Verifica que CloudCannon tenga permisos de escritura en tu repo de GitHub
- Ve a GitHub → Settings → Applications → CloudCannon → Otorgar permisos

---

## 📞 Enlaces Útiles

- [Documentación de CloudCannon](https://cloudcannon.com/documentation/)
- [Soporte de CloudCannon](https://cloudcannon.com/support/)
- [Comunidad en Facebook](https://www.facebook.com/groups/cloudcannonusers)

---

## 💰 Plan Gratis vs Pago

| Característica | Gratis | Pago |
|----------------|--------|------|
| Sitios | **1** | Ilimitados |
| Usuarios | **3** | Ilimitados |
| Almacenamiento | **1GB** | 10GB+ |
| Commits/mes | **100** | Ilimitados |
| Imágenes optimizadas | ✅ | ✅ |
| Vista previa | ✅ | ✅ |

**Para tu caso, el plan GRATIS es suficiente.**

---

**¡Listo! Ya puedes editar tu MXZONE STORE sin tocar código.** 🏍️
