const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Archivos y carpetas a excluir
const exclude = [
  '.git',
  '.gitignore',
  '.wranglerignore',
  'node_modules',
  '.wrangler',
  '.claude',
  'CANVAS',
  'package.json',
  'deploy.js',
  '*.log'
];

// Crear wrangler.jsonc temporal sin referencia a .git
const wranglerConfig = {
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "mxzonestore",
  "compatibility_date": "2026-04-13",
  "observability": {
    "enabled": true
  },
  "assets": {
    "directory": "."
  },
  "compatibility_flags": [
    "nodejs_compat"
  ]
};

// Escribir wrangler.jsonc
fs.writeFileSync(
  path.join(process.cwd(), 'wrangler.jsonc'),
  JSON.stringify(wranglerConfig, null, 2)
);

console.log('🚀 Iniciando deploy...');

// Ejecutar wrangler deploy
try {
  execSync('npx wrangler deploy', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Deploy completado!');
} catch (error) {
  console.error('❌ Error en deploy:', error.message);
  process.exit(1);
}
