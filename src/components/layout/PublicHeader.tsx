import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, QrCode } from 'lucide-react';
import { TulaLogo } from '../common/TulaLogo';
import { GovBar } from './GovBar';

/** Header for the public inner pages (help, policies, status, demo guide). */
export const PublicHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>
    <GovBar />
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-paper-300 font-plex">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" aria-label="TULA home" className="shrink-0"><TulaLogo variant="full" theme="light" size="sm" /></Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {children}
          <Link to="/verify" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold text-ink hover:bg-paper-200 min-h-[44px]"><QrCode className="w-4 h-4" /><span className="hidden sm:inline">Check a certificate</span></Link>
          <Link to="/login" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold bg-ink hover:bg-ink-800 text-paper min-h-[44px]"><LogIn className="w-4 h-4" /> Sign in</Link>
        </nav>
      </div>
    </header>
  </>
);
