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
3. **沙盒化与作用域隔离 (CSS Scoping)**：增量模组如果自带额外的 CSS，基建层的插槽在注入该模组时，必须为其包裹一层唯一的命名空间（如 `div[data-mod="guessfunc"]`）。**绝对禁止 Mod 代码拥有修改全局 `:root` 的权限**，严防全局样式污染。

## 4. 插槽系统 (Slot System)

不要在主界面中硬编码子模组的入口。
主界面（Hub）只留下插槽：`<Slot name="GAME_LIST" />`。
游戏模组在初始化时，将自己的入口卡片主动注入到该插槽中。

## 5. 绝对 DRY 原则 (Don't Repeat Yourself)

**核心底线：不要重复造轮子，消除一切冗余！**
1. **拥抱开源生态**：如果有成熟的第三方库（如 Zustand 处理状态，React Router 处理路由，Shadcn UI 处理无头组件），**直接拿来用**，严禁自己手写一套残缺的实现。
2. **合并相似逻辑**：如果两个模组有 80% 相似的逻辑（比如 GuessFunc 和 GateFunc 都需要“通关结算弹窗”），必须将这部分逻辑抽离到 `Shared Modules` 中，通过传入不同的配置参数来复用，**绝对禁止复制粘贴代码**。
3. **清理冗余文件**：如果一个工具函数或组件已经半年没有被任何地方引用，或者它的功能完全可以被标准库替代，立刻删除它。

## 6. 性能与体验红线 (Performance & UX Redlines)

为了确保极致的游戏体验，彻底消除“卡顿”与“渲染风暴”，必须严守以下性能底线：

1. **状态分离机制 (Render-Phase vs Game-Loop)**：60FPS 的高频渲染数据（如画布坐标、动画滑动条当前值）**绝对禁止**经过 React State 或 Zustand 的普通订阅。必须使用 `ref` 直接操作 DOM，或者通过 `zustand/vanilla` 在 React 渲染周期之外直接绑定（Transient Updates），防止 React 异步渲染导致的游戏画面撕裂（Tearing）。
2. **主线程解放 (Web Worker First)**：所有 CPU 密集型计算（如 `GuessFunc` 的表达式解析、`GateFunc` 的逻辑门计算）**必须**运行在 Web Worker 中。
   - **高频节流**：涉及 Worker 的高频交互（如拖动滑动条）必须加入节流（Throttle）或防抖（Debounce），防止序列化开销阻塞主线程。
   - **超时熔断**：所有 Worker 调用必须设置 Timeout。若计算超时，必须强制重启 Worker，杜绝“幽灵挂起”导致主流程卡死。
3. **重型实例的池化 (Instance Pooling) 与销毁契约**：严防 WebGL Context 耗尽导致的浏览器黑屏。对于 Desmos 图表、3D 画布等重型资源，**必须**由基建层提供复用池。模组卸载时必须将实例清空并归还给池子，同时**必须**调用原生的销毁方法（如 `.destroy()`, `.terminate()`），严防内存泄漏。
4. **带超时的健壮加载器 (Robust Loader)**：在弱网环境下，动态加载模组（`import()`）时**绝对禁止**裸写 `React.lazy`。必须包裹带 Timeout 的高阶组件，若 5 秒内加载失败，必须自动降级显示“网络不佳”的 UI 并提供返回/重试按钮，严防“白屏死锁”。

## 7. 稳定性与数据安全底线 (Stability & Data Safety)

1. **局部错误隔离 (Local Error Boundaries)**：禁止使用“核弹级”的全局刷新来掩盖错误。必须在每个模组、每个插槽的最外层包裹局部的 `ErrorBoundary`。
2. **向后兼容的存档水合 (Safe Hydration)**：任何持久化到本地的 Store，**必须**实现 `version` 和 `migrate` 函数。
3. **禁止暴力清空用户数据**：在任何错误恢复机制中，**绝对禁止**无差别遍历并清空存储。
4. **突破 5MB 存储限制 (IndexedDB First)**：基建层的 `useStorage()` **必须**底层使用 `IndexedDB`（而非 `localStorage`），以支持无限量的自制关卡、Mod 数据和庞大的 AI 对话记录。
   - **强制降级策略 (Storage Fallback)**：如果浏览器在无痕模式/隐私模式下禁用了 IndexedDB，`useStorage()` 必须自动无缝降级到**内存存储 (In-Memory)**，并在 UI 层面提示用户“当前处于无痕模式，游戏进度在关闭网页后将丢失”，**绝对禁止**直接抛出报错导致白屏。

## 8. 异步并发与状态红线 (Async & State Redlines)

1. **彻底消灭“幽灵回调” (Race Conditions)**：任何包含 `await`（如请求 Worker 验证函数）的操作，在 `await` 结束后修改状态前，**必须校验上下文是否已变更**（如：玩家是否已经切到了下一关）。如果上下文已过期，必须直接丢弃该异步结果，严禁出现“上一关的延迟返回导致这一关瞬间通关”的 Bug。
2. **强制函数式状态更新 (Functional SetState)**：在 Zustand 的异步 Action 中，修改状态时**绝对禁止**使用 `await` 之前捕获的闭包变量覆盖新状态。必须使用 `set((curr) => ({ data: curr.data + 1 }))` 防止数据丢失。
3. **禁止 Store 间级联更新 (No Cascading Stores)**：**绝对禁止**通过监听 `Store A` 的变化去 `set` 修改 `Store B` 的数据（反模式）。如果需要组合数据（如“官方关卡”+“Mod关卡”），必须在组件渲染时通过 `useMemo` 或 Zustand 的派生 Selector 即时计算。

## 9. 插件生命周期与注入协议 (Plugin Lifecycle Protocols)

1. **路由动态挂载 (Dynamic Routing)**：主程序 `mod-router` 仅配置静态壳（Shell）路由。增量游戏模组在初始化时，通过调用 `ModuleRegistry.registerRoute(path, Component)` 动态将自身的路由挂载到主路由树。
2. **多语言动态合并 (Dynamic I18n)**：各游戏模组自带本地的 JSON 词典。为了防止翻译键名冲突，词典的顶层 Key 必须以**模组名称作命名空间前缀**（例如 `guessfunc.start`），并在模组加载时调用 `ModuleRegistry.registerI18n(namespace, dict)` 注入到全局的 `react-i18next` 实例中。
3. **静态资源打包 (Asset Public Path)**：在微前端或 Vite 插件化打包模式下，游戏模组内部的图片或音频等静态资源，**绝对禁止**使用绝对路径（如 `/assets/bg.png`），必须通过 JS 模块化 `import bg from './bg.png'` 引入，交由打包工具自动处理 Public Path。
4. **全局快捷键隔离 (Keybinding Isolation)**：基建层必须提供统一的 `ShortcutManager`。**严禁任何模组私自向 `window` 或 `document` 挂载 `keydown` 事件。** 模组在注册快捷键（如 `Ctrl+Z` 撤销）时，必须声明其焦点作用域（Focus Scope），仅当用户在模组自身的 DOM 区域内操作时才生效，防止与其他模组发生快捷键“幽灵冲突”。
5. **测试环境降级 (Test Environment Fallbacks)**：由于 Jest/Vitest 默认环境不支持完整的 Web Worker 机制，在编写 `submod-math-engine` 等核心逻辑时，必须将算法纯函数与 Worker 胶水层（`postMessage` 通信）分离。单元测试**只针对纯函数**进行，或者在测试环境通过全局 Mock（如 `global.Worker = class MockWorker {}`）拦截 Worker 实例化。