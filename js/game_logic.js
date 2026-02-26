/**
 * 游戏逻辑模块
 * 管理游戏状态、关卡生成与加载、判定流程
 */

const GameLogic = {
    state: {
        currentLevelExpr: null,
        isWon: false
    },

    /**
     * 初始化游戏
     */
    init: function() {
        // 检查 URL 是否有关卡参数
        const levelCode = Utils.getQueryParam('level');
        if (levelCode) {
            const expr = Utils.decodeLevel(levelCode);
            if (expr && MathEngine.isValid(expr)) {
                this.startLevel(expr);
                return;
            } else {
                alert("无效的关卡代码，将随机生成关卡。");
            }
        }
        
        // 默认随机关卡
        if (!levelCode) {
            this.startRandomLevel();
        }
    },

    /**
     * 开始一个新关卡
     * @param {string} expr 目标表达式
     */
    startLevel: function(expr) {
        console.log("Starting level:", expr);
        this.state.currentLevelExpr = expr;
        this.state.isWon = false;

        // 设置目标函数
        GraphManager.setTargetFunction(expr);
        GraphManager.clearAllExceptTarget(); // 清空用户输入
        
        UIManager.showMessage("新的挑战开始了！请输入你的猜测。", "info");
        
        // 更新 URL
        const code = Utils.encodeLevel(expr);
        Utils.setQueryParam('level', code);
    },

    /**
     * 开始随机关卡
     */
    startRandomLevel: function() {
        // 尝试生成有效关卡
        let expr;
        let isValid = false;
        let attempts = 0;

        while (!isValid && attempts < 10) {
            expr = MathEngine.generateRandomExpression();
            // 简单验证一下是否至少有定义
            // 生成的表达式只要符合语法，MathEngine 就能处理。
            // "若随机结果‘完全无定义’，则重新随机" -> 这需要 MathEngine 提供 checkDefined?
            // 目前 MathEngine.verifyEquivalence 会处理定义域问题。
            // 这里我们暂时假设生成的都是合法的。
            // 我们可以尝试 verify(expr, expr) 来看看是否有定义？
            if (MathEngine.verifyEquivalence(expr, expr)) {
                isValid = true;
            }
            attempts++;
        }

        if (!isValid) {
            console.error("Failed to generate valid level after 10 attempts");
            expr = "sin(x)"; // Fallback
        }

        this.startLevel(expr);
    },

    /**
     * 检查用户猜测
     */
    checkGuess: function() {
        if (this.state.isWon) {
            UIManager.showMessage("你已经赢了！请尝试新关卡。", "success");
            return;
        }

        const userGuess = GraphManager.getUserGuess();
        
        if (!userGuess) {
            UIManager.showMessage("请输入有效的表达式！", "error");
            return;
        }

        console.log("User guess:", userGuess);
        console.log("Target:", this.state.currentLevelExpr);

        // 调用 MathEngine 验证
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
        UIManager.showMessage("恭喜你！猜对了！", "success");
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
