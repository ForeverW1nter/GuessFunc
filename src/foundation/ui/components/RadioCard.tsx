import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface RadioCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
  layout?: 'vertical' | 'horizontal';
  titleClass?: string;
}

export const RadioCard = ({
  title,
  subtitle,
  selected = false,
  onSelect,
  icon,
  layout = 'vertical',
  titleClass = "font-medium tracking-wide",
  className,
  ...props
}: RadioCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative border transition-all duration-300 min-w-0 group touch-manipulation",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
        layout === 'vertical' ? "flex flex-col items-start p-5 rounded-2xl" : "flex flex-row items-center justify-between p-4 rounded-2xl text-left",
        selected 
          ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]" 
          : "bg-[var(--color-muted)]/50 border-[var(--color-border)] text-[var(--color-foreground)] hover:border-white/30",
        className
      )}
      {...props}
    >
      {layout === 'vertical' ? (
        <>
          <span className={cn(titleClass, "truncate w-full text-left mb-1")}>{title}</span>
          {subtitle && (
            <span className={cn("text-xs font-sans truncate w-full text-left", selected ? "text-[var(--color-background)]/70" : "text-[var(--color-muted-foreground)]")}>
              {subtitle}
            </span>
          )}
          {selected && <CheckCircle2 size={18} className="absolute top-5 end-5 shrink-0" />}
        </>
      ) : (
        <>
          <div className="flex items-center gap-4 md:gap-6 min-w-0">
            {icon && (
              <div className={cn("shrink-0", selected ? "text-[var(--color-background)]" : "text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)]")}>
                {icon}
              </div>
            )}
            <div className="flex flex-col min-w-0 pe-8">
              <span className={cn(titleClass, "truncate")}>{title}</span>
              {subtitle && (
                <span className={cn("text-[10px] uppercase tracking-[0.1em] font-mono mt-1 truncate", selected ? "text-[var(--color-background)]/60" : "text-[var(--color-muted-foreground)]/60")}>
                  {subtitle}
                </span>
              )}
            </div>
          </div>
          {selected && <CheckCircle2 size={20} className="absolute end-4 shrink-0" />}
        </>
      )}
    </button>
  );
};
