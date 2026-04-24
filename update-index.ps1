# MXZONE STORE - Auto-Update Index Script
# Ejecutar después de cada sync de CloudCannon para mantener index.json actualizado

$ErrorActionPreference = "Stop"
$cmsPath = "cms/productos"
$indexPath = Join-Path $cmsPath "index.json"

Write-Host "=== MXZONE: Actualizando index.json ===" -ForegroundColor Cyan

# Obtener lista de todos los archivos JSON (excluyendo index.json)
$jsonFiles = (Get-ChildItem $cmsPath -Filter "*.json" | 
    Where-Object { $_.Name -ne 'index.json' } | 
    Sort-Object Name).Name

# Crear estructura del index
$indexData = @{
    generated = (Get-Date -Format "yyyy-MM-dd")
    files = $jsonFiles
    total = $jsonFiles.Count
}

# Guardar index.json
$indexData | ConvertTo-Json -Depth 100 | Out-File $indexPath -Encoding UTF8

Write-Host "✅ index.json actualizado" -ForegroundColor Green
Write-Host "   Total productos: $($indexData.total)" -ForegroundColor White
Write-Host "   Fecha: $($indexData.generated)" -ForegroundColor White
