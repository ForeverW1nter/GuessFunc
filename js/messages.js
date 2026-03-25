/**
 * 提示信息配置模块
 * 集中管理游戏中所有的提示、警告、确认弹窗等文本
 */

window.MESSAGES = {
    // 初始化和网络相关
    init: {
        desmosFailed: "Desmos 加载失败，可能是网络问题。游戏无法进行。",
        legacyMigrated: "检测到您的旧版游戏进度！为了适配新的多线路剧情系统，您的旧版存档已自动迁移至【The Day Before Tomorrow】中。您可以在“预设”菜单的左上角切换线路来继续您的旧版进度。",
        engineLoading: "正在加载数学引擎...",
        engineFailed: "数学引擎加载失败，请刷新重试。",
        desmosNetworkError: "Desmos 加载失败，请检查网络。"
    },

    // 游戏逻辑相关
    game: {
        invalidLevelCode: "无效的关卡代码，将随机生成关卡。",
        randomChallengeStart: "随机挑战（{diffName}）开始了！请输入你的猜测。",
        presetLevelTitle: "第 {index} 关：{title}",
        nextLevelLocked: "下一关未解锁：{reason}",
        allPresetCompleted: "恭喜！你已经完成了所有预设关卡！",
        clickTopToStart: "请点击顶部按钮开始新挑战。",
        invalidExpression: "请输入有效的表达式！",
        guessWrong: "猜错了，请再试试！",
        guessCorrect: "恭喜！你猜对了！\n\n目标函数：{target}\n你的猜测：{guess}",
        guessCorrectEquivalent: "恭喜！你猜对了！（形式等价）\n\n目标函数：{target}\n你的猜测：{guess}",
        guessCorrectValue: "恭喜！你猜对了！（数值等价）\n\n目标函数：{target}\n你的猜测：{guess}",
        confirmExitPreset: "确定要退出闯关，返回选关界面吗？",
        exitConfirmTitle: "退出确认",
        confirmCreateLevel: "是否使用以下表达式及参数 ({params}) 创建新关卡？<br><br><div style=\"text-align:center;font-size:1.2rem;overflow-x:auto;\">{latex}</div>",
        createLevelTitle: "创建自定义关卡",
        createLevelSuccess: "关卡创建成功！点击“分享”获取链接。",
        createLevelRequireInput: "请先在 Desmos 面板的第一行输入一个有效的函数表达式，然后点击此按钮。",
        levelLocked: "关卡未解锁！条件：{reason}",
        regionLocked: "章节未解锁！条件：{reason}",
        hintPrefix: "提示：{hint}"
    },

    // AI 相关
    ai: {
        generating: "正在调用 AI 生成题目...",
        noApiOrProxy: "未配置代理接口且未检测到 API Key，已自动切换为本地随机生成。您可以在“选项 -> API 设置”中填入 Key 以启用 AI。",
        invalidKeyOrProxy: "{reason}",
        keyInvalidFallback: "API Key 无效，请检查设置。已自动切换为本地随机生成。",
        proxyAuthFailed: "代理接口授权失败，请检查 Worker 配置。",
        rateLimited: "请求过于频繁，请稍后再试（已触发防 DDoS 限制）。"
    },

    // 设置和系统相关
    settings: {
        fontLoadFailed: "字体文件过大或浏览器不支持本地存储。",
        assistModeToggle: "剧情预览模式已{status}",
        speedrunModeToggle: "速通模式已{status}",
        speedrunOn: "开启（将跳过剧情和动画）",
        speedrunOff: "关闭",
        statusOn: "开启",
        statusOff: "关闭",
        saveSuccess: "设置已保存！",
        promptSaved: "自定义提示词已保存！",
        promptReset: "已恢复默认提示词！",
        aboutLoadFailed: "加载关于信息失败。",
        changelogLoadFailed: "加载更新日志失败。"
    },

    // 存档相关
    save: {
        legacyDetected: "检测到旧版存档代码！已自动迁移至【The Day Before Tomorrow】中。",
        importSuccess: "存档导入成功！",
        importFailed: "存档无效！",
        importPromptMsg: "请输入存档代码：",
        importPromptTitle: "导入存档",
        cleared: "存档已清空。",
        clearConfirmMsg: "确定要清空所有存档进度吗？此操作不可撤销！",
        clearConfirmTitle: "警告",
        slotSwitched: "已切换到存档槽位 {slot}"
    },

    // 通用工具
    utils: {
        copySuccess: "已复制到剪贴板！",
        copyManualPrompt: "请手动复制：",
        copyFailedTitle: "复制失败"
    },

    // 关卡列表 UI
    ui: {
        noPresetLevels: "暂无预设关卡。"
    },

    /**
     * 格式化消息字符串，替换占位符
     * @param {string} key 消息键，例如 "game.randomChallengeStart"
     * @param {Object} params 替换参数，例如 { diffName: "难度 1" }
     * @returns {string} 格式化后的字符串
     */
    get: function(key, params = {}) {
        const keys = key.split('.');
        let msg = this;
        for (const k of keys) {
            if (msg[k] === undefined) {
                console.warn(`[MESSAGES] Key not found: ${key}`);
                return key;
            }
            msg = msg[k];
        }

        if (typeof msg !== 'string') {
            console.warn(`[MESSAGES] Key is not a string: ${key}`);
            return key;
        }

        // 替换 {param}
        return msg.replace(/{(\w+)}/g, (match, p1) => {
            return params[p1] !== undefined ? params[p1] : match;
        });
    }
};
