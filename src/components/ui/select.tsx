import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { cn } from '../../utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon?: React.ReactNode;
  className?: string;
  dropdownClassName?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  icon,
  className,
  dropdownClassName
}) => {
  return (
    <BaseSelect.Root value={value} onValueChange={(val) => val && onChange(val as string)}>
      <BaseSelect.Trigger 
        className={cn(
          "flex items-center justify-between gap-2 px-[12px] py-[4px] rounded-[4px] cursor-pointer transition-colors bg-transparent border-none text-muted-foreground hover:bg-muted data-[state=open]:bg-border data-[state=open]:text-foreground w-full sm:w-auto outline-none h-full",
          className
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden uppercase tracking-widest text-[0.85rem] font-mono">
          {icon && <span className="shrink-0 opacity-70">{icon}</span>}
          <BaseSelect.Value className="truncate" />
        </div>
        <BaseSelect.Icon>
          <ChevronDown size={16} className="shrink-0 transition-transform duration-200 data-[state=open]:rotate-180 opacity-70" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="z-[100]" sideOffset={4} align="end">
          <BaseSelect.Popup 
            className={cn(
              "w-full sm:min-w-[150px] bg-muted border border-border rounded-[4px] shadow-2xl overflow-hidden origin-top-right data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
              dropdownClassName
            )}
          >
            <div className="py-1 max-h-[250px] overflow-y-auto custom-scrollbar">
              {options.map((opt) => (
                <BaseSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer transition-colors text-[0.8rem] uppercase tracking-widest font-mono text-muted-foreground hover:bg-border hover:text-foreground border-l-[2px] border-transparent data-[selected]:bg-primary/15 data-[selected]:text-primary data-[selected]:border-primary outline-none"
                >
                  <BaseSelect.ItemText className="truncate">{opt.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator>
                    <Check size={14} className="shrink-0" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </div>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
};
