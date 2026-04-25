import { useTranslation } from 'react-i18next';
import { useGuessFuncStore } from './store/guessFuncStore';
import { Button } from '@/foundation/ui/components/Button';
import { Loader2, Plus, X } from 'lucide-react';
import { MathField } from './components/MathField';
import { TerminalSlider } from './components/TerminalSlider';

const PARAM_MIN = -10;
const PARAM_MAX = 10;
const PARAM_STEP = 0.1;

export const GuessFuncControls = () => {
  const { functions, params, isVerifying, isSuccess, verifyError, setExpression, addFunction, removeFunction, setParam, verify } = useGuessFuncStore();
  const { t } = useTranslation();

  const mainFunc = functions.find(f => f.id === 'f') || functions[0];

  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2 pb-4 scrollbar-hide">
      {/* Input Block */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
            {t('guessFunc.expressionLabel', 'Function Expression')}
          </label>
          <button 
            onClick={addFunction}
            disabled={isSuccess || isVerifying || functions.length >= 5}
            className="flex items-center gap-1 text-[10px] font-mono text-[var(--accent-guessfunc)] hover:bg-[var(--accent-guessfunc)]/10 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            ADD REF
          </button>
        </div>
        
        <div className="space-y-3">
          {functions.map((func) => (
            <div key={func.id} className="relative group/input animate-in fade-in slide-in-from-left-2">
              {func.id === 'f' && <div className="absolute inset-0 bg-[var(--accent-guessfunc)]/5 blur-xl group-focus-within/input:opacity-100 opacity-0 transition-opacity pointer-events-none" />}
              <div className={`relative flex items-center bg-[var(--color-background)] border rounded-xl overflow-hidden focus-within:ring-1 transition-all p-2 ${func.id === 'f' ? 'border-[var(--color-border)] focus-within:border-[var(--accent-guessfunc)] focus-within:ring-[var(--accent-guessfunc)]' : 'border-[var(--color-border)]/50 focus-within:border-[var(--color-muted-foreground)] focus-within:ring-[var(--color-muted-foreground)]'}`}>
                <span className={`pl-2 pr-2 font-mono opacity-70 select-none ${func.id === 'f' ? 'text-[var(--accent-guessfunc)]' : 'text-[var(--color-muted-foreground)]'}`}>
                  {func.id}(x)=
                </span>
                <MathField
                  value={func.expression}
                  onChange={(latex) => setExpression(func.id, latex)}
                  disabled={isSuccess || isVerifying}
                  className="w-full bg-transparent py-2 font-mono text-xl outline-none touch-manipulation disabled:opacity-50"
                />
                {func.id !== 'f' && (
                  <button 
                    onClick={() => removeFunction(func.id)}
                    disabled={isSuccess || isVerifying}
                    className="p-2 text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {verifyError && (
          <p className="text-xs font-mono text-red-500 uppercase tracking-widest animate-in slide-in-from-top-1 mt-2">
            {t(verifyError, 'Equivalence Check Failed')}
          </p>
        )}
      </section>

      {/* Sliders Block */}
      <section className="space-y-6 flex-1 pt-2">
        {Object.entries(params).map(([key, val]) => (
          <TerminalSlider
            key={key}
            label={t('guessFunc.variableLabel', 'Variable [{{key}}]', { key })}
            value={val}
            min={PARAM_MIN}
            max={PARAM_MAX}
            step={PARAM_STEP}
            onChange={(newVal) => setParam(key, newVal)}
            disabled={isSuccess || isVerifying}
          />
        ))}
      </section>

      {/* Action Block */}
      <section className="pt-2 mt-auto pb-4">
        <Button 
          onClick={verify} 
          disabled={isSuccess || isVerifying || !mainFunc?.expression}
          className="w-full h-14 text-sm font-mono tracking-widest uppercase relative overflow-hidden group/btn rounded-xl"
          style={{ backgroundColor: isSuccess ? 'var(--color-muted)' : 'var(--accent-guessfunc)', color: 'var(--color-background)' }}
        >
          {/* Button Glare */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20" />
          <div className="absolute inset-0 bg-white/0 group-hover/btn:bg-white/10 transition-colors" />
          
          {isVerifying && (
            <span className="flex items-center gap-3 relative z-10">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('guessFunc.verifying', 'VERIFYING...')}
            </span>
          )}
          {!isVerifying && isSuccess && (
            <span className="relative z-10 font-bold">{t('guessFunc.syncComplete', 'SYNC COMPLETE')}</span>
          )}
          {!isVerifying && !isSuccess && (
            <span className="relative z-10 font-bold">{t('guessFunc.verify', 'VERIFY EQUIVALENCE')}</span>
          )}
        </Button>
      </section>
    </div>
  );
};
