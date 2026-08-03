#!/usr/bin/env pwsh
# bump-cache-timestamp.ps1 — Actualiza ?t=TIMESTAMP en assets editables de MXZONESTORE
# Uso: ./bump-cache-timestamp.ps1
# Reemplaza el query string de cache-busting en todos los HTML del sitio.

$ErrorActionPreference = 'Stop'

$timestamp = Get-Date -Format 'yyyyMMddHHmm'
$extensions = @('*.html')
# OJO: si un .js editable NO esta en esta lista, su ?t= nunca se actualiza y
# los navegadores siguen sirviendo la version cacheada aunque el deploy haya
# salido bien. Le paso a product-detail.js y a promotions.js hasta el
# 2026-08-03. Al agregar un archivo nuevo a js/, agregalo aca tambien.
$assets = @(
  'js/utils.js',
  'js/main.js',
  'js/products.js',
  'js/product-detail.js',
  'js/promotions.js',
  'js/cart.js',
  'css/styles.css'
)

$root = $PSScriptRoot
$files = Get-ChildItem -Path $root -Recurse -Include $extensions |
  Where-Object {
    $_.FullName -notlike '*\node_modules\*' -and
    $_.FullName -notlike '*\admin\*' -and
    $_.FullName -notlike '*\.git\*'
  }

$changed = @()

foreach ($file in $files) {
  $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
  $original = $content

  foreach ($asset in $assets) {
    # Reemplazar el timestamp completo: ?t=OLD por ?t=NEW
    $escapedAsset = [regex]::Escape($asset)
    $pattern = $escapedAsset + '\?t=[0-9]{12}'
    $replacement = $asset + '?t=' + $timestamp
    $content = [regex]::Replace($content, $pattern, $replacement)
  }

  if ($content -ne $original) {
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    $changed += $file.FullName.Substring($root.Length + 1)
  }
}

Write-Host "Timestamp actualizado a: $timestamp" -ForegroundColor Cyan
Write-Host "Archivos modificados: $($changed.Count)" -ForegroundColor Green
$changed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
