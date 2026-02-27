
/**
 * 图形管理器模块
 * 负责与 Desmos API 交互，管理绘图区域
 */

const GraphManager = {
    calculator: null,
    targetExprId: 'target-function',
    paramsFolderId: 'params-folder',

    /**
     * 初始化 Desmos 计算器
     * @param {string} containerId 容器元素ID
     */
    init: function(containerId) {
        return new Promise((resolve, reject) => {
            const elt = document.getElementById(containerId);
            if (!elt) {
                console.error("Calculator container not found:", containerId);
                reject(new Error("Container not found"));
                return;
            }

            // 等待 Desmos 加载
            const checkInterval = setInterval(() => {
                if (window.Desmos) {
                    clearInterval(checkInterval);
                    this._initCalculator(elt);
                    resolve();
                }
            }, 100);
            
            // 10秒超时
            setTimeout(() => {
                if (!window.Desmos) {
                    clearInterval(checkInterval);
                    console.error("Desmos failed to load.");
                    // 尝试提示用户
                    if (window.UIManager && window.UIManager.showMessage) {
                        window.UIManager.showMessage("Desmos 加载失败，请检查网络。", "error");
                    }
                    reject(new Error("Desmos load timeout"));
                }
            }, 10000);
        });
    },

    _initCalculator: function(elt) {
        if (!window.Desmos) return;
        this.calculator = Desmos.GraphingCalculator(elt, {
            expressions: true, // 显示侧边栏
            settingsMenu: false, // 禁用设置菜单
            zoomButtons: true, // 显示缩放按钮
            lockViewport: false, // 允许拖拽
            keypad: true, // 显示键盘
            graphpaper: true, // 显示网格
        });
        /* 
        // 监听表达式变化，处理参数归类 - 移除此功能以避免强制文件夹生成和潜在的死循环
        this.calculator.observe('expressionAnalysis', () => {
             this._organizeParameters();
        });
        */
    },

    /**
     * 设置关卡（目标函数 + 参数）
     * @param {string} target 目标函数表达式
     * @param {Object} params 参数对象 {a: 1, b: 2}
     */
    setupLevel: function(target, params) {
        if (!this.calculator) return;

        // 1. 设置目标函数
        this.setTargetFunction(target);

        // 2. 清理画布（移除除了 target 以外的所有内容）
        const expressions = this.calculator.getExpressions();
        const toRemove = expressions.filter(exp => exp.id !== this.targetExprId).map(exp => exp.id);
        toRemove.forEach(id => this.calculator.removeExpression({ id: id }));

        // 3. 添加用户输入框（放在第二位）
        // 默认函数机制：始终提供一个默认猜测，方便用户开始
        // 所有关卡的默认输入都改成x，颜色为红色
        let defaultGuess = 'x'; 
        
        this.calculator.setExpression({ 
            id: 'user-guess-1',
            latex: defaultGuess,
            color: Desmos.Colors.RED
        });

        // 4. 如果有参数，直接添加滑块（不使用文件夹，避免兼容性问题）
        if (params && Object.keys(params).length > 0) {
            const exprs = [];
            
            // 直接添加滑块，不指定 folderId
            Object.entries(params).forEach(([key, val]) => {
                exprs.push({
                    id: `param-${key}`,
                    latex: `${key}=${val}`
                });
            });
            
            // 使用 setExpressions 批量添加
            this.calculator.setExpressions(exprs);
        }
    },

    /**
     * 设置目标函数曲线
     * @param {string} expression LaTeX 表达式
     */
    setTargetFunction: function(expression) {
        if (!this.calculator) return;

        // 清除旧的目标函数
        this.calculator.removeExpression({ id: this.targetExprId });

        // 使用 MathEngine 进行标准化清理
        let latex = expression;
        if (window.MathEngine && window.MathEngine.LatexProcessor) {
            latex = window.MathEngine.LatexProcessor.cleanForDesmos(expression);
        }

        Logger.log(`[GraphManager] Setting target: ${latex}`);

        this.calculator.setExpression({
            id: this.targetExprId,
            latex: `f(x) = ${latex}`,
            color: Desmos.Colors.BLACK,
            lineWidth: 5,
            secret: true
        });
    },

    /**
     * 自动整理参数滑块到文件夹
     */
    _organizeParameters: function() {
        if (!this.calculator) return;
        
        const expressions = this.calculator.getExpressions();
        
        // 查找所有滑块表达式
        const sliders = expressions.filter(exp => {
            return exp.type === 'expression' && 
                   exp.id !== this.targetExprId && 
                   exp.id !== 'user-guess-1' &&
                   exp.latex && 
                   exp.latex.match(/^[a-zA-Z](_\{?[a-zA-Z0-9]+\}?)?\s*=[^=]+$/) &&
                   !exp.latex.startsWith('y=') && 
                   !exp.latex.startsWith('x=');
        });

        // 如果没有滑块，不需要文件夹
        if (sliders.length === 0) {
            // 如果文件夹为空且存在，可以考虑删除，但为了避免用户体验跳动，暂时保留或不处理
            // 用户要求：如果没有参数，不要创建文件夹。
            // 这里我们只在发现新滑块时创建。
            return;
        }

        // 确保文件夹存在
        let folder = expressions.find(e => e.id === this.paramsFolderId);
        if (!folder) {
            this.calculator.setExpression({
                type: 'folder',
                id: this.paramsFolderId,
                title: '参数',
                collapsed: false
            });
        }
        
        // 将未归类的滑块移动到文件夹
        sliders.forEach(exp => {
             if (exp.folderId !== this.paramsFolderId) {
                 this.calculator.setExpression({ id: exp.id, folderId: this.paramsFolderId });
             }
        });
    },

    /**
     * 获取用于创建关卡的数据（第一行表达式 + 相关参数）
     * 不依赖文件夹结构，扫描所有赋值
     * @returns {Object|null} { latex: string, params: Object }
     */
    getLevelCreationData: function() {
        if (!this.calculator) return null;

        const expressions = this.calculator.getExpressions();
        // 1. 找到第一个非文件夹、非目标函数的表达式作为目标
        // 通常是列表中的第一个 visible expression
        const targetExpr = expressions.find(exp => 
            exp.id !== this.targetExprId && 
            exp.type === 'expression' &&
            exp.latex && 
            exp.latex.trim() !== '' &&
            !exp.latex.match(/^[a-zA-Z](_\{?[a-zA-Z0-9]+\}?)?\s*=[^=]+$/) // 排除参数赋值
        );

        if (!targetExpr) return null;

        let latex = targetExpr.latex;
        // 清理 "=" 左边
        if (latex.includes('=')) {
            const parts = latex.split('=');
            if (parts.length > 1) {
                latex = parts[1];
            }
        }
        latex = latex.trim();

        // 2. 扫描所有参数赋值 (a=1, b=2...)
        const params = {};
        expressions.forEach(exp => {
            if (exp.type === 'expression' && exp.latex) {
                // 匹配 "var = value"
                // 排除 x=, y=, f(x)=
                if (exp.latex.match(/^[a-zA-Z](_\{?[a-zA-Z0-9]+\}?)?\s*=[^=]+$/) &&
                    !exp.latex.startsWith('y=') && 
                    !exp.latex.startsWith('x=')) {
                    
                    const parts = exp.latex.split('=');
                    if (parts.length === 2) {
                        const key = parts[0].trim();
                        let val = parseFloat(parts[1]);
                        if (!isNaN(val)) {
                            params[key] = val;
                        }
                    }
                }
            }
        });

        // 3. 过滤参数：只保留目标表达式中出现的参数
        // 使用 MathEngine.getSymbols 来精确提取变量
        let symbols = [];
        if (window.MathEngine && window.MathEngine.getSymbols) {
            symbols = window.MathEngine.getSymbols(latex);
        } else {
            // 降级策略：正则 (改进版，不依赖 \b)
            // 匹配所有连续的字母序列，如果是参数名则保留
            // 例如 "ax+b", a 和 b 都是单字母，会被 [a-zA-Z]+ 匹配
            const words = latex.match(/[a-zA-Z_]+/g) || [];
            symbols = words;
        }

        const filteredParams = {};
        Object.keys(params).forEach(key => {
            // 如果 key 在符号列表中，或者 latex 包含 key (作为备选)
            if (symbols.includes(key)) {
                filteredParams[key] = params[key];
            } else {
                // 尝试用正则再检查一次，以防万一
                const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // 简单包含检查，不依赖边界，适用于单字母参数
                if (latex.includes(key)) {
                     // 进一步确认是否误判（例如 key='a', latex='tan'）
                     // 如果 key 是 'a'，检查它前后是否是字母
                     // 这比较复杂，还是尽量依赖 getSymbols
                     // 这里做一个简单的检查：如果 key 长度 > 1，直接信任 include
                     if (key.length > 1) {
                         filteredParams[key] = params[key];
                     } else {
                         // 单字母参数，检查是否是函数名的一部分
                         // 简单的黑名单：sin, cos, tan, log, ln, exp...
                         const forbidden = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'exp', 'min', 'max', 'abs'];
                         let isPart = false;
                         forbidden.forEach(f => {
                             if (f.includes(key) && latex.includes(f)) {
                                 // 可能误判，但也可能是真的
                                 // 如果 latex = "sin(ax)", key="a"
                                 // sin 包含 a，但也包含 x
                                 // 这是一个难题。
                                 // 所以我们主要依赖 MathEngine.getSymbols
                             }
                         });
                         // 如果没有 MathEngine，这里确实很难完美
                         // 但我们假设 MathEngine 存在
                     }
                }
            }
        });
        
        // 如果 MathEngine 可用，使用它作为权威
        if (window.MathEngine && window.MathEngine.getSymbols) {
             const strictFiltered = {};
             Object.keys(params).forEach(key => {
                 if (symbols.includes(key)) {
                     strictFiltered[key] = params[key];
                 }
             });
             return { latex, params: strictFiltered };
        }

        return { latex, params: filteredParams };
    },

    /**
     * 获取用户输入的猜测表达式及参数
     * @returns {Object|null} { latex: string, params: Object }
     */
    getUserGuessData: function() {
        if (!this.calculator) return null;

        const expressions = this.calculator.getExpressions();
        // 寻找非目标函数的表达式
        // 假设用户输入的第一个非目标函数就是猜测
        const guessExpr = expressions.find(exp => 
            exp.id !== this.targetExprId && 
            exp.type === 'expression' &&
            exp.latex && 
            exp.latex.trim() !== '' &&
            !exp.latex.match(/^[a-zA-Z](_\{?[a-zA-Z0-9]+\}?)?\s*=[^=]+$/) // 排除参数赋值
        );

        if (!guessExpr) return null;

        let latex = guessExpr.latex;
        
        // 简单的清理：如果包含 "="，取右边部分
        // 用户可能输入 "g(x) = x^2" 或 "y = x^2"
        if (latex.includes('=')) {
            const parts = latex.split('=');
            if (parts.length > 1) {
                latex = parts[1];
            }
        }
        
        // 收集参数值
        // 在“猜”的阶段，参数必须在文件夹里（由 setupLevel 创建）
        // 或者我们也可以放宽限制，读取所有 slider
        // 为了兼容性，这里读取所有 slider，不再强制依赖 folderId
        const params = {};
        expressions.forEach(exp => {
             // 只要是 slider 就读取
            if (exp.latex && exp.latex.match(/^[a-zA-Z](_\{?[a-zA-Z0-9]+\}?)?\s*=[^=]+$/)) {
                if (!exp.latex.startsWith('y=') && !exp.latex.startsWith('x=')) {
                    const parts = exp.latex.split('=');
                    if (parts.length === 2) {
                        const key = parts[0].trim();
                        let val = parseFloat(parts[1]);
                        if (!isNaN(val)) {
                            params[key] = val;
                        }
                    }
                }
            }
        });

        // 过滤参数：只保留猜测表达式中出现的参数
        // 使用 MathEngine.getSymbols 来精确提取变量
        let symbols = [];
        if (window.MathEngine && window.MathEngine.getSymbols) {
            symbols = window.MathEngine.getSymbols(latex);
        } else {
            const words = latex.match(/[a-zA-Z_]+/g) || [];
            symbols = words;
        }

        const filteredParams = {};
        if (window.MathEngine && window.MathEngine.getSymbols) {
             Object.keys(params).forEach(key => {
                 if (symbols.includes(key)) {
                     filteredParams[key] = params[key];
                 }
             });
        } else {
            // Fallback
             Object.keys(params).forEach(key => {
                 const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                 if (latex.includes(key)) {
                      if (key.length > 1) {
                          filteredParams[key] = params[key];
                      } else {
                          const forbidden = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'exp', 'min', 'max', 'abs'];
                          let isPart = false;
                          forbidden.forEach(f => { if (f.includes(key) && latex.includes(f)) isPart = true; });
                          // 简单处理
                          filteredParams[key] = params[key];
                      }
                 }
             });
        }

        return { latex, params: filteredParams };
    },
    
    /**
     * 获取用户猜测 (兼容旧接口)
     */
    getUserGuess: function() {
        const data = this.getUserGuessData();
        return data ? data.latex : null;
    },

    /**
     * 清空除目标外的所有表达式
     */
    clearAllExceptTarget: function() {
        if (!this.calculator) return;
        const expressions = this.calculator.getExpressions();
        // 保留 target
        const toRemove = expressions.filter(exp => exp.id !== this.targetExprId).map(exp => exp.id);
        toRemove.forEach(id => this.calculator.removeExpression({ id: id }));
        
        // 添加一个空的输入行
        this.calculator.setExpression({ id: 'user-guess-1' });
        
        // 添加参数文件夹
        this.calculator.setExpression({
            type: 'folder',
            id: this.paramsFolderId,
            title: '参数',
            collapsed: false
        });
    },
    
    /**
     * 获取第一个表达式（用于创建关卡）
     */
    getFirstExpression: function() {
        return this.getUserGuess();
    }
};

// 暴露给全局
window.GraphManager = GraphManager;
