import React, { useState, useEffect, useMemo } from 'react';
import { ModelApprovalCheck } from '../components/common/ModelApprovalCheck';
import { useParams, Link } from 'react-router-dom';
import { storage, WorkflowError } from '../services/storage';
import { Application, Instrument, UserProfile } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { analyzeApplicationScrutiny, ScrutinyResult } from '../services/gemini';
import {
  FileText, Scale, ArrowLeft, CheckCircle2, XCircle, Clock, UserCheck, Calendar, IndianRupee, Smartphone,
  AlertTriangle, Check, Sparkles, Loader2, Award, WifiOff, History, Info,
} from 'lucide-react';

const STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'scrutiny', label: 'Scrutiny' },
  { key: 'fee', label: 'Fee' },
  { key: 'assigned', label: 'Officer' },
  { key: 'scheduled', label: 'Visit' },
  { key: 'inspected', label: 'Inspection' },
  { key: 'certificate', label: 'Certificate' },
];

function stepIndex(app: Application): number {
  switch (app.status) {
    case 'SUBMITTED': return 1;
    case 'UNDER_SCRUTINY': case 'CORRECTION_REQUIRED': return 1;
    case 'FEE_PENDING': case 'ACCEPTED': return 2;
    case 'FEE_PAID': case 'ASSIGNMENT_PENDING': return 3;
    case 'ASSIGNED': return 4;
    case 'SCHEDULED': case 'INSPECTION_IN_PROGRESS': case 'RETEST_REQUIRED': return 5;
    case 'INSPECTED_PENDING_SYNC': case 'ADJUSTMENT_REQUIRED': case 'REJECTED': return 6;
    case 'COMPLETED': case 'CERTIFICATE_GENERATED': return 7;
    default: return 1;
  }
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | undefined>();
  const [instrument, setInstrument] = useState<Instrument | undefined>();
  const [user, setUser] = useState<UserProfile>(storage.getCurrentUser());
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [responseNote, setResponseNote] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('11:00 AM - 01:00 PM');
  const [upiRef, setUpiRef] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [ai, setAi] = useState<ScrutinyResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [manualOfficer, setManualOfficer] = useState('');

  useEffect(() => {
    const load = () => {
      if (!id) return;
      const a = storage.getApplicationById(id);
      setApp(a);
      setInstrument(a ? storage.getInstrumentById(a.instrumentId) : undefined);
      setUser(storage.getCurrentUser());
    };
    load();
    return storage.subscribe(load);
  }, [id]);

  const history = useMemo(() => storage.getAuditLogs().filter(l => l.entityId === id).slice(0, 12), [app, id]);

  if (!app || !instrument) {
    return (
      <div className="p-10 text-center bg-white rounded-xl border border-slate-200">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Application not found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">No application with ID {id} is visible to your account.</p>
        <Link to="/applications" className="text-sm font-semibold text-gov-700 hover:underline">Back to applications</Link>
      </div>
    );
  }

  const run = (fn: () => void | Promise<void>, success?: string) => async () => {
    setError(null);
    setInfo(null);
    try {
      await fn();
      if (success) setInfo(success);
    } catch (e) {
      setError(e instanceof WorkflowError || e instanceof Error ? e.message : String(e));
    }
  };

  const isApplicant = user.id === app.applicantId;
  const isOfficer = ['LMO', 'GATC', 'CONTROLLER', 'STATE_ADMIN', 'CENTRAL_ADMIN'].includes(user.role);
  const inJurisdiction = isOfficer && (user.role === 'CENTRAL_ADMIN' || user.state === app.state);
  const canScrutinise = inJurisdiction && ['SUBMITTED', 'UNDER_SCRUTINY', 'ACCEPTED', 'FEE_PENDING', 'FEE_PAID', 'ASSIGNMENT_PENDING'].includes(app.status);
  const canAssign = inJurisdiction && app.status === 'ASSIGNMENT_PENDING';
  const canSchedule = inJurisdiction && ['ASSIGNED', 'SCHEDULED'].includes(app.status);
  const isAssignedOfficer = app.assignedToId === user.id;
  const cert = instrument.currentCertificateId && app.status === 'COMPLETED' ? storage.getCertificateById(instrument.currentCertificateId) : undefined;
  const suggestion = canAssign ? storage.suggestAssignment(app.id) : null;
  const officersInState = canAssign ? [...storage.getOfficers('LMO', app.state), ...storage.getOfficers('GATC', app.state)] : [];
  const current = stepIndex(app);

  const handleAi = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      setAi(await analyzeApplicationScrutiny({
        category: instrument.category, categoryName: instrument.categoryName, accuracyClass: instrument.accuracyClass,
        capacity: instrument.capacity, scaleInterval: instrument.scaleInterval, manufacturer: instrument.manufacturer,
        model: instrument.model, modelApprovalNumber: instrument.modelApprovalNumber, serialNumber: instrument.serialNumber,
        serviceType: app.serviceType, state: app.state, district: app.district,
      }));
    } catch (e) {
      setAi(null);
      setAiError((e as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const waitingFor = (() => {
    if (app.status === 'CORRECTION_REQUIRED') return isApplicant ? 'You need to respond to the officer\'s correction request below.' : 'Waiting for the applicant to respond to the correction request.';
    if (app.status === 'SUBMITTED' || app.status === 'UNDER_SCRUTINY') return app.feeStatus === 'UNPAID' ? 'Waiting for document scrutiny by the district office. The fee can be paid now.' : 'Waiting for document scrutiny by the district office.';
    if (app.status === 'FEE_PENDING') return isApplicant ? 'Documents are cleared. Pay the fee to get an officer assigned.' : 'Documents cleared. Waiting for the applicant to pay the fee.';
    if (app.status === 'ASSIGNMENT_PENDING') return 'Ready for an officer to be assigned.';
    if (app.status === 'ASSIGNED') return 'Officer assigned. Waiting for a visit date.';
    if (app.status === 'SCHEDULED') return `Inspection on ${app.scheduledDate}, ${app.scheduledTimeSlot}.`;
    if (app.status === 'INSPECTED_PENDING_SYNC') return 'Inspection was recorded offline. The certificate is issued and signed as soon as the officer\'s phone is back online.';
    if (app.status === 'ADJUSTMENT_REQUIRED') return 'The instrument needs adjustment by a licensed repairer before re-inspection.';
    if (app.status === 'RETEST_REQUIRED') return 'A re-test is needed. The officer will re-inspect.';
    if (app.status === 'REJECTED') return 'The instrument failed verification. It must not be used for trade.';
    if (app.status === 'COMPLETED') return 'Verification complete. The certificate is ready.';
    return '';
  })();

  return (
    <div className="space-y-5">
      <div>
        <Link to="/applications" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gov-700 hover:text-gov-900 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Applications
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{app.id}</h1>
              <StatusBadge status={app.status} size="lg" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {app.serviceType.replace(/_/g, ' ').toLowerCase()} • filed {new Date(app.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/instruments/${app.instrumentId}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 min-h-[40px]">
              <Scale className="w-3.5 h-3.5" /> Instrument
            </Link>
            {isAssignedOfficer && ['ASSIGNED', 'SCHEDULED', 'RETEST_REQUIRED'].includes(app.status) && (
              <Link to={`/field?applicationId=${app.id}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold min-h-[40px]">
                <Smartphone className="w-4 h-4" /> Start inspection
              </Link>
            )}
            {cert && (
              <Link to={`/certificates/${cert.id}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold min-h-[40px]">
                <Award className="w-4 h-4" /> Certificate
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <ol className="grid grid-cols-7 gap-1">
          {STEPS.map((s, i) => {
            const done = i < current || app.status === 'COMPLETED';
            const active = i === current && app.status !== 'COMPLETED';
            return (
              <li key={s.key} className="flex flex-col items-center text-center gap-1">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${done ? 'bg-emerald-600 text-white' : active ? 'bg-gov-700 text-white ring-4 ring-gov-100' : 'bg-slate-100 text-slate-400'}`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span className={`text-[10px] sm:text-[11px] font-semibold ${done || active ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</span>
              </li>
            );
          })}
        </ol>
        {waitingFor && (
          <p className="mt-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex gap-2">
            {app.status === 'INSPECTED_PENDING_SYNC' ? <WifiOff className="w-4 h-4 text-amber-600 shrink-0" /> : <Info className="w-4 h-4 text-gov-700 shrink-0" />}
            <span>{waitingFor}</span>
          </p>
        )}
      </div>

      {error && <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
      {info && <div role="status" className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />{info}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Particulars */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Application details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-slate-500">Applicant</dt><dd className="font-bold text-slate-900">{app.applicantName}</dd><dd className="text-xs text-slate-600">{app.organization}</dd></div>
              <div><dt className="text-xs text-slate-500">Instrument</dt><dd className="font-mono font-bold text-gov-800">{instrument.id}</dd><dd className="text-xs text-slate-600">{instrument.categoryName}, {instrument.capacity}</dd></div>
              <div><dt className="text-xs text-slate-500">Site</dt><dd className="font-medium text-slate-800">{app.location}</dd><dd className="text-xs text-slate-500">{app.district}, {app.state}</dd></div>
              <div><dt className="text-xs text-slate-500">Fee</dt><dd className="font-bold text-slate-900">₹{app.feeAmount.toLocaleString('en-IN')} <span className={`text-xs ${app.feeStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>({app.feeStatus.toLowerCase()})</span></dd>{app.paymentReference && <dd className="font-mono text-[11px] text-slate-500">Ref {app.paymentReference}</dd>}</div>
            </dl>
          </section>

          {/* Scrutiny */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-gov-700" /> Document scrutiny</h3>
                <p className="text-[11px] text-slate-500">Done by the district office before an officer is assigned</p>
              </div>
              {canScrutinise && (
                <button type="button" onClick={handleAi} disabled={aiLoading} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-paper-50 hover:bg-paper-100 border border-brass-200 text-xs font-bold text-ink disabled:opacity-50 min-h-[40px]">
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-brass-600" />}
                  {aiLoading ? 'Checking…' : 'AI check (advisory)'}
                </button>
              )}
            </div>

            {instrument && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-ink">Model approval <span className="font-readout font-normal">{instrument.modelApprovalNumber}</span> <span className="font-normal text-ink-600">· {instrument.manufacturer}</span></p>
                <ModelApprovalCheck mark={instrument.modelApprovalNumber} manufacturer={instrument.manufacturer} />
              </div>
            )}

            {aiError && (
              <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <strong>AI check unavailable.</strong> {aiError} Continue with the manual checklist below.
              </p>
            )}
            {ai && (
              <div className="p-4 rounded-xl bg-paper-50/60 border border-brass-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-ink-900">AI scrutiny notes <span className="font-normal text-brass-700">({ai.model}, suggestions only)</span></h4>
                  <span className="text-[10px] font-bold uppercase text-ink-800">{ai.flags.length} flag{ai.flags.length === 1 ? '' : 's'}</span>
                </div>
                <p className="text-xs text-slate-700">{ai.summary}</p>
                {ai.flags.length > 0 && (
                  <ul className="space-y-1">
                    {ai.flags.map((f, i) => (
                      <li key={i} className="text-xs text-slate-700 flex gap-2">
                        <span className={`shrink-0 px-1.5 rounded text-[10px] font-bold ${f.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : f.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>{f.severity}</span>
                        <span><strong>{f.field}:</strong> {f.issue}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[10px] text-ink-800">The officer decides each item below. AI output does not change the record.</p>
              </div>
            )}

            <div className="space-y-2.5">
              {app.scrutinyItems.map(item => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                    <p className="text-slate-600">{item.description}</p>
                    {item.verifiedBy && <p className="text-[11px] text-slate-500">Checked by {item.verifiedBy}</p>}
                    {item.remarks && <p className="text-[11px] text-slate-700">Note: {item.remarks}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canScrutinise ? (
                      <>
                        <button type="button" onClick={run(() => storage.updateScrutinyItem(app.id, item.id, true))} className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold flex items-center gap-1 ${item.passed === true ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50'}`}>
                          <Check className="w-3.5 h-3.5" /> OK
                        </button>
                        <button type="button" onClick={run(() => storage.updateScrutinyItem(app.id, item.id, false))} className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold flex items-center gap-1 ${item.passed === false ? 'bg-rose-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-rose-50'}`}>
                          <XCircle className="w-3.5 h-3.5" /> Problem
                        </button>
                      </>
                    ) : item.passed === true ? (
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Cleared</span>
                    ) : item.passed === false ? (
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Problem found</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded text-xs font-medium bg-slate-200 text-slate-700 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Not checked yet</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {canScrutinise && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <label htmlFor="corr" className="block text-xs font-semibold text-slate-700">Send back to the applicant for correction</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input id="corr" type="text" placeholder="e.g. Model approval copy is unreadable, upload a clear scan" value={correctionNotes} onChange={e => setCorrectionNotes(e.target.value)} className="flex-1 bg-white border border-slate-300 rounded-lg p-2.5 text-sm" />
                  <button onClick={run(() => { storage.requestCorrection(app.id, correctionNotes); setCorrectionNotes(''); }, 'Correction request sent to the applicant.')} className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0">
                    Request correction
                  </button>
                </div>
              </div>
            )}

            {app.status === 'CORRECTION_REQUIRED' && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                <p className="text-sm text-amber-900"><strong>Officer's request:</strong> {app.correctionRemarks}</p>
                {isApplicant && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" placeholder="What did you correct?" value={responseNote} onChange={e => setResponseNote(e.target.value)} className="flex-1 bg-white border border-amber-300 rounded-lg p-2.5 text-sm" />
                    <button onClick={run(() => { if (!responseNote.trim()) throw new Error('Describe the correction.'); storage.resubmitApplication(app.id, responseNote.trim()); setResponseNote(''); }, 'Sent back to the office for scrutiny.')} className="px-4 py-2.5 rounded-lg bg-gov-700 hover:bg-gov-800 text-white text-xs font-bold">
                      Resubmit
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Documents */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {app.documents.map(doc => {
                const st = doc.reviewStatus || 'SUBMITTED';
                return (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 block">{doc.title}</span>
                      {doc.fileUrl && doc.fileUrl.startsWith('data:') ? (
                        <a href={doc.fileUrl} download={doc.fileName} className="font-mono text-[11px] text-gov-700 underline break-all">{doc.fileName}</a>
                      ) : (
                        <span className="block font-mono text-[11px] text-slate-500 break-all">{doc.fileName}</span>
                      )}
                      <span className="block text-[10px] text-slate-400">{doc.fileSize}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${st === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : st === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>
                      {st === 'ACCEPTED' ? 'Accepted' : st === 'REJECTED' ? 'Rejected' : 'Submitted'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5"><History className="w-4 h-4 text-gov-700" /> Timeline</h3>
            {history.length === 0 ? <p className="text-xs text-slate-500">No recorded actions yet.</p> : (
              <ol className="space-y-2">
                {history.map(h => (
                  <li key={h.id} className="text-xs flex gap-3">
                    <span className="text-slate-400 font-mono shrink-0 w-[118px]">{new Date(h.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-slate-700"><strong>{h.actorName}</strong>: {h.details}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Right column: next actions */}
        <div className="space-y-5">
          {app.feeStatus === 'UNPAID' && (
            <section className="bg-white p-5 rounded-xl border-2 border-amber-400 space-y-3">
              <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2"><IndianRupee className="w-5 h-5 text-amber-600" /> Fee due: ₹{app.feeAmount.toLocaleString('en-IN')}</h4>
              {isApplicant ? (
                <>
                  <p className="text-xs text-slate-600">Prototype payment: enter any UPI reference to record a demo payment. The pilot connects to the State treasury gateway.</p>
                  <input type="text" inputMode="text" placeholder="UPI reference (optional)" value={upiRef} onChange={e => setUpiRef(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono" />
                  <button onClick={run(() => storage.payApplicationFee(app.id, upiRef.trim() || `UPI-DEMO-${Date.now().toString().slice(-6)}`), 'Payment recorded. A receipt was sent by SMS / email where configured.')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg text-sm">
                    Pay ₹{app.feeAmount.toLocaleString('en-IN')} (demo)
                  </button>
                </>
              ) : (
                <p className="text-xs text-slate-600">Waiting for the applicant to pay. Assignment unlocks after payment and scrutiny.</p>
              )}
            </section>
          )}

          <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2"><UserCheck className="w-4 h-4 text-gov-700" /> Officer</h4>
            {app.assignedToName ? (
              <div className="bg-gov-50 p-3 rounded-lg border border-gov-200 text-xs space-y-1">
                <p className="font-bold text-slate-900 text-sm">{app.assignedToName} ({app.assignedToType})</p>
                <p className="text-slate-600">{app.assignmentReason}</p>
              </div>
            ) : canAssign && suggestion ? (
              'error' in suggestion ? (
                <p className="text-xs text-rose-700">{suggestion.error}</p>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-700">Suggested</span>
                    <p className="font-bold text-sm text-slate-900">{suggestion.officer.fullName} ({suggestion.type})</p>
                    <p className="text-slate-600">{suggestion.reason}</p>
                  </div>
                  <button onClick={run(() => storage.assignApplication(app.id, suggestion.type, suggestion.officer.id, suggestion.officer.fullName, suggestion.reason), 'Officer assigned and notified.')} className="w-full bg-gov-700 hover:bg-gov-800 text-white font-bold py-2.5 rounded-lg text-sm">
                    Assign {suggestion.officer.fullName.split(' ').slice(-1)[0]}
                  </button>
                  {officersInState.length > 1 && (
                    <div className="space-y-2">
                      <label htmlFor="alt" className="text-[11px] font-semibold text-slate-600">Or choose another officer in {app.state}</label>
                      <div className="flex gap-2">
                        <select id="alt" value={manualOfficer} onChange={e => setManualOfficer(e.target.value)} className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs">
                          <option value="">Select</option>
                          {officersInState.map(o => <option key={o.id} value={o.id}>{o.fullName} ({o.role}, {o.district})</option>)}
                        </select>
                        <button disabled={!manualOfficer} onClick={run(() => {
                          const o = officersInState.find(x => x.id === manualOfficer)!;
                          storage.assignApplication(app.id, o.role as 'LMO' | 'GATC', o.id, o.fullName, `Chosen manually by ${user.fullName}`);
                        }, 'Officer assigned.')} className="px-3 rounded-lg bg-slate-800 text-white text-xs font-bold disabled:opacity-40">Assign</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <p className="text-xs text-slate-600">
                {['SUBMITTED', 'UNDER_SCRUTINY', 'FEE_PENDING', 'CORRECTION_REQUIRED'].includes(app.status)
                  ? 'An officer is assigned after scrutiny is cleared and the fee is paid.'
                  : isOfficer && !inJurisdiction ? `This application is handled by the ${app.state} office.` : 'Not assigned yet.'}
              </p>
            )}
          </section>

          <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2"><Calendar className="w-4 h-4 text-gov-700" /> Inspection visit</h4>
            {app.scheduledDate && !canSchedule ? (
              <p className="text-sm font-bold text-slate-900">{app.scheduledDate} <span className="font-normal text-slate-600">({app.scheduledTimeSlot})</span></p>
            ) : canSchedule ? (
              <div className="space-y-2">
                {app.scheduledDate && <p className="text-xs text-slate-600">Current: <strong>{app.scheduledDate}, {app.scheduledTimeSlot}</strong></p>}
                <label htmlFor="date" className="block text-[11px] font-semibold text-slate-600">Date</label>
                <input id="date" type="date" min={todayStr()} value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm" />
                <label htmlFor="slot" className="block text-[11px] font-semibold text-slate-600">Time</label>
                <select id="slot" value={scheduledSlot} onChange={e => setScheduledSlot(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm">
                  {['09:00 AM - 11:00 AM', '11:00 AM - 01:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM'].map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={run(() => storage.scheduleApplication(app.id, scheduledDate || todayStr(), scheduledSlot), 'Visit scheduled. The applicant has been notified.')} className="w-full bg-gov-700 hover:bg-gov-800 text-white font-bold py-2.5 rounded-lg text-sm">
                  {app.scheduledDate ? 'Reschedule' : 'Confirm visit'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-600">The visit is booked once an officer is assigned.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
