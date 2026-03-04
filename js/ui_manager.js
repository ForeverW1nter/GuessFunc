
/**
 * UI 管理器模块
 * 负责 DOM 操作、事件监听、弹窗控制
 */

const UIManager = {
    timer: null,
    modalCallbacks: {},

    init: function() {
        this.bindEvents();
        this.initTheme();
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

                // Check if the first chapter (first region) story has been seen
                // Assuming the first region is the starting point
                if (window.REGIONS && window.REGIONS.length > 0) {
                    const firstRegion = window.REGIONS[0];
                    if ((firstRegion.description || firstRegion.descriptionPath) && !StorageManager.isChapterSeen(firstRegion.id)) {
                        StorageManager.markChapterSeen(firstRegion.id);
                        
                        // Close levels modal temporarily or overlay?
                        // Better to show story on top or switch to it.
                        // Let's close levels modal and show story.
                        this.hideModal('modal-levels');
                        
                        setTimeout(() => {
                            this.showStory(firstRegion);
                            // After story closes, re-open levels modal
                            this.modalCallbacks['modal-story'] = () => {
                                this.showModal('modal-levels');
                            };
                        }, 300);
                    }
                }
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
                GameLogic.startRandomLevel(level);
                this.setMode('random');
                this.hideModal('modal-difficulty');
            });
        });

        const btnCreate = document.getElementById('btn-create');
        if (btnCreate) {
            btnCreate.addEventListener('click', () => {
                // 新的创建逻辑：读取侧边栏第一行及相关参数
                const userGuessData = GraphManager.getUserGuessData();
                
                if (userGuessData && MathEngine.isValid(userGuessData.latex)) {
                    const msg = userGuessData.params && Object.keys(userGuessData.params).length > 0
                        ? `是否使用表达式 "${userGuessData.latex}" 及参数 (${Object.keys(userGuessData.params).join(', ')}) 创建新关卡？`
                        : `是否使用表达式 "${userGuessData.latex}" 创建新关卡？`;

                    if (confirm(msg)) {
                        GameLogic.startLevel({
                            t: userGuessData.latex,
                            p: userGuessData.params
                        });
                        // 自定义关卡视为随机模式的一种（非预设）
                        this.setMode('random');
                        this.showMessage("关卡创建成功！点击“分享”获取链接。", "success");
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
                const title = document.getElementById('rules-title');
                if (title) title.textContent = "规则说明";
                this.showModal('modal-rules');
                this.loadRules();
                this.hideModal('modal-options'); // 关闭选项菜单
            });
        }

        const btnAbout = document.getElementById('btn-about');
        if (btnAbout) {
            btnAbout.addEventListener('click', () => {
                const title = document.getElementById('rules-title');
                if (title) title.textContent = "关于游戏";
                this.showModal('modal-rules'); // Reuse rules modal
                this.loadAbout();
                this.hideModal('modal-options');
            });
        }

        const btnChangelog = document.getElementById('btn-changelog');
        if (btnChangelog) {
            btnChangelog.addEventListener('click', () => {
                const title = document.getElementById('rules-title');
                if (title) title.textContent = "更新日志";
                this.showModal('modal-rules'); // Reuse rules modal for simplicity
                this.loadChangelog();
                this.hideModal('modal-options');
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

        // 主题切换
        const btnThemeToggle = document.getElementById('btn-theme-toggle');
        if (btnThemeToggle) {
            btnThemeToggle.addEventListener('click', () => {
                this.toggleTheme();
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

    initTheme: function() {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('guessfunc_theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    },

    toggleTheme: function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('guessfunc_theme', newTheme);
        
        // Update Desmos if possible (Desmos usually handles its own theme, but we can try to invert or adjust)
        // For now, we just handle our UI.
    },

    loadRules: function() {
        const container = document.getElementById('rules-content');
        if (!container) return;

        fetch('rules.md')
            .then(response => response.text())
            .then(text => {
                this.renderMarkdown(container, text);
            })
            .catch(err => {
                console.error("Failed to load rules:", err);
                container.textContent = "加载规则失败，请检查网络或文件。";
            });
    },

    loadAbout: function() {
        const container = document.getElementById('rules-content');
        if (!container) return;

        fetch('about.md')
            .then(response => response.text())
            .then(text => {
                this.renderMarkdown(container, text);
            })
            .catch(err => {
                console.error("Failed to load about info:", err);
                container.textContent = "加载关于信息失败。";
            });
    },

    loadChangelog: function() {
        const container = document.getElementById('rules-content');
        if (!container) return;

        fetch('changelog.md')
            .then(response => response.text())
            .then(text => {
                this.renderMarkdown(container, text);
            })
            .catch(err => {
                console.error("Failed to load changelog:", err);
                container.textContent = "加载更新日志失败。";
            });
    },
    
    /**
     * 渲染 Markdown 内容
     */
    renderMarkdown: function(container, text) {
        if (window.marked) {
            // Protect math blocks from markdown parsing
            // We replace $...$ and $$...$$ with placeholders
            const mathBlocks = [];
            const protectedText = text.replace(/(\$\$[\s\S]*?\$\$)|(\$[^$\n]*?\$)/g, (match) => {
                mathBlocks.push(match);
                return `MATHBLOCK${mathBlocks.length - 1}BLOCKMATH`;
            });
            
            // Parse markdown
            let html = marked.parse(protectedText);
            
            // Restore math blocks
            html = html.replace(/MATHBLOCK(\d+)BLOCKMATH/g, (match, index) => {
                return mathBlocks[parseInt(index)];
            });
            
            container.innerHTML = html;
            
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

        // 支持区域划分
        const regions = window.REGIONS || [{
            id: 'default',
            title: '所有关卡',
            unlock: null,
            levels: window.LEVELS.map(l => l.id)
        }];

        // 清除原有的 grid class，因为我们现在包含多个 grid
        container.className = 'levels-container';

        regions.forEach(region => {
            // 检查区域解锁状态
            const regionUnlockStatus = StorageManager.checkLevelUnlock ? StorageManager.checkLevelUnlock(region.unlock) : { unlocked: true };
            const isRegionLocked = !regionUnlockStatus.unlocked;

            // 创建区域标题
            const regionHeader = document.createElement('div');
            regionHeader.className = 'level-region-header';
            regionHeader.style.marginTop = '20px';
            regionHeader.style.marginBottom = '10px';
            regionHeader.style.paddingBottom = '5px';
            regionHeader.style.borderBottom = '2px solid #eee';
            regionHeader.style.display = 'flex';
            regionHeader.style.justifyContent = 'space-between';
            regionHeader.style.alignItems = 'center';
            
            // 渲染标题
            const titleDiv = document.createElement('div');
            titleDiv.innerHTML = `<h3>${region.title} ${isRegionLocked ? '🔒' : ''}</h3>`;
            regionHeader.appendChild(titleDiv);
            
            // 渲染剧情按钮（如果有描述且解锁）
            if ((region.description || region.descriptionPath) && !isRegionLocked) {
                const storyBtn = document.createElement('button');
                storyBtn.innerHTML = '剧情'; // 简化文字
                storyBtn.className = 'story-btn primary-btn'; 
                storyBtn.style.padding = '4px 10px'; // 调整内边距
                storyBtn.style.fontSize = '0.85rem'; // 稍微缩小字体
                storyBtn.style.marginLeft = 'auto'; 
                
                // 移动端特殊处理将在 CSS 中通过类名控制，这里只设置内联基础样式
                // 或者我们可以添加一个特定的类名用于移动端样式覆盖
                storyBtn.classList.add('mobile-compact-btn');

                storyBtn.onclick = (e) => {
                    e.stopPropagation(); // 防止触发标题点击
                    this.showStory(region);
                };
                regionHeader.appendChild(storyBtn);
            }
            
            if (isRegionLocked) {
                regionHeader.title = `区域未解锁：${regionUnlockStatus.reason}`;
                regionHeader.style.cursor = 'not-allowed';
                regionHeader.onclick = () => alert(`区域未解锁！\n条件：${regionUnlockStatus.reason}`);
            }
            container.appendChild(regionHeader);

            // 创建关卡容器
            const levelsContainer = document.createElement('div');
            levelsContainer.className = 'levels-grid';
            if (isRegionLocked) {
                levelsContainer.style.display = 'none'; // 隐藏未解锁区域的关卡
                const lockedMsg = document.createElement('p');
                lockedMsg.textContent = `该区域尚未解锁，${regionUnlockStatus.reason}`;
                lockedMsg.style.color = '#999';
                container.appendChild(lockedMsg);
            } else {
                container.appendChild(levelsContainer);
            }

            if (isRegionLocked) return;

            // 渲染该区域内的关卡
            region.levels.forEach(levelId => {
                // Find level data
                const levelData = window.LEVELS.find(l => l.id === levelId);
                const levelIndex = window.LEVELS.findIndex(l => l.id === levelId);
                
                if (!levelData) return;

                const btn = document.createElement('button');
                const isCompleted = StorageManager.isLevelCompleted(levelId);
                
                // 检查解锁状态
                const unlockStatus = StorageManager.checkLevelUnlock ? StorageManager.checkLevelUnlock(levelData.unlock) : { unlocked: true };
                const isLocked = !unlockStatus.unlocked;

                let className = 'level-card';
                if (isCompleted) className += ' completed';
                if (isLocked) className += ' locked';
                
                btn.className = className;
                
                let statusIcon = '';
                if (isLocked) statusIcon = '🔒';
                else if (isCompleted) statusIcon = '✅';

                btn.innerHTML = `
                    <h3>${levelData.title} ${statusIcon}</h3>
                    <p>${isLocked ? '点击查看解锁条件' : '点击开始挑战'}</p>
                `;
                
                btn.addEventListener('click', () => {
                    if (isLocked) {
                        alert(`关卡未解锁！\n条件：${unlockStatus.reason || '未知条件'}`);
                        return;
                    }
                    
                    const startAction = () => {
                        GameLogic.startPresetLevel(levelIndex);
                        this.setMode('preset');
                        // Ensure levels modal is closed
                        const levelsModal = document.getElementById('modal-levels');
                        if (levelsModal && levelsModal.classList.contains('visible')) {
                            this.hideModal('modal-levels');
                        }
                    };

                    // Check if chapter story has been seen
                    if ((region.description || region.descriptionPath) && !StorageManager.isChapterSeen(region.id)) {
                        StorageManager.markChapterSeen(region.id);
                        
                        // Close levels modal first
                        this.hideModal('modal-levels');
                        
                        // Show story after a short delay to allow transition
                        setTimeout(() => {
                            this.showStory(region);
                            // Register callback to start level after story is closed
                            this.modalCallbacks['modal-story'] = startAction;
                        }, 300);
                    } else {
                        startAction();
                    }
                });
                levelsContainer.appendChild(btn);
            });
        });
    },
    
    /**
     * 显示关卡指引
     */
    showLevelInstruction: function(levelData) {
        if (!levelData.descriptionPath && !levelData.description) return;
        
        const container = document.getElementById('level-instruction-content');
        if (container) {
            // Show modal immediately with loading state
            this.showModal('modal-level-instruction');
            container.innerHTML = '<p>加载中...</p>';

            if (levelData.descriptionPath) {
                fetch(levelData.descriptionPath)
                    .then(res => res.text())
                    .then(text => {
                        this.renderMarkdown(container, text);
                    })
                    .catch(err => {
                        console.error("Failed to load level description:", err);
                        container.innerHTML = "<p>加载描述失败。</p>";
                    });
            } else {
                this.renderMarkdown(container, levelData.description);
            }
        }
    },

    /**
     * 显示剧情
     */
    showStory: function(regionData) {
        if (!regionData.descriptionPath && !regionData.description) return;
        
        const container = document.getElementById('story-content');
        if (container) {
            this.showModal('modal-story');
            container.innerHTML = '<p>加载中...</p>';
            
            if (regionData.descriptionPath) {
                fetch(regionData.descriptionPath)
                    .then(res => res.text())
                    .then(text => {
                        this.renderMarkdown(container, text);
                    })
                    .catch(err => {
                         console.error("Failed to load story:", err);
                         container.innerHTML = "<p>加载剧情失败。</p>";
                    });
            } else {
                this.renderMarkdown(container, regionData.description);
            }
        }
    },
    
    updateUI: function() {
        // Toggle buttons based on mode
        const mode = window.GameLogic.state.mode;
        
        const btnNext = document.getElementById('btn-next');
        const btnReturn = document.getElementById('btn-return');
        const btnCheck = document.getElementById('btn-check');
        const btnPreset = document.getElementById('btn-preset');
        const btnRandom = document.getElementById('btn-random');
        const btnCreate = document.getElementById('btn-create');
        
        if (mode === 'preset') {
            if (btnReturn) {
                btnReturn.style.display = 'inline-block';
                btnReturn.classList.remove('hidden');
            }
            if (btnPreset) btnPreset.style.display = 'none';
            if (btnRandom) btnRandom.style.display = 'none';
            if (btnCreate) btnCreate.style.display = 'none';
        } else {
            if (btnReturn) {
                btnReturn.style.display = 'none';
                btnReturn.classList.add('hidden');
            }
            if (btnPreset) btnPreset.style.display = 'inline-block';
            if (btnRandom) btnRandom.style.display = 'inline-block';
            if (btnCreate) btnCreate.style.display = 'inline-block';
            if (btnNext) {
                btnNext.style.display = 'none';
                btnNext.classList.add('hidden');
            }
        }
    },

    setMode: function(mode) {
        if (window.GameLogic) {
            window.GameLogic.state.mode = mode;
        }
        this.updateUI();
    },
    
    /**
     * 切换下一关按钮显示状态
     */
    toggleNextButton: function(show, text = "下一关") {
        const btnNext = document.getElementById('btn-next');
        if (!btnNext) return;
        
        if (show) {
            btnNext.style.display = 'inline-block';
            btnNext.classList.remove('hidden');
            btnNext.textContent = text;
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
                // Execute callback if any
                if (this.modalCallbacks[modalId]) {
                    const callback = this.modalCallbacks[modalId];
                    delete this.modalCallbacks[modalId];
                    callback();
                }
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
