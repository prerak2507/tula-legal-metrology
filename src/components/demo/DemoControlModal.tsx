import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../../services/storage';
import { X, FastForward, AlertTriangle, ShieldAlert, Bell, RefreshCw, CheckCircle2, Info, PlayCircle } from 'lucide-react';
import { Instrument, Application, VerificationCertificate } from '../../types';

interface DemoControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  instruments: Instrument[];
  applications: Application[];
  certificates: VerificationCertificate[];
}

type Msg = { tone: 'ok' | 'err'; text: string } | null;

/**
 * Presenter shortcuts. Every action goes through the same rules as the normal screens,
 * so each role only sees what its account is actually allowed to do.
 */
export const DemoControlModal: React.FC<DemoControlModalProps> = ({ isOpen, onClose }) => {
  const user = storage.getCurrentUser();
  const isFieldOfficer = user.role === 'LMO' || user.role === 'GATC';
  const isSupervisor = ['CONTROLLER', 'STATE_ADMIN', 'CENTRAL_ADMIN'].includes(user.role);

  const myJobs = useMemo(() => storage.getApplicationsForUser(user)
    .filter(a => a.assignedToId === user.id && ['ASSIGNED', 'SCHEDULED', 'RETEST_REQUIRED'].includes(a.status)), [user.id, isOpen]);
  const revocable = useMemo(() => (isSupervisor ? storage.getCertificatesForUser(user).filter(c => c.status === 'VALID') : []), [user.id, isOpen]);
  const expirable = useMemo(() => (isSupervisor || isFieldOfficer ? storage.getInstrumentsForUser(user).filter(i => i.status === 'ACTIVE') : []), [user.id, isOpen]);

  const [appId, setAppId] = useState('');
  const [certId, setCertId] = useState('');
  const [instId, setInstId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAppId(myJobs[0]?.id || '');
    setCertId(revocable[0]?.id || '');
    setInstId(expirable[0]?.id || '');
    setMsg(null);
  }, [isOpen, myJobs, revocable, expirable]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const act = async (fn: () => Promise<string> | string) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ tone: 'ok', text: await fn() });
    } catch (e) {
      setMsg({ tone: 'err', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const section = 'bg-white p-4 rounded-xl border border-slate-200 space-y-3';
  const select = 'w-full sm:flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm';
  const button = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-40 min-h-[44px] shrink-0';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="demo-controls-title" onClick={onClose}>
      <div className="bg-slate-50 w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-slate-900 text-white px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="demo-controls-title" className="font-bold text-base">Presenter shortcuts</h2>
            <p className="text-xs text-slate-400">Signed in as {user.fullName} ({user.role.replace('_', ' ').toLowerCase()}). Only actions this account may perform are shown.</p>
          </div>
          <button onClick={onClose} className="p-2 -m-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        {msg && (
          <div role={msg.tone === 'ok' ? 'status' : 'alert'} className={`px-5 py-3 text-sm flex gap-2 ${msg.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            {msg.tone === 'ok' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        <div className="p-4 sm:p-5 space-y-4">
          <Link to="/demo" onClick={onClose} className="flex items-center gap-3 p-4 rounded-xl bg-gov-800 text-white hover:bg-gov-900">
            <PlayCircle className="w-6 h-6 text-amber-400 shrink-0" />
            <span className="text-sm"><strong className="block">Live demo guide</strong>Step-by-step from registration to a verified QR, with each step ticking itself.</span>
          </Link>

          {isFieldOfficer && (
            <section className={section}>
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><FastForward className="w-4 h-4 text-gov-700" /> Finish one of my inspections</h3>
              <p className="text-xs text-slate-600">Fills the checklist and in-tolerance sample readings, then issues and signs the certificate. Logged as a demo action. Use it when there are no test weights at the venue.</p>
              {myJobs.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5">No open jobs are assigned to you right now.</p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="sr-only" htmlFor="ff-app">Job</label>
                  <select id="ff-app" value={appId} onChange={e => setAppId(e.target.value)} className={select}>
                    {myJobs.map(a => <option key={a.id} value={a.id}>{a.id} · {a.organization}</option>)}
                  </select>
                  <button disabled={busy || !appId} onClick={() => act(async () => { await storage.fastForwardApplication(appId); return `${appId}: certificate issued. Open Certificates to see it.`; })} className={`${button} bg-gov-700 hover:bg-gov-800`}>
                    <FastForward className="w-4 h-4" /> Issue certificate
                  </button>
                </div>
              )}
            </section>
          )}

          {isSupervisor && (
            <section className={section}>
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-600" /> Revoke a certificate</h3>
              <p className="text-xs text-slate-600">After revoking, scanning its QR on any phone shows "Revoked", even though the signature is genuine.</p>
              {revocable.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5">No valid certificates in your jurisdiction.</p>
              ) : (
                <>
                  <label className="sr-only" htmlFor="rv-cert">Certificate</label>
                  <select id="rv-cert" value={certId} onChange={e => setCertId(e.target.value)} className={`${select} w-full`}>
                    {revocable.map(c => <option key={c.id} value={c.id}>{c.certificateNumber} · {c.organization}</option>)}
                  </select>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="sr-only" htmlFor="rv-reason">Reason</label>
                    <input id="rv-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason, e.g. seal found cut during surprise check" className={select} />
                    <button disabled={busy || !certId || reason.trim().length < 5} onClick={() => act(() => {
                      if (!window.confirm('Revoke this certificate on the live database?')) return 'Cancelled.';
                      storage.revokeCertificate(certId, reason.trim());
                      setReason('');
                      return 'Certificate revoked. Its QR now shows "Revoked" on every phone.';
                    })} className={`${button} bg-rose-600 hover:bg-rose-700`}>Revoke</button>
                  </div>
                </>
              )}
            </section>
          )}

          {(isSupervisor || isFieldOfficer) && (
            <section className={section}>
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" /> Show an expiry</h3>
              <p className="text-xs text-slate-600">Moves one instrument's due date 15 days into the past, so its status, the owner's reminder and the pendency dashboard all change.</p>
              {expirable.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5">No active instruments in your jurisdiction.</p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="sr-only" htmlFor="ex-inst">Instrument</label>
                  <select id="ex-inst" value={instId} onChange={e => setInstId(e.target.value)} className={select}>
                    {expirable.map(i => <option key={i.id} value={i.id}>{i.id} · {i.organization}</option>)}
                  </select>
                  <button disabled={busy || !instId} onClick={() => act(() => {
                    if (!window.confirm('Change this instrument\'s due date on the live database?')) return 'Cancelled.';
                    storage.simulateInstrumentExpiry(instId);
                    return `${instId} is now expired and the owner has been reminded.`;
                  })} className={`${button} bg-amber-600 hover:bg-amber-700`}>Expire</button>
                </div>
              )}
            </section>
          )}

          <section className={section}>
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Bell className="w-4 h-4 text-sky-600" /> Send due reminders now</h3>
            <p className="text-xs text-slate-600">Runs the daily reminder check (30, 15, 7 and 1 days before expiry) for instruments you can see. Each milestone is sent once.</p>
            <button disabled={busy} onClick={() => act(() => {
              const n = storage.runExpiryReminderJob();
              return n ? `${n} reminder(s) sent. See SMS / Email Updates.` : 'Nothing due that has not already been reminded.';
            })} className={`${button} bg-sky-600 hover:bg-sky-700 w-full sm:w-auto`}><Bell className="w-4 h-4" /> Run reminder check</button>
          </section>

          <section className={section}>
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-slate-600" /> Refresh from the database</h3>
            <p className="text-xs text-slate-600">Reloads everything your account can see from the live database. Useful after someone else made changes on another device.</p>
            <button disabled={busy} onClick={() => act(() => { storage.resetDemoData(); return 'Refreshed from the live database.'; })} className={`${button} bg-slate-700 hover:bg-slate-800 w-full sm:w-auto`}><RefreshCw className="w-4 h-4" /> Refresh</button>
          </section>

          {!isFieldOfficer && !isSupervisor && (
            <p className="text-xs text-slate-600 flex gap-2"><Info className="w-4 h-4 shrink-0" />Officer shortcuts (finish an inspection, revoke, expire) appear when you sign in as an officer.</p>
          )}
        </div>
      </div>
    </div>
  );
};
