import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
    const variants = {
      primary:
        "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
      secondary:
        "bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/80",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      ghost:
        "hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
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
  },
);
Button.displayName = "Button";

export interface ToastOptions {
  id?: string;
  title: string;
  description?: string;
  duration?: number;
  type?: "default" | "success" | "error";
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ========================
// UI CONTEXT & PROVIDER
// ========================

interface UIContextType {
  toast: (options: Omit<ToastOptions, 'id'>) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  // Apply dark mode class globally on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const toast = useCallback((options: Omit<ToastOptions, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...options, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, options.duration || 3000);
  }, []);

  return (
    <UIContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "px-6 py-4 rounded-xl border font-mono text-sm tracking-wide flex items-center justify-between shadow-2xl backdrop-blur-xl pointer-events-auto",
                t.type === 'error' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                t.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                "bg-[var(--color-glass)] border-[var(--color-border)] text-[var(--color-foreground)]"
              )}
            >
              <span>{t.title}</span>
              {t.action && (
                <button
                  onClick={t.action.onClick}
                  className="ml-6 px-3 py-1 bg-white/10 rounded-md hover:bg-white/20 transition-colors uppercase text-xs tracking-widest"
                >
                  {t.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </UIContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within UIProvider");
  }
  return context;
};
