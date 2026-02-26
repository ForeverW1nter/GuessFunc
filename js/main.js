/**
 * 主入口文件
 * 负责初始化整个应用
 */

window.addEventListener('DOMContentLoaded', async function() {
    console.log("Initializing GuessFunc...");

    // 1. 初始化图形管理器 (Desmos)
    // 必须首先初始化，因为 GameLogic 可能需要操作它
    try {
        await GraphManager.init('calculator');
    } catch (e) {
        console.error("GraphManager init failed:", e);
        return;
    }

    // 2. 初始化 UI 事件
    UIManager.init();

    // 3. 初始化游戏逻辑
    // 这会自动调用 MathEngine.init() 并等待其就绪
    // 然后加载关卡或生成随机关卡
    await GameLogic.init();
    
    console.log("GuessFunc initialization complete.");
});
