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
        if (!str) return '';
        // If it's already a LaTeX string, return it as is
        if (str.includes('\\') || str.includes('{')) {
            return str;
        }
        // Basic conversion for simple strings from random level generator
        return str
            .replace(/log10/g, '\\log ')
            .replace(/sin/g, '\\sin ')
            .replace(/cos/g, '\\cos ')
            .replace(/tan/g, '\\tan ')
            .replace(/sqrt/g, '\\sqrt ')
            .replace(/asin/g, '\\arcsin ')
            .replace(/acos/g, '\\arccos ')
            .replace(/atan/g, '\\arctan ')
            .replace(/ln/g, '\\ln ')
            .replace(/abs\((.*?)\)/g, '\\left|$1\\right|')
            .replace(/\*/g, '') 
            .replace(/x\^(\d+)/g, 'x^{$1}');
    },

    /**
     * Check if a given LaTeX expression is equivalent to the target function.
     * Uses Desmos HelperExpression and deterministic sampling over x to compute MSE.
     */
    checkEquality: function(userLatex) {
        // Fast reject: equations are not functions to compare
        if (/=/.test(userLatex)) {
            return Promise.resolve({ isMatch: false, mse: NaN, count: 0, threshold: 1e-3, elapsedMs: 0 });
        }
        // Also reject expressions that contain f(...) or derivative of f
        const lower = (userLatex || '').toLowerCase();
        const containsFToken = /(?:^|[^\\a-z])f(?:\s*\(|\s*\\left\s*\(|'+|\^|\b)/.test(lower);
        if (containsFToken || lower.includes('target')) {
            return Promise.resolve({ isMatch: false, mse: NaN, count: 0, threshold: 1e-3, elapsedMs: 0 });
        }
        if (!this.calculator) return Promise.resolve({ isMatch: false, mse: NaN, count: 0, threshold: 1e-3, elapsedMs: 0 });

        const start = performance.now();
        console.log('[DesmosCheck] start', { userLatex });

        // Define user function g(x) = userLatex
        try {
            this.calculator.setExpression({
                id: '__user_func',
                latex: `g(x) = ${userLatex}`,
                secret: true,
                hidden: true
            });
        } catch (e) {
            console.warn('[DesmosCheck] setExpression g(x) failed', e);
            return Promise.resolve({ isMatch: false, mse: NaN, count: 0, threshold: 1e-3, elapsedMs: performance.now() - start });
        }

        // Create a slider t independent of user expressions
        this.calculator.setExpression({
            id: '__t_slider',
            latex: `t=-10`,
            secret: true,
            hidden: true
        });

        // HelperExpression to evaluate squared difference at current t
        const helperLatex = `(g(t) - f(t))^2`;
        let helper;
        try {
            helper = this.calculator.HelperExpression({ latex: helperLatex });
        } catch (e) {
            console.warn('[DesmosCheck] HelperExpression creation failed', e);
            return Promise.resolve({ isMatch: false, mse: NaN, count: 0, threshold: 1e-3, elapsedMs: performance.now() - start });
        }

        const threshold = 1e-3;
        const points = [];
        for (let x = -10; x <= 10; x += 2) points.push(Number(x.toFixed(2))); // 11 points

        let sumSquared = 0;
        let validCount = 0;

        const pollNumericValue = () => new Promise((resolve) => {
            let tries = 0;
            const tick = () => {
                tries++;
                const v = helper.numericValue;
                if (typeof v === 'number' && isFinite(v)) {
                    resolve({ v, tries });
                } else if (tries > 10) {
                    resolve({ v: NaN, tries });
                } else {
                    setTimeout(tick, 10);
                }
            };
            tick();
        });

        const run = async () => {
            console.log('[DesmosCheck] helperLatex', helperLatex);
            for (const t of points) {
                this.calculator.setExpression({
                    id: '__t_slider',
                    latex: `t=${t}`,
                    secret: true,
                    hidden: true
                });
                const { v, tries } = await pollNumericValue();
                if (typeof v === 'number' && isFinite(v)) {
                    sumSquared += v;
                    validCount++;
                } else {
                    console.log('[DesmosCheck] slow poll', { t, tries });
                }
            }

            const mse = validCount > 0 ? sumSquared / validCount : NaN;
            const elapsedMs = performance.now() - start;
            console.log('[DesmosCheck] result', {
                userLatex,
                pointsTested: points.length,
                validCount,
                mse,
                threshold,
                elapsedMs
            });
            return { isMatch: typeof mse === 'number' && isFinite(mse) && mse < threshold, mse, count: validCount, threshold, elapsedMs };
        };

        return run();
    }
};
