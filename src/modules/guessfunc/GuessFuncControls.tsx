import { useTranslation } from 'react-i18next';
import { useGuessFuncStore } from './store/guessFuncStore';
import { Button } from '@/foundation/ui/components/Button';
import { Loader2 } from 'lucide-react';

const PARAM_MIN = -10;
const PARAM_MAX = 10;
const PARAM_STEP = 0.1;

export const GuessFuncControls = () => {
  const { expression, params, isVerifying, isSuccess, verifyError, setExpression, setParam, verify } = useGuessFuncStore();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full space-y-10">
      {/* Input Block */}
      <section className="space-y-4">
        <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {t('guessFunc.expressionLabel', 'Function Expression [ y = f(x) ]')}
        </label>
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          disabled={isSuccess || isVerifying}
          className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 font-mono text-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent-guessfunc)] transition-all touch-manipulation disabled:opacity-50"
          placeholder={t('guessFunc.expressionPlaceholder', 'e.g. sin(x) + a')}
          spellCheck={false}
        />
        {verifyError && (
          <p className="text-xs font-mono text-red-500 uppercase tracking-widest">
            {t(verifyError, 'Equivalence Check Failed')}
          </p>
        )}
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
              disabled={isSuccess || isVerifying}
              className="w-full accent-[var(--accent-guessfunc)] bg-[var(--color-border)] h-1 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--accent-guessfunc)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer disabled:opacity-50"
            />
          </div>
        ))}
      </section>

      {/* Action Block */}
      <section className="pt-6 border-t border-[var(--color-border)]">
        <Button 
          onClick={verify} 
          disabled={isSuccess || isVerifying || !expression}
          className="w-full h-12 text-sm font-mono tracking-widest uppercase relative overflow-hidden group"
          style={{ backgroundColor: isSuccess ? 'var(--color-muted)' : 'var(--accent-guessfunc)', color: 'var(--color-background)' }}
        >
          {isVerifying && (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('guessFunc.verifying', 'VERIFYING...')}
            </span>
          )}
          {!isVerifying && isSuccess && t('guessFunc.syncComplete', 'SYNC COMPLETE')}
          {!isVerifying && !isSuccess && t('guessFunc.verify', 'VERIFY EQUIVALENCE')}
        </Button>
      </section>
    </div>
  );
};
