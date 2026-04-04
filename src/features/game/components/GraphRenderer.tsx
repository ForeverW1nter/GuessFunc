import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useUIStore } from '../../../store/useUIStore';
import { loadDesmos } from '../../../utils/desmosLoader';
import { GAME_CONSTANTS } from '../../../utils/constants';

export const GraphRenderer = () => {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<Desmos.Calculator | null>(null);
  const [isReady, setIsReady] = useState(false);

  const targetFunction = useGameStore((state) => state.targetFunction);
  const levelParams = useGameStore((state) => state.levelParams);
  const setPlayerInput = useGameStore((state) => state.setPlayerInput);
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);

  useEffect(() => {
    // 当侧边栏状态改变时，通知 Desmos 重新计算尺寸
    if (calculatorRef.current) {
      setTimeout(() => {
        calculatorRef.current?.resize();
      }, GAME_CONSTANTS.SIDEBAR_ANIMATION_DURATION_MS); // 等待 CSS transition 结束
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    let isMounted = true;

    const initDesmos = async () => {
      try {
        await loadDesmos();
        if (!isMounted) return;

        if (window.Desmos && containerRef.current && !calculatorRef.current) {
          // 完全复刻原版的初始化配置
          calculatorRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
            language: i18n.language === 'zh' ? 'zh-CN' : 'en',
            keypad: true,            // 必须开启：原生 Desmos 键盘
            expressions: true,       // 必须开启：左侧表达式列表
            settingsMenu: false,     // 隐藏 Desmos 自带的设置菜单
            zoomButtons: true,
            lockViewport: false,
            graphpaper: true,
          });
          setIsReady(true);

          const calc = calculatorRef.current;

          // 1. 隐藏定义目标函数 (复刻原版逻辑)
          calc.setExpression({
            id: 'target-function',
            latex: `f\\left(x\\right)=${targetFunction}`,
            hidden: true, // 使用 hidden 可以隐藏图象，但可以在其他地方调用
            secret: true // 使用 secret 隐藏函数定义，不在左侧列表显示
          });

          // 2. 预留给玩家输入的预设函数 (复刻原版：默认给个 x，红色，放在第一行以便提取)
          calc.setExpression({
            id: 'user-guess',
            latex: 'x', 
            color: window.Desmos.Colors.RED,
            lineWidth: 3
          });

          // 3. 在图表上绘制目标函数曲线 (黑色，粗线，放在第二行)
          calc.setExpression({
            id: 'target-plot',
            latex: 'f\\left(x\\right)', // 仅仅调用隐藏的 f(x)
            color: window.Desmos.Colors.BLACK,
            lineWidth: 4, // 原版是 4
          });

          // 监听表达式变化
          calc.observeEvent('change', () => {
            const expressions = calc.getExpressions();
            
            // 1. 提取所有可能的参数滑块 (如 a=1)
            const params: Record<string, number> = {};
            expressions.forEach((e) => {
              if (e.latex && e.id !== 'target-function' && e.id !== 'target-plot' && e.id !== 'user-guess') {
                // 更稳健的解析逻辑，避免脆弱的字符串拆解
                const match = e.latex.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)$/);
                if (match) {
                  params[match[1]] = parseFloat(match[2]);
                }
              }
            });

            // 2. 寻找玩家的主猜测函数 (排除目标函数和纯参数赋值)
            const guessExpr = expressions.find((e) => 
              e.id !== 'target-function' && 
              e.id !== 'target-plot' && 
              (e.type === 'expression' || !e.type) &&
              e.latex && e.latex.trim() !== '' &&
              !/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)$/.test(e.latex)
            );

            if (guessExpr && guessExpr.latex) {
              let latex = guessExpr.latex;
              const eqIndex = latex.indexOf('=');
              if (eqIndex !== -1 && !latex.includes('<') && !latex.includes('>')) {
                latex = latex.substring(eqIndex + 1); // 提取等号之后的部分用于验证
              }
              setPlayerInput(latex.trim(), params);
            } else {
              setPlayerInput('', params);
            }
          });
        }
      } catch (error) {
        console.error("Failed to load Desmos", error);
      }
    };

    initDesmos();

    return () => {
      isMounted = false;
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
        calculatorRef.current = null;
      }
    };
  }, [setPlayerInput, targetFunction, i18n.language]); // 仅在初始化时运行一次，补充了 lint 依赖

  useEffect(() => {
    // 当容器大小改变时（例如移动端地址栏收起导致的高度变化），通知 Desmos 重新计算尺寸
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      calculatorRef.current?.resize();
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isReady]);

  // 监听 targetFunction 和 levelParams 的变化，单独更新表达式
  useEffect(() => {
    const calc = calculatorRef.current;
    if (!calc || !isReady) return;

    // 更新隐藏的目标函数定义
    calc.setExpression({
      id: 'target-function',
      latex: `f\\left(x\\right)=${targetFunction}`,
      hidden: true,
      secret: true
    });

    // 重新绘制调用
    calc.setExpression({
      id: 'target-plot',
      latex: 'f\\left(x\\right)',
      color: window.Desmos.Colors.BLACK,
      lineWidth: 4,
    });

    // 清理旧的参数滑块
    const currentExprs = calc.getExpressions();
    const oldParams = currentExprs.filter(e => e.id.startsWith('param-'));
    oldParams.forEach(e => {
      calc.removeExpression({ id: e.id });
    });

    // 更新新的参数滑块
    if (levelParams && Object.keys(levelParams).length > 0) {
      const exprs = Object.entries(levelParams).map(([key, val]) => ({
        id: `param-${key}`,
        latex: `${key}=${val}`
      }));
      calc.setExpressions(exprs);
    }
  }, [targetFunction, levelParams, isReady]);

  return (
    <div className="absolute inset-0 w-full h-full touch-none bg-app-bg">
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full"
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-app-bg text-app-text z-50">
          {t('game.loadingEngine')}
        </div>
      )}
    </div>
  );
};
