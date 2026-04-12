// @ts-check
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

/**
 * @param {string} directory
 * @returns {void}
 */
function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const btnRegex = /<button[^>]*>/g;
      let match;
      while ((match = btnRegex.exec(content)) !== null) {
        const btn = match[0];
        if (!btn.includes('aria-label') && !btn.includes('title') && !btn.includes('>')) {
          // just seeing if they are totally unlabelled
        }
      }
    }
  }
}
processDir(dir);
