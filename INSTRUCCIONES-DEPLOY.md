# 🚀 Instrucciones para Deploy en Netlify + CMS

## Opción A: Deploy Manual (Recomendado - 5 minutos)

### Paso 1: Subir a GitHub

Abre Git Bash en la carpeta `mxzone-landing` y ejecuta:

```bash
# Inicializar repositorio (si no existe)
git init

# Agregar todos los archivos
git add .

# Crear commit
git commit -m "MXZONE STORE - Sitio completo con CMS"

# Crear rama main
git branch -M main

# Crear repositorio en GitHub desde terminal (opcional)
# Si ya tienes uno, salta este paso

# Conectar con tu repositorio (CAMBIA TU_USUARIO por tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/mxzone-store.git

# Subir
git push -u origin main
```

### Paso 2: Conectar a Netlify

1. **Ve a [netlify.com](https://app.netlify.com) y crea cuenta gratis**

2. **Haz clic en "Add new site" → "Import an existing project"**

3. **Selecciona GitHub** y autoriza Netlify

4. **Busca tu repositorio** `mxzone-store` y selecciónalo

5. **Configuración de build** (déjalo así):
   - Build command: `echo "No build needed"`
   - Publish directory: `.` (déjalo vacío)

6. **Haz clic en "Deploy site"**

### Paso 3: Activar el CMS

1. En Netlify, ve a **Site settings** → **Identity**

2. Clic en **"Enable Identity service"**

3. En **Registration preferences**, elige **"Invite only"** (más seguro)

4. Ve a **Settings and more** → **Registration** → **Enable email signup**

5. Ve a **Services** → **Git Gateway**

6. Clic en **"Enable Git Gateway"**

7. Sigue las instrucciones para conectar con GitHub

### Paso 4: Acceder al CMS

1. Ve a `https://TU-SITIO.netlify.app/admin`
2. Inicia sesión con tu cuenta de GitHub
3. ¡Listo! Ya puedes editar

---

## Opción B: Deploy con Netlify CLI (3 minutos)

### Si ya tienes cuenta en Netlify:

```bash
# Iniciar sesión
netlify login

# Deploy
cd mxzone-landing
netlify deploy --prod
```

Sigue las instrucciones:
1. ¿Create & configure a new site? → **Yes**
2. Site name → **mxzone-store** (o el que quieras)
3. Build command → **echo "No build needed"**
4. Publish directory → **.**

---

## 🎯 Una vez desplegado:

### Acceder al CMS:
```
https://TU-SITIO.netlify.app/admin
```

### Editar productos:
1. Entra al admin
2. Selecciona una categoría (Cascos, Uniformes, etc.)
3. Crea nuevo producto o edita existente
4. Sube imagen desde tu computadora
5. Guarda cambios

### Cambiar precios:
1. Ve a la colección del producto
2. Edita el campo "Precio"
3. Guarda

### Las imágenes se guardan en:
`assets/images/cms/` automáticamente

---

## 📱 Dominio Personalizado (Opcional)

1. En Netlify ve a **Domain settings**
2. **Add custom domain**
3. Sigue las instrucciones para configurar DNS

---

## 🔐 Primer inicio de sesión al CMS

La primera vez que entres a `/admin`:

1. Verás una pantalla de login
2. Haz clic en **"Login with GitHub"**
3. Autoriza el acceso
4. ¡Listo!

---

## ⚡ Cambios automáticos

Cada vez que hagas un cambio en el CMS:
- Netlify detecta el cambio automáticamente
- Hace commit a GitHub
- Redeploya el sitio
- ¡Tu sitio se actualiza solo!

---

**¿Necesitas ayuda?** Revisa el README.md para más detalles.
