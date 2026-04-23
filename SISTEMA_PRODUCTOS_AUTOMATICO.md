# Sistema Automático de Productos - MXZONE

## ¿Qué cambió?

Antes tenías que agregar manualmente cada producto nuevo a una lista en `js/products.js`. Ahora el sistema **descubre automáticamente** todos los productos en la carpeta `cms/productos/`.

## ¿Cómo funciona?

### 1. Archivo `cms/productos/index.json`

Este archivo contiene una lista automática de **todos los productos** en tu CMS. Se genera con el script `generate-products-index.ps1`.

**Estructura:**
```json
{
  "files": [
    "producto-1.json",
    "producto-2.json",
    "producto-3.json"
  ],
  "generated": "2026-04-23",
  "total": 222
}
```

### 2. Carga Automática en `js/products.js`

La función `loadProducts()` ahora:
1. Lee `cms/productos/index.json`
2. Obtiene la lista completa de archivos JSON
3. Carga todos los productos en paralelo
4. Los muestra en la tienda automáticamente

## ¿Cómo agregar productos nuevos?

### Método Recomendado (Automático)

1. **Crea el archivo JSON** del producto en `cms/productos/`
2. **Ejecuta el script** para actualizar el index:
   ```powershell
   .\generate-products-index.ps1
   ```
3. **Haz commit y push**:
   ```bash
   git add cms/productos/
   git commit -m "Agregar nuevo producto: nombre-producto"
   git push origin main
   ```

¡Listo! El producto aparecerá automáticamente en la tienda.

### ¿Qué pasa si no actualizo el index.json?

El sistema tiene un **plan de respaldo**: si `index.json` no está disponible, usa una lista manual interna en `js/products.js`. Esto asegura que la tienda siempre funcione.

## Scripts Disponibles

### `generate-products-index.ps1`

**Qué hace:** Escanea la carpeta `cms/productos/` y genera `index.json` con todos los archivos JSON encontrados.

**Cuándo usarlo:** Cada vez que agregues o elimines productos del CMS.

**Ejemplo de uso:**
```powershell
# Desde la raíz del proyecto
.\generate-products-index.ps1

# Output esperado:
# ==================================
# Index.json generado exitosamente
# ==================================
# Total de productos: 222
# Archivo guardado: C:\...\cms\productos\index.json
```

## Beneficios del Nuevo Sistema

✅ **Automático**: No más listas manuales de 200+ productos  
✅ **Escalable**: Funciona igual con 10 o con 1000 productos  
✅ **Mantenible**: Código más limpio y fácil de entender  
✅ **Seguro**: Plan de respaldo si index.json falla  
✅ **Rápido**: Carga en paralelo todos los productos  

## Solución de Problemas

### Los productos no aparecen en la tienda

1. **Verifica que el producto tenga el campo `image`** (singular):
   ```json
   {
     "name": "Producto Ejemplo",
     "image": "assets/images/producto.jpg",
     "images": ["assets/images/producto.jpg"],
     "price": "$100.000"
   }
   ```

2. **Revisa la consola del navegador** (F12) para ver errores

3. **Actualiza el index.json**:
   ```powershell
   .\generate-products-index.ps1
   git add cms/productos/index.json
   git commit -m "Actualizar index.json"
   git push
   ```

### Error: "No se pudo cargar index.json"

Esto pasa si el archivo no existe o no está publicado. Solución:
- Ejecuta `generate-products-index.ps1`
- Haz commit y push del archivo `cms/productos/index.json`

## Flujo de Trabajo Recomendado

```
1. Agregar producto en CloudCannon (o crear JSON manualmente)
   ↓
2. Ejecutar: .\generate-products-index.ps1
   ↓
3. Verificar que index.json incluya el nuevo producto
   ↓
4. Git add, commit, push
   ↓
5. Esperar ~1 minuto para que Cloudflare/CloudCannon sincronicen
   ↓
6. ¡Producto visible en la tienda!
```

## Archivos Importantes

| Archivo | Función |
|---------|---------|
| `cms/productos/index.json` | Lista automática de todos los productos |
| `js/products.js` | Carga y muestra los productos en la tienda |
| `generate-products-index.ps1` | Script para generar index.json |

---

**Última actualización:** 2026-04-23  
**Total de productos:** 222
