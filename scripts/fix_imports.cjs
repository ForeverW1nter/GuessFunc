// @ts-check
const fs = require('fs');
const path = require('path');

/**
 * @param {string} filePath
 * @param {RegExp} searchRegex
 * @param {(substring: string, ...args: string[]) => string} replaceFunc
 * @returns {void}
 */
function replaceInFile(filePath, searchRegex, replaceFunc) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    content = content.replace(searchRegex, replaceFunc);
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Updated', filePath);
    }
}

/**
 * @param {string} dir
 * @returns {void}
 */
function walkDir(dir) {
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            replaceInFile(fullPath, /['"]([^'"]*)\/store\/useGameStore['"]/g, (_m, p1) => `'${p1}/features/game/store'`);
            replaceInFile(fullPath, /['"]([^'"]*)\/store\/useStoryStore['"]/g, (_m, p1) => `'${p1}/features/story/store'`);
            replaceInFile(fullPath, /['"]([^'"]*)\/features\/ui\/components\/ToggleSwitch['"]/g, (_m, p1) => `'${p1}/components/ui/ToggleSwitch'`);
            replaceInFile(fullPath, /['"]([^'"]*)\/features\/ui\/components\/ToastContainer['"]/g, (_m, p1) => `'${p1}/components/ui/ToastContainer'`);
        }
    }
}

walkDir('src');
