# GuessFunc 关卡与剧情创作指南

欢迎来到 GuessFunc 创作者中心！
GuessFunc 的故事模式是由静态 JSON 文件驱动的，你不需要编写任何代码，只需要按照特定的数据结构修改或生成 JSON，就能创建属于你自己的故事线、关卡和剧情碎片（文件）。

## 1. 核心概念

故事模式的数据全部存储在 `src/assets/data/story.json` 中。
它的层级结构如下：

- **Route (线路)**：最顶层的概念，代表一个独立的故事线或活动。
  - **Chapter (章节)**：线路下的文件夹，用于对关卡和文件进行分组。
    - **Level (关卡)**：玩家需要解开的数学函数谜题。
    - **File (文件/剧情碎片)**：玩家完成特定关卡后掉落的文本阅读材料。

## 2. 数据结构详解 (story.json)

整个文件的基础骨架如下：

```json
{
  "routes": [
    {
      "id": "seeYouTomorrow",
      "title": "See You Tomorrow",
      "description": "线路描述...",
      "showToBeContinued": true,
      "chapters": [
        // 章节列表...
      ]
    }
  ]
}
```

### Chapter (章节)
代表一个文件夹/目录，包含该阶段的所有关卡和剧情文件。
```json
{
  "id": "ch0",
  "title": "序章",
  "levels": [], // 关卡数组
  "files": []   // 文件数组
}
```

### Level (关卡)
代表一个具体的数学谜题。
```json
{
  "id": "1",                     // 关卡唯一ID (同章节内不能重复)
  "title": "第一题",              // 关卡名称，游戏中会显示为 "第一题.exe"
  "targetFunction": "x",         // 目标函数表达式，支持 LaTeX
  "params": null,                // (可选) 动态参数，如 {"a": 1, "b": 2}
  "domain": null,                // (可选) 定义域限制，如 "-5 < x < 5"
  "type": "normal",              // 关卡类型: normal | boss | hidden
  "unlockConditions": null,      // (可选) 前置关卡ID数组，不填则默认前一关完成后解锁
  "tip": "试试看输入 x"           // (可选) 玩家点击右下角灯泡时看到的提示文本，支持 Markdown
}
```

### File (剧情文件)
代表玩家通过特定关卡后解锁的剧情、线索或日记。
```json
{
  "id": "f1",                    // 文件唯一ID
  "title": "启示录",               // 文件名
  "extension": "md",             // 文件后缀名 (如 md, txt, log)
  "content": "# 欢迎\\n\\n你好！", // 文件内容，支持 Markdown 和 LaTeX 公式
  "unlockConditions": ["1"]      // 必须完成的关卡 ID 数组。例如 ["1"] 表示完成关卡1后解锁
}
```

## 3. 如何创建新关卡？

1. 打开 `src/assets/data/story.json`。
2. 找到你想要添加关卡的 `chapters` 数组中的某个章节。
3. 在 `levels` 数组中添加一个新的 Level 对象。
   - **注意**：如果不填 `unlockConditions`，游戏会自动认为它依赖于它在数组中的上一个关卡。
4. 如果你想在这个关卡完成后给玩家看一段剧情，就在同章节的 `files` 数组中添加一个 File 对象，并将其 `unlockConditions` 设置为这个新关卡的 `id`。

## 4. 使用可视化编辑器 (敬请期待)
为了方便非技术人员创作，我们即将在侧边栏提供一个**「关卡/剧情编辑器」**工具。
通过该工具，你可以在网页上直接配置参数、编写 Markdown 剧情，并一键导出合规的 `story.json` 文件！
