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
            s = s.replace(/\\operatorname{abs}\\left\(([^)]*)\\right\)/g, "\\left|$1\\right|");
            s = s.replace(/\\operatorname{([^{}]+)}/g, '$1');
            s = s.replace(/\\cdot/g, '*');
            return s.trim();
        }
    },

    // 游戏配置 (恢复旧版配置)
    config: {
        minDepth: 2,
        maxDepth: 3,
        // 函数列表
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
        // 难度配置
        // 旧版 Easy -> 新版 Easy (1-2)
        // 旧版 Medium -> 新版 Medium (2-3)
        // 旧版 Hard -> 新版 Hell (3-4)
        // 新增 Hard -> 介于 Medium 和 Hell 之间 (3-3)
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
                // 介于 Medium(2-3) 和 Hell(3-4) 之间
                this.config.minDepth = 3;
                this.config.maxDepth = 3;
                break;
            case 'hell':
                this.config.minDepth = 3;
                this.config.maxDepth = 4; // 旧版 Hard 对应 新版 Hell
                break;
            default:
                this.config.minDepth = 2;
                this.config.maxDepth = 3;
        }
    },

    /**
     * Generate random integer between min and max (inclusive)
     */
    randomInt: function(min, max, exclude = []) {
        let num;
        let attempts = 0;
        do {
            num = Math.floor(Math.random() * (max - min + 1)) + min;
            attempts++;
            if (attempts > 100) return min; // Safety break
        } while (exclude && exclude.includes(num));
        return num;
    },

    // 恢复旧版的递归生成逻辑
    generateRandomFunction: function(difficulty) {
        // 为了兼容新版接口，如果传入了 difficulty，设置一下
        if (difficulty) {
            this.setDifficulty(difficulty);
        }

        const maxAttempts = 50; 
        const startTime = Date.now();
        let failedReasons = {};

        for (let i = 0; i < maxAttempts; i++) {
            if (Date.now() - startTime > 500) {
                console.warn("Generation timeout (500ms). Returning fallback.");
                break;
            }

            const depth = this.randomInt(this.config.minDepth, this.config.maxDepth);
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
            
            // 4. 视窗可见性检查
            if (this.isVisibleInViewport(latex)) {
                // 新版接口返回对象
                return { expression: latex, latex: latex };
            } else {
                failedReasons.notVisible = (failedReasons.notVisible || 0) + 1;
            }
        }
        
        console.warn("Failed to generate valid expression. Reasons:", failedReasons);
        
        // 保底函数
        let fallback = "x";
        if (this.config.currentDifficulty === 'hell') {
            fallback = "\\sin(x) \\cdot e^{\\cos(x)}";
        } else if (this.config.currentDifficulty === 'hard') {
            fallback = "x \\cdot \\sin(x) + \\cos(x)";
        } else if (this.config.currentDifficulty === 'medium') {
            fallback = "x^2 + \\sin(x)";
        } else {
            fallback = "x + 1";
        }
        
        return { expression: fallback, latex: fallback };
    },

    /**
     * 递归生成 MathJSON (从旧版恢复)
     */
    _generateRecursiveMathJSON: function(remainingDepth) {
        if (remainingDepth <= 0) {
            // 基础数字规则：x 出现概率 70%，其他 30%
            if (Math.random() < 0.7) {
                return 'x';
            } else {
                // Utils.randomChoice is not available here, use local helper or array access
                const constants = this.config.constants;
                return constants[Math.floor(Math.random() * constants.length)];
            }
        }

        const isFunction = Math.random() < 0.5;

        if (isFunction) {
            const baseFuncs = this.config.baseFunctions;
            const func = baseFuncs[Math.floor(Math.random() * baseFuncs.length)];
            
            if (func === 'Power') {
                const base = this._generateRecursiveMathJSON(remainingDepth - 1);
                const exp = this._generateRecursiveMathJSON(remainingDepth - 1);
                return ["Power", base, exp];
            }

            const inner = this._generateRecursiveMathJSON(remainingDepth - 1);
            return [func, inner];

        } else {
            const ops = this.config.operators;
            const op = ops[Math.floor(Math.random() * ops.length)];
            
            const left = this._generateRecursiveMathJSON(remainingDepth - 1);
            let right = this._generateRecursiveMathJSON(remainingDepth - 1);
            
            let attempts = 0;
            while (this._isStructurallyEqual(left, right) && attempts < 10) {
                right = this._generateRecursiveMathJSON(remainingDepth - 1);
                attempts++;
            }
            
            if (this._isStructurallyEqual(left, right)) {
                if (typeof right === 'number') {
                    right = (right % 5) + 1;
                } else if (right === 'x') {
                    right = 1;
                } else {
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
            return true;
        }
        try {
            const normalized = this.LatexProcessor.normalizeForCE(latex);
            
            try {
                if (!this.ce.lookup("x")) {
                    this.ce.declare("x", {domain: "RealNumbers"});
                }
            } catch(e) {}

            const box = this.ce.parse(normalized);
            
            if (box.head === 'Error') {
                return false;
            }

            let validPoints = 0;
            
            for (let x = -8; x <= 8; x += 1) {
                const valBox = box.subs({x: x}).evaluate();
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

                if (typeof y === 'number' && isFinite(y)) {
                    if (y >= -12 && y <= 12) {
                        return true;
                    }
                    validPoints++;
                }
            }
            
            return false;
        } catch (e) {
            console.error("isVisibleInViewport exception:", e);
            return false;
        }
    },

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

    verifyEquivalence: function(targetLatex, userLatex, params = {}) {
        if (!this.ce) return false;
        
        try {
            const targetNorm = this.LatexProcessor.normalizeForCE(targetLatex);
            const userNorm = this.LatexProcessor.normalizeForCE(userLatex);
            
            let targetBox = this.ce.parse(targetNorm);
            let userBox = this.ce.parse(userNorm);
            
            const hasParams = params && Object.keys(params).length > 0;
            
            if (targetBox.isSame(userBox)) return true;
            
            try { 
                if (targetBox.simplify().isSame(userBox.simplify())) return true; 
            } catch (e) {}

            const variables = ['x'];
            if (hasParams) {
                variables.push(...Object.keys(params));
            }

            variables.forEach(v => {
                 try { 
                     if (!this.ce.lookup(v)) this.ce.declare(v, {domain: "RealNumbers"}); 
                 } catch(e){}
            });

            const numTests = 10;
            let validPoints = 0;
            
            for (let i = 0; i < numTests; i++) {
                const testCase = {};
                variables.forEach(v => {
                    let val = (Math.random() * 10) - 5;
                    if (Math.abs(val) < 0.1) val = 0.5;
                    testCase[v] = val;
                });

                const val1 = this._evaluateBoxWithSubs(targetBox, testCase);
                const val2 = this._evaluateBoxWithSubs(userBox, testCase);
                
                const def1 = (typeof val1 === 'number' && isFinite(val1));
                const def2 = (typeof val2 === 'number' && isFinite(val2));
                
                if (!def1 && !def2) continue;
                if (def1 !== def2) return false;
                
                if (!this._areValuesEqual(val1, val2)) return false;
                
                validPoints++;
            }
            
            return validPoints > 0;

        } catch (e) {
            console.error("Verification error:", e);
            return false;
        }
    },

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

    _areValuesEqual: function(v1, v2) {
        if (Math.abs(v1 - v2) < 1e-5) return true;
        if (Math.abs((v1 - v2) / v1) < 1e-5) return true;
        return false;
    },

    _generateTestPoints: function() {
        return [-5, -2, -1, -0.5, 0, 0.5, 1, 2, 5, Math.PI, Math.E];
    },

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
            console.error("substituteParams error:", e);
            return latex;
        }
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
