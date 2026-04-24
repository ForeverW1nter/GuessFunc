# 核心架构设计与模块划分 (Architecture Design)

本项目采用**微内核/插件化架构 (Microkernel / Plugin Architecture)**。整个系统被划分为四个层级，从下到上依次为：内核、基建、共享服务、游戏模组。

## 1. 纯 TypeScript 微内核层 (Microkernel Core)
**只负责**依赖注入、状态同步和生命周期管理，没有任何业务代码。
- **`ModuleRegistry`**: 模块注册表，处理模块挂载、版本检查与卸载。
- **`EventBus`**: 用于跨模块通信（如：发送“关卡通关”事件）。
- **`SlotManager`**: UI 插槽管理器，允许模组将自己的 React 节点注入到其他模组预留的占位符中。
- **`DesignTokensContract`**: 定义系统必须具备的 CSS 变量契约。
- **通用关卡协议 (Universal Level Protocol)**：平台级关卡数据标准 `{ id: string, gameId: string, author: string, payload: any }`。所有社区关卡、自建关卡均基于此协议跨游戏流转。

## 2. 必须有的模组：领域 Store 与基建服务 (Domain Stores & Foundation)
**负责**提供平台级的功能，必须存在，但可以通过微内核热替换。
- **`mod-ui-manager`**: 提供 `<UIProvider>`，全局主题（Theme）、通知（Toast）、弹出层（Overlay）的管理。
- **`mod-router`**: 平台统一路由（基于 React Router `HashRouter`），拦截所有路由跳转，配合 `SlotManager` 实现平滑的页面过渡（Shared Element Transition）。
- **`mod-storage`**: 统一存档管理器。封装 IndexedDB，绕过 5MB 限制，管理玩家进度、设置。

## 3. 数据架构设计：剧情与关卡分离 (Data Architecture: Story vs Level)
为了实现高度可扩展的故事模式与全局创意工坊，数据在底层被严格拆分：
- **剧情节点 (Story Document)**
  - 结构：`{ id, title, type (email/archive/log), content, unlockConditions, attachedLevelId }`
  - 职责：只负责叙事、UI 展示（如高级感的档案阅读界面）、世界观构建。
  - 特性：当剧情进展到需要“破解”或“挑战”时，通过 `attachedLevelId` 关联到具体的关卡。
- **关卡数据 (Level Payload)**
  - 结构：`{ id, gameId (guessfunc/gatefunc), author, difficulty, payload }`
  - 职责：纯粹的玩法数据。平台读取到 `gameId` 后，自动唤起对应的游戏引擎（如 GuessFunc）并注入 `payload`。
  - 特性：创意工坊中流转的**只有**关卡数据，没有任何剧情冗余。玩家可以直接游玩纯粹的逻辑关卡。

## 4. 共享模组与创作者生态 (Shared & Creator Tools)
为所有游戏提供跨域支撑的独立模组（遵循 DRY 原则，避免重复开发）。
- **`mod-level-generator` (随机关卡生成器)**: 
  - 提供平滑难度系数设置（如 2.15 滑动条）及对应的等级映射（初级、中级等）。
  - 提供 `<Slot name="LEVEL_OPTIONS" />`，允许特定游戏注入自己的选项（如 GuessFunc 的“是否包含参数”）。
- **`mod-level-creator` (关卡创作者)**:
  - 模式A（派生）：从当前关卡抽取数据作为新关卡基础。
  - 模式B（空白）：独立的关卡编辑器页面。
- **`mod-workshop` (创意工坊与分享)**: 关卡分享链接解析、社区关卡下载。
- **`mod-store` (模组商店)**: 动态获取并安装新的游戏模组。
- **`mod-settings` (设置中心)**: 统一的音频、偏好设置界面。

## 5. 增量更新模组：游戏实体 (Game Modules)
游戏本身作为插件挂载，其内部进一步拆分为高度解耦的子模组。

### 5.1 `mod-game-guessfunc` (猜函数游戏)
- `submod-math-engine`: 纯数学计算与等价性验证核心，**运行在 Web Worker 中**，保障 UI 帧率。
- `submod-desmos-renderer`: 纯 UI 渲染器，接收函数字符串并绘制，使用全局 Token。
- `submod-function-input`: 提供数学符号虚拟键盘与输入框。
- `submod-parameter-slider`: 针对含参关卡的滑动条控制组件。
- `submod-guess-evaluator`: 业务中枢容器（Container），协调上述纯 UI 子模组，调用 `useProgressionStore()` 等全局 Hook 判断通关。

### 5.2 `mod-game-gatefunc` (逻辑门游戏)
- `submod-circuit-engine`: 逻辑计算引擎（真值表、布尔运算），**运行在 Web Worker 中**。
- `submod-node-canvas`: 节点连线可视化编辑器（纯 UI 画布）。
- `submod-gate-inventory`: 逻辑门背包与拖拽源管理器。
- `submod-level-progression`: 关卡树/进度地图渲染。
- `submod-gate-evaluator`: 目标比对与通关结算中枢。