# GuessFunc 关卡与剧情创作指南

欢迎来到 GuessFunc 创作者中心！
GuessFunc 的故事模式与模组系统是由 JSON 数据驱动的。你可以通过内置的**「创意工坊 (Workshop)」**可视化编辑器，或者直接编写 JSON 文件，来创建属于你自己的故事线、关卡和剧情碎片（文件）。

## 1. 核心概念

故事模式的数据层级结构如下：

- **Route (线路/模组)**：最顶层的概念，代表一个独立的故事线或模组活动。
  - **Chapter (章节)**：线路下的文件夹，用于对关卡和文件进行分组。
    - **Level (关卡)**：玩家需要解开的数学函数谜题。
    - **File (文件/剧情碎片)**：玩家完成特定关卡后掉落的文本阅读材料。

数据来源分为两种：
1. **官方内置线路**：放置在 `src/assets/data/*.json` 中，系统会在构建时自动合并该目录下的所有 JSON 文件。
2. **创意工坊模组**：由玩家在游戏中创建或下载，保存在本地数据库 (IndexedDB) 中。

## 2. 数据结构详解

整个线路 (Route) 的基础骨架如下：

```json
{
  "routes": [
    {
      "id": "seeYouTomorrow",
      "title": "See You Tomorrow",
      "description": "线路描述...",
      "showToBeContinued": true,
      "showInPlayInterface": true,
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
  "id": "ch1",
  "title": "第一章",
  "levels": [], // 关卡数组
  "files": []   // 文件数组
}
```

### Level (关卡)
代表一个具体的数学谜题。
```json
{
  "id": "lv_1",                  // 关卡唯一ID (同章节内不能重复)
  "title": "第一题",              // 关卡名称，游戏中会显示为 "第一题.exe"
  "targetFunction": "x",         // 目标函数表达式，支持 LaTeX
  "params": null,                // (可选) 动态参数，如 {"a": 1, "b": 2}
  "domain": null,                // (可选) 定义域限制，如 "-5 < x < 5"
  "type": "normal",              // 关卡类型: normal | boss | hidden | bonus
  "unlockConditions": null,      // (可选) 前置关卡ID数组，不填则默认前一关完成后解锁
  "tip": "试试看输入 x"           // (可选) 玩家点击右下角灯泡时看到的提示文本，支持 Markdown
}
```

### File (剧情文件)
代表玩家通过特定关卡后解锁的剧情、线索或日记。
你可以通过指定 `uiType` 属性，强制系统使用不同的特色 UI 界面，提供沉浸式的阅读体验。

```json
{
  "id": "f1",                    // 文件唯一ID
  "title": "启示录",               // 文件名
  "extension": "txt",            // 文件后缀名 (仅作 UI 展示装饰用)
  "uiType": "memo",              // 核心: 决定使用的特色 UI 类型 (见下方支持列表)
  "content": "# 欢迎\\n\\n你好！", // 文件内容，支持 Markdown 和 LaTeX 公式
  "unlockConditions": ["lv_1"]   // 必须完成的关卡 ID 数组。表示完成对应关卡后解锁
}
```

#### 支持的特色 UI (`uiType`) 清单：

| UI 类型 (`uiType`) | 视觉/功能表现 | JSON `content` 格式要求 |
| :--- | :--- | :--- |
| **`log`** | **系统终端 / 代码编辑框**。带有控制台 Header，绿色终端风格或灰色代码块风格。 | 普通 Markdown 或纯文本。 |
| **`memo`** | **复古备忘录 / 便签**。米黄色背景纸张，左侧带黄色警告描边，有手写笔记感。 | 普通 Markdown 或纯文本。 |
| **`message`** | **聊天记录界面**。浅色背景，渲染类似微信/短信的“左右气泡”对话样式。 | 必须是 **JSON 对象**，包含 `messages` 数组（见下文示例）。 |
| **`mail`** | **机密邮件界面**。支持渲染结构化的 Metadata（发件人、时间、主题等），下方展示 Markdown 正文。 | 必须是 **JSON 对象**，包含 `headers` 和 `body`（见下文示例）。 |
| **`audio`** | **音频播放器 UI**。顶部带有动态跳动的音频波形柱，主体展示音频记录的文本转录。 | 普通 Markdown 或纯文本。 |
| **`doc`** | **官方文档 / PDF 样式**。顶部窗口带有 macOS 风格的三个控制圆点（红黄绿），背景正式。 | 普通 Markdown 或纯文本。 |
| **`image`** | **图片查看器**。专门用来渲染图像。 | 包含图片链接的 Markdown 或纯文本。 |
| **`default` (留空)** | **基础文本**。无特殊外壳，直接居中渲染原生的 Markdown 文本排版。 | 普通 Markdown 或纯文本。 |

#### `message` (聊天框) 与 `mail` (邮件) 的特殊内容格式

如果你使用了 `message` 或 `mail` 作为 `uiType`，`content` 字段可以直接是一个 JSON 对象，而不再需要转义为字符串。

**`message` (聊天记录) 示例**：
```json
{
  "id": "f_msg",
  "title": "拦截到的通讯",
  "extension": "msg",
  "uiType": "message",
  "content": {
    "rightSpeakers": ["Bob"],
    "messages": [
      { "speaker": "Alice", "text": "你在哪？" },
      { "speaker": "Bob", "text": "**系统室**。" }
    ]
  },
  "unlockConditions": ["lv_1"]
}
```
*注：聊天气泡内部支持 Markdown 渲染（如加粗、斜体等）。通过 `rightSpeakers` 数组可以指定哪些说话人显示在右侧气泡，未指定的将显示在左侧。*

**`mail` (机密邮件) 示例**：
```json
{
  "id": "f_mail",
  "title": "系统警告",
  "extension": "mail",
  "uiType": "mail",
  "content": {
    "headers": [
      { "key": "发件人", "value": "SYSTEM" },
      { "key": "级别", "value": "CRITICAL" }
    ],
    "body": "# 警告\n\n系统即将崩溃。"
  },
  "unlockConditions": ["lv_1"]
}
```

## 3. 如何创建新关卡？

### 方式一：使用内置可视化编辑器（推荐）
游戏内已经内置了强大的**「创意工坊 (Workshop)」**工具：
1. 启动游戏并进入“创意工坊”。
2. 点击新建路线，你可以在可视化的界面中随意添加章节、关卡和文件。
3. 可视化界面支持 Markdown 预览、`uiType` 下拉选择以及专属的聊天/邮件数据编辑器。
4. 修改会自动保存到本地数据库中，你可以随时在“故事模式”或模组选择界面中游玩。
5. 制作完成后，可以通过编辑器顶部的工具栏“导出 (Export)”按钮，直接下载标准的 JSON 文件。

### 方式二：修改官方内置文件
1. 进入项目源码 `src/assets/data/` 目录。
2. 创建或修改任意 `.json` 文件（系统会自动加载该目录下所有的 JSON）。
3. 参照上方的结构示例进行修改。
4. 保存后系统热更新即可在游戏中生效。
