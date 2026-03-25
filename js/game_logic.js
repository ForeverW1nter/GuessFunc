
/**
 * 游戏逻辑模块
 * 管理游戏状态、关卡生成与加载、判定流程
 */

const GameLogic = {
    // 游戏核心状态机
    state: {
        currentLevelExpr: null, // 当前关卡的表达式（仅用于显示或调试）
        isWon: false,           // 当前关卡是否已胜利
        mode: 'random',         // 游戏模式: 'random' (随机) 或 'preset' (预设闯关)
        currentLevelIndex: -1   // 当前在预设关卡中的索引
    },

    /**
     * 防抖函数
     */
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },

    /**
     * 初始化游戏
     */
    init: async function() {
        // 先触发一次存储读取以进行可能的迁移
        if (window.StorageManager) {
            window.StorageManager.getAllProgress();
        }

        // 0. 加载保存的线路
        if (window.ROUTES && window.ROUTES.length > 0 && window.StorageManager) {
            const savedRoute = window.StorageManager.getCurrentRoute();
            if (savedRoute) {
                const route = window.ROUTES.find(r => r.id === savedRoute);
                if (route) {
                    window.currentRouteId = savedRoute;
                    window.LEVELS = route.levels;
                    window.REGIONS = route.regions;
                }
            }
        }

        // 1. 等待数学引擎 (MathEngine) 加载完成
        try {
            UIManager.showMessage(MESSAGES.get('init.engineLoading'), "info");
            await MathEngine.init();
            UIManager.hideMessage();
        } catch (e) {
            UIManager.showMessage(MESSAGES.get('init.engineFailed'), "error");
            Logger.error(e);
            return;
        }

        // 2. 检查 URL 中是否包含 'level' 参数（用于分享和恢复关卡）
        const levelCode = Utils.getQueryParam('level');
        if (levelCode) {
            const levelData = Utils.decodeLevel(levelCode);
            // 简单验证解码后的数据是否有效
            if (levelData) {
                // 统一将字符串或对象格式化为标准关卡对象 {t: "...", p: {...}}
                const data = (typeof levelData === 'string') ? {t: levelData} : levelData;
                this.startLevel(data);
                return;
            } else {
                UIManager.showMessage(MESSAGES.get('game.invalidLevelCode'), "error");
            }
        }
        
        // 3. 如果没有 URL 参数，则默认开始一个空关卡
        this.startEmptyLevel();
    },

    /**
     * 开始一个新关卡 (底层核心方法)
     * @param {Object|string} levelData - 关卡数据，可以是 {t: "target", p: {params}} 或仅 "target" 字符串
     */
    startLevel: function(levelData) {
        // 格式归一化，确保后续处理的是标准对象格式
        const data = (typeof levelData === 'string') ? {t: levelData} : levelData;
        
        Logger.log("开始关卡:", data);
        this.state.currentLevelData = data; // 保存原始数据，用于分享链接生成
        this.state.isWon = false;           // 重置胜利状态

        // 核心逻辑：保存用于判定的目标表达式和参数
        // 不再预先将参数代入表达式，以支持 Desmos 中的参数滑块
        this.state.currentTarget = data.t; // 保存原始目标表达式（可能带参数）
        this.state.currentParams = data.p; // 保存参数列表

        // 通知图形管理器 (GraphManager) 设置目标函数和参数滑块
        GraphManager.setupLevel(data.t, data.p);
        
        // 将当前关卡信息编码到 URL 中，方便刷新和分享
        const code = Utils.encodeLevel(data);
        Utils.setQueryParam('level', code);
        
        // 根据游戏模式更新 UI 状态（例如是否显示“下一关”按钮）
        if (this.state.mode === 'preset') {
             if (window.UIManager && window.UIManager.toggleNextButton) {
                 window.UIManager.toggleNextButton(false);
             }
        } else {
             if (window.UIManager && window.UIManager.toggleNextButton) {
                 window.UIManager.toggleNextButton(false);
             }
        }
    },

    /**
     * 重置游戏状态（在开始新关卡前调用）
     */
    resetState: function() {
        this.state.isWon = false;
        this.state.currentLevelData = null;
        this.state.currentTarget = null;
        this.state.currentParams = null;
        
        // 重置 AI 聊天记录
        if (window.UIManager && window.UIManager.clearAiChatMessages) {
            window.UIManager.clearAiChatMessages();
        }
    },

    startEmptyLevel: function() {
        this.state.mode = 'random';
        this.resetState();
        this.state.currentTarget = "x";
        this.state.currentParams = {};
        this.state.targetExpression = "x";
        this.state.currentLevelData = { t: "x", p: {} };
        
        // 清除 URL 中的 level 参数
        const url = new URL(window.location);
        url.searchParams.delete('level');
        window.history.pushState({}, '', url);

        if (window.GraphManager) {
            window.GraphManager.setupLevel("x", {});
        }
        
        if (window.UIManager && window.UIManager.updateUI) {
            window.UIManager.updateUI();
        }
        
        if (window.UIManager && window.UIManager.toggleNextButton) {
            window.UIManager.toggleNextButton(false);
        }
    },

    /**
     * 开始一个随机关卡
     * @param {number|string} [difficultyOverride] - 可选的难度覆盖设置
     */
    startRandomLevel: async function(difficultyOverride, forceLocal = false) {
        this.state.mode = 'random'; // 切换到随机模式
        this.resetState();
        
        // 从 UI 获取或使用覆盖的难度设置，并让 MathEngine 生成函数
        const difficulty = difficultyOverride !== undefined ? difficultyOverride : 0;
        const funcData = await MathEngine.generateRandomFunction(difficulty, forceLocal);
        
        // 修复：为 currentTarget 和 currentParams 赋值，用于答案判定
        this.state.currentTarget = funcData.latex;
        this.state.currentParams = {};

        this.state.targetExpression = funcData.latex;
        this.state.targetFunction = funcData.expression; // 兼容旧版逻辑
        
        Logger.log(`开始随机关卡 (${difficulty}):`, this.state.targetExpression);
        
        // 在 Desmos 中设置目标函数（设为 secret，使其不可见）
        if (window.GraphManager) {
            window.GraphManager.setupLevel(this.state.targetExpression, {});
        }

        // 为当前随机关卡生成分享链接并更新 URL
        const randomLevelData = { t: this.state.targetExpression, p: {} };
        const code = Utils.encodeLevel(randomLevelData);
        Utils.setQueryParam('level', code);
        this.state.currentLevelData = randomLevelData; // 更新 currentLevelData 确保分享链接一致性
        
        // 根据难度显示不同的提示信息
        let diffName = `难度 ${difficulty}`;
        
        if (window.UIManager && window.UIManager.showMessage) {
            window.UIManager.showMessage(MESSAGES.get('game.randomChallengeStart', { diffName }));
            if (window.UIManager.updateUI) {
                window.UIManager.updateUI();
            }
        }
    },

    /**
     * 开始一个预设的闯关模式关卡
     * @param {number} index - 关卡在 LEVELS 数组中的索引
     */
    startPresetLevel: function(index) {
        Logger.log(`[GameLogic] startPresetLevel called with index: ${index}`);
        if (index < 0 || index >= window.LEVELS.length) {
            Logger.error("无效的关卡索引:", index);
            return;
        }

        this.state.mode = 'preset'; // 切换到闯关模式
        this.state.currentLevelIndex = index;
        
        const levelData = window.LEVELS[index];
        // 预设关卡可能包含参数，直接调用 startLevel
        this.startLevel({
            t: levelData.target,
            p: levelData.params
        });
        
        // 显示关卡说明或标题
        if (window.UIManager && window.UIManager.showLevelInstruction) {
            Logger.log(`[GameLogic] Calling UIManager.showLevelInstruction for level: ${levelData.title}`);
            const hasInstruction = window.UIManager.showLevelInstruction(levelData);
            
            // 如果没有指引或者开启了速通模式，我们需要手动关闭可能存在的关卡选择弹窗
            if (!hasInstruction) {
                Logger.log(`[GameLogic] No instruction shown, hiding modal-universal`);
                window.UIManager.hideModal('modal-universal');
            }
        } else {
             Logger.log(`[GameLogic] UIManager or showLevelInstruction not found, showing message instead`);
             UIManager.showMessage(MESSAGES.get('game.presetLevelTitle', { index: index + 1, title: levelData.title }), "info");
             if (window.UIManager) {
                 window.UIManager.hideModal('modal-universal');
             }
        }
    },

    /**
     * 进入下一关（仅在闯关模式下有效）
     */
    nextLevel: function() {
        if (this.state.mode === 'preset') {
            const nextIndex = this.state.currentLevelIndex + 1;
            if (nextIndex < window.LEVELS.length) {
                const nextLevelData = window.LEVELS[nextIndex];
                const currentRegion = this.getRegionForLevel(window.LEVELS[this.state.currentLevelIndex].id);
                const nextRegion = this.getRegionForLevel(nextLevelData.id);

                // 检查下一关是否已解锁
                if (window.StorageManager && window.StorageManager.checkLevelUnlock) {
                    const unlockStatus = window.StorageManager.checkLevelUnlock(nextLevelData, nextRegion);
                    if (!unlockStatus.unlocked) {
                        UIManager.showMessage(MESSAGES.get('game.nextLevelLocked', { reason: unlockStatus.reason }), "error");
                        // 如果未解锁，打开关卡选择界面
                        if (window.UIManager) {
                            window.UIManager.renderLevelList();
                            window.UIManager.openPanel('levels', '选择关卡');
                        }
                        return;
                    }
                }

                // 检查是否进入了新的章节（区域）
                const isSpeedrun = localStorage.getItem('guessfunc_speedrun_mode') === 'true';
                if (!isSpeedrun && nextRegion && (!currentRegion || currentRegion.id !== nextRegion.id)) {
                    // 如果新章节有剧情，则优先显示剧情
                    if (nextRegion.descriptionPath || nextRegion.description) {
                         if (window.UIManager && window.UIManager.showStory) {
                             // 标记剧情为已读，避免重复显示
                             if (window.StorageManager && window.StorageManager.markChapterSeen) {
                                 window.StorageManager.markChapterSeen(nextRegion.id);
                             }

                             window.UIManager.showStory(nextRegion);
                             
                             // 剧情结束后返回关卡选择界面，而不是直接开始下一关
                             window.UIManager.modalCallbacks['modal-universal'] = () => {
                                 window.UIManager.renderLevelList();
                                 window.UIManager.openPanel('levels', '选择关卡');
                             };
                             return;
                         }
                    }
                }
                
                // 如果没有触发剧情，则直接开始下一关
                this.startPresetLevel(nextIndex);
            } else {
                UIManager.showMessage(MESSAGES.get('game.allPresetCompleted'), "success");
            }
        } else {
            // 如果是随机模式，提示用户手动开始新挑战
            UIManager.showMessage(MESSAGES.get('game.clickTopToStart'));
        }
    },

    /**
     * 辅助函数：根据关卡 ID 查找所属的区域（章节）
     */
    getRegionForLevel: function(levelId) {
        if (!window.REGIONS) return null;
        return window.REGIONS.find(r => r.levels.includes(levelId));
    },

    /**
     * 检查用户猜测的答案
     */
    checkGuess: function() {
        // 如果已经胜利，则按钮功能变为“下一关”或“新挑战”
        if (this.state.isWon) {
            if (this.state.mode === 'preset') {
                this.nextLevel();
            } else {
                UIManager.showMessage(MESSAGES.get('game.clickTopToStart'));
            }
            return;
        }

        const userGuessData = GraphManager.getUserGuessData();
        
        if (!userGuessData || !userGuessData.latex) {
            UIManager.showMessage(MESSAGES.get('game.invalidExpression'), "error");
            return;
        }

        Logger.log("用户猜测:", userGuessData.latex);
        Logger.log("参数:", userGuessData.params);
        Logger.log("目标:", this.state.currentTarget);

        // 调用数学引擎进行等价性验证
        const isCorrect = MathEngine.verifyEquivalence(
            this.state.currentTarget, 
            userGuessData.latex,
            this.state.currentParams // 传入关卡定义的参数，用于识别哪些符号是参数而非变量
        );

        if (isCorrect) {
            this.handleWin(isCorrect);
        } else {
            UIManager.showMessage(MESSAGES.get('game.guessWrong'), "error");
        }
    },

    /**
     * 处理胜利逻辑
     */
    handleWin: function(result) {
        this.state.isWon = true;
        
        let msg = MESSAGES.get('game.levelCompleted');
        if (this.state.mode === 'preset') {
            const levelData = window.LEVELS[this.state.currentLevelIndex];
            if (levelData) {
                StorageManager.markLevelCompleted(levelData.id); // 保存通关记录
            }
            
            // 检查假结局
            let fakeEndingToShow = null;
            const isSpeedrun = localStorage.getItem('guessfunc_speedrun_mode') === 'true';
            
            if (!isSpeedrun) {
                const currentRegion = this.getRegionForLevel(levelData.id);
                if (currentRegion && currentRegion.fakeEndings) {
                    for (const fake of currentRegion.fakeEndings) {
                        const unlockStatus = window.StorageManager.checkConditions ? window.StorageManager.checkConditions(fake.unlock) : { unlocked: true };
                        // 只要假结局满足解锁条件，且还没看过，就触发它
                        if (unlockStatus.unlocked && !window.StorageManager.isChapterSeen(fake.id)) {
                            fakeEndingToShow = fake;
                            break;
                        }
                    }
                }
            }
            
            if (fakeEndingToShow && window.UIManager && window.UIManager.showStory) {
                // 如果有未看过的假结局，优先展示假结局
                window.StorageManager.markChapterSeen(fakeEndingToShow.id);
                setTimeout(() => {
                    window.UIManager.showStory({
                        title: fakeEndingToShow.title || "假结局",
                        descriptionPath: fakeEndingToShow.descriptionPath
                    });
                }, 500);
                
                // 设置假结局看完后的回调
                window.UIManager.modalCallbacks['modal-universal'] = () => {
                    this._proceedAfterWin(msg);
                };
            } else {
                this._proceedAfterWin(msg);
            }
        } else {
            // 获取渲染后的目标和用户输入 LaTeX，用于美化显示
            const targetLatex = result && result.renderedTarget ? result.renderedTarget : this.state.currentTarget;
            const userLatex = result && result.renderedUser ? result.renderedUser : (window.GraphManager ? GraphManager.getUserGuessData().latex : "");
            
            msg = MESSAGES.get('game.guessCorrect', { target: targetLatex, guess: userLatex });
            if (result && result.method === 'simplify') {
                msg = MESSAGES.get('game.guessCorrectEquivalent', { target: targetLatex, guess: userLatex });
            } else if (result && result.method === 'numeric') {
                msg = MESSAGES.get('game.guessCorrectValue', { target: targetLatex, guess: userLatex });
            }
            
            if (window.UIManager && window.UIManager.toggleNextButton) {
                window.UIManager.toggleNextButton(true);
            }
        }
        
        if (window.UIManager && window.UIManager.showMessage) {
            UIManager.showMessage(msg, "success");
        }
    },
    
    _proceedAfterWin: function(baseMsg) {
        let msg = baseMsg;
        const levelData = window.LEVELS[this.state.currentLevelIndex];
        
        if (this.state.currentLevelIndex < window.LEVELS.length - 1) {
            const nextIndex = this.state.currentLevelIndex + 1;
            const nextLevelData = window.LEVELS[nextIndex];
            const currentRegion = this.getRegionForLevel(levelData.id);
            const nextRegion = this.getRegionForLevel(nextLevelData.id);
            
            const isNewChapter = nextRegion && (!currentRegion || currentRegion.id !== nextRegion.id);
            const nextBtnText = isNewChapter ? "下一章" : "下一关";
            
            msg += ` 点击“${nextBtnText}”继续。`;
            
            if (window.UIManager && window.UIManager.toggleNextButton) {
                window.UIManager.toggleNextButton(true, nextBtnText);
            }
        } else {
            msg += " " + MESSAGES.get('game.allPresetCompleted');
            // 最后一关通关后，显示结局剧情
            const isSpeedrun = localStorage.getItem('guessfunc_speedrun_mode') === 'true';
            if (!isSpeedrun && window.UIManager && window.UIManager.showStory) {
                const currentRoute = window.ROUTES.find(r => r.id === window.currentRouteId);
                if (currentRoute && currentRoute.endingPath) {
                    setTimeout(() => {
                        // 如果是 classic 路线且开启了动画，播放动画，否则直接显示剧情
                        const animPref = localStorage.getItem('guessfunc_ending_anim');
                        const playAnim = animPref !== 'false';
                        
                        if (currentRoute.id === 'classic' && playAnim) {
                            window.UIManager.playEndingAnimation(() => {
                                window.UIManager.showStory({
                                    isEnding: true,
                                    title: currentRoute.title + " - 结局",
                                    descriptionPath: currentRoute.endingPath
                                });
                            });
                        } else {
                            window.UIManager.showStory({
                                isEnding: true,
                                title: currentRoute.title + " - 结局",
                                descriptionPath: currentRoute.endingPath
                            });
                        }
                    }, 1000);
                }
            }
        }
        UIManager.showMessage(msg, "success");
    },

    /**
     * 获取当前关卡的分享链接
     */
    getShareLink: function() {
        // 优先使用当前实际运行的目标函数（特别是在随机模式下）
        if (this.state.targetExpression && this.state.mode === 'random') {
             const data = { t: this.state.targetExpression, p: {} };
             const code = Utils.encodeLevel(data);
             const url = new URL(window.location);
             url.searchParams.set('level', code);
             return url.toString();
        }

        // 对于预设关卡或从链接加载的关卡，使用 currentLevelData
        if (!this.state.currentLevelData) return window.location.href;
        const code = Utils.encodeLevel(this.state.currentLevelData);
        const url = new URL(window.location);
        url.searchParams.set('level', code);
        return url.toString();
    }
};

// 暴露给全局
window.GameLogic = GameLogic;
