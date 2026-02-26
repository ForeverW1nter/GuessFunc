/**
 * Graph Rendering for Guess the Function
 * Uses Desmos API to display mathematical functions.
 */

const Graph = {
    calculator: null,
    targetFunction: null,
    userFunctions: [],
    
    /**
     * Initialize or update the plot
     * @param {string} targetFunc - The target function string
     * @param {Object} range - {xMin, xMax}
     */
    init: function(targetFunc, range) {
        const elt = document.getElementById('plot');
        if (!elt) return;

        // Try to load Desmos if not already loaded
        if (typeof Desmos === 'undefined') {
            this._loadDesmosAPI(() => this.init(targetFunc, range));
            return;
        }

        if (!this.calculator) {
            try {
                this.calculator = Desmos.GraphingCalculator(elt, {
                    expressions: false,
                    settingsMenu: false,
                    zoomButtons: true,
                    lockViewport: false,
                    pointsOfInterest: false,
                    trace: true,
                    autosize: true
                });
            } catch (e) {
                console.error("Desmos Initialization Error:", e);
                return;
            }
        }

        this.targetFunction = targetFunc;
        this.userFunctions = [];
        this.calculator.setBlank();
        this.calculator.setMathBounds({
            left: range.xMin,
            right: range.xMax,
            bottom: -10,
            top: 10
        });
        this.render();
    },

    /**
     * Dynamically load Desmos API with retry logic
     */
    _loadDesmosAPI: function(callback) {
        if (this._isLoading) return;
        this._isLoading = true;

        const plotEl = document.getElementById('plot');
        plotEl.innerHTML = '<div style="padding: 20px; color: #666;">正在加载 Desmos 图形引擎...</div>';

        // Check if running from file:// protocol
        if (window.location.protocol === 'file:') {
            plotEl.innerHTML = `
                <div style="padding: 20px; color: #856404; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; text-align: center;">
                    <p><strong>检测到协议限制：</strong> Desmos API 通常需要在本地服务器环境（http://）下运行。</p>
                    <p>请尝试使用 VS Code 的 <strong>Live Server</strong> 插件打开，或将代码部署到 GitHub Pages。</p>
                    <button onclick="Graph._startLoadingScript(true, ${callback.toString()})" style="margin-top: 10px; padding: 5px 10px; cursor: pointer;">强制尝试加载</button>
                </div>
            `;
            this._isLoading = false;
            return;
        }

        this._startLoadingScript(false, callback);
    },

    _startLoadingScript: function(force, callback) {
        this._isLoading = true;
        const script = document.createElement('script');
        // Try v1.10 (latest stable) instead of v1.9
        script.src = 'https://www.desmos.com/api/v1.10/calculator.js?apiKey=edcf0066d2ce4f71b4d898c660f42067';
        script.async = true;

        script.onload = () => {
            this._isLoading = false;
            if (callback) callback();
        };

        script.onerror = () => {
            this._isLoading = false;
            const plotEl = document.getElementById('plot');
            plotEl.innerHTML = `
                <div style="padding: 20px; color: #d9534f; text-align: center;">
                    <p>Desmos API 加载失败。</p>
                    <p style="font-size: 0.85rem; color: #666;">这可能是由于网络环境限制或 API 密钥限制导致的。</p>
                    <div style="margin-top: 15px;">
                        <button onclick="location.reload()" style="padding: 8px 16px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 4px; margin-right: 10px;">刷新重试</button>
                    </div>
                </div>
            `;
        };

        document.head.appendChild(script);
    },

    _isLoading: false,

    /**
     * Add a user function to the plot
     * @param {string} originalInput - Original user input string
     * @param {string} substitutedFuncStr - Substituted and simplified function string
     */
    addUserFunction: function(originalInput, substitutedFuncStr) {
        this.userFunctions.push({
            fn: substitutedFuncStr,
            label: originalInput,
            color: this._getRandomColor()
        });
        this.render();
    },

    /**
     * Render the plot using Desmos
     */
    render: function() {
        if (!this.calculator) return;

        // 1. Add target function
        if (this.targetFunction) {
            const latex = this._toLatex(this.targetFunction);
            this.calculator.setExpression({
                id: 'target',
                latex: latex,
                color: '#333333',
                lineStyle: Desmos.Styles.SOLID,
                lineWidth: 3,
                label: '目标函数',
                showLabel: false, // Don't show label for target to keep it mysterious
                secret: true
            });
        }

        // 2. Add user functions
        const recentGuesses = this.userFunctions.slice(-10);
        
        recentGuesses.forEach((uf, index) => {
            const latex = this._toLatex(uf.fn);
            this.calculator.setExpression({
                id: `user-${index}`,
                latex: latex,
                color: uf.color,
                lineStyle: Desmos.Styles.SOLID,
                lineWidth: 2,
                label: uf.label,
                showLabel: true // Directly show the expression on the graph
            });
        });
    },

    /**
     * Convert a mathjs string to Desmos-compatible LaTeX
     * @param {string} str 
     */
    _toLatex: function(str) {
        try {
            // Desmos uses standard LaTeX, but mathjs toTex can sometimes be too literal
            // We'll use mathjs to parse and then a custom latex generator or its built-in one
            const node = math.parse(str);
            let latex = node.toTex({
                parenthesis: 'keep',
                implicit: 'hide'
            });
            
            // Fix some common mathjs -> desmos latex mismatches
            latex = latex.replace(/\\operatorname\{arcsin\}/g, '\\arcsin');
            latex = latex.replace(/\\operatorname\{arccos\}/g, '\\arccos');
            latex = latex.replace(/\\operatorname\{arctan\}/g, '\\arctan');
            latex = latex.replace(/\\ln/g, '\\ln');
            
            return latex;
        } catch (e) {
            console.error("LaTeX conversion error:", e);
            // Very basic fallback
            return str.replace(/\*/g, '').replace(/x\^(\d+)/g, 'x^{$1}');
        }
    },

    _getRandomColor: function() {
        const colors = [
            Desmos.Colors.RED, 
            Desmos.Colors.BLUE, 
            Desmos.Colors.GREEN, 
            Desmos.Colors.ORANGE, 
            Desmos.Colors.PURPLE
        ];
        return colors[this.userFunctions.length % colors.length];
    },

    /**
     * Clear all user functions from the plot
     */
    clearUserFunctions: function() {
        this.userFunctions = [];
        this.render();
    }
};
