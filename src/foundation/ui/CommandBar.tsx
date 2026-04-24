import { motion } from "framer-motion";
import { Home, Library, Globe, Settings, TerminalSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

const navItems = [
  { path: "/", icon: Home, translationKey: "nav.hub", fallback: "Hub", color: "var(--accent-hub)" },
  {
    path: "/archive",
    icon: Library,
    translationKey: "nav.archive",
    fallback: "Archive",
    color: "var(--accent-archive)",
  },
  {
    path: "/workshop",
    icon: Globe,
    translationKey: "nav.network",
    fallback: "Network",
    color: "var(--accent-network)",
  },
  {
    path: "/creator",
    icon: TerminalSquare,
    translationKey: "nav.studio",
    fallback: "Studio",
    color: "var(--accent-studio)",
  },
  {
    path: "/settings",
    icon: Settings,
    translationKey: "nav.settings",
    fallback: "Settings",
    color: "var(--accent-settings)",
  },
];

const ICON_STROKE_WIDTH_ACTIVE = 2;
const ICON_STROKE_WIDTH_INACTIVE = 1.5;

export const CommandBar = () => {
  const location = useLocation();
  const { t } = useTranslation();
  // To keep the CommandBar decoupled from specific game IDs (guessfunc/gatefunc),
  // we consider any route that is NOT a core platform route as a "Game Route"
  // where the dock should shrink down.
  const isCoreRoute = navItems.some((item) => location.pathname === item.path);
  const isGameRoute = !isCoreRoute;

  const activeIndex = navItems.findIndex(
    (item) => location.pathname === item.path,
  );

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]",
        "px-2 py-2 rounded-full flex items-center gap-2",
        "bg-[var(--color-glass)] backdrop-blur-2xl border border-[var(--color-border)] shadow-2xl transition-all duration-500",
        isGameRoute
          ? "scale-75 origin-bottom opacity-50 hover:opacity-100 hover:scale-100"
          : "scale-100 opacity-100",
      )}
    >
      {navItems.map((item, idx) => {
        const isActive = activeIndex === idx;
        return (
          <Link
            key={item.path}
            to={item.path}
            className="relative group outline-none"
          >
            {/* Sliding Indicator using layoutId (Perfect Alignment) */}
            {isActive && (
              <motion.div
                layoutId="commandbar-active-indicator"
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ backgroundColor: item.color, opacity: 0.15 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <div
              className={cn(
                "relative z-10 w-[44px] h-[44px] rounded-full flex items-center justify-center transition-colors duration-300",
                !isActive ? "text-[var(--color-muted-foreground)]" : ""
              )}
              style={
                isActive
                  ? { color: item.color }
                  : { "--hover-color": item.color } as React.CSSProperties
              }
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = item.color;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = "";
              }}
            >
              <item.icon size={20} strokeWidth={isActive ? ICON_STROKE_WIDTH_ACTIVE : ICON_STROKE_WIDTH_INACTIVE} />
            </div>

            {/* Hover Tooltip */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out bg-[var(--color-foreground)] text-[var(--color-background)] text-xs px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap font-mono tracking-widest pointer-events-none origin-bottom uppercase">
              {t(item.translationKey, item.fallback)}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-[var(--color-foreground)]" />
            </div>
          </Link>
        );
      })}
    </div>
  );
};
