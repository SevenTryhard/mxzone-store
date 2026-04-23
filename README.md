# MXZONE STORE - Sitio Web + CMS

Sitio web premium para tienda de equipamiento de motocross con panel administrativo CMS.

---

## 🚀 Deploy en Netlify (Paso a Paso)

### 1. Subir a GitHub

```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "Initial commit - MXZONE STORE con CMS"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mxzone-store.git
git push -u origin main
```

### 2. Conectar a Netlify

1. Ve a [netlify.com](https://netlify.com) y crea una cuenta (gratis)
2. Haz clic en **"Add new site"** → **"Import an existing project"**
3. Selecciona **GitHub** y autoriza Netlify
4. Busca tu repositorio `mxzone-store` y selecciónalo
5. En **Build settings**:
   - Build command: `echo "No build needed"`
   - Publish directory: `.` (déjalo vacío)
6. Haz clic en **"Deploy site"**

### 3. Activar Git Gateway (para el CMS)

1. En Netlify, ve a **Site settings** → **Identity**
2. Haz clic en **"Enable Identity service"**
3. En **Registration preferences**, selecciona **"Open"** o **"Invite only"**
4. Ve a **Services** → **Git Gateway**
5. Haz clic en **"Enable Git Gateway"**
6. Sigue las instrucciones para conectar con GitHub

### 4. Acceder al CMS

Una vez desplegado:

1. Ve a `https://TU-SITIO.netlify.app/admin`
2. Inicia sesión con tu cuenta de GitHub
3. ¡Listo! Ya puedes editar productos, precios e imágenes

---

## 📋 Estructura del CMS

El panel administrativo te permite editar:

| Sección | Qué puedes editar |
|---------|-------------------|
| 🪖 Cascos | Nombre, precio, tallas, imagen, badge |
| 👕 Uniformes | Nombre, precio, tallas, imagen, badge |
| 👢 Botas | Nombre, precio, tallas, imagen, badge |
| 🛡️ Protecciones | Nombre, precio, tallas, imagen, badge |
| ⭐ Testimonios | Nombre, ubicación, testimonio, avatar |
| ⚙️ Configuración | WhatsApp, dirección, email, redes sociales |

---

## 🎨 Personalización

### Cambiar colores
Edita `css/styles.css`, línea 11:
```css
--orange-primary: #FF6600; /* Tu color principal */
```

### Cambiar logo
Reemplaza el archivo `assets/logo/logo.png`

---

## 📱 URLs del sitio

| Página | URL |
|--------|-----|
| Inicio | `/index.html` |
| Tienda | `/shop.html` |
| Nosotros | `/about.html` |
| Testimonios | `/testimonials.html` |
| FAQ | `/faq.html` |
| Contacto | `/contact.html` |
| Envíos | `/shipping.html` |
| Devoluciones | `/returns.html` |
| **CMS Admin** | `/admin/` |

---

## 🔧 Comandos útiles

```bash
# Ver sitio localmente
npx serve .

# O con Python
python -m http.server 8000

# Luego abre http://localhost:8000
```

---

## 📞 Soporte

Para cambios en el CMS o el sitio, edita los archivos en GitHub y Netlify hará el deploy automáticamente.

---

**Hecho con 🏍️ para MXZONE STORE**
