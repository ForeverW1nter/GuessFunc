// Game constants

export const GAME_CONSTANTS = {
  DEFAULT_DOMAIN: [-10, 10] as [number, number],
  SIDEBAR_ANIMATION_DURATION_MS: 300,
  NON_STORY_ROUTES: ['random', 'create', 'custom', 'share'],
  MATH_ENGINE: {
    // 蒙特卡洛采样的基准点
    BASE_TEST_POINTS: [-4.12, -2.5, -1, -0.1, 0.1, 1, 2.5, 4.12],
    // 随机采样点的数量
    NUM_RANDOM_SAMPLES: 12,
    // 数值对比的容差（相对误差和绝对误差）
    TOLERANCE: 1e-5,
    // 极小复数虚部容差
    IMAGINARY_TOLERANCE: 1e-10,
    // 允许的定义域不匹配点数量阈值
    DOMAIN_MISMATCH_THRESHOLD: 3,
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
  }
};
