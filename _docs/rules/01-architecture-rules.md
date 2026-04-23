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

## 6. 性能与体验红线 (Performance & UX Redlines)

为了确保极致的游戏体验，彻底消除“卡顿”与“渲染风暴”，必须严守以下性能底线：

1. **Context 零重渲染原则**：`React Context` **只能**用于传递静态依赖（如 `UI 组件库引用`、`API Client 实例`）。**绝对禁止**将频繁变化的业务数据（如分数、当前输入值）放入 Context Provider 的 `value` 中，必须全部交给 `Zustand` 独立 Store 管理。
2. **主线程解放 (Web Worker First)**：所有 CPU 密集型计算（如 `GuessFunc` 的表达式解析与等价验证、`GateFunc` 的复杂逻辑门真值表计算）**必须**运行在 Web Worker 中。严禁让数学计算阻塞 UI 渲染和动画（如滑动条拖拽）。
3. **意图驱动的预加载 (Intent-based Prefetching)**：禁止在玩家点击游戏图标后才开始加载几兆的模组代码导致白屏。必须利用 React 18 的 `startTransition` 结合鼠标悬停（Hover）预加载技术，实现游戏模组的“无缝切入”。
4. **组件级按需渲染**：在 `Shared Feature Widgets` 中（如通关弹窗、成就提示），必须利用懒加载（Lazy）和骨架屏（Skeleton），避免首次加载核心壳应用时体积过大。