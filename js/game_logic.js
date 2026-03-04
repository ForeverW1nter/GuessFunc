
/**
 * 游戏逻辑模块
 * 管理游戏状态、关卡生成与加载、判定流程
 */

const GameLogic = {
    state: {
        currentLevelExpr: null,
        isWon: false,
        mode: 'random', // 'random' | 'preset'
        currentLevelIndex: -1
    },

    /**
     * 初始化游戏
     */
    init: async function() {
        // 1. 等待 MathEngine 就绪
        try {
            UIManager.showMessage("正在加载数学引擎...", "info");
            await MathEngine.init();
            UIManager.hideMessage();
        } catch (e) {
            UIManager.showMessage("数学引擎加载失败，请刷新重试。", "error");
            console.error(e);
            return;
        }

        // 2. 检查 URL 是否有关卡参数
        const levelCode = Utils.getQueryParam('level');
        if (levelCode) {
            const levelData = Utils.decodeLevel(levelCode);
            // 简单验证
            if (levelData) {
                // 统一转为对象格式
                const data = (typeof levelData === 'string') ? {t: levelData} : levelData;
                this.startLevel(data);
                return;
            } else {
                alert("无效的关卡代码，将随机生成关卡。");
            }
        }
        
        // 3. 默认随机关卡
        this.startRandomLevel();
    },

    /**
     * 开始一个新关卡 (底层方法)
     * @param {Object|string} levelData 关卡数据 {t: "target", p: {params}} 或 "target"
     */
    startLevel: function(levelData) {
        // 归一化
        const data = (typeof levelData === 'string') ? {t: levelData} : levelData;
        
        Logger.log("Starting level:", data);
        this.state.currentLevelData = data; // 保存原始数据用于分享
        this.state.isWon = false;

        // 不再代入参数，保留原始形式，让 Desmos 处理参数
        // const concreteTarget = MathEngine.substituteParams(data.t, data.p);
        this.state.currentTarget = data.t; // 保存原始目标用于判定（带参数形式）
        this.state.currentParams = data.p; // 保存参数列表

        // 设置目标函数和环境
        // 传递原始表达式，GraphManager 会处理参数滑块
        GraphManager.setupLevel(data.t, data.p);
        
        // 更新 URL
        const code = Utils.encodeLevel(data);
        Utils.setQueryParam('level', code);
        
        // 更新 UI 状态
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
     * 重置游戏状态
     */
    resetState: function() {
        this.state.isWon = false;
        this.state.currentLevelData = null;
        this.state.currentTarget = null;
        this.state.currentParams = null;
        // Determine if we need to reset level index based on mode? 
        // startRandomLevel sets mode to random, but maybe we should reset index there.
        // For now, just reset common flags.
    },

    /**
     * 开始随机关卡
     * @param {string} [difficultyOverride] 可选的难度设置
     */
    startRandomLevel: function(difficultyOverride) {
        this.state.mode = 'random';
        this.resetState();
        
        // Use MathEngine to generate function based on difficulty
        const difficulty = difficultyOverride || document.querySelector('.diff-btn.active')?.dataset.level || 'easy';
        const funcData = MathEngine.generateRandomFunction(difficulty);
        
        this.state.targetExpression = funcData.latex;
        // In random mode, we don't have a separate target string, just use latex
        this.state.targetFunction = funcData.expression; 
        
        console.log(`Starting Random Level (${difficulty}):`, this.state.targetExpression);
        
        // Hide target expression in Desmos by using GraphManager
        // This ensures consistent ID usage ('target-function') which is NOT hidden by CSS
        // The previous implementation used 'target' which was hidden by CSS
        if (window.GraphManager) {
            window.GraphManager.setupLevel(this.state.targetExpression, {});
        }

        // 更新 URL (分享链接) 为当前随机关卡
        const randomLevelData = { t: this.state.targetExpression, p: {} };
        const code = Utils.encodeLevel(randomLevelData);
        Utils.setQueryParam('level', code);
        this.state.currentLevelData = randomLevelData; // 更新 currentLevelData 确保一致性
        
        // Show message
        let diffName = "简单";
        if (difficulty === 'medium') diffName = "中等";
        if (difficulty === 'hard') diffName = "困难";
        if (difficulty === 'hell') diffName = "地狱";
        
        if (window.UIManager && window.UIManager.showMessage) {
            window.UIManager.showMessage(`随机挑战（${diffName}）开始了！请输入你的猜测。`);
            if (window.UIManager.updateUI) {
                window.UIManager.updateUI();
            }
        }
    },

    /**
     * 开始预设关卡
     * @param {number} index 关卡索引
     */
    startPresetLevel: function(index) {
        if (index < 0 || index >= window.LEVELS.length) {
            console.error("Invalid level index:", index);
            return;
        }

        this.state.mode = 'preset';
        this.state.currentLevelIndex = index;
        
        const levelData = window.LEVELS[index];
        // 预设关卡可能包含 params
        this.startLevel({
            t: levelData.target,
            p: levelData.params
        });
        
        // 显示关卡说明
        if (window.UIManager && window.UIManager.showLevelInstruction) {
            window.UIManager.showLevelInstruction(levelData);
        } else {
             UIManager.showMessage(`第 ${index + 1} 关：${levelData.title}`, "info");
        }
    },

    /**
     * 进入下一关
     */
    nextLevel: function() {
        if (this.state.mode === 'preset') {
            const nextIndex = this.state.currentLevelIndex + 1;
            if (nextIndex < window.LEVELS.length) {
                const nextLevelData = window.LEVELS[nextIndex];
                const currentRegion = this.getRegionForLevel(window.LEVELS[this.state.currentLevelIndex].id);
                const nextRegion = this.getRegionForLevel(nextLevelData.id);

                // Check if entering a new chapter (region)
                if (nextRegion && (!currentRegion || currentRegion.id !== nextRegion.id)) {
                    // It's a new chapter
                    if (nextRegion.descriptionPath || nextRegion.description) {
                         // Show story first
                         if (window.UIManager && window.UIManager.showStory) {
                             // Mark as seen so it doesn't show again when clicking a level
                             if (window.StorageManager && window.StorageManager.markChapterSeen) {
                                 window.StorageManager.markChapterSeen(nextRegion.id);
                             }

                             window.UIManager.showStory(nextRegion);
                             
                             // After story, return to level selection instead of starting level
                             window.UIManager.modalCallbacks['modal-story'] = () => {
                                 window.UIManager.renderLevelList();
                                 window.UIManager.showModal('modal-levels');
                             };
                             return;
                         }
                    }
                }
                
                this.startPresetLevel(nextIndex);
            } else {
                UIManager.showMessage("恭喜！你已经完成了所有预设关卡！", "success");
            }
        } else {
            this.startRandomLevel();
        }
    },

    /**
     * Helper to find region for a level ID
     */
    getRegionForLevel: function(levelId) {
        if (!window.REGIONS) return null;
        return window.REGIONS.find(r => r.levels.includes(levelId));
    },

    /**
     * 检查用户猜测
     */
    checkGuess: function() {
        if (this.state.isWon) {
            if (this.state.mode === 'preset') {
                this.nextLevel();
            } else {
                this.startRandomLevel();
            }
            return;
        }

        const userGuessData = GraphManager.getUserGuessData();
        
        if (!userGuessData || !userGuessData.latex) {
            UIManager.showMessage("请输入有效的表达式！", "error");
            return;
        }

        Logger.log("User guess:", userGuessData.latex);
        Logger.log("Params:", userGuessData.params);
        Logger.log("Target (Concrete):", this.state.currentTarget);

        // 调用 MathEngine 验证
        // 使用带参数的验证逻辑
        const isCorrect = MathEngine.verifyEquivalence(
            this.state.currentTarget, 
            userGuessData.latex,
            this.state.currentParams // 传入关卡定义的参数列表（用于识别哪些符号是参数）
        );

        if (isCorrect) {
            this.handleWin();
        } else {
            UIManager.showMessage("猜错了，请再试试！", "error");
        }
    },

    /**
     * 处理胜利
     */
    handleWin: function() {
        this.state.isWon = true;
        
        let msg = "恭喜你！猜对了！";
        if (this.state.mode === 'preset') {
            const levelData = window.LEVELS[this.state.currentLevelIndex];
            if (levelData) {
                StorageManager.markLevelCompleted(levelData.id);
            }
            
            if (this.state.currentLevelIndex < window.LEVELS.length - 1) {
                // Check if next level is in a new chapter
                const nextIndex = this.state.currentLevelIndex + 1;
                const nextLevelData = window.LEVELS[nextIndex];
                const currentRegion = this.getRegionForLevel(levelData.id);
                const nextRegion = this.getRegionForLevel(nextLevelData.id);
                
                const isNewChapter = nextRegion && (!currentRegion || currentRegion.id !== nextRegion.id);
                const nextBtnText = isNewChapter ? "下一章" : "下一关";
                
                // If it is next chapter, we need to show story BEFORE next level starts
                // BUT current logic is: click next -> show story -> go to level selection
                // So the button should probably just say "下一章" and lead to the story.
                // The current implementation of nextLevel handles this.
                
                msg += ` 点击“${nextBtnText}”继续。`;
                
                if (window.UIManager && window.UIManager.toggleNextButton) {
                    window.UIManager.toggleNextButton(true, nextBtnText);
                }
            } else {
                msg += " 你已通关所有预设关卡！";
            }
        } else {
            msg += " 请尝试新关卡。";
        }
        
        UIManager.showMessage(msg, "success");
    },

    /**
     * 获取分享链接
     */
    getShareLink: function() {
        // 优先使用当前实际运行的目标函数（随机模式下生成的新函数）
        if (this.state.targetExpression && this.state.mode === 'random') {
             // 随机模式下，this.state.currentLevelData 可能还是旧的或者初始的
             // 我们需要用当前的 targetExpression 构造一个新的 data
             const data = { t: this.state.targetExpression, p: {} };
             const code = Utils.encodeLevel(data);
             const url = new URL(window.location);
             url.searchParams.set('level', code);
             return url.toString();
        }

        if (!this.state.currentLevelData) return window.location.href;
        const code = Utils.encodeLevel(this.state.currentLevelData);
        const url = new URL(window.location);
        url.searchParams.set('level', code);
        return url.toString();
    }
};

// 暴露给全局
window.GameLogic = GameLogic;
