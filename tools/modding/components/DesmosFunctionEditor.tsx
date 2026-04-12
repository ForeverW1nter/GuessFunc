import React, { useEffect } from 'react';
import { loadDesmos } from '../../../src/utils/desmosLoader';
import { SYSTEM_LOGS } from '../../../src/utils/systemLogs';

export const DesmosFunctionEditor = ({ 
  initialFunction, 
  onChange 
}: { 
  initialFunction: string; 
  onChange: (latex: string) => void; 
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const calculatorRef = React.useRef<Desmos.Calculator | null>(null);
  const isUpdatingRef = React.useRef(false);
  const onChangeRef = React.useRef(onChange);
  const initialFunctionRef = React.useRef(initialFunction);

  useEffect(() => {
    onChangeRef.current = onChange;
    initialFunctionRef.current = initialFunction;
  }, [onChange, initialFunction]);

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
            color: '#2563eb' // 替换硬编码的 window.Desmos.Colors.BLUE
          });

          calc.observeEvent('change', () => {
            if (isUpdatingRef.current) return;
            const exprs = calc.getExpressions();
            if (exprs.length > 0) {
              const firstExpr = exprs[0];
              if (firstExpr && firstExpr.latex !== undefined) {
                onChangeRef.current(firstExpr.latex);
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
      const firstExpr = exprs[0];
      if (!firstExpr || firstExpr.latex !== initialFunction) {
        isUpdatingRef.current = true;
        calc.setExpression({
          id: firstExpr ? firstExpr.id : 'target-function',
          latex: initialFunction,
          color: '#2563eb' // 替换硬编码的 window.Desmos.Colors.BLUE
        });
        setTimeout(() => { isUpdatingRef.current = false; }, 50);
      }
    }
  }, [initialFunction]);

  return <div ref={containerRef} className="w-full h-full absolute inset-0" />;
};
