const fs = require('fs');
const path = require('path');
const keys = new Set();
function scan(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const matches = content.matchAll(/t\(['"]([^'"]+)['"]/g);
      for (const match of matches) {
        keys.add(match[1]);
      }
    }
  });
}
scan('src');
console.log([...keys].sort().join('\n'));