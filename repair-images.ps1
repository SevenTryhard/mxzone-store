# Script para reparar rutas de imágenes en JSON de productos
# Ejecutar con precaución - hace backup automático

$ErrorActionPreference = "Stop"
$cmsPath = "cms/productos"
$backupPath = "cms/productos-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"

Write-Host "=== REPARACIÓN DE IMÁGENES MXZONE ===" -ForegroundColor Cyan
Write-Host ""

# Crear backup
Write-Host "1. Creando backup en $backupPath..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $backupPath | Out-Null
Get-ChildItem $cmsPath -Filter "*.json" | Copy-Item -Destination $backupPath -Force
Write-Host "   ✅ Backup completado" -ForegroundColor Green
Write-Host ""

# Cargar todas las imágenes disponibles
Write-Host "2. Cargando inventario de imágenes..." -ForegroundColor Yellow
$allImages = Get-ChildItem "assets/images" -Recurse -File | 
    Where-Object { $_.Extension -in @('.jpg','.jpeg','.webp','.png') } |
    ForEach-Object { $_.FullName.Replace((Get-Location).Path + '\', '').Replace('\', '/') }

Write-Host "   Total imágenes encontradas: $($allImages.Count)" -ForegroundColor Green
Write-Host ""

# Procesar cada JSON
$jsonFiles = Get-ChildItem $cmsPath -Filter "*.json" | Where-Object { $_.Name -ne 'index.json' }
$fixedCount = 0
$errorCount = 0

foreach ($jsonFile in $jsonFiles) {
    try {
        $json = Get-Content $jsonFile.FullName | ConvertFrom-Json
        $modified = $false
        
        # Verificar imagen principal
        if ($json.image) {
            $imagePath = $json.image.TrimStart('/')
            if ($imagePath -notin $allImages) {
                # Buscar imagen alternativa
                $baseName = [System.IO.Path]::GetFileNameWithoutExtension($imagePath)
                $extension = [System.IO.Path]::GetExtension($imagePath)
                
                # Intentar encontrar la misma imagen con diferente extensión
                $foundImage = $allImages | Where-Object { 
                    $_ -like "*$baseName*" -and $_ -like "*/$($json.category)/*"
                } | Select-Object -First 1
                
                if ($foundImage) {
                    Write-Host "   📝 $($jsonFile.Name): $($json.image) -> /$foundImage" -ForegroundColor Yellow
                    $json.image = "/$foundImage"
                    $modified = $true
                } else {
                    Write-Host "   ⚠️ $($jsonFile.Name): No se encontró reemplazo para $($json.image)" -ForegroundColor Red
                    $errorCount++
                }
            }
        }
        
        # Guardar si hubo modificaciones
        if ($modified) {
            $json | ConvertTo-Json | Out-File $jsonFile.FullName -Encoding UTF8
            $fixedCount++
        }
    } catch {
        Write-Host "   ❌ Error en $($jsonFile.Name): $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "=== RESUMEN ===" -ForegroundColor Cyan
Write-Host "Archivos reparados: $fixedCount" -ForegroundColor Green
Write-Host "Errores: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { 'Red' } else { 'Green' })
Write-Host ""
Write-Host "Backup guardado en: $backupPath" -ForegroundColor Yellow
