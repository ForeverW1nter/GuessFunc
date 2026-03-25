
/**
 * UI 管理器模块
 * 负责 DOM 操作、事件监听、弹窗控制
 */

const UIManager = {
    timer: null,
    modalCallbacks: {},
    lastAiChatTime: 0,

    // --- 性能优化：防抖函数 ---
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },

    init: function() {
        this.bindEvents();
        this.initTheme();
        this.initFontSize();

        // 使用防抖优化窗口大小改变时的重新渲染
        this._debouncedResize = this.debounce(() => {
            if (window.GraphManager && GraphManager.calculator) {
                GraphManager.calculator.resize();
            }
        }, 150);
        window.addEventListener('resize', this._debouncedResize);
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
            const min = parseFloat(slider.min) || 50;
            const max = parseFloat(slider.max) || 200;
            const val = ((size - min) / (max - min)) * 100;
            slider.style.background = `linear-gradient(to right, var(--primary-color) ${val}%, var(--card-border) ${val}%)`;
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
        if (aiHint && toggleUseAi) {
            aiHint.style.display = 'block';
            if (toggleUseAi.checked) {
                aiHint.innerHTML = '<span style="color: var(--primary-color);">提示：AI生成题目的难度体系与本地难度系数不同，可能更具挑战性。</span>';
            } else {
                aiHint.innerHTML = '<span style="opacity: 0.7;">当前使用本地生成算法。</span>';
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
                this.openPanel('font-settings', '剧情字体设置', {
                    backAction: () => {
                        this.openPanel('options', '设置中心', {
                            backAction: () => this.hideModal('modal-universal')
                        });
                    }
                });
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
                            this.showMessage(MESSAGES.get('settings.fontLoadFailed'), "error");
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const aiBtn = document.getElementById('ai-chat-btn');
        if (aiBtn) {
            let isDragging = false;
            let startX, startY, initialX, initialY;
            let hasMoved = false;

            const onMouseDown = (e) => {
                isDragging = true;
                hasMoved = false;
                startX = e.clientX || e.touches[0].clientX;
                startY = e.clientY || e.touches[0].clientY;
                const rect = aiBtn.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;
                aiBtn.style.transition = 'none';
                if (e.type === 'mousedown') e.preventDefault();
            };

            const onMouseMove = (e) => {
                if (!isDragging) return;
                const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
                const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
                const dx = clientX - startX;
                const dy = clientY - startY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                    hasMoved = true;
                    if (e.type === 'touchmove') e.preventDefault();
                }
                aiBtn.style.left = `${initialX + dx}px`;
                aiBtn.style.top = `${initialY + dy}px`;
                aiBtn.style.right = 'auto';
                aiBtn.style.bottom = 'auto';
            };

            const onMouseUp = () => {
                if (isDragging) {
                    isDragging = false;
                    aiBtn.style.transition = '';
                }
            };

            aiBtn.addEventListener('mousedown', onMouseDown);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            aiBtn.addEventListener('touchstart', onMouseDown, { passive: false });
            document.addEventListener('touchmove', onMouseMove, { passive: false });
            document.addEventListener('touchend', onMouseUp);

            aiBtn.addEventListener('click', (e) => {
                if (hasMoved) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                
                if (window.GameLogic && window.GameLogic.state.mode === 'preset') {
                    // 内置提示
                    let hintText = "没有关于此关卡的提示。";
                    const currentIdx = GameLogic.state.currentPresetIndex;
                    if (currentIdx >= 0 && window.LEVELS && window.LEVELS[currentIdx]) {
                        const levelData = window.LEVELS[currentIdx];
                        if (levelData.hint) {
                            hintText = levelData.hint;
                        } else if (levelData.target) {
                            const target = levelData.target;
                            let features = [];
                            if (target.includes('sin') || target.includes('cos') || target.includes('tan')) features.push("包含三角函数");
                            if (target.includes('ln') || target.includes('log')) features.push("包含对数函数");
                            if (target.includes('e^') || target.includes('\\exp')) features.push("包含指数函数");
                            if (target.includes('frac') || target.includes('/')) features.push("包含分式");
                            if (target.includes('^') && !target.includes('e^')) features.push("包含幂函数");
                            if (target.includes('abs')) features.push("包含绝对值");
                            if (target.includes('sqrt')) features.push("包含根号");
                            if (features.length > 0) {
                                hintText = "该函数" + features.join("，") + "。";
                            } else {
                                hintText = "这是一个简单的多项式或线性函数。";
                            }
                        }
                    }
                    this.showMessage(MESSAGES.get('game.hintPrefix', { hint: hintText }), "info");
                    return;
                }

                // AI Chat
                this.openPanel('ai-chat', 'AI 助手', {
                    backAction: () => this.hideModal('modal-universal')
                });
            });
        }
        
        const btnAiChatSend = document.getElementById('btn-ai-chat-send');
        const aiChatInput = document.getElementById('ai-chat-input');
        if (btnAiChatSend && aiChatInput) {
            btnAiChatSend.addEventListener('click', () => this.handleAiChatSend());
            aiChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleAiChatSend();
            });
        }

        // 按钮点击事件
        const btnCheck = document.getElementById('btn-check');
        if (btnCheck) {
            btnCheck.addEventListener('click', () => {
                GameLogic.checkGuess();
            });
        }
        
        // 音乐开关按钮事件绑定 (使用事件委托以确保对所有动态加载或克隆的按钮有效)
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-music-toggle');
            if (btn && window.AudioManager) {
                AudioManager.toggleMusic();
            }
        });

        const btnRandom = document.getElementById('btn-random');
        if (btnRandom) {
            btnRandom.addEventListener('click', () => {
                this.openPanel('difficulty', '随机挑战', {
                    backAction: () => this.hideModal('modal-universal')
                });
                
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
            btnReturn.addEventListener('click', async () => {
                const isConfirmed = await this.showConfirm(MESSAGES.get('game.confirmExitPreset'), MESSAGES.get('game.exitConfirmTitle'));
                if(isConfirmed) {
                    GameLogic.startEmptyLevel();
                    this.setMode('random');
                    
                    // 打开选关界面
                    this.renderLevelList(); // 确保渲染最新的进度
                    const currentRegion = this.currentViewRegionId && window.REGIONS ? window.REGIONS.find(r => r.id === this.currentViewRegionId) : null;
                    const panelTitle = currentRegion ? currentRegion.title : '选择关卡';
                    
                    this.openPanel('levels', panelTitle, {
                        backAction: () => {
                            if (this.currentViewRegionId) {
                                this.currentViewRegionId = null;
                                this.renderLevelList();
                                const titleEl = document.getElementById('universal-title');
                                if (titleEl) titleEl.textContent = '选择关卡';
                                const backBtn = document.getElementById('btn-modal-back');
                                if (backBtn) {
                                    backBtn.onclick = () => this.hideModal('modal-universal');
                                    backBtn.classList.add('hidden');
                                }
                            } else {
                                this.hideModal('modal-universal');
                            }
                        }
                    });
                }
            });
        }
        
        // 预设关卡按钮
        const btnPreset = document.getElementById('btn-preset');
        if (btnPreset) {
            btnPreset.addEventListener('click', () => {
                this.currentViewRegionId = null; // 重置为顶层章节列表

                const isSpeedrun = localStorage.getItem('guessfunc_speedrun_mode') === 'true';

                // 检查是否已看过第一章的剧情
                const regions = window.REGIONS;
                if (!isSpeedrun && regions && regions.length > 0) {
                    const firstRegion = regions[0];
                    if ((firstRegion.description || firstRegion.descriptionPath) && !StorageManager.isChapterSeen(firstRegion.id)) {
                        StorageManager.markChapterSeen(firstRegion.id);
                        
                        setTimeout(() => this.renderLevelList(), 0); // 强制刷新列表，让第一章的“剧情”按钮显示出来
                        
                        setTimeout(() => {
                            this.showStory(firstRegion);
                            // 剧情结束后，重新打开关卡模态框
                            this.modalCallbacks['modal-universal'] = () => {
                                this.openPanel('levels', '选择关卡');
                            };
                        }, 50);
                        return; // 如果显示了剧情，直接返回，不再执行下面的 openPanel
                    }
                }
                this.openPanel('levels', '选择关卡', {
                    // 没有 backAction，顶级目录不显示返回按钮
                });
            });
        }
        
        // 下一关按钮
        const btnNext = document.getElementById('btn-next');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                GameLogic.nextLevel();
            });
        }

        // 初始化所有滑块颜色
        const updateSliderColor = (slider) => {
            const min = parseFloat(slider.min) || 0;
            const max = parseFloat(slider.max) || 100;
            const val = ((slider.value - min) / (max - min)) * 100;
            slider.style.background = `linear-gradient(to right, var(--primary-color) ${val}%, var(--card-border) ${val}%)`;
        };
        
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            updateSliderColor(slider);
            slider.addEventListener('input', (e) => updateSliderColor(e.target));
        });

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
                this.hideModal('modal-universal');
            });
        }

        const btnCreate = document.getElementById('btn-create');
        if (btnCreate) {
            btnCreate.addEventListener('click', async () => {
                // 新的创建逻辑：读取侧边栏第一行及相关参数
                const userGuessData = GraphManager.getUserGuessData();
                
                if (userGuessData && MathEngine.isValid(userGuessData.latex)) {
                    let renderedLatex = userGuessData.latex;
                    try {
                        if (window.katex) {
                            renderedLatex = katex.renderToString(userGuessData.latex, { throwOnError: false, displayMode: true });
                        }
                    } catch (e) {
                        console.error("KaTeX render error:", e);
                    }

                    const msg = userGuessData.params && Object.keys(userGuessData.params).length > 0
                        ? `是否使用以下表达式及参数 (${Object.keys(userGuessData.params).join(', ')}) 创建新关卡？<br><br><div style="text-align:center;font-size:1.2rem;overflow-x:auto;">${renderedLatex}</div>`
                        : `是否使用以下表达式创建新关卡？<br><br><div style="text-align:center;font-size:1.2rem;overflow-x:auto;">${renderedLatex}</div>`;

                    const confirmed = await this.showConfirm(msg, MESSAGES.get('game.createLevelTitle'));
                    if (confirmed) {
                        GameLogic.startLevel({
                            t: userGuessData.latex,
                            p: userGuessData.params
                        });
                        // 自定义关卡视为随机模式的一种（非预设）
                        this.setMode('random');
                        this.showMessage(MESSAGES.get('game.createLevelSuccess'), "success");
                    }
                } else {
                    this.showMessage(MESSAGES.get('game.createLevelRequireInput'), "error");
                }
            });
        }

        const btnShare = document.getElementById('btn-share');
        if (btnShare) {
            btnShare.addEventListener('click', () => {
                const link = GameLogic.getShareLink();
                Utils.copyToClipboard(link);
            });
        }

        // 规则按钮
        const btnRules = document.getElementById('btn-rules');
        if (btnRules) {
            btnRules.addEventListener('click', () => {
                this.openPanel('article', '规则说明', {
                    backAction: () => {
                        this.openPanel('options', '设置中心', {
                            backAction: () => this.hideModal('modal-universal')
                        });
                    }
                });
                this.loadRules();
            });
        }

        // 关于按钮
        const btnAbout = document.getElementById('btn-about');
        if (btnAbout) {
            btnAbout.addEventListener('click', () => {
                this.openPanel('article', '关于游戏', {
                    backAction: () => {
                        this.openPanel('options', '设置中心', {
                            backAction: () => this.hideModal('modal-universal')
                        });
                    }
                });
                this.loadAbout();
            });
        }

        // 更新日志按钮
        const btnChangelog = document.getElementById('btn-changelog');
        if (btnChangelog) {
            btnChangelog.addEventListener('click', () => {
                this.openPanel('article', '更新日志', {
                    backAction: () => {
                        this.openPanel('options', '设置中心', {
                            backAction: () => this.hideModal('modal-universal')
                        });
                    }
                });
                this.loadChangelog();
            });
        }
        
        // 选项按钮
        const btnOptions = document.getElementById('btn-options');
        if (btnOptions) {
            btnOptions.addEventListener('click', () => {
                // 初始化速通模式按钮状态
                const isSpeedrun = localStorage.getItem('guessfunc_speedrun_mode') === 'true';
                const speedrunText = document.getElementById('speedrun-text');
                const speedrunIcon = document.querySelector('.speedrun-icon');
                if (speedrunText) {
                    speedrunText.textContent = isSpeedrun ? '速通模式: 开' : '速通模式: 关';
                }
                if (speedrunIcon) {
                    speedrunIcon.innerHTML = isSpeedrun 
                        ? '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: var(--primary-color);"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
                        : '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
                }
                
                // 初始化深浅模式状态
                const themeIcons = document.querySelectorAll('.theme-icon');
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                themeIcons.forEach(icon => {
                    icon.innerHTML = currentTheme === 'dark'
                        ? '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
                        : '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
                });
                
                // 初始化主题色按钮状态
                const currentPrimaryColor = document.documentElement.style.getPropertyValue('--primary-color') || '#2196F3';
                document.querySelectorAll('.theme-color-btn').forEach(btn => {
                    const color = btn.getAttribute('data-color');
                    if (color === currentPrimaryColor) {
                        btn.classList.add('active');
                        btn.style.border = '2px solid white';
                        btn.style.boxShadow = `0 0 0 1px ${color}`;
                    } else {
                        btn.classList.remove('active');
                        btn.style.border = '2px solid transparent';
                        btn.style.boxShadow = 'none';
                    }
                });

                this.openPanel('options', '设置中心', {
                    backAction: () => this.hideModal('modal-universal')
                });
            });
        }

        // Mobile sidebar auto-close on outside click
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('app-sidebar');
                const btnOpen = document.getElementById('btn-open-sidebar');
                if (sidebar && sidebar.classList.contains('open') && 
                    !sidebar.contains(e.target) && 
                    e.target !== btnOpen && 
                    !btnOpen.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
        
        // 存档管理
        const btnSaveManagement = document.getElementById('btn-save-management');
        if (btnSaveManagement) {
            btnSaveManagement.addEventListener('click', () => {
                this.renderSaveSlots();
                const assistModeText = document.getElementById('assist-mode-text');
                const assistIcon = document.querySelector('.assist-icon');
                const isAssist = StorageManager.isAssistMode();
                if (assistModeText) {
                    assistModeText.textContent = isAssist ? '剧情预览模式: 开' : '剧情预览模式: 关';
                }
                if (assistIcon) {
                    assistIcon.innerHTML = isAssist
                        ? '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: var(--primary-color);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>'
                        : '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
                }
                this.openPanel('save-management', '存档管理', {
                    backAction: () => {
                        this.openPanel('options', '设置中心', {
                            backAction: () => this.hideModal('modal-universal')
                        });
                    }
                });
            });
        }

        // 游戏统计
        const btnStatistics = document.getElementById('btn-statistics');
        if (btnStatistics) {
            btnStatistics.addEventListener('click', () => {
                const completedCount = StorageManager.getCompletedLevels().length;
                const currentRoute = window.ROUTES.find(r => r.id === window.currentRouteId);
                
                let totalLevels = 0;
                let unlockedLevels = 0;
                let unlockedChapters = 0;
                
                if (currentRoute) {
                    totalLevels = currentRoute.levels.length;
                    
                    // 计算已解锁章节和关卡
                    currentRoute.regions.forEach(region => {
                        const regionUnlock = StorageManager.checkRegionUnlock ? StorageManager.checkRegionUnlock(region) : { unlocked: true };
                        if (regionUnlock.unlocked || StorageManager.isAssistMode()) {
                            unlockedChapters++;
                            
                            region.levels.forEach(levelId => {
                                const levelData = window.LEVELS.find(l => l.id === levelId);
                                if (levelData) {
                                    const levelUnlock = StorageManager.checkLevelUnlock ? StorageManager.checkLevelUnlock(levelData, region) : { unlocked: true };
                                    if (levelUnlock.unlocked || StorageManager.isAssistMode()) {
                                        unlockedLevels++;
                                    }
                                }
                            });
                        }
                    });
                }

                document.getElementById('stat-completed-levels').textContent = `${completedCount}`;
                document.getElementById('stat-unlocked-levels').textContent = `${unlockedLevels} / ${totalLevels}`;
                document.getElementById('stat-unlocked-chapters').textContent = `${unlockedChapters} / ${currentRoute ? currentRoute.regions.length : 0}`;
                document.getElementById('stat-current-route').textContent = currentRoute ? currentRoute.title : '未知';
                
                document.getElementById('stat-music-status').textContent = localStorage.getItem('guessfunc_music_enabled') !== 'false' ? '开启' : '关闭';
                document.getElementById('stat-speedrun-status').textContent = localStorage.getItem('guessfunc_speedrun_mode') === 'true' ? '开启' : '关闭';
                document.getElementById('stat-assist-status').textContent = StorageManager.isAssistMode() ? '开启' : '关闭';

                this.openPanel('statistics', '游戏统计', {
                    backAction: () => {
                        this.openPanel('options', '设置中心', {
                            backAction: () => this.hideModal('modal-universal')
                        });
                    }
                });
            });
        }

        const btnAssistMode = document.getElementById('btn-assist-mode-toggle');
        if (btnAssistMode) {
            btnAssistMode.addEventListener('click', () => {
                const current = StorageManager.isAssistMode();
                const next = !current;
                StorageManager.setAssistMode(next);
                const text = document.getElementById('assist-mode-text');
                const assistIcon = document.querySelector('.assist-icon');
                if (text) {
                    text.textContent = next ? '剧情预览模式: 开' : '剧情预览模式: 关';
                }
                if (assistIcon) {
                    assistIcon.innerHTML = next
                        ? '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: var(--primary-color);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>'
                        : '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
                }
                this.showMessage(MESSAGES.get('settings.assistModeToggle', { status: next ? MESSAGES.get('settings.statusOn') : MESSAGES.get('settings.statusOff') }), "success");
            });
        }
        
        // 速通模式按钮
        const btnSpeedrun = document.getElementById('btn-speedrun-toggle');
        if (btnSpeedrun) {
            btnSpeedrun.addEventListener('click', () => {
                const current = localStorage.getItem('guessfunc_speedrun_mode') === 'true';
                const next = !current;
                localStorage.setItem('guessfunc_speedrun_mode', next);
                
                const speedrunText = document.getElementById('speedrun-text');
                const speedrunIcon = document.querySelector('.speedrun-icon');
                if (speedrunText) {
                    speedrunText.textContent = next ? '速通模式: 开' : '速通模式: 关';
                }
                if (speedrunIcon) {
                    speedrunIcon.innerHTML = next
                        ? '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: var(--primary-color);"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
                        : '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
                }
                
                this.showMessage(MESSAGES.get('settings.speedrunModeToggle', { status: next ? MESSAGES.get('settings.speedrunOn') : MESSAGES.get('settings.speedrunOff') }), "success");
            });
        }
        
        // 导出存档
        const btnExportSave = document.getElementById('btn-export-save');
        if (btnExportSave) {
            btnExportSave.addEventListener('click', () => {
                const save = StorageManager.exportSave();
                Utils.copyToClipboard(save);
            });
        }
        
        // 导入存档
        const btnImportSave = document.getElementById('btn-import-save');
        if (btnImportSave) {
            btnImportSave.addEventListener('click', async () => {
                const save = await this.showPrompt(MESSAGES.get('save.importPromptMsg'), "", MESSAGES.get('save.importPromptTitle'));
                if (save) {
                    const importResult = StorageManager.importSave(save);
                    if (importResult === 'migrated') {
                        this.showMessage(MESSAGES.get('save.legacyDetected'), "success");
                        this.renderLevelList(); // 刷新
                    } else if (importResult) {
                        this.showMessage(MESSAGES.get('save.importSuccess'), "success");
                        this.renderLevelList(); // 刷新
                    } else {
                        this.showMessage(MESSAGES.get('save.importFailed'), "error");
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
        
        // 主题设置菜单项
        const btnThemeSettings = document.getElementById('btn-theme-settings');
        if (btnThemeSettings) {
            btnThemeSettings.addEventListener('click', () => {
                this.openPanel('theme-settings', '主题设置', {
                    backAction: () => {
                        this.openPanel('options', '设置中心', {
                            backAction: () => this.hideModal('modal-universal')
                        });
                    }
                });
                
                // 初始化颜色选择器
                const colorInput = document.getElementById('theme-color-input');
                const customColorPreview = document.getElementById('custom-color-preview');
                const currentColor = document.documentElement.style.getPropertyValue('--primary-color') || '#2196F3';
                
                if (colorInput) {
                    colorInput.value = currentColor.trim().toUpperCase();
                }
                if (customColorPreview) {
                    customColorPreview.style.backgroundColor = currentColor.trim();
                }

                // 初始化深浅模式文本
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                const themeIconInPanel = document.querySelector('.theme-icon');
                if (themeIconInPanel) {
                    themeIconInPanel.innerHTML = currentTheme === 'dark'
                        ? '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
                        : '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
                }
                
                // 初始化深浅模式开关
                const toggleDarkMode = document.getElementById('toggle-dark-mode');
                if (toggleDarkMode) {
                    toggleDarkMode.checked = currentTheme === 'dark';
                }
            });
        }
        
        // 深浅模式开关
        const toggleDarkMode = document.getElementById('toggle-dark-mode');
        if (toggleDarkMode) {
            toggleDarkMode.addEventListener('change', (e) => {
                const isDark = e.target.checked;
                const newTheme = isDark ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('guessfunc_theme', newTheme);
                
                // 更新面板内的图标
                const themeIcons = document.querySelectorAll('.theme-icon');
                themeIcons.forEach(icon => {
                    icon.innerHTML = isDark
                        ? '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
                        : '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
                });
            });
        }
        
        // 颜色选择器事件
        const themeColorInput = document.getElementById('theme-color-input');
        const customColorBtn = document.getElementById('custom-color-btn');
        const customColorPreview = document.getElementById('custom-color-preview');
        const customColorPalette = document.getElementById('custom-color-palette');
        
        // 丰富的预设调色板颜色
        const paletteColors = [
            '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
            '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
            '#795548', '#9E9E9E', '#607D8B', '#000000', '#D32F2F', '#C2185B', '#7B1FA2', '#512DA8',
            '#303F9F', '#1976D2', '#0288D1', '#0097A7', '#00796B', '#388E3C', '#689F38', '#AFB42B'
        ];

        // 初始化调色板
        if (customColorPalette) {
            paletteColors.forEach(color => {
                const colorDiv = document.createElement('div');
                colorDiv.style.backgroundColor = color;
                colorDiv.style.width = '100%';
                colorDiv.style.aspectRatio = '1 / 1';
                colorDiv.style.borderRadius = '50%';
                colorDiv.style.cursor = 'pointer';
                colorDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                colorDiv.style.transition = 'transform 0.2s';
                colorDiv.onmouseover = () => colorDiv.style.transform = 'scale(1.2)';
                colorDiv.onmouseout = () => colorDiv.style.transform = 'scale(1)';
                colorDiv.onclick = () => {
                    if (themeColorInput) themeColorInput.value = color;
                    if (customColorPreview) customColorPreview.style.backgroundColor = color;
                    this.applyPrimaryColor(color);
                    localStorage.setItem('guessfunc_primary_color', color);
                    // 点击后自动收起
                    customColorPalette.style.display = 'none';
                    customColorPalette.classList.add('hidden');
                };
                customColorPalette.appendChild(colorDiv);
            });
        }

        if (customColorBtn && customColorPalette) {
            customColorBtn.addEventListener('click', () => {
                if (customColorPalette.classList.contains('hidden')) {
                    customColorPalette.classList.remove('hidden');
                    customColorPalette.style.display = 'grid';
                } else {
                    customColorPalette.classList.add('hidden');
                    customColorPalette.style.display = 'none';
                }
            });
        }
        
        if (themeColorInput) {
            themeColorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/i.test(color) || /^#[0-9A-Fa-f]{3}$/i.test(color)) {
                    if (customColorPreview) customColorPreview.style.backgroundColor = color;
                    this.applyPrimaryColor(color);
                }
            });
            themeColorInput.addEventListener('change', (e) => {
                const color = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/i.test(color) || /^#[0-9A-Fa-f]{3}$/i.test(color)) {
                    this.applyPrimaryColor(color);
                    localStorage.setItem('guessfunc_primary_color', color);
                }
            });
        }
        
        // 预设主题色按钮
        document.querySelectorAll('.theme-color-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                if (themeColorInput) themeColorInput.value = color.toUpperCase();
                if (customColorPreview) customColorPreview.style.backgroundColor = color;
                this.applyPrimaryColor(color);
                localStorage.setItem('guessfunc_primary_color', color);
            });
        });

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
                const inputChatPrompt = document.getElementById('ai-chat-system-prompt');
                if (inputChatPrompt && typeof AIManager !== 'undefined') {
                    inputChatPrompt.value = AIManager.getChatSystemPrompt();
                }
                const toggleProxy = document.getElementById('toggle-use-proxy');
                if (toggleProxy) {
                    const savedProxyPref = localStorage.getItem('guessfunc_use_proxy');
                    // 默认开启代理。如果用户明确选择了关闭，才为 false
                    toggleProxy.checked = savedProxyPref !== 'false';
                }

                this.openPanel('api-settings', 'AI 设置', {
                    backAction: () => {
                        this.openPanel('options', '设置中心', {
                            backAction: () => this.hideModal('modal-universal')
                        });
                    }
                });
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
                
                this.showMessage(MESSAGES.get('settings.saveSuccess'), "success");
            });
        }

        // 保存系统提示词
        const btnSaveSystemPrompt = document.getElementById('btn-save-system-prompt');
        if (btnSaveSystemPrompt) {
            btnSaveSystemPrompt.addEventListener('click', () => {
                const inputPrompt = document.getElementById('input-system-prompt');
                if (inputPrompt && typeof AIManager !== 'undefined') {
                    AIManager.setSystemPrompt(inputPrompt.value);
                }
                
                const inputChatPrompt = document.getElementById('ai-chat-system-prompt');
                if (inputChatPrompt && typeof AIManager !== 'undefined') {
                    AIManager.setChatSystemPrompt(inputChatPrompt.value);
                }
                
                this.showMessage(MESSAGES.get('settings.promptSaved'), "success");
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
                }
                
                const inputChatPrompt = document.getElementById('ai-chat-system-prompt');
                if (inputChatPrompt && typeof AIManager !== 'undefined') {
                    inputChatPrompt.value = AIManager.DEFAULT_CHAT_SYSTEM_PROMPT;
                    AIManager.setChatSystemPrompt('');
                }
                
                this.showMessage(MESSAGES.get('settings.promptReset'), "success");
            });
        }

        // 眼睛按钮：切换 API Key 显示/隐藏
        const btnTogglePassword = document.getElementById('btn-toggle-password');
        const inputApiKey = document.getElementById('input-api-key');
        if (btnTogglePassword && inputApiKey) {
            btnTogglePassword.addEventListener('click', () => {
                const isPassword = inputApiKey.type === 'password';
                inputApiKey.type = isPassword ? 'text' : 'password';
                if (isPassword) {
                    btnTogglePassword.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
                } else {
                    btnTogglePassword.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
                }
                btnTogglePassword.style.opacity = isPassword ? '1' : '0.6';
            });
        }
        
        // 清空存档
        const btnClearSave = document.getElementById('btn-clear-save');
        if (btnClearSave) {
            btnClearSave.addEventListener('click', async () => {
                const isConfirmed = await this.showConfirm(MESSAGES.get('save.clearConfirmMsg'), MESSAGES.get('save.clearConfirmTitle'));
                if (isConfirmed) {
                    StorageManager.clearSave();
                    this.renderLevelList(); // 刷新
                    this.showMessage(MESSAGES.get('save.cleared'), "success");
                    this.hideModal('modal-universal');
                }
            });
        }
        
        // 开始关卡按钮 (指引弹窗中)
        const btnStartLevel = document.getElementById('btn-start-level');
        if (btnStartLevel) {
            btnStartLevel.addEventListener('click', () => {
                // 如果有绑定的回调（比如开启关卡逻辑），保存它
                const cb = this.modalCallbacks['modal-universal'];
                this.modalCallbacks['modal-universal'] = null; // 移除，避免 hideModal 再次触发或触发多次
                
                this.hideModal('modal-universal');
                
                if (cb) {
                    // 等待弹窗关闭动画后再执行
                    setTimeout(cb, 300);
                }
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
        
        // 检查主题色
        const savedPrimaryColor = localStorage.getItem('guessfunc_primary_color');
        if (savedPrimaryColor) {
            document.documentElement.style.setProperty('--primary-color', savedPrimaryColor);
        }
    },

    applyPrimaryColor: function(hexColor) {
        document.documentElement.style.setProperty('--primary-color', hexColor);
        
        // 解析 hex 为 rgb
        let r = 0, g = 0, b = 0;
        if (hexColor.length === 4) {
            r = parseInt(hexColor[1] + hexColor[1], 16);
            g = parseInt(hexColor[2] + hexColor[2], 16);
            b = parseInt(hexColor[3] + hexColor[3], 16);
        } else if (hexColor.length === 7) {
            r = parseInt(hexColor.slice(1, 3), 16);
            g = parseInt(hexColor.slice(3, 5), 16);
            b = parseInt(hexColor.slice(5, 7), 16);
        }
        
        document.documentElement.style.setProperty('--primary-color-rgb', `${r}, ${g}, ${b}`);
        document.documentElement.style.setProperty('--primary-color-light', `rgba(${r}, ${g}, ${b}, 0.15)`);
        document.documentElement.style.setProperty('--primary-color-transparent', `rgba(${r}, ${g}, ${b}, 0.3)`);
        document.documentElement.style.setProperty('--primary-color-hover', `rgba(${r}, ${g}, ${b}, 0.8)`);
        
        // 计算浅色版主题色 (用于深色模式下提高对比度)
        const mixWhite = (val) => Math.round(val + (255 - val) * 0.4);
        const lr = mixWhite(r), lg = mixWhite(g), lb = mixWhite(b);
        document.documentElement.style.setProperty('--primary-color-lighter', `rgb(${lr}, ${lg}, ${lb})`);
        
        // 更新所有的滑块颜色
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            // 手动触发一次更新
            const e = new Event('input');
            slider.dispatchEvent(e);
        });
    },

    toggleTheme: function() {
        const toggleDarkMode = document.getElementById('toggle-dark-mode');
        if (toggleDarkMode) {
            toggleDarkMode.checked = !toggleDarkMode.checked;
            toggleDarkMode.dispatchEvent(new Event('change'));
        }
    },

    loadRules: function() {
        const container = document.getElementById('article-content');
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
        const container = document.getElementById('article-content');
        if (!container) return;

        fetch('about.md')
            .then(response => response.text())
            .then(text => {
                this.renderMarkdown(container, text);
            })
            .catch(err => {
                Logger.error("Failed to load about info:", err);
                container.textContent = MESSAGES.get('settings.aboutLoadFailed');
            });
    },

    loadChangelog: function() {
        const container = document.getElementById('article-content');
        if (!container) return;

        fetch('changelog.md')
            .then(response => response.text())
            .then(text => {
                this.renderMarkdown(container, text);
            })
            .catch(err => {
                Logger.error("Failed to load changelog:", err);
                container.textContent = MESSAGES.get('settings.changelogLoadFailed');
            });
    },
    
    /**
     * 渲染 Markdown 内容
     */
    renderMarkdown: function(container, text) {
        if (window.marked) {
            // ...
            const mathBlocks = [];
            const protectedText = text.replace(/(\$\$[\s\S]*?\$\$)|(\$[^$\n]*?\$)/g, (match) => {
                mathBlocks.push(match);
                return `MATHBLOCK${mathBlocks.length - 1}BLOCKMATH`;
            });
            
            let html = marked.parse(protectedText);
            html = html.replace(/MATHBLOCK(\d+)BLOCKMATH/g, (match, index) => {
                return mathBlocks[parseInt(index)];
            });
            container.innerHTML = html;
            
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

    renderSaveSlots: function() {
        const list = document.getElementById('save-slots-list');
        if (!list) return;
        list.innerHTML = '';
        
        const currentSlot = StorageManager.getCurrentSlot();
        
        for (let i = 1; i <= 5; i++) {
            const btn = document.createElement('button');
            btn.className = 'option-item';
            btn.style.justifyContent = 'space-between';
            
            const slotKey = i === 1 ? StorageManager.STORAGE_KEY : `${StorageManager.STORAGE_KEY}_slot${i}`;
            const data = localStorage.getItem(slotKey);
            
            let info = '空存档';
            if (data) {
                info = '有存档';
            }
            
            const isCurrent = currentSlot === String(i);
            if (isCurrent) {
                btn.style.borderColor = 'var(--primary-color)';
                btn.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.1)';
            }
            
            btn.innerHTML = `
                <span>槽位 ${i} ${isCurrent ? '(当前)' : ''}</span>
                <span style="font-size: 0.85em; opacity: 0.7;">${info}</span>
            `;
            
            btn.addEventListener('click', () => {
                StorageManager.setCurrentSlot(String(i));
                this.renderSaveSlots();
                this.showMessage(MESSAGES.get('save.slotSwitched', { slot: i }), "success");
                this.renderLevelList(); // 刷新关卡列表
            });
            
            list.appendChild(btn);
        }
    },
    
    currentViewRegionId: null,

    /**
     * 渲染关卡列表
     */
    renderLevelList: function() {
        const container = document.getElementById('levels-list');
        if (!container) return;
        
        container.innerHTML = '';
        if (!window.ROUTES || window.ROUTES.length === 0) {
            container.innerHTML = `<p>${MESSAGES.get('ui.noPresetLevels')}</p>`;
            return;
        }

        Logger.log("[DEBUG] window.currentRouteId:", window.currentRouteId);
        Logger.log("[DEBUG] this.currentViewRegionId:", this.currentViewRegionId);

        // 添加线路选择器 (美化下拉框)
        if (window.ROUTES.length > 0 && !this.currentViewRegionId) {
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
            
            container.appendChild(routeSelectorContainer);
        }

        // 支持区域划分
        let regions = window.REGIONS || [{
            id: 'default',
            title: '所有关卡',
            unlock: null,
            levels: window.LEVELS.map(l => l.id)
        }];
        
        // 确保根据当前线路过滤区域
        if (window.ROUTES && window.currentRouteId) {
            const currentRoute = window.ROUTES.find(r => r.id === window.currentRouteId);
            if (currentRoute && currentRoute.regions) {
                regions = currentRoute.regions;
            }
        }

        container.className = 'levels-container';

        if (this.currentViewRegionId) {
            // ==== 渲染特定章节的关卡列表 ====
            const region = regions.find(r => r.id === this.currentViewRegionId);
            if (!region) {
                this.currentViewRegionId = null;
                this.renderLevelList();
                return;
            }

            const regionHeader = document.createElement('div');
            regionHeader.className = 'level-region-header';
            regionHeader.style.marginBottom = '10px';
            regionHeader.style.paddingBottom = '5px';
            regionHeader.style.borderBottom = '2px solid var(--card-border)';
            regionHeader.style.display = 'flex';
            regionHeader.style.justifyContent = 'space-between';
            regionHeader.style.alignItems = 'center';
            
            const titleDiv = document.createElement('div');
            titleDiv.innerHTML = `<h3 style="margin:0; font-size: 1.2rem;">${region.title}</h3>`;
            regionHeader.appendChild(titleDiv);

            if (region.description || region.descriptionPath) {
                if (StorageManager.isChapterSeen(region.id) || StorageManager.isAssistMode()) {
                    const storyBtn = document.createElement('button');
                    storyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:-2px;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>剧情';
                    storyBtn.className = 'secondary-btn'; 
                    storyBtn.style.padding = '6px 12px';
                    storyBtn.style.fontSize = '0.9rem';
                    storyBtn.style.marginLeft = 'auto'; 
                    storyBtn.onclick = (e) => {
                        this.showStory({
                            id: region.id,
                            title: region.title + " - 剧情回顾",
                            description: region.description,
                            descriptionPath: region.descriptionPath,
                            levels: region.levels // Pass levels for review
                        }, true); // isReview = true
                    };
                    regionHeader.appendChild(storyBtn);
                }
            }

            if (region.fakeEndings && region.fakeEndings.length > 0) {
                region.fakeEndings.forEach(fakeEnding => {
                    if (StorageManager.isChapterSeen(fakeEnding.id) || StorageManager.isAssistMode()) {
                        const fakeBtn = document.createElement('button');
                        fakeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:-2px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' + (fakeEnding.title || '结局剧情');
                        fakeBtn.className = 'secondary-btn';
                        fakeBtn.style.padding = '6px 12px';
                        fakeBtn.style.fontSize = '0.9rem';
                        fakeBtn.style.marginLeft = '10px';
                        fakeBtn.style.color = '#9c27b0';
                        fakeBtn.style.borderColor = '#9c27b0';
                        fakeBtn.onclick = () => {
                            this.showStory({
                                title: fakeEnding.title || '假结局',
                                descriptionPath: fakeEnding.descriptionPath
                            });
                        };
                        regionHeader.appendChild(fakeBtn);
                    }
                });
            }

            container.appendChild(regionHeader);

            const levelsContainer = document.createElement('div');
            levelsContainer.className = 'levels-grid';
            container.appendChild(levelsContainer);

            region.levels.forEach(levelId => {
                const levelData = window.LEVELS.find(l => l.id === levelId);
                const levelIndex = window.LEVELS.findIndex(l => l.id === levelId);
                
                if (!levelData) return;

                const btn = document.createElement('button');
                const isCompleted = StorageManager.isLevelCompleted(levelId);
                const unlockStatus = StorageManager.checkLevelUnlock ? StorageManager.checkLevelUnlock(levelData, region) : { unlocked: true };
                const isLocked = !unlockStatus.unlocked;

                let className = 'level-card';
                if (isCompleted) className += ' completed';
                if (isLocked) className += ' locked';
                
                btn.className = className;

                btn.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div>
                            <h3 style="margin: 0; text-align: left;">${levelData.title}</h3>
                            <p style="margin: 5px 0 0 0; text-align: left; font-size: 0.85em; opacity: 0.8;">${isLocked ? '点击查看条件' : '点击开始挑战'}</p>
                        </div>
                    </div>
                `;
                
                btn.addEventListener('click', () => {
                    if (isLocked) {
                        this.showMessage(MESSAGES.get('game.levelLocked', { reason: unlockStatus.reason || '未知条件' }), "error");
                        return;
                    }
                    
                    const startAction = () => {
                        GameLogic.startPresetLevel(levelIndex);
                        this.setMode('preset');
                    };

                    const isSpeedrun = localStorage.getItem('guessfunc_speedrun_mode') === 'true';
                    if (!isSpeedrun && (region.description || region.descriptionPath) && !StorageManager.isChapterSeen(region.id)) {
                        StorageManager.markChapterSeen(region.id);
                        setTimeout(() => {
                            this.showStory(region);
                            this.modalCallbacks['modal-universal'] = startAction;
                        }, 50);
                    } else {
                        startAction();
                    }
                });
                levelsContainer.appendChild(btn);
            });

            // 结局按钮
            const currentRoute = window.ROUTES.find(r => r.id === window.currentRouteId);
            if (currentRoute && currentRoute.endingPath) {
                const isLastRegion = regions[regions.length - 1].id === region.id;
                if (isLastRegion) {
                    const lastLevelId = currentRoute.levels[currentRoute.levels.length - 1].id;
                    if (StorageManager.isLevelCompleted(lastLevelId) || StorageManager.isAssistMode()) {
                        const endingContainer = document.createElement('div');
                        endingContainer.style.marginTop = '30px';
                        endingContainer.style.display = 'flex';
                        endingContainer.style.flexDirection = 'column';
                        endingContainer.style.alignItems = 'center';
                        endingContainer.style.gap = '15px';
                        
                        const endingBtn = document.createElement('button');
                        endingBtn.className = 'primary-btn';
                        endingBtn.style.padding = '12px 24px';
                        endingBtn.style.fontSize = '1.1rem';
                        endingBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-3px;"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>结局剧情';
                        
                        const toggleAnimWrapper = document.createElement('div');
                        toggleAnimWrapper.className = 'ending-anim-toggle-wrapper';
                        toggleAnimWrapper.style.margin = '0';
                        
                        const savedAnimPref = localStorage.getItem('guessfunc_ending_anim');
                        const isAnimChecked = savedAnimPref !== 'false';
                        
                        toggleAnimWrapper.innerHTML = `
                            <input type="checkbox" id="toggle-ending-anim-local" class="ending-anim-checkbox" ${isAnimChecked ? 'checked' : ''}>
                            <label for="toggle-ending-anim-local" class="ending-anim-label" style="font-size: 0.95rem;">
                                <div class="ending-anim-switch"></div>
                                <span class="ending-anim-text">播放结局动画</span>
                            </label>
                        `;

                        // 监听更改保存
                        setTimeout(() => {
                            const checkbox = document.getElementById('toggle-ending-anim-local');
                            if (checkbox) {
                                checkbox.addEventListener('change', (e) => {
                                    localStorage.setItem('guessfunc_ending_anim', e.target.checked);
                                });
                            }
                        }, 0);

                        endingBtn.onclick = () => {
                            const isSpeedrun = localStorage.getItem('guessfunc_speedrun_mode') === 'true';
                            const checkbox = document.getElementById('toggle-ending-anim-local');
                            const playAnimation = checkbox ? checkbox.checked : true;
                            
                            this.hideModal('modal-universal');
                            
                            if (!isSpeedrun && playAnimation) {
                                setTimeout(() => {
                                    if (typeof this.playEndingAnimation === 'function') {
                                        this.playEndingAnimation(() => {
                                            this.showStory({ title: "结局", descriptionPath: currentRoute.endingPath, isEnding: true });
                                        });
                                    } else {
                                        this.showStory({ title: "结局", descriptionPath: currentRoute.endingPath, isEnding: true });
                                    }
                                }, 300);
                            } else {
                                setTimeout(() => {
                                    this.showStory({ title: "结局", descriptionPath: currentRoute.endingPath, isEnding: true });
                                }, 300);
                            }
                        };
                        
                        endingContainer.appendChild(endingBtn);
                        // 所有路线都可以选择是否播放结局动画
                        endingContainer.appendChild(toggleAnimWrapper);
                        container.appendChild(endingContainer);
                    }
                }
            }

        } else {
            // ==== 渲染章节列表 ====
            let hasShownLockedRegion = false;
            
            const currentRoute = window.ROUTES ? window.ROUTES.find(r => r.id === window.currentRouteId) : null;

            const regionsGrid = document.createElement('div');
            regionsGrid.className = 'levels-grid';
            container.appendChild(regionsGrid);

            if (regions.length === 0) {
                container.innerHTML = "<p>当前线路没有可用的章节。</p>";
                return;
            }

            regions.forEach(region => {
                try {
                    const regionUnlockStatus = StorageManager.checkRegionUnlock ? StorageManager.checkRegionUnlock(region) : { unlocked: true };
                    const isRegionLocked = !regionUnlockStatus.unlocked;

                    if (isRegionLocked && !StorageManager.isAssistMode()) {
                        if (hasShownLockedRegion) {
                            return;
                        }
                        hasShownLockedRegion = true;
                    }

                    const completedLevels = region.levels.filter(id => StorageManager.isLevelCompleted(id)).length;
                    const totalLevels = region.levels.length;


                const isCompleted = completedLevels === totalLevels && totalLevels > 0;
                const isInProgress = completedLevels > 0 && completedLevels < totalLevels;

                let hasTrueEnding = false;
                let hasFakeEnding = false;
                if (currentRoute && currentRoute.endingPath && regions[regions.length - 1].id === region.id) {
                    hasTrueEnding = true;
                }
                if (region.fakeEndings && region.fakeEndings.length > 0) {
                    hasFakeEnding = true;
                }

                let iconsHtml = '';
                if (hasTrueEnding) {
                    iconsHtml += '<svg class="ending-icon" viewBox="0 0 24 24" width="18" height="18" stroke="var(--success-color)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" title="包含真结局"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>';
                }
                if (hasFakeEnding) {
                    iconsHtml += `<svg class="ending-icon" viewBox="0 0 24 24" width="18" height="18" stroke="var(--success-color)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" title="包含假结局"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
                }

                const btn = document.createElement('button');
                let className = 'level-card';
                if (isCompleted) className += ' completed';
                else if (isInProgress) className += ' in-progress';
                if (isRegionLocked) className += ' locked';
                
                btn.className = className;
                
                btn.innerHTML = `
                    <div class="level-card-content">
                        <div>
                            <h3 style="margin: 0; text-align: left;">${region.title}</h3>
                            <p style="margin: 5px 0 0 0; text-align: left; font-size: 0.85em; opacity: 0.8;">${isRegionLocked ? '点击查看条件' : '点击进入章节'}</p>
                        </div>
                        ${!isRegionLocked ? `<div class="region-progress">${completedLevels}/${totalLevels}</div>` : ''}
                    </div>
                    <div class="ending-icons-container">${iconsHtml}</div>
                `;
                
                btn.addEventListener('click', () => {
                    if (isRegionLocked) {
                        this.showMessage(MESSAGES.get('game.regionLocked', { reason: regionUnlockStatus.reason || '未知条件' }), "error");
                        return;
                    }
                    this.currentViewRegionId = region.id;
                    
                    // 使用平滑动画切换面板内容
                    this.openPanel('levels', region.title, {
                        backAction: () => {
                            this.currentViewRegionId = null;
                            this.openPanel('levels', '选择关卡', {});
                        }
                    });
                });
                
                regionsGrid.appendChild(btn);
                } catch (e) {
                    Logger.error("[UIManager] Error processing region", region.id, e);
                }
            });
        }

        // 添加未完待续提示
        const currentRoute = window.ROUTES.find(r => r.id === window.currentRouteId);
        if (!this.currentViewRegionId && currentRoute && currentRoute.showToBeContinued) {
            let isLastChapterUnlocked = false;
            if (currentRoute.regions && currentRoute.regions.length > 0) {
                const lastRegion = currentRoute.regions[currentRoute.regions.length - 1];
                const unlockStatus = StorageManager.checkRegionUnlock ? StorageManager.checkRegionUnlock(lastRegion) : { unlocked: true };
                isLastChapterUnlocked = unlockStatus.unlocked;
            }
            if (isLastChapterUnlocked || StorageManager.isAssistMode()) {
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
        Logger.log(`[UIManager] showLevelInstruction called for level: ${levelData.title}`);
        if (!levelData.descriptionPath && !levelData.description) {
            Logger.log(`[UIManager] No description found for level, skipping instruction modal`);
            return false;
        }
        
        const isSpeedrun = localStorage.getItem('guessfunc_speedrun_mode') === 'true';
        if (isSpeedrun) {
            Logger.log(`[UIManager] Speedrun mode is ON, skipping instruction modal`);
            return false;
        }

        // 播放正常剧情音乐
        if (window.AudioManager) {
            AudioManager.playStoryMusic(false);
        }

        const container = document.getElementById('article-content');
        if (container) {
            // Show modal immediately with loading state
            Logger.log(`[UIManager] Opening article panel for level instruction`);
            this.openPanel('article', '关卡剧情', { 
                showMusic: true, 
                showStartBtn: true,
                backAction: () => {
                    this.openPanel('levels', '选择关卡', {
                        backAction: () => this.hideModal('modal-universal')
                    });
                }
            });
            container.innerHTML = '<p>加载中...</p>';

            if (levelData.descriptionPath) {
                Logger.log(`[UIManager] Fetching level description from: ${levelData.descriptionPath}`);
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
                Logger.log(`[UIManager] Rendering inline level description`);
                this.renderMarkdown(container, levelData.description);
            }
            return true;
        } else {
            Logger.warn(`[UIManager] article-content container not found!`);
            return false;
        }
    },

    /**
     * 显示剧情
     * @param {Object} regionData
     * @param {boolean} isReview 是否为回顾模式，回顾模式下会追加已解锁关卡的剧情
     */
    showStory: function(regionData, isReview = false) {
        Logger.log(`[UIManager] showStory called for region/level:`, regionData.title || regionData.id);
        if (!regionData.descriptionPath && !regionData.description) {
            Logger.warn(`[UIManager] No description or descriptionPath found for story`);
            return;
        }
        
        // 播放对应剧情音乐
        if (window.AudioManager) {
            const isEndingMusic = regionData.isEnding || regionData.type === 'true_ending' || regionData.type === 'fake_ending';
            AudioManager.playStoryMusic(isEndingMusic);
        }

        const container = document.getElementById('article-content');
        if (container) {
            const title = regionData.title || '章节剧情';
            Logger.log(`[UIManager] Opening article panel for story: ${title}`);
            this.openPanel('article', title, { 
                showMusic: true,
                backAction: () => {
                    const currentRegion = this.currentViewRegionId && window.REGIONS ? window.REGIONS.find(r => r.id === this.currentViewRegionId) : null;
                    const panelTitle = currentRegion ? currentRegion.title : '选择关卡';
                    
                    this.openPanel('levels', panelTitle, {
                        backAction: () => {
                            if (this.currentViewRegionId) {
                                this.currentViewRegionId = null;
                                this.renderLevelList();
                                const titleEl = document.getElementById('universal-title');
                                if (titleEl) titleEl.textContent = '选择关卡';
                                const backBtn = document.getElementById('btn-modal-back');
                                if (backBtn) {
                                    backBtn.onclick = () => this.hideModal('modal-universal');
                                    backBtn.classList.add('hidden');
                                }
                            } else {
                                this.hideModal('modal-universal');
                            }
                        }
                    });
                    
                    // 需要手动触发一次 renderLevelList 来渲染内容，因为 openPanel('levels') 内部会调用 renderLevelList
                    // 但是上面的 backAction 定义了如果我们在 levels 面板时的返回行为
                }
            });
            container.innerHTML = '<p>加载中...</p>';
            
            const currentRoute = window.ROUTES.find(r => r.id === window.currentRouteId);
            let appendToBeContinued = false;
            if (currentRoute && currentRoute.showToBeContinued) {
                if (currentRoute.regions && currentRoute.regions.length > 0) {
                    const lastRegion = currentRoute.regions[currentRoute.regions.length - 1];
                    if ((regionData.id && regionData.id === lastRegion.id) || regionData.isEnding) {
                        appendToBeContinued = true;
                    }
                }
            }

            const toBeContinuedHTML = "\n\n<br><br><div style=\"text-align: center; color: #888; font-weight: bold; font-size: 1.2em;\">—— 未完待续 ——</div>\n\n";

            const renderFinalText = async (baseText) => {
                let finalText = baseText;
                
                // 如果是回顾模式，尝试加载此章节下所有已解锁关卡的剧情
                if (isReview && regionData.levels && regionData.levels.length > 0) {
                    for (const levelId of regionData.levels) {
                        const levelData = window.LEVELS.find(l => l.id === levelId);
                        if (levelData) {
                            const unlockStatus = StorageManager.checkLevelUnlock ? StorageManager.checkLevelUnlock(levelData, regionData) : { unlocked: true };
                            if (unlockStatus.unlocked || StorageManager.isAssistMode()) {
                                if (levelData.descriptionPath) {
                                    try {
                                        const res = await fetch(levelData.descriptionPath);
                                        const text = await res.text();
                                        finalText += `\n\n---\n\n### ${levelData.title}\n\n${text}`;
                                    } catch (e) {
                                        Logger.warn("Failed to load level story for review", e);
                                    }
                                } else if (levelData.description) {
                                    finalText += `\n\n---\n\n### ${levelData.title}\n\n${levelData.description}`;
                                }
                            }
                        }
                    }
                }

                if (appendToBeContinued) finalText += toBeContinuedHTML;
                this.renderMarkdown(container, finalText);
            };

            if (regionData.descriptionPath) {
                Logger.log(`[UIManager] Fetching story from: ${regionData.descriptionPath}`);
                fetch(regionData.descriptionPath)
                    .then(res => res.text())
                    .then(text => {
                        Logger.log(`[UIManager] Story loaded successfully`);
                        renderFinalText(text);
                    })
                    .catch(err => {
                         Logger.error("Failed to load story:", err);
                         container.innerHTML = "<p>加载剧情失败。</p>";
                    });
            } else {
                Logger.log(`[UIManager] Rendering inline story description`);
                renderFinalText(regionData.description);
            }
        } else {
            Logger.warn(`[UIManager] article-content container not found!`);
        }
    },
    
    updateUI: function() {
        const mode = window.GameLogic.state.mode;
        
        const btnNext = document.getElementById('btn-next');
        const btnReturn = document.getElementById('btn-return');
        const btnCheck = document.getElementById('btn-check');
        const aiBtn = document.getElementById('ai-chat-btn');
        
        if (aiBtn) {
            if (mode === 'preset') {
                // Story mode: change to built-in hint button
                aiBtn.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
                aiBtn.title = "获取关卡提示";
            } else {
                // Other modes: AI chat
                aiBtn.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>';
                aiBtn.title = "AI 对话助手";
            }
        }
        
        // Update sidebar active states
        const btnPreset = document.getElementById('btn-preset');
        const btnRandom = document.getElementById('btn-random');
        const btnCreate = document.getElementById('btn-create');
        
        if (btnPreset) btnPreset.classList.toggle('active', mode === 'preset');
        if (btnRandom) btnRandom.classList.toggle('active', mode === 'random');
        
        // Update Topbar Badge & Title
        const badge = document.getElementById('current-mode-badge');
        const titleEl = document.getElementById('current-level-title');
        
        if (badge) {
            badge.style.display = 'none'; // 根据用户要求隐藏徽章
        }
        
        if (titleEl) {
            titleEl.style.display = 'inline-block';
            if (mode === 'preset') {
                const currentIdx = window.GameLogic.state.currentLevelIndex;
                if (currentIdx >= 0 && window.LEVELS && window.LEVELS[currentIdx]) {
                    const levelData = window.LEVELS[currentIdx];
                    let prefix = "";
                    if (levelData.regionId) {
                        const region = window.REGIONS && window.REGIONS.find(r => r.id === levelData.regionId);
                        if (region && region.title) {
                            if (region.title.includes("See You Tomorrow")) {
                                prefix = "SYT ";
                            } else if (region.title.includes("The Day Before Tomorrow")) {
                                prefix = "TDBT ";
                            } else {
                                prefix = region.title + " ";
                            }
                        }
                    }
                    titleEl.textContent = `${prefix}第 ${currentIdx + 1} 关：${levelData.title || '未知关卡'}`;
                } else {
                    titleEl.textContent = '未选择关卡';
                }
            } else if (mode === 'random') {
                titleEl.textContent = '随机生成函数';
            } else {
                titleEl.textContent = '沙盒环境';
            }
        }
        
        if (mode === 'preset') {
            if (btnReturn) {
                btnReturn.style.display = 'none'; // 根据用户要求不显示退出按钮
                btnReturn.classList.add('hidden');
            }
        } else {
            if (btnReturn) {
                btnReturn.style.display = 'none';
                btnReturn.classList.add('hidden');
            }
            if (btnNext) {
                btnNext.style.display = 'none';
                btnNext.classList.add('hidden');
            }
            if (btnCheck) {
                btnCheck.style.display = 'inline-flex';
                btnCheck.classList.remove('hidden');
            }
        }
    },

    appendAiChatMessage: function(text, isUser = false) {
        const container = document.getElementById('ai-chat-messages');
        if (!container) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${isUser ? 'user-message' : 'ai-message'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = text; // 使用 innerHTML 允许一点格式，但要注意 XSS (当前环境基本安全)
        
        msgDiv.appendChild(contentDiv);
        container.appendChild(msgDiv);
        
        // 滚动到底部
        container.scrollTop = container.scrollHeight;
    },

    clearAiChatMessages: function() {
        const container = document.getElementById('ai-chat-messages');
        if (!container) return;
        
        // 清空所有消息，并重新添加默认的欢迎消息
        container.innerHTML = `
            <div class="chat-message ai-message">
                <div class="message-content">你好！我是 AI 助手。你可以问我关于当前函数的性质，例如“这个函数是单调递增的吗？”、“它的定义域包含负数吗？”。我会回答“是”、“否”或“不知道”。</div>
            </div>
        `;
    },

    handleAiChatSend: async function() {
        const inputEl = document.getElementById('ai-chat-input');
        if (!inputEl) return;
        
        const question = inputEl.value.trim();
        if (!question) return;

        const now = Date.now();
        if (now - this.lastAiChatTime < 5000) {
            const remaining = Math.ceil((5000 - (now - this.lastAiChatTime)) / 1000);
            this.appendAiChatMessage(`<span style="color: #f44336;">请求过于频繁，请等待 ${remaining} 秒后再试</span>`, false);
            return;
        }
        
        // 更新最后发送时间
        this.lastAiChatTime = Date.now();
        
        // 1. 获取当前目标函数表达式
        if (!window.GameLogic || (!GameLogic.state.currentTarget && !GameLogic.state.targetExpression)) {
            this.appendAiChatMessage('当前没有正在进行的关卡或未找到目标函数。', false);
            return;
        }
        const currentFunc = GameLogic.state.currentTarget || GameLogic.state.targetExpression;

        // 2. 显示用户消息
        this.appendAiChatMessage(question, true);
        inputEl.value = '';
        inputEl.disabled = true;
        
        // 3. 显示等待提示
        const btnSend = document.getElementById('btn-ai-chat-send');
        const originalBtnText = btnSend ? btnSend.textContent : '发送';
        if (btnSend) {
            btnSend.textContent = '思考中...';
            btnSend.disabled = true;
        }

        // 4. 调用 API
        try {
            if (!window.AIManager) {
                throw new Error("AI 模块未加载");
            }
            
            // 构建提示词
            const customSystemPrompt = AIManager.getChatSystemPrompt();
                
            const prompt = `隐藏的函数表达式是: f(x) = ${currentFunc}\n\n玩家的问题是: "${question}"\n\n请回答(是/否/不知道):`;

            const apiConfig = AIManager.getApiConfig();
            if (!apiConfig.baseUrl || !AIManager.hasValidKey()) {
                throw new Error("请先在选项中配置 API Key 或使用代理。");
            }

            const headers = {
                'Content-Type': 'application/json'
            };
            if (apiConfig.apiKey) {
                headers['Authorization'] = `Bearer ${apiConfig.apiKey}`;
            }

            const response = await fetch(apiConfig.baseUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: apiConfig.model,
                    messages: [
                        { role: 'system', content: customSystemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1 // 尽量降低随机性
                })
            });

            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const answer = data.choices?.[0]?.message?.content?.trim() || "未能获取回答";
            
            this.appendAiChatMessage(answer, false);

        } catch (error) {
            console.error("AI 聊天出错:", error);
            this.appendAiChatMessage(`<span style="color: #f44336;">错误：${error.message}</span>`, false);
        } finally {
            inputEl.disabled = false;
            inputEl.focus();
            if (btnSend) {
                btnSend.textContent = originalBtnText;
                btnSend.disabled = false;
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
        const btnCheck = document.getElementById('btn-check');
        if (!btnNext) return;
        
        if (show) {
            btnNext.style.display = 'inline-flex';
            btnNext.classList.remove('hidden');
            const span = btnNext.querySelector('span');
            if (span) {
                span.textContent = text;
            } else {
                btnNext.textContent = text;
            }
            if (btnCheck) {
                btnCheck.style.display = 'none';
                btnCheck.classList.add('hidden');
            }
        } else {
            btnNext.style.display = 'none';
            btnNext.classList.add('hidden');
            if (btnCheck) {
                btnCheck.style.display = 'inline-flex';
                btnCheck.classList.remove('hidden');
            }
        }
    },

    openPanel: function(panelId, title, options = {}) {
        Logger.log(`[UIManager] openPanel called for: ${panelId}, title: ${title}`);
        
        // 当打开 'levels' 面板时，确保关卡列表被渲染
        if (panelId === 'levels') {
            this.renderLevelList();
        }
        
        // Clear previous callbacks explicitly before setting a new one
        if (this.modalCallbacks['modal-universal']) {
            Logger.log(`[UIManager] Clearing previous callback for modal-universal`);
        }
        this.modalCallbacks['modal-universal'] = null;

        const container = document.getElementById('universal-container');
        const aiBtn = document.getElementById('ai-chat-btn');
        const btnBack = document.getElementById('btn-modal-back');

        // Hide AI Chat Button when modal opens
        if (aiBtn) {
            aiBtn.style.display = 'none';
        }

        // 控制返回上一级按钮
        if (btnBack) {
            if (options.backAction) {
                btnBack.classList.remove('hidden');
                // 移除旧事件
                const newBtnBack = btnBack.cloneNode(true);
                btnBack.parentNode.replaceChild(newBtnBack, btnBack);
                newBtnBack.addEventListener('click', options.backAction);
            } else {
                btnBack.classList.add('hidden');
            }
        }
        
        // 1. 检查是否已经在显示另一个 panel，如果是，则先淡出
        const activePanels = Array.from(document.querySelectorAll('.modal-panel:not(.hidden)'));
        if (activePanels.length > 0 && document.getElementById('modal-universal').classList.contains('visible')) {
            // 给当前活动的面板添加淡出类
            activePanels.forEach(p => {
                p.classList.add('fade-out');
            });
            
            // 延迟一点时间等淡出动画完成，再切换内容并淡入
            setTimeout(() => {
                this._switchToPanel(panelId, title, options, container);
            }, 200); // 对应 CSS 中 fade-out 的时间
        } else {
            // 如果是直接打开弹窗，没有面板在显示，直接切换
            this._switchToPanel(panelId, title, options, container);
        }
    },

    _switchToPanel: function(panelId, title, options, container) {
        // Set data-panel attribute for CSS styling
        if (container) {
            container.setAttribute('data-panel', panelId);
        }

        // Hide all panels completely
        document.querySelectorAll('.modal-panel').forEach(p => {
            p.classList.add('hidden');
            p.classList.remove('fade-out', 'fade-in');
            p.style.display = ''; // Reset inline display
        });
        
        // Show target panel with fade-in animation
        const panel = document.getElementById('panel-' + panelId);
        if (panel) {
            panel.classList.remove('hidden');
            panel.classList.add('fade-in');
            
            if (panelId === 'ai-chat') {
                panel.style.display = 'flex';
                // Remove the default padding of modal-body for ai-chat to fill the space
                document.getElementById('universal-body').style.padding = '0';
            } else {
                document.getElementById('universal-body').style.padding = '';
            }
        } else {
            Logger.warn(`[UIManager] Panel panel-${panelId} not found!`);
        }

        // Set Title
        const titleEl = document.getElementById('universal-title');
        if (titleEl && title !== undefined) {
            // 简单的文字淡入淡出
            titleEl.style.opacity = 0;
            setTimeout(() => {
                titleEl.textContent = title;
                titleEl.style.opacity = 1;
            }, 100);
        }

        // Handle specific actions (music button, start button etc.)
        const musicBtn = document.getElementById('universal-music-toggle');
        if (musicBtn) {
            if (options.showMusic) {
                musicBtn.classList.remove('hidden');
            } else {
                musicBtn.classList.add('hidden');
            }
        }

        const actionBtn = document.getElementById('article-actions');
        if (actionBtn) {
            if (options.showStartBtn) {
                actionBtn.style.display = 'block';
            } else {
                actionBtn.style.display = 'none';
            }
        }

        // Set new callback
        if (options.onClose) {
            Logger.log(`[UIManager] Setting new onClose callback for modal-universal`);
        }
        this.modalCallbacks['modal-universal'] = options.onClose || null;

        this.showModal('modal-universal');
    },

    showModal: function(modalId) {
        Logger.log(`[UIManager] showModal called for: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            // 触发重排以启用过渡
            void modal.offsetWidth; 
            modal.classList.add('visible');
            Logger.log(`[UIManager] Modal ${modalId} is now visible`);
        } else {
            Logger.warn(`[UIManager] Modal ${modalId} not found!`);
        }
    },

    hideModal: function(modalId) {
        Logger.log(`[UIManager] hideModal called for: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('visible');
            
            // 提取回调并立即清除，防止在定时器期间被重复触发或覆盖
            const callback = this.modalCallbacks[modalId];
            if (callback) {
                Logger.log(`[UIManager] Found callback for ${modalId}, will execute after animation`);
            }
            delete this.modalCallbacks[modalId];

            setTimeout(() => {
                modal.classList.add('hidden');
                Logger.log(`[UIManager] Modal ${modalId} hidden after animation`);

                // Show AI Chat Button when modal closes
                const aiBtn = document.getElementById('ai-chat-btn');
                if (aiBtn && modalId === 'modal-universal') {
                    aiBtn.style.display = 'flex';
                }
                
                // 如果是剧情弹窗关闭，停止播放音乐
                if (modalId === 'modal-universal' && window.AudioManager) {
                    AudioManager.stopMusic();
                }
                
                // 执行回调
                if (callback) {
                    Logger.log(`[UIManager] Executing callback for ${modalId}`);
                    callback();
                }
            }, 300); // 300ms 过渡时间
        } else {
            Logger.warn(`[UIManager] Modal ${modalId} not found to hide!`);
        }
    },

    /**
     * 显示自定义确认框
     * @param {string} message 提示信息 (支持 HTML)
     * @param {string} title 标题，默认为"确认"
     * @returns {Promise<boolean>}
     */
    showConfirm: function(message, title = "确认") {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const titleEl = document.getElementById('confirm-title');
            const messageEl = document.getElementById('confirm-message');
            const btnOk = document.getElementById('btn-confirm-ok');
            const btnCancel = document.getElementById('btn-confirm-cancel');
            
            if (!modal || !titleEl || !messageEl || !btnOk || !btnCancel) {
                // 如果找不到 DOM 元素，降级使用原生 confirm
                // 去除 html 标签后显示
                resolve(confirm(message.replace(/<[^>]+>/g, '')));
                return;
            }
            
            titleEl.textContent = title;
            messageEl.innerHTML = message; // 使用 innerHTML 支持公式渲染
            
            // 显示模态框
            modal.classList.remove('hidden');
            void modal.offsetWidth;
            modal.classList.add('visible');
            
            // 清理旧的事件监听器以防重复触发
            const newBtnOk = btnOk.cloneNode(true);
            const newBtnCancel = btnCancel.cloneNode(true);
            btnOk.parentNode.replaceChild(newBtnOk, btnOk);
            btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
            
            const closeModal = (result) => {
                modal.classList.remove('visible');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    resolve(result);
                }, 300);
            };
            
            // 绑定新事件
            newBtnOk.addEventListener('click', () => closeModal(true));
            newBtnCancel.addEventListener('click', () => closeModal(false));
        });
    },

    /**
     * 显示自定义输入框
     * @param {string} message 提示信息
     * @param {string} defaultValue 默认值
     * @param {string} title 标题，默认为"输入"
     * @returns {Promise<string|null>} 返回输入的字符串，取消返回 null
     */
    showPrompt: function(message, defaultValue = "", title = "输入") {
        return new Promise((resolve) => {
            const modal = document.getElementById('prompt-modal');
            const titleEl = document.getElementById('prompt-title');
            const messageEl = document.getElementById('prompt-message');
            const inputEl = document.getElementById('prompt-input');
            const btnOk = document.getElementById('btn-prompt-ok');
            const btnCancel = document.getElementById('btn-prompt-cancel');
            
            if (!modal || !titleEl || !messageEl || !inputEl || !btnOk || !btnCancel) {
                // 如果找不到 DOM 元素，降级使用原生 prompt
                resolve(prompt(message, defaultValue));
                return;
            }
            
            titleEl.textContent = title;
            messageEl.textContent = message;
            inputEl.value = defaultValue;
            
            // 显示模态框
            modal.classList.remove('hidden');
            void modal.offsetWidth;
            modal.classList.add('visible');
            inputEl.focus();
            
            // 清理旧的事件监听器以防重复触发
            const newBtnOk = btnOk.cloneNode(true);
            const newBtnCancel = btnCancel.cloneNode(true);
            btnOk.parentNode.replaceChild(newBtnOk, btnOk);
            btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
            
            const closeModal = (result) => {
                modal.classList.remove('visible');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    resolve(result);
                }, 300);
            };
            
            // 绑定新事件
            newBtnOk.addEventListener('click', () => closeModal(inputEl.value));
            newBtnCancel.addEventListener('click', () => closeModal(null));

            // 支持回车键确认
            inputEl.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    newBtnOk.click();
                }
            };
        });
    },

    /**
     * 显示消息提示

     * @param {string} text 消息文本
     * @param {string} type 'success' | 'error' | 'info'
     */
    showMessage: function(text, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        if (type === 'success') {
            icon = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        } else if (type === 'error') {
            icon = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        }

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">${text}</div>
            <button class="toast-close">&times;</button>
        `;

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        const removeToast = () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300); // Wait for transition
        };

        toast.querySelector('.toast-close').addEventListener('click', removeToast);

        // Auto close
        setTimeout(removeToast, 2000);
    },

    /**
     * 隐藏当前消息提示
     */
    hideMessage: function() {
        // Handled per-toast
    }
};

// 暴露给全局
window.UIManager = UIManager;
