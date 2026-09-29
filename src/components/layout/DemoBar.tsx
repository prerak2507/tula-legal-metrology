import React from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../../types';
import { Sliders } from 'lucide-react';

interface DemoBarProps {
  currentUser: UserProfile;
  onOpenDemoControl: () => void;
}

export const DemoBar: React.FC<DemoBarProps> = ({ currentUser, onOpenDemoControl }) => {
  return (
    <aside aria-label="Demo Environment Indicator" className="bg-slate-900 text-slate-100 text-xs sticky top-0 z-50 no-print">
      <div className="flex items-center justify-between px-4 py-1.5 gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 uppercase tracking-wider text-[9px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            SIH 26036 Demo
          </span>
          <span className="text-slate-400 text-[10px] hidden sm:inline">
            Active: <strong className="text-slate-200">{currentUser.fullName}</strong> ({currentUser.role})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-[10px] font-medium text-slate-300 hover:text-white transition-colors"
          >
            Switch Account at Gateway &rarr;
          </Link>
          <button
            onClick={onOpenDemoControl}
            className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-2.5 py-1 rounded text-[10px] transition-colors"
          >
            <Sliders className="w-3 h-3" />
            Demo Control
          </button>
        </div>
      </div>
    </aside>
  );
};
