import * as RadixSlider from '@radix-ui/react-slider';

export interface TerminalSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}

export const TerminalSlider = ({ value, min, max, step, onChange, label, disabled }: TerminalSliderProps) => {
  return (
    <div className={`space-y-3 group/tslider ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-end">
        <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)] group-hover/tslider:text-[var(--accent-guessfunc)] transition-colors">
          {label}
        </label>
        <span className="font-mono text-sm text-[var(--accent-guessfunc)] bg-[var(--accent-guessfunc)]/10 px-2 py-0.5 rounded border border-[var(--accent-guessfunc)]/20 shadow-[0_0_10px_var(--accent-guessfunc)]">
          {value.toFixed(2)}
        </span>
      </div>
      
      <RadixSlider.Root
        className="relative flex w-full touch-none select-none items-center h-6 group/radix"
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        max={max}
        min={min}
        step={step}
        disabled={disabled}
      >
        <RadixSlider.Track className="relative h-full w-full grow overflow-hidden rounded-md bg-[var(--color-background)] border border-[var(--color-border)]">
          
          <RadixSlider.Range className="absolute h-full bg-[var(--accent-guessfunc)]/20 border-r border-[var(--accent-guessfunc)] transition-colors group-hover/radix:bg-[var(--accent-guessfunc)]/30" />
          
          {/* Striped Grid inside track for mechanical look */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px)' }}
          />
        </RadixSlider.Track>
        
        {/* Invisible thumb just to make the slider interactive and accessible without breaking the custom track visual */}
        <RadixSlider.Thumb 
          className="block w-2 h-8 rounded-[1px] bg-[var(--accent-guessfunc)] shadow-[0_0_10px_var(--accent-guessfunc)] border border-white/50 transition-transform hover:scale-110 focus-visible:outline-none disabled:pointer-events-none"
        />
      </RadixSlider.Root>
    </div>
  );
};
