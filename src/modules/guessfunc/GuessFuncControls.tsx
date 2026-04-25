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
    <div className="flex flex-col h-full overflow-y-auto pr-4 pb-4 scrollbar-hide">
      
      {/* Decorative Header for Control Panel */}
      <div className="flex items-center gap-4 mb-8 pb-4 border-b border-[var(--color-border)] opacity-80">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-[var(--accent-guessfunc)] rounded-full" />
          <div className="w-1.5 h-1.5 bg-[var(--accent-guessfunc)]/50 rounded-full" />
          <div className="w-1.5 h-1.5 bg-[var(--accent-guessfunc)]/20 rounded-full" />
        </div>
        <span className="font-mono text-xs tracking-[0.2em] text-[var(--color-muted-foreground)]">INPUT_CONSOLE</span>
      </div>

      {/* Input Block */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-muted-foreground)] flex items-center gap-2">
            <span className="w-2 h-[1px] bg-[var(--accent-guessfunc)]" />
            {t('guessFunc.expressionLabel', 'FUNCTION MATRIX')}
          </label>
          <button 
            onClick={addFunction}
            disabled={isSuccess || isVerifying || functions.length >= 5}
            className="flex items-center gap-1 text-[10px] font-mono tracking-widest text-[var(--accent-guessfunc)] hover:bg-[var(--accent-guessfunc)]/10 px-3 py-1.5 rounded-sm border border-transparent hover:border-[var(--accent-guessfunc)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            ADD REF
          </button>
        </div>
        
        <div className="space-y-4">
          {functions.map((func) => (
            <div key={func.id} className="relative group/input animate-in fade-in slide-in-from-left-2">
              {/* Highlight bar for main function */}
              {func.id === 'f' && <div className="absolute -left-3 top-2 bottom-2 w-1 bg-[var(--accent-guessfunc)] rounded-r-sm" />}
              
              <div className={`relative flex items-center bg-[var(--color-background)] border-b-2 overflow-hidden transition-all px-1 py-3 ${func.id === 'f' ? 'border-[var(--accent-guessfunc)] focus-within:border-[var(--accent-guessfunc)] bg-gradient-to-r from-[var(--accent-guessfunc)]/10 to-transparent' : 'border-[var(--color-border)] focus-within:border-[var(--color-muted-foreground)]'}`}>
                <span className={`pl-2 pr-4 font-mono text-xl italic opacity-80 select-none ${func.id === 'f' ? 'text-[var(--accent-guessfunc)]' : 'text-[var(--color-muted-foreground)]'}`}>
                  {func.id}(x) =
                </span>
                <MathField
                  value={func.expression}
                  onChange={(latex) => setExpression(func.id, latex)}
                  disabled={isSuccess || isVerifying}
                  className="w-full bg-transparent font-mono text-2xl outline-none touch-manipulation disabled:opacity-50"
                />
                {func.id !== 'f' && (
                  <button 
                    onClick={() => removeFunction(func.id)}
                    disabled={isSuccess || isVerifying}
                    className="p-2 text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors disabled:opacity-50 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {verifyError && (
          <div className="mt-4 p-3 border border-red-500/30 bg-red-500/10 rounded-md flex items-center gap-3 animate-in slide-in-from-top-1">
            <div className="w-1 h-full bg-red-500 rounded-full" />
            <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest">
              {t(verifyError, 'Equivalence Check Failed')}
            </p>
          </div>
        )}
      </section>

      {/* Spacer to push sliders down */}
      <div className="h-12" />

      {/* Sliders Block */}
      <section className="space-y-8 flex-1">
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
      <section className="pt-8 mt-auto pb-2">
        <Button 
          onClick={verify} 
          disabled={isSuccess || isVerifying || !mainFunc?.expression}
          className="w-full h-16 text-sm font-mono tracking-[0.2em] uppercase relative overflow-hidden group/btn rounded-sm border border-[var(--color-border)] hover:border-[var(--accent-guessfunc)] transition-all"
          style={{ backgroundColor: isSuccess ? 'transparent' : 'rgba(16, 185, 129, 0.05)', color: isSuccess ? 'var(--color-muted-foreground)' : 'var(--accent-guessfunc)' }}
        >
          {/* Hacker button scanning effect */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIi8+Cjwvc3ZnPg==')] opacity-50 z-0 pointer-events-none mix-blend-overlay" />
          
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-guessfunc)] to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-guessfunc)] to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          
          {/* Diagonal scan line */}
          <div className="absolute -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-0 group-hover/btn:animate-[shimmer_1.5s_infinite] group-hover/btn:opacity-10" />

          {isVerifying && (
            <span className="flex items-center justify-center gap-3 relative z-10 w-full">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('guessFunc.verifying', 'VERIFYING...')}
            </span>
          )}
          {!isVerifying && isSuccess && (
            <span className="relative z-10 w-full text-center tracking-[0.3em] text-green-500 font-bold flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {t('guessFunc.syncComplete', 'SYNC COMPLETE')}
            </span>
          )}
          {!isVerifying && !isSuccess && (
            <span className="relative z-10 w-full text-center tracking-[0.3em] group-hover/btn:text-white transition-colors flex items-center justify-center gap-2">
              <span className="opacity-50 text-[10px]">[{'>'}]</span> {t('guessFunc.verify', 'EXECUTE VERIFICATION')}
            </span>
          )}
        </Button>
      </section>
    </div>
  );
};
