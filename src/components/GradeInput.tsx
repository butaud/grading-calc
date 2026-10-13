import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';

// Non-negative decimal, allowing partial input like "", "8." or ".5" while typing
const PARTIAL_NUMBER = /^\d*\.?\d*$/;

interface GradeInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number | null | undefined;
  onChange: (points: number | null) => void;
}

// Plain text field for grades. Avoids the browser's number-field behaviours
// (spinners, scroll-wheel and arrow-key changes) and selects the whole value on
// focus so typing or Backspace replaces it, like a spreadsheet cell.
export function GradeInput({ value, onChange, onFocus, onBlur, onMouseDown, ...rest }: GradeInputProps) {
  // What the user has typed while the field is focused; null when not editing
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={draft ?? (value ?? '')}
      onChange={(e) => {
        const text = e.target.value.trim();
        if (!PARTIAL_NUMBER.test(text)) return;
        setDraft(text);
        if (text === '') {
          onChange(null);
        } else if (text !== '.') {
          onChange(Number(text));
        }
      }}
      onMouseDown={(e) => {
        onMouseDown?.(e);
        // Stop the click from placing a caret, which would undo the select-all on focus
        if (document.activeElement !== e.currentTarget) {
          e.preventDefault();
          e.currentTarget.focus();
        }
      }}
      onFocus={(e) => {
        setDraft(value == null ? '' : String(value));
        e.currentTarget.select();
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setDraft(null);
        onBlur?.(e);
      }}
    />
  );
}
