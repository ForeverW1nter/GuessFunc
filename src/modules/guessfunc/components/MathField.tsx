import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import 'mathlive';
import type { MathfieldElement } from 'mathlive';

export interface MathFieldProps {
  value: string;
  onChange: (latex: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const MathField = forwardRef<MathfieldElement, MathFieldProps>(
  ({ value, onChange, disabled = false, className = '' }, ref) => {
    const mfRef = useRef<MathfieldElement>(null);

    useImperativeHandle(ref, () => mfRef.current as MathfieldElement);

    useEffect(() => {
      const mathField = mfRef.current;
      if (!mathField) return;

      const handleInput = () => {
        onChange(mathField.value);
      };

      // MathLive configuration for virtual keyboard
      mathField.mathVirtualKeyboardPolicy = "manual";
      mathField.readOnly = disabled;
      
      if (mathField.value !== value) {
        mathField.value = value;
      }

      // Show keyboard on focus
      const handleFocus = () => {
        if (!disabled) {
          window.mathVirtualKeyboard.show();
        }
      };

      mathField.addEventListener('input', handleInput);
      mathField.addEventListener('focusin', handleFocus);

      return () => {
        mathField.removeEventListener('input', handleInput);
        mathField.removeEventListener('focusin', handleFocus);
      };
    }, [value, onChange, disabled]);

    return (
      <div className={`relative flex items-center ${className}`}>
        {React.createElement('math-field', {
          ref: mfRef,
          style: { 
            width: '100%', 
            outline: 'none',
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            // Removed fontFamily: 'inherit' to let MathLive use its elegant KaTeX fonts
            fontSize: 'inherit',
            '--keyboard-background': 'var(--color-muted)',
            '--keyboard-toolbar-background': 'var(--color-background)',
            '--keycap-background': 'var(--color-background)',
            '--keycap-secondary-background': 'var(--color-muted)',
            '--keycap-text': 'var(--color-foreground)',
            '--keycap-text-active': 'var(--accent-guessfunc)',
            '--keyboard-accent-color': 'var(--accent-guessfunc)',
          }
        })}
      </div>
    );
  }
);

MathField.displayName = 'MathField';
