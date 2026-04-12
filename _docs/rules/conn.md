# 近期任务上下文

## 已完成重构（关键里程碑）

1. **首屏性能优化**：按需加载 `math-vendor`，配置 `HydrateFallback`，数学解析移入 Web Worker
2. **依赖与构建修复**：修复 `react-window` 类型冲突，补充 `@testing-library/dom`，消灭 Lint 与 TS 报错
3. **架构与状态解耦**：肢解上帝组件，抽离状态到 Custom Hooks，移除不安全的依赖抑制
4. **性能与体验打磨**：`react-window` 长列表虚拟化，动画 GPU 加速，配置 `vite-plugin-pwa` 离线游玩
5. **系统加固**：Zustand `migrate` 降级测试，Zod 拦截 LocalStorage 脏数据，`ErrorBoundary` 堆栈提取
6. **代码纯净度**：移除 `i18n.t()` fallback，消灭内联动态样式，引入 i18next-parser 和 jscpd
7. **测试覆盖网**：数学计算极值到 Playwright E2E 异常恢复流的完整测试链路
8. **构建优化**：统一 `mathEngine` 静态导入，消灭 Vite chunk 拆分警告
9. **UI 基建升级**：引入 shadcn/ui 基础架构，添加 Button、Dialog、Select 等无头组件
10. **错误上报与监控**：集成 Sentry React SDK，与 `ErrorBoundary` 和 `logger.ts` 无缝结合
11. **UI 布局重构**：创意工坊从独立路由重构为与故事模式复用 `FullScreenModalLayout`
12. **AI 与主线剧情清理**：移除游戏内 AI 助手功能及所有主线剧情（ending、fakeEnding、trueEnding）
13. **创意工坊优化**：统一默认 ID 格式为 `chX`，清理多余的 `i18n.t()` fallback
14. **移动端适配**：修复无法查看/编辑路线 Bug，引入 `showSidebarOnMobile` 状态
15. **多语言词条补全**：扫描全站 `i18n.t()`，补全 `zh/translation.json` 与 `en/translation.json`
16. **模组隔离与 ID 优化**：添加"在游玩界面显示"开关，去除 `mod_` 前缀，引入同名 ID 自动追加序号
17. **模组数据源统一**：迁移到 `useModStore` (IndexedDB)，创意工坊实时编辑，修复同步 Bug
18. **UI 重构**：统一卡片与工具栏设计，移除原生 `<select>`，重构主题变量为 `bg-background`
19. **全站 Lint 与 i18n 修复**：修复特殊字符语法错误，移除 fallback，修复 Duplicate case label
20. **UI 规范修复**：修复魔法数字类名，抽象语义化类名至 `tailwind.config.js`
21. **主题色适配**：优化浅色模式对比度，美化按钮渐变和阴影效果
22. **TS 与 Lint 清零**：修复变量丢失、类型定义、正则匹配、测试类名等错误

## 当前系统状态

- **Lint**: 0 Error, 0 Warning
- **Test**: `npm test` & `npx playwright test` 全通过
- **Build**: `tsc -b && vite build` 已通过
- **总体**: 核心历史债务与 Lint 规范已全部清理完毕，代码库处于健康状态
