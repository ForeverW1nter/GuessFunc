# 迁移路线图与总体规划 (Migration Plan)

本项目旨在将 `_old` 目录下的遗留代码库，按照全新的“微内核/插件化架构”重构并迁移至新的工作区中。在此过程中，必须彻底解决旧版中存在的状态耦合、无障碍测试失败（a11y Snapshot Mismatch）以及代码风格问题（如深层嵌套三元表达式）。

## 阶段一：搭建微内核与基建层 (Phase 1: Core & Foundation)
**目标**：构建极简的底层基建，确保后续模组能以“插件”的形式插入系统。
- [x] **T1.1**: 实现纯 TypeScript 的微内核核心（`ModuleRegistry`, `EventBus`, `SlotManager`）。
- [x] **T1.2**: 建立全局设计令牌体系（Design Tokens Contract），基于 CSS Variables 约束所有颜色、排版等视觉元素。
- [x] **T1.3**: 实现 `mod-ui-manager`，提供基础 Headless UI 和 `useUI()` 注入 Hook。
- [x] **T1.4**: 实现 `mod-router` 和 `mod-storage`，接管全局路由和持久化存档（替代旧版的臃肿 Store）。
- [x] **T1.5**: 构建主界面大厅 (`mod-hub`)，并暴露 `<Slot name="GAME_LIST" />` 供游戏注册。

## 阶段二：迁移与重构 GuessFunc 游戏模组 (Phase 2: GuessFunc)
**目标**：将旧版核心玩法“猜函数”拆解为多个互不依赖的子模组，修复历史遗留问题。
- [ ] **T2.1**: 迁移 `src/utils/mathEngine`，封装为独立的 `submod-math-engine`（该模块质量极高，保持 0% 重复率，但切断与外部的隐式依赖）。
- [ ] **T2.2**: 迁移并重构 `GraphRenderer`，彻底剥离其内部的 `useGameStore` 依赖。将其变为纯 UI 模组 `submod-desmos-renderer`，并通过 Props 接收渲染数据。
  - *附带任务*：修复旧版的 `GraphRenderer.test.tsx` 快照测试失败问题（同步无障碍 a11y 属性）。
- [ ] **T2.3**: 将公式输入面板与参数滑动条（如 2.15）抽离为 `submod-function-input` 和 `submod-parameter-slider`。
- [ ] **T2.4**: 实现业务中枢 `submod-guess-evaluator`，负责协调上述子模组，通过 EventBus 处理通关判定。
  - *附带任务*：消除旧版组件中超过 60 处的嵌套三元表达式（`no-nested-ternary`），重构为易读的 `if-else` 或早退逻辑。

## 阶段三：共享模组与创作者生态 (Phase 3: Shared & Creator Tools)
**目标**：将关卡生成、编辑器、创意工坊作为独立插件接入系统，服务于所有游戏。
- [ ] **T3.1**: 实现 `mod-level-generator`（随机关卡生成器），提供难度分级映射（[0,1) 初级），并开放插槽供 GuessFunc 注入“是否包含参数”选项。
- [ ] **T3.2**: 迁移并重构旧版关卡编辑器，拆分为独立的 `mod-level-creator`。支持“从当前关卡派生”和“空白创作”两种模式。
- [ ] **T3.3**: 接入 `mod-workshop` 和 `mod-store`，实现社区关卡的分享、下载，以及动态游戏模组的热更新机制。

## 阶段四：全新游戏模组 GateFunc (Phase 4: GateFunc)
**目标**：在微内核架构验证成功后，开发第二个独立游戏模组（逻辑门闯关）。
- [ ] **T4.1**: 规划并实现 `submod-circuit-engine`（布尔运算与真值表逻辑核心）。
- [ ] **T4.2**: 规划并实现 `submod-node-canvas`（纯 UI 的节点连线画布，必须使用全局 Design Tokens）。
- [ ] **T4.3**: 实现 `submod-level-progression`（关卡树与进度管理）。
- [ ] **T4.4**: 实现 `submod-gate-evaluator`（比对目标真值表并结算）。