import { useState, type ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

const sizes: Record<Size, { padding: string; fontSize: string; gap: number }> = {
  sm: { padding: '8px 14px', fontSize: 'var(--text-sm)', gap: 6 },
  md: { padding: '11px 20px', fontSize: 'var(--text-base)', gap: 8 },
  lg: { padding: '14px 26px', fontSize: 'var(--text-lg)', gap: 8 },
};

const variants: Record<Variant, { background: string; color: string; border: string }> = {
  primary: { background: 'var(--color-primary)', color: '#fff', border: '1px solid transparent' },
  secondary: { background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary-border)' },
  ghost: { background: 'transparent', color: 'var(--text-body)', border: '1px solid transparent' },
  danger: { background: 'var(--color-danger)', color: '#fff', border: '1px solid transparent' },
};

const hoverBg: Record<Variant, string> = {
  primary: 'var(--color-primary-hover)',
  secondary: 'var(--color-primary-subtle)',
  ghost: 'var(--surface-sunken)',
  danger: 'var(--red-700)',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  children,
  style,
  ...rest
}: ButtonProps) {
  const s = sizes[size];
  const v = variants[variant];
  const [hover, setHover] = useState(false);

  return (
    <button
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        fontFamily: 'var(--font-ui)',
        fontWeight: 'var(--weight-semibold)',
        borderRadius: 'var(--radius-md)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'background var(--transition-fast), border-color var(--transition-fast), opacity var(--transition-fast)',
        opacity: disabled ? 0.5 : 1,
        background: hover && !disabled && !loading ? hoverBg[variant] : v.background,
        color: v.color,
        border: v.border,
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <Icon
          name="loader-circle"
          size={s.fontSize === 'var(--text-lg)' ? 18 : 16}
          style={{ animation: 'lf-spin 0.7s linear infinite' }}
        />
      )}
      {!loading && icon && iconPosition === 'left' && <Icon name={icon} size={16} />}
      {children}
      {!loading && icon && iconPosition === 'right' && <Icon name={icon} size={16} />}
    </button>
  );
}
