import { motion } from "framer-motion";
import { Home, Library, Globe, Settings, TerminalSquare } from "lucide-react";
import { useSystemUIStore } from "./useSystemUIStore";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/utils/cn";

const navItems = [
  { path: "/", icon: Home, label: "Hub", color: "var(--accent-hub)" },
  {
    path: "/archive",
    icon: Library,
    label: "Archive",
    color: "var(--accent-archive)",
  },
  {
    path: "/workshop",
    icon: Globe,
    label: "Network",
    color: "var(--accent-network)",
  },
  {
    path: "/creator",
    icon: TerminalSquare,
    label: "Studio",
    color: "var(--accent-studio)",
  },
  {
    path: "/settings",
    icon: Settings,
    label: "Settings",
    color: "var(--accent-settings)",
  },
];

const BASE_LEFT_OFFSET = 8;
const ITEM_WIDTH_WITH_GAP = 52;
const INDICATOR_WIDTH = 44;
const ICON_STROKE_WIDTH_ACTIVE = 2;
const ICON_STROKE_WIDTH_INACTIVE = 1.5;

export const CommandBar = () => {
  const location = useLocation();
  const { toggleControlCenter } = useSystemUIStore();

  // To keep the CommandBar decoupled from specific game IDs (guessfunc/gatefunc),
  // we consider any route that is NOT a core platform route as a "Game Route"
  // where the dock should shrink down.
  const isCoreRoute = navItems.some((item) => location.pathname === item.path);
  const isGameRoute = !isCoreRoute;

  const activeIndex = navItems.findIndex(
    (item) => location.pathname === item.path,
  );
  const validIndex = activeIndex >= 0 ? activeIndex : 0;

  // 44px is width of item (p-3 = 12px*2 + 20px icon = 44px). Gap is 8px. Padding is 8px.
  // left = 8 + validIndex * (44 + 8) = 8 + validIndex * 52
  const leftOffset = BASE_LEFT_OFFSET + validIndex * ITEM_WIDTH_WITH_GAP;

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-[102]",
        "px-2 py-2 rounded-full flex items-center gap-2",
        "bg-[var(--color-glass)] backdrop-blur-2xl border border-[var(--color-border)] shadow-2xl transition-all duration-500",
        isGameRoute
          ? "scale-75 origin-bottom opacity-50 hover:opacity-100 hover:scale-100"
          : "scale-100 opacity-100",
      )}
    >
      {/* Sliding Indicator (Absolute positioned, NO layoutId) */}
      {activeIndex >= 0 && (
        <motion.div
          className="absolute top-2 bottom-2 rounded-full pointer-events-none"
          initial={false}
          animate={{
            left: leftOffset,
            width: INDICATOR_WIDTH,
            backgroundColor: navItems[validIndex].color,
            opacity: 0.15,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      {navItems.map((item, idx) => {
        const isActive = activeIndex === idx;
        return (
          <Link
            key={item.path}
            to={item.path}
            className="relative group outline-none"
          >
            <div
              className={cn(
                "relative w-[44px] h-[44px] rounded-full flex items-center justify-center transition-colors duration-300",
                !isActive
                  ? "text-[var(--color-muted-foreground)]"
                  : "",
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
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out bg-[var(--color-foreground)] text-[var(--color-background)] text-xs px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap font-mono tracking-widest pointer-events-none origin-bottom">
              {item.label}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-[var(--color-foreground)]" />
            </div>
          </Link>
        );
      })}
      {/* Divider */}
      <div className="w-[1px] h-[24px] bg-[var(--color-border)] mx-1" />

      {/* System Settings Toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleControlCenter();
        }}
        className={cn(
          "relative w-[44px] h-[44px] rounded-full flex items-center justify-center transition-colors duration-300 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] outline-none cursor-pointer pointer-events-auto"
        )}
      >
        <Settings size={20} strokeWidth={ICON_STROKE_WIDTH_INACTIVE} />
      </button>
    </div>
  );
};
