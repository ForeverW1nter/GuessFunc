/**
 * 数学引擎模块 (MathEngine)
 * 负责与 CortexJS Compute Engine 交互，提供表达式生成、解析、验证等核心功能。
 * 包含 LatexProcessor 用于处理 LaTeX 格式标准化。
 */

const MathEngine = {
    // 内部 Compute Engine 实例引用
    _ce: null,
    
    // 初始化状态 Promise
    _readyPromise: null,
    
    /**
     * 获取 Compute Engine 实例
     */
    get ce() {
        return this._ce || window.ce;
    },

    /**
     * 异步初始化
     * @returns {Promise<void>}
     */
    init: function() {
        if (this._readyPromise) return this._readyPromise;

        this._readyPromise = new Promise((resolve, reject) => {
            // 1. 尝试直接获取已初始化的实例
            if (window.ce) {
                this._ce = window.ce;
                this._configureCE();
                resolve();
                return;
            }

            // 2. 尝试从全局类进行初始化
            if (typeof ComputeEngine !== 'undefined') {
                try {
                    if (typeof ComputeEngine.ComputeEngine === 'function') {
                        window.ce = new ComputeEngine.ComputeEngine();
                    } else {
                        window.ce = new ComputeEngine();
                    }
                    this._ce = window.ce;
                    this._configureCE();
                    resolve();
                    return;
                } catch (e) {
                    Logger.warn("Failed to auto-init ComputeEngine:", e);
                }
            }

            // 3. 轮询等待
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (window.ce) {
                    clearInterval(checkInterval);
                    this._ce = window.ce;
                    this._configureCE();
                    resolve();
                    return;
                }

                if (typeof ComputeEngine !== 'undefined') {
                    try {
                        if (typeof ComputeEngine.ComputeEngine === 'function') {
                            window.ce = new ComputeEngine.ComputeEngine();
                        } else {
                            window.ce = new ComputeEngine();
                        }
                        clearInterval(checkInterval);
                        this._ce = window.ce;
                        this._configureCE();
                        resolve();
                        return;
                    } catch (e) { /* ignore */ }
                }

                if (Date.now() - startTime > 10000) {
                    clearInterval(checkInterval);
                    reject(new Error("Compute Engine failed to load."));
                }
            }, 100);
        });

        return this._readyPromise;
    },

    /**
     * 配置 Compute Engine
     * @private
     */
    _configureCE: function() {
        if (!this.ce) return;
        try {
            this.ce.assume(["Element", "x", "RealNumbers"]);
            // 注意: Compute Engine 默认将 'e' (和 'pi') 设为内置只读常数
            // 直接给内置常数 assign 会报错 "Cannot assign a value to the constant 'e'"
            // 我们不再手动重新 assign 'e'，而是让 CE 自动处理
            // this.ce.assign("e", 2.718281828459045);
            // this.ce.assign("pi", 3.141592653589793);
            // this.ce.assign("Pi", 3.141592653589793);
        } catch(e) {
            Logger.warn("Failed to configure CE constants:", e);
        }
    },

    /**
     * 获取 LaTeX 中的所有符号
     * @param {string} latex
     * @returns {string[]} 符号列表
     */
    getSymbols: function(latex) {
        if (!this.ce || !latex) return [];
        try {
            const normalized = this.LatexProcessor.normalizeForCE(latex);
            const box = this.ce.parse(normalized);
            
            const symbols = new Set();
            
            const extractSymbols = (expr) => {
                if (!expr) return;
                if (typeof expr === 'string') {
                    if (!this._isKnownFunction(expr) && isNaN(parseFloat(expr))) {
                        symbols.add(expr);
                    }
                } else if (Array.isArray(expr)) {
                    expr.forEach(arg => extractSymbols(arg));
                } else if (typeof expr === 'object' && expr !== null) {
                    if (expr.symbol) {
                        if (!this._isKnownFunction(expr.symbol)) {
                            symbols.add(expr.symbol);
                        }
                    } else if (expr.ops) {
                        expr.ops.forEach(op => extractSymbols(op));
                    }
                }
            };
            
            extractSymbols(box.json);
            
            return Array.from(symbols);
        } catch (e) {
            console.warn("getSymbols failed:", e);
            return (latex.match(/[a-zA-Z]+/g) || []).filter(s => !this._isKnownFunction(s));
        }
    },
    
    /**
     * 判断是否为已知的内置函数或常数
     * @param {string} name 符号或函数名
     * @private
     */
    _isKnownFunction: function(name) {
        const known = [
            'Add', 'Subtract', 'Multiply', 'Divide', 'Power', 'Negate',
            'Sin', 'Cos', 'Tan', 'Arcsin', 'Arccos', 'Arctan', 
            'Sinh', 'Cosh', 'Tanh', 'Exp', 'Ln', 'Log', 'Sqrt', 'Abs',
            'Pi', 'E', 'x', 'y', 'f', 'g', 'h',
            'List', 'Sequence', 'Tuple', 'Set', 'Latex',
            'sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan',
            'sinh', 'cosh', 'tanh', 'exp', 'ln', 'log', 'sqrt', 'abs'
        ];
        return known.includes(name);
    },

    /**
     * LaTeX 处理工具集
     * 用于 MathJSON 和 LaTeX 之间的转换，以及针对 Desmos 的格式优化
     */
    LatexProcessor: {
        /**
         * 将 MathJSON 转换为标准 LaTeX，并进行 Desmos 兼容性处理
         * @param {Object|Array} mathJson - MathJSON 格式的数学表达式
         * @returns {string} 处理后的 LaTeX 字符串
         */
        jsonToDesmosLatex: function(mathJson) {
            if (!MathEngine.ce) return "";
            try {
                // 优先使用自定义转换器以保证格式控制
                const latex = this._customJsonToLatex(mathJson);
                if (latex) return latex;

                // 如果自定义转换失败，回退到 Compute Engine 的内置 LaTeX 生成
                const box = MathEngine.ce.box(mathJson);
                return this.cleanForDesmos(box.latex);
            } catch (e) {
                Logger.error("jsonToDesmosLatex failed:", e);
                return "";
            }
        },

        /**
         * 自定义 MathJSON 转 LaTeX 转换逻辑
         * 目的是生成更符合 Desmos 输入习惯的 LaTeX (例如使用 \cdot 而非空白，括号控制等)
         * @private
         */
        _customJsonToLatex: function(json) {
            if (typeof json === 'string') {
                if (json === 'x') return 'x';
                if (json === 'Pi') return '\\pi';
                if (json === 'E') return 'e';
                return json;
            }
            if (typeof json === 'number') {
                return json.toString();
            }
            if (Array.isArray(json)) {
                const op = json[0];
                const args = json.slice(1);
                
                // --- 函数转换 ---
                if (op === 'Sin') return `\\sin(${this._customJsonToLatex(args[0])})`;
                if (op === 'Cos') return `\\cos(${this._customJsonToLatex(args[0])})`;
                if (op === 'Tan') return `\\tan(${this._customJsonToLatex(args[0])})`;
                if (op === 'Arcsin') return `\\arcsin(${this._customJsonToLatex(args[0])})`;
                if (op === 'Arccos') return `\\arccos(${this._customJsonToLatex(args[0])})`;
                if (op === 'Arctan') return `\\arctan(${this._customJsonToLatex(args[0])})`;
                if (op === 'Sinh') return `\\sinh(${this._customJsonToLatex(args[0])})`;
                if (op === 'Cosh') return `\\cosh(${this._customJsonToLatex(args[0])})`;
                if (op === 'Tanh') return `\\tanh(${this._customJsonToLatex(args[0])})`;
                
                if (op === 'Exp') return `e^{${this._customJsonToLatex(args[0])}}`;
                if (op === 'Ln') return `\\ln(${this._customJsonToLatex(args[0])})`;
                if (op === 'Sqrt') return `\\sqrt{${this._customJsonToLatex(args[0])}}`;
                if (op === 'Abs') return `\\left|${this._customJsonToLatex(args[0])}\\right|`;
                
                // --- 运算符转换 ---
                if (op === 'Add') {
                    return args.map(arg => this._customJsonToLatex(arg)).join(' + ');
                }
                if (op === 'Subtract') {
                    return `${this._customJsonToLatex(args[0])} - ${this._wrapIfNeeded(args[1])}`;
                }
                if (op === 'Multiply') {
                    const left = this._wrapIfNeeded(args[0]);
                    const right = this._wrapIfNeeded(args[1]);
                    return `${left} \\cdot ${right}`;
                }
                if (op === 'Divide') {
                    return `\\frac{${this._customJsonToLatex(args[0])}}{${this._customJsonToLatex(args[1])}}`;
                }
                if (op === 'Power') {
                    const base = this._wrapIfNeeded(args[0], true);
                    const exp = this._customJsonToLatex(args[1]);
                    return `${base}^{${exp}}`;
                }
            }
            return null;
        },

        /**
         * 在必要时为表达式添加括号（例如乘法中的加法项，或幂运算的底数）
         * @private
         */
        _wrapIfNeeded: function(json, isPowerBase = false) {
            if (Array.isArray(json)) {
                const op = json[0];
                if (op === 'Add' || op === 'Subtract') return `(${this._customJsonToLatex(json)})`;
                if (isPowerBase) {
                    return `(${this._customJsonToLatex(json)})`;
                }
                if (typeof json === 'number' && json < 0) return `(${json})`;
            }
            return this._customJsonToLatex(json);
        },

        /**
         * 清理 LaTeX 字符串，使其完全兼容 Desmos
         * 处理诸如 \mathrm, \operatorname, \exponentialE 等 CE 特有的标记
         */
        cleanForDesmos: function(latex) {
            if (!latex) return "";
            let s = latex;

            // 移除多余空白和特定标记
            s = s.replace(/\s+/g, ' ').trim();
            s = s.replace(/\\exponentialE/g, 'e');
            s = s.replace(/\\imaginaryI/g, 'i');
            s = s.replace(/\\differentialD/g, 'd');
            s = s.replace(/\\mathrm{([^{}]+)}/g, '$1');
            s = s.replace(/\\operatorname{([^{}]+)}/g, '$1');

            // 确保函数名前有反斜杠
            const funcs = ['sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'ln', 'log', 'min', 'max', 'exp'];
            funcs.forEach(f => {
                const re = new RegExp(`(?<!\\\\)\\b${f}\\b`, 'gi');
                s = s.replace(re, `\\${f}`);
            });

            // 规范化特定函数格式
            s = s.replace(/\\asin\b/g, "\\arcsin");
            s = s.replace(/\\acos\b/g, "\\arccos");
            s = s.replace(/\\atan\b/g, "\\arctan");
            s = s.replace(/\\abs{([^{}]+)}/g, "\\left|$1\\right|");
            
            return s;
        },

        /**
         * 为 Compute Engine 规范化 LaTeX 
         * 处理绝对值、运算符和常见非标准格式，使其更容易被解析
         */
        normalizeForCE: function(latex) {
            if (!latex) return "";
            let s = latex;
            
            // 基础替换
            // 基础替换
            s = s.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
            s = s.replace(/\\operatorname{abs}\(([^)]*)\)/g, "\\left|$1\\right|");
            s = s.replace(/\\operatorname{([^{}]+)}/g, '$1');
            s = s.replace(/\\cdot/g, '*');
            
            // 处理 \exp 这种特殊情况，直接转化为 e^{...}
            s = s.replace(/\\exp\(([^)]+)\)/g, 'e^{$1}');
            s = s.replace(/\\exp\\left\(([^)]+)\\right\)/g, 'e^{$1}');
            s = s.replace(/\\exp\s*\{([^}]+)\}/g, 'e^{$1}');
            s = s.replace(/\\exp\s*(-?[a-zA-Z0-9]+)/g, 'e^{$1}');

            // 处理连续函数或括号，如 e^{-x}\sin(x) 转换为 e^{-x}*\sin(x)
            s = s.replace(/\)\s*\\/g, ')*\\');
            s = s.replace(/\}\s*\\/g, '}*\\');
            
            // AI 常见格式修正：将 sin(x) 替换为 \sin(x)，如果前面没有反斜杠的话
            const commonFuncs = ['sin', 'cos', 'tan', 'exp', 'ln', 'log', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh'];
            commonFuncs.forEach(f => {
                const re = new RegExp(`(?<!\\\\)\\b${f}\\b`, 'g');
                s = s.replace(re, `\\${f}`);
            });

            // 处理 e^x 这种格式，Compute Engine 有时需要 \exponentialE 或 e
            // 已经在 _configureCE 中 assign 了 e，所以这里保持 e 即可
            
            return s.trim();
        }
    },

    // 随机关卡生成的内部配置
    config: {
        minDepth: 2, // 最小递归深度
        maxDepth: 2, // 最大递归深度
        // 函数池
        baseFunctions: [
            'Exp', 'Ln', 'Power', 
            'Sin', 'Cos', 'Tan', 
            'Arcsin', 'Arccos', 'Arctan', 
            'Sinh', 'Cosh', 'Tanh'
        ], 
        // 运算符池
        operators: ['Add', 'Subtract', 'Multiply', 'Divide'], 
        // 基础数字池
        constants: [1, 2, 3, 4, 5], 
        variables: ['x'],
        currentDifficulty: 'medium'
    },

    /**
     * 根据难度等级设置生成参数
     * @param {number|string} level - 0-5 数字或旧版字符串
     */
    setDifficulty: function(level) {
        if (typeof level === 'number') {
            this.config.currentDifficulty = level;
            
            // 重新映射难度，使本地生成的复杂度更平滑
            // 0-1: 深度 1 (简单的一元函数或线性函数)
            // 2-3: 深度 2 (基本的复合函数或二元运算)
            // 4: 深度 3 (较复杂的复合)
            // 5: 深度 4 (极高难度的复合)
            if (level <= 1.0) {
                this.config.minDepth = 1;
                this.config.maxDepth = 1;
            } else if (level <= 2.5) {
                this.config.minDepth = 1;
                this.config.maxDepth = 2;
            } else if (level <= 4.0) {
                this.config.minDepth = 2;
                this.config.maxDepth = 3;
            } else {
                this.config.minDepth = 3;
                this.config.maxDepth = 4;
            }
        } else {
            // 兼容旧版字符串难度
            const levels = { 'easy': 1, 'medium': 2, 'hard': 3, 'hell': 4 };
            this.setDifficulty(levels[level] || 2);
        }
    },

    /**
     * 生成 [min, max] 之间的随机整数
     */
    randomInt: function(min, max, exclude = []) {
        let num;
        let attempts = 0;
        do {
            num = Math.floor(Math.random() * (max - min + 1)) + min;
            attempts++;
            if (attempts > 100) return min; // 安全退出
        } while (exclude && exclude.includes(num));
        return num;
    },

    /**
     * 核心方法：使用 AI 生成一个数学函数
     * @param {number} difficulty - 难度等级 (0-5)
     * @returns {Promise<Object>} { expression: string, latex: string }
     */
    generateRandomFunction: async function(difficulty, forceLocal = false) {
        if (difficulty !== undefined) {
            this.setDifficulty(difficulty);
        }
        
        const currentDiff = typeof this.config.currentDifficulty === 'number' 
            ? this.config.currentDifficulty 
            : 2.0; 

        if (!forceLocal) {
            try {
                // 先检查是否有可用的 API Key
                if (typeof AIManager !== 'undefined' && AIManager.hasValidKey()) {
                    if (typeof UIManager !== 'undefined' && UIManager.showMessage) {
                        UIManager.showMessage(MESSAGES.get('ai.generating'), "info");
                    }
                    
                    const aiExpression = await AIManager.fetchFunction(currentDiff);
                    if (aiExpression) {
                        // 验证表达式是否有效且可见
                        if (this.isVisibleInViewport(aiExpression)) {
                            return { expression: aiExpression, latex: aiExpression };
                        }
                    }
                } else {
                    // 如果没有 Key，直接静默跳转到本地生成，或由 AIManager 内部提示
                    Logger.log("No valid AI key found. Skipping AI call.");
                }
            } catch (e) {
                Logger.error("AI Generation failed:", e);
            }
        } else {
            Logger.log("用户选择强制使用本地算法生成。");
        }
        
        // 兜底方案：如果 AI 生成失败，使用本地随机生成
        Logger.warn("AI generation failed or invalid. Using local generator fallback.");
        return this._generateLocalRandomFunction(difficulty);
    },

    /**
     * 原有的本地随机生成逻辑作为兜底
     * @private
     */
    _generateLocalRandomFunction: function(difficulty) {
        if (difficulty !== undefined) {
            this.setDifficulty(difficulty);
        }

        const maxAttempts = 30;
        for (let i = 0; i < maxAttempts; i++) {
            const depth = this.randomInt(this.config.minDepth, this.config.maxDepth);
            const json = this._generateRecursiveMathJSON(depth);
            if (!this._hasVariable(json, 'x')) continue;
            if (this._isNumericallyConstant(json)) continue;
            const latex = this.LatexProcessor.jsonToDesmosLatex(json);
            if (this.isVisibleInViewport(latex)) {
                return { expression: latex, latex: latex };
            }
        }
        
        let fallback = "x";
        const d = this.config.currentDifficulty;
        if (d >= 4 || d === 'hell') fallback = "\\sin(x) \\cdot e^{\\cos(x)}";
        else if (d >= 3 || d === 'hard') fallback = "x \\cdot \\sin(x) + \\cos(x)";
        else if (d >= 2 || d === 'medium') fallback = "x^2 + \\sin(x)";
        else fallback = "x + 1";
        
        return { expression: fallback, latex: fallback };
    },

    /**
     * 递归生成随机的 MathJSON 结构
     * @private
     */
    _generateRecursiveMathJSON: function(remainingDepth) {
        // 叶子节点：返回变量或常数
        if (remainingDepth <= 0) {
            // 基础数字规则：x 出现概率 70%，其他常数 30%
            if (Math.random() < 0.7) {
                return 'x';
            } else {
                const constants = this.config.constants;
                return constants[Math.floor(Math.random() * constants.length)];
            }
        }

        const level = this.config.currentDifficulty;
        
        // 难度调节：控制函数的复杂度
        // 低难度下限制函数池和运算符
        let currentFuncs = this.config.baseFunctions;
        let currentOps = this.config.operators;

        if (level <= 1.0) {
            // 简单模式：仅限基础三角、Exp、Ln 和简单加减
            currentFuncs = ['Sin', 'Cos', 'Exp', 'Ln'];
            currentOps = ['Add', 'Subtract'];
        } else if (level <= 2.5) {
            // 中等模式：增加乘除和反三角
            currentFuncs = ['Sin', 'Cos', 'Tan', 'Arcsin', 'Arccos', 'Arctan', 'Exp', 'Ln'];
            currentOps = ['Add', 'Subtract', 'Multiply', 'Divide'];
        } else {
            // 困难/极难模式：启用所有函数池，包含双曲函数
            currentFuncs = this.config.baseFunctions;
            currentOps = this.config.operators;
        }

        const isFunction = Math.random() < 0.5;

        if (isFunction) {
            // 生成一元函数 (如 sin, exp)
            const func = currentFuncs[Math.floor(Math.random() * currentFuncs.length)];
            
            if (func === 'Power') {
                // 指数函数仅在高难度下出现更复杂的结构
                const base = this._generateRecursiveMathJSON(remainingDepth - 1);
                // 指数通常设为简单的，防止图像失控
                const exp = (level > 4) ? this._generateRecursiveMathJSON(remainingDepth - 1) : 2;
                return ["Power", base, exp];
            }

            const inner = this._generateRecursiveMathJSON(remainingDepth - 1);
            return [func, inner];

        } else {
            // 生成二元运算 (如 +, -, *, /)
            const op = currentOps[Math.floor(Math.random() * currentOps.length)];
            
            const left = this._generateRecursiveMathJSON(remainingDepth - 1);
            let right = this._generateRecursiveMathJSON(remainingDepth - 1);
            
            // 避免生成过于简化的结构
            let attempts = 0;
            while (this._isStructurallyEqual(left, right) && attempts < 10) {
                right = this._generateRecursiveMathJSON(remainingDepth - 1);
                attempts++;
            }
            
            return [op, left, right];
        }
    },

    /**
     * 检查两个 MathJSON 结构是否完全相同
     * @private
     */
    _isStructurallyEqual: function(json1, json2) {
        return JSON.stringify(json1) === JSON.stringify(json2);
    },

    /**
     * 检查函数在视口范围内 (-10, 10) 是否有意义且可见
     * @param {string} latex - 要检查的函数表达式
     * @returns {boolean}
     */
    isVisibleInViewport: function(latex) {
        if (!this.ce) {
            return true;
        }
        try {
            const normalized = this.LatexProcessor.normalizeForCE(latex);
            const box = this.ce.parse(normalized);
            
            if (box.head === 'Error') {
                return false;
            }

            let validPoints = 0;
            // 采样点：-10 到 10，步长 0.5
            for (let x = -10; x <= 10; x += 0.5) {
                const valBox = box.subs({x: x}).evaluate();
                let y = valBox.value;
                
                if (y === null || typeof y !== 'number') {
                    const numericBox = valBox.N();
                    y = numericBox.value;
                }

                if (typeof y === 'number' && isFinite(y)) {
                    // 放宽可见范围到 [-20, 20]，AI 有时生成的图像比较高
                    if (y >= -20 && y <= 20) {
                        return true; 
                    }
                    validPoints++;
                }
            }
            
            return validPoints > 3; // 只要有 3 个点有定义且在范围内就通过
        } catch (e) {
            return false;
        }
    },

    /**
     * 别名，检查函数是否在范围内有定义
     */
    isDefinedInRange: function(latex) {
        return this.isVisibleInViewport(latex);
    },

    /**
     * 数值验证：通过采样检查表达式是否为常数
     * @private
     */
    _isNumericallyConstant: function(json) {
        try {
            if (!this.ce) return false;
            const box = this.ce.box(json);
            const x1 = 0.123456;
            const x2 = 1.654321;
            const v1 = box.evaluate({x: x1}).value;
            const v2 = box.evaluate({x: x2}).value;
            
            if (typeof v1 === 'number' && typeof v2 === 'number' && isFinite(v1) && isFinite(v2)) {
                // 如果两个不同采样点的值几乎相同，则认为是常数
                if (Math.abs(v1 - v2) < 1e-9) return true;
            }
            return false;
        } catch(e) { return false; }
    },

    /**
     * 递归检查 MathJSON 中是否包含特定变量
     * @private
     */
    _hasVariable: function(json, varName) {
        if (typeof json === 'string') return json === varName;
        if (Array.isArray(json)) {
            return json.some(item => this._hasVariable(item, varName));
        }
        return false;
    },

    /**
     * 核心逻辑：验证用户输入的 LaTeX 是否与目标 LaTeX 等价
     * @param {string} targetLatex - 目标正确答案
     * @param {string} userLatex - 用户输入
     * @param {Object} params - 额外的参数（如滑块变量）
     * @returns {boolean}
     */
    verifyEquivalence: function(targetLatex, userLatex, params = {}) {
        if (!this.ce) return false;
        
        Logger.log("--- 开始等价性检查 ---");
        Logger.log("目标 LaTeX:", targetLatex);
        Logger.log("用户 LaTeX:", userLatex);
        if (params && Object.keys(params).length > 0) {
            Logger.log("参数:", params);
        }

        try {
            const targetNorm = this.LatexProcessor.normalizeForCE(targetLatex);
            const userNorm = this.LatexProcessor.normalizeForCE(userLatex);
            
            Logger.log("规范化后目标:", targetNorm);
            Logger.log("规范化后用户:", userNorm);

            let targetBox = this.ce.parse(targetNorm);
            let userBox = this.ce.parse(userNorm);
            
            const hasParams = params && Object.keys(params).length > 0;
            
            // 1. 结构化对比：最严格的检查，如果两个表达式的 AST (抽象语法树) 完全相同，则判定等价。
            if (targetBox.isSame(userBox)) {
                Logger.log("判定结果: 匹配 (结构化对比)");
                return true;
            }
            
            // 2. 简化后对比：调用 Compute Engine 的 simplify() 方法对两个表达式进行化简，再次进行结构化对比。
            //    例如，用户输入 x+x，目标是 2x，此步骤可以通过。
            try { 
                const targetSimple = targetBox.simplify();
                const userSimple = userBox.simplify();
                Logger.log("简化后目标:", targetSimple.latex);
                Logger.log("简化后用户:", userSimple.latex);
                if (targetSimple.isSame(userSimple)) {
                    Logger.log("判定结果: 匹配 (简化后结构化对比)");
                    return true;
                }
            } catch (e) {
                Logger.warn("简化对比失败:", e);
            }

            // 3. 数值采样对比：最可靠但也是计算量最大的方法。
            //    在定义域内随机选取多个点，代入两个表达式计算结果，如果结果在误差范围内一致，则判定等价。
            const variables = ['x'];
            if (hasParams) {
                variables.push(...Object.keys(params));
            }

            // 注册变量，告知 Compute Engine 这些是实数变量
            variables.forEach(v => {
                 try { 
                     if (!this.ce.lookup(v)) this.ce.declare(v, {domain: "RealNumbers"}); 
                 } catch(e){}
            });

            const numTests = 10; // 测试点数量
            let validPoints = 0;
            
            Logger.log(`开始数值采样 (共 ${numTests} 个点):`);

            for (let i = 0; i < numTests; i++) {
                const testCase = {};
                variables.forEach(v => {
                    let val = (Math.random() * 10) - 5; // 随机采样范围 [-5, 5]
                    if (Math.abs(val) < 0.1) val = 0.5; // 避免在 0 附近取值，防止除零等问题
                    testCase[v] = val;
                });

                const val1 = this._evaluateBoxWithSubs(targetBox, testCase);
                const val2 = this._evaluateBoxWithSubs(userBox, testCase);
                
                const def1 = (typeof val1 === 'number' && isFinite(val1));
                const def2 = (typeof val2 === 'number' && isFinite(val2));
                
                // 如果在某个采样点，一个表达式有定义而另一个没有，则它们不等价。
                if (def1 !== def2) {
                    Logger.log(`采样点 ${i}: 定义域不匹配于`, testCase, `(目标: ${def1}, 用户: ${def2})`);
                    return false;
                }
                
                // 如果两边都无定义，则忽略此点，继续测试下一个点。
                if (!def1 && !def2) {
                    Logger.log(`采样点 ${i}: 两者均无定义于`, testCase);
                    continue;
                }
                
                // 数值对比，允许极小的计算误差。
                if (!this._areValuesEqual(val1, val2)) {
                    Logger.log(`采样点 ${i}: 数值不匹配于`, testCase, `(目标: ${val1}, 用户: ${val2}, 差值: ${Math.abs(val1-val2)})`);
                    return false;
                }
                
                validPoints++;
            }
            
            // 如果所有有定义的采样点计算结果都相等，则认为两个表达式等价。
            if (validPoints > 0) {
                Logger.log(`判定结果: 匹配 (数值采样通过，有效点 ${validPoints} 个)`);
                return true;
            } else {
                Logger.log("判定结果: 失败 (没有找到任何有效的采样点)");
                return false;
            }

        } catch (e) {
            Logger.error("验证过程中发生错误:", e);
            return false;
        } finally {
            Logger.log("--- 等价性检查结束 ---");
        }
    },

    /**
     * 代入变量并计算数值
     * @private
     */
    _evaluateBoxWithSubs: function(box, subs) {
        try {
            const valBox = box.subs(subs).evaluate();
            let y = valBox.value;
            
            if (y === null || typeof y !== 'number') {
                const numericBox = valBox.N();
                y = numericBox.value;
                
                if (y === null || typeof y !== 'number') {
                    if (typeof numericBox.numericValue === 'number') {
                        y = numericBox.numericValue;
                    } else if (typeof numericBox.valueOf() === 'number') {
                        y = numericBox.valueOf();
                    }
                }
            }
            return y;
        } catch (e) {
            return null;
        }
    },

    /**
     * 判断两个数值是否在误差允许范围内相等
     * 支持绝对误差和相对误差检查
     * @private
     */
    _areValuesEqual: function(v1, v2) {
        if (Math.abs(v1 - v2) < 1e-5) return true;
        if (Math.abs((v1 - v2) / v1) < 1e-5) return true;
        return false;
    },

    /**
     * 生成测试采样点
     * @private
     */
    _generateTestPoints: function() {
        return [-5, -2, -1, -0.5, 0, 0.5, 1, 2, 5, Math.PI, Math.E];
    },

    /**
     * 将参数值代入 LaTeX 表达式并简化
     * @param {string} latex - 原始表达式
     * @param {Object} params - 参数值映射 {a: 1, b: 2}
     * @returns {string} 代入后的 LaTeX
     */
    substituteParams: function(latex, params) {
        if (!this.ce || !params || Object.keys(params).length === 0) return latex;
        try {
            const box = this.ce.parse(this.LatexProcessor.normalizeForCE(latex));
            Object.keys(params).forEach(key => {
                 try { if (!this.ce.lookup(key)) this.ce.declare(key, {domain: "RealNumbers"}); } catch(e){}
            });
            
            const subBox = box.subs(params);
            const simpleBox = subBox.simplify();
            
            return this.LatexProcessor.jsonToDesmosLatex(simpleBox.json);
        } catch (e) {
            Logger.error("substituteParams error:", e);
            return latex;
        }
    },

    /**
     * 检查 LaTeX 语法是否合法
     */
    isValid: function(latex) {
        if (!this.ce) return false;
        try {
            const box = this.ce.parse(latex);
            if (box.head === 'Error') return false;
            return box.isValid;
        } catch (e) { return false; }
    },
    
    /**
     * 获取表达式的简化深度（复杂度）
     */
    getSimplifiedDepth: function(latex) {
        if (!this.ce) return 0;
        try {
            const box = this.ce.parse(latex);
            return this._calcJsonDepth(box.json);
        } catch (e) { return 0; }
    },

    /**
     * 递归计算 MathJSON 的嵌套深度
     * @private
     */
    _calcJsonDepth: function(json) {
        if (!json || !Array.isArray(json)) return 0;
        if (json.length <= 1) return 1;
        const args = json.slice(1);
        return 1 + Math.max(0, ...args.map(arg => this._calcJsonDepth(arg)));
    }
};

window.MathEngine = MathEngine;
