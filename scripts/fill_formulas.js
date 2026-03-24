const fs = require('fs');
const path = require('path');

// 读取输入的公式列表文件
// 格式要求：
// @ROUTE: 线路ID (必须指定，如 AI1)
// 每行一个 LaTeX 公式，按顺序填充到对应线路的各个关卡中

const inputPath = path.join(__dirname, 'formulas_input.txt');
const levelsJsPath = path.join(__dirname, '../js/levels.js');

if (!fs.existsSync(inputPath)) {
    console.error('请先在 scripts 目录下创建 formulas_input.txt 文件！');
    process.exit(1);
}

if (!fs.existsSync(levelsJsPath)) {
    console.error('找不到 levels.js 文件，请先运行生成剧情的脚本。');
    process.exit(1);
}

// 模拟 MathEngine 中针对 Desmos 的格式处理
function cleanForDesmos(latex) {
    if (!latex) return "";
    let s = latex;

    // 移除多余空白和特定标记
    s = s.replace(/\s+/g, ' ').trim();
    s = s.replace(/\\exponentialE/g, 'e');
    s = s.replace(/\\imaginaryI/g, 'i');
    s = s.replace(/\\differentialD/g, 'd');
    s = s.replace(/\\mathrm{([^{}]+)}/g, '$1');
    s = s.replace(/\\operatorname{([^{}]+)}/g, '$1');

    // 确保函数名前有反斜杠
    const funcs = ['sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'ln', 'log', 'min', 'max', 'exp'];
    funcs.forEach(f => {
        const re = new RegExp(`(?<!\\\\)\\b${f}\\b`, 'gi');
        s = s.replace(re, `\\${f}`);
    });

    // 规范化特定函数格式
    s = s.replace(/\\asin\b/g, "\\arcsin");
    s = s.replace(/\\acos\b/g, "\\arccos");
    s = s.replace(/\\atan\b/g, "\\arctan");
    s = s.replace(/\\abs{([^{}]+)}/g, "\\left|$1\\right|");
    
    // 自动替换常规绝对值为 \left| ... \right|
    // 处理形如 |x| 的格式，如果原公式包含的话
    // 这里使用一个简单的正则来匹配成对的 |...|
    let prevS = "";
    while(s !== prevS) {
        prevS = s;
        s = s.replace(/\|([^|]+)\|/g, "\\left|$1\\right|");
    }

    return s;
}

const lines = fs.readFileSync(inputPath, 'utf8').split('\n');

let routeId = null;
let formulas = [];

for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@ROUTE:')) {
        routeId = trimmed.substring(7).trim();
    } else if (trimmed.length > 0 && !trimmed.startsWith('#')) {
        formulas.push(trimmed);
    }
}

if (!routeId) {
    console.error('错误：请在 formulas_input.txt 的第一行指定 @ROUTE: 线路ID');
    process.exit(1);
}

const levelsJsContent = fs.readFileSync(levelsJsPath, 'utf8');

// 解析 levels.js 找到 ROUTES
const routesMatch = levelsJsContent.match(/\/\*===ROUTES_START===\*\/([\s\S]*?)\/\*===ROUTES_END===\*\//);

if (!routesMatch) {
    console.error('无法解析 levels.js，请确保其格式包含 /*===ROUTES_START===*/');
    process.exit(1);
}

let routes;
try {
    routes = JSON.parse(routesMatch[1]);
} catch (e) {
    console.error('解析 ROUTES JSON 失败:', e);
    process.exit(1);
}

const routeIndex = routes.findIndex(r => r.id === routeId);
if (routeIndex === -1) {
    console.error(`错误：在 levels.js 中找不到线路 ID 为 [${routeId}] 的数据。请先运行生成剧情的脚本。`);
    process.exit(1);
}

let levels = routes[routeIndex].levels;

// 填充公式
let filledCount = 0;
for (let i = 0; i < levels.length && i < formulas.length; i++) {
    const rawLine = formulas[i];
    let latexStr = rawLine;
    let paramsObj = null;

    // 解析是否包含参数，格式：公式 | a=1, b=2
    if (rawLine.includes('|')) {
        const parts = rawLine.split('|');
        latexStr = parts[0].trim();
        const paramStr = parts[1].trim();
        
        if (paramStr) {
            paramsObj = {};
            const paramPairs = paramStr.split(',');
            paramPairs.forEach(pair => {
                const [key, val] = pair.split('=');
                if (key && val !== undefined) {
                    const parsedVal = parseFloat(val.trim());
                    if (!isNaN(parsedVal)) {
                        paramsObj[key.trim()] = parsedVal;
                    }
                }
            });
        }
    }

    levels[i].target = cleanForDesmos(latexStr);
    
    // 处理参数字段
    if (paramsObj && Object.keys(paramsObj).length > 0) {
        levels[i].params = paramsObj;
    } else {
        delete levels[i].params; // 如果没有参数，确保清理掉可能存在的旧参数
    }
    
    filledCount++;
}

routes[routeIndex].levels = levels;

// 重建 levels.js
const newLevelsJsContent = levelsJsContent.replace(
    /\/\*===ROUTES_START===\*\/[\s\S]*?\/\*===ROUTES_END===\*\//,
    `/*===ROUTES_START===*/\n${JSON.stringify(routes, null, 4)}\n/*===ROUTES_END===*/`
);

fs.writeFileSync(levelsJsPath, newLevelsJsContent, 'utf8');

console.log(`成功填充了 ${filledCount} 个公式到线路 [${routeId}] 中！`);
if (formulas.length < levels.length) {
    console.warn(`警告：提供的公式数量 (${formulas.length}) 少于关卡数量 (${levels.length})。部分关卡未更新公式。`);
} else if (formulas.length > levels.length) {
    console.warn(`警告：提供的公式数量 (${formulas.length}) 多于关卡数量 (${levels.length})。多余的公式被忽略。`);
}
