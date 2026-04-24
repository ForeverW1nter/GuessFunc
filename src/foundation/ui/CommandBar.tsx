import React from 'react';
import { motion } from 'framer-motion';
import { Home, Library, Globe, Settings, TerminalSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

const navItems = [
  { path: '/', icon: Home, label: 'Hub', color: 'var(--color-primary)' },
  { path: '/archive', icon: Library, label: 'Archive', color: '#60A5FA' }, // blue-400
  { path: '/workshop', icon: Globe, label: 'Network', color: 'var(--color-primary)' },
  { path: '/creator', icon: TerminalSquare, label: 'Studio', color: '#C084FC' }, // purple-400
  { path: '/settings', icon: Settings, label: 'Settings', color: '#9CA3AF' }, // gray-400
];

export const CommandBar = () => {
  const location = useLocation();

  const isGameRoute = location.pathname.startsWith('/guessfunc') || location.pathname.startsWith('/gatefunc');

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
        "px-4 py-3 rounded-full flex items-center gap-6",
        "bg-[var(--color-glass)] backdrop-blur-xl border border-[var(--color-border)] shadow-2xl",
        isGameRoute && "scale-75 origin-bottom opacity-50 hover:opacity-100 hover:scale-100 transition-all duration-300"
      )}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path} className="relative group flex items-center justify-center outline-none">
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-full opacity-15"
                style={{ backgroundColor: item.color }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <div 
              className={cn(
                "p-2 rounded-full transition-colors duration-300",
                !isActive && "text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)]"
              )}
              style={isActive ? { color: item.color } : {}}
            >
              <item.icon size={20} strokeWidth={1.5} />
            </div>
            
            {/* Tooltip */}
            <div className="absolute -top-12 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-[var(--color-foreground)] text-[var(--color-background)] text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap font-mono tracking-widest pointer-events-none">
              {item.label}
              {/* Tooltip arrow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-[var(--color-foreground)]" />
            </div>
          </Link>
        );
      })}
    </motion.div>
  );
};