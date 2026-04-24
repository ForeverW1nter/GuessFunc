import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GraphRenderer } from './components/GraphRenderer';
import { Theme } from 'mafs';
import { TerminalLayout } from '@/foundation/ui/layouts/TerminalLayout';

export const GuessFuncPage = () => {
  const [expression, setExpression] = useState('a * sin(x) + b');
  const [params, setParams] = useState<Record<string, number>>({ a: 1, b: 0 });
  const { t } = useTranslation();

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const currentThemeColor = Theme.blue; // Matches modern blue accent

  return (
    <TerminalLayout
      layoutId="guessfunc"
      title={t('guessFunc.title', 'GUESS FUNC')}
      subtitle={t('guessFunc.subtitle', 'System.Engine.Active')}
      accentColorVar="var(--accent-guessfunc)"
      onClosePath="/creator"
      statusText={t('common.engineLive', 'Engine Live')}
      leftPanelContent={
        <div className="w-full h-full relative group rounded-3xl border border-[var(--color-border)] bg-[var(--color-muted)] shadow-2xl overflow-hidden">
          {/* A subtle glowing backdrop behind the graph */}
          <div className="absolute inset-0 bg-[var(--accent-guessfunc)] opacity-5 blur-2xl group-hover:opacity-10 transition-opacity duration-700 pointer-events-none" />
          <GraphRenderer
            expression={expression}
            parameters={params}
            lineColor={currentThemeColor}
            height={800} // Will naturally be constrained by flex layout via Mafs container scaling
          />
        </div>
      }
      rightPanelContent={
        <>
          {/* Input Block */}
          <section className="mb-10 space-y-4">
            <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
              {t('guessFunc.expressionLabel', 'Function Expression [ y = f(x) ]')}
            </label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 font-mono text-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all touch-manipulation"
              placeholder={t('guessFunc.expressionPlaceholder', 'e.g. sin(x) + a')}
              spellCheck={false}
            />
          </section>

          {/* Sliders Block */}
          <section className="space-y-8 flex-1">
            {Object.entries(params).map(([key, val]) => (
              <div key={key} className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
                    {t('guessFunc.variableLabel', 'Variable [{{key}}]', { key })}
                  </label>
                  <span className="font-mono text-sm">{val.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={val}
                  onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
                  className="w-full accent-[var(--color-primary)] bg-[var(--color-border)] h-1 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--color-primary)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                />
              </div>
            ))}
          </section>
        </>
      }
    />
  );
};
