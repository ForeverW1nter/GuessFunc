import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'primary' | 'success' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', fullWidth, ...props }, ref) => {
    
    const baseStyles = "relative inline-flex items-center justify-center font-mono tracking-widest uppercase transition-all duration-300 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      default: "bg-[var(--color-foreground)] text-[var(--color-background)] hover:bg-[var(--color-foreground)]/90",
      primary: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-transparent",
      success: "bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-transparent",
      danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-transparent",
      outline: "border border-[var(--color-border)] hover:bg-white/5 text-[var(--color-foreground)]",
      ghost: "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-white/5",
      glass: "bg-[var(--color-muted)]/50 border border-[var(--color-border)] text-[var(--color-foreground)] hover:border-white/30",
    };

    const sizes = {
      sm: "h-8 px-3 text-[10px] md:text-xs rounded-lg",
      md: "h-10 px-4 text-xs md:text-sm rounded-xl",
      lg: "h-12 px-6 text-sm md:text-base rounded-2xl",
      icon: "w-10 h-10 rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth ? "w-full" : "",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
