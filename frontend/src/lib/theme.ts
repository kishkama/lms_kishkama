export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'learnflow.theme';

export function loadTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-lf-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}
