
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
            const expr = Utils.decodeLevel(levelCode);
            // 简单验证：只要不是空的就行，MathEngine.verifyEquivalence 会处理非法输入
            if (expr) {
                this.startLevel(expr);
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
     * @param {string} expr 目标表达式 (LaTeX)
     */
    startLevel: function(expr) {
        Logger.log("Starting level:", expr);
        this.state.currentLevelExpr = expr;
        this.state.isWon = false;

        // 设置目标函数
        GraphManager.setTargetFunction(expr);
        GraphManager.clearAllExceptTarget(); // 清空用户输入
        
        // 更新 URL
        const code = Utils.encodeLevel(expr);
        Utils.setQueryParam('level', code);
        
        // 更新 UI 状态
        if (this.state.mode === 'preset') {
             // 预设模式下，如果有下一关按钮，先隐藏，等赢了再显示
             if (window.UIManager && window.UIManager.toggleNextButton) {
                 window.UIManager.toggleNextButton(false);
             }
        } else {
             // 随机模式下，隐藏下一关按钮
             if (window.UIManager && window.UIManager.toggleNextButton) {
                 window.UIManager.toggleNextButton(false);
             }
        }
    },

    /**
     * 开始随机关卡
     */
    startRandomLevel: function() {
        this.state.mode = 'random';
        this.state.currentLevelIndex = -1;
        
        let expr = null;
        let attempts = 0;
        const maxAttempts = 20; 

        // 尝试生成一个合格的随机函数
        while (attempts < maxAttempts) {
            attempts++;
            const candidateExpr = MathEngine.generateRandomExpression();

            // 验证：检查函数在 (-10, 10) 区间内是否有定义
            // 避免生成像 sqrt(-x^2-10) 这种空函数
            if (MathEngine.isDefinedInRange(candidateExpr)) {
                expr = candidateExpr;
                break;
            }
        }

        if (!expr) {
            Logger.error(`Failed to generate a valid level after ${maxAttempts} attempts. Using fallback.`);
            expr = "sin(x) + x"; // 一个更可靠的备用函数
        }

        this.startLevel(expr);
        UIManager.showMessage("随机挑战开始了！请输入你的猜测。", "info");
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
        this.startLevel(levelData.target);
        
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
                this.startPresetLevel(nextIndex);
            } else {
                UIManager.showMessage("恭喜！你已经完成了所有预设关卡！", "success");
                // 可以回到随机模式或显示通关画面
            }
        } else {
            // 随机模式下，下一关就是重新随机
            this.startRandomLevel();
        }
    },

    /**
     * 检查用户猜测
     */
    checkGuess: function() {
        if (this.state.isWon) {
            // 如果已经赢了，点击确认猜测可能是想进入下一关
            if (this.state.mode === 'preset') {
                this.nextLevel();
            } else {
                this.startRandomLevel();
            }
            return;
        }

        const userGuess = GraphManager.getUserGuess();
        
        if (!userGuess) {
            UIManager.showMessage("请输入有效的表达式！", "error");
            return;
        }

        Logger.log("User guess:", userGuess);
        Logger.log("Target:", this.state.currentLevelExpr);

        // 调用 MathEngine 验证
        // MathEngine.verifyEquivalence(target, user)
        const isCorrect = MathEngine.verifyEquivalence(this.state.currentLevelExpr, userGuess);

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
                msg += " 点击“下一关”继续。";
                // 显示下一关按钮
                if (window.UIManager && window.UIManager.toggleNextButton) {
                    window.UIManager.toggleNextButton(true);
                }
            } else {
                msg += " 你已通关所有预设关卡！";
            }
        } else {
            msg += " 请尝试新关卡。";
        }
        
        UIManager.showMessage(msg, "success");
        // 可以在这里播放音效或撒花效果
    },

    /**
     * 获取分享链接
     */
    getShareLink: function() {
        if (!this.state.currentLevelExpr) return window.location.href;
        const code = Utils.encodeLevel(this.state.currentLevelExpr);
        const url = new URL(window.location);
        url.searchParams.set('level', code);
        return url.toString();
    }
};

// 暴露给全局
window.GameLogic = GameLogic;
