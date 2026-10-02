import React, { useState } from 'react';
import { FileSearch, Loader2, BadgeCheck, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { Application, Instrument } from '../../types';
import { checkCertificateDocument } from '../../services/gemini';
import { compareDocument, DocVerdict, DocCheckResponse } from '../../services/docCheck';
import { cloud } from '../../services/cloud';
import { storage } from '../../services/storage';

const TITLES: Record<DocVerdict['status'], string> = {
  exact: "Same file as DoCA's published certificate",
  match: "Document matches DoCA's record and the application",
  mismatch: 'Document does not fully match: check before accepting',
  unreadable: 'Document could not be read clearly',
};

/**
 * Officer-only check of the uploaded model approval certificate. Exact comparison with DoCA's own file first;
 * otherwise Gemini reads both documents and plain code compares the fields. Advisory: the officer decides.
 */
export const DocumentCheck: React.FC<{ app: Application; instrument: Instrument }> = ({ app, instrument }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ verdict: DocVerdict; res: DocCheckResponse } | null>(null);
  const doc = app.documents.find(d => d.type === 'MODEL_APPROVAL');

  const run = async () => {
    if (!doc?.fileUrl) { setError('No model approval certificate was uploaded with this application.'); return; }
    setBusy(true); setError(null);
    try {
      const res = await checkCertificateDocument(instrument.modelApprovalNumber, doc.fileUrl, cloud.accessToken());
      const verdict = compareDocument(res, {
        modelApprovalNumber: instrument.modelApprovalNumber, manufacturer: instrument.manufacturer,
        capacity: instrument.capacity, accuracyClass: instrument.accuracyClass,
      });
      setResult({ verdict, res });
      storage.addAuditLog('DOCUMENT_CHECKED', 'APPLICATION', app.id,
        `Model approval certificate checked: ${TITLES[verdict.status]} (${verdict.findings.filter(f => f.level === 'warn').length} warnings)`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const tone = result?.verdict.status === 'exact' || result?.verdict.status === 'match' ? 'ok' : result?.verdict.status === 'mismatch' ? 'warn' : 'muted';
  const cls = { ok: 'bg-verify-50 border-verify/30', warn: 'bg-brass-200/40 border-brass/40', muted: 'bg-paper-50 border-paper-300' }[tone];

  return (
    <div className="space-y-1.5">
      <button type="button" onClick={run} disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-paper-50 hover:bg-paper-100 border border-brass-200 text-xs font-bold text-ink disabled:opacity-50 min-h-[40px]">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSearch className="w-3.5 h-3.5 text-brass-600" />}
        {busy ? 'Reading the certificate…' : 'Check the uploaded approval certificate'}
      </button>
      {error && <p className="text-xs text-ink-700 bg-paper-50 border border-paper-300 rounded-md p-2.5">{error} Check the document by hand.</p>}
      {result && (
        <div className={`rounded-md border p-3 text-xs space-y-1.5 ${cls}`} role="status" aria-live="polite">
          <p className="font-semibold flex items-start gap-1.5">
            {tone === 'ok' ? <BadgeCheck className="w-4 h-4 shrink-0 text-verify-700" /> : tone === 'warn' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Info className="w-4 h-4 shrink-0" />}
            {TITLES[result.verdict.status]}
          </p>
          <ul className="space-y-1 text-ink-700">
            {result.verdict.findings.map((f, i) => (
              <li key={i} className={f.level === 'warn' ? 'font-semibold text-ink' : ''}>{f.level === 'ok' ? '✓ ' : f.level === 'warn' ? '⚠ ' : '· '}{f.text}</li>
            ))}
          </ul>
          <p className="text-[11px] text-ink-600">
            Advisory only: you decide. {result.res.exact ? 'Compared byte for byte with DoCA\'s file.' : `Fields read by AI (${result.res.model || 'Gemini'}) and compared by TULA.`}
            {result.res.register?.pdf && <> <a href={result.res.register.pdf} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5">DoCA's certificate <ExternalLink className="w-3 h-3" /></a></>}
          </p>
        </div>
      )}
    </div>
  );
};
