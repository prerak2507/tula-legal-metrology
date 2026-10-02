import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { VerificationCertificate } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { QRCodeSVG } from 'qrcode.react';
import { generateCertificatePdf } from '../services/pdf';
import { calculateStatutoryFee } from '../services/rulesEngine';
import { certificateFacts } from '../services/certificateFacts';
import { Award, ArrowLeft, Printer, FileDown } from 'lucide-react';

export const CertificateView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<VerificationCertificate | undefined>(undefined);

  const [signing, setSigning] = useState(false);
  useEffect(() => {
    if (!id) return;
    const load = () => setCert(storage.getCertificateById(decodeURIComponent(id)));
    load();
    return storage.subscribe(load);
  }, [id]);

  if (!cert) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Certificate Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">No certificate registered with ID {id}</p>
        <Link to="/certificates" className="text-xs font-semibold text-gov-700 hover:underline">
          &larr; Return to Certificates
        </Link>
      </div>
    );
  }

  const facts = certificateFacts(cert);
  // Split the amount paid into the two Schedule VIII columns when today's schedule explains it exactly.
  const inst = storage.getInstrumentById(cert.instrumentId);
  const now = inst ? calculateStatutoryFee(cert.category, cert.state, storage.getFeeRules(), { capacity: cert.capacity, accuracyClass: cert.accuracyClass, atPremises: true }) : null;
  const fee = facts.feeTotal !== undefined && now && Math.abs(now.statutory + now.onSite + now.visitMinimum - facts.feeTotal) < 0.01
    ? { statutory: now.statutory.toLocaleString('en-IN'), other: (now.onSite + now.visitMinimum).toLocaleString('en-IN') }
    : { statutory: facts.feeTotal !== undefined ? facts.feeTotal.toLocaleString('en-IN') : '—', other: '—' };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar (no-print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <Link to="/certificates" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gov-700 hover:text-gov-900 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Certificates
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
              {cert.certificateNumber}
            </h1>
            <StatusBadge status={cert.status} size="lg" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg text-xs transition-colors border border-slate-300"
          >
            <Printer className="w-4 h-4" />
            Print Certificate
          </button>
          <button
            onClick={() => { void generateCertificatePdf(cert); }}
            className="inline-flex items-center gap-1.5 bg-gov-700 hover:bg-gov-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
          >
            <FileDown className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Certificate of verification in the form of Schedule VIII (rule 15(3)), print-ready */}
      <div className="relative bg-white text-ink border border-paper-400 shadow-xl print-page overflow-hidden font-plex">
        {/* Specimen marking: a prototype certificate, never valid for trade */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[110px] sm:text-[150px] font-semibold text-seal/[0.06] -rotate-[24deg] select-none tracking-widest">SPECIMEN</span>
        </div>
        <div className="relative m-2 sm:m-3 border-[3px] border-double border-ink/70 p-5 sm:p-8 space-y-5">
          {/* Heading, as in Schedule VIII */}
          <header className="text-center space-y-0.5">
            <p className="text-[11px] tracking-[0.18em] uppercase text-ink-600">{facts.form}</p>
            <p className="font-display text-lg sm:text-xl font-semibold uppercase tracking-wide">{facts.government}</p>
            <p className="text-sm font-semibold">{facts.office}</p>
            <p className="font-display text-2xl sm:text-3xl font-semibold tracking-tight pt-2">Certificate of Verification</p>
          </header>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-y border-ink/20 py-2.5 text-sm">
            <p>Name of Legal Metrology officer: <strong>{cert.issuingOfficerName}</strong>, {cert.issuingOfficerDesignation}</p>
            <p>No. <strong className="font-readout">{cert.certificateNumber}</strong></p>
          </div>

          <p className="text-sm leading-relaxed">
            I hereby certify that I have this day, <strong>{new Date(cert.verificationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>, verified and stamped the under-mentioned weighing or measuring instrument
            belonging to <strong>{cert.issuedToName}</strong>{cert.organization && cert.organization !== cert.issuedToName ? <>, <strong>{cert.organization}</strong></> : null},
            locality <strong>{cert.address}, {cert.district}, {cert.state}</strong>.
          </p>

          {/* Schedule VIII table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-ink/30 min-w-[640px]">
              <thead className="bg-paper-100">
                <tr className="text-left">
                  {['Instrument (type)', 'Capacity', 'Class', 'Manufacturer', 'Model and serial no.', 'Qty', 'Verification fee (₹)', 'Carriage, conveyance, adjusting (₹)'].map(h => (
                    <th key={h} className="border border-ink/30 px-2 py-1.5 font-semibold align-bottom">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="align-top">
                  <td className="border border-ink/30 px-2 py-2">{cert.instrumentType}<div className="text-[10px] text-ink-600 font-readout">{cert.instrumentId}</div></td>
                  <td className="border border-ink/30 px-2 py-2">{cert.capacity}<div className="text-[10px] text-ink-600">{cert.scaleInterval}</div></td>
                  <td className="border border-ink/30 px-2 py-2">{cert.accuracyClass.replace('CLASS_', '').replace(/_/g, ' ')}</td>
                  <td className="border border-ink/30 px-2 py-2">{cert.manufacturer}<div className="text-[10px] text-ink-600 font-readout">Approval {cert.modelApprovalNumber}</div></td>
                  <td className="border border-ink/30 px-2 py-2">{cert.model}<div className="text-[10px] font-readout">{cert.serialNumber}</div></td>
                  <td className="border border-ink/30 px-2 py-2 text-center">1</td>
                  <td className="border border-ink/30 px-2 py-2 font-readout text-right">{fee.statutory}</td>
                  <td className="border border-ink/30 px-2 py-2 font-readout text-right">{fee.other}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <p>Total ₹ <strong className="font-readout">{facts.feeTotal !== undefined ? facts.feeTotal.toLocaleString('en-IN') : '—'}</strong>{' '}
              {facts.receipt ? <>deposited vide receipt no. <strong className="font-readout">{facts.receipt}</strong>{facts.paidOn ? <> dated {facts.paidOn}</> : null}</> : facts.feeStatus === 'EXEMPT' ? '(exempt)' : '(receipt not recorded)'}
            </p>
            <p>Used by: <strong>{cert.organization}</strong></p>
            <p>Stamp: officer no. <strong className="font-readout">{facts.stampNumber}</strong>, quarter mark <strong className="font-readout">{facts.quarterText}</strong></p>
            <p>Seal / stamp record: <span className="font-readout">{cert.stampId}</span>; inspection <span className="font-readout">{cert.inspectionId}</span></p>
          </div>

          {/* Next verification due, signature and QR */}
          <div className="flex flex-col sm:flex-row items-stretch justify-between gap-5 border-t border-ink/20 pt-4">
            <div className="flex-1 space-y-3">
              <div className="inline-block border-2 border-ink px-4 py-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-600">Next verification due on</p>
                <p className="font-display text-2xl font-semibold">{new Date(cert.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="text-[11px] text-ink-600">{facts.validityRule}. <a href={facts.validityUrl} target="_blank" rel="noreferrer" className="underline no-print">Source: {facts.validitySource}</a></p>
              </div>
              {cert.signatureStatus === 'SIGNED' ? (
                <p className="text-[11px] text-verify-700">Digitally signed (ECDSA P-256, key <span className="font-readout">{cert.signingKid}</span>, {cert.signedAt?.slice(0, 10)}). The QR carries the signed details; a copy with any field changed fails the check.</p>
              ) : (
                <div className="text-[11px] text-ink bg-brass-200/40 border border-brass/40 rounded p-2 space-y-1.5 no-print">
                  <p><strong>Not signed yet.</strong> {cert.signingError || (cert.signatureStatus === 'LEGACY_UNSIGNED' ? 'Older record issued before signing was enabled.' : 'Waiting for the signing service.')}</p>
                  {cert.signatureStatus === 'PENDING_SIGNATURE' && (
                    <button disabled={signing} onClick={async () => { setSigning(true); await storage.signCertificate(cert.id); setSigning(false); }} className="px-3 py-1.5 rounded bg-ink text-paper font-semibold disabled:opacity-50">
                      {signing ? 'Signing…' : 'Retry signing now'}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2 text-right">
              <div className="text-center">
                <QRCodeSVG value={cert.qrPayloadUrl} size={132} level="M" includeMargin className="border border-ink/30" />
                <p className="text-[10px] font-semibold">Scan to check</p>
              </div>
              <div className="text-sm">
                <p className="font-display italic">{cert.signatureStatus === 'SIGNED' ? 'Digitally signed' : 'Signature pending'}</p>
                <p className="font-semibold">{cert.issuingOfficerName}</p>
                <p className="text-[11px] text-ink-600">Legal Metrology officer</p>
              </div>
            </div>
          </div>

          <footer className="border-t border-ink/20 pt-3 space-y-1 text-[11px] text-ink-600">
            <p>{facts.displayRule}</p>
            <p>A rejected instrument gets a separate certificate of rejection with reasons (Schedule VIII, note).</p>
            <p className="text-seal-700 font-semibold">Specimen generated by the TULA prototype for Smart India Hackathon 2026 (PS 26036). Not issued by any government office and not valid for trade.</p>
            <p>Demo data: the owner, the officer, the office and this certificate are made up for the prototype. The fee, validity period and certificate format come from the government sources linked here.</p>
            <p className="no-print">Format: <a href={facts.formUrl} target="_blank" rel="noreferrer" className="underline">{facts.form}</a> · <Link to="/sources" className="underline">All sources</Link> · <Link to={cert.qrPayloadUrl.replace(/^https?:\/\/[^/]+/, '')} className="underline">Open the public check</Link></p>
          </footer>
        </div>
      </div>
    </div>
  );
};
