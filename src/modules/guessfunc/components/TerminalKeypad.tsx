import { cn } from "@/utils/cn";
import { Delete } from "lucide-react";

export interface TerminalKeypadProps {
  onInsert: (text: string, cursorOffset?: number) => void;
  onDelete: () => void;
  onClear: () => void;
  disabled?: boolean;
}

type KeyType = 'func' | 'var' | 'op' | 'num' | 'ctrl';

interface KeyConfig {
  label: string;
  value?: string;
  offset?: number;
  type: KeyType;
  action?: 'del' | 'clear';
}

const KEYS: KeyConfig[] = [
  // Row 1: Functions
  { label: 'sin', value: 'sin(', offset: -1, type: 'func' },
  { label: 'cos', value: 'cos(', offset: -1, type: 'func' },
  { label: 'tan', value: 'tan(', offset: -1, type: 'func' },
  { label: 'log', value: 'log(', offset: -1, type: 'func' },
  { label: 'sqrt', value: 'sqrt(', offset: -1, type: 'func' },
  
  // Row 2: Vars & Exponents
  { label: 'x', value: 'x', type: 'var' },
  { label: 'a', value: 'a', type: 'var' },
  { label: 'b', value: 'b', type: 'var' },
  { label: 'c', value: 'c', type: 'var' },
  { label: '^', value: '^', type: 'op' },

  // Row 3: Numbers & Basic Ops
  { label: '7', value: '7', type: 'num' },
  { label: '8', value: '8', type: 'num' },
  { label: '9', value: '9', type: 'num' },
  { label: '/', value: '/', type: 'op' },
  { label: '(', value: '(', type: 'op' },

  // Row 4: Numbers
  { label: '4', value: '4', type: 'num' },
  { label: '5', value: '5', type: 'num' },
  { label: '6', value: '6', type: 'num' },
  { label: '*', value: '*', type: 'op' },
  { label: ')', value: ')', type: 'op' },

  // Row 5: Numbers
  { label: '1', value: '1', type: 'num' },
  { label: '2', value: '2', type: 'num' },
  { label: '3', value: '3', type: 'num' },
  { label: '-', value: '-', type: 'op' },
  { label: 'DEL', action: 'del', type: 'ctrl' },

  // Row 6: Zero & Specials
  { label: 'CLR', action: 'clear', type: 'ctrl' },
  { label: '0', value: '0', type: 'num' },
  { label: '.', value: '.', type: 'num' },
  { label: '+', value: '+', type: 'op' },
  { label: 'pi', value: 'pi', type: 'var' },
];

const getKeyClass = (type: KeyType) => {
  switch (type) {
    case 'num':
      return "bg-[var(--color-muted)] border-[var(--color-border)] hover:bg-[var(--color-border)] text-[var(--color-foreground)]";
    case 'op':
      return "bg-[var(--color-background)] border-[var(--color-border)] hover:bg-[var(--color-border)] text-[var(--color-muted-foreground)]";
    case 'func':
      return "bg-[var(--accent-guessfunc)]/10 border-[var(--accent-guessfunc)]/30 text-[var(--accent-guessfunc)] hover:bg-[var(--accent-guessfunc)]/20";
    case 'var':
      return "bg-[var(--accent-studio)]/10 border-[var(--accent-studio)]/30 text-[var(--accent-studio)] hover:bg-[var(--accent-studio)]/20";
    case 'ctrl':
    default:
      return "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20";
  }
};

export const TerminalKeypad = ({ onInsert, onDelete, onClear, disabled }: TerminalKeypadProps) => {
  return (
    <div className={cn("grid grid-cols-5 gap-2", disabled && "opacity-50 pointer-events-none")}>
      {KEYS.map((k, i) => (
        <button
          key={i}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (k.action === 'del') onDelete();
            else if (k.action === 'clear') onClear();
            else if (k.value) onInsert(k.value, k.offset);
          }}
          className={cn(
            "h-10 md:h-12 rounded-lg font-mono text-sm md:text-base border transition-all active:scale-95 flex items-center justify-center relative overflow-hidden group",
            getKeyClass(k.type)
          )}
        >
          {/* Subtle top glare for 3D effect */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10" />
          {k.label === 'DEL' ? <Delete className="w-4 h-4" /> : k.label}
        </button>
      ))}
    </div>
  );
};
