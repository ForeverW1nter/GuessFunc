# 架构与依赖规范 (Architecture Rules)

本架构的灵魂在于**“隔离”**。为了防止项目再次腐化为“屎山”，任何开发者（包括 AI）必须严格遵守以下依赖规则。

## 1. 模块层级与单向依赖原则

系统分为四个绝对层级，**上层可以依赖下层，下层绝对不能依赖上层**：
1. **内核 (Kernel)**：只包含事件总线、模块注册表、设计令牌契约。不能 import 任何 React 组件。
2. **基建模组 (Foundation)**：如 `UI Manager`、`Router`、`Storage`。
3. **共享模组 (Shared)**：如 `Level Generator`、`Creator Tools`。
4. **游戏模组 (Games)**：如 `GuessFunc`、`GateFunc` 及其内部的子模组。

## 2. 平级模块隔离 (No Lateral Imports)

**规则**：同层级的模块之间，**绝对禁止**互相 `import`。
**错误示例**：`GuessFunc` 模组直接 `import { openCreator } from 'mod-creator'`。
**正确做法**：通过内核的 `EventBus` 通信。
```typescript
// GuessFunc 发出事件
EventBus.emit('REQUEST_OPEN_CREATOR', { sourceLevel: currentLevel });

// Creator 模组监听事件
EventBus.on('REQUEST_OPEN_CREATOR', (data) => this.open(data));
```

## 3. UI 碎片化防护与设计令牌 (Design Tokens)

为了保证“赛博朋克”、“极简风”等全局主题模组能够完美接管所有游戏的 UI：
1. **禁止硬编码样式**：绝对不能在组件中写死颜色、字体大小等。如 `color: '#ff0000'` 或 Tailwind 的 `text-red-500`（除非它被映射为 Token）。
2. **必须使用 Token**：增量更新的模组在编写新 UI 时，必须使用内核定义的 CSS 变量（如 `var(--theme-text-error)`）。
3. **依赖注入 (IoC)**：游戏模组如果需要标准组件（如按钮），必须通过 `useUI()` 从基建模组中获取，而不是直接 `import { Button } from '@/components'`。

## 4. 插槽系统 (Slot System)

不要在主界面中硬编码子模组的入口。
主界面（Hub）只留下插槽：`<Slot name="GAME_LIST" />`。
游戏模组在初始化时，将自己的入口卡片主动注入到该插槽中：
`Kernel.slots.inject('GAME_LIST', <GuessFuncCard />)`。