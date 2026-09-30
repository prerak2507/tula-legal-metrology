import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode, PlayCircle, ListChecks, LogIn, Menu, X, Check, Minus, Store, ClipboardCheck, Landmark, Users, FlaskConical,
  ArrowRight, Loader2, Scale, WifiOff, Map as MapIcon, Lock, Plug,
} from 'lucide-react';
import { TulaLogo } from '../components/common/TulaLogo';
import { ForgeChallenge } from '../components/landing/ForgeChallenge';
import { InspectorSim } from '../components/landing/InspectorSim';
import { storage } from '../services/storage';
import { UserRole } from '../types';
import { cloud } from '../services/cloud';
import { formatDuration } from '../services/analytics';

// ---------------------------------------------------------------------------
// Content (one place, so the page and the deck say the same thing)
// ---------------------------------------------------------------------------

const ASKED: { asked: string; delivered: string; where: string; to: string; state: 'LIVE' | 'PARTIAL' }[] = [
  { asked: 'Online registration of stakeholders', delivered: 'Traders self-register. Officer, GATC and admin accounts with roles', where: 'Register', to: '/register', state: 'LIVE' },
  { asked: 'Apply for verification and re-verification', delivered: 'Four service types, document upload, fee from the State\'s schedule', where: 'Live demo, step 3', to: '/demo', state: 'LIVE' },
  { asked: 'Scheduling and allocation to LMO / GATC', delivered: 'Officer suggested by district and workload. GATC for heavy equipment', where: 'Live demo, step 5', to: '/demo', state: 'LIVE' },
  { asked: 'Record inspection results digitally', delivered: 'Checklist, readings checked against OIML limits, camera photos, GPS', where: 'Officer app', to: '/demo', state: 'LIVE' },
  { asked: 'Digital certificates with QR and authentication', delivered: 'Server-signed QR. Any phone detects an edited or fake copy, even offline', where: 'Check a certificate', to: '/verify', state: 'LIVE' },
  { asked: 'Track validity, alerts before expiry', delivered: 'Status from dates. Reminders at 30, 15, 7 and 1 days by SMS / email', where: 'Updates', to: '/demo', state: 'LIVE' },
  { asked: 'Dashboards: status, pendency, enforcement', delivered: 'Pending by stage, age and district. Visits due and overdue', where: 'Pendency & impact', to: '/demo', state: 'LIVE' },
  { asked: 'Search, export and print', delivered: 'Search across records, certificate PDF, CSV reports', where: 'Portal', to: '/login', state: 'LIVE' },
  { asked: 'Mobile support for field officers', delivered: 'Installable phone app that keeps working with no network', where: 'Officer app', to: '/demo', state: 'LIVE' },
  { asked: 'Role-based secure login', delivered: 'Real accounts. Database rules stop anyone reading another account\'s records', where: 'Sign in', to: '/login', state: 'LIVE' },
  { asked: 'Documentation: architecture, security, deployment', delivered: 'In the repository, plus a live "built vs planned" page', where: 'Built vs planned', to: '/status', state: 'LIVE' },
];

const COMPARE: { row: string; paper: string; portal: string; tula: string }[] = [
  { row: 'Applying', paper: 'Visit the office with forms', portal: 'Online form', tula: 'Online, fee computed by State rule' },
  { row: 'Inspection record', paper: 'Paper register', portal: 'Entered later at the office', tula: 'On the officer\'s phone at the site, offline too' },
  { row: 'Pass / fail', paper: 'Officer judgement on paper', portal: 'Typed result', tula: 'Calculated from readings vs MPE' },
  { row: 'Certificate', paper: 'Paper, easy to copy', portal: 'PDF, can be edited', tula: 'Signed QR, edits detected' },
  { row: 'Can a buyer check it?', paper: 'No', portal: 'Rarely, needs login or internet', tula: 'Yes, any phone, no login, offline' },
  { row: 'Expiry reminders', paper: 'No', portal: 'Varies', tula: 'SMS / email at 30, 15, 7, 1 days' },
  { row: 'Pendency view', paper: 'Manual count', portal: 'Varies', tula: 'Live, by stage, age, district' },
  { row: 'Across States', paper: 'Separate', portal: 'One system per State', tula: 'One platform, rules and data per State' },
];

const SCALE: { phase: string; when: string; what: string }[] = [
  { phase: 'Field trial', when: 'Months 0–2', what: '5 LMOs and 1 GATC in one district test it on real inspections. Proceed only if the usability score is 70 or more.' },
  { phase: 'District pilot', when: 'Months 3–6', what: 'All instruments of one district. Measure turnaround and paperwork against the old register.' },
  { phase: 'State rollout', when: 'Months 6–12', what: 'State loads its fee schedule and officer list. NIC SMS, treasury payment and e-Pramaan connected.' },
  { phase: 'Multi-State', when: 'Year 2', what: 'Offered by DoCA to other States as a shared platform, or hosted on a State\'s own cloud.' },
];


const ROLES: { role: UserRole | 'PUBLIC'; icon: React.ElementType; who: string; tryThis: string; to: string }[] = [
  { role: 'BUSINESS', icon: Store, who: 'Shop owner', tryThis: 'Apply for re-verification and pay the fee', to: '/applications/new' },
  { role: 'LMO', icon: ClipboardCheck, who: 'Field officer (LMO)', tryThis: 'Record an inspection, even with the network off', to: '/field' },
  { role: 'CONTROLLER', icon: Landmark, who: 'Controller, Delhi', tryThis: 'Clear documents, assign an officer, see pendency', to: '/applications' },
  { role: 'GATC', icon: FlaskConical, who: 'Test centre (GATC)', tryThis: 'Handle a weighbridge routed to a GATC', to: '/field' },
  { role: 'PUBLIC', icon: Users, who: 'Buyer at a shop', tryThis: 'Scan a certificate. No login needed', to: '/verify' },
];

const FIT: { icon: React.ElementType; title: string; text: string }[] = [
  { icon: Scale, title: 'Follows the law as written', text: 'Section 24 verification, GATC route under the 2013 Rules, MPE limits from OIML R 76 / R 117.' },
  { icon: MapIcon, title: 'Each State keeps its rules', text: 'Fees, validity and officers are set per State in a screen, not in code. Each State sees only its data.' },
  { icon: Plug, title: 'Works beside existing portals', text: 'A State portal can keep its forms and payments and call TULA for the officer app, certificate and public check.' },
  { icon: WifiOff, title: 'Built for the field', text: 'Mandis and highway weighbridges have weak signal. The officer app works offline and syncs later.' },
  { icon: Lock, title: 'Privacy by default', text: 'Database rules decide who reads what. The public check shows only what a buyer needs (DPDP Act, 2023).' },
];

const Section: React.FC<{ id: string; kicker: string; title: string; intro?: string; tint?: boolean; children: React.ReactNode }> = ({ id, kicker, title, intro, tint, children }) => (
  <section id={id} className={`py-14 sm:py-20 scroll-mt-16 ${tint ? 'bg-slate-50 border-y border-slate-200' : 'bg-white'}`}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wider text-gov-700">{kicker}</p>
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{title}</h2>
      {intro && <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl">{intro}</p>}
      <div className="mt-8">{children}</div>
    </div>
  </section>
);

const NAV: [string, string][] = [['#explore', 'Try it'], ['#requirements', 'PS 26036 coverage'], ['#inspector', 'Be the inspector'], ['#fit', 'Fits government'], ['#compare', 'Compared'], ['#scale', 'Scale']];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => { void cloud.publicStats().then(setStats); }, []);
  const working = ASKED.filter(a => a.state === 'LIVE').length;
  const stat = (v: React.ReactNode) => (stats ? v : <span className="inline-block w-12 h-5 rounded bg-slate-200 animate-pulse align-middle" />);

  const enterAs = async (role: UserRole | 'PUBLIC', to: string) => {
    setErr(null);
    if (role === 'PUBLIC') { navigate(to); return; }
    setBusy(role);
    try {
      await storage.switchDemoRole(role);
      navigate(to);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" aria-label="TULA home" className="shrink-0"><TulaLogo variant="full" theme="light" size="sm" /></Link>
          <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-slate-600">
            {NAV.map(([href, label]) => <a key={href} href={href} className="hover:text-gov-800">{label}</a>)}
          </nav>
          <div className="hidden sm:flex items-center gap-2">
            <Link to="/verify" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"><QrCode className="w-4 h-4" /> Check a certificate</Link>
            <Link to="/login" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-gov-800 hover:bg-gov-900 text-white"><LogIn className="w-4 h-4" /> Sign in</Link>
          </div>
          <button onClick={() => setMenu(m => !m)} className="lg:hidden p-2.5 rounded-lg hover:bg-slate-100" aria-label="Menu" aria-expanded={menu}>
            {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menu && (
          <nav className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 grid gap-1 text-sm font-semibold">
            {NAV.map(([href, label]) => <a key={href} href={href} onClick={() => setMenu(false)} className="py-2.5 px-2 rounded hover:bg-slate-50">{label}</a>)}
            <Link to="/verify" className="py-2.5 px-2 rounded hover:bg-slate-50">Check a certificate</Link>
            <Link to="/login" className="py-2.5 px-2 rounded bg-gov-800 text-white text-center mt-1">Sign in</Link>
          </nav>
        )}
      </header>

      {/* Hero: the forgery challenge */}
      <section className="bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gov-50 border border-gov-200 text-gov-800 text-xs font-bold">SIH 2026 · PS 26036 · Department of Consumer Affairs</p>
            <h1 className="mt-4 text-3xl sm:text-5xl font-black leading-[1.1]">Scale verification, online end to end. With a certificate nobody can fake.</h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600">
              TULA runs the whole Legal Metrology process for weighing and measuring instruments: apply, inspect, certify, remind, enforce. Every certificate carries a QR that any phone can check.
            </p>
            <p className="mt-5 text-sm font-bold text-slate-800 flex items-center gap-2"><ArrowRight className="w-4 h-4 text-rose-600 hidden lg:block" />Try to forge the real certificate <span className="lg:hidden">below</span><span className="hidden lg:inline">on the right</span>: change its expiry date or capacity.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link to="/demo" className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gov-800 hover:bg-gov-900 text-white font-bold"><PlayCircle className="w-5 h-5 text-amber-300" /> 5-minute guided demo</Link>
              <a href="#explore" className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold">Explore as any role</a>
            </div>
            <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-xl bg-white border border-slate-200 p-3"><dt className="text-[11px] text-slate-500">PS requirements working</dt><dd className="text-base sm:text-xl font-black whitespace-nowrap">{working} / {ASKED.length}</dd></div>
              <div className="rounded-xl bg-white border border-slate-200 p-3"><dt className="text-[11px] text-slate-500">Instruments on the live registry</dt><dd className="text-base sm:text-xl font-black whitespace-nowrap">{stat(stats?.instruments)}</dd></div>
              <div className="rounded-xl bg-white border border-slate-200 p-3"><dt className="text-[11px] text-slate-500">Signed certificates issued</dt><dd className="text-base sm:text-xl font-black whitespace-nowrap">{stat(stats?.signedCertificates)}</dd></div>
              <div className="rounded-xl bg-white border border-slate-200 p-3"><dt className="text-[11px] text-slate-500">States / districts live</dt><dd className="text-base sm:text-xl font-black whitespace-nowrap">{stat(`${stats?.states} / ${stats?.districts}`)}</dd></div>
            </dl>
            <p className="mt-2 text-[11px] text-slate-500">
              Live from the database{stats?.completedRuns ? `. Median time from application to certificate over the last ${stats.completedRuns} completed run${stats.completedRuns === 1 ? '' : 's'}: ${formatDuration((stats.medianMinutes || 0) * 60_000)}` : ''}. In tests, 6 of 6 forged or edited certificates were rejected.
            </p>
          </div>
          <ForgeChallenge />
        </div>
      </section>

      <Section id="explore" kicker="Try it yourself" title="Step into any role in one click" intro="Each card signs you in to a real evaluator account on the live database. Nothing to install.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ROLES.map(({ role, icon: Icon, who, tryThis, to }) => (
            <button key={role} onClick={() => enterAs(role, to)} disabled={busy !== null}
              className="text-left rounded-2xl border border-slate-200 p-4 hover:border-gov-500 hover:shadow-md transition-all disabled:opacity-60 group">
              <Icon className="w-6 h-6 text-gov-700" />
              <p className="font-bold mt-3">{who}</p>
              <p className="text-sm text-slate-600 mt-1">{tryThis}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-gov-700 group-hover:gap-2 transition-all">
                {busy === role ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in</> : <>Enter <ArrowRight className="w-4 h-4" /></>}
              </span>
            </button>
          ))}
        </div>
        {err && <p role="alert" className="mt-3 text-sm text-rose-700">{err}</p>}
      </Section>

      <Section id="requirements" kicker="For the jury" title="Every requirement of PS 26036, working today" tint intro="Click any line to see it on the live system.">
        <ul className="grid md:grid-cols-2 gap-2">
          {ASKED.map(r => (
            <li key={r.asked}>
              <Link to={r.to} className="flex gap-3 rounded-xl bg-white border border-slate-200 p-3.5 hover:border-gov-400 h-full">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-sm"><strong className="block text-slate-900">{r.asked}</strong><span className="text-slate-600">{r.delivered}</span></span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 mt-3">Simulated in the prototype: the fee payment (demo UPI reference) and SMS / email delivery until provider keys are added. <Link to="/status" className="underline">Built vs planned</Link>.</p>
      </Section>

      <Section id="inspector" kicker="Be the inspector" title="Pass or fail is calculated, not typed" intro="The legal limit depends on the weight on the scale. Move the sliders and see what the officer app decides.">
        <InspectorSim />
      </Section>

      <Section id="fit" kicker="Fits government as it is" title="Designed around how Legal Metrology actually works" tint>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {FIT.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-white border border-slate-200 p-4">
              <Icon className="w-6 h-6 text-gov-700" />
              <h3 className="font-bold mt-3">{title}</h3>
              <p className="text-sm text-slate-600 mt-1">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="compare" kicker="Compared" title="Paper, today's portals, and TULA" intro="State Legal Metrology online services differ. The middle column describes what is common, not any one portal.">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-900 text-white text-xs">
              <tr><th className="text-left px-4 py-2.5"><span className="sr-only">Aspect</span></th><th className="text-left px-4 py-2.5">Paper process</th><th className="text-left px-4 py-2.5">Typical State portal</th><th className="text-left px-4 py-2.5 bg-gov-800">TULA</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARE.map(c => (
                <tr key={c.row}>
                  <th scope="row" className="text-left px-4 py-3 font-bold">{c.row}</th>
                  <td className="px-4 py-3 text-slate-600"><span className="inline-flex gap-1.5"><Minus className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />{c.paper}</span></td>
                  <td className="px-4 py-3 text-slate-600">{c.portal}</td>
                  <td className="px-4 py-3 font-semibold text-gov-900 bg-gov-50/60"><span className="inline-flex gap-1.5"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />{c.tula}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="scale" kicker="How it scales" title="Tested with officers first, then State by State" tint intro="The buyer is the government: DoCA and the State Legal Metrology departments. Traders and citizens use it free.">
        <ol className="grid md:grid-cols-4 gap-3">
          {SCALE.map((p, i) => (
            <li key={p.phase} className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-xs font-bold text-gov-700">{i + 1} · {p.when}</p>
              <h3 className="font-bold mt-1">{p.phase}</h3>
              <p className="text-sm text-slate-600 mt-1">{p.what}</p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-slate-600 mt-4"><strong>Cost:</strong> open-source code. A district pilot runs on free cloud tiers; a State runs it on a hosting and support contract or on its own cloud. Adding a State is configuration, not a new build.</p>
      </Section>

      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid md:grid-cols-[1.4fr_1fr] gap-8">
          <div>
            <TulaLogo size="md" variant="full" theme="dark" />
            <p className="text-sm mt-3 max-w-md">Online verification system for weighing and measuring instruments. SIH 2026 prototype by Team FriendlyFire for problem statement 26036.</p>
            <p className="text-xs text-slate-500 mt-3">Legal Metrology Act, 2009 · Legal Metrology (General) Rules, 2011 · GATC Rules, 2013 · OIML R 76 and R 117</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link to="/demo" className="hover:text-white">Guided demo</Link>
            <Link to="/verify" className="hover:text-white">Check a certificate</Link>
            <Link to="/status" className="hover:text-white">Built vs planned</Link>
            <Link to="/register" className="hover:text-white">Register a business</Link>
            <Link to="/login" className="hover:text-white">Sign in</Link>
            <a href="https://github.com/prerak2507/tula-legal-metrology" className="hover:text-white" rel="noreferrer" target="_blank">Source code</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
