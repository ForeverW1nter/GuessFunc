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
        // Auto-detect LaTeX if not explicitly specified
        const detectLatex = isRawLatex === true || (typeof this.targetFunc === 'string' && (this.targetFunc.includes('\\') || this.targetFunc.includes('{'))); 
        Graph.init(this.targetFunc, () => this.handleDesmosUpdate(), detectLatex);
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
    confirmGuess: async function() {
        if (this.isWon || this._isChecking) return;

        const expressions = Graph.calculator.getExpressions();
        const messageEl = document.getElementById('message');

        this._isChecking = true;
        let hasWonInThisCheck = false;
        let candidateCount = 0;

        try {
            for (const exp of expressions) {
                if (!exp) continue;
                // Skip internal/hidden helper expressions
                if (exp.id === 'target-def' || exp.id === 'target-plot' || exp.id.startsWith('win-check') || exp.id.startsWith('__')) continue;
                
                let latex = exp.latex;
                if (!latex || !latex.trim()) continue;

                // Strip common prefixes like "y=", "y_1=", "f(x)=" or "g(x)="
                latex = latex.replace(/^(y(?:_\d+)?|f\s*\(x\)|g\s*\(x\))\s*=/i, '');

                // Skip pure equations like "t=10" 或 "x=2"
                if (/=/.test(latex)) {
                    console.log('[DesmosCheck] skip equation input', latex);
                    continue;
                }

                // Rule: Must not contain 'f' or 'target'
                // Robust detection: ban f as a function/symbol but allow \frac, floor, etc.
                const lower = latex.toLowerCase();
                const containsFToken = /(?:^|[^\\a-z])f(?:\s*\(|\s*\\left\s*\(|'+|\^|\b)/.test(lower);
                if (containsFToken || lower.includes('target')) {
                    continue;
                }

                candidateCount++;
                console.log('[DesmosCheck] checking expression', latex);
                const detail = await Graph.checkEquality(latex);
                console.log('[DesmosCheck] check finished', detail);
                if (detail.isMatch) {
                    this._onWin();
                    hasWonInThisCheck = true;
                    break;
                }
            }

            // If no valid candidates, ensure we do not show success
            if (!hasWonInThisCheck && candidateCount === 0) {
                console.log('[DesmosCheck] no valid user expressions to check');
            }

            if (!hasWonInThisCheck) {
                messageEl.textContent = '猜错咯，再试试吧！🤔';
                messageEl.className = 'message error show';
                
                setTimeout(() => {
                    if (!this.isWon) {
                        messageEl.classList.remove('show');
                    }
                }, 1000);
            }
        } finally {
            this._isChecking = false;
        }
    },

    _onWin: function() {
        this.isWon = true;
        const messageEl = document.getElementById('message');
        messageEl.textContent = '太棒了！你猜对了！🎉';
        messageEl.className = 'message success show';
        
        // Auto hide success message after 1 second
         setTimeout(() => {
             messageEl.classList.remove('show');
         }, 1000);
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
            // Load and render rules.md using relative path
            fetch('./rules.md')
                .then(response => {
                    if (!response.ok) throw new Error("File not found");
                    return response.text();
                })
                .then(text => {
                    const contentEl = document.getElementById('markdown-rules-content');
                    if (contentEl && typeof marked !== 'undefined') {
                        contentEl.innerHTML = marked.parse(text);
                    }
                })
                .catch(err => {
                    console.error("Failed to load rules.md:", err);
                    document.getElementById('markdown-rules-content').innerHTML = "<p style='color:red;'>加载规则文档失败，请检查文件是否存在。</p>";
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
                    let latex = firstExp.latex;
                    
                    // Strip common prefixes that might break the f(x) = ... definition
                    // e.g., "y=2x" -> "2x", "y_1=3" -> "3", "f(x)=sin(x)" -> "sin(x)"
                    latex = latex.replace(/^(y(?:_\d+)?|f\s*\(x\))\s*=/i, '');
                    
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
