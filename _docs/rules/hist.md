# 历史 Bug 防御策略

> 修改相关模块时必须反复阅读，**绝对不允许**重蹈覆辙

## 优先级 1：白屏或数据损毁

| 模块 | 根本原因 | 防御策略 |
|------|----------|----------|
| 持久化 / JSON | Zustand 还原前缺乏校验 | 处理外部 JSON **必须**用 Zod；`ErrorBoundary` 重置需精准清缓存 |
| Zustand Hydration | 空 LocalStorage 被 `merge` 传为 `undefined` | 自定义 `merge` **必须**首行拦截 `if (!persistedState) return currentState;` |
| 路由与状态机 | `Loader` 未处理空索引，缺状态重置 | 路由守卫获取参数失败**必须**重定向至安全路由 |
| 动态导入 | `import.meta.glob` 对象直接给 Zod 校验 | 动态导入必须提取 `module.default \|\| module` |
| 外部数据解析 | 使用不安全的 `as` 类型断言 | 非受信数据**必须**用 `Schema.parse()` 校验 |
| 数学引擎编译 | `box.compile()` 未用 `try...catch` 包裹 | 外部库编译/解析操作**必须** `try...catch` 兜底 |
| URL 解析 | 使用废弃的 `escape`/`unescape` | **严禁**使用 `escape`，必须用 `btoa(encodeURIComponent(...))` |

## 优先级 2：性能或内存泄漏

| 模块 | 根本原因 | 防御策略 |
|------|----------|----------|
| 第三方库性能 | `change` 事件同步解析 AST，`useEffect` 依赖滥用 | 高频事件**强制防抖**；非 React 实例依赖必须为 `[]`，内部用 `useStore.getState()` |
| React 路由死循环 | 渲染期用 `useEffect` + `useNavigate` 重定向 | 渲染期重定向**严禁**用 `useEffect`，必须用 `<Navigate replace />` 或 Router `loader` |
| Hooks 内存泄漏 | 定时器缺 `cleanup` 清理 | `useEffect` 中的全局事件或定时器**必须**返回清理函数 |
| 微任务挤压 | 异常捕获块滥用 `import()` 动态加载 Logger | 热路径内**严禁**动态导入非异步组件 |

## 优先级 3：逻辑错误与扩展性

| 模块 | 根本原因 | 防御策略 |
|------|----------|----------|
| 状态不同步 | 仅重置进度未重置 `useGameStore` | 全局上下文切换时**必须**同步重置所有相关 Store 状态 |
| 硬编码依赖 | 硬编码强依赖第三方库内部 `id === 'target-function'` | **严禁**硬编码外部 ID，在 `constants.ts` 维护并用排除法识别 |
| 数学引擎定义域 | 循环匹配后未因 `domainMismatchCount` 否决 | 采样循环严禁轻易 `continue`，必须联合判定有效点与定义域错误 |
| 大型循环性能 | `evaluate2D` 循环体缺 `break` | O(N) 级别大循环一旦确定失败**必须立即 break/return** |
| 极值与除零 | 计算比例未防御除零并滥用 `as` | 除法必须做 `0` 校验；严禁粗暴类型断言 |
| 渲染期状态突变 | `Loader` 在渲染周期突变全局状态 | 重定向和预加载必须在 Router `loader` 中进行 |
| 硬编码翻译 | 核心组件硬编码字符串 | 面向用户文案**必须**用 `i18n.t()` 渲染 |
| 章节合并去重失效 | 用 `id + title` 作为唯一键，语言切换导致误判 | 章节合并唯一性**只能**依赖稳定标识 `id` |
| 全局样式污染 | `index.css` 堆砌自定义全局类 | 严禁写全局自定义 CSS，必须用 Tailwind 或 React 组件封装 |

## 历史重构里程碑（严禁退化）

1. 类型与常量：消除 `any`/`@ts-ignore`；提取硬编码至 `constants.ts`
2. 架构解耦：巨型组件肢解，复杂逻辑下放 Controller Hook；建立防腐层
3. 性能极化：耗时计算移至 Web Worker；长列表虚拟化；动画 GPU 加速
4. 安全防御：Zustand 迁移强类型测试兜底；Zod 拦截脏数据
5. 工程基建：Playwright E2E/Worker 测试覆盖；i18next-parser 自动提取；jscpd 清除重复代码
