// @ts-check
import * as fs from 'fs';

/**
 * @param {string} filePath
 * @param {RegExp} searchRegex
 * @param {any} replaceFunc
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

replaceInFile('src/store/useStoryStore.ts', /['"]\.\.\/\.\.\/types\/story['"]/g, "'../types/story'");
replaceInFile('src/store/useStoryStore.ts', /r => r\.id/g, "(r: { id: string }) => r.id");
replaceInFile('src/store/useStoryStore.ts', /c => c\.id/g, "(c: { id: string }) => c.id");
replaceInFile('src/store/useStoryStore.ts', /l => l\.id/g, "(l: { id: string }) => l.id");

replaceInFile('src/features/game/hooks/useLevelRouteLoader.ts', /c => c\.id/g, "(c: { id: string }) => c.id");
replaceInFile('src/features/game/hooks/useLevelRouteLoader.ts', /l => l\.id/g, "(l: { id: string }) => l.id");

replaceInFile('src/features/story/components/LevelSelectModal.tsx', /r => r\.id/g, "(r: { id: string }) => r.id");
replaceInFile('src/features/story/components/LevelSelectModal.tsx', /\(chapter, chapterIndex\)/g, "(chapter: { id: string }, chapterIndex: number)");
replaceInFile('src/features/story/components/LevelSelectModal.tsx', /l => l\.id/g, "(l: { id: string }) => l.id");
replaceInFile('src/features/story/components/LevelSelectModal.tsx', /id =>/g, "(id: string) =>");
replaceInFile('src/features/story/components/LevelSelectModal.tsx', /c => c\.id/g, "(c: { id: string }) => c.id");

replaceInFile('src/features/ui/components/Topbar.tsx', /c => c\.id/g, "(c: { id: string }) => c.id");
replaceInFile('src/features/ui/components/Topbar.tsx', /l => l\.id/g, "(l: { id: string }) => l.id");
