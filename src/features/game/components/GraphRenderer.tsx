import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useUIStore } from '../../../store/useUIStore';
import { loadDesmos } from '../../../utils/desmosLoader';
import { SYSTEM_LOGS } from '../../../utils/systemLogs';
import { GAME_CONSTANTS } from '../../../utils/constants';
import { parseRelation } from '../../../utils/mathEngine';
import { DESMOS_IDS, DEFAULT_USER_GUESS, DEFAULT_RELATION_GUESS } from './graphRendererConstants';

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
            settingsMenu: true,      // 必须开启以显示设置菜单 (齿轮图标)，玩家需要它来切换图表配置
            zoomButtons: true,
            lockViewport: false,
            graphpaper: true,
          });
          setIsReady(true);

          const calc = calculatorRef.current;
          
          const isTargetRelation = parseRelation(targetFunction) !== null;

          // 预留给玩家输入的预设函数
          calc.setExpression({
            id: DESMOS_IDS.USER_GUESS,
            latex: isTargetRelation ? DEFAULT_RELATION_GUESS : DEFAULT_USER_GUESS,
            color: window.Desmos.Colors.RED,
            lineWidth: 3
          });

          // 检查目标函数是否为空
          if (targetFunction) {
            if (isTargetRelation) {
              // 隐式方程直接渲染并隐藏解析式
              calc.setExpression({
                id: DESMOS_IDS.TARGET_PLOT,
                latex: targetFunction,
                color: window.Desmos.Colors.BLACK,
                lineWidth: 4,
                secret: true,
                hidden: false
              });
            } else {
              // 绘制目标函数曲线
              calc.setExpression({
                id: DESMOS_IDS.TARGET_PLOT,
                latex: 'f\\left(x\\right)',
                color: window.Desmos.Colors.BLACK,
                lineWidth: 4,
                secret: false
              });

              // 设置隐藏的目标函数定义
              calc.setExpression({
                id: DESMOS_IDS.TARGET_FUNCTION,
                latex: `f\\left(x\\right)=${targetFunction}`,
                hidden: true,
                secret: true
              });
            }
          }

          // 注入关卡参数滑块
          if (levelParams && Object.keys(levelParams).length > 0) {
      const exprs = Object.entries(levelParams).map(([key, val]) => ({
        id: `${DESMOS_IDS.PARAM_PREFIX}${key}`,
        latex: `${key}=${val}`,
        sliderBounds: { min: "-10", max: "10", step: "0.1" },
        secret: false
      }));
            calc.setExpressions(exprs);
          }

          // 监听表达式变化
          calc.observeEvent('change', () => {
            const expressions = calc.getExpressions();

            // 提取参数滑块
            const params: Record<string, number> = {};
            expressions.forEach((e) => {
              if (e.latex && !e.id.startsWith(DESMOS_IDS.PARAM_PREFIX) && e.id !== DESMOS_IDS.TARGET_FUNCTION && e.id !== DESMOS_IDS.TARGET_PLOT && e.id !== DESMOS_IDS.USER_GUESS) {
                const match = e.latex.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)$/);
                if (match) {
                  params[match[1]] = parseFloat(match[2]);
                }
              }
            });

            // 寻找玩家的主猜测函数
            const guessExpr = expressions.find((e) =>
              e.id !== DESMOS_IDS.TARGET_FUNCTION &&
              e.id !== DESMOS_IDS.TARGET_PLOT &&
              (e.type === 'expression' || !e.type) &&
              e.latex && e.latex.trim() !== '' &&
              !/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)$/.test(e.latex)
            );

            if (guessExpr && guessExpr.latex) {
              let latex = guessExpr.latex;

              const isTargetRelation = parseRelation(targetFunction) !== null;

              // 如果目标是纯函数且玩家输入了 y=...，提取等号右侧
              if (!isTargetRelation) {
                const eqIndex = latex.indexOf('=');
                if (eqIndex !== -1 && !latex.includes('<') && !latex.includes('>')) {
                  const lhs = latex.substring(0, eqIndex).trim();
                  // 只有左侧是 y 或 f(x) 时才截断
                  if (lhs === 'y' || lhs === 'f\\left(x\\right)') {
                    latex = latex.substring(eqIndex + 1); 
                  }
                }
              }
              setPlayerInput(latex.trim(), params);
            } else {
              setPlayerInput('', params);
            }
          });
        }
      } catch (error) {
        console.error(SYSTEM_LOGS.DESMOS_LOAD_ERROR, error);
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
  }, [setPlayerInput, targetFunction, levelParams, i18n.language]); // 仅在初始化时运行一次，补充了 lint 依赖

  useEffect(() => {
    // 监听容器大小变化
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      calculatorRef.current?.resize();
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isReady]);

  // 监听 targetFunction 和 levelParams 的变化
  useEffect(() => {
    const calc = calculatorRef.current;
    if (!calc || !isReady) return;

    const isTargetRelation = parseRelation(targetFunction) !== null;

    if (isTargetRelation) {
      // 移除旧的 target-function
      calc.removeExpression({ id: DESMOS_IDS.TARGET_FUNCTION });
      calc.setExpression({
        id: DESMOS_IDS.TARGET_PLOT,
        latex: targetFunction,
        color: window.Desmos.Colors.BLACK,
        lineWidth: 4,
        secret: true,
        hidden: false
      });
    } else {
      // 重新绘制目标函数
      calc.setExpression({
        id: DESMOS_IDS.TARGET_PLOT,
        latex: 'f\\left(x\\right)',
        color: window.Desmos.Colors.BLACK,
        lineWidth: 4,
        secret: false
      });

      // 更新隐藏的目标函数定义
      calc.setExpression({
        id: DESMOS_IDS.TARGET_FUNCTION,
        latex: `f\\left(x\\right)=${targetFunction}`,
        hidden: true,
        secret: true
      });
    }

    // 清理旧参数滑块
    const currentExprs = calc.getExpressions();
    const oldParams = currentExprs.filter(e => e.id.startsWith(DESMOS_IDS.PARAM_PREFIX));
    oldParams.forEach(e => {
      calc.removeExpression({ id: e.id });
    });

    // 更新新参数滑块
    if (levelParams && Object.keys(levelParams).length > 0) {
      const exprs = Object.entries(levelParams).map(([key, val]) => ({
        id: `${DESMOS_IDS.PARAM_PREFIX}${key}`,
        latex: `${key}=${val}`,
        sliderBounds: { min: "-10", max: "10", step: "0.1" },
        secret: false // 确保滑块可见
      }));
      calc.setExpressions(exprs);
    }
  }, [targetFunction, levelParams, isReady]);

  return (
    <div className="absolute inset-0 w-full h-full touch-none bg-background">
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full"
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background text-foreground z-50">
          {t('game.loadingEngine')}
        </div>
      )}
    </div>
  );
};
