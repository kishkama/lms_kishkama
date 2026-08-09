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
  plus: `<path d="M5 12h14"></path>
  <path d="M12 5v14"></path>`,
  x: `<path d="M18 6 6 18"></path>
  <path d="m6 6 12 12"></path>`,
  'chevron-down': `<path d="m6 9 6 6 6-6"></path>`,
  home: `<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
  <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>`,
  'layout-grid': `<rect width="7" height="7" x="3" y="3" rx="1"></rect>
  <rect width="7" height="7" x="14" y="3" rx="1"></rect>
  <rect width="7" height="7" x="14" y="14" rx="1"></rect>
  <rect width="7" height="7" x="3" y="14" rx="1"></rect>`,
  'book-open': `<path d="M12 7v14"></path>
  <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>`,
  settings: `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
  <circle cx="12" cy="12" r="3"></circle>`,
  'triangle-alert': `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
  <path d="M12 9v4"></path>
  <path d="M12 17h.01"></path>`,
  lock: `<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`,
  'circle-check-big': `<path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
  <path d="m9 11 3 3L22 4"></path>`,
  sun: `<circle cx="12" cy="12" r="4"></circle>
  <path d="M12 2v2"></path>
  <path d="M12 20v2"></path>
  <path d="m4.93 4.93 1.41 1.41"></path>
  <path d="m17.66 17.66 1.41 1.41"></path>
  <path d="M2 12h2"></path>
  <path d="M20 12h2"></path>
  <path d="m6.34 17.66-1.41 1.41"></path>
  <path d="m19.07 4.93-1.41 1.41"></path>`,
  moon: `<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401Z"></path>`,
  'log-out': `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
  <path d="M16 17l5-5-5-5"></path>
  <path d="M21 12H9"></path>`,
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
