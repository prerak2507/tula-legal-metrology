import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TulaLogo } from '../components/common/TulaLogo';
import { CheckCircle2, CircleDashed, Clock, Home, PlayCircle, ShieldCheck, Map, WifiOff } from 'lucide-react';

type State = 'LIVE' | 'PARTIAL' | 'PLANNED';

const ROWS: { req: string; state: State; today: string; next: string }[] = [
  { req: 'Registration and profiles', state: 'PARTIAL', today: 'Business self-registration with mobile check (demo code). Six demo officer roles.', next: 'Supabase Auth with phone OTP, e-Pramaan sign-in for officers' },
  { req: 'Apply for verification / re-verification', state: 'LIVE', today: 'Four service types, own instruments only, document upload, fee from the State rule', next: 'Treasury payment gateway' },
  { req: 'Scheduling and allocation to LMO / GATC', state: 'LIVE', today: 'Workflow order enforced. Officer suggested by district and workload, GATC for heavy equipment', next: 'Officer calendars and route planning' },
  { req: 'Inspection results recorded digitally', state: 'LIVE', today: 'Checklist, readings checked against OIML R 76 / R 117 limits, camera photos, GPS distance to site', next: 'Photo upload to cloud storage' },
  { req: 'QR digital certificate', state: 'LIVE', today: 'ECDSA P-256 signed QR, checked on any phone, works offline, revocation list', next: 'Key held in a hardware security module, per-officer keys' },
  { req: 'Validity tracking and expiry alerts', state: 'LIVE', today: 'Status derived from dates. Reminders at 30, 15, 7 and 1 days', next: 'Daily server job (pg_cron)' },
  { req: 'SMS / email notifications', state: 'PARTIAL', today: 'Every event writes an SMS and email. Sent through Resend / Twilio when keys are set, otherwise marked "gateway not set up"', next: 'NIC SMS gateway, government email relay' },
  { req: 'Dashboards: pendency, inspections, enforcement', state: 'LIVE', today: 'Pendency by stage, ageing, district, inspections due and overdue, measured turnaround', next: 'State-wide live view across devices' },
  { req: 'Photos and documents', state: 'LIVE', today: 'Real camera capture and file upload, stored on the device', next: 'Supabase Storage with virus scan' },
  { req: 'Export and print', state: 'LIVE', today: 'Certificate PDF with QR, print view, CSV reports', next: 'Bulk export for audits' },
  { req: 'Mobile app for field officers', state: 'LIVE', today: 'Installable web app, opens offline, drafts auto-saved, results sync when back online', next: 'Background sync, Android packaging' },
  { req: 'Central database across devices', state: 'PLANNED', today: 'Records are kept in each browser. Signed QR checks already work across devices', next: 'Supabase Postgres with row-level security per State and district' },
];

const ICON: Record<State, React.ReactNode> = {
  LIVE: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  PARTIAL: <CircleDashed className="w-4 h-4 text-amber-600" />,
  PLANNED: <Clock className="w-4 h-4 text-slate-500" />,
};
const LABEL: Record<State, string> = { LIVE: 'Working', PARTIAL: 'Partly', PLANNED: 'Planned' };

export const StatusPage: React.FC = () => {
  const [health, setHealth] = useState<null | { signing: boolean; ai: boolean; email: boolean; sms: boolean; kid: string }>(null);
  const [healthError, setHealthError] = useState(false);
  useEffect(() => {
    fetch('/api/health')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setHealth({ signing: d.signing?.configured, kid: d.signing?.kid, ai: d.ai?.configured, email: d.email?.configured, sms: d.sms?.configured }))
      .catch(() => setHealthError(true));
  }, []);

  const svc = (name: string, on?: boolean) => (
    <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-white text-sm">
      <span className="font-semibold text-slate-800">{name}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded ${healthError ? 'bg-slate-100 text-slate-500' : on === undefined ? 'bg-slate-100 text-slate-500' : on ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
        {healthError ? 'unknown' : on === undefined ? 'checking' : on ? 'on' : 'not set up'}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" aria-label="TULA home"><TulaLogo variant="full" theme="light" size="sm" /></Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-100 font-semibold text-slate-700"><Home className="w-4 h-4" /><span className="hidden sm:inline">Home</span></Link>
            <Link to="/demo" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gov-800 text-white font-semibold"><PlayCircle className="w-4 h-4" /> Live demo</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">What works today, and what is planned</h1>
          <p className="text-sm text-slate-600 mt-1">Mapped to every requirement in SIH problem statement 26036. "Working" means you can do it in the live prototype right now.</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Server services on this deployment (live check)</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {svc('Certificate signing', health?.signing)}
            {svc('AI assistant (Gemini)', health?.ai)}
            {svc('Email (Resend)', health?.email)}
            {svc('SMS (Twilio)', health?.sms)}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.2fr_0.5fr_2fr_1.6fr] gap-3 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold">
            <span>Requirement</span><span>Status</span><span>In the prototype</span><span>Pilot build</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {ROWS.map(r => (
              <li key={r.req} className="grid grid-cols-1 md:grid-cols-[1.2fr_0.5fr_2fr_1.6fr] gap-1 md:gap-3 px-4 py-3 text-sm">
                <span className="font-bold text-slate-900">{r.req}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold">{ICON[r.state]} {LABEL[r.state]}</span>
                <span className="text-slate-700">{r.today}</span>
                <span className="text-slate-500">{r.next}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-gov-700" /> Why a QR cannot be faked</h2>
            <p className="text-slate-600">The issuing server signs the certificate details with a private key that never leaves the server. The QR carries those details and the signature. Any phone checks it with the public key built into TULA. Change one letter and the check fails. Copying a genuine QR onto another instrument shows the real instrument's serial number, so the mismatch is visible. Revoked certificates are on a published list.</p>
          </section>
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><WifiOff className="w-5 h-5 text-gov-700" /> Offline field work</h2>
            <p className="text-slate-600">The app installs on the officer's phone and opens with no network. Drafts save as the officer types. A finished inspection is stored on the phone, and the certificate is issued and signed automatically when the phone reconnects. The citizen QR check also works offline.</p>
          </section>
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><Map className="w-5 h-5 text-gov-700" /> Different States</h2>
            <p className="text-slate-600">Fees and validity periods are data, stored per State. A State joins by loading its schedule and officer list, with no code change. Officers only see their own State's work. Certificate numbers carry the State code (DL, GJ). Demo: the same weighbridge costs ₹4,500 by default and ₹3,900 under the Gujarat demo schedule.</p>
          </section>
        </div>

        <p className="text-xs text-slate-500">Fee amounts and validity periods in the prototype are demo values. Each State replaces them with its gazetted schedule in the Rules screen.</p>
      </main>
    </div>
  );
};
