const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 Iniciando deploy limpio...');

// Crear directorio temporal para deploy
const tempDir = path.join(os.tmpdir(), 'mxzonestore-deploy-' + Date.now());
fs.mkdirSync(tempDir, { recursive: true });

// Archivos y carpetas a excluir
const excludePatterns = [
  '.git',
  '.gitignore',
  '.wranglerignore',
  'node_modules',
  '.wrangler',
  '.claude',
  'CANVAS',
  'package.json',
  'deploy.js',
  '*.log',
  '.github'
];

// Copiar solo archivos necesarios
const filesToCopy = [
  'index.html',
  'shop.html',
  'promociones.html',
  'about.html',
  'testimonials.html',
  'faq.html',
  'contact.html',
  'product.html',
  'shipping.html',
  'returns.html',
  'sizes.html',
  'terms.html',
  'privacy.html',
  'admin'
];

const foldersToCopy = [
  'css',
  'js',
  'assets',
  'cms'
];

console.log('📦 Copiando archivos al directorio temporal...');

// Copiar archivos raiz
filesToCopy.forEach(file => {
  const src = path.join(process.cwd(), file);
  const dest = path.join(tempDir, file);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`  ✓ ${file}`);
  }
});

// Copiar carpetas
foldersToCopy.forEach(folder => {
  const src = path.join(process.cwd(), folder);
  const dest = path.join(tempDir, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`  ✓ ${folder}/`);
  }
});

// Crear wrangler.jsonc en el directorio temporal
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

fs.writeFileSync(
  path.join(tempDir, 'wrangler.jsonc'),
  JSON.stringify(wranglerConfig, null, 2)
);

console.log('✨ Archivos copiados. Ejecutando wrangler deploy...');

// Ejecutar wrangler deploy desde el directorio temporal
try {
  execSync(`npx wrangler deploy`, {
    stdio: 'inherit',
    cwd: tempDir,
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID }
  });
  console.log('✅ Deploy completado!');
} catch (error) {
  console.error('❌ Error en deploy:', error.message);
  process.exit(1);
} finally {
  // Limpiar directorio temporal
  console.log('🧹 Limpiando directorio temporal...');
  fs.rmSync(tempDir, { recursive: true, force: true });
}
