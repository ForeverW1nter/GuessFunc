const fs = require('fs');
const path = require('path');

// 读取输入的结构化剧情文件
// 格式化要求：
// @ROUTE: 线路ID (默认: new_route)
// @TITLE: 线路名称 (默认: 新线路)
// @DESC: 线路简介
// # 章节名称
// [章节剧情] (可选)
// 章节的剧情内容...
// 
// ## 关卡剧情
// 关卡的内容...
//
// ## 关卡剧情
// 关卡的另一内容...

const inputPath = path.join(__dirname, 'story_input.txt');
const storyDir = path.join(__dirname, '../story');
const levelsJsPath = path.join(__dirname, '../js/levels.js');

if (!fs.existsSync(inputPath)) {
    console.error('请先在 scripts 目录下创建 story_input.txt 文件！');
    process.exit(1);
}

const content = fs.readFileSync(inputPath, 'utf8');
const lines = content.split('\n');

let chapters = [];
let currentChapter = null;
let currentLevel = null;
let isChapterStory = false;

let routeId = "new_route";
let routeTitle = "新线路";
let routeDesc = "这是一个新生成的线路...";
let trueEnding = null;
let currentFakeEnding = null;
let isEndingStory = false;

for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@ROUTE:')) {
        routeId = trimmed.substring(7).trim();
    } else if (trimmed.startsWith('@TITLE:')) {
        routeTitle = trimmed.substring(7).trim();
    } else if (trimmed.startsWith('@DESC:')) {
        routeDesc = trimmed.substring(6).trim();
    } else if (trimmed.startsWith('# ')) {
        // 新章节
        currentChapter = {
            title: trimmed.substring(2).trim(),
            story: [],
            levels: [],
            fakeEndings: []
        };
        chapters.push(currentChapter);
        isChapterStory = true;
        currentLevel = null;
        currentFakeEnding = null;
        isEndingStory = false;
    } else if (trimmed.startsWith('## ')) {
        // 检查是否是关卡还是结局
        const title = trimmed.substring(3).trim();
        if (title === "真结局") {
            trueEnding = {
                title: "真结局",
                story: []
            };
            isEndingStory = true;
            isChapterStory = false;
            currentLevel = null;
            currentFakeEnding = null;
        } else if (title.startsWith("假结局")) {
            // 格式: ## 假结局：结局名称 | 触发关卡数量
            const parts = title.split('|');
            let fakeTitle = parts[0].trim();
            if (fakeTitle === "假结局") fakeTitle = "中途结局";
            else fakeTitle = fakeTitle.replace("假结局：", "").trim();
            
            let triggerCount = null; // null 表示默认触发该章最后一关
            if (parts.length > 1) {
                triggerCount = parseInt(parts[1].trim());
            }

            currentFakeEnding = {
                title: fakeTitle,
                triggerCount: triggerCount,
                story: []
            };
            
            if (currentChapter) {
                if (!currentChapter.fakeEndings) currentChapter.fakeEndings = [];
                currentChapter.fakeEndings.push(currentFakeEnding);
            }
            
            isEndingStory = true;
            isChapterStory = false;
            currentLevel = null;
        } else if (title === "关卡剧情" || title.startsWith("关卡")) {
            // 新关卡
            currentLevel = {
                story: []
            };
            if (currentChapter) {
                currentChapter.levels.push(currentLevel);
            }
            isChapterStory = false;
            isEndingStory = false;
            currentFakeEnding = null;
        }
    } else if (trimmed.startsWith('##')) {
        // 兼容旧版写法 "## 关卡剧情" (没有空格)
        currentLevel = {
            story: []
        };
        if (currentChapter) {
            currentChapter.levels.push(currentLevel);
        }
        isChapterStory = false;
        isEndingStory = false;
        currentFakeEnding = null;
    } else {
        // 内容
        if (isChapterStory && currentChapter) {
            currentChapter.story.push(line);
        } else if (currentLevel) {
            currentLevel.story.push(line);
        } else if (isEndingStory) {
            if (currentFakeEnding) {
                currentFakeEnding.story.push(line);
            } else if (trueEnding) {
                trueEnding.story.push(line);
            }
        }
    }
}

// 清理空行
chapters.forEach(ch => {
    ch.story = ch.story.join('\n').trim();
    ch.levels.forEach(lvl => {
        lvl.story = lvl.story.join('\n').trim();
    });
    if (ch.fakeEndings) {
        ch.fakeEndings.forEach(fe => {
            fe.story = fe.story.join('\n').trim();
        });
    }
});
if (trueEnding) {
    trueEnding.story = trueEnding.story.join('\n').trim();
}

// 重建 story 文件夹
const routeDir = path.join(storyDir, routeId);
if (fs.existsSync(routeDir)) {
    fs.rmSync(routeDir, { recursive: true, force: true });
}
fs.mkdirSync(routeDir, { recursive: true });

// 创建 endings 文件夹
const endingsDir = path.join(routeDir, 'endings');
fs.mkdirSync(endingsDir, { recursive: true });

let globalLevelId = 1;
let levelsData = [];
let regionsData = [];

chapters.forEach((ch, chIndex) => {
    const chId = `${routeId}_ch${chIndex}`;
    const chDir = path.join(routeDir, `ch${chIndex}`);
    fs.mkdirSync(chDir, { recursive: true });

    let region = {
        id: chId,
        title: ch.title,
        descriptionPath: `story/${routeId}/ch${chIndex}/story.md`,
        levels: []
    };

    if (ch.story) {
        fs.writeFileSync(path.join(chDir, 'story.md'), ch.story, 'utf8');
    } else {
        delete region.descriptionPath;
    }

    // 处理假结局
    if (ch.fakeEndings && ch.fakeEndings.length > 0) {
        region.fakeEndings = [];
        ch.fakeEndings.forEach((fe, feIndex) => {
            const feId = `${chId}_fake${feIndex}`;
            const feFilename = `${feId}.md`;
            fs.writeFileSync(path.join(endingsDir, feFilename), fe.story, 'utf8');
            
            // 触发条件：
            let targetLevels = [];
            const startLevelIdx = globalLevelId;
            
            // 如果未指定 triggerCount (为 null 或 NaN)，默认取该章节的最后一关
            let count = fe.triggerCount;
            if (count === null || isNaN(count)) {
                count = ch.levels.length; // 默认触发最后一关
            }
            // 确保 count 不超过本章关卡总数，至少为1
            count = Math.max(1, Math.min(count, ch.levels.length));
            
            for(let i = 0; i < count; i++) {
                targetLevels.push(`${routeId}_${startLevelIdx + i}`);
            }

            region.fakeEndings.push({
                id: feId,
                title: fe.title,
                descriptionPath: `story/${routeId}/endings/${feFilename}`,
                unlock: {
                    type: "specific_levels",
                    target: targetLevels
                }
            });
        });
    }

    ch.levels.forEach((lvl) => {
        const lvlId = `${routeId}_${globalLevelId++}`;
        const lvlFilename = `level${lvlId}.md`;
        
        fs.writeFileSync(path.join(chDir, lvlFilename), lvl.story, 'utf8');
        
        levelsData.push({
            id: lvlId,
            title: `第 ${globalLevelId - 1} 关`,
            target: "x", // 默认目标，稍后可以用第二个脚本填充
            descriptionPath: `story/${routeId}/ch${chIndex}/${lvlFilename}`
        });
        
        region.levels.push(lvlId);
    });

    regionsData.push(region);
});

let trueEndingPath = undefined;
if (trueEnding && trueEnding.story) {
    fs.writeFileSync(path.join(endingsDir, 'true_ending.md'), trueEnding.story, 'utf8');
    trueEndingPath = `story/${routeId}/endings/true_ending.md`;
}

// 读取现有 levels.js，更新或添加新线路
let levelsJsContent = fs.readFileSync(levelsJsPath, 'utf8');
const routesMatch = levelsJsContent.match(/\/\*===ROUTES_START===\*\/([\s\S]*?)\/\*===ROUTES_END===\*\//);

let routes = [];
if (routesMatch) {
    try {
        routes = JSON.parse(routesMatch[1]);
    } catch (e) {
        console.error('解析现有 ROUTES 失败:', e);
    }
}

// 查找并替换，或追加
const routeIndex = routes.findIndex(r => r.id === routeId);
const newRoute = {
    id: routeId,
    title: routeTitle,
    description: routeDesc,
    levels: levelsData,
    regions: regionsData
};

if (trueEndingPath) {
    newRoute.endingPath = trueEndingPath;
}

if (routeIndex >= 0) {
    routes[routeIndex] = newRoute;
} else {
    routes.push(newRoute);
}

const newLevelsJsContent = levelsJsContent.replace(
    /\/\*===ROUTES_START===\*\/[\s\S]*?\/\*===ROUTES_END===\*\//,
    `/*===ROUTES_START===*/\n${JSON.stringify(routes, null, 4)}\n/*===ROUTES_END===*/`
);

fs.writeFileSync(levelsJsPath, newLevelsJsContent, 'utf8');
console.log(`剧情和关卡结构已成功生成到线路 [${routeId}]！`);
