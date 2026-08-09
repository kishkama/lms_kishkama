export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

export interface BadgeProps {
  label: string;
  tone: BadgeTone;
}

const toneVars: Record<BadgeTone, { bg: string; text: string }> = {
  success: { bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)' },
  warning: { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)' },
  danger: { bg: 'var(--badge-danger-bg)', text: 'var(--badge-danger-text)' },
  neutral: { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)' },
};

export function Badge({ label, tone }: BadgeProps) {
  const t = toneVars[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)',
        background: t.bg,
        color: t.text,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
