
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
        this.initFontSize();
    },

    initFontSize: async function() {
        let size = localStorage.getItem('guessfunc_story_font_size');
        if (!size) {
            size = 100;
        } else {
            size = parseInt(size);
        }
        this.updateFontSize(size);

        // 初始化字体样式
        let fontFamily = localStorage.getItem('guessfunc_story_font_family');
        
        if (fontFamily) {
            this.setCustomSelectValue('font-family-custom-select', fontFamily);
            
            if (fontFamily === 'custom') {
                const customFontData = await this.loadCustomFontFromDB();
                if (customFontData) {
                    this.applyCustomFont(customFontData);
                } else {
                    // 如果选了自定义但没数据，退回默认
                    this.updateFontFamily('default');
                    this.setCustomSelectValue('font-family-custom-select', 'default');
                }
            } else {
                this.updateFontFamily(fontFamily);
            }
        }
    },

    setCustomSelectValue: function(wrapperId, value) {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;
        const options = wrapper.querySelectorAll('.custom-option');
        const display = wrapper.querySelector('.custom-select-display');
        options.forEach(opt => {
            if (opt.getAttribute('data-value') === value) {
                if (display) display.textContent = opt.textContent;
            }
        });
    },

    updateFontSize: function(size) {
        if (size < 50) size = 50;
        if (size > 200) size = 200;
        
        localStorage.setItem('guessfunc_story_font_size', size);
        
        const display = document.getElementById('font-size-display');
        if (display) {
            display.textContent = size + '%';
        }

        const slider = document.getElementById('font-size-slider');
        if (slider) {
            slider.value = size;
        }
        
        // 应用到具体的 Markdown 容器
        document.documentElement.style.setProperty('--story-font-scale', size / 100);
    },

    updateFontFamily: function(family) {
        localStorage.setItem('guessfunc_story_font_family', family);
        
        if (family === 'custom') {
            // 如果选择自定义，但还没上传，可以先显示上传区域，暂不改变当前字体
            const uploadContainer = document.getElementById('custom-font-upload-container');
            if (uploadContainer) {
                uploadContainer.classList.remove('hidden');
            }
        } else {
            // 清除自定义字体
            const styleEl = document.getElementById('guessfunc-custom-font');
            if (styleEl) styleEl.remove();
            
            let cssFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
            if (family === 'serif') {
                cssFamily = 'Georgia, "Times New Roman", Times, serif';
            } else if (family === 'sans-serif') {
                cssFamily = 'Arial, Helvetica, sans-serif';
            } else if (family === 'monospace') {
                cssFamily = '"Courier New", Courier, monospace';
            }
            
            document.documentElement.style.setProperty('--story-font-family', cssFamily);
            
            // 更新 UI
            const uploadContainer = document.getElementById('custom-font-upload-container');
            if (uploadContainer) {
                uploadContainer.classList.add('hidden');
            }
        }
    },

    applyCustomFont: function(base64Data) {
        let styleId = 'guessfunc-custom-font';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        
        // 强制浏览器重新解析字体（通过改变 font-family 名称的小技巧）
        const randomFontName = 'GuessFuncCustomFont_' + Date.now();
        
        styleEl.innerHTML = `
            @font-face {
                font-family: '${randomFontName}';
                src: url('${base64Data}');
            }
        `;
        document.documentElement.style.setProperty('--story-font-family', `'${randomFontName}', sans-serif`);
        
        const uploadContainer = document.getElementById('custom-font-upload-container');
        if (uploadContainer) {
            uploadContainer.classList.remove('hidden');
        }
    },

    // IndexedDB 用于存储字体文件（localStorage 有大小限制，字体文件通常会超出）
    saveCustomFontToDB: function(base64Data, fileName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('GuessFuncDB', 1);
            
            request.onupgradeneeded = function(e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('fonts')) {
                    db.createObjectStore('fonts', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = function(e) {
                const db = e.target.result;
                const tx = db.transaction('fonts', 'readwrite');
                const store = tx.objectStore('fonts');
                
                store.put({ id: 'custom_story_font', data: base64Data, name: fileName });
                
                tx.oncomplete = function() {
                    resolve();
                };
                tx.onerror = function(err) {
                    reject(err);
                };
            };
            
            request.onerror = function(err) {
                reject(err);
            };
        });
    },

    loadCustomFontFromDB: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('GuessFuncDB', 1);
            
            request.onupgradeneeded = function(e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('fonts')) {
                    db.createObjectStore('fonts', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = function(e) {
                const db = e.target.result;
                // 检查 objectStore 是否存在，如果不存在说明是旧的数据库，重新建表比较麻烦，直接返回null
                if (!db.objectStoreNames.contains('fonts')) {
                    resolve(null);
                    return;
                }
                const tx = db.transaction('fonts', 'readonly');
                const store = tx.objectStore('fonts');
                const getReq = store.get('custom_story_font');
                
                getReq.onsuccess = function() {
                    if (getReq.result) {
                        const nameEl = document.getElementById('custom-font-name');
                        if (nameEl && getReq.result.name) {
                            nameEl.textContent = "已加载: " + getReq.result.name;
                        }
                        resolve(getReq.result.data);
                    } else {
                        resolve(null);
                    }
                };
                getReq.onerror = function() {
                    resolve(null);
                };
            };
            
            request.onerror = function() {
                resolve(null);
            };
        });
    },

    updateAiHint: function() {
        const aiHint = document.getElementById('ai-status-hint');
        const toggleUseAi = document.getElementById('toggle-use-ai');
        if (!aiHint || !toggleUseAi) return;

        if (!toggleUseAi.checked) {
            aiHint.innerHTML = '<span style="color: #FF9800;">⚙️ 当前将使用本地算法快速生成函数（本地模式下难度 0-5 仅供参考）</span>';
            return;
        }

        if (typeof AIManager !== 'undefined') {
            if (AIManager.hasValidKey()) {
                aiHint.innerHTML = '<span style="color: #4CAF50;">✨ AI 已启用，将为您生成高质量题目</span>';
            } else {
                aiHint.innerHTML = '<span style="color: #FF9800;">⚠️ 未配置代理且未填入 API Key，将强制使用本地随机生成</span>';
            }
        }
    },

    bindEvents: function() {
        // 彩蛋：点击标题
        const headerTitle = document.querySelector('header.main-header h1');
        if (headerTitle) {
            let clickCount = 0;
            let resetTimer = null;
            headerTitle.style.cursor = 'pointer';
            headerTitle.style.userSelect = 'none';
            headerTitle.addEventListener('click', () => {
                if (headerTitle.textContent === 'GirlFriend') {
                    headerTitle.textContent = 'GuessFunc';
                    clickCount = 0;
                    return;
                }
                
                clickCount++;
                if (resetTimer) clearTimeout(resetTimer);
                resetTimer = setTimeout(() => {
                    clickCount = 0;
                }, 2000); // 2秒内连续点击才算
                
                if (clickCount >= 10) {
                    headerTitle.textContent = 'GirlFriend';
                    clickCount = 0;
                }
            });
        }

        // 字体设置按钮
        const btnFontSettings = document.getElementById('btn-font-settings');
        if (btnFontSettings) {
            btnFontSettings.addEventListener('click', () => {
                this.hideModal('modal-options');
                setTimeout(() => {
                    this.showModal('modal-font-settings');
                }, 300);
            });
        }

        // 字体大小滑动条
        const fontSizeSlider = document.getElementById('font-size-slider');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                this.updateFontSize(parseInt(e.target.value));
            });
        }

        // 字体样式选择 (Custom Select)
        const fontFamilyWrapper = document.getElementById('font-family-custom-select');
        if (fontFamilyWrapper) {
            const display = fontFamilyWrapper.querySelector('.custom-select-display');
            const optionsContainer = fontFamilyWrapper.querySelector('.custom-options-container');
            const options = fontFamilyWrapper.querySelectorAll('.custom-option');

            if (display && optionsContainer) {
                display.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isShowing = optionsContainer.classList.contains('show');
                    
                    // 关闭其他可能打开的自定义下拉框
                    document.querySelectorAll('.custom-options-container').forEach(c => c.classList.remove('show'));
                    document.querySelectorAll('.custom-select-display').forEach(d => d.classList.remove('active'));
                    
                    if (!isShowing) {
                        optionsContainer.classList.add('show');
                        display.classList.add('active');
                    }
                });

                options.forEach(opt => {
                    opt.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const family = opt.getAttribute('data-value');
                        display.textContent = opt.textContent;
                        optionsContainer.classList.remove('show');
                        display.classList.remove('active');

                        if (family === 'custom') {
                            const customFontData = await this.loadCustomFontFromDB();
                            if (customFontData) {
                                this.applyCustomFont(customFontData);
                            }
                            this.updateFontFamily('custom');
                        } else {
                            this.updateFontFamily(family);
                        }
                    });
                });
            }
        }

        // 自定义字体上传
        const customFontUpload = document.getElementById('custom-font-upload');
        const customFontName = document.getElementById('custom-font-name');
        if (customFontUpload && customFontName) {
            customFontUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    customFontName.textContent = "加载中...";
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const base64Url = event.target.result;
                        try {
                            await this.saveCustomFontToDB(base64Url, file.name);
                            customFontName.textContent = "已加载: " + file.name;
                            // 强制重新应用样式以确保页面更新
                            this.applyCustomFont(base64Url);
                            this.updateFontFamily('custom');
                        } catch (err) {
                            console.error("保存字体失败:", err);
                            customFontName.textContent = "保存失败";
                            alert("字体文件过大或浏览器不支持本地存储。");
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // 按钮点击事件
        const btnCheck = document.getElementById('btn-check');
        if (btnCheck) {
            btnCheck.addEventListener('click', () => {
                GameLogic.checkGuess();
            });
        }
        
        // 音乐开关按钮事件绑定
        document.querySelectorAll('.btn-music-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.AudioManager) {
                    AudioManager.toggleMusic();
                }
            });
        });

        const btnRandom = document.getElementById('btn-random');
        if (btnRandom) {
            btnRandom.addEventListener('click', () => {
                this.showModal('modal-difficulty');
                
                // 初始化 AI 开关状态
                const toggleUseAi = document.getElementById('toggle-use-ai');
                if (toggleUseAi) {
                    const savedPref = localStorage.getItem('guessfunc_use_ai');
                    toggleUseAi.checked = savedPref !== 'false'; // 默认开启
                    
                    // 监听开关改变以更新提示
                    toggleUseAi.onchange = () => {
                        this.updateAiHint();
                    };
                }

                // 更新 AI 状态提示
                this.updateAiHint();

                // 初始化滑块值和显示文本
                const slider = document.getElementById('difficulty-slider');
                const val = document.getElementById('difficulty-value');
                if (slider && val) {
                    val.textContent = parseFloat(slider.value).toFixed(2);
                }
            });
        }

        // 退出闯关按钮
        const btnReturn = document.getElementById('btn-return');
        if (btnReturn) {
            btnReturn.addEventListener('click', () => {
                if(confirm("确定要退出闯关模式，返回主界面吗？")) {
                    GameLogic.startEmptyLevel();
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

                    // 检查是否已看过第一章的剧情
                const regions = window.REGIONS;
                if (regions && regions.length > 0) {
                    const firstRegion = regions[0];
                    if ((firstRegion.description || firstRegion.descriptionPath) && !StorageManager.isChapterSeen(firstRegion.id)) {
                        StorageManager.markChapterSeen(firstRegion.id);
                        
                        setTimeout(() => this.renderLevelList(), 0); // 强制刷新列表，让第一章的“剧情”按钮显示出来

                        // 暂时关闭关卡模态框还是覆盖？
                        // 最好是显示在最上层或切换到剧情。
                        // 让我们关闭关卡模态框并显示剧情。
                        this.hideModal('modal-levels');
                        
                        setTimeout(() => {
                            this.showStory(firstRegion);
                            // 剧情结束后，重新打开关卡模态框
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

        // 难度滑块事件
        const difficultySlider = document.getElementById('difficulty-slider');
        const difficultyValue = document.getElementById('difficulty-value');
        const btnConfirmDifficulty = document.getElementById('btn-confirm-difficulty');

        if (difficultySlider && difficultyValue) {
            difficultySlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                difficultyValue.textContent = val.toFixed(2);
            });
        }

        if (btnConfirmDifficulty) {
            btnConfirmDifficulty.addEventListener('click', () => {
                const level = parseFloat(difficultySlider.value);
                const toggleUseAi = document.getElementById('toggle-use-ai');
                const useAi = toggleUseAi ? toggleUseAi.checked : true;
                
                // 记录用户偏好
                localStorage.setItem('guessfunc_use_ai', useAi);

                MathEngine.setDifficulty(level);
                // 传递第二个参数：是否强制使用本地生成
                GameLogic.startRandomLevel(level, !useAi);
                this.setMode('random');
                this.hideModal('modal-difficulty');
            });
        }

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
                this.showModal('modal-rules'); // 复用规则模态框
                this.loadAbout();
                this.hideModal('modal-options');
            });
        }

        const btnChangelog = document.getElementById('btn-changelog');
        if (btnChangelog) {
            btnChangelog.addEventListener('click', () => {
                const title = document.getElementById('rules-title');
                if (title) title.textContent = "更新日志";
                this.showModal('modal-rules'); // 为了简单起见复用规则模态框
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
                    const importResult = StorageManager.importSave(save);
                    if (importResult === 'migrated') {
                        alert("检测到旧版存档代码！\n\n您的旧版进度已成功导入并自动迁移至【The Day Before Tomorrow】中。");
                        this.renderLevelList(); // 刷新
                    } else if (importResult) {
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

        // API 设置按钮
        const btnApiSettings = document.getElementById('btn-api-settings');
        if (btnApiSettings) {
            btnApiSettings.addEventListener('click', () => {
                const inputKey = document.getElementById('input-api-key');
                if (inputKey) {
                    inputKey.value = localStorage.getItem('guessfunc_api_key') || '';
                }
                const inputPrompt = document.getElementById('input-system-prompt');
                if (inputPrompt && typeof AIManager !== 'undefined') {
                    inputPrompt.value = AIManager.getSystemPrompt();
                }
                const toggleProxy = document.getElementById('toggle-use-proxy');
                if (toggleProxy) {
                    const savedProxyPref = localStorage.getItem('guessfunc_use_proxy');
                    // 默认开启代理。如果用户明确选择了关闭，才为 false
                    toggleProxy.checked = savedProxyPref !== 'false';
                }

                this.showModal('modal-api-settings');
                this.hideModal('modal-options');
            });
        }

        // 保存 API Key
        const btnSaveApiKey = document.getElementById('btn-save-api-key');
        if (btnSaveApiKey) {
            btnSaveApiKey.addEventListener('click', () => {
                const inputKey = document.getElementById('input-api-key');
                const toggleProxy = document.getElementById('toggle-use-proxy');
                
                if (inputKey) {
                    const key = inputKey.value.trim();
                    localStorage.setItem('guessfunc_api_key', key);
                }
                
                if (toggleProxy) {
                    localStorage.setItem('guessfunc_use_proxy', toggleProxy.checked);
                }
                
                this.showMessage("设置已保存！", "success");
                this.hideModal('modal-api-settings');
            });
        }

        // 保存系统提示词
        const btnSaveSystemPrompt = document.getElementById('btn-save-system-prompt');
        if (btnSaveSystemPrompt) {
            btnSaveSystemPrompt.addEventListener('click', () => {
                const inputPrompt = document.getElementById('input-system-prompt');
                if (inputPrompt && typeof AIManager !== 'undefined') {
                    AIManager.setSystemPrompt(inputPrompt.value);
                    this.showMessage("自定义提示词已保存！", "success");
                }
            });
        }

        // 恢复默认系统提示词
        const btnResetSystemPrompt = document.getElementById('btn-reset-system-prompt');
        if (btnResetSystemPrompt) {
            btnResetSystemPrompt.addEventListener('click', () => {
                const inputPrompt = document.getElementById('input-system-prompt');
                if (inputPrompt && typeof AIManager !== 'undefined') {
                    inputPrompt.value = AIManager.DEFAULT_SYSTEM_PROMPT;
                    AIManager.setSystemPrompt(''); // 清除 localStorage 中的自定义提示词
                    this.showMessage("已恢复默认提示词！", "success");
                }
            });
        }

        // 眼睛按钮：切换 API Key 显示/隐藏
        const btnTogglePassword = document.getElementById('btn-toggle-password');
        const inputApiKey = document.getElementById('input-api-key');
        if (btnTogglePassword && inputApiKey) {
            btnTogglePassword.addEventListener('click', () => {
                const isPassword = inputApiKey.type === 'password';
                inputApiKey.type = isPassword ? 'text' : 'password';
                btnTogglePassword.textContent = isPassword ? '🔒' : '👁️';
                btnTogglePassword.style.opacity = isPassword ? '1' : '0.6';
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
        // 检查本地存储或系统偏好
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
        
        // 如果可能，更新 Desmos（Desmos 通常处理自己的主题，但我们可以尝试反转或调整）。目前我们只处理我们的 UI。
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
                Logger.error("Failed to load rules:", err);
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
                Logger.error("Failed to load about info:", err);
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
                Logger.error("Failed to load changelog:", err);
                container.textContent = "加载更新日志失败。";
            });
    },
    
    /**
     * 渲染 Markdown 内容
     */
    renderMarkdown: function(container, text) {
        if (window.marked) {
            // 保护数学块免受 Markdown 解析
            // 我们用占位符替换 $...$ 和 $$...$$
            const mathBlocks = [];
            const protectedText = text.replace(/(\$\$[\s\S]*?\$\$)|(\$[^$\n]*?\$)/g, (match) => {
                mathBlocks.push(match);
                return `MATHBLOCK${mathBlocks.length - 1}BLOCKMATH`;
            });
            
            // 解析 Markdown
            let html = marked.parse(protectedText);
            
            // 恢复数学块
            html = html.replace(/MATHBLOCK(\d+)BLOCKMATH/g, (match, index) => {
                return mathBlocks[parseInt(index)];
            });
            
            container.innerHTML = html;
            
            // 使用 KaTeX 渲染数学公式
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
        
        if (!window.ROUTES || window.ROUTES.length === 0) {
            container.innerHTML = '<p>暂无预设关卡。</p>';
            return;
        }

        // 添加线路选择器 (美化下拉框)
        if (window.ROUTES.length > 0) {
            const routeSelectorContainer = document.createElement('div');
            routeSelectorContainer.className = 'route-selector-container';

            const selectorHeader = document.createElement('div');
            selectorHeader.className = 'route-selector-header';
            
            const label = document.createElement('span');
            label.textContent = '当前线路：';
            label.className = 'route-selector-label';
            selectorHeader.appendChild(label);

            const routeSelectWrapper = document.createElement('div');
            routeSelectWrapper.className = 'custom-select-wrapper';
            
            // Create the visible select button
            const selectDisplay = document.createElement('div');
            selectDisplay.className = 'custom-select-display';
            
            // Create the dropdown options container
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'custom-options-container';
            
            let selectedTitle = '';

            window.ROUTES.forEach(route => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'custom-option';
                if (route.id === window.currentRouteId) {
                    optionDiv.classList.add('selected');
                    selectedTitle = route.title;
                }
                optionDiv.textContent = route.title;
                optionDiv.dataset.value = route.id;
                
                optionDiv.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent document click from firing immediately
                    const newRouteId = route.id;
                    
                    // Update UI
                    selectDisplay.textContent = route.title;
                    optionsContainer.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
                    optionDiv.classList.add('selected');
                    optionsContainer.classList.remove('show');
                    selectDisplay.classList.remove('active');
                    
                    // Change route logic
                    if (newRouteId !== window.currentRouteId) {
                        const newRoute = window.ROUTES.find(r => r.id === newRouteId);
                        if (newRoute) {
                            window.currentRouteId = newRouteId;
                            window.LEVELS = newRoute.levels;
                            window.REGIONS = newRoute.regions;
                            if (window.StorageManager) {
                                window.StorageManager.saveCurrentRoute(newRouteId);
                            }
                            this.renderLevelList();
                        }
                    }
                });
                
                optionsContainer.appendChild(optionDiv);
            });

            selectDisplay.textContent = selectedTitle;

            // Toggle dropdown
            selectDisplay.addEventListener('click', (e) => {
                e.stopPropagation();
                const isShowing = optionsContainer.classList.contains('show');
                
                // Close all other open custom selects if any
                document.querySelectorAll('.custom-options-container').forEach(c => c.classList.remove('show'));
                document.querySelectorAll('.custom-select-display').forEach(d => d.classList.remove('active'));
                
                if (!isShowing) {
                    optionsContainer.classList.add('show');
                    selectDisplay.classList.add('active');
                }
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!routeSelectWrapper.contains(e.target)) {
                    optionsContainer.classList.remove('show');
                    selectDisplay.classList.remove('active');
                }
            });

            routeSelectWrapper.appendChild(selectDisplay);
            routeSelectWrapper.appendChild(optionsContainer);
            selectorHeader.appendChild(routeSelectWrapper);
            routeSelectorContainer.appendChild(selectorHeader);
            
            const currentRouteDesc = window.ROUTES.find(r => r.id === window.currentRouteId)?.description;
            if (currentRouteDesc) {
                const descP = document.createElement('p');
                descP.textContent = currentRouteDesc;
                descP.className = 'route-desc';
                routeSelectorContainer.appendChild(descP);
            }

            // 添加“当前已解锁剧情”按钮
            const viewAllStoryBtn = document.createElement('button');
            viewAllStoryBtn.className = 'primary-btn route-story-btn';
            viewAllStoryBtn.style.marginTop = '10px';
            viewAllStoryBtn.innerHTML = '当前已解锁剧情';
            viewAllStoryBtn.onclick = () => {
                this.showAllUnlockedStories();
            };
            routeSelectorContainer.appendChild(viewAllStoryBtn);

            container.appendChild(routeSelectorContainer);
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

        let hasShownLockedRegion = false; // 用于标记是否已经显示了第一个未解锁的章节

        regions.forEach(region => {
            // 检查区域解锁状态
            const regionUnlockStatus = StorageManager.checkRegionUnlock ? StorageManager.checkRegionUnlock(region) : { unlocked: true };
            const isRegionLocked = !regionUnlockStatus.unlocked;

            // 如果该章节被锁定，且之前已经显示过一个锁定的章节了，则直接跳过渲染（防剧透）
            if (isRegionLocked) {
                if (hasShownLockedRegion) {
                    return; // 跳过后续所有未解锁章节的渲染
                }
                hasShownLockedRegion = true; // 标记这是第一个展示出来的未解锁章节
            }

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
                // 如果已经看过，显示“剧情”，否则不显示（由点击关卡时自动触发）
                if (StorageManager.isChapterSeen(region.id)) {
                    const storyBtn = document.createElement('button');
                    storyBtn.innerHTML = '剧情';
                    storyBtn.className = 'story-btn primary-btn'; 
                    storyBtn.style.padding = '4px 10px'; // 调整内边距
                    storyBtn.style.fontSize = '0.85rem'; // 稍微缩小字体
                    storyBtn.style.marginLeft = 'auto'; 
                    
                    // 移动端特殊处理将在 CSS 中通过类名控制，这里只设置内联基础样式
                    // 或者我们可以添加一个特定的类名用于移动端样式覆盖
                    storyBtn.classList.add('mobile-compact-btn');

                    storyBtn.onclick = (e) => {
                        e.stopPropagation(); // 防止触发标题点击
                        this.showStory({
                            id: region.id,
                            title: region.title + " - 剧情",
                            description: region.description,
                            descriptionPath: region.descriptionPath
                        });
                    };
                    regionHeader.appendChild(storyBtn);
                }
            }

            // 渲染假结局按钮
            if (region.fakeEndings && region.fakeEndings.length > 0 && !isRegionLocked) {
                region.fakeEndings.forEach(fakeEnding => {
                    // 只要看过，就显示回顾按钮（解锁条件只管首次触发，不管回顾）
                    if (StorageManager.isChapterSeen(fakeEnding.id)) {
                        const fakeBtn = document.createElement('button');
                        fakeBtn.innerHTML = fakeEnding.title || '假结局剧情';
                        fakeBtn.className = 'story-btn primary-btn';
                        fakeBtn.style.padding = '4px 10px';
                        fakeBtn.style.fontSize = '0.85rem';
                        fakeBtn.style.marginLeft = '10px';
                        fakeBtn.style.backgroundColor = '#9c27b0'; // 紫色区分假结局
                        fakeBtn.classList.add('mobile-compact-btn');

                        fakeBtn.onclick = (e) => {
                            e.stopPropagation();
                            this.showStory({
                                title: fakeEnding.title || '假结局',
                                descriptionPath: fakeEnding.descriptionPath
                            });
                        };
                        regionHeader.appendChild(fakeBtn);
                    }
                });
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
                // 查找关卡数据
                const levelData = window.LEVELS.find(l => l.id === levelId);
                const levelIndex = window.LEVELS.findIndex(l => l.id === levelId);
                
                if (!levelData) return;

                const btn = document.createElement('button');
                const isCompleted = StorageManager.isLevelCompleted(levelId);
                
                // 检查解锁状态
                const unlockStatus = StorageManager.checkLevelUnlock ? StorageManager.checkLevelUnlock(levelData, region) : { unlocked: true };
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
                        // 确保关卡模态框已关闭
                        const levelsModal = document.getElementById('modal-levels');
                        if (levelsModal && levelsModal.classList.contains('visible')) {
                            this.hideModal('modal-levels');
                        }
                    };

                    // 检查章节剧情是否已读
                    if ((region.description || region.descriptionPath) && !StorageManager.isChapterSeen(region.id)) {
                        StorageManager.markChapterSeen(region.id);
                        
                        // 因为点击关卡解锁了剧情，强制重新渲染当前列表以便显示出“剧情”按钮
                        // 延迟一点刷新，避免界面卡顿
                        setTimeout(() => this.renderLevelList(), 0);

                        // 先关闭关卡模态框
                        this.hideModal('modal-levels');
                        
                        // 短暂延迟后显示剧情，以便过渡
                        setTimeout(() => {
                            this.showStory(region);
                            // 注册回调，在剧情关闭后开始关卡
                            this.modalCallbacks['modal-story'] = startAction;
                        }, 300);
                    } else {
                        startAction();
                    }
                });
                levelsContainer.appendChild(btn);
            });
        });

        // 检查并渲染结局剧情按钮
        const currentRoute = window.ROUTES.find(r => r.id === window.currentRouteId);
        if (currentRoute && currentRoute.endingPath) {
            const lastLevelId = currentRoute.levels[currentRoute.levels.length - 1].id;
            if (StorageManager.isLevelCompleted(lastLevelId)) {
                const endingContainer = document.createElement('div');
                endingContainer.style.marginTop = '30px';
                endingContainer.style.marginBottom = '20px';
                endingContainer.style.textAlign = 'center';
                endingContainer.style.width = '100%';
                
                const endingBtn = document.createElement('button');
                endingBtn.className = 'primary-btn';
                endingBtn.style.padding = '12px 24px';
                endingBtn.style.fontSize = '1.1rem';
                endingBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                endingBtn.innerHTML = '结局剧情';
                
                let playAnimationToggle = null;
                if (currentRoute.id === 'classic') {
                    // 添加是否播放动画的开关 (美化版)
                    const toggleWrapper = document.createElement('div');
                    toggleWrapper.className = 'ending-anim-toggle-wrapper';
                    
                    playAnimationToggle = document.createElement('input');
                    playAnimationToggle.type = 'checkbox';
                    playAnimationToggle.id = 'toggle-ending-animation';
                    playAnimationToggle.className = 'ending-anim-checkbox';
                    playAnimationToggle.checked = localStorage.getItem('guessfunc_play_ending_anim') !== 'false';
                    
                    playAnimationToggle.addEventListener('change', (e) => {
                        localStorage.setItem('guessfunc_play_ending_anim', e.target.checked);
                    });
                    
                    const toggleLabel = document.createElement('label');
                    toggleLabel.htmlFor = 'toggle-ending-animation';
                    toggleLabel.className = 'ending-anim-label';
                    
                    const toggleSwitch = document.createElement('div');
                    toggleSwitch.className = 'ending-anim-switch';
                    
                    const toggleText = document.createElement('span');
                    toggleText.className = 'ending-anim-text';
                    toggleText.textContent = '播放动画';
                    
                    toggleLabel.appendChild(toggleSwitch);
                    toggleLabel.appendChild(toggleText);
                    
                    toggleWrapper.appendChild(playAnimationToggle);
                    toggleWrapper.appendChild(toggleLabel);
                    
                    endingContainer.appendChild(endingBtn);
                    endingContainer.appendChild(toggleWrapper);
                } else {
                    endingContainer.appendChild(endingBtn);
                }
                
                endingBtn.onclick = () => {
                    // 如果是 classic 路线，并且勾选了播放动画，则播放动画
                    if (currentRoute.id === 'classic' && (!playAnimationToggle || playAnimationToggle.checked)) {
                        this.playEndingAnimation(() => {
                            this.showStory({
                                isEnding: true,
                                title: currentRoute.title + " - 结局",
                                descriptionPath: currentRoute.endingPath
                            });
                        });
                    } else {
                        this.showStory({
                            isEnding: true,
                            title: currentRoute.title + " - 结局",
                            descriptionPath: currentRoute.endingPath
                        });
                    }
                };
                
                container.appendChild(endingContainer);
            }
        }

        // 添加未完待续提示
        if (currentRoute && currentRoute.showToBeContinued) {
            let isLastChapterUnlocked = false;
            if (currentRoute.regions && currentRoute.regions.length > 0) {
                const lastRegion = currentRoute.regions[currentRoute.regions.length - 1];
                const unlockStatus = StorageManager.checkRegionUnlock ? StorageManager.checkRegionUnlock(lastRegion) : { unlocked: true };
                isLastChapterUnlocked = unlockStatus.unlocked;
            }
            if (isLastChapterUnlocked) {
                const toBeContinuedDiv = document.createElement('div');
                toBeContinuedDiv.style.marginTop = '40px';
                toBeContinuedDiv.style.marginBottom = '20px';
                toBeContinuedDiv.style.textAlign = 'center';
                toBeContinuedDiv.style.color = '#888';
                toBeContinuedDiv.style.fontWeight = 'bold';
                toBeContinuedDiv.style.fontSize = '1.2em';
                toBeContinuedDiv.innerHTML = '—— 未完待续 ——';
                container.appendChild(toBeContinuedDiv);
            }
        }
    },
    
    /**
     * 合并显示所有已解锁的剧情
     */
    showAllUnlockedStories: async function() {
        const currentRoute = window.ROUTES.find(r => r.id === window.currentRouteId);
        if (!currentRoute) return;

        const stories = []; // 收集所有已解锁的剧情数据对象

        // 遍历所有章节
        if (currentRoute.regions) {
            currentRoute.regions.forEach(region => {
                const regionUnlock = StorageManager.checkRegionUnlock ? StorageManager.checkRegionUnlock(region) : { unlocked: true };
                
                // 1. 章节主剧情
                if (regionUnlock.unlocked && StorageManager.isChapterSeen(region.id) && (region.description || region.descriptionPath)) {
                    stories.push({
                        title: region.title, // 去掉 " - 章节剧情"
                        type: 'chapter',
                        description: region.description,
                        descriptionPath: region.descriptionPath
                    });
                }

                // 2. 遍历该章节下的关卡剧情
                if (region.levels) {
                    region.levels.forEach(levelId => {
                        const levelData = currentRoute.levels.find(l => l.id === levelId);
                        if (levelData) {
                            const levelUnlock = StorageManager.checkLevelUnlock ? StorageManager.checkLevelUnlock(levelData, region) : { unlocked: true };
                            if (levelUnlock.unlocked && (levelData.description || levelData.descriptionPath)) {
                                stories.push({
                                    title: levelData.title,
                                    type: 'level',
                                    description: levelData.description,
                                    descriptionPath: levelData.descriptionPath
                                });
                            }
                        }
                    });
                }

                // 3. 遍历该章节下的假结局
                if (region.fakeEndings && regionUnlock.unlocked) {
                    region.fakeEndings.forEach(fake => {
                        if (StorageManager.isChapterSeen(fake.id)) {
                            stories.push({
                                title: fake.title || "假结局", // 去掉后缀，或直接使用自定义title
                                type: 'fake_ending',
                                description: fake.description,
                                descriptionPath: fake.descriptionPath
                            });
                        }
                    });
                }
            });
        }

        // 4. 真结局剧情
        if (currentRoute.endingPath) {
            const lastLevelId = currentRoute.levels[currentRoute.levels.length - 1].id;
            if (StorageManager.isLevelCompleted(lastLevelId)) {
                stories.push({
                    title: currentRoute.title + " 结局", // 或者你想只叫“结局”
                    type: 'true_ending',
                    descriptionPath: currentRoute.endingPath
                });
            }
        }

        if (stories.length === 0) {
            alert("当前没有任何已解锁的剧情可供回顾。");
            return;
        }

        // 暂时隐藏关卡列表
        this.hideModal('modal-levels');

        // 构建合并后的 Markdown 内容
        let mergedMarkdown = `# ${currentRoute.title}\n\n`;

        for (const story of stories) {
            // 根据类型决定标题级别，章节为 h2，关卡为 h3
            if (story.type === 'chapter' || story.type === 'true_ending' || story.type === 'fake_ending') {
                mergedMarkdown += `## ${story.title}\n\n`;
            } else {
                mergedMarkdown += `### ${story.title}\n\n`;
            }
            
            if (story.descriptionPath) {
                try {
                    const response = await fetch(story.descriptionPath);
                    if (response.ok) {
                        const text = await response.text();
                        // 移除文件内可能自带的 # 标题，避免层级混乱
                        const cleanText = text.replace(/^#+\s+.*$/gm, '').trim();
                        mergedMarkdown += cleanText + "\n\n";
                    } else {
                        mergedMarkdown += "*加载剧情失败*\n\n";
                    }
                } catch (e) {
                    mergedMarkdown += "*加载剧情失败*\n\n";
                }
            } else if (story.description) {
                mergedMarkdown += story.description + "\n\n";
            }
            
            // 如果是章节或结局的末尾，可以加一条粗一点的分割线，或者统一加
            mergedMarkdown += "---\n\n";
        }
        
        // 追加未完待续
        if (currentRoute && currentRoute.showToBeContinued) {
            let isLastChapterUnlocked = false;
            if (currentRoute.regions && currentRoute.regions.length > 0) {
                const lastRegion = currentRoute.regions[currentRoute.regions.length - 1];
                const unlockStatus = StorageManager.checkRegionUnlock ? StorageManager.checkRegionUnlock(lastRegion) : { unlocked: true };
                isLastChapterUnlocked = unlockStatus.unlocked;
            }
            if (isLastChapterUnlocked) {
                mergedMarkdown += "\n\n<br><br><div style=\"text-align: center; color: #888; font-weight: bold; font-size: 1.2em;\">—— 未完待续 ——</div>\n\n";
            }
        }

        setTimeout(() => {
            // 使用 marked 渲染合并后的内容
            const contentHtml = window.marked ? window.marked.parse(mergedMarkdown) : mergedMarkdown.replace(/\n/g, '<br>');
            
            const modalTitle = document.querySelector('#modal-story .modal-header h2');
            if (modalTitle) modalTitle.textContent = '当前已解锁剧情';
            
            const modalContent = document.getElementById('story-content');
            if (modalContent) modalContent.innerHTML = contentHtml;
            
            // 播放正常剧情音乐
            if (window.AudioManager) {
                AudioManager.playStoryMusic(false);
            }

            this.showModal('modal-story');

            this.modalCallbacks['modal-story'] = () => {
                this.showModal('modal-levels');
            };
        }, 350);
    },

    /**
     * 播放 The Day Before Tomorrow 结局动画
     */
    playEndingAnimation: function(callback) {
        const overlay = document.getElementById('ending-animation-overlay');
        const textElem = document.getElementById('ending-animation-text');
        if (!overlay || !textElem) {
            if (callback) callback();
            return;
        }
        
        // 播放结局音乐
        if (window.AudioManager) {
            AudioManager.playStoryMusic(true);
        }

        // 隐藏其他模态框
        const modals = document.querySelectorAll('.modal');
        modals.forEach(m => m.classList.add('hidden'));

        overlay.classList.add('active');
        
        const sequence = [
            "“你觉得，这算不算永远？”",
            "“不算。因为永远太远了。我们只有现在。”",
            "“那就现在吧。”",
            "“好。”",
            "The Day Before Tomorrow"
        ];
        
        let i = 0;
        const showNextText = () => {
            if (i >= sequence.length) {
                // 动画结束，淡出
                setTimeout(() => {
                    overlay.classList.remove('active');
                    // 结局动画结束，后面紧接着可能就是结局文本弹窗了
                    // 我们不在这里 stopMusic()，如果后面没有弹窗了用户自己关，
                    // 或者是跳转逻辑会处理。这里保持播放让情绪连贯。
                    if (callback) callback();
                }, 2000);
                return;
            }
            
            textElem.textContent = sequence[i];
            textElem.classList.add('visible');
            
            // 文本停留，然后淡出
            setTimeout(() => {
                textElem.classList.remove('visible');
                i++;
                // 文本消失后等待一小会再显示下一句
                setTimeout(showNextText, 1500);
            }, i === sequence.length - 1 ? 4000 : 3000); // 最后一句标题停留久一点
        };
        
        // 延迟一点开始
        setTimeout(showNextText, 1000);
    },

    /**
     * 显示关卡指引
     */
    showLevelInstruction: function(levelData) {
        if (!levelData.descriptionPath && !levelData.description) return;
        
        // 播放正常剧情音乐
        if (window.AudioManager) {
            AudioManager.playStoryMusic(false);
        }

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
                        Logger.error("Failed to load level description:", err);
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
        
        // 播放对应剧情音乐
        if (window.AudioManager) {
            const isEndingMusic = regionData.isEnding || regionData.type === 'true_ending' || regionData.type === 'fake_ending';
            AudioManager.playStoryMusic(isEndingMusic);
        }

        const container = document.getElementById('story-content');
        if (container) {
            this.showModal('modal-story');
            container.innerHTML = '<p>加载中...</p>';
            
            const modalTitle = document.querySelector('#modal-story .modal-header h2');
            if (modalTitle && regionData.title) {
                modalTitle.textContent = regionData.title;
            } else if (modalTitle) {
                modalTitle.textContent = '章节剧情';
            }
            
            const currentRoute = window.ROUTES.find(r => r.id === window.currentRouteId);
            let appendToBeContinued = false;
            if (currentRoute && currentRoute.showToBeContinued) {
                if (currentRoute.regions && currentRoute.regions.length > 0) {
                    const lastRegion = currentRoute.regions[currentRoute.regions.length - 1];
                    // 如果这是最后一章，或者这是结局（如果以后有的话）
                    if ((regionData.id && regionData.id === lastRegion.id) || regionData.isEnding) {
                        appendToBeContinued = true;
                    }
                }
            }

            const toBeContinuedHTML = "\n\n<br><br><div style=\"text-align: center; color: #888; font-weight: bold; font-size: 1.2em;\">—— 未完待续 ——</div>\n\n";

            if (regionData.descriptionPath) {
                fetch(regionData.descriptionPath)
                    .then(res => res.text())
                    .then(text => {
                        if (appendToBeContinued) text += toBeContinuedHTML;
                        this.renderMarkdown(container, text);
                    })
                    .catch(err => {
                         Logger.error("Failed to load story:", err);
                         container.innerHTML = "<p>加载剧情失败。</p>";
                    });
            } else {
                let text = regionData.description;
                if (appendToBeContinued) text += toBeContinuedHTML;
                this.renderMarkdown(container, text);
            }
        }
    },
    
    updateUI: function() {
        // 根据模式切换按钮显示
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
            // 触发重排以启用过渡
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
                
                // 如果是剧情弹窗关闭，停止播放音乐
                if ((modalId === 'modal-story' || modalId === 'modal-level-instruction') && window.AudioManager) {
                    AudioManager.stopMusic();
                }
                
                // 如果有回调则执行
                if (this.modalCallbacks[modalId]) {
                    const callback = this.modalCallbacks[modalId];
                    delete this.modalCallbacks[modalId];
                    callback();
                }
            }, 300); // 300ms 过渡时间
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
