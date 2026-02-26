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
                    console.warn("Failed to auto-init ComputeEngine:", e);
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
        } catch(e) {
            console.warn("Failed to assume x is RealNumber:", e);
        }
    },

    /**
     * LaTeX 处理工具集
     */
    LatexProcessor: {
        /**
         * 将 MathJSON 转换为标准 LaTeX，并进行 Desmos 兼容性处理
         */
        jsonToDesmosLatex: function(mathJson) {
            if (!MathEngine.ce) return "";
            try {
                // 优先使用自定义转换器以保证格式控制
                const latex = this._customJsonToLatex(mathJson);
                if (latex) return latex;

                // Fallback to CE
                const box = MathEngine.ce.box(mathJson);
                return this.cleanForDesmos(box.latex);
            } catch (e) {
                console.error("jsonToDesmosLatex failed:", e);
                return "";
            }
        },

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
                
                // Functions
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
                
                // Operators
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

        _wrapIfNeeded: function(json, isPowerBase = false) {
            if (Array.isArray(json)) {
                const op = json[0];
                if (op === 'Add' || op === 'Subtract') return `(${this._customJsonToLatex(json)})`;
                if (isPowerBase) {
                    // Base of power should almost always be wrapped if it's not a simple symbol
                    // e.g. sin(x)^2 -> (sin(x))^2 or \sin^2(x)
                    // simpler to just wrap
                    return `(${this._customJsonToLatex(json)})`;
                }
                if (typeof json === 'number' && json < 0) return `(${json})`;
            }
            return this._customJsonToLatex(json);
        },

        cleanForDesmos: function(latex) {
            if (!latex) return "";
            let s = latex;

            s = s.replace(/\s+/g, ' ').trim();
            s = s.replace(/\\exponentialE/g, 'e');
            s = s.replace(/\\imaginaryI/g, 'i');
            s = s.replace(/\\differentialD/g, 'd');
            s = s.replace(/\\mathrm{([^{}]+)}/g, '$1');
            s = s.replace(/\\operatorname{([^{}]+)}/g, '$1');

            const funcs = ['sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'ln', 'log', 'min', 'max', 'exp'];
            funcs.forEach(f => {
                const re = new RegExp(`(?<!\\\\)\\b${f}\\b`, 'gi');
                s = s.replace(re, `\\${f}`);
            });

            s = s.replace(/\\asin\b/g, "\\arcsin");
            s = s.replace(/\\acos\b/g, "\\arccos");
            s = s.replace(/\\atan\b/g, "\\arctan");
            s = s.replace(/\\abs{([^{}]+)}/g, "\\left|$1\\right|");
            
            return s;
        },

        normalizeForCE: function(latex) {
            if (!latex) return "";
            let s = latex;
            s = s.replace(/\\operatorname{([^{}]+)}/g, '$1');
            s = s.replace(/\\cdot/g, '*');
            return s.trim();
        }
    },

    // 游戏配置
    config: {
        minDepth: 2,
        maxDepth: 3,
        // 函数列表 (根据用户规则)
        baseFunctions: [
            'Exp', 'Ln', 'Power', 
            'Sin', 'Cos', 'Tan', 
            'Arcsin', 'Arccos', 'Arctan', 
            'Sinh', 'Cosh', 'Tanh'
        ], 
        // 运算列表
        operators: ['Add', 'Subtract', 'Multiply', 'Divide'], 
        // 基础数字
        constants: [1, 2, 3, 4, 5], 
        variables: ['x'],
        currentDifficulty: 'medium'
    },

    setDifficulty: function(level) {
        this.config.currentDifficulty = level;
        // 难度和套的层数有关
        switch(level) {
            case 'easy':
                this.config.minDepth = 1;
                this.config.maxDepth = 2; 
                break;
            case 'medium':
                this.config.minDepth = 2;
                this.config.maxDepth = 3; 
                break;
            case 'hard':
                this.config.minDepth = 3;
                this.config.maxDepth = 4; // 深度套娃
                break;
            default:
                this.config.minDepth = 2;
                this.config.maxDepth = 3;
        }
    },

    /**
     * 生成随机表达式
     * 规则：
     * 1. 基础数字：1-5 (30%), x (70%)
     * 2. 函数：Exp, Ln, Power, Trig, Inverse Trig, Hyperbolic Trig
     * 3. 运算：+, -, *, / (两边不相同)
     * 4. 本质是函数和运算的套娃
     */
    generateRandomExpression: function() {
        const maxAttempts = 50; // 减少尝试次数，防止卡死
        const startTime = Date.now();
        let failedReasons = {};

        for (let i = 0; i < maxAttempts; i++) {
            // 超时保护：超过 500ms 还没生成出来就停止
            if (Date.now() - startTime > 500) {
                console.warn("Generation timeout (500ms). Returning fallback.");
                break;
            }

            const depth = Utils.randomInt(this.config.minDepth, this.config.maxDepth);
            const json = this._generateRecursiveMathJSON(depth);
            
            // 1. 结构检查：必须包含 x
            if (!this._hasVariable(json, 'x')) {
                failedReasons.noX = (failedReasons.noX || 0) + 1;
                continue;
            }

            // 2. 数值检查：必须不是常数
            if (this._isNumericallyConstant(json)) {
                failedReasons.constant = (failedReasons.constant || 0) + 1;
                continue;
            }

            // 3. 转换为 LaTeX
            const latex = this.LatexProcessor.jsonToDesmosLatex(json);
            
            // 4. 视窗可见性检查 ([-10, 10] x [-10, 10])
            if (this.isVisibleInViewport(latex)) {
                return latex;
            } else {
                failedReasons.notVisible = (failedReasons.notVisible || 0) + 1;
                // Log first few failures for debugging
                if (i < 5) console.log("Failed expression (not visible):", latex);
            }
        }
        
        console.warn("Failed to generate valid expression. Reasons:", failedReasons);
        
        // 生成失败后的保底函数，根据难度不同提供不同保底
        if (this.config.currentDifficulty === 'hard') {
            return "\\sin(x) \\cdot e^{\\cos(x)}";
        } else if (this.config.currentDifficulty === 'medium') {
            return "x^2 + \\sin(x)";
        }
        return "x + \\sin(x)"; 
    },

    /**
     * 递归生成 MathJSON
     */
    _generateRecursiveMathJSON: function(remainingDepth) {
        // 终止条件：到达最大深度或随机停止 (但这里我们尽量达到 depth 以保证难度)
        // 用户说难度和套的层数有关，所以我们尽量填满层数
        if (remainingDepth <= 0) {
            // 基础数字规则：x 出现概率 70%，其他 30%
            if (Math.random() < 0.7) {
                return 'x';
            } else {
                return Utils.randomChoice(this.config.constants);
            }
        }

        // 随机选择：函数 (Unary) 还是 运算 (Binary)
        // 50% 概率，或者可以微调
        const isFunction = Math.random() < 0.5;

        if (isFunction) {
            const func = Utils.randomChoice(this.config.baseFunctions);
            
            if (func === 'Power') {
                // Power 需要两个参数：底数和指数
                // 递归生成两个参数
                // Power(f(x), g(x))
                const base = this._generateRecursiveMathJSON(remainingDepth - 1);
                const exp = this._generateRecursiveMathJSON(remainingDepth - 1);
                
                // 简单保护：避免 0 的负数次方等明显错误，虽然 isVisible 会过滤
                return ["Power", base, exp];
            }

            // 一元函数
            const inner = this._generateRecursiveMathJSON(remainingDepth - 1);
            return [func, inner];

        } else {
            // 二元运算
            const op = Utils.randomChoice(this.config.operators);
            
            const left = this._generateRecursiveMathJSON(remainingDepth - 1);
            let right = this._generateRecursiveMathJSON(remainingDepth - 1);
            
            // 规则：二元运算的两边不要是相同的东西
            let attempts = 0;
            while (this._isStructurallyEqual(left, right) && attempts < 10) {
                right = this._generateRecursiveMathJSON(remainingDepth - 1);
                attempts++;
            }
            
            // 如果尝试多次还是相同，强制改变 right
            if (this._isStructurallyEqual(left, right)) {
                if (typeof right === 'number') {
                    right = (right % 5) + 1; // 变成另一个数字
                } else if (right === 'x') {
                    right = 1;
                } else {
                    // 也就是包裹一层，或者换成常数
                    right = 1; 
                }
            }

            return [op, left, right];
        }
    },

    _isStructurallyEqual: function(json1, json2) {
        return JSON.stringify(json1) === JSON.stringify(json2);
    },

    isVisibleInViewport: function(latex) {
        if (!this.ce) {
            console.warn("isVisibleInViewport: ce not ready");
            return true;
        }
        try {
            // 使用 LatexProcessor.normalizeForCE 进行预处理
            const normalized = this.LatexProcessor.normalizeForCE(latex);
            
            // 确保 x 被定义为变量
            // 如果 x 已经被定义过，就不要再定义了，否则会报错
            // 可以通过 declare 放在 try-catch 中来忽略错误
            try {
                if (!this.ce.lookup("x")) {
                    this.ce.declare("x", {domain: "RealNumbers"});
                }
            } catch(e) {
                // Ignore
            }

            const box = this.ce.parse(normalized);
            
            if (box.head === 'Error') {
                console.warn("isVisibleInViewport: Parse Error for latex:", latex, "normalized:", normalized);
                return false;
            }

            // 采样点
            let validPoints = 0;
            // 记录最后一次无效的 y 值以供调试
            let lastInvalidY = null;
            let lastInvalidX = null;
            let failureReason = "All points out of range";

            // 优化：步长从 0.5 增加到 1，减少计算量
            for (let x = -10; x <= 10; x += 1) {
                // 关键修正：使用 .evaluate() 后再 .N() 获取数值近似值，防止返回符号结果 (如 sqrt(2))
                // 注意：Compute Engine 的 .value 可能返回 null 如果结果不是数字
                // 使用 .numericValue 尝试获取机器数
                // 或者 .N().value
                
                // 显式替换 x
                const valBox = box.subs({x: x}).evaluate();
                let y = valBox.value;
                
                // 如果直接 .value 是 null (非数字)，尝试 .N().value (数值近似)
                if (y === null || typeof y !== 'number') {
                    const numericBox = valBox.N();
                    y = numericBox.value;
                    
                    // 如果还是不行，尝试 .numericValue 属性 (有些版本支持)
                    if (y === null || typeof y !== 'number') {
                        if (typeof numericBox.numericValue === 'number') {
                            y = numericBox.numericValue;
                        } else if (typeof numericBox.valueOf() === 'number') {
                            y = numericBox.valueOf();
                        }
                    }
                }

                if (typeof y === 'number' && isFinite(y)) {
                    // 只要有一个点在视窗垂直范围内，就认为是有效关卡
                    if (y >= -10 && y <= 10) {
                        return true;
                    }
                    validPoints++;
                } else {
                    lastInvalidX = x;
                    lastInvalidY = valBox.toString(); // 记录一下原始 box 看看是什么
                    if (validPoints === 0) failureReason = `Undefined or Complex at x=${x}`;
                }
            }
            
            // 调试日志：如果一个可见点都没有，打印一下发生了什么
            console.log(`isVisibleInViewport failed for: ${latex} (norm: ${normalized}). Reason: ${failureReason}. Last invalid (x=${lastInvalidX}): ${lastInvalidY}`);
            
            return false;
        } catch (e) {
            console.error("isVisibleInViewport exception:", e);
            return false;
        }
    },

    /**
     * 检查表达式是否在常用区间内有定义
     * (Alias for isVisibleInViewport for backward compatibility)
     */
    isDefinedInRange: function(latex) {
        return this.isVisibleInViewport(latex);
    },

    _isNumericallyConstant: function(json) {
        try {
            if (!this.ce) return false;
            const box = this.ce.box(json);
            const x1 = 0.123456;
            const x2 = 1.654321;
            const v1 = box.evaluate({x: x1}).value;
            const v2 = box.evaluate({x: x2}).value;
            
            if (typeof v1 === 'number' && typeof v2 === 'number' && isFinite(v1) && isFinite(v2)) {
                if (Math.abs(v1 - v2) < 1e-9) return true;
            }
            return false;
        } catch(e) { return false; }
    },

    _hasVariable: function(json, varName) {
        if (typeof json === 'string') return json === varName;
        if (Array.isArray(json)) {
            return json.some(item => this._hasVariable(item, varName));
        }
        return false;
    },

    verifyEquivalence: function(targetLatex, userLatex) {
        if (!this.ce) return false;
        try {
            const targetBox = this.ce.parse(this.LatexProcessor.normalizeForCE(targetLatex));
            const userBox = this.ce.parse(this.LatexProcessor.normalizeForCE(userLatex));

            if (targetBox.isSame(userBox)) return true;
            try { if (targetBox.simplify().isSame(userBox.simplify())) return true; } catch (e) {}

            return this._checkNumericalEquivalence(targetBox, userBox);
        } catch (e) {
            console.error("Verification error:", e);
            return false;
        }
    },

    _checkNumericalEquivalence: function(box1, box2) {
        const testPoints = this._generateTestPoints();
        let validPoints = 0;
        let mismatchCount = 0;

        for (const x of testPoints) {
            const val1 = box1.evaluate({x}).value;
            const val2 = box2.evaluate({x}).value;
            const def1 = (typeof val1 === 'number' && isFinite(val1));
            const def2 = (typeof val2 === 'number' && isFinite(val2));

            if (!def1 && !def2) continue;
            if (def1 !== def2) {
                mismatchCount++;
                if (mismatchCount > 2) return false;
                continue;
            }
            if (!this._areValuesEqual(val1, val2)) return false;
            validPoints++;
        }
        
        if (validPoints < 5) return this._monteCarloCheck(box1, box2);
        return true;
    },

    _monteCarloCheck: function(box1, box2) {
        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * 100;
            const val1 = box1.evaluate({x}).value;
            const val2 = box2.evaluate({x}).value;
            const def1 = (typeof val1 === 'number' && isFinite(val1));
            const def2 = (typeof val2 === 'number' && isFinite(val2));

            if (def1 && def2) {
                if (!this._areValuesEqual(val1, val2)) return false;
                return true; 
            }
        }
        return true; 
    },

    _areValuesEqual: function(v1, v2) {
        if (Math.abs(v1 - v2) < 1e-9) return true;
        if (Math.abs(v1 - v2) / Math.max(Math.abs(v1), Math.abs(v2)) < 1e-9) return true;
        return false;
    },

    _generateTestPoints: function() {
        return [
            0, 1, -1, 0.5, -0.5, 2, -2, 10, -10,
            Math.PI, -Math.PI, Math.PI/2, Math.E,
            ...Array.from({length: 10}, () => (Math.random() - 0.5) * 20)
        ];
    },

    isValid: function(latex) {
        if (!this.ce) return false;
        try {
            const box = this.ce.parse(latex);
            if (box.head === 'Error') return false;
            return box.isValid;
        } catch (e) { return false; }
    },
    
    getSimplifiedDepth: function(latex) {
        if (!this.ce) return 0;
        try {
            const box = this.ce.parse(latex);
            return this._calcJsonDepth(box.json);
        } catch (e) { return 0; }
    },

    _calcJsonDepth: function(json) {
        if (!json || !Array.isArray(json)) return 0;
        if (json.length <= 1) return 1;
        const args = json.slice(1);
        return 1 + Math.max(0, ...args.map(arg => this._calcJsonDepth(arg)));
    }
};

window.MathEngine = MathEngine;
