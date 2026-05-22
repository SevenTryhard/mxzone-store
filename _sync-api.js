const fs = require('fs');
const path = require('path');
const https = require('https');

const API_URL = 'https://growisoulsand.pages.dev/api/store/products?project=SevenTryhard%2Fmxzone-store';
const OUT_DIR = path.resolve(__dirname, 'cms/productos');

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Accept: 'application/json' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJson(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  console.log('Fetching products from', API_URL);
  const data = await fetchJson(API_URL);
  const products = data.products || [];
  console.log('Received', products.length, 'products');

  const existing = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  for (const f of existing) {
    fs.unlinkSync(path.join(OUT_DIR, f));
  }
  console.log('Removed', existing.length, 'old files');

  const desiredFiles = new Set();
  for (const p of products) {
    const safeSlug = slugify(p.name || 'unknown') || 'producto-sin-nombre';
    const fileName = safeSlug + '.json';
    const filePath = path.join(OUT_DIR, fileName);

    const payload = {
      name: p.name || '',
      image: p.image || '',
      price: p.price || '',
      sizes: p.sizes || '',
      badge: p.badge || '',
      category: p.category || '',
      description: p.description || '',
      images: Array.isArray(p.images) ? p.images : [],
      sku: p.sku || '',
      color: p.color || '',
      agotado: p.agotado === true
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    desiredFiles.add(fileName);
  }

  const currentFiles = fs.readdirSync(OUT_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .sort();
  const indexData = {
    files: currentFiles,
    total: currentFiles.length,
    generated: new Date().toISOString().split('T')[0]
  };
  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(indexData, null, 2) + '\n', 'utf8');

  console.log('index.json regenerated:', currentFiles.length, 'products');
  console.log('Done!');
}

main().catch(err => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
