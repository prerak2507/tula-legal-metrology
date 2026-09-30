import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { VerificationCertificate } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { QRCodeSVG } from 'qrcode.react';
import { generateCertificatePdf } from '../services/pdf';
import { quarterMark } from '../services/rulesEngine';
import { 
  Award, 
  ArrowLeft, 
  Printer, 
  FileDown, 
  ShieldCheck, 
  Calendar, 
  ExternalLink,
  Scale
} from 'lucide-react';

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

      {/* Official Verification Certificate Document (Print-Ready) */}
      <div className="bg-white border-4 border-gov-900 rounded-xl p-8 sm:p-12 shadow-xl print-page relative space-y-6">
        {/* Inner Gold Inset Border */}
        <div className="absolute inset-2 border-2 border-emblem-gold pointer-events-none rounded-lg" />

        {/* Certificate Header */}
        <div className="text-center space-y-1 relative z-10 border-b-2 border-slate-200 pb-5">
          <div className="w-12 h-12 mx-auto rounded-full bg-gov-900 text-white flex items-center justify-center font-bold text-xl mb-2">
            <Scale className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="font-serif font-extrabold text-xl text-gov-900 tracking-wide uppercase">
            Government of India
          </h2>
          <h3 className="font-serif font-bold text-base text-slate-800 uppercase tracking-tight">
            Department of Consumer Affairs
          </h3>
          <p className="text-xs font-serif italic text-slate-600">
            Legal Metrology Division
          </p>
          <div className="pt-2">
            <h4 className="font-serif font-bold text-lg text-gov-800 tracking-wider">
              CERTIFICATE OF VERIFICATION
            </h4>
            <p className="text-[11px] text-slate-500 max-w-xl mx-auto mt-0.5 leading-snug">
              [Issued under Section 24 of The Legal Metrology Act, 2009 and the rules made under it]
            </p>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 relative z-10">
          <div>
            <span className="text-slate-500 font-medium">Certificate Identifier:</span>
            <p className="font-mono font-extrabold text-gov-900 text-sm">{cert.certificateNumber}</p>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Instrument Digital UID:</span>
            <p className="font-mono font-extrabold text-slate-900 text-sm">{cert.instrumentId}</p>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Verification Date:</span>
            <p className="font-bold text-slate-900">{cert.verificationDate}</p>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Validity Expiration Date:</span>
            <p className="font-bold text-slate-900">{cert.validUntil} ({cert.validityMonths} months)</p>
          </div>
        </div>

        {/* Part 1: Occupier Particulars */}
        <div className="space-y-2 relative z-10">
          <h5 className="font-bold text-xs uppercase tracking-wider text-gov-900 border-b border-slate-200 pb-1">
            1. Particulars of the Occupier / Stakeholder
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pl-2">
            <div>
              <span className="text-slate-500">Business / Organization Name:</span>
              <p className="font-bold text-slate-900 text-sm">{cert.organization}</p>
            </div>
            <div>
              <span className="text-slate-500">Name of Occupier / Contact Person:</span>
              <p className="font-semibold text-slate-900">{cert.issuedToName}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500">Premises / Installation Location:</span>
              <p className="font-medium text-slate-800">{cert.address}, {cert.district}, {cert.state}</p>
            </div>
          </div>
        </div>

        {/* Part 2: Metrological Specifications */}
        <div className="space-y-2 relative z-10">
          <h5 className="font-bold text-xs uppercase tracking-wider text-gov-900 border-b border-slate-200 pb-1">
            2. Metrological Specifications of the Instrument
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pl-2 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500">Instrument Type:</span>
              <p className="font-bold text-slate-900">{cert.instrumentType}</p>
            </div>
            <div>
              <span className="text-slate-500">Manufacturer:</span>
              <p className="font-semibold text-slate-900">{cert.manufacturer}</p>
            </div>
            <div>
              <span className="text-slate-500">Model &amp; Series:</span>
              <p className="font-semibold text-slate-900">{cert.model}</p>
            </div>
            <div>
              <span className="text-slate-500">Serial Number:</span>
              <p className="font-mono font-bold text-slate-900">{cert.serialNumber}</p>
            </div>
            <div>
              <span className="text-slate-500">Nominal Capacity:</span>
              <p className="font-bold text-emerald-800">{cert.capacity}</p>
            </div>
            <div>
              <span className="text-slate-500">Scale Interval (e / d):</span>
              <p className="font-mono text-slate-800">{cert.scaleInterval}</p>
            </div>
            <div>
              <span className="text-slate-500">Accuracy Class:</span>
              <p className="font-bold text-slate-900">{cert.accuracyClass.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <span className="text-slate-500">Model Approval No:</span>
              <p className="font-mono text-gov-800 font-bold">{cert.modelApprovalNumber}</p>
            </div>
          </div>
        </div>

        {/* Part 3: Stamping & Verification Statement */}
        <div className="space-y-2 relative z-10">
          <h5 className="font-bold text-xs uppercase tracking-wider text-gov-900 border-b border-slate-200 pb-1">
            3. Metrological Verification &amp; Stamping Declaration
          </h5>
          <p className="text-xs text-slate-700 leading-relaxed pl-2">
            I hereby certify that the weighing and measuring instrument detailed above has been tested and verified in accordance with the provisions of The Legal Metrology Act, 2009 and the rules framed thereunder. The instrument satisfies all Maximum Permissible Error (MPE) tolerances, and the official verification mark/stamp has been lawfully affixed.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pl-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
            <div>
              <span className="text-slate-500">Official Stamp / Seal ID:</span>
              <p className="font-mono font-bold text-emerald-900">{cert.stampId}</p>
            </div>
            <div>
              <span className="text-slate-500">Quarter &amp; Year Seal Mark:</span>
              <p className="font-bold text-slate-900">{(() => { const m = storage.getStampings().find(s => s.id === cert.stampId)?.quarterAndYear || quarterMark(new Date(cert.verificationDate)); return `${m} (quarter ${'ABCD'.indexOf(m[0]) + 1}, 20${m.slice(-2)})`; })()}</p>
            </div>
            <div>
              <span className="text-slate-500">Inspection Record Ref:</span>
              <p className="font-mono text-slate-800">{cert.inspectionId}</p>
            </div>
          </div>
        </div>

        {/* Part 4: Cryptographic Authenticity & Public QR Code */}
        <div className="border-t-2 border-slate-200 pt-4 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <h5 className="font-bold text-xs uppercase tracking-wider text-gov-900">
              4. Cryptographic Authenticity &amp; Public Verification
            </h5>
            <div className="p-3 bg-slate-900 rounded-lg text-slate-300 font-mono text-[10px] break-all space-y-1">
              <span className="text-amber-400 font-bold block">SHA-256 record hash:</span>
              <span>{cert.sha256Hash}</span>
            </div>
            {cert.signatureStatus === 'SIGNED' ? (
              <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2">
                Signed with ECDSA P-256 key <span className="font-mono">{cert.signingKid}</span> on {cert.signedAt?.slice(0, 10)}. The QR carries the signed details, so a copy with any field changed fails the check.
              </p>
            ) : (
              <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded p-2 space-y-1.5 no-print">
                <p><strong>Not signed yet.</strong> {cert.signingError || (cert.signatureStatus === 'LEGACY_UNSIGNED' ? 'Older record issued before signing was enabled.' : 'Waiting for the signing service.')}</p>
                {cert.signatureStatus === 'PENDING_SIGNATURE' && (
                  <button disabled={signing} onClick={async () => { setSigning(true); await storage.signCertificate(cert.id); setSigning(false); }} className="px-3 py-1.5 rounded bg-amber-600 text-white font-bold disabled:opacity-50">
                    {signing ? 'Signing…' : 'Retry signing now'}
                  </button>
                )}
              </div>
            )}
            <p className="text-[10px] text-slate-500 leading-tight">
              Display this certificate where the instrument is used for trade. Anyone can scan the QR to check it, even without internet. Issued through the TULA prototype (SIH 26036).
            </p>
          </div>

          <div className="flex flex-col items-center text-center shrink-0">
            <QRCodeSVG
              value={cert.qrPayloadUrl}
              size={168}
              level="M"
              includeMargin={true}
              className="border border-slate-300 rounded shadow-xs"
            />
            <span className="text-[10px] font-semibold text-gov-800 mt-1">Scan to verify</span>
            <Link to={cert.qrPayloadUrl.replace(/^https?:\/\/[^/]+/, '')} className="text-[10px] text-gov-700 underline no-print">Open check page</Link>
          </div>
        </div>

        {/* Part 5: Signatures & Authority */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-end justify-between gap-4 relative z-10">
          <div className="text-[11px] text-slate-500">
            <p>Issuing Authority:</p>
            <p className="font-semibold text-slate-800">{cert.issuingAuthority}</p>
          </div>

          <div className="text-right text-xs">
            <div className={`font-serif italic font-bold text-sm ${cert.signatureStatus === 'SIGNED' ? 'text-gov-800' : 'text-amber-700'}`}>
              {cert.signatureStatus === 'SIGNED' ? 'Digitally signed' : 'Digital signature pending'}
            </div>
            <p className="font-bold text-slate-900 mt-1">{cert.issuingOfficerName}</p>
            <p className="text-[11px] text-slate-600">{cert.issuingOfficerDesignation}</p>
            <p className="font-mono text-[10px] text-slate-500">{cert.issuingOfficerBadgeOrGATC}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
