import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storage, WorkflowError } from '../services/storage';
import { LIVE_STATES } from '../config/geo';
import { cloud, cloudEnabled } from '../services/cloud';
import { TulaLogo } from '../components/common/TulaLogo';
import { ArrowLeft, ShieldCheck, Smartphone, AlertCircle } from 'lucide-react';

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [f, setF] = useState({
    fullName: '', organization: '', gstin: '', email: '', phone: '', state: 'Delhi', district: LIVE_STATES.Delhi[0], address: '',
    notifyByEmail: true, notifyBySms: true, consent: false, password: '', password2: '',
  });
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof f, v: string | boolean) => setF(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (f.fullName.trim().length < 3) e.fullName = 'Enter your full name.';
    if (f.organization.trim().length < 2) e.organization = 'Enter the shop or company name.';
    if (f.gstin.trim() && !GSTIN_RE.test(f.gstin.trim().toUpperCase())) e.gstin = 'GSTIN should be 15 characters, like 07ABCDE1234F1Z5.';
    if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email.';
    if (!PHONE_RE.test(f.phone.replace(/\D/g, '').slice(-10))) e.phone = 'Enter a 10-digit mobile number.';
    if (f.address.trim().length < 8) e.address = 'Enter the business address.';
    if (f.password.length < 8) e.password = 'Use at least 8 characters.';
    if (f.password2 !== f.password) e.password2 = 'Passwords do not match.';
    if (!f.consent) e.consent = 'Please agree so we can process your applications.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    const phone = `+91${f.phone.replace(/\D/g, '').slice(-10)}`;
    const profile = {
      fullName: f.fullName.trim(), organization: f.organization.trim(), phone, gstin: f.gstin.trim().toUpperCase() || undefined,
      address: f.address.trim(), state: f.state, district: f.district, notifyByEmail: f.notifyByEmail, notifyBySms: f.notifyBySms,
    };
    setBusy(true);
    try {
      if (cloudEnabled) {
        const r = await cloud.signUp(f.email.trim().toLowerCase(), f.password, profile);
        if (r.needsConfirmation) { setConfirmSent(true); return; }
        storage.addAuditLog('USER_REGISTERED', 'USER', r.profile?.id || '', `Business account created for ${profile.organization} (${profile.state})`);
      } else {
        storage.registerBusinessUser({ ...profile, email: f.email, gstin: profile.gstin });
      }
      navigate('/instruments?register=1');
    } catch (err) {
      const msg = err instanceof WorkflowError || err instanceof Error ? err.message : String(err);
      setError(/already registered/i.test(msg) ? 'This email is already registered. Sign in instead.' : msg);
    } finally {
      setBusy(false);
    }
  };

  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
      <input value={String(f[k])} onChange={e => set(k, e.target.value)} aria-invalid={!!errors[k]}
        className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm ${errors[k] ? 'border-rose-400' : 'border-slate-300'}`} {...props} />
      {errors[k] && <span className="block text-xs text-rose-700 mt-1">{errors[k]}</span>}
    </label>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" aria-label="TULA home"><TulaLogo variant="full" theme="light" size="sm" /></Link>
          <Link to="/login" className="text-sm font-semibold text-gov-700">Sign in</Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Link to="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-gov-700"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Register your business</h1>
          <p className="text-sm text-slate-600">For shops, fuel stations, weighbridges and anyone who uses a scale or meter for trade.</p>
        </div>

        {confirmSent ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 text-sm">
            <p className="font-bold text-slate-900">Check your email</p>
            <p className="text-slate-600">We sent a confirmation link to {f.email}. Open it, then <Link to="/login" className="underline font-semibold">sign in</Link>.</p>
          </div>
        ) : (
          <form onSubmit={create} noValidate className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('fullName', 'Your name *', { autoComplete: 'name' })}
              {field('organization', 'Shop / company name *', { autoComplete: 'organization' })}
              {field('email', 'Email *', { type: 'email', autoComplete: 'email' })}
              {field('phone', 'Mobile number *', { inputMode: 'tel', autoComplete: 'tel-national', placeholder: '98765 43210' })}
              {field('gstin', 'GSTIN (optional)', { placeholder: '07ABCDE1234F1Z5' })}
              <label className="block">
                <span className="block text-xs font-semibold text-slate-700 mb-1">State *</span>
                <select value={f.state} onChange={e => { set('state', e.target.value); set('district', LIVE_STATES[e.target.value][0]); }} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm">
                  {Object.keys(LIVE_STATES).map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-700 mb-1">District *</span>
                <select value={f.district} onChange={e => set('district', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm">
                  {LIVE_STATES[f.state].map(d => <option key={d}>{d}</option>)}
                </select>
              </label>
            </div>
            {field('address', 'Business address *', { autoComplete: 'street-address' })}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('password', 'Password *', { type: 'password', autoComplete: 'new-password' })}
              {field('password2', 'Repeat password *', { type: 'password', autoComplete: 'new-password' })}
            </div>
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-slate-700">Send me updates by</legend>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-5 h-5" checked={f.notifyBySms} onChange={e => set('notifyBySms', e.target.checked)} /> SMS</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-5 h-5" checked={f.notifyByEmail} onChange={e => set('notifyByEmail', e.target.checked)} /> Email</label>
            </fieldset>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" className="w-5 h-5 mt-0.5" checked={f.consent} onChange={e => set('consent', e.target.checked)} />
              <span>I agree that my details are used to process verification of my instruments and to send me updates about them.</span>
            </label>
            {errors.consent && <p className="text-xs text-rose-700">{errors.consent}</p>}
            <p className="text-[11px] text-slate-500">Only Delhi and Gujarat have officers set up in this prototype. Your account and records are stored in the TULA database and protected by per-account access rules.</p>
            {error && <p role="alert" className="text-sm text-rose-700 flex gap-1.5"><AlertCircle className="w-4 h-4 mt-0.5" />{error}</p>}
            <button type="submit" disabled={busy} className="w-full py-3 rounded-lg bg-gov-700 hover:bg-gov-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50">
              <ShieldCheck className="w-4 h-4" /> {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};
