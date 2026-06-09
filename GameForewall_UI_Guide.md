# GameForewall 极简科幻 UI 开发指南 (致 AI 开发者)

## 写在前面的话

你好，AI 开发者。
你即将接手一个名为 `GameForewall` 的项目。这是一个逻辑极其复杂、包含多套数学与逻辑推理玩法（图象数学 GuessFunc、节点连线 GateFunc、公式推导 GenuineFind 以及创意工坊）的系统。

**请注意：这绝对不是一个普通的后台管理系统（Admin Dashboard）。**
如果你使用常规的前端组件库思维（比如满屏幕的白底卡片、带粗边框的输入框、占据大片面积的侧边栏、生硬的开关按钮），你将彻底毁掉这个游戏的质感。

这个项目追求的是**极简主义 (Minimalism)**、**科幻黑客美学 (Cyber/Tech Aesthetics)** 以及**沉浸式空间感 (Immersive Spatial Design)**。它的界面应该像高级化操作系统（如 EVA 的操作台、或者极简风的科幻电影 UI）。

为了让你（一个可能不擅长 UI 视觉设计的 AI）能够写出符合要求的代码，本指南将手把手、极其详细地告诉你：**不要做什么，必须做什么，以及具体的代码怎么写**。

---

## 1. 核心布局法则：彻底抛弃分栏，拥抱“全屏画布 + 悬浮 HUD”

### 🚫 错误的做法（绝对禁止）
不要把屏幕切成左右两块。
```jsx
// ❌ 灾难性的布局，看起来像个廉价的后台
<div className="flex h-screen">
  <div className="w-1/4 bg-gray-800 p-4">侧边栏控制面板</div>
  <div className="w-3/4 bg-white">数学画布区</div>
</div>
```

### ✅ 正确的做法（必须执行）
界面分为**底板（Canvas）**和**悬浮控制层（HUD）**。
1. 底板绝对定位，占满整个屏幕，它是深邃的纯黑，带有一点噪点。
2. 控制面板像玻璃一样悬浮在屏幕的上方或角落，外部留出大量的空隙。
3. **关键技术点：事件穿透**。悬浮层的外壳必须设置 `pointer-events: none`，否则会挡住底板的鼠标操作（比如拖拽图表）；只有真正的面板内容才设置 `pointer-events: auto`。

**代码示例：**
```jsx
export const GuessFuncLayout = ({ canvasContent, hudContent }) => {
  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* 1. 底板：全屏画布 */}
      <div className="absolute inset-0 z-0">
        {canvasContent}
      </div>

      {/* 2. 悬浮层外壳：全屏覆盖，但鼠标穿透 */}
      <div className="absolute inset-0 z-10 pointer-events-none p-8">
        
        {/* 3. 真正的 HUD 面板：恢复鼠标响应，位于左上角 */}
        <div className="pointer-events-auto w-96 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          {hudContent}
        </div>
        
      </div>
    </div>
  );
};
```

---

## 2. 材质与光影：如何摆脱“塑料感”

### 2.1 玻璃态材质 (Glassmorphism)
不要使用纯色的深灰或亮色背景。所有悬浮面板必须具有玻璃质感。
*   **配方**：背景纯黑带低透明度（`bg-black/40`） + 强烈的背景模糊（`backdrop-blur-xl` 或 `2xl`） + 极细的半透明边框（`border border-white/10`）。

### 2.2 噪点底纹 (Noise Texture)
纯黑（`#000000`）在显示器上看起来像死机。必须在全局注入 SVG 噪点。
*   **做法**：在全局 CSS 中添加以下代码，让整个网页覆盖一层极淡的磨砂质感。

```css
/* index.css 或全局样式 */
body {
  background-color: #000000;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
}
```

### 2.3 弥散光 (Ambient Glow)
不要用 CSS 的 `box-shadow` 给组件发光，那很俗气。
*   **做法**：在背景里放一个巨大的、极度模糊的圆圈，营造一种“屏幕后面透出来的光”的错觉。

```jsx
// 在背景容器里放这个
<div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-500 blur-[120px] opacity-10 pointer-events-none" />
```

---

## 3. 字体与排版：建立精密感的三把武器

这是最容易被 AI 搞砸的地方。你必须严格区分三种字体和对应的样式：

### 武器 1：展示字体 (Display Font) - 用于大标题
*   **要求**：极大字号，极粗，极紧凑的字间距。
*   **代码**：`font-display text-5xl font-bold tracking-tighter text-white`
*   **示例效果**：用来写 "GUESSFUNC" 或 "CHAPTER 01"。

### 武器 2：等宽字体 (Monospace Font) - 用于状态、元数据、装饰
*   **要求**：极小字号，全部大写，**极度拉宽的字间距**，低透明度。
*   **代码**：`font-mono text-xs uppercase tracking-[0.2em] text-white/40`
*   **示例效果**：用来写 "STATUS: ONLINE" 或路径导航 "STORY / OFFICIAL / MAP 01"。这种宽间距的小字是营造“黑客感”的灵魂。

### 武器 3：正文字体 (Sans-serif Font) - 用于普通描述
*   **要求**：字号适中，行高宽松，颜色偏灰（绝对不要用纯白写长篇大论）。
*   **代码**：`font-sans text-sm leading-relaxed text-white/50`

---

## 4. 控件“隐形化”改造指南

《GameForewall.md》里提到了大量的输入、滑块、设置开关。**绝对不能直接使用原生控件！**

### 4.1 输入框 (Input)
*   **🚫 错误**：带白底、带粗边框的输入框。
*   **✅ 正确**：背景透明，平时没有边框，Focus 时只有底部有一条极细的发光线。
```jsx
// 极简输入框示例
<input 
  className="w-full bg-transparent border-b border-white/20 focus:border-emerald-500 outline-none text-white font-mono placeholder:text-white/20 transition-colors py-2"
  placeholder="Enter expression..."
/>
```

### 4.2 开关 / 布尔值设置 (Toggle / Checkbox)
在创意工坊中有大量（如：是否允许参数、是否显示目标）。
*   **🚫 错误**：使用手机 UI 里那种圆圆的 Switch 开关。
*   **✅ 正确**：直接用文字，选中高亮，未选中变暗。或者用简单的中括号包裹。
```jsx
// 极简开关示例
<button className="flex items-center gap-2 font-mono text-sm group">
  <span className={`transition-opacity ${isActive ? 'text-emerald-500 opacity-100' : 'text-white opacity-30 group-hover:opacity-60'}`}>
    [{isActive ? 'ON' : 'OFF'}]
  </span>
  <span className={isActive ? 'text-white' : 'text-white/50'}>
    允许极坐标
  </span>
</button>
```

### 4.3 滑块 (Slider)
*   **🚫 错误**：原生的、又粗又圆的拖动条。
*   **✅ 正确**：极细的轨道（高度 1px 或 2px），极其微小的控制柄。建议使用 Radix UI Slider 彻底定制样式。
```jsx
// 极简滑块视觉示例 (Tailwind 示意)
<div className="relative w-full h-[2px] bg-white/10 rounded-full">
  <div className="absolute top-0 left-0 h-full bg-white w-1/2 rounded-full" />
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
</div>
```

---

## 5. 动效与交互：杜绝僵硬

所有元素的出现都必须有过渡。推荐使用 `framer-motion`。

*   **标准入场**：元素不要突然闪现。应该从稍微靠下一点的位置（y: 20）向上浮动，同时透明度从 0 变到 1。
*   **列表级联 (Stagger)**：如果是渲染一个列表（比如 10 个关卡），不要让它们同时出现，要让它们隔 0.1 秒依次浮现。

**Framer Motion 代码模板：**
```jsx
import { motion } from "framer-motion";

// 父容器：定义级联时间
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 } // 每个子元素延迟 0.1 秒
  }
};

// 子元素：定义下沉和透明度
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } // 优雅的阻尼曲线
  }
};

// 使用
<motion.ul variants={containerVariants} initial="hidden" animate="visible">
  <motion.li variants={itemVariants}>项目 1</motion.li>
  <motion.li variants={itemVariants}>项目 2</motion.li>
</motion.ul>
```

---

## 6. 特殊技术防坑指南（极其重要）

在实现《GameForewall.md》中的逻辑时，你一定会遇到以下几个致命问题：

### 🚨 坑 1：MathLive 虚拟键盘破坏布局
*   **问题**：GuessFunc 和 GenuineFind 必须使用 `mathlive`。它的虚拟键盘默认会在底部弹出，可能会把你的全屏画布顶上去，或者盖住你的 HUD。而且它默认的字体很丑。
*   **解决方案**：
    1. 必须在初始化时强行接管键盘：`mathField.mathVirtualKeyboardPolicy = "manual";`。
    2. 监听 `focusin` 手动调用 `window.mathVirtualKeyboard.show()`。
    3. 在 CSS 中抹除它的默认字体设定，让它继承你的科幻字体。

### 🚨 坑 2：频繁保存导致的拖拽卡顿
*   **问题**：文档要求“玩家操作必须持续写入本地缓存”。但如果你在拖动画布或连续打字时，每一次变化都触发 React 全局状态（如 Zustand）更新并写入 LocalStorage，帧率会掉到个位数。
*   **解决方案：防抖 (Debounce) 与 状态分离**。
    组件内部使用 `useState` 或 `useRef` 维持动画流畅。使用 `lodash/debounce`，只有当玩家停止操作 500ms 后，才真正去更新全局 Store 和缓存。

### 🚨 坑 3：创意工坊的“表单灾难”
*   **问题**：文档第 13 章提到创建关卡有极其繁多的配置。如果你把它们全铺出来，界面会非常恐怖。
*   **解决方案：信息折叠**。
    使用折叠面板（Accordion）。默认只展示最重要的“关卡名称、类型、难度”。将“白名单、多语言、高级判定”等高级选项藏在折叠项或侧边栏标签页中。

---

## 总结你的使命

当你接手开发时，无论遇到什么功能模块，请在写代码前默念三遍：
1. **背景必须是纯黑加噪点吗？**
2. **面板悬浮起来了吗？有玻璃质感吗？**
3. **我是不是又用了丑陋的默认 Input 和 Button？赶紧改成透明隐形的设计！**

祝你好运，创造出惊艳的系统！