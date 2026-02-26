/**
 * 图形管理器模块
 * 负责与 Desmos API 交互，管理绘图区域
 */

const GraphManager = {
    calculator: null,
    targetExprId: 'target-function',

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
    },

    /**
     * 设置目标函数曲线
     * @param {string} expression LaTeX 表达式
     */
    setTargetFunction: function(expression) {
        if (!this.calculator) return;

        // 清除旧的目标函数
        this.calculator.removeExpression({ id: this.targetExprId });

        // 使用 MathEngine 进行标准化清理 (虽然通常输入已经是干净的)
        let latex = expression;
        if (window.MathEngine && window.MathEngine.LatexProcessor) {
            latex = window.MathEngine.LatexProcessor.cleanForDesmos(expression);
        }

        Logger.log(`[GraphManager] Setting target: ${latex}`);

        // 目标函数设置为 f(x) = ...
        this.calculator.setExpression({
            id: this.targetExprId,
            latex: `f(x) = ${latex}`,
            color: Desmos.Colors.BLACK,
            lineWidth: 5,
            secret: true //是否隐藏表达式
        });
    },

    /**
     * 获取用户输入的猜测表达式
     * @returns {string|null} LaTeX 表达式
     */
    getUserGuess: function() {
        if (!this.calculator) return null;

        const expressions = this.calculator.getExpressions();
        // 寻找非目标函数的表达式
        // 假设用户输入的第一个非目标函数就是猜测
        const guessExpr = expressions.find(exp => exp.id !== this.targetExprId && exp.latex && exp.latex.trim() !== '');

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

        return latex;
    },

    /**
     * 清空除目标外的所有表达式
     */
    clearAllExceptTarget: function() {
        if (!this.calculator) return;
        const expressions = this.calculator.getExpressions();
        const toRemove = expressions.filter(exp => exp.id !== this.targetExprId).map(exp => exp.id);
        toRemove.forEach(id => this.calculator.removeExpression({ id: id }));
        
        // 添加一个空的输入行
        this.calculator.setExpression({ id: 'user-guess-1' });
    },
    
    /**
     * 获取第一个表达式（用于创建关卡）
     */
    getFirstExpression: function() {
        // 复用 getUserGuess 逻辑，因为它们本质一样
        return this.getUserGuess();
    }
};

// 暴露给全局
window.GraphManager = GraphManager;
