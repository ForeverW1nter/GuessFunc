import { createContext, forwardRef, useContext, useEffect, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
    const variants = {
      primary: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
      secondary: "bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/80",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      ghost: "hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
    };
    const sizes = {
      sm: "h-9 px-3 text-xs",
      md: "h-10 px-4 py-2",
      lg: "h-11 px-8 text-lg",
    };
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export interface ToastOptions {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

export type Theme = 'light' | 'dark';

interface UIContextType {
  theme: Theme;
  toggleTheme: () => void;
  toast: (options: Omit<ToastOptions, 'id'>) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toast = (options: Omit<ToastOptions, 'id'>) => {
    const id = Math.random().toString(36).substring(2);
    setToasts(prev => [...prev, { ...options, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <UIContext.Provider value={{ theme, toggleTheme, toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={cn("p-4 rounded-md shadow-lg border",
            t.type === 'error' ? "bg-red-500 text-white border-red-600" : "bg-[var(--color-background)] border-[var(--color-border)]"
          )}>
            <h4 className="font-bold text-sm">{t.title}</h4>
            {t.description && <p className="text-sm opacity-90">{t.description}</p>}
          </div>
        ))}
      </div>
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within UIProvider");
  }
  return context;
};
