const fs = require('fs');
const path = require('path');

const replaceMap = {
  'bg-app-bg': 'bg-background',
  'text-app-text': 'text-foreground',
  'bg-card-bg': 'bg-card',
  'border-card-border': 'border-border',
  'text-app-primary': 'text-primary',
  'border-app-primary': 'border-primary',
  'bg-app-primary': 'bg-primary',
  'bg-modal-bg': 'bg-background',
  'text-modal-text': 'text-foreground',
  'hover:border-app-primary': 'hover:border-primary',
  'hover:text-app-primary': 'hover:text-primary',
  'hover:bg-app-primary': 'hover:bg-primary',
  'ring-app-primary': 'ring-primary',
  'focus:border-app-primary': 'focus:border-primary',
  'focus:ring-app-primary': 'focus:ring-primary',
  'bg-app-primary/10': 'bg-primary/10',
  'bg-app-primary/20': 'bg-primary/20',
  'text-app-primary/80': 'text-primary/80',
  'border-app-primary/30': 'border-primary/30',
  'border-app-primary/50': 'border-primary/50',
  'dark:text-app-primary': 'dark:text-primary',
  'dark:border-app-primary/50': 'dark:border-primary/50',
  'hover:border-app-primary/40': 'hover:border-primary/40',
  'dark:hover:border-app-primary/60': 'dark:hover:border-primary/60',
  'bg-app-primary/5': 'bg-primary/5'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  const keys = Object.keys(replaceMap).sort((a, b) => b.length - a.length);
  
  keys.forEach(key => {
    content = content.split(key).join(replaceMap[key]);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Updated:', file);
  }
});

console.log('Total files updated:', changedCount);
