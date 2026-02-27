/**
 * 主入口文件
 * 负责初始化整个应用
 */

window.addEventListener('DOMContentLoaded', async function() {
    console.log("Initializing GuessFunc...");

    // 1. 初始化 UI 事件 (尽早初始化，保证按钮可点击)
    UIManager.init();

    // 2. 初始化图形管理器 (Desmos)
    try {
        await GraphManager.init('calculator');
    } catch (e) {
        console.error("GraphManager init failed:", e);
        UIManager.showMessage("Desmos 加载失败，可能是网络问题。游戏无法进行。", "error");
        // 即使失败，也不阻断后续逻辑（虽然游戏玩不了，但至少 UI 还在）
    }

    // 3. 初始化游戏逻辑
    // 这会自动调用 MathEngine.init() 并等待其就绪
    // 然后加载关卡或生成随机关卡
    await GameLogic.init();
    
    console.log("GuessFunc initialization complete.");
});
