
const LEVELS = [
    // Chapter 0: 启蒙 (Linear & Poly)
    { id: 1, title: "1. 原点", target: "x", unlock: null, descriptionPath: "story/chapter0/level1.md" },
    { id: 2, title: "2. 镜像", target: "-x", unlock: { levels: [1] }, descriptionPath: "story/chapter0/level2.md" },
    { id: 3, title: "3. 抬升", target: "x+1", unlock: { levels: [2] }, descriptionPath: "story/chapter0/level3.md" },
    { id: 4, title: "4. 倍增", target: "2x", unlock: { levels: [3] }, descriptionPath: "story/chapter0/level4.md" },
    { id: 5, title: "5. 弯曲", target: "x^2", unlock: { levels: [4] }, descriptionPath: "story/chapter0/level5.md" },
    
    // Chapter 1: 震荡 (Trig Basics)
    { id: 6, title: "6. 涟漪", target: "\\sin(x)", unlock: { count: 5 }, descriptionPath: "story/chapter1/level6.md" },
    { id: 7, title: "7. 余波", target: "\\cos(x)", unlock: { levels: [6] }, descriptionPath: "story/chapter1/level7.md" },
    { id: 8, title: "8. 切线", target: "\\tan(x)", unlock: { levels: [7] }, descriptionPath: "story/chapter1/level8.md" },
    { id: 9, title: "9. 偏移", target: "\\sin(x)+1", unlock: { levels: [8] }, descriptionPath: "story/chapter1/level9.md" },
    { id: 10, title: "10. 振幅", target: "2\\sin(x)", unlock: { levels: [9] }, descriptionPath: "story/chapter1/level10.md" },

    // Chapter 2: 生长 (Exp/Log)
    { id: 11, title: "11. 爆发", target: "e^x", unlock: { count: 10 }, descriptionPath: "story/chapter2/level11.md" },
    { id: 12, title: "12. 逆流", target: "\\ln(x)", unlock: { levels: [11] }, descriptionPath: "story/chapter2/level12.md" },
    { id: 13, title: "13. 衰减", target: "e^{-x}", unlock: { levels: [12] }, descriptionPath: "story/chapter2/level13.md" },
    { id: 14, title: "14. 缓慢", target: "\\ln(2x)", unlock: { levels: [13] }, descriptionPath: "story/chapter2/level14.md" },
    { id: 15, title: "15. 融合", target: "x \\cdot e^x", unlock: { levels: [14] }, descriptionPath: "story/chapter2/level15.md" },

    // Chapter 3: 纠缠 (Arithmetic Combination)
    { id: 16, title: "16. 叠加", target: "x + \\sin(x)", unlock: { count: 15 }, descriptionPath: "story/chapter3/level16.md" },
    { id: 17, title: "17. 调制", target: "x \\cdot \\sin(x)", unlock: { levels: [16] }, descriptionPath: "story/chapter3/level17.md" },
    { id: 18, title: "18. 抛物波", target: "x^2 + \\cos(x)", unlock: { levels: [17] }, descriptionPath: "story/chapter3/level18.md" },
    { id: 19, title: "19. 反比", target: "1/x", unlock: { levels: [18] }, descriptionPath: "story/chapter3/level19.md" },
    { id: 20, title: "20. 震荡衰减", target: "\\frac{\\sin(x)}{x}", unlock: { levels: [19] }, descriptionPath: "story/chapter3/level20.md" },

    // Chapter 4: 嵌套 (Composition)
    { id: 21, title: "21. 紧凑", target: "\\sin(2x)", unlock: { count: 20 }, descriptionPath: "story/chapter4/level21.md" },
    { id: 22, title: "22. 加速", target: "\\sin(x^2)", unlock: { levels: [21] }, descriptionPath: "story/chapter4/level22.md" },
    { id: 23, title: "23. 指数波", target: "e^{\\sin(x)}", unlock: { levels: [22] }, descriptionPath: "story/chapter4/level23.md" },
    { id: 24, title: "24. 波中波", target: "\\sin(\\cos(x))", unlock: { levels: [23] }, descriptionPath: "story/chapter4/level24.md" },
    { id: 25, title: "25. 对数方", target: "\\ln(x^2)", unlock: { levels: [24] }, descriptionPath: "story/chapter4/level25.md" },

    // Chapter 5: 混沌 (Complex)
    { id: 26, title: "26. 双重奏", target: "\\sin(x) + \\cos(x)", unlock: { count: 25 }, descriptionPath: "story/chapter5/level26.md" },
    { id: 27, title: "27. 干涉", target: "\\sin(x) \\cdot \\cos(x)", unlock: { levels: [26] }, descriptionPath: "story/chapter5/level27.md" },
    { id: 28, title: "28. 激荡", target: "x^2 \\cdot \\sin(x)", unlock: { levels: [27] }, descriptionPath: "story/chapter5/level28.md" },
    { id: 29, title: "29. 洛伦兹", target: "\\frac{1}{1+x^2}", unlock: { levels: [28] }, descriptionPath: "story/chapter5/level29.md" },
    { id: 30, title: "30. 终焉", target: "\\sin(x) + \\sin(2x)", unlock: { levels: [29] }, descriptionPath: "story/chapter5/level30.md" }
];

const REGIONS = [
    { id: "ch0", title: "序章：启蒙", descriptionPath: "story/chapter0/story.md", unlock: null, levels: [1, 2, 3, 4, 5] },
    { id: "ch1", title: "第一章：震荡", descriptionPath: "story/chapter1/story.md", unlock: { count: 5 }, levels: [6, 7, 8, 9, 10] },
    { id: "ch2", title: "第二章：生长", descriptionPath: "story/chapter2/story.md", unlock: { count: 10 }, levels: [11, 12, 13, 14, 15] },
    { id: "ch3", title: "第三章：纠缠", descriptionPath: "story/chapter3/story.md", unlock: { count: 15 }, levels: [16, 17, 18, 19, 20] },
    { id: "ch4", title: "第四章：嵌套", descriptionPath: "story/chapter4/story.md", unlock: { count: 20 }, levels: [21, 22, 23, 24, 25] },
    { id: "ch5", title: "终章：混沌", descriptionPath: "story/chapter5/story.md", unlock: { count: 25 }, levels: [26, 27, 28, 29, 30] }
];

window.LEVELS = LEVELS;
window.REGIONS = REGIONS;
