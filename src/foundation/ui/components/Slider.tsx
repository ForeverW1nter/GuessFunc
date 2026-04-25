import React from 'react';
import * as RadixSlider from '@radix-ui/react-slider';
import { cn } from '@/utils/cn';

export interface SliderProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange' | 'value' | 'defaultValue'> {
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
  const isDanger = variant === 'danger';

  return (
    <RadixSlider.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center flex-1 h-5 group/slider",
        disabled && "opacity-50",
        className
      )}
      value={[value]}
      onValueChange={(vals) => onChange(vals[0])}
      max={max}
      min={min}
      step={step}
      disabled={disabled}
      {...props}
    >
      <RadixSlider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[var(--color-border)]">
        <RadixSlider.Range 
          className={cn(
            "absolute h-full transition-colors",
            isDanger ? "bg-red-500/50" : "bg-[var(--color-foreground)]"
          )} 
        />
      </RadixSlider.Track>
      <RadixSlider.Thumb 
        className={cn(
          "block h-4 w-4 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] disabled:pointer-events-none disabled:opacity-50",
          isDanger ? "focus-visible:ring-red-500" : ""
        )}
      />
    </RadixSlider.Root>
  );
};
