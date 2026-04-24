import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface TerminalLayoutProps {
  layoutId: string;
  leftPanelContent: ReactNode;
  title: string;
  subtitle?: string;
  rightPanelContent: ReactNode;
  accentColorVar?: string; // e.g., 'var(--accent-guessfunc)'
  statusText?: string;
  onClosePath?: string;
}

export const TerminalLayout = ({
  layoutId,
  leftPanelContent,
  title,
  subtitle,
  rightPanelContent,
  accentColorVar = "var(--color-primary)",
  statusText,
  onClosePath = "/",
}: TerminalLayoutProps) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[var(--color-background)] flex flex-col md:flex-row"
    >
      {/* Left Panel: Canvas */}
      <motion.div
        layoutId={`card-container-${layoutId}`}
        className="flex-1 p-4 md:p-8 h-[50vh] md:h-screen relative overflow-hidden flex flex-col"
      >
        {leftPanelContent}
      </motion.div>

      {/* Right Panel: Controls & Telemetry */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        className="w-full md:w-[400px] lg:w-[480px] p-6 md:p-12 border-t md:border-t-0 md:border-l border-[var(--color-border)] bg-[var(--color-muted)] flex flex-col relative z-10 overflow-y-auto"
      >
        <header className="mb-12">
          <motion.h1
            layoutId={`card-title-${layoutId}`}
            className="text-4xl md:text-5xl font-bold tracking-tighter mb-2 uppercase"
            style={{ color: accentColorVar }}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <p className="text-sm font-mono text-[var(--color-muted-foreground)] tracking-widest uppercase mt-4">
              {subtitle}
            </p>
          )}
        </header>

        <div className="flex-1 w-full flex flex-col">
          {rightPanelContent}
        </div>

        {/* Terminal / Exit Footer */}
        <footer className="mt-12 pt-8 border-t border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-3 opacity-50">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: accentColorVar }}
            />
            <span className="text-xs font-mono tracking-widest uppercase">
              {statusText || t("common.engineLive", "Engine Live")}
            </span>
          </div>
          <Link
            to={onClosePath}
            className={cn(
              "text-xs font-mono tracking-widest uppercase border border-[var(--color-border)] px-4 py-2 rounded-full",
              "hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors duration-300",
              "touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            )}
          >
            {t("common.close", "Close")}
          </Link>
        </footer>
      </motion.div>
    </motion.div>
  );
};