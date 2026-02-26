/**
 * UI 管理器模块
 * 负责 DOM 操作、事件监听、弹窗控制
 */

const UIManager = {
    timer: null,

    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        // 按钮点击事件
        const btnCheck = document.getElementById('btn-check');
        if (btnCheck) {
            btnCheck.addEventListener('click', () => {
                GameLogic.checkGuess();
            });
        }

        const btnRandom = document.getElementById('btn-random');
        if (btnRandom) {
            btnRandom.addEventListener('click', () => {
                // 显示难度选择弹窗
                this.showModal('modal-difficulty');
            });
        }

        // 难度选择按钮
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = e.target.getAttribute('data-level');
                MathEngine.setDifficulty(level);
                GameLogic.startRandomLevel();
                this.hideModal('modal-difficulty');
            });
        });

        const btnCreate = document.getElementById('btn-create');
        if (btnCreate) {
            btnCreate.addEventListener('click', () => {
                // 新的创建逻辑：读取侧边栏第一行
                const expr = GraphManager.getFirstExpression();
                if (expr && MathEngine.isValid(expr)) {
                    if (confirm(`是否使用表达式 "${expr}" 创建新关卡？`)) {
                        GameLogic.startLevel(expr);
                    }
                } else {
                    alert("请先在 Desmos 面板的第一行输入一个有效的函数表达式，然后点击此按钮。");
                }
            });
        }

        const btnShare = document.getElementById('btn-share');
        if (btnShare) {
            btnShare.addEventListener('click', () => {
                const link = GameLogic.getShareLink();
                Utils.copyToClipboard(link);
                this.showMessage("链接已复制，去分享吧！", "success");
            });
        }

        const btnRules = document.getElementById('btn-rules');
        if (btnRules) {
            btnRules.addEventListener('click', () => {
                this.showModal('modal-rules');
                this.loadRules();
            });
        }

        // 弹窗关闭
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.hideModal(modal.id);
            });
        });

        // 消息关闭
        const btnCloseMsg = document.getElementById('btn-close-msg');
        if (btnCloseMsg) {
            btnCloseMsg.addEventListener('click', () => {
                document.getElementById('message-area').classList.add('hidden');
            });
        }
    },

    loadRules: function() {
        const container = document.getElementById('rules-content');
        if (!container) return;

        // 如果已经加载过，就不再加载
        if (container.getAttribute('data-loaded') === 'true') return;

        fetch('rules.md')
            .then(response => response.text())
            .then(text => {
                if (window.marked) {
                    container.innerHTML = marked.parse(text);
                    container.setAttribute('data-loaded', 'true');
                    // Render Math using KaTeX
                    if (window.renderMathInElement) {
                        renderMathInElement(container, {
                            delimiters: [
                                {left: '$$', right: '$$', display: true},
                                {left: '$', right: '$', display: false}
                            ]
                        });
                    }
                } else {
                    container.textContent = text;
                }
            })
            .catch(err => {
                console.error("Failed to load rules:", err);
                container.textContent = "加载规则失败，请检查网络或文件。";
            });
    },

    showModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            // Trigger reflow to enable transition
            void modal.offsetWidth; 
            modal.classList.add('visible');
        }
    },

    hideModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300); // 300ms transition time
        }
    },

    /**
     * 显示消息提示
     * @param {string} text 消息文本
     * @param {string} type 'success' | 'error' | 'info'
     */
    showMessage: function(text, type = 'info') {
        const msgArea = document.getElementById('message-area');
        const msgText = document.getElementById('message-text');
        
        if (!msgArea || !msgText) return;

        msgText.textContent = text;
        msgArea.classList.remove('hidden');
        
        // 样式处理
        msgArea.style.backgroundColor = type === 'success' ? '#4CAF50' : (type === 'error' ? '#f44336' : '#2196F3');
        
        // 自动关闭
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            msgArea.classList.add('hidden');
        }, 3000);
    },

    /**
     * 隐藏当前消息提示
     */
    hideMessage: function() {
        const msgArea = document.getElementById('message-area');
        if (msgArea) {
            msgArea.classList.add('hidden');
        }
        if (this.timer) clearTimeout(this.timer);
    }
};

// 暴露给全局
window.UIManager = UIManager;
