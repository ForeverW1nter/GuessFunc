# 待办任务队列

> AI 助手应在当前上下文中逐步完成这些任务，完成后标记为 `[x]`

## 核心重构：Play & Create Hub 彻底重写

### 开发底线

1. **复用至上**：全量复用 shadcn/ui（Card、Tabs、ScrollArea、Button、Select、Dialog）与 lucide-react 图标
2. **规范交互**：严禁 `window.alert`、`window.confirm`，必须调用 `ConfirmModal`、`Toast`、`Dialog`
3. **彻底隔离 FSD**：`features/mods`、`features/story` 互相严禁互相导入，在 `store/` 或应用层做事件订阅
4. **适配全平台**：利用 Tailwind 响应式前缀，保证移动端和 PC 端完美展示，兼容亮暗主题

---

### 阶段一：数据与 Store 重构

- [x] 重写状态同步机制：解除 `useModStore` 对 `useStoryStore.getState().setModRoutes` 的越权调用，采用 Zustand 官方 `subscribe` 或顶层 `Provider` 监听 `installedMods` 变化
- [x] 重构 ID 命名空间隔离：引入 Namespace 概念（如 `[ModID]:[ChapterID]`），界面渲染时隐去前缀
- [x] 引入撤销恢复流：利用 Zustand 生态（如 `zundo` 中间件）为创意工坊的 `useEditorStore` 提供回退机制

### 阶段二：Hub 路由与布局

- [x] 废除弹窗堆叠：废弃 `StoryEditorModal`、`LevelSelectModal`、`ModStoreModal` 三个巨型全屏弹窗
- [x] 构建大一统 Hub 路由：新建 `/hub` 路由页面，使用 Tabs 导航（PC 端左侧/顶部导航，移动端底部导航）无缝切换【故事游玩】【工坊创作】【模组社区】
- [x] 统一色值与主题：排查硬编码暗黑色值，全部替换为 Tailwind CSS 变量（`bg-background`、`bg-card`、`text-foreground`、`border-border`）

### 阶段三：模组商店与故事模式 UI

- [ ] **重写故事模式**：
  - 抛弃"文件管理器"树状列表
  - 使用大画幅 Card 展示各条路线/模组，选中后展示可视化节点路线图，区分已解锁(高亮)、当前关卡(发光)、未解锁(置灰)
- [ ] **重写模组商店**：
  - 改为 Steam 创意工坊瀑布流/网格展示
  - 用 Badge 组件展示标签（内置、新路线、高难）
  - 抽离模组详情侧边栏/抽屉，点击弹出详细介绍、作者信息、关卡预览和"一键安装"按钮

### 阶段四：创意工坊 IDE 化

- [ ] **引入 Split-Pane IDE 布局 (PC 端)**：
  - 左侧：大纲树状图（路线 -> 章节 -> 关卡），支持拖拽排序
  - 中侧：复用表单组件进行属性编辑（配置关卡标题、目标函数、定义域等）
  - 右侧：实时游玩预览区，复用数学引擎和图表组件，左边改公式，右边实时重绘
- [ ] **移动端工坊自适应**：
  - PC 三栏布局在移动端降级为"列表 -> 点击进入详情表单"入栈式交互
  - 右侧预览区可折叠为悬浮按钮或底部抽屉
- [ ] **完善全链路防呆校验**：
  - 退出未保存时用 `ConfirmModal` 拦截误触关闭
  - 表单输入用 Zod schema 实时校验，复用 `Toast` 报错，不合规数据无法保存
