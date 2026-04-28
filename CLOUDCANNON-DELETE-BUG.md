# ⚠️ Problema Conocido: CloudCannon No Elimina Archivos Físicamente

## Descripción del Problema

Cuando borras un producto en CloudCannon CMS:

| Lo que CloudCannon DEBERÍA hacer | Lo que CloudCannon REALMENTE hace |
|----------------------------------|-----------------------------------|
| ✅ Borrar el archivo `.json` del repositorio | ❌ **NO borra el archivo físicamente** |
| ✅ Hacer commit del archivo eliminado | ❌ Solo actualiza su UI interna |
| ✅ Hacer push a GitHub | ❌ El archivo permanece en git |
| ✅ `index.json` se actualiza automáticamente | ❌ `index.json` sigue listando el archivo |

---

## Síntomas

- Borras producto en CloudCannon → ✅ Aparece como borrado en la UI
- CloudCannon hace push a GitHub → ✅ Commit aparece en el historial
- **PERO** el archivo `.json` **sigue existiendo** en el repositorio
- **Y** el producto **sigue apareciendo** en la web

---

## Causa Raíz

CloudCannon tiene un **bug conocido** con la eliminación de archivos:

1. CloudCannon marca el producto como "borrado" en su base de datos interna
2. CloudCannon hace commit/push a GitHub
3. **PERO** el archivo físico NO se elimina del repositorio Git
4. El archivo permanece en `cms/productos/`
5. `index.json` lo sigue incluyendo
6. La web lo sigue mostrando

---

## Evidencia

### Commit de CloudCannon (ejemplo real):
```
commit 63b783e
Author: CloudCannon <support@cloudcannon.com>
Date:   Tue Apr 28 17:33:24 2026 +0000

    Updated 1 file via CloudCannon.

 cms/productos/uniforme-fox-180-leed-dark-shadow.json | 20 ++++++++++----------
 1 file changed, 10 insertions(+), 10 deletions(-)
```

### Archivo eliminado en CloudCannon pero existente en Git:
```
❌ UNIFORME TROY LEE GP AIR TEAM 81
   - CloudCannon UI: "Borrado" ✅
   - Archivo en Git: "Existe" ❌
   - Web: "Se muestra" ❌

❌ UNIFORME ALPINESTARS FLUID APEX
   - CloudCannon UI: "Borrado" ✅
   - Archivo en Git: "Existe" ❌
   - Web: "Se muestra" ❌
```

---

## Solución Actual (Workaround)

### **Cuando borres productos en CloudCannon:**

#### **Paso 1: Borrar en CloudCannon**
1. Ve a CloudCannon → `cms/productos`
2. Borra el producto
3. Espera a que CloudCannon haga push (~30 segundos)

#### **Paso 2: Verificar en GitHub**
1. Ve a https://github.com/SevenTryhard/mxzone-store/commits/main
2. Busca el commit de CloudCannon
3. **IMPORTANTE:** Haz clic en el commit → Verifica si el archivo aparece como **deleted**
   - ✅ Si dice "deleted" → CloudCannon lo borró correctamente → GitHub Action lo procesará
   - ❌ Si NO dice "deleted" → CloudCannon NO lo borró → Necesitas eliminación manual

#### **Paso 3A: Si CloudCannon lo borró correctamente**
- ✅ El GitHub Action detectará el archivo eliminado
- ✅ Regenerará `index.json` automáticamente
- ✅ Push automático → Deploy en Cloudflare
- ✅ **Listo en ~2-3 minutos**

#### **Paso 3B: Si CloudCannon NO lo borró (caso más común)**
```powershell
# Eliminación manual local
git pull

# Borrar archivo manualmente
Remove-Item cms\productos\nombre-producto.json -Force

# Regenerar index.json
.\generate-products-index.ps1

# Commit y push manual
git add cms/productos/nombre-producto.json cms/productos/index.json
git commit -m "fix: eliminar producto borrado en CloudCannon (sin push físico)"
git push
```

---

## Productos Afectados (Histórico)

| Producto | Fecha | Estado CloudCannon | Solución Aplicada |
|----------|-------|-------------------|-------------------|
| PANTALON FOX 180 CZAR | 2026-04-27 | ✅ Borrado correctamente | GitHub Action automático |
| PANTALON FOX 180 FYCE | 2026-04-27 | ✅ Borrado correctamente | GitHub Action automático |
| UNIFORME FLY KINETIC RED WHITE BLUE | 2026-04-27 | ✅ Borrado correctamente | GitHub Action automático |
| UNIFORME TROY LEE GP AIR TEAM 81 | 2026-04-28 | ❌ NO borrado físicamente | Eliminación manual |
| UNIFORME ALPINESTARS FLUID APEX | 2026-04-28 | ❌ NO borrado físicamente | Eliminación manual |

---

## Verificación Rápida

### ¿CloudCannon borró el archivo correctamente?

```bash
# En tu terminal local
git pull
git log -1 --name-status

# Busca el commit más reciente de CloudCannon
# Debería decir:
# D    cms/productos/nombre-producto.json
# 
# La "D" significa "Deleted" ✅
# Si no aparece la "D", CloudCannon no lo borró ❌
```

### ¿El archivo aún existe físicamente?

```powershell
# Verificar si el archivo existe
Test-Path cms\productos\nombre-producto.json

# True = Archivo existe ❌ (CloudCannon falló)
# False = Archivo no existe ✅ (CloudCannon funcionó)
```

### ¿El producto sigue en index.json?

```bash
# Buscar en index.json
Get-Content cms\productos\index.json | Select-String "nombre-producto"

# Si aparece → CloudCannon falló ❌
# Si no aparece → CloudCannon funcionó ✅
```

---

## Reportar el Bug a CloudCannon

### Información para Soporte:

```
Asunto: Bug - Delete operations don't physically remove files from Git repository

Descripción:
When I delete a product in CloudCannon CMS:
1. The product appears as deleted in CloudCannon UI ✅
2. CloudCannon makes a commit to GitHub ✅
3. BUT the .json file is NOT physically deleted from the repository ❌
4. The file remains in cms/productos/ ❌
5. index.json still lists the deleted file ❌
6. The product still appears on the website ❌

Expected behavior:
- CloudCannon should physically delete the .json file from Git
- The commit should show the file as "deleted" (git status: D)

Actual behavior:
- CloudCannon only updates its internal database
- The .json file remains in the Git repository
- No deletion is recorded in Git

Evidence:
- Commit hash: [INSERT COMMIT HASH]
- Deleted files that still exist:
  - cms/productos/uniforme-troy-lee-gp-air-team-81.json
  - cms/productos/uniforme-alpinestars-fluid-apex.json

Git provider: GitHub
Sync method: Git Auto-Sync (not CloudCannon Sync)
```

---

## Soluciones Alternativas

### **Opción 1: Usar GitHub directamente para borrar**
En lugar de borrar en CloudCannon:
1. Ve a GitHub → repositorio → `cms/productos/`
2. Busca el archivo del producto
3. Haz clic → "Delete file" → "Commit changes"
4. ✅ GitHub Action detectará la eliminación
5. ✅ `index.json` se regenerará automáticamente

**Ventaja:** Funciona 100% de las veces  
**Desventaja:** No usas la UI de CloudCannon

---

### **Opción 2: Script de limpieza automática**
Crear un script que:
1. Compara archivos en `cms/productos/` vs `index.json`
2. Detecta archivos que están en index.json pero NO en el directorio
3. Los elimina del index automáticamente

**Ventaja:** Automatiza la limpieza  
**Desventaja:** No soluciona el problema de raíz

---

### **Opción 3: Migrar a otro CMS**
Evaluar CMS alternativos:
- **Decap CMS** (anteriormente Netlify CMS)
- **TinaCMS**
- **Contentful**
- **Sanity**

**Ventaja:** Mejor soporte técnico  
**Desventaja:** Migración compleja, posible costo

---

## Recomendación Actual

### **Flujo de trabajo recomendado:**

```
┌─────────────────────────────────────────────────────────┐
│  BORRAR PRODUCTO - FLUJO RECOMENDADO                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Borrar producto en CloudCannon                     │
│         ↓ (esperar 1 min)                               │
│  2. Verificar en GitHub si el archivo se eliminó       │
│         ↓                                               │
│  3A. SI se eliminó (archivo dice "deleted")            │
│      → ✅ GitHub Action lo procesará automáticamente   │
│      → Esperar 2-3 minutos → Web actualizada           │
│                                                         │
│  3B. NO se eliminó (archivo aún existe)                │
│      → Eliminación manual (ver pasos arriba)           │
│      → Commit y push manual                            │
│      → Web actualizada en ~1 minuto                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist para Borrar Productos

- [ ] 1. Borrar producto en CloudCannon
- [ ] 2. Esperar 1 minuto a que CloudCannon haga push
- [ ] 3. Ir a GitHub → Commits → Verificar commit de CloudCannon
- [ ] 4. Abrir commit → Verificar si archivo aparece como "deleted"
- [ ] 5A. Si dice "deleted" → ✅ Listo, esperar deploy automático
- [ ] 5B. Si NO dice "deleted" → Eliminación manual requerida
- [ ] 6. Verificar en la web después de 3 minutos
- [ ] 7. Hard refresh (Ctrl + Shift + R) para limpiar caché

---

## Estado Actual

**Última actualización:** 2026-04-28  
**Productos eliminados manualmente:** 2  
**Productos eliminados automáticamente:** 3  
**Tasa de éxito de CloudCannon:** ~60% (3 de 5 eliminaciones)

---

## Notas Adicionales

- **NO usar `git push --force`** → Puede desconectar Cloudflare
- **Siempre hacer `git pull --rebase`** antes de push manual
- **Mantener backup** de `cms/productos/` antes de eliminaciones masivas
- **Documentar cada eliminación manual** en el commit message

---

**Contacto Soporte CloudCannon:** support@cloudcannon.com  
**Documentación Git Sync:** https://cloudcannon.com/documentation/git-sync/
