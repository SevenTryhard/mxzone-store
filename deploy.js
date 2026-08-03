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
// Archivos raiz: copiar TODOS los .html dinamicamente
const filesToCopy = fs.readdirSync(process.cwd())
  .filter(f => f.endsWith('.html'))
  .concat(['admin']);

const foldersToCopy = [
  'css',
  'js',
  'assets',
  'cms',
  // Ruta de vista previa consumida por el editor didactico de 4ULAB.
  // Sin esto la card no viaja al deploy y el iframe del CMS queda vacio.
  '_4ulab',
  // Codigo del Worker de preview social (og: del lado del servidor para
  // WhatsApp/Facebook). Sin esto wrangler no encuentra el `main` y el deploy
  // falla entero. NO se sirve como asset: lo excluye el .assetsignore de abajo.
  'worker'
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
// La config se COPIA del wrangler.jsonc real del repo, no se reescribe aca.
//
// Antes este script generaba su propio objeto de config, duplicando el
// contenido de wrangler.jsonc. Como el deploy corre desde el directorio
// temporal, la que mandaba era ESTA copia: cualquier cambio hecho en el
// wrangler.jsonc del repo (un binding, una ruta, un flag) se deployaba... a
// ningun lado. Silenciosamente. Una sola fuente de verdad.
const wranglerSrc = path.join(process.cwd(), 'wrangler.jsonc');
if (!fs.existsSync(wranglerSrc)) {
  console.error('❌ No existe wrangler.jsonc en la raiz del repo. Abortando.');
  process.exit(1);
}
fs.copyFileSync(wranglerSrc, path.join(tempDir, 'wrangler.jsonc'));
console.log('  ✓ wrangler.jsonc (copiado del repo, no regenerado)');

// El directorio de assets es "." (la raiz), asi que sin esto el codigo fuente
// del worker quedaria publicado y servible en https://.../worker/index.js.
fs.writeFileSync(
  path.join(tempDir, '.assetsignore'),
  ['worker/**', 'wrangler.jsonc', '.assetsignore', ''].join('\n')
);
console.log('  ✓ .assetsignore (worker/ fuera de los assets publicos)');

// Todo lo que se le pase a este script viaja tal cual a wrangler. Sirve para
// probar en un worker aparte antes de tocar la tienda en vivo:
//   node deploy.js --name mxzonestore-og-staging
const extraArgs = process.argv.slice(2).join(' ');

console.log('✨ Archivos copiados. Ejecutando wrangler deploy ' + (extraArgs || '(produccion)'));

// Ejecutar wrangler deploy desde el directorio temporal
try {
  execSync(`npx wrangler deploy ${extraArgs}`.trim(), {
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
