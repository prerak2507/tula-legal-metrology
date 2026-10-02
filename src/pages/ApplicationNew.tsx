import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { storage, WorkflowError } from '../services/storage';
import { ApplicationServiceType, ApplicationDocument } from '../types';
import { FileText, Scale, UploadCloud, ArrowLeft, IndianRupee, AlertCircle, Trash2, Plus, CheckCircle2 } from 'lucide-react';

const SERVICES: { value: ApplicationServiceType; title: string; text: string }[] = [
  { value: 'INITIAL_VERIFICATION', title: 'First verification', text: 'New instrument, never stamped' },
  { value: 'PERIODIC_RE_VERIFICATION', title: 'Periodic re-verification', text: 'Stamp is due or expired' },
  { value: 'RE_VERIFICATION_AFTER_REPAIR', title: 'After repair', text: 'Repaired or parts replaced' },
  { value: 'RE_VERIFICATION_AFTER_RELOCATION', title: 'After moving', text: 'Instrument moved to a new site' },
];

const DOC_TYPES: { type: ApplicationDocument['type']; title: string; required: boolean }[] = [
  { type: 'MODEL_APPROVAL', title: 'Model approval certificate', required: true },
  { type: 'PURCHASE_INVOICE', title: 'Purchase invoice', required: false },
  { type: 'PREVIOUS_CERTIFICATE', title: 'Previous verification certificate', required: false },
  { type: 'CALIBRATION_REPORT', title: 'Repairer report (after repair)', required: false },
];

const MAX_FILE = 3 * 1024 * 1024; // DoCA's own certificate PDFs run up to about 2.7 MB

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(file);
  });
}

export const ApplicationNew: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = storage.getCurrentUser();
  const mine = useMemo(() => storage.getInstrumentsForUser(user), [user.id]);
  const openIds = useMemo(() => new Set(storage.getApplications().filter(a => a.applicantId === user.id && !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(a.status)).map(a => a.instrumentId)), [user.id]);
  const preselect = params.get('instrumentId') || '';
  const [instId, setInstId] = useState(mine.some(i => i.id === preselect) ? preselect : (mine.find(i => !openIds.has(i.id))?.id || ''));
  const inst = mine.find(i => i.id === instId);
  const [service, setService] = useState<ApplicationServiceType>(inst?.lastVerificationDate ? 'PERIODIC_RE_VERIFICATION' : 'INITIAL_VERIFICATION');
  const [preferredDate, setPreferredDate] = useState('');
  const [docs, setDocs] = useState<ApplicationDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user.role !== 'BUSINESS') {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
        <h1 className="font-bold text-slate-900">Applications are filed by instrument owners</h1>
        <p className="text-sm text-slate-600">Officers review them in the applications queue.</p>
        <Link to="/applications" className="text-sm font-semibold text-gov-700 underline">Go to applications</Link>
      </div>
    );
  }

  if (mine.length === 0) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
        <Scale className="w-10 h-10 text-slate-300 mx-auto" />
        <h1 className="font-bold text-slate-900">Register an instrument first</h1>
        <p className="text-sm text-slate-600">Add your scale, pump or meter. It gets a Digital ID, and then you can apply.</p>
        <Link to="/instruments?register=1" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gov-700 text-white text-sm font-bold"><Plus className="w-4 h-4" /> Register an instrument</Link>
      </div>
    );
  }

  const fee = inst ? storage.feeFor(inst) : null;
  const hasModelApproval = docs.some(d => d.type === 'MODEL_APPROVAL');

  const addDoc = async (e: React.ChangeEvent<HTMLInputElement>, type: ApplicationDocument['type'], title: string) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    if (!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(file.type)) { setError('Upload a PDF, JPG or PNG file.'); return; }
    if (file.size > MAX_FILE) { setError('Files must be under 3 MB. Scan at a lower resolution or upload a phone photo.'); return; }
    const url = await readAsDataUrl(file);
    setDocs(d => [...d.filter(x => x.type !== type), {
      id: `doc-${Date.now()}`, title, type, fileName: file.name, fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      uploadedAt: new Date().toISOString(), fileUrl: url, reviewStatus: 'SUBMITTED',
    }]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inst || !fee) { setError('Choose an instrument.'); return; }
    if (!hasModelApproval) { setError('Upload the model approval certificate.'); return; }
    setBusy(true);
    try {
      const app = await storage.createApplication({
        instrumentId: inst.id, applicantId: user.id, applicantName: user.fullName, organization: user.organization,
        serviceType: service, state: inst.state, district: inst.district, location: inst.installationAddress,
        preferredDate: preferredDate || undefined, feeAmount: fee.total, feeStatus: 'UNPAID', documents: docs,
      });
      navigate(`/applications/${app.id}`);
    } catch (err) {
      setError(err instanceof WorkflowError || err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <Link to="/applications" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gov-700 mb-2"><ArrowLeft className="w-3.5 h-3.5" /> Applications</Link>
        <h1 className="text-2xl font-extrabold text-slate-900">Apply for verification</h1>
        <p className="text-sm text-slate-600">Three steps. You can pay the fee right after submitting.</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-gov-700 text-white text-xs flex items-center justify-center">1</span> Instrument</h2>
          <label htmlFor="inst" className="sr-only">Instrument</label>
          <select id="inst" value={instId} onChange={e => setInstId(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm">
            {mine.map(i => (
              <option key={i.id} value={i.id} disabled={openIds.has(i.id)}>
                {i.id} • {i.categoryName} • {i.status.replace(/_/g, ' ').toLowerCase()}{openIds.has(i.id) ? ' (application already open)' : ''}
              </option>
            ))}
          </select>
          {inst && (
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div><dt className="text-slate-500">Make / model</dt><dd className="font-semibold text-slate-900">{inst.manufacturer} {inst.model}</dd></div>
              <div><dt className="text-slate-500">Capacity / class</dt><dd className="font-semibold text-slate-900">{inst.capacity} • {inst.accuracyClass.replace('CLASS_', 'Class ').replace('NOT_APPLICABLE', 'n/a')}</dd></div>
              <div><dt className="text-slate-500">Site</dt><dd className="font-semibold text-slate-900">{inst.installationAddress}</dd></div>
            </dl>
          )}
          <Link to="/instruments?register=1" className="inline-flex items-center gap-1 text-xs font-semibold text-gov-700"><Plus className="w-3.5 h-3.5" /> Register another instrument</Link>
        </section>

        <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-gov-700 text-white text-xs flex items-center justify-center">2</span> What do you need?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SERVICES.map(s => (
              <label key={s.value} className={`p-3 rounded-lg border cursor-pointer min-h-[56px] ${service === s.value ? 'border-gov-700 bg-gov-50 ring-2 ring-gov-600/20' : 'border-slate-200'}`}>
                <input type="radio" name="service" className="sr-only" checked={service === s.value} onChange={() => setService(s.value)} />
                <span className="block font-bold text-sm text-slate-900">{s.title}</span>
                <span className="block text-xs text-slate-500">{s.text}</span>
              </label>
            ))}
          </div>
          <label className="block text-xs">
            <span className="font-semibold text-slate-700">Preferred visit date (optional)</span>
            <input type="date" min={new Date().toISOString().slice(0, 10)} value={preferredDate} onChange={e => setPreferredDate(e.target.value)} className="mt-1 w-full sm:w-60 bg-white border border-slate-300 rounded-lg p-2.5 text-sm" />
          </label>
        </section>

        <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-gov-700 text-white text-xs flex items-center justify-center">3</span> Documents</h2>
          <p className="text-xs text-slate-500">PDF, JPG or PNG, up to 3 MB each. A clear phone photo is fine. The officer can check the model approval certificate against the copy DoCA publishes; to read a scan, that certificate (and only that one) is sent to Google Gemini. Do not upload personal documents in that slot.</p>
          <div className="space-y-2">
            {DOC_TYPES.map(d => {
              const up = docs.find(x => x.type === d.type);
              return (
                <div key={d.type} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{d.title}{d.required && <span className="text-rose-600"> *</span>}</p>
                    {up ? <p className="text-xs text-emerald-700 flex items-center gap-1 break-all"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {up.fileName} ({up.fileSize})</p> : <p className="text-xs text-slate-500">{d.required ? 'Required' : 'Optional'}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {up && <button type="button" onClick={() => setDocs(x => x.filter(y => y.type !== d.type))} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50" aria-label={`Remove ${d.title}`}><Trash2 className="w-4 h-4" /></button>}
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold cursor-pointer min-h-[40px]">
                      <UploadCloud className="w-4 h-4" /> {up ? 'Replace' : 'Upload'}
                      <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={e => addDoc(e, d.type, d.title)} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {fee && inst && (
          <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-gov-700" /> Fee</h2>
            <div className="text-sm space-y-1">
              <div className="flex justify-between gap-3"><span className="text-slate-600">Verification fee, Schedule IX{fee.tierLabel ? ` (${fee.tierLabel})` : ''}</span><span className="font-semibold">₹{fee.statutory.toLocaleString('en-IN')}</span></div>
              {fee.inSitu ? (
                <div className="flex justify-between gap-3"><span className="text-slate-600">Verified in place, no on-site fee (rule 16(2) proviso)</span><span className="font-semibold">₹0</span></div>
              ) : (
                <>
                  <div className="flex justify-between gap-3"><span className="text-slate-600">On-site verification, half the fee (rule 16(2))</span><span className="font-semibold">₹{fee.onSite.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-600">Officer&apos;s visit expenses, minimum (rule 16(2))</span><span className="font-semibold">₹{fee.visitMinimum.toLocaleString('en-IN')}</span></div>
                </>
              )}
              {fee.lateFee > 0 && (
                <div className="flex justify-between gap-3"><span className="text-seal-700">Late re-verification, {fee.lateQuarters} quarter{fee.lateQuarters === 1 ? '' : 's'} after expiry (rule 16(3))</span><span className="font-semibold text-seal-700">₹{fee.lateFee.toLocaleString('en-IN')}</span></div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1 text-base"><span className="font-bold">Total</span><span className="font-extrabold">₹{fee.total.toLocaleString('en-IN')}</span></div>
            </div>
            <p className="text-[11px] text-slate-500">
              {fee.citation}.{' '}
              {fee.sourceUrl && <a href={fee.sourceUrl} target="_blank" rel="noreferrer" className="underline font-semibold">Official schedule, published by {fee.jurisdiction === 'GJ' ? 'Government of Gujarat' : 'Government of NCT of Delhi'}</a>}
              {!fee.inSitu && ' Visit expenses above ₹100 (transport of working standards) are assessed by the office.'}
              {!fee.listed && ' This instrument is not in the schedule, so the amount is a placeholder until the Controller fixes it.'}
            </p>
          </section>
        )}

        {error && <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Link to="/applications" className="px-5 py-3 rounded-lg bg-slate-100 text-slate-800 text-sm font-semibold text-center">Cancel</Link>
          <button type="submit" disabled={busy || !inst || openIds.has(instId)} className="px-6 py-3 rounded-lg bg-gov-700 hover:bg-gov-800 text-white text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" /> Submit application
          </button>
        </div>
      </form>
    </div>
  );
};
