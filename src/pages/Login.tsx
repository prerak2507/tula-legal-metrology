import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { UserRole } from '../types';
import { 
  ShieldCheck, 
  ArrowRight, 
  UserCheck, 
  QrCode, 
  Lock, 
  Mail,
  Building,
  Globe,
  KeyRound,
  CheckCircle2,
  Fingerprint
} from 'lucide-react';
import { TulaLogo } from '../components/common/TulaLogo';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('business@demo.gov.in');
  const [password, setPassword] = useState('••••••••');
  const [loginMethod, setLoginMethod] = useState<'sso' | 'demo' | 'password'>('demo');

  const demoAccounts: { role: UserRole; label: string; email: string; name: string; icon: string; clearance: string }[] = [
    { role: 'BUSINESS', label: 'Commercial Business Occupier', email: 'business@demo.gov.in', name: 'Rajesh Varma (Apex Agro Logistics)', icon: '💼', clearance: 'Commercial User Token #2601' },
    { role: 'LMO', label: 'Legal Metrology Officer (Inspector)', email: 'lmo@demo.gov.in', name: 'Insp. Amit Sharma (Central Delhi)', icon: '🔍', clearance: 'Inspector Badge #DL-LMO-042' },
    { role: 'GATC', label: 'Accredited GATC Testing Centre', email: 'gatc@demo.gov.in', name: 'Dr. Hardik Patel (Gujarat Metrology)', icon: '🔬', clearance: 'NABL / GATC Code GATC-GJ-08' },
    { role: 'CONTROLLER', label: 'Controller / Senior Officer', email: 'controller@demo.gov.in', name: 'Sunita Meena, IAS (Delhi HQ)', icon: '⚖️', clearance: 'Regulatory Controller Key' },
    { role: 'STATE_ADMIN', label: 'State Administrator', email: 'stateadmin@demo.gov.in', name: 'Bhavna Jadav (Govt of Gujarat)', icon: '🏛️', clearance: 'State Metrology Admin' },
    { role: 'CENTRAL_ADMIN', label: 'Central Administrator', email: 'centraladmin@demo.gov.in', name: 'Venkatesh Ramanathan (DoCA)', icon: '🇮🇳', clearance: 'Ministry National Admin' },
  ];

  const handleOneClickLogin = (role: UserRole) => {
    storage.switchDemoRole(role);
    navigate('/dashboard');
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const allUsers = storage.getAllDemoUsers();
    const matched = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || allUsers[0];
    storage.setCurrentUser(matched);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1F497D] transition-colors"
        >
          <Globe className="w-4 h-4 text-[#0070C0]" />
          <span>&larr; Back to Public Landing Page</span>
        </Link>
        <Link
          to="/verify"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0070C0] hover:text-[#1F497D] transition-colors"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Public Live QR Scanner</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <TulaLogo variant="full" theme="light" size="lg" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-900">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>National Legal Metrology Authentication Gateway</span>
          <span className="text-slate-300">•</span>
          <span>SIH 26036 Prototype</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Department of Consumer Affairs, Ministry of Consumer Affairs, Food &amp; Public Distribution
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: 1-Click Demo Personas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Instant Access
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">1-Click Demo Profiles</h2>
            <p className="text-xs text-slate-500">
              Select any stakeholder role to test end-to-end workflows without passwords:
            </p>
          </div>

          <div className="space-y-2">
            {demoAccounts.map(acc => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleOneClickLogin(acc.role)}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#0070C0] hover:bg-blue-50/40 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-1 bg-slate-50 rounded-lg border border-slate-100 shadow-2xs shrink-0">
                    {acc.icon}
                  </span>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 group-hover:text-[#1F497D]">{acc.label}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{acc.name}</p>
                    <span className="text-[9px] font-mono text-[#0070C0] bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                      {acc.clearance}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0070C0] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: National SSO & Custom Credentials Sign In */}
        <div className="space-y-4">
          {/* National SSO Gateway Option */}
          <div className="bg-gradient-to-br from-[#1F497D] to-[#0d223f] text-white p-6 rounded-2xl shadow-lg border border-slate-800 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-300">
                  Government of India Gateway
                </span>
                <span className="text-[10px] text-white/70">e-Pramaan / MeriPehchan</span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">National Single Sign-On (SSO)</h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Seamless multi-factor authentication via MeriPehchan, JanParichay, or DigiLocker Metrology Service.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleOneClickLogin('BUSINESS')}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#1F497D] font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Fingerprint className="w-4 h-4 text-[#0070C0]" />
                <span>Sign In with e-Pramaan National SSO</span>
              </button>
              <button
                type="button"
                onClick={() => handleOneClickLogin('LMO')}
                className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                <span>Sign In via Official DoCA Gov-Net</span>
              </button>
            </div>
          </div>

          {/* Standard Credentials Sign In */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Department Credentials Sign In</h2>
              <p className="text-[11px] text-slate-500">Enter your assigned username and portal token</p>
            </div>

            <form onSubmit={handleCustomLogin} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#0070C0] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#0070C0] focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1F497D] hover:bg-[#163a66] text-white font-bold py-2.5 rounded-lg text-xs transition-colors shadow-xs"
              >
                Sign In to TULA Portal
              </button>
            </form>
          </div>

          {/* Public Verification Shortcut */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <QrCode className="w-7 h-7 text-sky-400 shrink-0" />
              <div>
                <h3 className="font-bold text-xs text-white">Public Certificate Verification</h3>
                <p className="text-[11px] text-slate-400">Scan QR or enter certificate number without logging in</p>
              </div>
            </div>
            <Link
              to="/verify"
              className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
            >
              Verify QR
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
