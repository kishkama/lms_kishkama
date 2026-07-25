import { useState, type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: string;
}

export function Input({ label, type = 'text', error, hint, icon, disabled, id, ...rest }: InputProps) {
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState(false);
  const isPassword = type === 'password';
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-body)' }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <Icon name={icon} size={17} color="var(--text-muted)" style={{ position: 'absolute', left: 13 }} />
        )}
        <input
          id={inputId}
          type={isPassword && show ? 'text' : type}
          disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%',
            padding: `11px ${isPassword ? 44 : 14}px 11px ${icon ? 40 : 14}px`,
            fontSize: 'var(--text-base)',
            fontFamily: 'var(--font-ui)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${error ? 'var(--color-danger)' : focus ? 'var(--color-primary)' : 'var(--border-default)'}`,
            outline: 'none',
            boxShadow: focus ? 'var(--shadow-focus)' : 'none',
            background: disabled ? 'var(--surface-sunken)' : '#fff',
            color: 'var(--text-body)',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            boxSizing: 'border-box',
          }}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: 4,
            }}
          >
            <Icon name={show ? 'eye-off' : 'eye'} size={17} />
          </button>
        )}
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
