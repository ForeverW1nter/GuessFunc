// @ts-check
import * as fs from 'fs';
import * as path from 'path';

/**
 * @param {string} filePath
 * @returns {void}
 */
function fixImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Fix FSD cross-feature imports: features/game/store -> store/useGameStore
    // We will do this carefully using regex for relative paths.
    content = content.replace(/from\s+['"]([^'"]*)features\/game\/store['"]/g, "from '$1store/useGameStore'");
    content = content.replace(/from\s+['"]([^'"]*)features\/story\/store['"]/g, "from '$1store/useStoryStore'");
    
    // Also fix the ToggleSwitch import in ChapterConfigCard.tsx
    content = content.replace(/from\s+['"]\.\.\/\.\.\/ui\/components\/ToggleSwitch['"]/g, "from '../../../components/ui/ToggleSwitch'");

    // Also fix src/features/game/store.ts internal relative imports
    if (filePath.endsWith('game\\store.ts') || filePath.endsWith('game/store.ts')) {
        content = content.replace(/from '\.\/useStoryStore'/g, "from '../../store/useStoryStore'");
        content = content.replace(/from '\.\/useProgressStore'/g, "from '../../store/useProgressStore'");
        content = content.replace(/from '\.\.\/utils\/mathEngine'/g, "from '../../utils/mathEngine'");
        content = content.replace(/from '\.\.\/utils\/constants'/g, "from '../../utils/constants'");
    }

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
            fixImports(fullPath);
        }
    }
}

walkDir('src');
