# 编码与架构规范

## 1. 架构约束 (FSD)

- **切片隔离**：`src/features/` 下各模块严禁深层跨模块导入，共享逻辑下沉到 `store` 或 `utils`
- **状态机解耦**：组件专注渲染（Presenter），复杂逻辑抽离到 Custom Hook 或 Zustand
- **防腐层**：第三方库（Desmos、compute-engine）必须封闭在专属 Service 或 Utils 中

## 2. 类型安全

- **零容忍**：禁用 `any` 和 `@ts-ignore`，极少数用 `@ts-expect-error` 且加注释
- **非受信数据校验**：外部数据（localStorage、JSON、URL 参数）必须用 Zod 校验
- **防御性异常捕获**：外部库解析、网络请求必须 `try...catch` 兜底

## 3. 零硬编码

- **魔法数字**：全局数字、色值、LocalStorage Key、URL 基础路径等必须提取到 `src/utils/constants.ts`
- **Feature 级常量**：单个模块的常量放在该 Feature 目录下的 `constants.ts` 中
- **i18n 零容忍**：
  - 严禁硬编码中英文字符串
  - 严禁 `i18n.t()` 传 fallback，直接显示 `key` 暴露缺失
  - 脚本文件必须开启 `@ts-check` 并使用 JSDoc

## 4. 性能优化

- **Worker 隔离**：计算密集型任务（数学等价性推导）必须用 Web Worker
- **高频事件防抖**：`resize` 或频繁 `change` 事件必须防抖/节流
- **副作用清理**：`useEffect` 中的全局事件、定时器必须在 `cleanup` 中注销
- **重定向规范**：路由跳转用 Router `loader`，禁用渲染期或 `useEffect` 硬跳转

## 5. CSS 与 UI

- **强制样式禁令**：不用 `!important` 或 `!` 前缀，提高选择器优先级解决冲突
- **字体管理**：所有特殊字体通过 `index.css` 的 CSS 变量统一管理
- **Tailwind 优先**：严禁堆砌全局自定义 CSS，用 Tailwind + `cva`/`tailwind-merge`
- **Headless UI**：复杂交互组件优先用 `src/components/ui/` 下的 shadcn 组件
- **长列表虚拟化**：章节、关卡等超长列表必须用 `react-window`
- **A11y 支持**：自定义组件补充 ARIA 属性（`aria-label`, `role="dialog"`）和键盘聚焦
- **动画优化**：统一用 `transform` 和 `opacity`，禁用 `left/top/width`
- **图标规范**：UI 禁用 Emoji，用 Lucide 或项目规范图标库

## 6. 代码维护

- **消除冗余**：修改代码时检查相关内容，相似代码一起修改或合并抽象
- **注释规范**：只解释"为什么"，禁用日记式推导过程
- **JSDoc 强制**：复杂函数、Hook、外部接口必须写规范 JSDoc
- **僵尸代码零容忍**：严禁提交被注释的无用代码
- **统一格式**：UTF-8，行内注释用简体中文 `// `

## 7. 测试底线

- 提交前保证 `npm test` 覆盖率不下降
- `npx playwright test` (E2E) 必须通过
- 复杂逻辑必须伴随测试用例
