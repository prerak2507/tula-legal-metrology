import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, WifiOff, Calculator, Map, Sparkles, QrCode, PlayCircle, ListChecks, LogIn, Menu, X, Check, Minus,
  Store, ClipboardCheck, Landmark, Users, ArrowRight, CircleDashed,
} from 'lucide-react';
import { TulaLogo } from '../components/common/TulaLogo';

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

const STEPS = ['Register', 'Apply', 'Scrutiny', 'Assign', 'Inspect', 'Decide', 'Certificate', 'Verify'];
const STEP_NOTES = ['account + Digital ID', 'docs, fee', 'officer checks', 'district + load', 'phone, offline', 'computed vs MPE', 'signed QR', 'any phone'];

const NEW: { icon: React.ElementType; title: string; text: string }[] = [
  { icon: ShieldCheck, title: 'A QR that cannot be faked', text: 'The server signs the certificate. The QR carries the details and the signature, so any phone can tell a real certificate from an edited one without logging in or going online.' },
  { icon: WifiOff, title: 'Works where the network does not', text: 'Officers inspect at mandis and highway weighbridges with no signal. Work saves on the phone and is issued, signed and sent automatically once back online.' },
  { icon: Calculator, title: 'Pass or fail is calculated', text: 'The officer types what the scale shows. TULA computes the error and the legal limit. A certificate cannot be issued while any reading is out of limit.' },
  { icon: Map, title: 'One system, every State\'s rules', text: 'Fees, validity periods and officers are data per State. A new State joins without code changes, and sees only its own records.' },
  { icon: Sparkles, title: 'AI that assists, never decides', text: 'Gemini flags odd documents and answers traders in Hindi, Gujarati or English. It never approves, prices or passes anything.' },
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

const WHO: { icon: React.ElementType; who: string; gets: string[] }[] = [
  { icon: Store, who: 'Traders and MSMEs', gets: ['Apply and pay without a visit', 'An update at every step', 'A reminder before the stamp lapses'] },
  { icon: ClipboardCheck, who: 'LMOs and GATCs', gets: ['Today\'s jobs on the phone', 'Verdict calculated, no maths errors', 'Certificate issued at the site'] },
  { icon: Landmark, who: 'Controllers and DoCA', gets: ['Pendency by district, live', 'Every action in an audit trail', 'Rules updated without IT'] },
  { icon: Users, who: 'Buyers and consumers', gets: ['Check any scale or pump in seconds', 'Fakes are shown as fakes', 'Report a problem in two taps'] },
];

const SCALE: { phase: string; when: string; what: string }[] = [
  { phase: 'Field trial', when: 'Months 0–2', what: '5 LMOs and 1 GATC in one district test it on real inspections. Proceed only if the usability score is 70 or more.' },
  { phase: 'District pilot', when: 'Months 3–6', what: 'All instruments of one district. Measure turnaround and paperwork against the old register.' },
  { phase: 'State rollout', when: 'Months 6–12', what: 'State loads its fee schedule and officer list. NIC SMS, treasury payment and e-Pramaan connected.' },
  { phase: 'Multi-State', when: 'Year 2', what: 'Offered by DoCA to other States as a shared platform, or hosted on a State\'s own cloud.' },
];

// ---------------------------------------------------------------------------

const NAV = [['#asked', 'Asked vs delivered'], ['#new', 'What is new'], ['#compare', 'Compared'], ['#who', 'Who it helps'], ['#scale', 'How it scales']];

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

export const LandingPage: React.FC = () => {
  const [menu, setMenu] = useState(false);

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

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gov-50 border border-gov-200 text-gov-800 text-xs font-bold">SIH 2026 · Problem statement 26036 · Ministry of Consumer Affairs</p>
            <h1 className="mt-4 text-3xl sm:text-5xl font-black leading-tight">Verify every scale, pump and meter online, and let anyone check the certificate.</h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl">
              TULA gives each weighing and measuring instrument one Digital ID. Application, inspection, certificate, reminders and enforcement all attach to it. Working prototype on a live database.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link to="/demo" className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gov-800 hover:bg-gov-900 text-white font-bold"><PlayCircle className="w-5 h-5 text-amber-300" /> Run the live demo</Link>
              <Link to="/verify" className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold"><QrCode className="w-5 h-5" /> Check a certificate</Link>
              <Link to="/status" className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold"><ListChecks className="w-5 h-5" /> Built vs planned</Link>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-900 text-white p-6 shadow-xl">
            <p className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold">Real certificate on the live system</p>
            <p className="font-mono text-xl font-bold mt-1">DL/LM/2026/08912</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-400 text-xs">Instrument</dt><dd>Platform scale, 150 kg</dd></div>
              <div><dt className="text-slate-400 text-xs">Class</dt><dd>III, e = 20 g</dd></div>
              <div><dt className="text-slate-400 text-xs">Test at 150 kg</dt><dd>+8 g</dd></div>
              <div><dt className="text-slate-400 text-xs">Legal limit</dt><dd>±30 g (OIML R 76)</dd></div>
            </dl>
            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-white/10 p-3">
              <span className="text-sm flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> ECDSA-signed</span>
              <Link to="/verify/CERT-2026-08912" className="inline-flex items-center gap-1 text-sm font-bold text-emerald-300 hover:text-emerald-200">Check it <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      <Section id="asked" kicker="For the jury" title="What the problem statement asks, and what TULA delivers" intro="Every requirement in PS 26036, what we built for it, and where to see it working.">
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.1fr_1.6fr_0.8fr] bg-slate-900 text-white text-xs font-bold px-4 py-2.5 gap-4">
            <span>Asked</span><span>Delivered</span><span>See it</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {ASKED.map(r => (
              <li key={r.asked} className="grid md:grid-cols-[1.1fr_1.6fr_0.8fr] gap-1 md:gap-4 px-4 py-3 text-sm">
                <span className="font-bold text-slate-900">{r.asked}</span>
                <span className="text-slate-700 flex gap-2">{r.state === 'LIVE' ? <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <CircleDashed className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}{r.delivered}</span>
                <Link to={r.to} className="text-gov-700 font-semibold hover:underline">{r.where} →</Link>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-500 mt-3">Simulated in the prototype: the fee payment (demo UPI reference) and SMS / email delivery until provider keys are added. Details on <Link to="/status" className="underline">built vs planned</Link>.</p>
      </Section>

      <Section id="how" kicker="How it works" title="One instrument, one Digital ID, one flow" tint>
        <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="rounded-xl bg-white border border-slate-200 p-3">
              <span className="w-7 h-7 rounded-full bg-gov-800 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <p className="font-bold text-sm mt-2">{s}</p>
              <p className="text-xs text-slate-500">{STEP_NOTES[i]}</p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-slate-600 mt-4">When the certificate nears expiry, the owner is reminded and re-verification starts again on the same Digital ID, so the full history stays in one place.</p>
      </Section>

      <Section id="new" kicker="What is new" title="Five things that set TULA apart">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NEW.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-slate-200 p-5">
              <Icon className="w-6 h-6 text-gov-700" />
              <h3 className="font-bold mt-3">{title}</h3>
              <p className="text-sm text-slate-600 mt-1">{text}</p>
            </div>
          ))}
          <Link to="/verify" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white p-5 flex flex-col justify-between">
            <QrCode className="w-6 h-6" />
            <span className="font-bold mt-3">Try it: check a genuine certificate, then an edited copy</span>
            <span className="text-sm mt-2 inline-flex items-center gap-1">Open the check page <ArrowRight className="w-4 h-4" /></span>
          </Link>
        </div>
      </Section>

      <Section id="compare" kicker="Compared" title="How it is done today, and what TULA changes" tint intro="State Legal Metrology online services differ from State to State. The middle column describes what is common, not any one portal.">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-900 text-white text-xs">
              <tr><th className="text-left px-4 py-2.5"> </th><th className="text-left px-4 py-2.5">Paper process</th><th className="text-left px-4 py-2.5">Typical State portal</th><th className="text-left px-4 py-2.5 bg-gov-800">TULA</th></tr>
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
        <p className="text-sm text-slate-600 mt-4"><strong>Works with what States already have:</strong> TULA can sit behind an existing State portal. The portal keeps its forms and payments, and TULA adds the officer app, the signed certificate and the public check through its API.</p>
      </Section>

      <Section id="who" kicker="Who it helps" title="Four groups, each with a concrete gain">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHO.map(({ icon: Icon, who, gets }) => (
            <div key={who} className="rounded-xl border border-slate-200 p-5">
              <Icon className="w-6 h-6 text-gov-700" />
              <h3 className="font-bold mt-3">{who}</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                {gets.map(g => <li key={g} className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />{g}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="scale" kicker="How it scales" title="From one district to every State" tint intro="Adoption is led by the government customer: DoCA and State Legal Metrology departments. Traders and buyers use it free.">
        <ol className="grid md:grid-cols-4 gap-4">
          {SCALE.map((p, i) => (
            <li key={p.phase} className="rounded-xl bg-white border border-slate-200 p-5">
              <p className="text-xs font-bold text-gov-700">{i + 1} · {p.when}</p>
              <h3 className="font-bold mt-1">{p.phase}</h3>
              <p className="text-sm text-slate-600 mt-1">{p.what}</p>
            </li>
          ))}
        </ol>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div className="rounded-xl bg-white border border-slate-200 p-5 text-sm"><h3 className="font-bold">Why it scales technically</h3><p className="text-slate-600 mt-1">Each State's data is isolated by database rules, rules are data, and the servers are pay-per-use. Adding a State is configuration, not a new build.</p></div>
          <div className="rounded-xl bg-white border border-slate-200 p-5 text-sm"><h3 className="font-bold">Cost model</h3><p className="text-slate-600 mt-1">Open-source code. A district pilot runs on free cloud tiers. At State scale: a yearly hosting and support contract, or self-hosting on the State's own cloud.</p></div>
          <div className="rounded-xl bg-white border border-slate-200 p-5 text-sm"><h3 className="font-bold">How we will measure it</h3><p className="text-slate-600 mt-1">Pilot targets: 7 days or less from application to certificate, a QR check in under 3 seconds, and every due instrument reminded 30 days early, all measured against the district's paper register.</p></div>
        </div>
      </Section>

      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid md:grid-cols-[1.4fr_1fr] gap-8">
          <div>
            <TulaLogo size="md" variant="full" theme="dark" />
            <p className="text-sm mt-3 max-w-md">Online verification system for weighing and measuring instruments. SIH 2026 prototype by Team FriendlyFire for problem statement 26036.</p>
            <p className="text-xs text-slate-500 mt-3">Legal Metrology Act, 2009 · Legal Metrology (General) Rules, 2011 · GATC Rules, 2013 · OIML R 76 and R 117</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link to="/demo" className="hover:text-white">Live demo</Link>
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
