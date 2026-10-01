import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode, PlayCircle, LogIn, Menu, X, Check, Minus, Store, ClipboardCheck, Landmark, Users, FlaskConical,
  ArrowRight, ArrowUpRight, Loader2, Scale, WifiOff, Map as MapIcon, Lock, Plug,
} from 'lucide-react';
import { TulaLogo } from '../components/common/TulaLogo';
import { ForgeChallenge } from '../components/landing/ForgeChallenge';
import { InspectorSim } from '../components/landing/InspectorSim';
import { GuillocheBand } from '../components/landing/Guilloche';
import { GovBar } from '../components/layout/GovBar';
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


const ROLES: { role: UserRole | 'PUBLIC'; code: string; icon: React.ElementType; who: string; tryThis: string; to: string }[] = [
  { role: 'BUSINESS', code: 'BUS', icon: Store, who: 'Shop owner', tryThis: 'Apply for re-verification and pay the fee', to: '/applications/new' },
  { role: 'LMO', code: 'LMO', icon: ClipboardCheck, who: 'Field officer (LMO)', tryThis: 'Record an inspection, even with the network off', to: '/field' },
  { role: 'CONTROLLER', code: 'CTRL', icon: Landmark, who: 'Controller, Delhi', tryThis: 'Clear documents, assign an officer, see pendency', to: '/applications' },
  { role: 'GATC', code: 'GATC', icon: FlaskConical, who: 'Test centre (GATC)', tryThis: 'Handle a weighbridge routed to a GATC', to: '/field' },
  { role: 'PUBLIC', code: 'PUBLIC', icon: Users, who: 'Buyer at a shop', tryThis: 'Scan a certificate. No login needed', to: '/verify' },
];

const FIT: { icon: React.ElementType; title: string; text: string }[] = [
  { icon: Scale, title: 'Follows the law as written', text: 'Section 24 verification, GATC route under the 2013 Rules, MPE limits from OIML R 76 / R 117.' },
  { icon: MapIcon, title: 'Each State keeps its rules', text: 'Fees, validity and officers are set per State in a screen, not in code. Each State sees only its data.' },
  { icon: Plug, title: 'Works beside existing portals', text: 'A State portal can keep its forms and payments and call TULA for the officer app, certificate and public check.' },
  { icon: WifiOff, title: 'Built for the field', text: 'Mandis and highway weighbridges have weak signal. The officer app works offline and syncs later.' },
  { icon: Lock, title: 'Privacy by default', text: 'Database rules decide who reads what. The public check shows only what a buyer needs (DPDP Act, 2023).' },
];

const Section: React.FC<{ id: string; no: string; kicker: string; title: string; intro?: string; tint?: boolean; children: React.ReactNode }> = ({ id, no, kicker, title, intro, tint, children }) => (
  <section id={id} className={`py-16 sm:py-24 scroll-mt-16 ${tint ? 'bg-paper-100' : 'paper-grain'}`}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="grid lg:grid-cols-[3fr_2fr] gap-4 lg:gap-12 items-end">
        <div>
          <p className="font-readout text-xs text-brass-700 tracking-[0.18em] uppercase">§ {no} · {kicker}</p>
          <h2 className="font-display text-3xl sm:text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-ink mt-3">{title}</h2>
        </div>
        {intro && <p className="text-base text-ink-600 max-w-2xl lg:pb-1">{intro}</p>}
      </div>
      <div className="ruler text-brass/50 mt-6" aria-hidden="true" />
      <div className="mt-10">{children}</div>
    </div>
  </section>
);

const NAV: [string, string][] = [['#explore', 'Try it'], ['#requirements', 'Coverage'], ['#inspector', 'Be the inspector'], ['#fit', 'Fits government'], ['#compare', 'Compared'], ['#scale', 'Scale']];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => { void cloud.publicStats().then(setStats); }, []);
  const working = ASKED.filter(a => a.state === 'LIVE').length;
  const stat = (v: React.ReactNode) => (stats ? v : <span className="inline-block w-12 h-6 rounded bg-paper/15 animate-pulse align-middle" />);

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
    <div className="min-h-screen w-full bg-paper text-ink font-plex">
      <GovBar />
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-paper-300">
        <div className="h-[3px] w-full flex" aria-hidden="true"><span className="flex-1 bg-[#FF9933]" /><span className="flex-1 bg-white" /><span className="flex-1 bg-[#138808]" /></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" aria-label="TULA home" className="shrink-0"><TulaLogo variant="full" theme="light" size="sm" /></Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-ink-600">
            {NAV.map(([href, label]) => <a key={href} href={href} className="hover:text-ink transition-colors">{label}</a>)}
          </nav>
          <div className="hidden sm:flex items-center gap-2">
            <Link to="/verify" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold text-ink hover:bg-paper-200 min-h-[44px]"><QrCode className="w-4 h-4" /> Check a certificate</Link>
            <Link to="/login" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold bg-ink hover:bg-ink-800 text-paper min-h-[44px]"><LogIn className="w-4 h-4" /> Sign in</Link>
          </div>
          <button onClick={() => setMenu(m => !m)} className="lg:hidden p-2.5 rounded-md hover:bg-paper-200" aria-label="Menu" aria-expanded={menu}>
            {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menu && (
          <nav className="lg:hidden border-t border-paper-300 bg-paper px-4 py-3 grid gap-1 text-sm font-medium">
            {NAV.map(([href, label]) => <a key={href} href={href} onClick={() => setMenu(false)} className="py-2.5 px-2 rounded hover:bg-paper-200">{label}</a>)}
            <Link to="/verify" className="py-2.5 px-2 rounded hover:bg-paper-200">Check a certificate</Link>
            <Link to="/login" className="py-2.5 px-2 rounded bg-ink text-paper text-center mt-1">Sign in</Link>
          </nav>
        )}
      </header>

      {/* Hero: the forgery challenge */}
      <section id="main" className="relative bg-ink text-paper overflow-hidden">
        <GuillocheBand className="absolute inset-x-0 top-10 w-full h-[70%] text-brass/20" lines={22} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(226,194,127,0.12),transparent_55%)]" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-14 sm:pt-20 sm:pb-20 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-14 items-center">
          <div>
            <p className="font-readout text-[11px] sm:text-xs tracking-[0.18em] uppercase text-brass-300">SIH 2026 · PS 26036 · Dept. of Consumer Affairs</p>
            <h1 className="font-display mt-5 text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.1rem] font-semibold tracking-tight">
              Scale verification, online end to end.
              <span className="block italic font-normal text-brass-300 mt-2">With a certificate nobody can fake.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-paper/75 max-w-xl">
              TULA runs the whole Legal Metrology process for weighing and measuring instruments: apply, inspect, certify, remind, enforce. Every certificate carries a QR that any phone can check.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/demo" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-brass-300 hover:bg-brass-200 text-ink font-semibold min-h-[48px]"><PlayCircle className="w-5 h-5" /> 5-minute guided demo</Link>
              <a href="#explore" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md border border-paper/30 hover:bg-paper/10 font-semibold min-h-[48px]">Explore as any role <ArrowRight className="w-4 h-4" /></a>
            </div>

            <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 border-y border-paper/15 divide-x divide-paper/15">
              {[
                ['PS needs working', `${working}/${ASKED.length}`],
                ['Instruments live', stat(stats?.instruments)],
                ['Signed certificates', stat(stats?.signedCertificates)],
                ['States / districts', stat(`${stats?.states} / ${stats?.districts}`)],
              ].map(([k, v], i) => (
                <div key={String(k)} className={`py-4 px-3 sm:px-4 ${i === 2 ? 'border-t sm:border-t-0 border-paper/15' : ''} ${i === 3 ? 'border-t sm:border-t-0 border-paper/15' : ''}`}>
                  <dd className="font-readout text-2xl sm:text-[1.7rem] font-semibold text-paper tabular-nums whitespace-nowrap">{v}</dd>
                  <dt className="text-[11px] text-paper/60 mt-1">{k}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-paper/55">
              Live from the database{stats?.completedRuns ? `. Median application to certificate over the last ${stats.completedRuns} completed run${stats.completedRuns === 1 ? '' : 's'}: ${formatDuration((stats.medianMinutes || 0) * 60_000)}` : ''}. In tests, 6 of 6 forged or edited certificates were rejected.
            </p>
          </div>
          <ForgeChallenge />
        </div>
        <div className="ruler text-brass/40 relative" aria-hidden="true" />
      </section>

      <Section id="explore" no="01" kicker="Try it yourself" title="Step into any role in one click" intro="Each card signs you in to a real evaluator account on the live database. Nothing to install.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ROLES.map(({ role, code, icon: Icon, who, tryThis, to }) => (
            <button key={role} onClick={() => enterAs(role, to)} disabled={busy !== null}
              className="group text-left rounded-lg bg-paper-50 border border-paper-300 overflow-hidden hover:border-ink hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-12px_rgba(14,26,43,0.35)] transition-all disabled:opacity-60 flex flex-col">
              <span className="flex items-center justify-between bg-ink text-paper px-4 py-2.5">
                <span className="font-readout text-xs tracking-[0.16em] text-brass-300">{code}</span>
                <Icon className="w-4 h-4 text-paper/80" />
              </span>
              <span className="p-4 flex-1 flex flex-col">
                <span className="font-display text-lg font-semibold leading-tight">{who}</span>
                <span className="text-sm text-ink-600 mt-1.5 flex-1">{tryThis}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink group-hover:gap-2 transition-all">
                  {busy === role ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in</> : <>Enter <ArrowRight className="w-4 h-4" /></>}
                </span>
              </span>
            </button>
          ))}
        </div>
        {err && <p role="alert" className="mt-3 text-sm text-seal">{err}</p>}
      </Section>

      <Section id="requirements" no="02" kicker="For the jury" title="Every requirement of PS 26036, working today" tint intro="Each line opens the place on the live system where you can see it work.">
        <ol className="grid md:grid-cols-2 gap-x-10 border-t border-paper-300">
          {ASKED.map((r, i) => (
            <li key={r.asked} className="border-b border-paper-300">
              <Link to={r.to} className="group flex gap-4 py-4 hover:bg-paper-50 -mx-2 px-2 rounded transition-colors">
                <span className="font-readout text-sm text-brass-700 w-6 shrink-0 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1 text-sm">
                  <strong className="block font-semibold text-ink">{r.asked}</strong>
                  <span className="text-ink-600">{r.delivered}</span>
                </span>
                <span className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-verify-50 text-verify-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"><Check className="w-3 h-3" /> Live</span>
                  <ArrowUpRight className="w-4 h-4 text-ink-600 group-hover:text-ink" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="text-xs text-ink-600 mt-4">Simulated in the prototype: the fee payment (demo UPI reference) and SMS / email delivery until provider keys are added. <Link to="/status" className="underline font-semibold">Built vs planned</Link>.</p>
      </Section>

      <Section id="inspector" no="03" kicker="Be the inspector" title="Pass or fail is calculated, not typed" intro="The legal limit depends on the weight on the scale. Move the sliders and see what the officer app decides.">
        <InspectorSim />
      </Section>

      <Section id="fit" no="04" kicker="Fits government as it is" title="Built around how Legal Metrology works" tint>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-paper-300 border border-paper-300 rounded-lg overflow-hidden">
          {FIT.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="bg-paper-50 p-5">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-full border border-brass/50 text-brass-700 flex items-center justify-center"><Icon className="w-5 h-5" /></span>
                <span className="font-readout text-[11px] text-ink-600">CL. {String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="font-display text-lg font-semibold leading-snug mt-4">{title}</h3>
              <p className="text-sm text-ink-600 mt-2">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="compare" no="05" kicker="Compared" title="Paper, today's portals, and TULA" intro="State Legal Metrology online services differ. The middle column describes what is common, not any one portal.">
        <div className="overflow-x-auto rounded-lg border border-paper-300 bg-paper-50">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.14em]">
                <th className="px-4 py-3 font-semibold text-ink-600"><span className="sr-only">Aspect</span></th>
                <th className="px-4 py-3 font-semibold text-ink-600">Paper process</th>
                <th className="px-4 py-3 font-semibold text-ink-600">Typical State portal</th>
                <th className="px-4 py-3 font-semibold bg-ink text-brass-300">TULA</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(c => (
                <tr key={c.row} className="border-t border-paper-300">
                  <th scope="row" className="text-left px-4 py-3.5 font-semibold text-ink">{c.row}</th>
                  <td className="px-4 py-3.5 text-ink-600"><span className="inline-flex gap-1.5"><Minus className="w-4 h-4 text-paper-400 shrink-0 mt-0.5" />{c.paper}</span></td>
                  <td className="px-4 py-3.5 text-ink-600">{c.portal}</td>
                  <td className="px-4 py-3.5 font-semibold text-ink bg-brass-200/40 border-x border-brass/30"><span className="inline-flex gap-1.5"><Check className="w-4 h-4 text-verify shrink-0 mt-0.5" />{c.tula}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="scale" no="06" kicker="How it scales" title="Tested with officers first, then State by State" tint intro="The buyer is the government: DoCA and the State Legal Metrology departments. Traders and citizens use it free.">
        <ol className="relative grid md:grid-cols-4 gap-6 md:gap-4">
          <span className="hidden md:block absolute left-0 right-0 top-[11px] h-px bg-brass/50" aria-hidden="true" />
          {SCALE.map((p, i) => (
            <li key={p.phase} className="relative">
              <span className={`relative z-10 block w-[22px] h-[22px] rounded-full border-2 ${i === 0 ? 'bg-brass border-brass' : 'bg-paper-100 border-brass'}`} aria-hidden="true" />
              <p className="font-readout text-xs text-brass-700 mt-4 tracking-wider">{p.when}</p>
              <h3 className="font-display text-xl font-semibold mt-1">{p.phase}</h3>
              <p className="text-sm text-ink-600 mt-2">{p.what}</p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-ink-600 mt-10 max-w-3xl border-l-2 border-brass pl-4"><strong className="text-ink">Cost:</strong> no licence fee, and the source code is public. A district pilot runs on free cloud tiers. A State runs it on a hosting and support contract or on its own cloud. Adding a State is configuration, not a new build.</p>
      </Section>

      {/* Closing call */}
      <section className="bg-brass-300 text-ink">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="font-display text-2xl sm:text-3xl font-semibold leading-tight">Five minutes, start to finish.</p>
            <p className="text-ink-700 mt-1">Register, apply, inspect offline, sign, and scan the QR on your own phone.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/demo" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-ink hover:bg-ink-800 text-paper font-semibold min-h-[48px]"><PlayCircle className="w-5 h-5 text-brass-300" /> Start the guided demo</Link>
            <Link to="/verify" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md border border-ink/40 hover:bg-ink/5 font-semibold min-h-[48px]"><QrCode className="w-5 h-5" /> Check a certificate</Link>
          </div>
        </div>
      </section>

      <footer className="relative bg-ink-900 text-paper/70 overflow-hidden">
        <GuillocheBand className="absolute inset-x-0 -top-6 w-full h-40 text-brass/10" lines={14} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
            <div>
              <p className="flex items-baseline gap-3">
                <span className="font-display text-5xl font-semibold text-paper tracking-tight">TULA</span>
                <span lang="hi" className="font-plex text-2xl font-semibold text-brass-300">तुला</span>
              </p>
              <p className="font-readout text-[11px] uppercase tracking-[0.18em] text-paper/50 mt-1">the scale</p>
              <p className="text-sm mt-5 max-w-sm">Online verification, signed QR certificates and offline field inspection for weighing and measuring instruments.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/demo" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-brass-300 text-ink text-sm font-semibold hover:bg-brass-200 min-h-[44px]"><PlayCircle className="w-4 h-4" /> Guided demo</Link>
                <Link to="/verify" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-paper/25 text-paper text-sm font-semibold hover:bg-paper/10 min-h-[44px]"><QrCode className="w-4 h-4" /> Check a QR</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="font-readout text-[11px] uppercase tracking-[0.18em] text-brass-300">Use it</p>
                <ul className="mt-4 space-y-2.5">
                  <li><Link to="/demo" className="hover:text-paper">Guided demo</Link></li>
                  <li><Link to="/verify" className="hover:text-paper">Check a certificate</Link></li>
                  <li><Link to="/register" className="hover:text-paper">Register a business</Link></li>
                  <li><Link to="/login" className="hover:text-paper">Sign in</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-readout text-[11px] uppercase tracking-[0.18em] text-brass-300">For the jury</p>
                <ul className="mt-4 space-y-2.5">
                  <li><a href="#requirements" className="hover:text-paper">PS 26036 coverage</a></li>
                  <li><Link to="/status" className="hover:text-paper">Built vs planned</Link></li>
                  <li><Link to="/sources" className="hover:text-paper">Sources and data</Link></li>
                  <li><a href="#compare" className="hover:text-paper">Compared</a></li>
                  <li><a href="https://github.com/prerak2507/tula-legal-metrology" className="inline-flex items-center gap-1 hover:text-paper" rel="noreferrer" target="_blank">Source code <ArrowUpRight className="w-3.5 h-3.5" /></a></li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="font-readout text-[11px] uppercase tracking-[0.18em] text-brass-300">Legal basis</p>
                <ul className="mt-4 space-y-2.5 text-paper/60">
                  <li>Legal Metrology Act, 2009</li>
                  <li>General Rules, 2011</li>
                  <li>GATC Rules, 2013</li>
                  <li>OIML R 76 and R 117</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="ruler text-paper/15 mt-12" aria-hidden="true" />
          <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-paper/50">
            <p>Smart India Hackathon 2026 · Problem statement 26036 · Team FriendlyFire</p>
            <p>A student prototype. Not an official Government of India website.</p>
          </div>
        </div>
        <div className="h-[3px] w-full flex" aria-hidden="true"><span className="flex-1 bg-[#FF9933]" /><span className="flex-1 bg-white" /><span className="flex-1 bg-[#138808]" /></div>
      </footer>
    </div>
  );
};
