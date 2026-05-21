const fs = require('fs');

function findEmojis(content, source) {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const matches = content.match(emojiRegex);
  if (matches) {
    console.log(`\n=== ${source} ===`);
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.match(emojiRegex)) {
        console.log(`  Line ${i+1}: ${line.trim().substring(0, 80)}...`);
      }
    });
  }
}

// Check key files
const files = [
  'css/styles.css',
  'js/main.js', 
  'js/products.js',
  'shop.html',
  'index.html'
];

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    findEmojis(content, file);
  } catch(e) {}
});
