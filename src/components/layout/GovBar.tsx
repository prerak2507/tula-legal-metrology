import React, { useEffect, useState } from 'react';
import { A11yPrefs, TextSize, getA11yPrefs, onA11yChange, setA11yPrefs } from '../../services/a11y';

/**
 * The thin strip above every page, as on government websites: who the site is for,
 * skip to content and text size. Says plainly that this is a student prototype.
 */
export const GovBar: React.FC<{ mainId?: string }> = ({ mainId = 'main' }) => {
  const [prefs, setPrefs] = useState<A11yPrefs>(getA11yPrefs());
  useEffect(() => onA11yChange(setPrefs), []);

  const sizeBtn = (size: TextSize, label: string, aria: string) => (
    <button type="button" onClick={() => setA11yPrefs({ size })} aria-pressed={prefs.size === size} aria-label={aria}
      className={`min-w-[28px] h-7 px-1.5 rounded font-semibold ${prefs.size === size ? 'bg-paper text-ink' : 'text-paper/80 hover:bg-paper/10'}`}>
      {label}
    </button>
  );

  return (
    <div className="bg-ink-900 text-paper/80 text-[11px] font-plex no-print">
      <a href={`#${mainId}`} className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-3 focus:py-2 focus:rounded focus:bg-brass-300 focus:text-ink focus:font-bold">
        Skip to main content
      </a>
      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 h-8 flex items-center justify-between gap-3">
        <p className="truncate">
          <span className="hidden sm:inline">Built for the Department of Consumer Affairs · </span>
          <span>SIH 2026 student prototype</span>
        </p>
        <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Reading preferences">
          {sizeBtn('sm', 'A−', 'Smaller text')}
          {sizeBtn('md', 'A', 'Normal text')}
          {sizeBtn('lg', 'A+', 'Larger text')}
        </div>
      </div>
    </div>
  );
};
