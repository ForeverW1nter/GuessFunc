# 编码与质量规范 (Coding Standards)

在从 `_old` 目录向新架构迁移的过程中，我们必须剔除旧版代码中的坏味道，确保新代码极易维护。

## 1. 零临时补丁 (Zero Workarounds)
- **禁止掩耳盗铃**：严禁使用 `setTimeout(fn, 100)` 来解决渲染时序问题。必须找到真实的 React 生命周期 (Effect) 或事件驱动的 Root Cause。
- **禁止随意断言**：严禁滥用 `!` (Non-null assertion) 和 `// @ts-ignore`。如果类型报错，说明你的接口契约设计有问题，必须修正类型定义。

## 2. 零硬编码 (Zero Hardcoding)
- **魔法数字与字符串**：诸如 `难度系数 2.15`、`[0,1) 初级` 等规则，必须提取为配置文件或常量枚举，不能散落在组件代码中。
- **多语言 (I18n)**：所有展示给用户的文本必须走 I18n 接口（如 `t('game.start')`），旧版中这部分做得不错，需继续保持并完善。

## 3. UI 组件必须纯化 (Pure UI Components)
旧版代码的最大痛点是 UI 和业务逻辑深度绑定。
- **规则**：所有视觉呈现组件（如 Desmos 渲染器、逻辑门连线图）必须是**纯组件 (Pure Component)**。
- **要求**：它们只能接收 `props`（如 `targetFunction`, `userInput`）并触发回调（如 `onGuessChange`）。
- **禁区**：UI 组件内部**绝对禁止**调用类似 `useGameStore()` 的全局状态，或直接操作 `LocalStorage`。

## 4. 消除嵌套三元表达式
旧版代码的 ESLint 扫描暴露了大量的 `no-nested-ternary` 警告。
- **规则**：严禁超过一层的三元表达式（`a ? b : c ? d : e`）。
- **替代方案**：使用提前 `return`、`if-else` 块、或者抽取为独立的渲染函数/组件，以保证 AI 和人类都能一眼看懂逻辑分支。

## 5. 优质代码的搬运原则
- 旧版中的 `src/utils/mathEngine` 经过了 `jscpd` 检测，重复率为 0%，且容错性良好。这部分核心算法可以作为“优质资产”直接迁移到新架构的 `submod-math-engine` 中，但需要切断它与任何外部 UI 或 Store 的隐式联系。
- 迁移旧版代码时，必须同时为其补充/更新测试用例（如修复旧版中丢失的 a11y Snapshot）。