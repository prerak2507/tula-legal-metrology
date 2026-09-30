import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storage } from '../services/storage';
import { latestRun, formatDuration } from '../services/analytics';
import { TulaLogo } from '../components/common/TulaLogo';
import { CheckCircle2, Circle, Timer, RotateCcw, Home, ListChecks, ArrowRight, WifiOff } from 'lucide-react';

interface Step { title: string; who: string; detail: string; done: boolean; action?: { label: string; run: () => void } }

export const DemoGuide: React.FC = () => {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  useEffect(() => storage.subscribe(() => setTick(t => t + 1)), []);
  void tick;

  const self = storage.getRegisteredUsers();
  const selfIds = new Set(self.map(u => u.id));
  const myInst = storage.getInstruments().filter(i => selfIds.has(i.ownerId));
  const myApps = storage.getApplications().filter(a => selfIds.has(a.applicantId));
  const app = myApps[0];
  const cert = app ? storage.getCertificates().find(c => c.applicationId === app.id) : undefined;
  const run = latestRun();

  const as = (role: 'CONTROLLER' | 'LMO', path: string) => async () => { try { await storage.switchDemoRole(role); navigate(path); } catch (e) { window.alert((e as Error).message); } };
  // The registered business signs in with its own password.
  const asBusiness = (path: string) => () => {
    const me = storage.getCurrentUser();
    navigate(self.length && me.id !== self[0].id && me.role !== 'BUSINESS' ? `/login?next=${encodeURIComponent(path)}` : path);
  };

  const steps: Step[] = [
    { title: 'Register a business', who: 'Shop owner', detail: 'Pick Delhi as the State so the Delhi officers can pick it up.', done: self.length > 0, action: { label: 'Open sign-up', run: () => navigate('/register') } },
    { title: 'Add an instrument', who: 'Shop owner', detail: 'e.g. Electronic weighing scale, 30 kg, Class III, e = 5 g. It gets a Digital ID.', done: myInst.length > 0, action: { label: 'Add instrument', run: asBusiness('/instruments?register=1') } },
    { title: 'Apply and upload the model approval', who: 'Shop owner', detail: 'Any PDF or photo works for the demo.', done: myApps.length > 0, action: { label: 'Apply', run: asBusiness('/applications/new') } },
    { title: 'Pay the fee', who: 'Shop owner', detail: 'Demo payment records a UPI reference. An SMS / email is written for each step.', done: !!app && app.feeStatus === 'PAID', action: app ? { label: 'Open application', run: asBusiness(`/applications/${app.id}`) } : undefined },
    { title: 'Check documents and assign an officer', who: 'Delhi Controller', detail: 'Mark the three checks OK. TULA suggests the officer by district and workload.', done: !!app && !!app.assignedToId, action: app ? { label: 'Continue as Controller', run: as('CONTROLLER', `/applications/${app.id}`) } : undefined },
    { title: 'Book the visit', who: 'Delhi Controller', detail: 'Pick a date. The owner is notified.', done: !!app && !!app.scheduledDate, action: app ? { label: 'Open application', run: as('CONTROLLER', `/applications/${app.id}`) } : undefined },
    { title: 'Inspect on the phone (try it offline)', who: 'Field officer (LMO)', detail: 'Turn on flight mode or DevTools offline, fill the checklist and readings, save. Reconnect and the certificate is issued and signed.', done: !!app && ['COMPLETED', 'INSPECTED_PENDING_SYNC'].includes(app.status), action: app ? { label: 'Continue as LMO', run: as('LMO', `/field?applicationId=${app.id}`) } : undefined },
    { title: 'Certificate issued and signed', who: 'System', detail: 'The QR carries the signed details.', done: !!cert && cert.signatureStatus === 'SIGNED', action: cert ? { label: 'Open certificate', run: () => navigate(`/certificates/${cert.id}`) } : undefined },
    { title: 'Scan the QR on another phone', who: 'Citizen', detail: 'No login, no app, works offline. Then try the "Edited copy" sample to see a fake rejected.', done: false, action: { label: 'Open the check page', run: () => navigate(cert ? cert.qrPayloadUrl.replace(/^https?:\/\/[^/]+/, '') : '/verify') } },
  ];
  const doneCount = steps.filter(s => s.done).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" aria-label="TULA home"><TulaLogo variant="full" theme="light" size="sm" /></Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-100 font-semibold text-slate-700"><Home className="w-4 h-4" /><span className="hidden sm:inline">Home</span></Link>
            <Link to="/status" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-100 font-semibold text-slate-700"><ListChecks className="w-4 h-4" /><span className="hidden sm:inline">Built vs planned</span></Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Live demo: registration to verified QR</h1>
          <p className="text-sm text-slate-600 mt-1">Nine steps across three people. Each step ticks itself when it really happens. About 5 minutes.</p>
        </div>

        <section className="bg-slate-900 text-white rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><p className="text-[11px] uppercase text-slate-400 font-bold">Progress</p><p className="text-2xl font-black">{doneCount}/{steps.length}</p></div>
          <div className="col-span-1 sm:col-span-3 flex items-start gap-3">
            <Timer className="w-6 h-6 text-amber-400 shrink-0" />
            {run ? (
              <div>
                <p className="text-[11px] uppercase text-slate-400 font-bold">Last run, measured</p>
                <p className="text-sm"><strong className="text-xl font-black">{formatDuration(run.applicationToCertificateMs)}</strong> from application to certificate{run.fromRegistration && <> ({formatDuration(run.totalMs)} from sign-up)</>}. {run.actions} recorded actions, 0 paper forms, 0 office visits, {run.signed ? 'signed QR' : 'signature pending'}.</p>
              </div>
            ) : (
              <p className="text-sm text-slate-300">The stopwatch fills in from the records when the first certificate of this run is issued.</p>
            )}
          </div>
        </section>

        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s.title} className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${s.done ? 'border-emerald-200' : 'border-slate-200'}`}>
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {s.done ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /> : <Circle className="w-6 h-6 text-slate-300 shrink-0" />}
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{i + 1}. {s.title} <span className="text-xs font-semibold text-slate-500">({s.who})</span></p>
                  <p className="text-xs text-slate-600">{s.detail}</p>
                </div>
              </div>
              {s.action && (
                <button onClick={s.action.run} className="inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg bg-gov-800 hover:bg-gov-900 text-white text-xs font-bold min-h-[44px] shrink-0">
                  {s.action.label} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ol>

        <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <p>Offline tip: in Chrome press F12, Network tab, set "Offline". The inspection saves on the device and the header shows "1 to sync". Switch back to "No throttling" and it syncs by itself.</p>
        </section>

        <button
          onClick={() => { storage.resetDemoData(); navigate('/demo'); }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 underline"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Refresh from the database
        </button>
      </main>
    </div>
  );
};
