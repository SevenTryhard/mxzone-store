# GitHub Action - Sincronización Automática de Productos

## ¿Qué hace este Action?

Automáticamente regenera el archivo `index.json` cuando borras productos en CloudCannon CMS.

---

## Flujo de Funcionamiento

```
1. Borras producto en CloudCannon
       ↓
2. CloudCannon hace commit → push a GitHub
   Mensaje: "Updated 1 file via CloudCannon"
       ↓
3. GitHub Action detecta el cambio
       ↓
4. Verifica si hay archivos .json eliminados
       ↓
5. SI hay eliminados → Regenera index.json
       ↓
6. Hace commit y push automático
   Mensaje: "chore: sincronizar index.json después de borrar productos [skip-ci]"
       ↓
7. Cloudflare Pages detecta cambio → Deploy automático
       ↓
8. ✅ Productos actualizados en la web (~2-3 minutos)
```

---

## Configuración del Workflow

**Archivo:** `.github/workflows/sync-product-index.yml`

### Trigger (Cuándo se activa)

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'cms/productos/**/*.json'
```

✅ Se activa cuando:
- Hay push a la rama `main`
- El push modifica archivos `.json` en `cms/productos/`
- El commit viene de CloudCannon (mensaje contiene "via CloudCannon")
- El commit NO tiene `[skip-ci]` (para evitar loops)

---

## Condiciones de Ejecución

El Action **SOLO** corre si se cumplen TODAS estas condiciones:

| Condición | Descripción |
|-----------|-------------|
| ✅ Push desde CloudCannon | Mensaje contiene "via CloudCannon" |
| ✅ No es commit del propio Action | Mensaje NO contiene `[skip-ci]` |
| ✅ Hay archivos .json eliminados | Detecta archivos borrados en `cms/productos/` |

---

## ¿Qué pasa si...?

### ❓ Borro un producto en CloudCannon
✅ El Action detecta el archivo eliminado → Regenera `index.json` → Push automático → Deploy en Cloudflare

### ❓ Editó un producto existente (precio, imagen, etc.)
❌ El Action **NO** se ejecuta (no hay archivos borrados) → Más rápido, menos commits

### ❓ Agrego un producto nuevo
✅ CloudCannon lo agrega → El archivo ya existe en el directorio → `index.json` lo detecta automáticamente en el próximo deploy

### ❓ Hago commit manual desde mi computadora
❌ El Action **NO** se ejecuta (el mensaje no dice "via CloudCannon")

### ❓ El Action falla
🔄 Reintenta automáticamente 3 veces con delay de 5 segundos

### ❓ Hay conflicto de merge
🔄 El Action hace `git pull --rebase` automáticamente antes de hacer push

---

## Ver el Estado del Action

### Badge en README

[![Sincronización de Productos](https://github.com/SevenTryhard/mxzone-store/actions/workflows/sync-product-index.yml/badge.svg)](https://github.com/SevenTryhard/mxzone-store/actions/workflows/sync-product-index.yml)

### Ver logs en vivo

1. Ve a: https://github.com/SevenTryhard/mxzone-store/actions
2. Haz clic en "Sincronizar Índice de Productos"
3. Selecciona el run más reciente
4. Expande el paso "Detectar productos eliminados" para ver qué archivos se borraron

---

## Mensajes de Commit

### CloudCannon (trigger)
```
Updated 1 file via CloudCannon.
Updated 3 files via CloudCannon.
```

### GitHub Action (resultado)
```
chore: sincronizar index.json después de borrar productos [skip-ci]
```

El tag `[skip-ci]` previene que el Action se active a sí mismo infinitamente.

---

## Tiempos Estimados

| Paso | Duración |
|------|----------|
| CloudCannon → Git Push | ~10-30 segundos |
| GitHub Action (detectar + regenerar) | ~15-30 segundos |
| GitHub → Cloudflare webhook | ~5 segundos |
| Cloudflare Pages deploy | ~30-60 segundos |
| **TOTAL** | **~2-3 minutos** |

---

## Solución de Problemas

### El Action no se ejecuta

**Causas posibles:**
1. El commit no dice "via CloudCannon" → Revisa configuración de CloudCannon
2. El commit tiene `[skip-ci]` → Remueve el tag
3. No hay archivos eliminados → El Action está optimizado para solo correr con bajas

### El Action falla constantemente

**Verifica:**
1. `index.json` no está en `.gitignore`
2. Tienes permisos de escritura en el repositorio
3. No hay otro proceso haciendo commit al mismo tiempo

### Hay conflictos de merge

**Solución:**
El Action hace `git pull --rebase` automáticamente. Si persiste:
1. Revisa los logs del Action
2. Haz pull manual: `git pull --rebase`
3. Resuelve conflictos localmente
4. Haz push manual

### Productos borrados siguen apareciendo

**Posibles causas:**
1. El Action aún no termina (espera 2-3 minutos)
2. Caché del navegador → Hard refresh (`Ctrl + Shift + R`)
3. El `index.json` no se actualizó → Revisa logs del Action

---

## Flujo Manual (Backup)

Si el Action falla, puedes regenerar manualmente:

```powershell
# En la carpeta del proyecto
git pull

# Regenerar index.json
.\generate-products-index.ps1

# Commit y push
git add cms/productos/index.json
git commit -m "chore: sincronizar index.json manualmente"
git push
```

---

## Integrar Compañeros al CMS

### Pasos para agregar un editor:

1. **CloudCannon:**
   - Ve a Settings → Users
   - Invita al email de tu compañero
   - Asígnale rol "Editor" o "Admin"

2. **GitHub (opcional, si también editará código):**
   - Ve a Settings → Collaborators
   - Invita al usuario de GitHub

3. **Capacitación:**
   - Mostrar cómo borrar productos en CloudCannon
   - Explicar que el cambio tarda ~2-3 minutos en reflejarse
   - Compartir este manual

---

## Próximas Mejoras (Backlog)

- [ ] Notificaciones por email si el Action falla
- [ ] Webhook a Discord/Slack cuando se sincronicen productos
- [ ] Validar que JSONs sean válidos antes de regenerar
- [ ] Detectar productos sin categoría o con campos inválidos
- [ ] Reporte semanal de productos agregados/eliminados

---

## Recursos

- **Workflow:** `.github/workflows/sync-product-index.yml`
- **Script local:** `generate-products-index.ps1`
- **Logs:** https://github.com/SevenTryhard/mxzone-store/actions
- **Documentación GitHub Actions:** https://docs.github.com/en/actions

---

**Creado:** 2026-04-28  
**Última actualización:** 2026-04-28
