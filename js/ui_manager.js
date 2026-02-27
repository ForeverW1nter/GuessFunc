
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
                this.showModal('modal-difficulty');
            });
        }

        // 退出闯关按钮
        const btnReturn = document.getElementById('btn-return');
        if (btnReturn) {
            btnReturn.addEventListener('click', () => {
                if(confirm("确定要退出闯关模式，开始随机挑战吗？")) {
                    GameLogic.startRandomLevel();
                    this.setMode('random');
                }
            });
        }
        
        // 预设关卡按钮
        const btnPreset = document.getElementById('btn-preset');
        if (btnPreset) {
            btnPreset.addEventListener('click', () => {
                this.renderLevelList();
                this.showModal('modal-levels');
            });
        }
        
        // 下一关按钮
        const btnNext = document.getElementById('btn-next');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                GameLogic.nextLevel();
            });
        }

        // 难度选择按钮
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = e.target.getAttribute('data-level');
                MathEngine.setDifficulty(level);
                GameLogic.startRandomLevel();
                this.setMode('random');
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
                        // 自定义关卡视为随机模式的一种（非预设）
                        this.setMode('random');
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
                this.hideModal('modal-options'); // 关闭选项菜单
            });
        }
        
        // 选项按钮
        const btnOptions = document.getElementById('btn-options');
        if (btnOptions) {
            btnOptions.addEventListener('click', () => {
                this.showModal('modal-options');
            });
        }
        
        // 导出存档
        const btnExportSave = document.getElementById('btn-export-save');
        if (btnExportSave) {
            btnExportSave.addEventListener('click', () => {
                const save = StorageManager.exportSave();
                Utils.copyToClipboard(save);
                // 仅显示一次提示
                this.showMessage("存档已复制到剪贴板！", "success");
            });
        }
        
        // 导入存档
        const btnImportSave = document.getElementById('btn-import-save');
        if (btnImportSave) {
            btnImportSave.addEventListener('click', () => {
                const save = prompt("请输入存档代码：");
                if (save) {
                    if (StorageManager.importSave(save)) {
                        alert("存档导入成功！");
                        this.renderLevelList(); // 刷新
                    } else {
                        alert("存档无效！");
                    }
                }
            });
        }
        
        // 清空存档
        const btnClearSave = document.getElementById('btn-clear-save');
        if (btnClearSave) {
            btnClearSave.addEventListener('click', () => {
                if (confirm("确定要清空所有存档进度吗？此操作不可撤销！")) {
                    StorageManager.clearSave();
                    this.renderLevelList(); // 刷新
                    alert("存档已清空。");
                    this.hideModal('modal-options');
                }
            });
        }
        
        // 开始关卡按钮 (指引弹窗中)
        const btnStartLevel = document.getElementById('btn-start-level');
        if (btnStartLevel) {
            btnStartLevel.addEventListener('click', () => {
                this.hideModal('modal-level-instruction');
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
                this.renderMarkdown(container, text);
                container.setAttribute('data-loaded', 'true');
            })
            .catch(err => {
                console.error("Failed to load rules:", err);
                container.textContent = "加载规则失败，请检查网络或文件。";
            });
    },
    
    /**
     * 渲染 Markdown 内容
     */
    renderMarkdown: function(container, text) {
        if (window.marked) {
            container.innerHTML = marked.parse(text);
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
    },
    
    /**
     * 渲染关卡列表
     */
    renderLevelList: function() {
        const container = document.getElementById('levels-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!window.LEVELS) {
            container.innerHTML = '<p>暂无预设关卡。</p>';
            return;
        }
        
        window.LEVELS.forEach((level, index) => {
            const btn = document.createElement('button');
            const isCompleted = StorageManager.isLevelCompleted(level.id);
            btn.className = `level-card ${isCompleted ? 'completed' : ''}`;
            
            // 不再显示 target
            btn.innerHTML = `
                <h3>${level.title} ${isCompleted ? '✅' : ''}</h3>
                <p>点击开始挑战</p>
            `;
            btn.addEventListener('click', () => {
                GameLogic.startPresetLevel(index);
                this.setMode('preset');
                this.hideModal('modal-levels');
            });
            container.appendChild(btn);
        });
    },
    
    /**
     * 显示关卡指引
     */
    showLevelInstruction: function(levelData) {
        if (!levelData.description) return;
        
        const container = document.getElementById('level-instruction-content');
        if (container) {
            this.renderMarkdown(container, levelData.description);
            this.showModal('modal-level-instruction');
        }
    },
    
    /**
     * 设置 UI 模式
     * @param {string} mode 'random' | 'preset'
     */
    setMode: function(mode) {
        const btnRandom = document.getElementById('btn-random');
        const btnNext = document.getElementById('btn-next');
        const btnReturn = document.getElementById('btn-return');
        const btnCreate = document.getElementById('btn-create');
        const btnShare = document.getElementById('btn-share');
        const btnOptions = document.getElementById('btn-options');
        
        if (mode === 'preset') {
            if (btnRandom) btnRandom.style.display = 'none';
            if (btnCreate) btnCreate.style.display = 'none';
            if (btnShare) btnShare.style.display = 'none';
            // 保持选项按钮可见
            if (btnOptions) btnOptions.style.display = 'inline-block';
            
            if (btnReturn) {
                btnReturn.style.display = 'inline-block';
                btnReturn.classList.remove('hidden');
            }
        } else {
            if (btnRandom) btnRandom.style.display = 'inline-block';
            if (btnCreate) btnCreate.style.display = 'inline-block';
            if (btnShare) btnShare.style.display = 'inline-block';
            if (btnOptions) btnOptions.style.display = 'inline-block';
            
            if (btnNext) {
                btnNext.style.display = 'none';
                btnNext.classList.add('hidden');
            }
            if (btnReturn) {
                btnReturn.style.display = 'none';
                btnReturn.classList.add('hidden');
            }
        }
    },
    
    /**
     * 切换下一关按钮显示状态
     */
    toggleNextButton: function(show) {
        const btnNext = document.getElementById('btn-next');
        if (!btnNext) return;
        
        if (show) {
            btnNext.style.display = 'inline-block';
            btnNext.classList.remove('hidden');
        } else {
            btnNext.style.display = 'none';
            btnNext.classList.add('hidden');
        }
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
