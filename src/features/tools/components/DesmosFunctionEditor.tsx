import React, { useEffect } from 'react';
import { loadDesmos } from '../../../utils/desmosLoader';
import { SYSTEM_LOGS } from '../../../utils/systemLogs';

export const DesmosFunctionEditor = ({ 
  initialFunction, 
  params,
  onChange 
}: { 
  initialFunction: string; 
  params?: Record<string, number> | null;
  onChange: (latex: string, newParams?: Record<string, number>) => void; 
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const calculatorRef = React.useRef<Desmos.Calculator | null>(null);
  const isUpdatingRef = React.useRef(false);
  const onChangeRef = React.useRef(onChange);
  const initialFunctionRef = React.useRef(initialFunction);
  const paramsRef = React.useRef(params);

  useEffect(() => {
    onChangeRef.current = onChange;
    initialFunctionRef.current = initialFunction;
    paramsRef.current = params;
  }, [onChange, initialFunction, params]);

  useEffect(() => {
    let isMounted = true;
    const initDesmos = async () => {
      try {
        await loadDesmos();
        if (!isMounted) return;
        
        if (window.Desmos && containerRef.current && !calculatorRef.current) {
          calculatorRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
            language: 'zh-CN',
            keypad: true,
            expressions: true,
            settingsMenu: false,
            zoomButtons: true,
            lockViewport: false,
            graphpaper: true,
          });

          const calc = calculatorRef.current;
          
          calc.setExpression({
            id: 'target-function',
            latex: initialFunctionRef.current || '',
            color: '#3b82f6' // 替换硬编码的 window.Desmos.Colors.BLUE，使用更柔和?tailwind blue-500
          });

          if (paramsRef.current) {
            Object.entries(paramsRef.current).forEach(([key, val]) => {
              calc.setExpression({
                id: `param-${key}`,
                latex: `${key}=${val}`,
                sliderBounds: { min: '-10', max: '10', step: '0.1' }
              });
            });
          }

          calc.observeEvent('change', () => {
            if (isUpdatingRef.current) return;
            const exprs = calc.getExpressions();
            if (exprs.length > 0) {
              const targetExpr = exprs.find(e => e.id === 'target-function') || exprs[0];
              
              const newParams: Record<string, number> = {};
              exprs.forEach(e => {
                // Ignore the main function, parse all other expressions as potential params
                if (e.id !== 'target-function' && e.latex) {
                  // Capture user added parameters (either via slider UI or manually typing like a=1)
                  const match = e.latex.match(/^([a-zA-Z])\s*=\s*(.*)/);
                  if (match && match[1] && match[2]) {
                    const key = match[1];
                    const val = parseFloat(match[2]);
                    if (!isNaN(val)) {
                      newParams[key] = val;
                      
                      // Also ensure the slider ID is synced so we don't duplicate sliders
                      if (!e.id.startsWith('param-')) {
                        // Use a timeout to let Desmos finish its current event loop before modifying IDs
                        setTimeout(() => {
                          const currentCalc = calculatorRef.current;
                          if (currentCalc) {
                            currentCalc.setExpression({ id: `param-${key}`, latex: e.latex, sliderBounds: { min: '-10', max: '10', step: '0.1' } });
                            currentCalc.removeExpression({ id: e.id });
                          }
                        }, 0);
                      }
                    }
                  }
                }
              });

              if (targetExpr && targetExpr.latex !== undefined) {
                // If it's just the user typing a single "=", targetExpr.latex might be partial or have a trailing "=", 
                // but let's let Desmos handle its own state and just report it upstream without forcibly causing a re-render.
                isUpdatingRef.current = true;
                onChangeRef.current(targetExpr.latex, Object.keys(newParams).length > 0 ? newParams : undefined);
                setTimeout(() => { isUpdatingRef.current = false; }, 10);
              }
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
  }, []);

  useEffect(() => {
    const calc = calculatorRef.current;
    if (calc) {
      const exprs = calc.getExpressions();
      const firstExpr = exprs.find(e => e.id === 'target-function') || exprs[0];
      
      // 避免当用户正在输入时，因为父组件状态更新又将半成品覆盖回来（导致输?= 时被吞掉?
      // 只有在初始加载，或者父组件传入了确切不同的目标时才覆盖
      // Desmos 在输入等号时，内?state 可能会暂时将 latex 解析为空或者进行某种内部变?
      // 这里的判定逻辑应放宽或者交给内部处?
      if (!isUpdatingRef.current && (!firstExpr || firstExpr.latex !== initialFunction)) {
        isUpdatingRef.current = true;
        calc.setExpression({
          id: firstExpr ? firstExpr.id : 'target-function',
          latex: initialFunction,
          color: '#3b82f6' // 替换硬编码的 window.Desmos.Colors.BLUE，使用更柔和?tailwind blue-500
        });
        setTimeout(() => { isUpdatingRef.current = false; }, 50);
      }
      
      // 注意：不要在每次 initialFunction 更新时都重置 params 滑块
      // 因为 Desmos 内部会自动处理滑块状态。频繁调?setExpression 会导?Desmos 将正在输入的新滑块重置或删除?
      // 如果 params 未改变，就不需?setExpression
      if (params && JSON.stringify(params) !== JSON.stringify(paramsRef.current)) {
        Object.entries(params).forEach(([key, val]) => {
          calc.setExpression({
            id: `param-${key}`,
            latex: `${key}=${val}`
          });
        });
        paramsRef.current = params;
      }
    }
  }, [initialFunction, params]);

  return <div ref={containerRef} className="w-full h-full absolute inset-0" />;
};
