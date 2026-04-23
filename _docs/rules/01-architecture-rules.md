# 架构与依赖规范 (Architecture Rules)

本架构的灵魂在于**“隔离”**。为了防止项目再次腐化为“屎山”，任何开发者（包括 AI）必须严格遵守以下依赖规则。

## 1. 模块层级与单向依赖原则

系统分为四个绝对层级，**上层可以依赖下层，下层绝对不能依赖上层**：
1. **内核 (Kernel)**：只包含事件总线、模块注册表、设计令牌契约。不能 import 任何 React 组件。
2. **基建模组 (Foundation)**：如 `UI Manager`、`Router`、`Storage`。
3. **共享模组 (Shared)**：如 `Level Generator`、`Creator Tools`。
4. **游戏模组 (Games)**：如 `GuessFunc`、`GateFunc` 及其内部的子模组。

## 2. 混合架构通信规范 (Pragmatic Communication)

为了避免传统微内核中“全局 EventBus 满天飞”导致的难以追踪和类型丢失问题，我们采用**实用主义混合架构**：
- **废弃全局 EventBus**：严禁使用字符串事件（如 `emit('UPDATE_SCORE')`）来传递业务数据。
- **领域 Store 订阅**：全局状态划分为领域级的 Zustand Store 或 React Context（如 `useProgressionStore`）。模组通过调用强类型的 Hook 来触发状态变更。
- **React Props 传递**：在主程序（Router/Hub）组装模组时，优先使用标准的 React Props 进行模组间的松耦合通信。

## 3. 依赖注入与 UI 统一 (React DI & Design Tokens)

为了保证“赛博朋克”、“极简风”等全局主题模组能够完美接管所有游戏的 UI：
1. **禁止硬编码样式**：绝对不能在组件中写死颜色、字体大小等。必须使用内核定义的 CSS 变量（如 `var(--theme-text-error)`）。
2. **React 依赖注入 (IoC)**：游戏模组如果需要标准组件（如按钮、弹窗），必须通过 `useUI()` 从基建模组的 Context 中获取，而不是直接 `import { Button } from '@/components'`。

## 4. 插槽系统 (Slot System)

不要在主界面中硬编码子模组的入口。
主界面（Hub）只留下插槽：`<Slot name="GAME_LIST" />`。
游戏模组在初始化时，将自己的入口卡片主动注入到该插槽中。

## 5. 绝对 DRY 原则 (Don't Repeat Yourself)

**核心底线：不要重复造轮子，消除一切冗余！**
1. **拥抱开源生态**：如果有成熟的第三方库（如 Zustand 处理状态，React Router 处理路由，Shadcn UI 处理无头组件），**直接拿来用**，严禁自己手写一套残缺的实现。
2. **合并相似逻辑**：如果两个模组有 80% 相似的逻辑（比如 GuessFunc 和 GateFunc 都需要“通关结算弹窗”），必须将这部分逻辑抽离到 `Shared Modules` 中，通过传入不同的配置参数来复用，**绝对禁止复制粘贴代码**。
3. **清理冗余文件**：如果一个工具函数或组件已经半年没有被任何地方引用，或者它的功能完全可以被标准库替代，立刻删除它。