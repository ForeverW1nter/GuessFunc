import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

export const Slider = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  variant = 'default',
  className,
  ...props
}: SliderProps) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const isDanger = variant === 'danger';

  return (
    <div className={cn(
      "relative h-2 bg-[var(--color-border)] rounded-full flex-1 flex items-center group/slider",
      "focus-within:ring-2 focus-within:ring-[var(--color-foreground)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-background)]",
      disabled && "opacity-50",
      className
    )}>
      <motion.div 
        className={cn(
          "absolute top-0 left-0 h-full rounded-full transition-colors",
          isDanger ? "bg-red-500/50" : "bg-[var(--color-foreground)]"
        )}
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      />
      <input
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        {...props}
      />
    </div>
  );
};
