import React, { useState, useRef, useEffect } from 'react';
import { UserRole, UserProfile } from '../../types';
import { storage } from '../../services/storage';
import { ChevronDown, Shield, QrCode, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoleSwitcherDropdownProps {
  currentUser: UserProfile;
  onOpenDemoControl: () => void;
}

export const RoleSwitcherDropdown: React.FC<RoleSwitcherDropdownProps> = ({
  currentUser,
  onOpenDemoControl,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roles: {
    role: UserRole;
    label: string;
    icon: string;
    name: string;
    org: string;
    state: string;
    description: string;
  }[] = [
    {
      role: 'BUSINESS',
      label: 'Commercial Occupier',
      icon: '💼',
      name: 'Rajesh Varma',
      org: 'Apex Agro Logistics & Retail Pvt Ltd',
      state: 'Delhi',
      description: 'Fleet management, verification applications, premises inspection tracker',
    },
    {
      role: 'LMO',
      label: 'Legal Metrology Officer',
      icon: '🔍',
      name: 'Insp. Amit K. Sharma',
      org: 'Controllerate of Legal Metrology, GNCTD',
      state: 'Delhi (Central/South)',
      description: 'Document scrutiny, on-site GPS inspection, MPE test tolerance & official stamping',
    },
    {
      role: 'GATC',
      label: 'Govt Approved Test Centre',
      icon: '🔬',
      name: 'Dr. Hardik Patel',
      org: 'Gujarat Metrology Calibration & Testing Lab',
      state: 'Gujarat',
      description: 'Rule 2026 mandate: CNG/LPG, weighbridges, and flow meter laboratory testing',
    },
    {
      role: 'CONTROLLER',
      label: 'State Controller',
      icon: '⚖️',
      name: 'Sunita Meena, IAS',
      org: 'Dept. of Consumer Affairs, Delhi HQ',
      state: 'Delhi State',
      description: 'Statewide regulatory oversight, pendency audits, and compounding approval',
    },
    {
      role: 'STATE_ADMIN',
      label: 'State Administrator',
      icon: '🏛️',
      name: 'Bhavna Jadav',
      org: 'Commissionerate of Legal Metrology',
      state: 'Gujarat State',
      description: 'State fee schedules, district quotas, and GATC accreditation governance',
    },
    {
      role: 'CENTRAL_ADMIN',
      label: 'Ministry Central Admin',
      icon: '🇮🇳',
      name: 'Venkatesh Ramanathan',
      org: 'Ministry of Consumer Affairs, Krishi Bhawan',
      state: 'National (Pan-India)',
      description: 'National standards, Central Model Approvals, and inter-state analytics',
    },
  ];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentRoleConfig = roles.find((r) => r.role === currentUser.role) || roles[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Profile Trigger — compact, clean */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all text-left group"
        title="Account & role settings"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1F497D] to-[#0070C0] text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
          {currentUser.fullName.charAt(0)}
        </div>

        {/* Name + Role — hidden on small screens */}
        <div className="hidden sm:block leading-tight max-w-[140px]">
          <p className="text-xs font-bold text-slate-800 truncate group-hover:text-gov-800 transition-colors">
            {currentRoleConfig.name.split(' ').slice(0, 2).join(' ')}
          </p>
          <p className="text-[10px] text-slate-500 font-medium truncate">{currentRoleConfig.label}</p>
        </div>

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Role Switcher Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header — Identity Card */}
          <div className="p-4 bg-gradient-to-r from-[#1F497D] to-[#0d223f] text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-300">
                Active Session
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Authenticated
              </span>
            </div>
            <h4 className="font-extrabold text-base text-white">{currentUser.fullName}</h4>
            <p className="text-[11px] text-sky-200 font-medium mt-0.5">{currentUser.organization}</p>
          </div>

          {/* Session Credentials */}
          <div className="p-4 space-y-3 text-xs bg-slate-50/50">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Department Role</span>
                <p className="font-bold text-slate-900 text-xs">{currentRoleConfig.label}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Jurisdiction</span>
                <p className="font-bold text-slate-900 text-xs">{currentRoleConfig.state}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Statutory Responsibilities</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">{currentRoleConfig.description}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-[#1F497D]">
                <Shield className="w-3.5 h-3.5 text-[#0070C0]" />
                <span>Audit &amp; Security Compliance</span>
              </p>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                In-app role flipping is disabled to preserve statutory audit trails under Section 24. Switch accounts via the Gateway.
              </p>
            </div>

            {/* Log Out to Gateway Button */}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <LogOut className="w-4 h-4 text-amber-400" />
              <span>Log Out &amp; Switch Account at Gateway</span>
            </Link>
          </div>

          {/* Quick Footer Links */}
          <div className="p-2.5 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="text-slate-600 hover:text-[#1F497D] font-bold"
              title="Return to Public Landing Page"
            >
              &larr; Landing Page
            </Link>
            <Link
              to="/verify"
              onClick={() => setIsOpen(false)}
              className="text-[#0070C0] hover:text-[#1F497D] font-bold flex items-center gap-1"
            >
              <QrCode className="w-3.5 h-3.5" />
              Live QR Scanner
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
