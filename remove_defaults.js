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
let count = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const newContent = content.replace(/t\(\s*(['"])([^'"]+)\1\s*,\s*(['"])([^'"]*)\3(\s*,\s*\{[^}]+\})?\s*\)/g, (match, q1, key, q2, defaultText, opts) => {
    return opts ? `t('${key}'${opts})` : `t('${key}')`;
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    count++;
    console.log('Updated', file);
  }
});

console.log('Total files updated:', count);