/**
 * 主入口文件
 * 负责初始化整个应用
 */

window.onload = function() {
    console.log("Initializing GuessFunc...");

    // 1. 初始化图形管理器
    GraphManager.init('calculator');

    // 2. 初始化 UI 事件
    UIManager.init();

    // 3. 初始化游戏逻辑 (这会加载关卡或生成随机关卡)
    // 延迟一点点以确保 Desmos 完全加载？通常不需要，但为了保险
    setTimeout(() => {
        GameLogic.init();
    }, 100);
};
