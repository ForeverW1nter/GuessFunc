/**
 * 图形管理器模块
 * 负责与 Desmos API 交互，管理绘图区域
 */

const GraphManager = {
    calculator: null,
    targetExprId: 'target-function',
    userInputId: 'user-guess',

    /**
     * 初始化 Desmos 计算器
     * @param {string} containerId 容器元素ID
     */
    init: function(containerId) {
        const elt = document.getElementById(containerId);
        if (!elt) {
            console.error("Calculator container not found:", containerId);
            return;
        }

        this.calculator = Desmos.GraphingCalculator(elt, {
            expressions: true, // 显示侧边栏
            settingsMenu: false, // 禁用设置菜单
            zoomButtons: true, // 显示缩放按钮
            lockViewport: false, // 允许拖拽
            keypad: true, // 显示键盘
            graphpaper: true, // 显示网格
        });

        // 监听表达式变化（可选，用于实时验证或调试）
        // this.calculator.observe('expressionAnalysis', () => { ... });
    },

    /**
     * 设置目标函数曲线
     * @param {string} expression 数学表达式 (Math.js 格式)
     */
    setTargetFunction: function(expression) {
        if (!this.calculator) return;

        // 清除旧的目标函数
        this.calculator.removeExpression({ id: this.targetExprId });

        // 在解析前预处理表达式，确保语法统一
        const processedExpr = MathEngine.preprocessLatex(expression);

        // 将 Math.js 格式转换为标准的 LaTeX
        // 这解决了 Math.js 的 `log` (ln) 与 Desmos 的 `log` (log10) 冲突问题
        // 以及 `*` 和 `/` 等符号的兼容性问题
        let latex = "";
        try {
            const node = math.parse(processedExpr); // 使用处理过的表达式
            latex = node.toTex({
                handler: (node, options) => {
                    if (node.type === 'FunctionNode' && node.name === 'log') {
                        // Math.js log is ln
                        return '\\ln\\left(' + node.args[0].toTex(options) + '\\right)';
                    }
                    if (node.type === 'FunctionNode' && node.name === 'log10') {
                        return '\\log\\left(' + node.args[0].toTex(options) + '\\right)';
                    }
                }
            });
        } catch (e) {
            console.error("Failed to convert to LaTeX:", e);
            // Fallback to simple replacement
            latex = this._toDesmosFormat(expression);
        }
        
        // 目标函数设置为 f(x) = ...
        // 颜色设为黑色 (Desmos.Colors.BLACK)
        // 使用 CSS 隐藏侧边栏项 (expr-id="target")
        this.calculator.setExpression({
            id: this.targetExprId,
            latex: `f(x) = ${latex}`,
            color: Desmos.Colors.BLACK,
            lineWidth: 5,
            secret: true // 恢复游戏核心玩法：隐藏目标函数
        });
    },

    /**
     * 获取第一个表达式（用于创建关卡）
     * @returns {string|null} 表达式
     */
    getFirstExpression: function() {
        if (!this.calculator) return null;
        const expressions = this.calculator.getExpressions();
        // 找到第一个非空的且不是 target 的表达式
        const first = expressions.find(exp => exp.id !== this.targetExprId && exp.latex && exp.latex.trim() !== '');
        
        if (!first) return null;
        
        // 处理 f(x)=... 或 y=...
        let latex = first.latex;
        if (latex.includes('=')) {
            latex = latex.split('=')[1];
        }
        
        // 直接返回原始 LaTeX，让调用者 (UIManager) 去处理
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
        this.calculator.setExpression({ id: 'user-guess-1' });
    },

    /**
     * 获取用户输入的猜测表达式
     * @returns {string|null} 用户表达式 (Math.js 格式) 或 null
     */
    getUserGuess: function() {
        if (!this.calculator) return null;

        const expressions = this.calculator.getExpressions();
        // 寻找非目标函数的表达式
        // 假设用户输入的第一个非目标函数就是猜测
        const guessExpr = expressions.find(exp => exp.id !== this.targetExprId && exp.latex && exp.latex.trim() !== '');

        if (!guessExpr) return null;

        // 处理用户输入：可能是 "y=..." 或 "f(x)=..." 或 直接 "..."
        let latex = guessExpr.latex;
        
        // 简单的清理：如果包含 "="，取右边部分
        if (latex.includes('=')) {
            const parts = latex.split('=');
            if (parts.length > 1) {
                latex = parts[1];
            }
        }

        // 直接返回原始的 LaTeX，交由 MathEngine 处理
        return latex;
    },

    /**
     * 辅助函数：将标准表达式转换为 Desmos 友好格式
     * @private
     */
    _toDesmosFormat: function(expr) {
        // 大部分情况下直接可用，除了一些特殊函数名
        let s = expr;
        s = s.replace(/\basin\b/g, "arcsin");
        s = s.replace(/\bacos\b/g, "arccos");
        s = s.replace(/\batan\b/g, "arctan");
        
        // 处理对数
        // 1. 先保护 log10 (如果存在)
        s = s.replace(/\blog10\b/g, "__LOG_BASE_10__");
        // 2. 将剩下的 log (自然对数) 替换为 ln
        s = s.replace(/\blog\b/g, "ln");
        // 3. 恢复 log10 为 log (Desmos 中 log 是 base 10)
        s = s.replace(/__LOG_BASE_10__/g, "log");
        
        return s;
    },

    /**
     * 清空用户输入
     */
    clearUserGuess: function() {
        if (!this.calculator) return;
        const expressions = this.calculator.getExpressions();
        const toRemove = expressions.filter(exp => exp.id !== this.targetExprId).map(exp => exp.id);
        toRemove.forEach(id => this.calculator.removeExpression({ id: id }));
        
        // 添加一个空的输入行，方便用户输入
        this.calculator.setExpression({ id: 'user-guess-1' });
    }
};

// 暴露给全局
window.GraphManager = GraphManager;
