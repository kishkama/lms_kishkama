import { useState, type SelectHTMLAttributes } from 'react';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
}

export function Select({ label, error, hint, options, disabled, id, ...rest }: SelectProps) {
  const [focus, setFocus] = useState(false);
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-body)' }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <select
          id={selectId}
          disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%',
            padding: '11px 36px 11px 14px',
            fontSize: 'var(--text-base)',
            fontFamily: 'var(--font-ui)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${error ? 'var(--color-danger)' : focus ? 'var(--color-primary)' : 'var(--border-default)'}`,
            outline: 'none',
            boxShadow: focus ? 'var(--shadow-focus)' : 'none',
            background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
            color: 'var(--text-body)',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            boxSizing: 'border-box',
            appearance: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={16}
          color="var(--text-muted)"
          style={{ position: 'absolute', right: 12, pointerEvents: 'none' }}
        />
      </div>
      {error ? (
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Icon name="circle-alert" size={13} />
          {error}
        </span>
      ) : hint ? (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{hint}</span>
      ) : null}
    </div>
  );
}
