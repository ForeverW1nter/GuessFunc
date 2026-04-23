# 核心架构设计与模块划分 (Architecture Design)

本项目采用**微内核/插件化架构 (Microkernel / Plugin Architecture)**。整个系统被划分为四个层级，从下到上依次为：内核、基建、共享服务、游戏模组。

## 1. 根节点：微内核 (The Kernel)
这是唯一不可替换的极简底座，纯 TypeScript 实现，无 UI。
- **`ModuleRegistry`**: 负责动态加载、初始化各层级的模组，解决依赖树。
- **`EventBus`**: 全局事件总线，实现跨模组通信的唯一合法渠道。
- **`SlotManager`**: UI 插槽管理器，允许模组将自己的 React 节点注入到其他模组预留的占位符中。
- **`DesignTokensContract`**: 定义系统必须具备的 CSS 变量契约。

## 2. 必须有的模组：基础建设 (Foundation Modules)
这些是平台的“操作系统 UI”，可以被整体替换，但不能缺失。
- **`mod-ui-manager` (UI 管理中心)**: 提供 `useUI()` Hook（按钮、弹窗等），注入并管理全局主题（CSS Variables）。
- **`mod-router` (路由系统)**: 接管 URL 变化，分发页面渲染。
- **`mod-storage` (存储系统)**: 提供持久化存储接口。
- **`mod-hub` (主界面/启动器)**: 展示游戏列表，提供大厅展示（成就、用户信息），并暴露出 `<Slot name="GAME_LIST" />` 供游戏注册。

## 3. 共享功能模组 (Shared Feature Modules)
为所有游戏提供跨域支撑的独立模组。
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
- `submod-math-engine`: 纯数学计算与等价性验证核心。
- `submod-desmos-renderer`: 纯 UI 渲染器，接收函数字符串并绘制，使用全局 Token。
- `submod-function-input`: 提供数学符号虚拟键盘与输入框。
- `submod-parameter-slider`: 针对含参关卡的滑动条控制组件。
- `submod-guess-evaluator`: 业务中枢，协调上述子模组，判断通关并通过 EventBus 广播。

### 4.2 `mod-game-gatefunc` (逻辑门游戏)
- `submod-circuit-engine`: 逻辑计算引擎（真值表、布尔运算）。
- `submod-node-canvas`: 节点连线可视化编辑器（纯 UI 画布）。
- `submod-gate-inventory`: 逻辑门背包与拖拽源管理器。
- `submod-level-progression`: 关卡树/进度地图渲染。
- `submod-gate-evaluator`: 目标比对与通关结算中枢。