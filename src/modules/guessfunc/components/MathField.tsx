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
  ({ value, onChange, disabled = false, className = '', placeholder = '' }, ref) => {
    const mfRef = useRef<MathfieldElement>(null);

    // Expose the MathfieldElement to parent components if needed
    useImperativeHandle(ref, () => mfRef.current as MathfieldElement);

    useEffect(() => {
      const mathField = mfRef.current;
      if (!mathField) return;

      // Handle changes
      const handleInput = () => {
        onChange(mathField.value);
      };

      // Configuration
      mathField.mathVirtualKeyboardPolicy = "auto";
      mathField.readOnly = disabled;
      
      // Update value only if it differs from current internal state to avoid cursor jumping
      if (mathField.value !== value) {
        mathField.value = value;
      }

      mathField.addEventListener('input', handleInput);

      return () => {
        mathField.removeEventListener('input', handleInput);
      };
    }, [value, onChange, disabled]);

    return (
      <div className={`relative ${className}`}>
        {/* We use a React createElement wrapper for Web Components to avoid TS errors */}
        {React.createElement('math-field', {
          ref: mfRef,
          style: { 
            width: '100%', 
            outline: 'none',
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            fontFamily: 'inherit',
            fontSize: 'inherit'
          }
        })}
      </div>
    );
  }
);

MathField.displayName = 'MathField';
