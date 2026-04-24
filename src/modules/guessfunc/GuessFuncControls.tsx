import { useGuessFuncStore } from './store/guessFuncStore';

const PARAM_MIN = -10;
const PARAM_MAX = 10;
const PARAM_STEP = 0.1;

export const GuessFuncControls = () => {
  const { expression, params, setExpression, setParam } = useGuessFuncStore();

  return (
    <div className="flex flex-col h-full space-y-10">
      {/* Input Block */}
      <section className="space-y-4">
        <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
          Function Expression [ y = f(x) ]
        </label>
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 font-mono text-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent-guessfunc)] transition-all"
          placeholder="e.g. sin(x) + a"
          spellCheck={false}
        />
      </section>

      {/* Sliders Block */}
      <section className="space-y-8 flex-1">
        {Object.entries(params).map(([key, val]) => (
          <div key={key} className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
                Variable [{key}]
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
              className="w-full accent-[var(--accent-guessfunc)] bg-[var(--color-border)] h-1 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--accent-guessfunc)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
            />
          </div>
        ))}
      </section>
    </div>
  );
};
