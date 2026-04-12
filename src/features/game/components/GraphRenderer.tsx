import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useUIStore } from '../../../store/useUIStore';
import { loadDesmos } from '../../../utils/desmosLoader';
import { SYSTEM_LOGS } from '../../../utils/systemLogs';
import { GAME_CONSTANTS } from '../../../utils/constants';
import { parseRelation } from '../../../utils/mathEngine';

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

          // 1. 预留给玩家输入的预设函数 (复刻原版：默认给个 x，红色，放在第一行以便提取)
          calc.setExpression({
            id: 'user-guess',
            latex: isTargetRelation ? 'x^2+y^2=1' : 'x', 
            color: window.Desmos.Colors.RED,
            lineWidth: 3
          });

          // 2. 检查目标函数是否为空（比如分享/自由创作模式可能暂时没有）
          if (targetFunction) {
            if (isTargetRelation) {
              // 目标如果是隐式方程，直接渲染，并隐藏解析式
              calc.setExpression({
                id: 'target-plot',
                latex: targetFunction,
                color: window.Desmos.Colors.BLACK,
                lineWidth: 4,
                secret: true,
                hidden: false
              });
            } else {
              // 3. 在图表上绘制目标函数曲线 (黑色，粗线，隐藏公式文本不显示在侧边栏)
              calc.setExpression({
                id: 'target-plot',
                latex: 'f\\left(x\\right)', // 仅仅调用隐藏的 f(x)
                color: window.Desmos.Colors.BLACK,
                lineWidth: 4, // 原版是 4
                secret: false // 修改：要求展示这个外面的 f(x)
              });

              // 4. 在隐藏的表达式中设置 f(x) 以供调用，放在第二行
              calc.setExpression({
                id: 'target-function',
                latex: `f\\left(x\\right)=${targetFunction}`,
                hidden: true, // 使用 hidden 可以隐藏图象，但可以在其他地方调用
                secret: true // 修改：要求隐藏里面具体的解析式
              });
            }
          }

          // 5. 如果有关卡参数，注入到面板中，使得参数滑块显示在目标函数下方
          if (levelParams && Object.keys(levelParams).length > 0) {
            const exprs = Object.entries(levelParams).map(([key, val]) => ({
              id: `param-${key}`,
              latex: `${key}=${val}`,
              sliderBounds: { min: "-10", max: "10", step: "0.1" },
              secret: false // 确保滑块可见
            }));
            calc.setExpressions(exprs);
          }

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

            // 寻找玩家的主猜测函数：取第一个非系统、非参数、且非空的表达式
            // 不再绑定特定的 user-guess ID，因为玩家可能会拖动、删除或新建格子
            const guessExpr = expressions.find((e) => 
              e.id !== 'target-function' && 
              e.id !== 'target-plot' && 
              (e.type === 'expression' || !e.type) &&
              e.latex && e.latex.trim() !== '' &&
              !/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)$/.test(e.latex)
            );

            if (guessExpr && guessExpr.latex) {
              let latex = guessExpr.latex;
              
              // 检查目标函数是否是关系式（方程或不等式）
               const isTargetRelation = parseRelation(targetFunction) !== null;
              
              // 只有当目标是纯函数（没有关系符），且玩家输入了 y=... 时，我们才提取等号右侧
              // 如果目标本身就是方程或不等式，我们保留玩家的完整输入进行 2D 匹配
              if (!isTargetRelation) {
                const eqIndex = latex.indexOf('=');
                if (eqIndex !== -1 && !latex.includes('<') && !latex.includes('>')) {
                  const lhs = latex.substring(0, eqIndex).trim();
                  // 只有左侧纯粹是 y 或 f(x) 时才截断，支持隐式方程（如 x^2+y^2=1）
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

    const isTargetRelation = parseRelation(targetFunction) !== null;

    if (isTargetRelation) {
      // 移除原有的 target-function（如果是从函数切换过来的）
      calc.removeExpression({ id: 'target-function' });
      calc.setExpression({
        id: 'target-plot',
        latex: targetFunction,
        color: window.Desmos.Colors.BLACK,
        lineWidth: 4,
        secret: true,
        hidden: false
      });
    } else {
      // 重新绘制调用
      calc.setExpression({
        id: 'target-plot',
        latex: 'f\\left(x\\right)',
        color: window.Desmos.Colors.BLACK,
        lineWidth: 4,
        secret: false // 修改：要求展示这个外面的 f(x)
      });

      // 更新隐藏的目标函数定义 (将其秘密隐藏)
      calc.setExpression({
        id: 'target-function',
        latex: `f\\left(x\\right)=${targetFunction}`,
        hidden: true,
        secret: true // 修改：要求隐藏里面具体的解析式
      });
    }

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
