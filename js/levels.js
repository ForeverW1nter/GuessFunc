
/**
 * 关卡数据模块
 * 定义所有预设关卡、章节结构及解锁条件
 */

const LEVELS = [
    // 序章：新手上路
    { id: 1, title: "1. 归零", target: "x + 1", unlock: null, descriptionPath: "story/chapter0/level1.md" },
    { id: 2, title: "2. 反接", target: "2 - x", unlock: { levels: [1] }, descriptionPath: "story/chapter0/level2.md" },
    { id: 3, title: "3. 灵敏", target: "2x - 1", unlock: { levels: [2] }, descriptionPath: "story/chapter0/level3.md" },
    { id: 4, title: "4. 迟钝", target: "0.5x + 2", unlock: { levels: [3] }, descriptionPath: "story/chapter0/level4.md" },
    { id: 5, title: "5. 凹陷", target: "(x-1)^2 - 1", unlock: { levels: [4] }, descriptionPath: "story/chapter0/level5.md" },
    
    // 第一章：周期震荡
    { id: 6, title: "6. 高频", target: "\\sin(2x)", unlock: { count: 5 }, descriptionPath: "story/chapter1/level6.md" },
    { id: 7, title: "7. 延后", target: "\\cos(x - 1)", unlock: { levels: [6] }, descriptionPath: "story/chapter1/level7.md" },
    { id: 8, title: "8. 断点", target: "\\tan(0.5x)", unlock: { levels: [7] }, descriptionPath: "story/chapter1/level8.md" },
    { id: 9, title: "9. 偏置", target: "2\\sin(x) + 1", unlock: { levels: [8] }, descriptionPath: "story/chapter1/level9.md" },
    { id: 10, title: "10. 杂音", target: "\\sin(x) + \\cos(x)", unlock: { levels: [9] }, descriptionPath: "story/chapter1/level10.md" },

    // 第二章：疯狂生长
    { id: 11, title: "11. 升温", target: "e^{0.5x}", unlock: { count: 10 }, descriptionPath: "story/chapter2/level11.md" },
    { id: 12, title: "12. 饱和", target: "\\ln(x + 1)", unlock: { levels: [11] }, descriptionPath: "story/chapter2/level12.md" },
    { id: 13, title: "13. 冷却", target: "2e^{-x}", unlock: { levels: [12] }, descriptionPath: "story/chapter2/level13.md" },
    { id: 14, title: "14. 堆积", target: "\\ln(2x + 1)", unlock: { levels: [13] }, descriptionPath: "story/chapter2/level14.md" },
    { id: 15, title: "15. 过载", target: "x \\cdot e^{-x}", unlock: { levels: [14] }, descriptionPath: "story/chapter2/level15.md" },

    // 第三章：信号干扰
    { id: 16, title: "16. 抖动", target: "x - \\sin(x)", unlock: { count: 15 }, descriptionPath: "story/chapter3/level16.md" },
    { id: 17, title: "17. 扩散", target: "0.5x \\cdot \\sin(x)", unlock: { levels: [16] }, descriptionPath: "story/chapter3/level17.md" },
    { id: 18, title: "18. 颠簸", target: "x^2 + \\cos(2x)", unlock: { levels: [17] }, descriptionPath: "story/chapter3/level18.md" },
    { id: 19, title: "19. 消失", target: "1/(x+1)", unlock: { levels: [18] }, descriptionPath: "story/chapter3/level19.md" },
    { id: 20, title: "20. 回声", target: "\\frac{\\sin(3x)}{x}", unlock: { levels: [19] }, descriptionPath: "story/chapter3/level20.md" },

    // 第四章：机械迷城
    { id: 21, title: "21. 快转", target: "\\sin(3x + 1)", unlock: { count: 20 }, descriptionPath: "story/chapter4/level21.md" },
    { id: 22, title: "22. 变速", target: "\\cos(x^2)", unlock: { levels: [21] }, descriptionPath: "story/chapter4/level22.md" },
    { id: 23, title: "23. 脉动", target: "e^{\\cos(x)}", unlock: { levels: [22] }, descriptionPath: "story/chapter4/level23.md" },
    { id: 24, title: "24. 摇摆", target: "\\sin(\\sin(x))", unlock: { levels: [23] }, descriptionPath: "story/chapter4/level24.md" },
    { id: 25, title: "25. 谷底", target: "\\ln(x^2 + 1)", unlock: { levels: [24] }, descriptionPath: "story/chapter4/level25.md" },

    // 第五章：失控
    { id: 26, title: "26. 撕裂", target: "2\\sin(x) - \\cos(2x)", unlock: { count: 25 }, descriptionPath: "story/chapter5/level26.md" },
    { id: 27, title: "27. 调制", target: "\\sin(x) \\cdot \\cos(2x)", unlock: { levels: [26] }, descriptionPath: "story/chapter5/level27.md" },
    { id: 28, title: "28. 崩溃", target: "x \\cdot \\sin(x^2)", unlock: { levels: [27] }, descriptionPath: "story/chapter5/level28.md" },
    { id: 29, title: "29. 奇点", target: "\\frac{1}{1 + (x-1)^2}", unlock: { levels: [28] }, descriptionPath: "story/chapter5/level29.md" },
    { id: 30, title: "30. 终结", target: "\\sin(x) + \\sin(1.5x)", unlock: { levels: [29] }, descriptionPath: "story/chapter5/level30.md" }
];

const REGIONS = [
    { id: "ch0", title: "序章：新手上路", descriptionPath: "story/chapter0/story.md", unlock: null, levels: [1, 2, 3, 4, 5] },
    { id: "ch1", title: "第一章：周期震荡", descriptionPath: "story/chapter1/story.md", unlock: { count: 5 }, levels: [6, 7, 8, 9, 10] },
    { id: "ch2", title: "第二章：疯狂生长", descriptionPath: "story/chapter2/story.md", unlock: { count: 10 }, levels: [11, 12, 13, 14, 15] },
    { id: "ch3", title: "第三章：信号干扰", descriptionPath: "story/chapter3/story.md", unlock: { count: 15 }, levels: [16, 17, 18, 19, 20] },
    { id: "ch4", title: "第四章：机械迷城", descriptionPath: "story/chapter4/story.md", unlock: { count: 20 }, levels: [21, 22, 23, 24, 25] },
    { id: "ch5", title: "终章：失控", descriptionPath: "story/chapter5/story.md", unlock: { count: 25 }, levels: [26, 27, 28, 29, 30] }
];

window.LEVELS = LEVELS;
window.REGIONS = REGIONS;
