import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { UserRole } from '../types';
import {
  ArrowLeft, ArrowRight, QrCode, Lock, Mail, Store, ClipboardCheck, FlaskConical, Landmark, Building2, Globe2, Loader2, UserPlus,
} from 'lucide-react';
import { TulaLogo } from '../components/common/TulaLogo';
import { GuillocheBand } from '../components/landing/Guilloche';
import { GovBar } from '../components/layout/GovBar';

// Short labels so all six accounts fit on one screen. Names and places come from the seeded accounts.
const ROLE_META: Record<string, { label: string; code: string; icon: React.ElementType }> = {
  BUSINESS: { label: 'Shop owner', code: 'BUS', icon: Store },
  LMO: { label: 'Field officer', code: 'LMO', icon: ClipboardCheck },
  GATC: { label: 'Test centre', code: 'GATC', icon: FlaskConical },
  CONTROLLER: { label: 'Controller', code: 'CTRL', icon: Landmark },
  STATE_ADMIN: { label: 'State admin', code: 'STATE', icon: Building2 },
  CENTRAL_ADMIN: { label: 'DoCA admin', code: 'DOCA', icon: Globe2 },
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busyRole, setBusyRole] = useState<string | null>(null);
  const next = new URLSearchParams(window.location.search).get('next') || '/dashboard';

  const demoAccounts = storage.getAllDemoUsers().map(u => ({
    role: u.role,
    meta: ROLE_META[u.role] || { label: u.role, code: u.role, icon: Building2 },
    name: u.fullName,
    place: u.role === 'CENTRAL_ADMIN' ? 'All States' : `${u.district}, ${u.state}`,
  }));

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

  const input = 'w-full bg-paper-50 border border-paper-300 rounded-md pl-9 pr-3 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 min-h-[44px]';

  return (
    <div className="w-full flex-1 min-h-[100dvh] lg:h-[100dvh] flex flex-col">
    <GovBar />
    <div className="flex-1 min-h-0 grid lg:grid-cols-[5fr_7fr] font-plex bg-paper text-ink">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden lg:flex flex-col justify-between bg-ink text-paper p-10 xl:p-12 overflow-hidden">
        <GuillocheBand className="absolute inset-x-0 top-1/3 w-full h-1/2 text-brass/20" lines={20} />
        <div className="relative">
          <Link to="/" aria-label="TULA home" className="inline-flex items-baseline gap-2.5">
            <span className="font-display text-3xl font-semibold tracking-tight">TULA</span>
            <span lang="hi" className="text-xl font-semibold text-brass-300">तुला</span>
          </Link>
        </div>
        <div className="relative">
          <p className="font-readout text-xs tracking-[0.18em] uppercase text-brass-300">SIH 2026 · PS 26036</p>
          <h1 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.05] tracking-tight mt-4">
            One record for every scale.
            <span className="block italic font-normal text-brass-300 mt-1">From application to a QR anyone can check.</span>
          </h1>
          <div className="mt-8 grid gap-2.5 max-w-md">
            <Link to="/register" className="group flex items-center gap-3 rounded-md bg-paper/5 border border-paper/15 hover:bg-paper/10 px-4 py-3">
              <UserPlus className="w-5 h-5 text-brass-300 shrink-0" />
              <span className="flex-1 text-sm"><strong className="block font-semibold">New business? Register</strong><span className="text-paper/60">Add your scales and apply online. About two minutes.</span></span>
              <ArrowRight className="w-4 h-4 text-paper/60 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/verify" className="group flex items-center gap-3 rounded-md bg-paper/5 border border-paper/15 hover:bg-paper/10 px-4 py-3">
              <QrCode className="w-5 h-5 text-brass-300 shrink-0" />
              <span className="flex-1 text-sm"><strong className="block font-semibold">Buyer? Check a certificate</strong><span className="text-paper/60">Scan the QR. No login needed.</span></span>
              <ArrowRight className="w-4 h-4 text-paper/60 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
        <p className="relative text-xs text-paper/50">Officer sign-in through e-Pramaan is planned for the pilot. A student prototype, not an official Government of India website.</p>
      </aside>

      {/* Sign-in */}
      <main id="main" className="flex flex-col px-4 py-4 sm:px-8 sm:py-6 lg:px-12 lg:py-8 lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="lg:hidden" aria-label="TULA home"><TulaLogo variant="full" theme="light" size="sm" /></Link>
          <Link to="/" className="hidden lg:inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink"><ArrowLeft className="w-4 h-4" /> Home</Link>
          <Link to="/verify" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline min-h-[44px]"><QrCode className="w-4 h-4" /> Check a certificate</Link>
        </div>

        <div className="w-full max-w-xl mx-auto my-auto py-4 lg:py-6">
          <h2 className="font-display text-[1.75rem] sm:text-4xl font-semibold tracking-tight leading-tight">Sign in</h2>
          <p className="text-sm text-ink-600 mt-1">
            Tap an evaluator account to enter that role on the live database. Password for all six: <span className="font-readout font-semibold text-ink">TulaDemo@2026</span>
          </p>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {demoAccounts.map(acc => {
              const Icon = acc.meta.icon;
              return (
                <button key={acc.role} type="button" onClick={() => handleOneClickLogin(acc.role)} disabled={busyRole !== null}
                  className="group text-left rounded-md bg-paper-50 border border-paper-300 hover:border-ink hover:bg-white px-3 py-2.5 transition-colors disabled:opacity-60 min-h-[64px]">
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold text-sm">
                      {busyRole === acc.role ? <Loader2 className="w-4 h-4 animate-spin text-brass-700" /> : <Icon className="w-4 h-4 text-brass-700" />}
                      {acc.meta.label}
                    </span>
                    <span className="font-readout text-[9px] tracking-wider text-ink-600 hidden sm:inline">{acc.meta.code}</span>
                  </span>
                  <span className="block text-[11px] text-ink-600 truncate mt-0.5">{busyRole === acc.role ? 'Signing in…' : acc.name}</span>
                  <span className="block text-[10px] text-ink-600/70 truncate">{acc.place}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 my-4 text-[11px] uppercase tracking-[0.16em] text-ink-600">
            <span className="flex-1 h-px bg-paper-300" /> or with email <span className="flex-1 h-px bg-paper-300" />
          </div>

          <form onSubmit={handlePasswordLogin} className="grid sm:grid-cols-2 gap-2.5">
            <label className="block">
              <span className="sr-only">Email</span>
              <span className="relative block">
                <Mail className="w-4 h-4 text-ink-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className={input} />
              </span>
            </label>
            <label className="block">
              <span className="sr-only">Password</span>
              <span className="relative block">
                <Lock className="w-4 h-4 text-ink-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" className={input} />
              </span>
            </label>
            <button type="submit" disabled={busyRole !== null} className="sm:col-span-2 inline-flex items-center justify-center gap-2 bg-ink hover:bg-ink-800 text-paper font-semibold rounded-md text-sm disabled:opacity-50 min-h-[46px]">
              {busyRole === 'password' ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          {loginError && <p role="alert" className="mt-3 text-sm text-seal bg-seal-50 border border-seal/30 rounded-md px-3 py-2">{loginError}</p>}

          <p className="lg:hidden mt-4 text-sm text-ink-600">
            New business? <Link to="/register" className="font-semibold text-ink underline">Register in two minutes</Link>
          </p>
        </div>
      </main>
    </div>
    </div>
  );
};
