// Game constants

export const GAME_CONSTANTS = {
  DEFAULT_DOMAIN: [-10, 10] as [number, number],
  SIDEBAR_ANIMATION_DURATION_MS: 300,
  NON_STORY_ROUTES: ['random', 'create', 'custom', 'share'],
  MATH_ENGINE: {
    // 蒙特卡洛采样的基准点
    BASE_TEST_POINTS: [-4.12, -2.5, -1, -0.1, 0.1, 1, 2.5, 4.12],
    // 随机采样点的数量 (增加采样点以应对 floor 等分段函数的抖动，并提高容错率)
    NUM_RANDOM_SAMPLES: 42,
    // 数值对比的容差（相对误差和绝对误差）
    TOLERANCE: 1e-5,
    // 极小复数虚部容差
    IMAGINARY_TOLERANCE: 1e-10,
    // 允许的定义域不匹配点数量阈值 (相应提高容错阈值，针对像 1/x 这种在 0 处不匹配或 floor() 随机踩在跳跃点上的情况)
    DOMAIN_MISMATCH_THRESHOLD: 6,
  },
  GENERATOR: {
    // 最大尝试生成次数
    MAX_ATTEMPTS: 1000,
    // 检查图像有效性时的采样点数量
    VALIDATION_SAMPLES: 50,
    // 有效点数量下限
    MIN_VALID_POINTS: 10,
    // 图像 y 轴绝对值上限（用于判断是否发散）
    MAX_Y_VALUE: 100,
  },
  STORAGE_KEYS: {
    CURRENT_SLOT: 'guessfunc_current_slot',
    SLOT_PREFIX: 'guess-func-storage_slot',
    I18N_LANG: 'i18nextLng',
    STORY_EDITOR_DATA: 'storyEditorData',
    SYSTEM_PROMPT: 'guessfunc_system_prompt',
    CHAT_PROMPT: 'guessfunc_chat_prompt',
    AI_WELCOME: 'guessfunc_ai_welcome',
    API_KEY: 'guessfunc_api_key',
    USE_PROXY: 'guessfunc_use_proxy',
    MOD_ORDER: 'guessfunc_mod_order',
  },
  MOD_STORE: {
    GITEE_OWNER: 'A-T-O-M',
    GITEE_REPO: 'guess-func',
    DB_NAME: 'guessfunc_mod_db',
    STORE_NAME: 'guessfunc_mod_store',
  },
  FONTS: {
    DEFAULT_STORY_FONT: 'JetBrains Mono',
    CUSTOM_FONT_NAME: 'GuessFuncCustomFont',
  }
};
