import React from 'react';
import { motion } from 'framer-motion';
import { Home, Library, Globe, Settings, TerminalSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

const navItems = [
  { path: '/', icon: Home, label: 'Hub', color: 'var(--accent-hub)' },
  { path: '/archive', icon: Library, label: 'Archive', color: 'var(--accent-archive)' },
  { path: '/workshop', icon: Globe, label: 'Network', color: 'var(--accent-network)' },
  { path: '/creator', icon: TerminalSquare, label: 'Studio', color: 'var(--accent-studio)' },
  { path: '/settings', icon: Settings, label: 'Settings', color: 'var(--accent-settings)' },
];

export const CommandBar = () => {
  const location = useLocation();
  const isGameRoute = location.pathname.startsWith('/guessfunc') || location.pathname.startsWith('/gatefunc');

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
        "px-2 py-2 rounded-full flex items-center gap-2",
        "bg-[var(--color-glass)] backdrop-blur-xl border border-[var(--color-border)] shadow-2xl transition-all duration-500",
        isGameRoute ? "scale-75 origin-bottom opacity-50 hover:opacity-100 hover:scale-100" : "scale-100 opacity-100"
      )}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path} className="relative group outline-none">
            {/* The Background Indicator Container */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="w-full h-full rounded-full opacity-15"
                  style={{ backgroundColor: item.color }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </div>
            
            {/* The Icon Container */}
            <div
              className={cn(
                "relative p-3 rounded-full flex items-center justify-center transition-colors duration-300",
                !isActive ? "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]" : ""
              )}
              style={isActive ? { color: item.color } : {}}
            >
              <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            </div>

            {/* Hover Tooltip */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out bg-[var(--color-foreground)] text-[var(--color-background)] text-xs px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap font-mono tracking-widest pointer-events-none origin-bottom">
              {item.label}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-[var(--color-foreground)]" />
            </div>
          </Link>
        );
      })}
    </div>
  );
};
