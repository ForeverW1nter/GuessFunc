const fs = require('fs');
const path = require('path');
const glob = require('fs').readdirSync('src', { recursive: true }).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
const keys = new Set();
for (const f of glob) {
  const c = fs.readFileSync(path.join('src', f), 'utf-8');
  const matches = c.matchAll(/t\(['"]([^'"]+)['"]\)/g);
  for (const m of matches) keys.add(m[1]);
}
const zh = JSON.parse(fs.readFileSync('src/locales/zh/translation.json', 'utf-8'));
function check(obj, path) {
  const parts = path.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr[p] === undefined) return false;
    curr = curr[p];
  }
  return true;
}
for (const k of keys) {
  if (!check(zh, k)) console.log('Missing key: ' + k);
}
