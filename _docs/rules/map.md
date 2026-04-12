# 项目架构地图

## FSD 目录结构

```
/
├── __tests__/          # 测试文件 (e2e, 单元测试)
├── scripts/            # 工具链脚本 (.cjs/.mjs)，必须带 @ts-check
├── src/
│   ├── assets/         # 静态资源 (音频、JSON数据)
│   ├── components/ui/  # 全局复用的基础 UI 组件
│   ├── features/       # 【核心层】业务切片 (严禁跨切片深度导入)
│   │   ├── creation/   # 自由创作模式
│   │   ├── game/       # 游戏解谜核心、路由 Loader
│   │   ├── story/      # 故事模式视图与逻辑
│   │   ├── tools/      # 编辑器、创意工坊
│   │   └── ui/         # 顶层布局 (Sidebar, 弹窗)
│   ├── hooks/          # 全局 Custom Hooks
│   ├── locales/        # i18n JSON 字典
│   ├── routes/         # 路由定义 (React Router v6)
│   ├── store/          # 全局 Zustand 状态库
│   ├── types/          # TS 全局类型声明
│   ├── utils/          # 工具函数 (纯函数)
│   ├── workers/        # Web Worker (数学计算)
│   └── main.tsx        # 应用入口
```

## 关键模块职责

- `features/game/store.ts`: 游戏状态"大脑"，管理公式、输入及 Worker 派发
- `utils/DesmosService.ts`: `Desmos` 的唯一防腐层，严禁组件直接调用第三方实例
- `workers/mathEngine.worker.ts`: 独立数学验证引擎，防止主线程卡顿
- `types/i18next.d.ts`: 强制翻译键值类型推导

## 架构解耦原则

1. **边界隔离**：`features/` 下各模块严禁相互深度导入
2. **状态机下放**：巨型组件逻辑必须提取到同级 `hooks/`，UI 仅做 Presenter
3. **副作用收敛**：业务验证/重定向应在 Zustand 或 Router `loader` 中，严禁在 UI `useEffect` 中堆砌副作用
