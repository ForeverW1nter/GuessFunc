/**
 * Graph Rendering for Guess the Function
 * Uses Desmos API to display mathematical functions.
 */

const Graph = {
    calculator: null,
    targetFunction: null,
    _isLoading: false,
    _resizeHandler: null,

    /**
     * Initialize or update the plot
     */
    init: function(targetFunc, onUpdate, isRawLatex = false) {
        const elt = document.getElementById('plot');
        if (!elt) return;

        if (typeof Desmos === 'undefined') {
            this._loadDesmosAPI(() => {
                const plotEl = document.getElementById('plot');
                if (plotEl) plotEl.innerHTML = ''; 
                this.init(targetFunc, onUpdate, isRawLatex);
            });
            return;
        }

        if (!this.calculator) {
            try {
                this.calculator = Desmos.GraphingCalculator(elt, {
                    expressions: true,
                    settingsMenu: false,
                    zoomButtons: true,
                    lockViewport: false,
                    pointsOfInterest: false,
                    trace: true,
                    autosize: true,
                    backgroundColor: '#ffffff',
                    textColor: '#000000'
                });

                if (onUpdate) {
                    this.calculator.observe('expressions', onUpdate);
                }
            } catch (e) {
                console.error("Desmos Initialization Error:", e);
                return;
            }
        }

        this.targetFunction = targetFunc;
        
        // Skip _toLatex if it's already raw LaTeX from Desmos creator
        const latex = isRawLatex ? this.targetFunction : this._toLatex(this.targetFunction);
        
        this.calculator.setExpressions([
            {
                id: 'target-def',
                latex: `f(x) = ${latex}`,
                secret: true,
                hidden: true
            },
            {
                id: 'target-plot',
                latex: `f(x)`,
                color: '#000000',
                lineStyle: Desmos.Styles.SOLID,
                lineWidth: 4,
                label: '目标函数',
                showLabel: false,
                secret: true
            }
        ]);

        // Force bounds update and resize to ensure correct rendering after container visibility change
        this.calculator.resize();
        this.updateBounds();
    },

    /**
     * Helper to create a small preview calculator
     */
    initPreview: function(eltId) {
        const elt = document.getElementById(eltId);
        if (!elt || typeof Desmos === 'undefined') return null;

        return Desmos.GraphingCalculator(elt, {
            expressions: false,
            settingsMenu: false,
            zoomButtons: false,
            lockViewport: true,
            autosize: true,
            backgroundColor: '#ffffff'
        });
    },

    updateBounds: function() {
        if (!this.calculator) return;
        const elt = document.getElementById('plot');
        if (!elt) return;

        this._isUpdatingBounds = true;
        try {
            const width = elt.clientWidth;
            const height = elt.clientHeight;
            const aspect = width / height;
            
            // Fixed X range, dynamic Y to maintain 1:1
            const xRange = 20; 
            const yRange = xRange / aspect;
            
            this.calculator.setMathBounds({
                left: -10,
                right: 10,
                bottom: -yRange / 2,
                top: yRange / 2
            });
        } finally {
            // Delay resetting to prevent recursive calls during stabilization
            setTimeout(() => { this._isUpdatingBounds = false; }, 50);
        }
    },

    _loadDesmosAPI: function(callback) {
        if (this._isLoading) return;
        this._isLoading = true;

        const plotEl = document.getElementById('plot');
        plotEl.innerHTML = '<div style="padding: 40px; color: #888; text-align: center; font-size: 1.2rem;">正在初始化图形引擎...</div>';

        const script = document.createElement('script');
        script.src = 'https://www.desmos.com/api/v1.10/calculator.js?apiKey=edcf0066d2ce4f71b4d898c660f42067';
        script.async = true;

        script.onload = () => {
            this._isLoading = false;
            if (callback) callback();
        };

        script.onerror = () => {
            this._isLoading = false;
            plotEl.innerHTML = `
                <div style="padding: 40px; color: #d9534f; text-align: center;">
                    <p style="margin-bottom: 20px;">图形引擎加载失败 (Desmos API)</p>
                    <button onclick="location.reload()" style="background: #007bff; color: white; padding: 10px 20px; border-radius: 5px;">刷新重试</button>
                </div>
            `;
        };

        document.head.appendChild(script);
    },

    _toLatex: function(str) {
        // If it's already a LaTeX string (from MathLive), return it as is
        if (str.includes('\\') || str.includes('{')) {
            return str;
        }
        try {
            const node = math.parse(str);
            let latex = node.toTex({ parenthesis: 'keep', implicit: 'hide' });
            latex = latex.replace(/\\operatorname\{arcsin\}/g, '\\arcsin')
                         .replace(/\\operatorname\{arccos\}/g, '\\arccos')
                         .replace(/\\operatorname\{arctan\}/g, '\\arctan')
                         .replace(/\\ln/g, '\\ln');
            return latex;
        } catch (e) {
            return str.replace(/\*/g, '').replace(/x\^(\d+)/g, 'x^{$1}');
        }
    }
};
