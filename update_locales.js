import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles('src');
const keys = new Set();

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Regex to match t('key') or t('key', {opts})
  const regex = /t\(\s*(['"])([^'"]+)\1/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[2]);
  }
});

console.log('Total keys found:', keys.size);

const enLocalePath = 'src/locales/en/translation.json';
const zhLocalePath = 'src/locales/zh/translation.json';

const enLocale = JSON.parse(fs.readFileSync(enLocalePath, 'utf8'));
const zhLocale = JSON.parse(fs.readFileSync(zhLocalePath, 'utf8'));

// We need to flatten the locale files or navigate them. Since keys are dot-separated, we navigate
function getNested(obj, keyPath) {
  return keyPath.split('.').reduce((o, k) => (o || {})[k], obj);
}

function setNested(obj, keyPath, value) {
  const keys = keyPath.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
  if (lastObj[lastKey] === undefined) {
    lastObj[lastKey] = value;
    return true; // Added
  }
  return false;
}

let addedEn = 0;
let addedZh = 0;

keys.forEach(key => {
  if (getNested(enLocale, key) === undefined) {
    // Generate a default English translation based on the key
    const fallback = key.split('.').pop().replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    if (setNested(enLocale, key, fallback)) addedEn++;
  }
  
  if (getNested(zhLocale, key) === undefined) {
    // Generate a default Chinese translation (use key for now, requires manual review later if many)
    const fallback = key.split('.').pop();
    if (setNested(zhLocale, key, `[需翻译] ${fallback}`)) addedZh++;
  }
});

fs.writeFileSync(enLocalePath, JSON.stringify(enLocale, null, 2) + '\n');
fs.writeFileSync(zhLocalePath, JSON.stringify(zhLocale, null, 2) + '\n');

console.log(`Added ${addedEn} keys to English locale.`);
console.log(`Added ${addedZh} keys to Chinese locale.`);
