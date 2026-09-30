import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { X, Store, Landmark, ClipboardCheck, ShieldCheck, QrCode, Clock } from 'lucide-react';
import { storage } from '../../services/storage';
import { formatDuration } from '../../services/analytics';

interface ConnectedWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Step { icon: React.ElementType; who: string; what: string; detail: string; at?: string }

/** Traces the most recent completed application the signed-in account can see, from the real records. */
export const ConnectedWorkflowModal: React.FC<ConnectedWorkflowModalProps> = ({ isOpen, onClose }) => {
  const trace = useMemo(() => {
    if (!isOpen) return null;
    const certs = storage.getCertificatesForUser();
    const apps = storage.getApplicationsForUser().filter(a => a.status === 'COMPLETED')
      .map(a => ({ a, c: certs.find(c => c.applicationId === a.id) }))
      .filter(x => x.c)
      .sort((x, y) => (y.c!.issuedAt || '').localeCompare(x.c!.issuedAt || ''));
    const pick = apps[0];
    if (!pick) return null;
    const { a, c } = pick;
    const cert = c!;
    const logs = storage.getAuditLogs().filter(l => l.entityId === a.id || l.entityId === cert.id);
    const when = (action: string) => logs.filter(l => l.action === action).map(l => l.timestamp).sort()[0];
    const insp = storage.getInspections().find(i => i.id === cert.inspectionId);
    // Largest absolute error among the recorded readings.
    const worstRow = (insp?.testReadings || [])
      .map(r => ({ r, err: r.nominal !== undefined && r.observedValue !== '' ? Math.abs(parseFloat(r.observedValue.replace(/,/g, '')) - r.nominal) : NaN }))
      .filter(x => !Number.isNaN(x.err))
      .sort((x, y) => y.err - x.err)[0];
    const worst = worstRow ? `${worstRow.r.error} against a limit of ${worstRow.r.permissibleTolerance}` : '';
    const steps: Step[] = [
      { icon: Store, who: a.applicantName, what: 'Applied online', detail: `${a.id} for ${a.instrumentId}, fee ₹${a.feeAmount.toLocaleString('en-IN')} ${a.feeStatus.toLowerCase()}`, at: a.createdAt },
      { icon: Landmark, who: logs.find(l => l.action === 'APPLICATION_ASSIGNED')?.actorName || 'District office', what: 'Scrutiny and assignment', detail: `Assigned to ${a.assignedToName || 'officer'} (${a.assignedToType || 'LMO'})${a.scheduledDate ? `, visit ${a.scheduledDate}` : ''}`, at: when('APPLICATION_ASSIGNED') },
      { icon: ClipboardCheck, who: insp?.inspectorName || cert.issuingOfficerName, what: 'Inspected on site', detail: `${insp?.testReadings?.length || 0} readings, all within limits${worst ? ` (largest error ${worst})` : ''}${insp?.syncStatus === 'SYNCED' && logs.some(l => l.action === 'OFFLINE_INSPECTION_SYNCED') ? ', recorded offline' : ''}`, at: insp?.inspectionDate },
      { icon: ShieldCheck, who: 'TULA server', what: 'Certificate issued and signed', detail: `${cert.certificateNumber}, valid until ${cert.validUntil}${cert.signatureStatus === 'SIGNED' ? `, signed with key ${cert.signingKid}` : ', signature pending'}`, at: cert.signedAt || cert.issuedAt },
      { icon: QrCode, who: 'Any buyer', what: 'Checks the QR', detail: 'No login. Works offline. Edited copies are rejected.' },
    ];
    const total = cert.issuedAt ? Date.parse(cert.issuedAt) - Date.parse(a.createdAt) : null;
    return { steps, total, cert, app: a };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="wf-title" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-900 text-white px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="wf-title" className="font-bold text-base">How one application moved through TULA</h2>
            <p className="text-xs text-slate-400">{trace ? `Traced from the records of ${trace.app.id}, the latest completed application you can see.` : 'Each role works on the same record. No re-entry between offices.'}</p>
          </div>
          <button onClick={onClose} className="p-2 -m-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        {trace ? (
          <div className="p-5 space-y-4">
            <ol className="relative border-l-2 border-gov-200 ml-4 space-y-5">
              {trace.steps.map(({ icon: Icon, who, what, detail, at }) => (
                <li key={what} className="ml-6">
                  <span className="absolute -left-[17px] w-8 h-8 rounded-full bg-gov-800 text-white flex items-center justify-center"><Icon className="w-4 h-4" /></span>
                  <p className="text-sm"><strong>{what}</strong> <span className="text-slate-500">· {who}</span></p>
                  <p className="text-sm text-slate-700">{detail}</p>
                  {at && <p className="text-[11px] text-slate-400">{new Date(at).toLocaleString('en-IN')}</p>}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm">
              <span className="flex items-center gap-2 text-emerald-900"><Clock className="w-4 h-4" /> Application to certificate: <strong>{formatDuration(trace.total)}</strong></span>
              <Link to={`/certificates/${trace.cert.id}`} onClick={onClose} className="font-bold text-gov-700 hover:underline">Open the certificate →</Link>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-3 text-sm text-slate-700">
            <p>The trader applies, the district office clears documents and assigns an officer, the officer inspects on a phone (offline if needed), the server signs the certificate, and any buyer checks the QR.</p>
            <p>No completed application is visible to this account yet. Run the <Link to="/demo" onClick={onClose} className="font-semibold text-gov-700 underline">live demo</Link> and this view will trace it step by step.</p>
          </div>
        )}
      </div>
    </div>
  );
};
