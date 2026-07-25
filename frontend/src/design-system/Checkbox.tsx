import type { ChangeEventHandler } from 'react';

export interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
}

export function Checkbox({ label, checked, onChange, disabled }: CheckboxProps) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: 'var(--text-sm)',
        color: 'var(--text-body)',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ position: 'absolute', opacity: 0, width: 18, height: 18 }}
      />
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: `1.5px solid ${checked ? 'var(--color-primary)' : 'var(--border-strong)'}`,
          background: checked ? 'var(--color-primary)' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background var(--transition-fast), border-color var(--transition-fast)',
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}
