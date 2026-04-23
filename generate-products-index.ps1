# Script para generar automáticamente index.json con todos los productos
# Este script descubre todos los archivos .json en cms/productos/

$productsPath = "C:\Users\seven\LLOCAMA\mxzone-landing\cms\productos"
$outputFile = "$productsPath\index.json"

# Obtener todos los archivos JSON, excluyendo index.json
$files = Get-ChildItem $productsPath -Filter "*.json" | 
         Where-Object { $_.Name -ne "index.json" } | 
         Select-Object -ExpandProperty Name | 
         Sort-Object

# Crear objeto JSON
$indexData = @{
    files = $files
    generated = (Get-Date -Format "yyyy-MM-dd")
    total = $files.Count
}

# Guardar como JSON
$indexData | ConvertTo-Json -Depth 3 | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "=================================="
Write-Host "Index.json generado exitosamente"
Write-Host "=================================="
Write-Host "Total de productos: $($files.Count)"
Write-Host "Archivo guardado: $outputFile"
Write-Host ""
Write-Host "Primeros 5 productos:"
$files | Select-Object -First 5 | ForEach-Object { Write-Host "  - $_" }
