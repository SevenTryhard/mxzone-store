# 🚀 Guía Rápida - Gestión de Productos MXZONE

## ⚠️ IMPORTANTE: Bug de CloudCannon con Eliminaciones

CloudCannon **NO elimina archivos físicamente** del repositorio en todos los casos.

**Síntoma:** Borras producto en CloudCannon → Sigue apareciendo en la web

**Solución:** Verificar en GitHub y eliminar manualmente si es necesario (ver abajo)

---

## Para Borrar Productos

### Opción A: CloudCannon (Puede fallar)

1. Ve a `cms/productos` en CloudCannon
2. Selecciona el producto a borrar
3. Haz clic en "Delete"
4. Confirma la eliminación
5. **IMPORTANTE:** Verifica en GitHub que el archivo se eliminó

### Verificar si CloudCannon funcionó:

1. Ve a https://github.com/SevenTryhard/mxzone-store/commits/main
2. Busca el commit más reciente de CloudCannon
3. Haz clic en el commit
4. **¿El archivo aparece como "deleted"?**
   - ✅ **SÍ** → GitHub Action lo procesará automáticamente
   - ❌ **NO** → Necesitas eliminación manual (ver Opción B abajo)

### Opción B: Eliminación Manual (100% segura)

```powershell
# 1. Pull de cambios recientes
git pull

# 2. Borrar archivo manualmente
Remove-Item cms\productos\nombre-producto.json -Force

# 3. Regenerar index.json
.\generate-products-index.ps1

# 4. Commit y push
git add cms/productos/nombre-producto.json cms/productos/index.json
git commit -m "fix: eliminar producto borrado en CloudCannon"
git push
```

### Automáticamente (después de eliminar):
- ✅ Cloudflare Pages detecta el cambio
- ✅ Deploy automático (~1 minuto)
- ✅ **Total: 1-2 minutos** para ver el cambio en la web

### Verificar:
1. Ve a https://github.com/SevenTryhard/mxzone-store/actions
2. Busca el run más reciente
3. Debe decir ✅ "Success"
4. Espera 2 minutos → Hard refresh en la web (Ctrl + Shift + R)

---

## Para Agregar Productos

### En CloudCannon:
1. Ve a `cms/productos`
2. Haz clic en "New" → "Producto"
3. Llena los campos:
   - Nombre
   - Precio
   - Categoría
   - Imagen
   - Tallas
   - Badge (opcional)
4. Haz clic en "Save"

### Automáticamente:
- ✅ CloudCannon crea el archivo `.json`
- ✅ El archivo se agrega al `index.json` automáticamente
- ✅ Cloudflare Pages hace deploy
- ✅ **Total: 1-2 minutos**

---

## Para Editar Productos

### En CloudCannon:
1. Selecciona el producto
2. Edita los campos necesarios
3. Haz clic en "Save"

### Automáticamente:
- ✅ CloudCannon actualiza el archivo
- ✅ Cloudflare Pages detecta el cambio
- ✅ Deploy automático
- ✅ **Total: 1-2 minutos**

---

## Comandos Útiles (Local)

```powershell
# Regenerar index.json manualmente
.\generate-products-index.ps1

# Ver estado de git
git status

# Ver cambios recientes
git log --oneline -5

# Forzar actualizar caché del navegador
# En la web: Ctrl + Shift + R
```

---

## Solución de Problemas

| Problema | Solución |
|----------|----------|
| Producto borrado sigue apareciendo | Espera 2-3 min → Hard refresh (Ctrl+Shift+R) |
| Action no corre | Revisa https://github.com/SevenTryhard/mxzone-store/actions |
| Conflicto de git | `git pull --rebase` → `git push` |
| Producto nuevo no aparece | Verifica que tenga categoría válida |

---

## URLs Importantes

- **CMS:** https://app.cloudcannon.com/
- **GitHub Actions:** https://github.com/SevenTryhard/mxzone-store/actions
- **Repositorio:** https://github.com/SevenTryhard/mxzone-store
- **Web:** https://mxzonestore.motocross.workers.dev

---

## Flujo Completo

```
┌─────────────────────────────────────────────────────┐
│  BORRAR PRODUCTO                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. CloudCannon (Borrar)                           │
│         ↓ (10s)                                     │
│  2. GitHub (Commit automático)                     │
│         ↓ (15s)                                     │
│  3. GitHub Action (Regenerar index.json)           │
│         ↓ (5s)                                      │
│  4. Cloudflare (Detecta cambio)                    │
│         ↓ (60s)                                     │
│  5. ✅ Web actualizada                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

**Consejo:** Después de borrar productos, espera 3 minutos y recarga la página con `Ctrl + Shift + R` para ver los cambios.
