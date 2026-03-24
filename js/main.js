/**
 * 主入口文件，负责初始化整个应用
 */

window.addEventListener('DOMContentLoaded', async function() {
    console.log("Initializing GuessFunc...");

    // 0. 初始化音频管理器
    if (window.AudioManager) {
        AudioManager.init();
    }

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
    
    // 4. 检查是否发生了旧版存档迁移
    if (window.guessfunc_legacy_migrated) {
        // 延迟一点弹出，确保 UI 已经稳定
        setTimeout(() => {
            alert("检测到您的旧版游戏进度！\n\n为了适配新的多线路剧情系统，您的旧版存档已自动迁移至【The Day Before Tomorrow】中。\n您可以在“预设”菜单的左上角切换线路来继续您的旧版进度。");
        }, 500);
        window.guessfunc_legacy_migrated = false; // 清除标记
    }
    
    console.log("GuessFunc initialization complete.");
});
