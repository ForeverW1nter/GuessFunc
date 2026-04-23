const fs = require('fs');
const path = require('path');

// =========================================================================
// 警告：此脚本原本用于从旧版项目中提取剧情数据。
// 旧版项目（“参考用旧版本 勿动”）已被彻底删除，此脚本目前无法运行。
// 生成的 story.json 已在 src/assets/data/story.json 中，无需再次运行。
// =========================================================================

const OLD_STORY_DIR = path.join(__dirname, '../../参考用旧版本 勿动/story');
const OLD_LEVELS_JS = path.join(__dirname, '../../参考用旧版本 勿动/js/levels.js');
const OUTPUT_FILE = path.join(__dirname, '../src/assets/data/story.json');

// 1. 解析旧版的 levels.js，提取出 ROUTES 对象
function extractRoutesFromLevelsJS() {
  const content = fs.readFileSync(OLD_LEVELS_JS, 'utf-8');
  const match = content.match(/\/\*===ROUTES_START===\*\/([\s\S]*?)\/\*===ROUTES_END===\*\//);
  if (!match) {
    throw new Error('Could not find ROUTES in levels.js');
  }
  return JSON.parse(match[1]);
}

// 2. 读取 markdown 文件的文本内容
function readMarkdownText(relativePath) {
  const fullPath = path.join(__dirname, '../../参考用旧版本 勿动', relativePath);
  if (!fs.existsSync(fullPath)) {
    return "";
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

// 3. 将 Markdown 转换为结构化的对话
function parseMarkdownToDialogues(markdownContent) {
  const lines = markdownContent.split('\n');
  const dialogues = [];
  let currentSpeaker = 'System';
  
  lines.forEach(line => {
    line = line.trim();
    if (!line) return;
    
    // 如果一行包含冒号或“：”，且前面的字数很少，通常是说话人
    const colonIndex = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('：');
    if (colonIndex > 0 && colonIndex < 15) {
      currentSpeaker = line.substring(0, colonIndex).trim();
      const text = line.substring(colonIndex + 1).trim();
      // 去除可能包围的引号
      dialogues.push({ speaker: currentSpeaker, text: text.replace(/^["“”]/, '').replace(/["”]$/, '') });
    } else {
      // 旁白或内心独白
      dialogues.push({ speaker: 'Narrator', text: line.replace(/^["“”]/, '').replace(/["”]$/, '') });
    }
  });
  return dialogues;
}

function generateStoryJSON() {
  console.log('Starting story extraction from levels.js...');
  const routes = extractRoutesFromLevelsJS();
  
  const finalData = {
    routes: []
  };

  routes.forEach(route => {
    if (route.id === 'classic') {
      route.id = 'theDayBeforeTomorrow';
    }

    const routeData = {
      id: route.id,
      title: route.title,
      description: route.description,
      showToBeContinued: route.showToBeContinued,
      chapters: []
    };

    // 构建一个 map 方便查找 level 信息
    const levelMap = new Map();
    route.levels.forEach(l => {
      levelMap.set(String(l.id), l);
    });

    if (route.regions) {
      route.regions.forEach(region => {
        // 短 ID 处理：移除重复的前缀
        // 例如 'seeYouTomorrow_ch0' 变成 'ch0'
        let shortChapterId = region.id;
        if (shortChapterId.startsWith(`${route.id}_`)) {
          shortChapterId = shortChapterId.replace(`${route.id}_`, '');
        }

        const chapterData = {
          id: shortChapterId,
          title: region.title,
          // 读取章节开头的剧情
          storyDialogues: region.descriptionPath ? parseMarkdownToDialogues(readMarkdownText(region.descriptionPath)) : [],
          levels: [],
          position: region.position || null,
          bgm: region.bgm || null,
          background: region.background || null
        };

        region.levels.forEach(levelId => {
          const lInfo = levelMap.get(String(levelId));
          if (lInfo) {
            // 短 ID 处理：移除重复的前缀
            // 例如 'seeYouTomorrow_1' 变成 '1'
            let shortLevelId = String(lInfo.id);
            if (shortLevelId.startsWith(`${route.id}_`)) {
              shortLevelId = shortLevelId.replace(`${route.id}_`, '');
            }

            chapterData.levels.push({
              id: shortLevelId,
              title: lInfo.title,
              targetFunction: lInfo.target,
              params: lInfo.params || null, // 旧版的参数 (如 {a:1, b:2})
              dialogues: lInfo.descriptionPath ? parseMarkdownToDialogues(readMarkdownText(lInfo.descriptionPath)) : [],
              // 暂时预留定义域字段，旧版 levels.js 里其实没有显式定义域，可能是写在代码里或没有
              domain: lInfo.domain || null,
              position: lInfo.position || null,
              type: lInfo.type || 'normal',
              icon: lInfo.icon || null,
              unlockConditions: lInfo.unlockConditions || null
            });
          }
        });

        routeData.chapters.push(chapterData);
      });
    }

    finalData.routes.push(routeData);
  });

  // 确保输出目录存在
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 强制使用 utf-8 写入
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2), { encoding: 'utf-8' });
  console.log(`Successfully generated structured story.json at ${OUTPUT_FILE}`);
}

generateStoryJSON();
