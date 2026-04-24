import React from 'react';
import { motion } from 'framer-motion';
import { Home, Library, Globe, Settings, TerminalSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

const navItems = [
  { path: '/', icon: Home, label: 'Hub' },
  { path: '/archive', icon: Library, label: 'Archive' },
  { path: '/workshop', icon: Globe, label: 'Network' },
  { path: '/creator', icon: TerminalSquare, label: 'Studio' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export const CommandBar = () => {
  const location = useLocation();

  // If we are inside a specific game route (e.g., /guessfunc), we might want to hide or shrink the dock.
  // For now, let's keep it globally available but we can add a check here later.
  const isGameRoute = location.pathname.startsWith('/guessfunc') || location.pathname.startsWith('/gatefunc');

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
        "px-4 py-3 rounded-full flex items-center gap-6",
        "bg-[var(--color-glass)] backdrop-blur-md border border-[var(--color-border)] shadow-xl",
        isGameRoute && "scale-75 origin-bottom opacity-50 hover:opacity-100 hover:scale-100 transition-all duration-300"
      )}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path} className="relative group flex items-center justify-center">
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[var(--color-primary)] opacity-10 rounded-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <div className={cn(
              "p-2 rounded-full transition-colors duration-200",
              isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)]"
            )}>
              <item.icon size={20} strokeWidth={1.5} />
            </div>
            
            {/* Tooltip */}
            <div className="absolute -top-10 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-[var(--color-foreground)] text-[var(--color-background)] text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap font-mono tracking-widest">
              {item.label}
            </div>
          </Link>
        );
      })}
    </motion.div>
  );
};