export const SYSTEM_LOGS = {
  // AI Manager
  AI_NO_API_KEY: 'No valid API key or proxy found for AI Manager',
  AI_GENERATION_ATTEMPT: (attempt: number, max: number) => `[AIManager] Attempt to generate function (${attempt}/${max})...`,
  AI_GENERATION_FAILED: (attempt: number) => `[AIManager] Attempt ${attempt} failed:`,
  AI_API_ERROR: '[AIManager] API response error:',
  AI_RAW_RESPONSE: '[AIManager] AI raw response content:',
  AI_PARSE_RECOVERY_FAILED: 'Failed to parse JSON even with recovery',

  // Math Engine
  MATH_EVAL_START: '--- Starting Equivalence Validation ---',
  MATH_EVAL_TARGET: 'Target:',
  MATH_EVAL_PLAYER: 'Player:',
  MATH_INEQUALITY_PASSED: (matchRate: string) => `Inequality validation passed: Match rate ${matchRate}%`,
  MATH_EQUATION_PASSED: (ratio: number) => `Equation validation passed: Constant ratio ${ratio}`,
  MATH_AST_MATCH: 'Validation passed: AST structure match',
  MATH_DOMAIN_TOLERATED: (mismatch: number, valid: number) => `Tolerated ${mismatch} domain mismatches due to ${valid} valid points`,
  MATH_VALUE_TOLERATED: (valid: number) => `Tolerated 1 value mismatch due to ${valid} valid points`,
  MATH_SAMPLE_PASSED: (valid: number, total: number) => `Validation passed: Sample points match (${valid}/${total} valid points)`,
  MATH_ENGINE_ERROR: 'Validation engine exception:',
  MATH_PARSE_PARAM_ERROR: 'Failed to parse parameters:',

  // Debug & Logger
  DEBUG_MODE_ALL: '🔧 Debug Mode Enabled (ALL MODULES)',
  DEBUG_MODE_MODULES: (modules: string) => `🔧 Debug Mode Enabled (Modules: ${modules})`,
  DEBUG_MODE_HOTKEY: 'Debug mode activated via hotkey',

  // App & Error Boundary
  APP_ROUTE_PARSE_ERROR: (routeId: string) => `Failed to parse level params for route ${routeId}:`,
  ERROR_GLOBAL_REPORT_FAILED: 'Global error reporting failed',
  ERROR_BOUNDARY_UNCAUGHT: 'Uncaught error:',
  ERROR_BOUNDARY_REPORT_FAILED: 'Failed to report error to remote server:',
  ERROR_BOUNDARY_CLEARED: 'Cleared non-essential localStorage items to escape error boundary loop.',
  ERROR_LOAD_SLOT: 'Error loading slot',
  ERROR_IMPORT_DATA: 'Failed to import data:',
  ERROR_LOAD_CONFETTI: 'Failed to load canvas-confetti',

  // Tools & External
  TOOLS_PARSE_CACHE_ERROR: 'Failed to parse cached story data',
  STORY_PARSE_CREDITS_ERROR: 'Failed to parse credits data:',
  DESMOS_LOAD_ERROR: 'Failed to load Desmos',
  AUDIO_PLAY_ERROR: (path: string) => `Failed to play audio: ${path}`,
} as const;
