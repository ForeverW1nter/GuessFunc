/**
 * Main Game Logic for Guess the Function
 */

const Game = {
    targetFunc: null,
    xMin: -5,
    xMax: 5,
    levelCount: 0,
    isWon: false,

    /**
     * Initialize the game
     */
    init: function() {
        this.setupEventListeners();
        
        // 1. Check for shared level in URL
        const sharedLevel = Utils.getLevelFromURL();
        if (sharedLevel) {
            this.levelCount = 1;
            this.loadLevel(sharedLevel);
        } else {
            // 2. Otherwise generate a random level
            this.loadRandomLevel();
        }
    },

    /**
     * Load a level from a level object
     * @param {Object} level - {targetFuncStr, xMin, xMax}
     */
    loadLevel: function(level) {
        this.targetFunc = level.targetFuncStr;
        this.xMin = level.xMin;
        this.xMax = level.xMax;
        this.isWon = false;

        // Reset UI
        document.getElementById('level-display').textContent = `第 ${this.levelCount} 关`;
        document.getElementById('user-input').value = '';
        document.getElementById('message').textContent = '';
        document.getElementById('message').className = 'message';

        // Initialize Plot (only one render)
        Graph.init(this.targetFunc, { xMin: this.xMin, xMax: this.xMax });
    },

    /**
     * Load a random level
     */
    loadRandomLevel: function() {
        this.levelCount++;
        const level = Utils.generateRandomLevel();
        this.loadLevel(level);
    },

    /**
     * Setup UI event listeners
     */
    setupEventListeners: function() {
        const userInput = document.getElementById('user-input');
        const guessBtn = document.getElementById('guess-btn');
        const nextLevelBtn = document.getElementById('next-level-btn');
        const shareBtn = document.getElementById('share-btn');
        const helpBtn = document.getElementById('help-btn');
        const createBtn = document.getElementById('create-level-btn');
        
        // Handle guess submission
        guessBtn.addEventListener('click', () => this.handleGuess());
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleGuess();
        });

        // Handle buttons
        nextLevelBtn.addEventListener('click', () => this.loadRandomLevel());
        shareBtn.addEventListener('click', () => this.handleShare());
        
        // Modal logic
        const rulesModal = document.getElementById('rules-modal');
        const createModal = document.getElementById('create-modal');
        const closeBtns = document.querySelectorAll('.close');

        helpBtn.addEventListener('click', () => rulesModal.style.display = 'block');
        createBtn.addEventListener('click', () => createModal.style.display = 'block');

        closeBtns.forEach(btn => {
            btn.onclick = function() {
                rulesModal.style.display = 'none';
                createModal.style.display = 'none';
            }
        });

        window.onclick = function(event) {
            if (event.target == rulesModal || event.target == createModal) {
                rulesModal.style.display = 'none';
                createModal.style.display = 'none';
            }
        };

        // Create level logic
        document.getElementById('save-level-btn').addEventListener('click', () => {
            const func = document.getElementById('target-func-input').value;
            const min = parseFloat(document.getElementById('x-min').value);
            const max = parseFloat(document.getElementById('x-max').value);
            
            if (func) {
                this.loadLevel({ targetFuncStr: func, xMin: min, xMax: max });
                createModal.style.display = 'none';
            }
        });
    },

    /**
     * Handle a user's guess
     */
    handleGuess: function() {
        if (this.isWon) return;

        const input = document.getElementById('user-input').value.trim();
        const messageEl = document.getElementById('message');

        if (!input) return;

        try {
            // 1. Pre-validation and cleaning
            // Substitute f and derivatives in input for plotting
            const substitutedNode = MathEngine.evaluateSymbolically(input, this.targetFunc);
            const substitutedStr = substitutedNode.toString();

            // 2. Add to plot
            Graph.addUserFunction(input, substitutedStr);

            // 3. Check for algebraic equivalence
            // New rule: if input contains 'f', it doesn't count as a win
            const hasF = /\bf\b|\bf\(/.test(input);
            
            if (!hasF && MathEngine.isEquivalent(substitutedStr, this.targetFunc)) {
                this.isWon = true;
                messageEl.textContent = '太棒了！你猜对了！🎉';
                messageEl.className = 'message success';
                
                // Redraw plot
                Graph.render();
            } else if (hasF && MathEngine.isEquivalent(substitutedStr, this.targetFunc)) {
                messageEl.textContent = '虽然结果等价，但不能直接使用 f(x) 哦！';
                messageEl.className = 'message error';
            } else {
                messageEl.textContent = '还没猜对哦，再试一次吧！';
                messageEl.className = 'message error';
            }
        } catch (e) {
            console.error("Guess Handling Error:", e);
            // Display the specific error message from MathEngine or a generic one
            messageEl.textContent = e.message || '输入格式有误，请检查数学表达式。';
            messageEl.className = 'message error';
        }
    },

    /**
     * Handle level sharing
     */
    handleShare: function() {
        const level = {
            targetFuncStr: this.targetFunc,
            xMin: this.xMin,
            xMax: this.xMax
        };
        const url = Utils.updateURLWithLevel(level);
        
        // Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            alert('关卡链接已复制到剪贴板，快分享给朋友吧！');
        }).catch(err => {
            console.error('Copy failed:', err);
            alert('分享链接: ' + url);
        });
    }
};

// Start the game when the window loads
window.onload = () => Game.init();
