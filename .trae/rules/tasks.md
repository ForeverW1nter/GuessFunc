## <Task_Backlog> 渐进式重构与待办任务队列

> **AI 助手注意**：当项目历史债务过多时，用户会在下方列出需要逐步解决的任务。你应当在当前上下文中逐步完成这些任务，并在完成后将其标记为 `[x]`。

### 🚨 核心痛点重构计划：彻底重写故事模式、创意工坊、模组商店 (Play & Create Hub)
当前三大模块存在逻辑割裂、数据同步靠硬编码强推、交互反人类（深层级弹窗表单）、破坏了 FSD 规范等问题。本计划将彻底抛弃旧有弹窗逻辑，基于现有的 `shadcn/ui` 基建和原子化组件，重构为一个现代化的单页响应式枢纽。

**严格遵守的开发底线：**
1. **复用至上**：绝对禁止手写底层弹窗和基础按钮，全量复用 `shadcn/ui`（Card, Tabs, ScrollArea, Button, Select, Dialog等）与 `lucide-react` 图标。
2. **规范交互**：**严禁**使用 `window.alert`, `window.confirm`。必须调用项目中封装好的 `ConfirmModal`、`Toast` 和 `Dialog`。
3. **彻底隔离 FSD**：`features/mods`、`features/story` 互相之间严禁互相导入和强塞数据。必须在 `store/` 或应用层做事件订阅。
4. **适配全平台**：利用 Tailwind 响应式前缀 (`sm:`, `md:`, `lg:`)，保证所有界面在移动端（单栏堆叠/底部弹窗）和 PC 端（多列分栏/大卡片）完美展示，同时兼容亮暗主题（使用语义化 CSS 变量如 `bg-background`，禁止硬编码 `#121214` 等绝对色值）。

---

#### 📌 阶段一：底层数据源与 FSD 解耦重塑 (Data & Store Refactoring)
- [x] **重写状态同步机制**：解除 `useModStore` 中对 `useStoryStore.getState().setModRoutes` 的越权调用。采用 Zustand 官方的 `subscribe` 或在顶层 `Provider` 中监听 `installedMods` 变化，由 `useStoryStore` 被动摄取（derive）最新的可用模组路线，实现真正的响应式同步。
- [x] **重构 ID 命名空间隔离**：废除现有的粗暴改名策略（遇到冲突把 `ch1` 改为 `ch1_1` 会导致内部依赖崩溃）。在底层引擎防腐层引入 Namespace 概念（如 `[ModID]:[ChapterID]`），界面渲染时隐去前缀。
- [x] **引入撤销恢复流 (Undo/Redo)**：利用 Zustand 社区生态（如 `zundo` 中间件）为创意工坊的 `useEditorStore` (需新建独立状态) 提供可靠的回退机制。

#### 📌 阶段二：游玩枢纽基建与路由化 (Hub Routing & Layout)
- [x] **废除弹窗堆叠**：彻底废弃 `StoryEditorModal`, `LevelSelectModal`, `ModStoreModal` 这三个巨型全屏弹窗。
- [x] **构建大一统 Hub 路由**：新建 `/hub` 路由页面（或整合到首页入口），使用现代化的 Tabs 导航（PC 端为左侧/顶部导航，移动端为底部 Bottom Navigation）无缝切换【故事游玩】、【工坊创作】、【模组社区】三大视图。
- [x] **统一色值与主题提取**：排查这三个模块代码中硬编码的暗黑色值（如 `#121214`, `#1A1A1D`），全部替换为 Tailwind 的 CSS 变量（`bg-background`, `bg-card`, `text-foreground`, `border-border`），确保主题完全受控且一致。

#### 📌 阶段三：模组商店与故事模式视觉升维 (Store & Story UI Polish)
- [ ] **重写故事模式 (Story View)**：
  - 抛弃冷冰冰的“文件管理器”树状列表。
  - 使用大画幅卡片（`Card`）展示各条路线/模组。选中后展示**可视化节点路线图**，明确区分“已解锁(高亮)”、“当前关卡(发光)”、“未解锁(置灰)”。
- [ ] **重写模组商店 (Mod Store View)**：
  - 改为类似 Steam 创意工坊的瀑布流/网格展示。
  - 使用 `Badge` 组件展示标签（例如：内置、新路线、高难）。
  - 抽离独立的**模组详情侧边栏/抽屉 (Sheet/Drawer)**：点击模组不再只看一行字，而是弹出详细介绍、作者信息、关卡预览和“一键安装”按钮。

#### 📌 阶段四：创意工坊 IDE 化重构 (Workshop UX Overhaul)
- [ ] **引入 Split-Pane IDE 布局 (PC 端)**：
  - **左侧**：大纲树状图（路线 -> 章节 -> 关卡），支持拖拽排序。
  - **中侧**：复用表单组件进行属性编辑（配置关卡标题、目标函数、定义域等）。
  - **右侧**：**实时游玩预览区 (Live Preview)**。复用底层的数学引擎和图表组件，左边改公式，右边实时重绘图表，实现“所见即所得”。
- [ ] **移动端工坊自适应**：
  - PC 的三栏布局在移动端降级为“列表 -> 点击进入详情表单”的入栈式交互。
  - 右侧的预览区可折叠为悬浮按钮（FAB）或底部抽屉（Bottom Sheet）。
- [ ] **完善全链路防呆校验**：
  - 退出未保存时的提示，利用 `ConfirmModal` 拦截误触关闭。
  - 表单输入使用 Zod schema 实时校验，复用 `Toast` 报错，不合规数据无法保存。