# 📘 GUÍA COMPLETA - CMS DE CATEGORÍAS MXZONE

## 🎯 RESUMEN DE IMPLEMENTACIÓN

### ✅ Fases Completadas:
1. **Quick Filter 2.0** - Sin marcas, con flechas de navegación, chips más grandes
2. **Buscador "En el Bolsillo"** - En menú móvil, accesible desde cualquier página
3. **CMS Categorías** - Estructura base en CloudCannon
4. **Categorías Completas** - Todo interconectado, "Todo" como padre universal

---

## 📁 ESTRUCTURA DEL CMS DE CATEGORÍAS

### Ubicación:
```
cms/categorias/
├── index.json              # Índice de todas las categorías
├── cascos.json             # Categoría: Cascos
├── uniformes.json          # Categoría: Uniformes
├── botas.json              # Categoría: Botas
├── jersey.json             # Categoría: Jerseys
├── guantes.json            # Categoría: Guantes
├── gafas.json              # Categoría: Gafas
├── protecciones.json       # Categoría: Protecciones
├── gorras.json             # Categoría: Gorras
├── maletas.json            # Categoría: Maletas
├── accesorios.json         # Categoría: Accesorios
├── ninos.json              # Categoría Padre: Niños
├── uniformes-ninos.json    # Subcategoría: Uniformes Niños
├── cascos-ninos.json       # Subcategoría: Cascos Niños
├── botas-ninos.json        # Subcategoría: Botas Niños
├── guantes-ninos.json      # Subcategoría: Guantes Niños
├── gafas-ninos.json        # Subcategoría: Gafas Niños
└── protecciones-ninos.json # Subcategoría: Protecciones Niños
```

---

## 🔧 CAMPOS DE CADA CATEGORÍA

```json
{
  "name": "cascos",              // ID único (usado en código)
  "label": "Cascos",             // Nombre visible en la tienda
  "icon": "⛑️",                  // Emoji del ícono
  "parent": "",                  // Categoría padre (vacío = es padre)
  "order": 1,                    // Orden de aparición (1 = primero)
  "enabled": true,               // ¿Mostrar en la tienda?
  "showInQuickFilters": true,    // ¿Mostrar en quick filters móviles?
  "description": "..."           // Descripción opcional
}
```

---

## 🎨 JERARQUÍA DE CATEGORÍAS

```
📦 TODO (padre universal - "all")
├─ ⛑️ Cascos
├─ 👕 Uniformes
├─ 👢 Botas
├─ 👕 Jerseys
├─ 🧤 Guantes
├─ 👓 Gafas
├─ 🛡️ Protecciones
├─ 🧢 Gorras
├─ 🎒 Maletas
├─ 🔧 Accesorios
└─ 🧒 Niños (padre)
   ├─ 👶 Uniformes Niños
   ├─ 🧒 Cascos Niños
   ├─ 👣 Botas Niños
   ├─ 🤚 Guantes Niños
   ├─ 👓 Gafas Niños
   └─ 🛡️ Protecciones Niños
```

---

## 🖥️ CÓMO USAR EN CLOUDCANNON

### 1. **Acceder al CMS de Categorías:**
- Ve a [CloudCannon](https://app.cloudcannon.com/)
- Selecciona tu proyecto MXZONE
- Click en "Collections" → "Categorías"

### 2. **Agregar Nueva Categoría:**
1. Click en "+ New Category"
2. Llena los campos:
   - **Name:** `mi-categoria` (sin espacios, minúsculas)
   - **Label:** `Mi Categoría` (como se ve en la tienda)
   - **Icon:** `🎯` (un emoji)
   - **Parent:** dejar vacío para padre, o seleccionar `ninos` para subcategoría
   - **Order:** número (1 = primero, 999 = último)
   - **Enabled:** ✅ para mostrar, ❌ para ocultar
   - **Show In Quick Filters:** ✅ para mostrar en móvil

3. Click en "Save"

### 3. **Editar Categoría Existente:**
1. Click en la categoría que quieras editar
2. Modifica los campos
3. Click en "Save"

### 4. **Eliminar Categoría:**
1. Click en la categoría
2. Click en "Delete" (abajo)
3. Confirma la eliminación

⚠️ **IMPORTANTE:** Si eliminas una categoría que tiene productos, esos productos quedarán sin categoría visible.

---

## 🔄 SINCRONIZACIÓN CON PRODUCTOS

### Los productos usan las categorías del CMS automáticamente:

1. **En `cloudcannon.config.yml`:**
   - Los productos tienen un campo `category` tipo `select`
   - Las opciones se actualizan manualmente aquí

2. **En `cms/config.js`:**
   - Las categorías se cargan dinámicamente desde `cms/categorias/index.json`
   - Si el CMS falla, usa categorías por defecto

3. **En la tienda (`shop.html`):**
   - Los filtros leen las categorías desde `window.MXZONE_CONFIG`
   - Los quick filters también usan esta configuración

---

## 📱 QUICK FILTER 2.0 - FUNCIONAMIENTO

### Características:
- **Sin marcas** - Solo categorías
- **Chips más grandes** - 44px altura, 100px min-width
- **Flechas de navegación** - ◀ ▶ para deslizar
- **"📦 Todo"** - Primer botón (padre universal)
- **"🧒 Niños"** - Último botón (despliega subcategorías)

### Comportamiento:
| Click en | Acción |
|----------|--------|
| 📦 Todo | Muestra TODAS las categorías |
| ⛑️ Cascos | Filtra solo cascos |
| 🧒 Niños | Abre sidebar + selecciona todas las subcategorías de niños |

---

## 🔍 BUSCADOR "EN EL BOLSILLO"

### Ubicación:
- Menú hamburguesa (3 rayitas) en móvil
- Accesible desde **CUALQUIER página**

### Funcionamiento:
1. Usuario abre menú hamburguesa
2. Escribe término de búsqueda
3. Click en 🔍 o presiona Enter
4. Redirige a: `shop.html?search=término`

### Ejemplos:
- `casco fox` → `shop.html?search=casco%20fox`
- `botas` → `shop.html?search=botas`

---

## 🛠️ ARCHIVOS CLAVE

| Archivo | Propósito |
|---------|-----------|
| `cms/categorias/*.json` | Definición de categorías |
| `cms/config.js` | Configuración global + loader dinámico |
| `cloudcannon.config.yml` | Configuración del CMS |
| `shop.html` | Página de tienda con filtros |
| `js/main.js` | Lógica de filtros y búsqueda |
| `css/styles.css` | Estilos de quick filters y menú |

---

## 🎯 FLUJO DE TRABAJO RECOMENDADO

### Para agregar un producto nuevo:
1. **CloudCannon → Productos → New Product**
2. Llena datos del producto
3. En "Categoría", selecciona la categoría correspondiente
4. Save → Auto-sync a GitHub → Deploy automático

### Para agregar una categoría nueva:
1. **CloudCannon → Categorías → New Category**
2. Llena campos (name, label, icon, parent, order, etc.)
3. Save → Auto-sync a GitHub
4. **Importante:** Actualiza `cloudcannon.config.yml` para agregar la categoría al select de productos

### Para ocultar una categoría temporalmente:
1. CloudCannon → Categorías → Edit categoría
2. Cambia `enabled` a `false`
3. Save → Los productos de esa categoría se ocultan automáticamente

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. **Orden de Categorías:**
- `order: 0-10` → Categorías principales
- `order: 100` → Categorías padre especiales (Niños)
- `order: 1-6` (en children) → Subcategorías

### 2. **Categorías Vacías:**
- Si una categoría tiene 0 productos, se oculta automáticamente
- La función `hideEmptyCategories()` en `js/main.js` maneja esto

### 3. **Sincronización:**
- CloudCannon hace auto-sync a GitHub
- Cloudflare Pages detecta cambios y hace deploy automático
- Tiempo estimado: 2-5 minutos

### 4. **Cache Buster:**
- Cada vez que agregues categorías, actualiza `imageVersion` en `cms/config.js`
- Ejemplo: `v6-20260430` → `v6-20260430-1`

---

## 🧪 TESTING

### Checklist después de agregar categoría:
- [ ] Aparece en CloudCannon CMS
- [ ] Aparece en `cms/categorias/index.json`
- [ ] Está disponible en el select de productos
- [ ] Se muestra en el sidebar de filtros (si tiene productos)
- [ ] Se muestra en quick filters (si `showInQuickFilters: true`)
- [ ] El filtro funciona correctamente en tienda
- [ ] No rompe el layout en móvil

---

## 📞 SOPORTE

### Si algo sale mal:
1. Revisa la consola del navegador (F12)
2. Verifica que `cms/categorias/index.json` exista
3. Confirma que las categorías tengan `enabled: true`
4. Revisa el deploy de Cloudflare Pages

### Comandos útiles:
```bash
# Regenerar index.json de categorías
cd mxzone-landing
# (Script manual o hacerlo desde CloudCannon)

# Verificar estado del git
git status

# Forzar sync con CloudCannon
# (Desde CloudCannon: Settings → Sync → Force Sync)
```

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS

1. **Automatizar index.json** - Script que genere el index automáticamente
2. **UI de administración** - Panel para reordenar categorías drag-and-drop
3. **Categorías anidadas múltiples** - Soporte para más niveles de jerarquía
4. **Iconos personalizados** - Además de emojis, permitir SVG/imagen

---

**¡Listo! Ya tienes control total sobre las categorías de tu tienda MXZONE!** 🎉
