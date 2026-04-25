import { motion } from 'framer-motion';

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
  const percentage = ((value - min) / (max - min)) * 100;
  
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
      <div className="relative h-6 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md flex items-center overflow-hidden">
        {/* Track Glow */}
        <motion.div 
          className="absolute top-0 left-0 h-full bg-[var(--accent-guessfunc)]/20 border-r border-[var(--accent-guessfunc)]"
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        />
        
        {/* Striped Grid inside track for mechanical look */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px)' }}
        />
        
        <input
          type="range"
          min={min} 
          max={max} 
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        />
      </div>
    </div>
  );
};
