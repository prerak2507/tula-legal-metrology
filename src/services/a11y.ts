// Reader preference from the accessibility bar: text size.
// Stored on the device only. Everything works if storage is blocked.

export type TextSize = 'sm' | 'md' | 'lg';
export interface A11yPrefs { size: TextSize }

const KEY = 'tula-a11y';
const SIZES: Record<TextSize, string> = { sm: '93.75%', md: '100%', lg: '112.5%' };
const listeners = new Set<(p: A11yPrefs) => void>();

export function getA11yPrefs(): A11yPrefs {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { size: p.size in SIZES ? p.size : 'md' };
  } catch {
    return { size: 'md' };
  }
}

export function applyA11yPrefs(p: A11yPrefs = getA11yPrefs()) {
  const html = document.documentElement;
  html.style.fontSize = SIZES[p.size];
}

export function setA11yPrefs(patch: Partial<A11yPrefs>) {
  const next = { ...getA11yPrefs(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* keep it for this visit only */ }
  applyA11yPrefs(next);
  listeners.forEach(l => l(next));
}

export function onA11yChange(fn: (p: A11yPrefs) => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

declare global {
  const __BUILD_DATE__: string;
}
