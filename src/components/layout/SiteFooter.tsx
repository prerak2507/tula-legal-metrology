import React from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_LINKS } from '../../config/sources';

const LINKS: [string, string][] = [
  ['/help', 'Help'],
  ['/accessibility', 'Accessibility'],
  ['/privacy', 'Privacy'],
  ['/terms', 'Terms of use'],
  ['/sources', 'Sources'],
  ['/status', 'Built vs planned'],
  ['/verify', 'Check a certificate'],
];

const updated = (() => {
  try { return new Date(__BUILD_DATE__).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; }
})();

/** Footer for the portal and the public inner pages. The landing page has its own larger one. */
export const SiteFooter: React.FC = () => (
  <footer className="bg-ink-900 text-paper/70 text-xs font-plex no-print">
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold text-paper">TULA</span>
          <span lang="hi" className="text-sm font-semibold text-brass-300">तुला</span>
          <span className="text-paper/50">· Legal Metrology verification</span>
        </p>
        <p className="mt-1.5">SIH 2026 · Problem statement 26036 · Team FriendlyFire (182718). A student prototype, not an official Government of India website.</p>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
        {LINKS.map(([to, label]) => <Link key={to} to={to} className="hover:text-paper underline-offset-2 hover:underline">{label}</Link>)}
      </nav>
    </div>
    <div className="border-t border-paper/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap justify-between gap-2 text-[11px] text-paper/50">
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {LEGAL_LINKS.map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="hover:text-paper underline underline-offset-2 decoration-paper/30" title={l.note}>{l.label}</a>
          ))}
        </span>
        {updated && <span>Last updated {updated}</span>}
      </div>
    </div>
    <div className="h-[3px] w-full flex" aria-hidden="true"><span className="flex-1 bg-[#FF9933]" /><span className="flex-1 bg-white" /><span className="flex-1 bg-[#138808]" /></div>
  </footer>
);
