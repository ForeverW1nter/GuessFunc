import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface DropdownOption {
  value: string;
  label: React.ReactNode;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  icon?: React.ReactNode;
  className?: string;
  dropdownClassName?: string;
  renderTrigger?: (currentOption: DropdownOption | undefined, isOpen: boolean) => React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  icon,
  className,
  dropdownClassName,
  renderTrigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = options.find(opt => opt.value === value);

  return (
    <div className="relative inline-block w-full sm:w-auto" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="w-full sm:w-auto h-full">
        {renderTrigger ? renderTrigger(currentOption, isOpen) : (
          <div 
            className={cn(
              "flex items-center gap-[8px] px-[12px] py-[4px] rounded-[4px] cursor-pointer transition-colors h-full",
              isOpen ? 'bg-border text-foreground' : 'hover:bg-muted text-muted-foreground',
              className
            )}
          >
            {icon && <span className="opacity-70 shrink-0">{icon}</span>}
            <span className="text-[0.85rem] tracking-widest uppercase select-none truncate max-w-[150px] sm:max-w-none font-mono">
              {currentOption?.label}
            </span>
          </div>
        )}
      </div>

      <div 
        className={cn(
          "absolute top-[calc(100%+4px)] right-0 w-[200px] bg-muted border border-border rounded-[4px] shadow-2xl overflow-hidden z-[100] transition-all duration-200 origin-top-right",
          isOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95',
          dropdownClassName
        )}
      >
        {options.map((opt) => (
          <div 
            key={opt.value}
            className={cn(
              "px-[16px] py-[10px] cursor-pointer transition-colors border-l-[2px]",
              value === opt.value 
                ? 'bg-primary/15 text-primary border-primary' 
                : 'text-muted-foreground hover:bg-border hover:text-foreground border-transparent'
            )}
            onClick={() => {
              onChange(opt.value);
              setIsOpen(false);
            }}
          >
            <div className="text-[0.8rem] uppercase tracking-widest font-mono">
              {opt.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
