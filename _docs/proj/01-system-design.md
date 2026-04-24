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
这些服务通过 React Context 提供强类型的 Hook，替代全局 EventBus。
- **`UI System`**: 提供 `<ThemeProvider>`，暴露 `useUI()` Hook（按钮、弹窗等），注入全局主题。
- **`Progression Store`**: 领域级的 Zustand Store，管理整体进度与解锁状态。
- **`Storage Service`**: 暴露 `useStorage()` Hook 获取持久化存储接口。
- **`Hub & Router`**: 主界面大厅与路由系统。接管 URL 变化，展示游戏列表，并暴露出 `<Slot name="GAME_LIST" />` 供游戏注册。

## 3. 共享功能模组 (Shared Feature Widgets)
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

## 4. 增量更新模组：游戏实体 (Game Modules)
游戏本身作为插件挂载，其内部进一步拆分为高度解耦的子模组。

### 4.1 `mod-game-guessfunc` (猜函数游戏)
- `submod-math-engine`: 纯数学计算与等价性验证核心，**运行在 Web Worker 中**，保障 UI 帧率。
- `submod-desmos-renderer`: 纯 UI 渲染器，接收函数字符串并绘制，使用全局 Token。
- `submod-function-input`: 提供数学符号虚拟键盘与输入框。
- `submod-parameter-slider`: 针对含参关卡的滑动条控制组件。
- `submod-guess-evaluator`: 业务中枢容器（Container），协调上述纯 UI 子模组，调用 `useProgressionStore()` 等全局 Hook 判断通关。

### 4.2 `mod-game-gatefunc` (逻辑门游戏)
- `submod-circuit-engine`: 逻辑计算引擎（真值表、布尔运算），**运行在 Web Worker 中**。
- `submod-node-canvas`: 节点连线可视化编辑器（纯 UI 画布）。
- `submod-gate-inventory`: 逻辑门背包与拖拽源管理器。
- `submod-level-progression`: 关卡树/进度地图渲染。
- `submod-gate-evaluator`: 目标比对与通关结算中枢。