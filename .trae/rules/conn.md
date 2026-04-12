# 近期任务上下文 (Connection)

> 记录近期完成的任务与当前状态。

### 已完成的重构里程碑 (Done)
1. **首屏性能优化**：按需加载 `math-vendor` 等大库，配置 React Router `HydrateFallback`，将数学解析移入 Web Worker。
2. **依赖与构建修复**：修复 `react-window` 类型冲突，补充 `@testing-library/dom`，消灭 Lint 与 TS 隐式报错 (`any`, `@ts-ignore`)。
3. **架构与状态解耦**：肢解上帝组件，抽离状态到 Custom Hooks (`useStoryEditor` 等)；移除不安全的依赖抑制，补充 `useMemo`/`useCallback`。
4. **性能与体验打磨**：引入 `react-window` 长列表虚拟化，将动画转为 GPU加速 (`transform`)，并配置 `vite-plugin-pwa` 实现离线游玩。
5. **系统加固与兜底**：
   - 为 Zustand 编写 `migrate` 降级测试，防止旧存档崩溃。
   - 使用 Zod 替换隐式类型断言，拦截 LocalStorage 脏数据。
   - 补充 `ErrorBoundary` 堆栈提取，并全局监听未捕获异常上报。
6. **代码纯净度**：
   - 移除所有的 `i18n.t()` 文本 fallback 硬编码。
   - 消灭内联动态样式，统一走 Tailwind。
   - 引入 `i18next-parser` 和 `jscpd`，自动化 i18n 提取并拦截重复代码。
   - 移除所有的 emoji，规范使用图标库 (lucide-react)。
   - 修复了 localStorage key 等硬编码的魔法字符串，统一提取到了 `constants.ts` 中。
7. **测试覆盖网**：补充了从数学计算极值到 Playwright E2E 异常恢复流的完整测试链路。
8. **构建优化**：消灭了 `mathEngine` 混合导入导致的 Vite chunk 拆分警告，统一采用静态导入。
9. **UI 基建升级**：引入了 `shadcn/ui` (基于 Radix UI) 的基础架构与样式变量配置，添加了 `Button`, `Dialog`, `Select` 等无头组件的基础代码，以增强组件的无障碍访问 (A11y) 与键盘交互能力。
10. **错误上报与监控闭环**：集成了 Sentry React SDK，实现了与现有 `ErrorBoundary` 和 `logger.ts` 的无缝结合，将运行时错误及相关堆栈自动上传至 Sentry 平台。
11. **UI 布局重构**：将创意工坊（StoryEditor）从独立路由（`/tools`）重构为与故事模式（LevelSelectModal）完全复用底层布局（`FullScreenModalLayout`）的全屏弹窗，消除了两者的布局冗余代码，使交互体验完全一致。
12. **AI 与主线剧情清理**：彻底移除了游戏内的 AI 助手功能 (`AiChatModal`, `AiChatButton`, `aiManager`)，以及相关的所有主线剧情（如 `ending`, `fakeEnding`, `trueEnding` 等文本及动画查看器）。
13. **创意工坊关卡创建优化**：统一了创意工坊中新建关卡（包含手动添加与批量生成）的默认 ID 格式为 `chX`，并将默认标题调整为纯数字字符串（与 ID 解耦），同时清理了代码中多余的 `i18n.t()` fallback (`defaultValue`)。
14. **创意工坊章节创建纠偏**：修复“新建章节”默认 ID 回退为纯数字的问题，统一手动添加与批量生成的章节默认 ID 为 `chX`；标题统一走 `t('tools.storyEditor.newChapterTitle')` 并使用章节序号参数，确保中英文可正确切换；同时移除按 `id + title` 合并章节的冗余条件，统一按 `id` 合并，避免跨语言标题导致重复章节。
15. **创意工坊移动端适配**：
    - 在移动端修复了“无法查看/编辑当前路线详情”的隐藏 Bug。
    - 引入了 `showSidebarOnMobile` 状态以控制在小屏下左侧侧边栏（`ChapterSidebar`）和主编辑区（`RouteEditorView` / `ChapterEditorView`）之间的切换。
    - 在侧边栏新增了“编辑路线”按钮，在 `RouteEditorView` 新增了“关闭（返回侧边栏）”按钮，形成完整移动端交互闭环。
16. **多语言词条补全**：扫描了全站 `i18n.t()` 的调用，并补全了 `zh/translation.json` 与 `en/translation.json` 中的遗漏词条，修复了创意工坊及数学引擎验证的部分空字符串词条。
17. **模组隔离与 ID 优化**：在创意工坊线路设置中添加了“在游玩界面显示”的独立开关控制（只影响本地展示）。同时优化了模组安装逻辑，去除了原先强行附加的 `mod_` 前缀，并引入了“同名 ID 自动追加序号”的防冲突策略，使其与系统自带线路在处理上无异。
18. **模组数据源统一与同步修复**：彻底解决了创意工坊（LocalStorage）、模组商店（IndexedDB）与故事模式（StoryStore）之间长期存在的不同步与相互覆盖 Bug。
    - 移除了独立的 `STORY_EDITOR_DATA` (LocalStorage) 和 `editorRoutes`，将它们统一迁移为 `useModStore` (IndexedDB) 中的本地模组（`local_workspace`）。
    - 创意工坊现在直接读取并实时编辑（1s 防抖自动保存）所有的本地安装模组，修改下载的模组也会被同步到游玩界面。
    - 优化了模组的导出与发布逻辑：现在导出/发布会精确匹配当前激活线路所在的模组，避免了错误打包全部线路的 Bug。
    - 修复了故事模式切换线路时未重置选中章节（`selectedChapterId`）导致可能挂起或显示空白的 UI 交互问题。
19. **创意工坊与模组商店 UI 重构**：
    - 剔除了 `ModStoreModal` 和 `StoryEditorModal` 中冗余的 “框套框” 嵌套布局，统一了卡片与工具栏的基础设计，并在模组商店移除了原生 `<select>`，代之以基于 Lucide 配合 Tailwind 的 `CustomSelect`。
    - 将 `StoryEditorModal` 内部（如 `ChapterEditorView`, `RouteEditorView`）硬编码的 `zinc` 颜色彻底重构为主题变量 (`bg-background`, `bg-card`, `text-foreground` 等)，保证了暗色/亮色等多主题的自适应。
    - 在模组商店引入 `@base-ui/react/tabs` 规范了顶部的 Discover / Installed 选项卡交互。
20. **全站 Lint 与 i18n 规范修复**：
    - 修复了多处由特殊字符导致的 `Unterminated string literal` 语法错误。
    - 彻底移除了全站 `i18n.t()` 的 hardcoded fallback，确保翻译完全由 JSON 字典驱动。
    - 修正了 `FileEditor.tsx` 中的 `Duplicate case label` 逻辑错误。
    - 修复了 `MessageViewer.tsx` 中注释与代码混行导致的解析错误。
    - 补全了 `MessageViewer` 等组件中遗漏的硬编码文本翻译。
21. **UI 规范修复与组件美化**：
    - 根据规范修复了 `SystemBar` 组件中包含魔法数字的类名（如 `w-[28px]`, `border-[2px]`, `duration-300`, `shadow-[0_0_12px...]`）。
    - 抽象了对应的语义化类名至 `tailwind.config.js`（`border-medium`, `duration-normal`, `shadow-music` 等）。
    - 美化了音乐控制按钮的边框样式，引入了发光阴影效果（`shadow-music`），提升了 UI 交互体验。
22. **主题色适配与浅色模式体验优化**：
    - 优化了全局主题色前景色（`--primary-foreground`）的计算逻辑，调整对比度阈值（将 `0.179` 放宽至 `0.4`），使其在浅色模式及绝大部分色彩下优先使用更具质感的白色文字。
    - 全局美化了 `.bg-primary` 元素的样式，添加了微渐变叠加层（`linear-gradient`），提升了按钮和图标在浅色模式下的拟物感。
    - 升级了 `shadow-btn` 阴影规范，补充了顶部内发光高光（`inset 0 1px 0 rgba(255,255,255,0.15)`），使所有带有 `shadow-btn` 的主色调按钮和图标获得类似苹果体系的立体抛光感。
23. **全站 TypeScript 与 Lint 错误清零**：
    - 修复了 `useUIStore` 和 `LevelSelectModal` 中因全局替换错误导致的 `isLevelSelectOpen` 变量丢失和 `true` 关键字滥用问题。
    - 补齐了 `constants.ts` 中缺失的 `MOD_STORE`、`MOD_ORDER` 以及 `FONTS` 等核心全局常量配置。
    - 修复了 `story.d.ts` 中 `FileData` 的 `uiType` 类型和 `RouteData` 中缺失的 `modId` 等类型定义。
    - 修正了 `api.ts` 中错误嵌套的 Markdown 导致正则匹配异常的 Bug，并修复了转义字符问题。
    - 在 `mathEngine/utils.ts` 中补充了 `autoExtractParams` 的实现以自动提取目标函数的未知数参数。
    - 修复了 E2E 测试中 `GraphRenderer` 期望的类名与实际不符（`bg-background` vs `bg-app-bg`）导致的快照断言失败，确保 `npm run test` 和 `npm run build` 畅通无阻。

### 当前系统状态 (Status)
- **Lint**：0 Error, 0 Warning。
- **Test**：`npm test` & `npx playwright test` 全通过。
- **Build**：`tsc -b && vite build` 已通过。
- **总体**：项目核心历史债务与 Lint 规范已全部清理完毕，代码库处于健康状态。

### 下一步建议 (Next Steps)
- 可根据新需求添加关卡、新机制（如微积分/矩阵模式）或支持更多多语言（如法语、日语等）。
