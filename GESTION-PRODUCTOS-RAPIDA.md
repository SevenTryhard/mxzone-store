# 🚀 Guía Rápida - Gestión de Productos MXZONE

## Para Borrar Productos

### En CloudCannon:
1. Ve a `cms/productos` en CloudCannon
2. Selecciona el producto a borrar
3. Haz clic en "Delete"
4. Confirma la eliminación

### Automáticamente:
- ✅ CloudCannon hace commit y push
- ✅ GitHub Action detecta el cambio (~10 segundos)
- ✅ Regenera `index.json` (~15 segundos)
- ✅ Cloudflare Pages hace deploy (~1 minuto)
- ✅ **Total: 2-3 minutos** para ver el cambio en la web

### Verificar:
1. Ve a https://github.com/SevenTryhard/mxzone-store/actions
2. Busca el run más reciente de "Sincronizar Índice de Productos"
3. Debe decir ✅ "Success"

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
