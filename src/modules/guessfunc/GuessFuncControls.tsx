import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGuessFuncStore } from './store/guessFuncStore';

const PARAM_MIN = -10;
const PARAM_MAX = 10;
const PARAM_STEP = 0.1;
const DEBOUNCE_MS = 300;

export const GuessFuncControls = () => {
  const { expression, params, similarity, isSuccess, setExpression, setParam, calculateSimilarity } = useGuessFuncStore();
  const { t } = useTranslation();

  // Debounce the heavy math compilation when user is typing the expression
  useEffect(() => {
    if (isSuccess) return;
    
    const handler = setTimeout(() => {
      calculateSimilarity();
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [expression, calculateSimilarity, isSuccess]);

  return (
    <div className="flex flex-col h-full space-y-10">
      {/* Similarity Meter */}
      <section className="space-y-4">
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
      <section className="space-y-4">
        <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {t('guessFunc.expressionLabel', 'Function Expression [ y = f(x) ]')}
        </label>
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          disabled={isSuccess}
          className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 font-mono text-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent-guessfunc)] transition-all touch-manipulation disabled:opacity-50"
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
              min={PARAM_MIN}
              max={PARAM_MAX}
              step={PARAM_STEP}
              value={val}
              onChange={(e) => setParam(key, parseFloat(e.target.value))}
              disabled={isSuccess}
              className="w-full accent-[var(--accent-guessfunc)] bg-[var(--color-border)] h-1 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--accent-guessfunc)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer disabled:opacity-50"
            />
          </div>
        ))}
      </section>
    </div>
  );
};
