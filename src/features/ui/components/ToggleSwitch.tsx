import React from 'react';
import { cn } from '../../../utils/cn';

interface ToggleSwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, className }) => {
  return (
    <div 
      onClick={(e) => {
        if (onChange) {
          e.stopPropagation();
          onChange(!checked);
        }
      }}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
        onChange && "cursor-pointer",
        checked ? "bg-primary" : "bg-card-border",
        className
      )}
    >
      <span className={cn(
        "inline-block h-4 w-4 rounded-full bg-white transition transform",
        checked ? "translate-x-6" : "translate-x-1"
      )} />
    </div>
  );
};
