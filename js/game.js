/**
 * Main Game Logic for Guess the Function
 */

const Game = {
    targetFunc: null,
    isWon: false,
    _isChecking: false,
    previewCalculator: null,

    /**
     * Initialize the game
     */
    init: function() {
        this.setupEventListeners();
        
        const sharedLevel = Utils.getLevelFromURL();
        if (sharedLevel) {
            this.loadLevel(sharedLevel);
        } else {
            this.loadRandomLevel();
        }
    },

    /**
     * Load a level from a level object
     */
    loadLevel: function(level, isRawLatex = false) {
        this.targetFunc = level.targetFuncStr;
        this.isWon = false;

        const messageEl = document.getElementById('message');
        messageEl.textContent = '';
        messageEl.classList.remove('show', 'success');

        // Initialize Plot with update listener and LaTeX flag
        Graph.init(this.targetFunc, () => this.handleDesmosUpdate(), isRawLatex);
    },

    /**
     * Load a random level
     */
    loadRandomLevel: function() {
        const level = Utils.generateRandomLevel();
        this.loadLevel(level);
    },

    /**
     * Handle updates from Desmos sidebar
     */
    handleDesmosUpdate: function() {
        if (this.isWon || this._isChecking) return;
        // Just log the update to console for now, actual check happens on "Confirm Guess"
        const expressions = Graph.calculator.getExpressions();
        console.log("Desmos Sidebar Updated. Current Expressions:", expressions.map(e => e.latex).filter(l => !!l));
    },

    /**
     * Perform the actual win check on demand
     */
    confirmGuess: function() {
        if (this.isWon || this._isChecking) return;

        const expressions = Graph.calculator.getExpressions();
        const messageEl = document.getElementById('message');

        console.log("--- Starting Advanced Win Check ---");
        this._isChecking = true;
        let hasWonInThisCheck = false;

        try {
            for (const exp of expressions) {
                if (exp.id === 'target-def' || exp.id === 'target-plot' || exp.id.startsWith('win-check')) continue;
                
                let latex = exp.latex;
                if (!latex) continue;

                console.log("Checking Expression:", latex);

                // Rule: Must not contain 'f' or 'target'
                if (/f\(|f'|target/.test(latex.toLowerCase())) {
                    console.log("Skipping forbidden reference.");
                    continue;
                }

                // 1. SYMBOLIC COMPARISON (Simulating Mathematica API via mathjs)
                try {
                    const userExpr = this._latexToMathJS(latex);
                    const targetExpr = this._latexToMathJS(this.targetFunc);
                    
                    const userSimplified = math.simplify(userExpr).toString();
                    const targetSimplified = math.simplify(targetExpr).toString();
                    
                    console.log(`Symbolic Check: User[${userSimplified}] vs Target[${targetSimplified}]`);
                    
                    if (userSimplified === targetSimplified) {
                        this._onWin();
                        hasWonInThisCheck = true;
                        break;
                    }
                } catch (e) {
                    console.log("Symbolic check failed, falling back to high-precision numerical check.");
                }

                // 2. ROBUST NUMERICAL CHECK (Backup)
                const testPoints = [-8.42, -3.14, 0.56, 4.21, 9.13];
                let matchCount = 0;

                for (let x of testPoints) {
                    try {
                        const userVal = math.evaluate(this._latexToMathJS(latex), { x: x });
                        const targetVal = math.evaluate(this._latexToMathJS(this.targetFunc), { x: x });
                        
                        const diff = Math.abs(userVal - targetVal);
                        console.log(`x=${x}: User=${userVal}, Target=${targetVal}, Diff=${diff}`);

                        if (!isNaN(diff) && diff < 1e-8) {
                            matchCount++;
                        }
                    } catch (e) {}
                }

                if (matchCount === testPoints.length) {
                    this._onWin();
                    hasWonInThisCheck = true;
                    break; 
                }
            }

            // Show failure message if no expression matched
            if (!hasWonInThisCheck) {
                messageEl.textContent = '猜错咯，再试试吧！🤔';
                messageEl.className = 'message error show';
                
                // Auto hide failure message after 1 second
                setTimeout(() => {
                    if (!this.isWon) {
                        messageEl.classList.remove('show');
                    }
                }, 1000);
            }
        } finally {
            this._isChecking = false;
            console.log("--- Win Check Finished ---");
        }
    },

    _onWin: function() {
        this.isWon = true;
        const messageEl = document.getElementById('message');
        messageEl.textContent = '太棒了！你猜对了！🎉';
        messageEl.className = 'message success show';
        
        console.log("WINNER!");

        // Auto hide success message after 1 second
         setTimeout(() => {
             messageEl.classList.remove('show');
         }, 1000);
    },

    /**
     * Convert Desmos LaTeX to mathjs-compatible expression
     */
    _latexToMathJS: function(latex) {
        let converted = latex
            // 1. Basic Cleaning
            .replace(/\\left|\\right/g, '')
            .replace(/\\cdot/g, '*')
            .replace(/\\ /g, '') // Remove spaces
            
            // 2. Fractions: \frac{a}{b} -> (a)/(b)
            .replace(/\\frac\{(.+?)\}\{(.+?)\}/g, '($1)/($2)')
            
            // 3. Absolute Value: |x| -> abs(x)
            // We need to handle this carefully because | can be a separator
            .replace(/\|(.+?)\|/g, 'abs($1)')
            
            // 4. Square Roots: \sqrt{x} -> sqrt(x), \sqrt[n]{x} -> nthRoot(x, n)
            .replace(/\\sqrt\[(.+?)\]\{(.+?)\}/g, 'nthRoot($2, $1)')
            .replace(/\\sqrt\{(.+?)\}/g, 'sqrt($1)')
            
            // 5. Functions
            .replace(/\\sin/g, 'sin')
            .replace(/\\cos/g, 'cos')
            .replace(/\\tan/g, 'tan')
            .replace(/\\arctan/g, 'atan')
            .replace(/\\arcsin/g, 'asin')
            .replace(/\\arccos/g, 'acos')
            .replace(/\\ln/g, 'log')
            .replace(/\\log/g, 'log10')
            .replace(/\\exp/g, 'exp')
            
            // 6. Symbols and implicit multiplication
            .replace(/\{/g, '(')
            .replace(/\}/g, ')')
            .replace(/\\/g, '')
            .replace(/(\d)([a-zA-Z\(])/g, '$1*$2') // 2x -> 2*x, 2( -> 2*(
            .replace(/([a-zA-Z\)])(\d)/g, '$1*$2') // x2 -> x*2
            .replace(/\)\(/g, ')*('); // (x)(y) -> (x)*(y)

        console.log(`LaTeX Converted: [${latex}] -> [${converted}]`);
        return converted;
    },

    /**
     * Setup UI event listeners
     */
    setupEventListeners: function() {
        const nextLevelBtn = document.getElementById('next-level-btn');
        const shareBtn = document.getElementById('share-btn');
        const helpBtn = document.getElementById('help-btn');
        const createBtn = document.getElementById('create-level-btn');
        const confirmBtn = document.getElementById('confirm-guess-btn');
        
        const rulesModal = document.getElementById('rules-modal');
        const createModal = document.getElementById('create-modal');
        const closeBtns = document.querySelectorAll('.close');

        nextLevelBtn.addEventListener('click', () => this.loadRandomLevel());
        shareBtn.addEventListener('click', () => this.handleShare());
        helpBtn.addEventListener('click', () => {
            rulesModal.style.display = 'block';
            // Load and render rules.md
            fetch('rules.md')
                .then(response => response.text())
                .then(text => {
                    const contentEl = document.getElementById('markdown-rules-content');
                    if (contentEl && typeof marked !== 'undefined') {
                        contentEl.innerHTML = marked.parse(text);
                    }
                })
                .catch(err => {
                    console.error("Failed to load rules.md:", err);
                });
        });
        createBtn.addEventListener('click', () => {
            createModal.style.display = 'block';
            
            // Initialize mini-calculator for input if not already done
            if (!this.previewCalculator) {
                const elt = document.getElementById('target-calculator-input');
                if (elt && typeof Desmos !== 'undefined') {
                    this.previewCalculator = Desmos.GraphingCalculator(elt, {
                        expressions: true,
                        settingsMenu: false,
                        zoomButtons: true,
                        lockViewport: false,
                        autosize: true,
                        keypad: true,
                        expressionsTopbar: true,
                        backgroundColor: '#ffffff'
                    });
                    
                    this.previewCalculator.setBlank();
                }
            }
        });

        // Create level logic
        document.getElementById('save-level-btn').addEventListener('click', () => {
            if (this.previewCalculator) {
                const expressions = this.previewCalculator.getExpressions();
                const firstExp = expressions.find(e => e.latex);
                if (firstExp && firstExp.latex) {
                    const latex = firstExp.latex;
                    
                    // 1. Hide modal first
                    createModal.style.display = 'none';
                    
                    // 2. Load level with a longer delay and explicit isRawLatex flag
                    setTimeout(() => {
                        this.loadLevel({ targetFuncStr: latex }, true);
                        this.previewCalculator.setBlank();
                    }, 200);
                }
            }
        });
        confirmBtn.addEventListener('click', () => this.confirmGuess());

        closeBtns.forEach(btn => {
            btn.onclick = () => {
                rulesModal.style.display = 'none';
                createModal.style.display = 'none';
            };
        });

        window.onclick = (event) => {
            if (event.target == rulesModal || event.target == createModal) {
                rulesModal.style.display = 'none';
                createModal.style.display = 'none';
            }
        };
    },

    /**
     * Handle level sharing
     */
    handleShare: function() {
        const level = { targetFuncStr: this.targetFunc };
        const url = Utils.updateURLWithLevel(level);
        
        navigator.clipboard.writeText(url).then(() => {
            alert('关卡链接已复制到剪贴板！');
        }).catch(err => {
            alert('分享链接: ' + url);
        });
    },

    /**
     * Setup Desmos MathField for level creation
     */
    setupMathField: function() {
        // We now use MathLive (web component <math-field>)
        // It initializes itself automatically.
    }
};

window.onload = () => Game.init();
