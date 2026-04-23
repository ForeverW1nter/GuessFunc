# 已知遗留 Bug 与技术债修复清单 (Legacy Bug Fixes)

在从 `_old` 迁移旧版代码的过程中，严禁直接 Copy-Paste 包含以下技术债的代码。以下问题必须在迁移过程中被**彻底修复**。

## 1. 测试用例修复 (Test Snapshot Mismatch)
**问题描述**：旧版中运行 `npm run test` 时，`__tests__/GraphRenderer.test.tsx` 发生 Snapshot 失败。
**原因**：组件最近添加了 `aria-label="Desmos Math Graph Renderer"` 和 `role="application"` 等无障碍属性，但测试快照未更新。
**修复方案**：在将 `GraphRenderer` 迁移为 `submod-desmos-renderer` 时，重新编写纯组件的测试用例，确保无障碍属性被正确快照并断言。

## 2. 深度状态耦合 (State Coupling)
**问题描述**：旧版 `GraphRenderer` 和大量业务组件内部直接 `import` 了 `useGameStore`，导致组件脱离全局 Store 无法渲染。
**原因**：违背了单一职责原则。
**修复方案**：新架构下，所有展示层（尤其是包含第三方库如 Desmos 的组件）必须是**纯组件 (Pure Component)**。所需的数据必须通过 `props` 传入，状态变更必须通过 `onXXX` 回调函数或全局 `EventBus` 抛出。

## 3. 代码规范违例 (ESLint Violations)
旧版代码存在多达 78 个 Lint 警告/错误，迁移时必须逐一清理：
- **`prefer-template` (字符串拼接)**：将所有使用 `+` 拼接的字符串（如 `__tests__/ErrorBoundary.test.tsx`, `src/features/tools/StoryEditorModal.tsx`）替换为现代模板字符串（`` `${a} ${b}` ``）。
- **`no-nested-ternary` (嵌套三元表达式)**：这是旧版的重灾区（如 `ModStoreModal`, `StoryEditorModal`, `ChapterFiles` 中包含超过 3 层的嵌套）。迁移时必须将其重构为：
  - 提前 `return`。
  - 抽取为独立的子渲染函数。
  - 使用清晰的 `if-else` 分支。
- **`@typescript-eslint/no-non-null-assertion` (滥用非空断言)**：在 `mathEngine` 及相关测试文件中，开发者使用了过多的 `!` 强制忽略 TS 报错。迁移时必须补全严格的空值校验或提供合理的默认值。
- **`no-alert` (违规弹窗)**：旧版的 `Sidebar` 和 `BatchGeneratorModal` 中使用了原生的 `confirm` 和 `alert`。新架构下必须统一调用 `mod-ui-manager` 注入的 `useUI().Modal`。

## 4. 潜在内存泄漏与生命周期管理
**问题描述**：旧版集成 Desmos 等第三方非 React 库时，部分资源的清理可能不够彻底。
**修复方案**：在封装 `submod-desmos-renderer` 时，必须确保在 `useEffect` 的 cleanup 函数中调用完整的实例销毁方法（如 `calculator.destroy()`），并移除对应的 ResizeObserver 监听器。

## 5. 存储容量爆仓与数据丢失 (LocalStorage 5MB Quota)
**问题描述**：旧版将关卡存档、Mod 数据甚至 AI 聊天记录全部序列化为 JSON 存入 `localStorage`，一旦数据超过 5MB 就会抛出 `QuotaExceededError` 导致应用崩溃且无法保存进度。
**修复方案**：在迁移 `mod-storage` 时，**必须使用 IndexedDB**（可通过 `idb` 或 `localforage`）替换 `localStorage`，彻底解放存储容量上限。

## 6. 异步竞态导致“幽灵通关”与“进度覆盖” (Race Conditions)
**问题描述**：旧版的 `evaluateInput` 在 `await mathEngine` 时，如果玩家快速点击了“下一关”，Worker 验证完成后会直接将新关卡标记为“已通关”；同时，在 `await` 期间若产生了新的 `completedLevels`，原有的闭包会直接将其覆盖，导致进度丢失。
**修复方案**：
- **引入校验令牌 (Validation Token/Id)**：在发出 Worker 请求前生成一个唯一令牌，`await` 结束后，必须比对当前关卡的令牌是否一致。若不一致（说明玩家已切关），则静默丢弃结果。
- **强制函数式状态更新**：在 Zustand 的 Action 中，必须使用 `set((state) => ({ completedLevels: [...state.completedLevels, newLevel] }))`，彻底消除陈旧闭包带来的覆盖风险。

## 7. 渲染雪崩与 Store 级联反模式 (Cascading Updates)
**问题描述**：旧版的 `src/store/sync.ts` 监听 `useModStore` 的变化，并强制调用 `useStoryStore.setModRoutes`，这种跨 Store 级联修改极易引发 React 的渲染死循环 (Maximum update depth exceeded)。
**修复方案**：废除该同步脚本。在 UI 组件渲染时，直接通过 Zustand 的 Selector 或 React 的 `useMemo`，将 `useModStore.installedMods` 和 `useStoryStore.officialRoutes` 实时组合计算，遵循“派生状态 (Derived State)”的最佳实践。