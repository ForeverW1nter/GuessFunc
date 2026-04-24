import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GraphRenderer } from './components/GraphRenderer';
import { Theme } from 'mafs';
import { TerminalLayout } from '@/foundation/ui/layouts/TerminalLayout';
import { useGuessFuncStore } from './store/guessFuncStore';
import { Button } from '@/foundation/ui/components/Button';

export const GuessFuncPage = () => {
  const { t } = useTranslation();
  const { 
    level, expression, params, similarity, isSuccess,
    loadLevel, nextLevel, setExpression, setParam, reset 
  } = useGuessFuncStore();

  useEffect(() => {
    loadLevel(0); // Load first level on mount
    return () => reset();
  }, [loadLevel, reset]);

  const currentThemeColor = isSuccess ? Theme.green : Theme.blue;

  if (!level) return null;

  return (
    <TerminalLayout
      layoutId="guessfunc"
      title={t(level.titleKey, level.id)}
      subtitle={t(level.descKey, 'Guess the function')}
      accentColorVar="var(--accent-guessfunc)"
      onClosePath="/creator"
      statusText={`${Math.round(similarity)}% MATCH`}
      leftPanelContent={
        <div className="w-full h-full relative group rounded-3xl border border-[var(--color-border)] bg-[var(--color-muted)] shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[var(--accent-guessfunc)] opacity-5 blur-2xl group-hover:opacity-10 transition-opacity duration-700 pointer-events-none" />
          <GraphRenderer
            expression={expression}
            parameters={params}
            targetExpression={level.targetExpression}
            targetParameters={level.targetParams}
            lineColor={currentThemeColor}
            height={800}
          />
        </div>
      }
      rightPanelContent={
        <>
          {/* Similarity Meter */}
          <section className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
                {t('guessFunc.similarity', 'Similarity')}
              </label>
              <span className={`text-sm font-mono font-medium ${isSuccess ? 'text-green-500' : ''}`}>
                {Math.round(similarity)}%
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${isSuccess ? 'bg-green-500' : 'bg-[var(--accent-guessfunc)]'}`}
                style={{ width: `${similarity}%` }}
              />
            </div>
          </section>

          {/* Input Block */}
          <section className="mb-10 space-y-4">
            <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
              {t('guessFunc.expressionLabel', 'Function Expression [ y = f(x) ]')}
            </label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 font-mono text-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent-guessfunc)] transition-all touch-manipulation"
              placeholder={t('guessFunc.expressionPlaceholder', 'e.g. sin(x) + a')}
              spellCheck={false}
              disabled={isSuccess}
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
                  onChange={(e) => setParam(key, parseFloat(e.target.value))}
                  disabled={isSuccess}
                  className="w-full accent-[var(--accent-guessfunc)] bg-[var(--color-border)] h-1 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--accent-guessfunc)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer disabled:opacity-50"
                />
              </div>
            ))}
          </section>

          {isSuccess && (
            <div className="mt-8 p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-green-500 font-bold tracking-widest mb-4 uppercase">
                {t('guessFunc.syncComplete', 'SYNC COMPLETE')}
              </h3>
              <Button onClick={nextLevel} className="w-full">
                {t('guessFunc.nextLevel', 'Next Level')}
              </Button>
            </div>
          )}
        </>
      }
    />
  );
};
