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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busyRole, setBusyRole] = useState<string | null>(null);
  const next = new URLSearchParams(window.location.search).get('next') || '/dashboard';

  const demoAccounts: { role: UserRole; label: string; email: string; name: string; icon: string; clearance: string }[] = [
    { role: 'BUSINESS', label: 'Commercial Business Occupier', email: 'business.demo@example.com', name: 'Rajesh Varma (Apex Agro Logistics)', icon: '💼', clearance: 'Commercial User Token #2601' },
    { role: 'LMO', label: 'Legal Metrology Officer (Inspector)', email: 'lmo.demo@example.com', name: 'Insp. Amit Sharma (Central Delhi)', icon: '🔍', clearance: 'Inspector Badge #DL-LMO-042' },
    { role: 'GATC', label: 'Accredited GATC Testing Centre', email: 'gatc.demo@example.com', name: 'Dr. Hardik Patel (Gujarat Metrology)', icon: '🔬', clearance: 'NABL / GATC Code GATC-GJ-08' },
    { role: 'CONTROLLER', label: 'Controller / Senior Officer', email: 'controller.demo@example.com', name: 'Sunita Meena (Delhi HQ)', icon: '⚖️', clearance: 'Regulatory Controller Key' },
    { role: 'STATE_ADMIN', label: 'State Administrator', email: 'stateadmin.demo@example.com', name: 'Bhavna Jadav (Govt of Gujarat)', icon: '🏛️', clearance: 'State Metrology Admin' },
    { role: 'CENTRAL_ADMIN', label: 'Central Administrator', email: 'centraladmin.demo@example.com', name: 'Venkatesh Ramanathan (DoCA)', icon: '🇮🇳', clearance: 'Ministry National Admin' },
  ];

  const handleOneClickLogin = async (role: UserRole) => {
    setLoginError(null);
    setBusyRole(role);
    try {
      await storage.switchDemoRole(role);
      navigate(next);
    } catch (e) {
      setLoginError((e as Error).message);
    } finally {
      setBusyRole(null);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setBusyRole('password');
    try {
      await storage.signIn(email, password);
      navigate(next);
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setBusyRole(null);
    }
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
            <h2 className="text-base font-bold text-slate-900 mt-1">Evaluator accounts</h2>
            <p className="text-xs text-slate-500">
              Real accounts on the live database, one per role. Tap to sign in. Password for all six: <span className="font-mono font-bold text-slate-800">TulaDemo@2026</span>
            </p>
          </div>

          <div className="space-y-2">
            {demoAccounts.map(acc => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleOneClickLogin(acc.role)}
                disabled={busyRole !== null}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#0070C0] hover:bg-blue-50/40 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-1 bg-slate-50 rounded-lg border border-slate-100 shadow-2xs shrink-0">
                    {acc.icon}
                  </span>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 group-hover:text-[#1F497D]">{acc.label}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{busyRole === acc.role ? 'Signing in…' : acc.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{acc.email}</p>
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
          {/* New business registration */}
          <div className="bg-gradient-to-br from-[#1F497D] to-[#0d223f] text-white p-6 rounded-2xl shadow-lg space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-300">New here?</span>
            <h2 className="text-base font-bold">Register your business</h2>
            <p className="text-xs text-slate-300 leading-relaxed">Create an account, add your scales or pumps, and apply for verification online. Takes about two minutes.</p>
            <Link to="/register" className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#1F497D] font-bold text-sm flex items-center justify-center gap-2">
              <Fingerprint className="w-4 h-4 text-[#0070C0]" /> Create business account
            </Link>
            <p className="text-[11px] text-slate-400">Officer sign-in through e-Pramaan single sign-on is planned for the pilot. The prototype uses the demo officer roles on the left.</p>
          </div>

          {/* Registered account sign-in (one-time code) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sign in</h2>
              <p className="text-[11px] text-slate-500">Business accounts and any evaluator account</p>
            </div>
            <form onSubmit={handlePasswordLogin} className="space-y-3 text-xs">
              <label className="block">
                <span className="block font-semibold text-slate-700 mb-1">Email</span>
                <span className="relative block">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm" />
                </span>
              </label>
              <label className="block">
                <span className="block font-semibold text-slate-700 mb-1">Password</span>
                <span className="relative block">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm" />
                </span>
              </label>
              <button type="submit" disabled={busyRole !== null} className="w-full bg-[#1F497D] hover:bg-[#163a66] text-white font-bold py-3 rounded-lg text-sm disabled:opacity-50">
                {busyRole === 'password' ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            {loginError && <p role="alert" className="text-xs text-rose-700">{loginError}</p>}
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
