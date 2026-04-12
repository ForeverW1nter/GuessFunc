const fs = require('fs');

const zhPath = 'src/locales/zh/translation.json';
const enPath = 'src/locales/en/translation.json';

const zh = JSON.parse(fs.readFileSync(zhPath, 'utf-8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

function setNested(obj, path, value) {
  const parts = path.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!curr[parts[i]]) curr[parts[i]] = {};
    curr = curr[parts[i]];
  }
  curr[parts[parts.length - 1]] = value;
}

const additionsZh = {
  "tools.storyEditor.editRoute": "编辑线路",
  "tools.storyEditor.confirmDeleteLevel": "确认删除此关卡吗？",
  "tools.storyEditor.confirmDeleteFile": "确认删除此文件吗？",
  "game.mathEngine.needEquation": "需要方程式",
  "game.mathEngine.opMismatch": "运算符不匹配",
  "game.mathEngine.ineqMismatch": "不等号方向不匹配",
  "game.mathEngine.eqMismatch": "等号不匹配",
  "mods.rateLimitError": "请求过于频繁，请稍后再试",
  "mods.sortAsc": "升序",
  "mods.sortDesc": "降序",
  "mods.dragToReorder": "拖拽以重新排序",
  "mods.unknownAuthor": "未知作者",
  "mods.cancel": "取消",
  "story.modeOfficial": "官方故事",
  "story.modeCustom": "自定义",
  "story.modeMod": "模组",
  "story.selectRouteTip": "请选择一条线路",
  "common.none": "无",
  "tools.storyEditor.deleteRoute": "删除线路",
  "tools.storyEditor.deleteChapter": "删除章节",
  "tools.storyEditor.untitled": "未命名",
  "tools.storyEditor.noDirs": "暂无目录",
  "tools.storyEditor.addChapter": "添加章节",
  "tools.storyEditor.newChapterTitle": "第 {{index}} 章",
  "tools.storyEditor.newRoute": "新线路",
  "tools.storyEditor.newRouteDesc": "新线路描述"
};

const additionsEn = {
  "tools.storyEditor.editRoute": "Edit Route",
  "tools.storyEditor.confirmDeleteLevel": "Are you sure you want to delete this level?",
  "tools.storyEditor.confirmDeleteFile": "Are you sure you want to delete this file?",
  "game.mathEngine.needEquation": "Equation needed",
  "game.mathEngine.opMismatch": "Operator mismatch",
  "game.mathEngine.ineqMismatch": "Inequality direction mismatch",
  "game.mathEngine.eqMismatch": "Equality mismatch",
  "mods.rateLimitError": "Too many requests, please try again later",
  "mods.sortAsc": "Ascending",
  "mods.sortDesc": "Descending",
  "mods.dragToReorder": "Drag to reorder",
  "mods.unknownAuthor": "Unknown Author",
  "mods.cancel": "Cancel",
  "story.modeOfficial": "Official Story",
  "story.modeCustom": "Custom",
  "story.modeMod": "Mods",
  "story.selectRouteTip": "Please select a route",
  "common.none": "None",
  "tools.storyEditor.deleteRoute": "Delete Route",
  "tools.storyEditor.deleteChapter": "Delete Chapter",
  "tools.storyEditor.untitled": "Untitled",
  "tools.storyEditor.noDirs": "No Directories",
  "tools.storyEditor.addChapter": "Add Chapter",
  "tools.storyEditor.newChapterTitle": "Chapter {{index}}",
  "tools.storyEditor.newRoute": "New Route",
  "tools.storyEditor.newRouteDesc": "New Route Description"
};

for (const [k, v] of Object.entries(additionsZh)) {
  setNested(zh, k, v);
}
for (const [k, v] of Object.entries(additionsEn)) {
  setNested(en, k, v);
}

fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Translations updated.');
