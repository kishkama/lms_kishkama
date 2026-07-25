import type { CSSProperties } from 'react';

// Subset of Lucide icon paths (https://lucide.dev, ISC license) used by the auth screen.
const ICONS: Record<string, string> = {
  mail: `<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
  <rect x="2" y="4" width="20" height="16" rx="2"></rect>`,
  eye: `<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
  <circle cx="12" cy="12" r="3"></circle>`,
  'eye-off': `<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path>
  <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path>
  <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path>
  <path d="m2 2 20 20"></path>`,
  'circle-alert': `<circle cx="12" cy="12" r="10"></circle>
  <line x1="12" x2="12" y1="8" y2="12"></line>
  <line x1="12" x2="12.01" y1="16" y2="16"></line>`,
  'loader-circle': `<path d="M21 12a9 9 0 1 1-6.219-8.56"></path>`,
};

export interface IconProps {
  name: keyof typeof ICONS | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2, style }: IconProps) {
  const inner = ICONS[name];
  if (!inner) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
