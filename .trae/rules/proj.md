# 项目级编码与架构规范

> 此文档包含具体的编码实现标准与架构约束，是对 `ai.md` 的详细落地。

## 1. 架构与边界防腐 (FSD + DDD)
- **FSD 切片隔离**：`src/features/` 下的业务模块严禁深层跨模块导入。共享逻辑下沉到 `store` 或 `utils`。
- **状态机解耦**：组件专注渲染（Presenter），复杂业务逻辑和状态突变必须抽离到 Custom Hook（Controller）或 Zustand。
- **外部依赖防腐层**：第三方库（如 `Desmos`, `compute-engine`）严禁在业务组件中直接混用，必须封闭在专属的 Service 或 Utils 中。

## 2. 类型安全与异常处理
- **零容忍 `any` 和 `@ts-ignore`**：必须显式声明类型，极少数情况用 `@ts-expect-error` 且必须加注释说明。
- **非受信数据校验**：外部数据（localStorage、JSON、URL 参数）**必须**使用 Zod 运行时校验。严禁 `JSON.parse` 后直接 `as` 断言。
- **防御性异常捕获**：调用外部库解析、网络请求等**必须** `try...catch` 兜底，并抛出受控的自定义 Error。

## 3. 零硬编码与魔法数字
- **零容忍魔法数字**：全局业务数字（超时、重试等）、全局色值、LocalStorage Key、URL 基础路径等**必须**提取至 `src/utils/constants.ts`。属于单个功能模块（Feature）的常量，应就近放在该 Feature 目录下的 `constants.ts` 中或当前文件中，避免破坏 FSD 高内聚原则。
- **i18n 零容忍硬编码**：
  - **严禁**硬编码中英文字符串在 JSX 或逻辑中。
  - **严禁**调用 `i18n.t()` 时传入 fallback 文本（如 `t('key', '默认')`），直接显示 `key` 以暴露缺失翻译。
  - 脚本文件（`.cjs/.mjs`）必须开启 `@ts-check` 并使用 JSDoc。

## 4. 性能优化与渲染周期
- **计算下放 Worker**：计算密集型任务（如数学等价性推导）必须通过 Web Worker 异步处理，严禁阻塞主线程。
- **高频事件强制防抖**：`resize` 或频繁 `change` 事件必须防抖/节流。
- **安全清理副作用**：`useEffect` 中的全局事件、定时器**必须**在 `cleanup` 中彻底注销。
- **严禁渲染期重定向**：路由跳转必须用 Router 的 `loader`，严禁在渲染期或 `useEffect` 挂载时突变全局状态进行硬跳转。

## 5. UI 与 CSS 架构规范
- **禁止强制样式**：**严禁**在 CSS 或 Tailwind 类名中使用任何形式的强制覆盖（如 `!important` 或 Tailwind 的 `!前缀`），必须通过提高选择器优先级或规范组件层级来解决样式冲突。
- **字体规范 (最高优先级约束)**：
  - **特殊字体管理**：所有特殊设定的字体禁止硬编码，必须通过 `index.css` 的 CSS 变量进行统一管理。
  - **动态组合字体栈**：必须使用 `var(--font-dynamic)` 和 `var(--font-dynamic-code)` 作为实际生效的字体栈，严禁根据 `lang` 属性一刀切覆盖。浏览器会根据字符自动命中英文或中文字体。
  - **Markdown/剧情文本**：渲染文件或剧情中的文本（及设置页预览），必须使用自定义字体（即 `font-story`，对应 `var(--story-font-family)`），并在设置页正确显示对应字体名称。
  - **中文字体**：全局中文字体（如左侧栏“故事模式”等标题及正常中文文本）统一使用 `-apple-system, BlinkMacSystemFont, "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif`（对应 `var(--font-zh)`）。
  - **普通英文字体**：全局正常文本（如左上角“GuessFunc”标题等）的英文字体统一使用 `"Geist Variable", sans-serif`（对应 `var(--font-en)`）。
  - **代码英文字体**：路径、文件名及资源管理器界面中与代码相关的英文文本，必须使用 `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`（对应 `var(--font-code)` 及 Tailwind 的 `font-mono` 类）。
  - **混合排版避坑**：当父元素被赋予 `font-mono` 且内部混排了不需要等宽的中文界面文本时，**必须显式地为中文子元素添加 `font-sans`** 进行局部还原，以防中文字符掉入 `monospace` 序列触发系统默认宋体/黑体回退差异。
- **Tailwind 优先**：严禁在 `index.css` 堆砌自定义类名。使用 Tailwind 工具类，复杂组件用 `cva` 或 `tailwind-merge`。
- **UI 基建 (Headless UI)**：对于复杂的交互组件（如弹窗、下拉菜单、滑动条等），优先使用 `src/components/ui/` 下基于 Radix UI/shadcn 的无头组件，以确保默认的键盘交互和无障碍访问 (A11y) 支持。
- **虚拟渲染长列表**：超长列表（章节、关卡等）必须使用 `react-window` 虚拟渲染。
- **无障碍访问 (A11y)**：自定义交互组件必须补充 ARIA 属性（`aria-label`, `role="dialog"` 等），并确保支持键盘聚焦（`tabIndex`）。
- **动画硬件加速**：动画统一使用 `transform` 和 `opacity`，严禁使用 `left/top/width` 触发重排。
- **图标规范**：UI 界面严禁使用 Emoji 作为图标，必须全部使用规定网站的规范图标库（如 Lucide 或项目内约定的规范图标）。

## 6. 代码注释与维护标准
- **消除冗余与相关性检查**：无论什么时候，修改代码时都要检查与之相关的东西。相似的代码必须一起修改；如果逻辑特别相似，必须直接合并抽象，坚决避免冗余代码。这非常重要！
- **拒绝“心路历程”**：注释只解释“为什么这么做”(Why)，**严禁**写日记式推导过程或情绪表达。
- **JSDoc 强制使用**：复杂函数、Hook、外部接口必须写规范的 JSDoc (`@param`, `@returns`)。
- **僵尸代码零容忍**：严禁提交大段被注释掉的无用代码。
- **统一格式**：使用 **UTF-8** 编码，行内注释统一用简体中文 `// `（双斜杠后带空格）。

## 7. 自动化测试底线
- **禁止负向回归**：提交前必须保证 `npm test` 覆盖率不下降，且 `npx playwright test` (E2E) 100% 通过。复杂逻辑必须伴随测试用例。
