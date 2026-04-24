# 📘 GUÍA DE USO - MXZONE STORE CMS (CloudCannon)

## 🚀 Flujo de Trabajo para Subir Productos Nuevos

### **Opción A: Subir Imagen + Crear Producto (Recomendado)**

1. **Subir imágenes a CloudCannon:**
   - Ve a `Media Library` en CloudCannon
   - Click en `Upload` o arrastra tus imágenes
   - Selecciona la carpeta: `assets/images/{categoria}/`
   - Espera a que CloudCannon optimice las imágenes (se convierten a .webp)

2. **Crear nuevo producto:**
   - Ve a `Collections` → `productos`
   - Click en `+ New` → `New producto`
   - Llena los campos:
     - **Nombre**: Nombre completo del producto
     - **IMAGEN PRINCIPAL**: Click en "Browse" → Busca y selecciona tu imagen
     - **GALERÍA** (opcional): Click en "+" → "Browse" → Selecciona múltiples imágenes
     - **Precio**: Formato `$123.456`
     - **Tallas**: `S/M/L/XL` o `Unica` o `7-11 US`
     - **Etiqueta**: (opcional) Premium, Top Ventas, Nuevo, Oferta
     - **Categoría**: Selecciona de la lista

3. **Guardar cambios:**
   - Click en `Save` (esquina superior derecha)
   - CloudCannon automáticamente:
     - ✅ Hace commit a GitHub
     - ✅ Push a la rama `main`
     - ✅ Triggera deploy en Cloudflare

4. **Verificar en tienda:**
   - Espera 2-3 minutos
   - Abre `https://mxzonestore.motocross.workers.dev/shop.html`
   - Filtra por categoría
   - ¡Tu producto debería aparecer!

---

### **Opción B: Actualizar Producto Existente**

1. **Editar producto:**
   - Ve a `Collections` → `productos`
   - Busca el producto por nombre
   - Click en el producto para editar

2. **Actualizar imagen:**
   - **IMAGEN PRINCIPAL**: Click en "Browse" → Selecciona nueva imagen
   - **GALERÍA**: 
     - Click en "+" para agregar más imágenes
     - Click en "Browse" para explorar el CDN
     - Selecciona múltiples imágenes con Ctrl+Click
     - Click en "X" para eliminar imágenes de la galería

3. **Actualizar otros campos:**
   - Precio, tallas, etiqueta, etc.

4. **Guardar:**
   - Click en `Save`
   - CloudCannon sincroniza automáticamente

---

## 📸 Campo GALERÍA (Imágenes Secundarias) - Cómo Usar

### **Características del campo `images`:**

✅ **Explorador visual completo:**
- Click en "Browse" abre el explorador de medios de CloudCannon
- Puedes buscar por nombre de archivo
- Vista previa de imágenes
- Navegación por carpetas (`assets/images/{categoria}/`)

✅ **Selección múltiple:**
- Mantén presionada la tecla `Ctrl` (Windows) o `Cmd` (Mac)
- Click en múltiples imágenes
- Todas se agregarán al array

✅ **Reordenar:**
- Arrastra y suelta para cambiar el orden
- La primera imagen es la principal de la galería

✅ **Eliminar:**
- Click en "X" en la esquina de cada imagen
- O click en "-" para remover del array

---

## ⚙️ Configuración Automática Habilitada

### **Auto-Sync CloudCannon → GitHub → Cloudflare**

```yaml
✅ Auto-commit: Habilitado
✅ Auto-push: Habilitado
✅ Branch: main
✅ Commit message: "CloudCannon CMS: Actualizar {collection} - {count} archivos"
```

### **Optimización de Imágenes**

```yaml
✅ Optimize: true
✅ Max size: 10MB
✅ Formato: WebP (automático)
✅ CDN: cloudvent.net
```

### **Encoding**

```yaml
✅ UTF-8: Forzado en todos los JSON
✅ Caracteres especiales: Única, ñ, á, é, í, ó, ú
```

---

## 🔧 Solución de Problemas

### **Problema: Las imágenes no se ven en la tienda**

**Causas posibles:**
1. Imagen no está en Git (CloudCannon no hizo push)
2. Ruta en JSON apunta a archivo que no existe
3. Cloudflare cachea versión antigua

**Solución:**
1. Verifica en GitHub que el commit de CloudCannon llegó
2. Revisa que la imagen existe en `assets/images/{categoria}/`
3. Espera 5 minutos o haz hard refresh (Ctrl+F5)
4. Si persiste, ejecuta `update-index.ps1` y haz push manual

---

### **Problema: Producto no aparece en la tienda**

**Causas posibles:**
1. Producto no está en `index.json`
2. Categoría incorrecta en JSON
3. Cloudflare no ha hecho deploy

**Solución:**
1. Ejecuta `.\update-index.ps1` desde PowerShell
2. Verifica que el JSON del producto tenga `category` correcto
3. Revisa Cloudflare Pages Dashboard → Deployments

---

### **Problema: Texto se ve raro (Ãšnica en vez de Única)**

**Causa:** Encoding UTF-8 incorrecto

**Solución:**
1. Abre el JSON en CloudCannon
2. Re-escribe el campo con caracteres especiales
3. Guarda (CloudCannon debería guardar en UTF-8)
4. Si persiste, reporta para fix manual

---

### **Problema: CloudCannon no hace auto-sync**

**Verificar:**
1. Ve a CloudCannon → Settings → Git
2. Verifica que esté conectado a `SevenTryhard/mxzone-store`
3. Verifica que `Auto-push` esté enabled
4. Revisa `Builds` para ver si hay errores

**Solución manual:**
1. En CloudCannon, ve a `Settings` → `Git`
2. Click en `Sync` o `Push to Git`
3. Verifica en GitHub que el commit llegó
4. Verifica en Cloudflare que el deploy inició

---

## 📋 Checklist Post-Actualización

Después de subir productos nuevos:

- [ ] Verificar en GitHub que el commit llegó
- [ ] Verificar en Cloudflare que el deploy completó
- [ ] Abrir tienda y verificar producto nuevo
- [ ] Verificar que imágenes cargan sin 404
- [ ] Verificar que tallas se muestran correctamente
- [ ] Ejecutar `update-index.ps1` si es necesario

---

## 🛠️ Comandos Útiles

### **Actualizar index.json manualmente:**
```powershell
cd C:\Users\seven\LLOCAMA\mxzone-landing
.\update-index.ps1
```

### **Verificar estado de Git:**
```powershell
git status
git log --oneline -5
```

### **Forzar sync con GitHub:**
```powershell
git pull origin main
git push origin main
```

---

## 📞 Soporte

Si algo falla:

1. Revisa esta guía primero
2. Verifica logs en CloudCannon → Builds
3. Verifica logs en Cloudflare → Pages → Deployments
4. Revisa consola del navegador (F12) para errores

---

**Última actualización:** 2026-04-24
**Backup disponible en:** `backup-pre-fix-*/`
