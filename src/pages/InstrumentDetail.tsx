import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { 
  Instrument, 
  Application, 
  VerificationCertificate, 
  InspectionRecord, 
  StampingRecord, 
  EnforcementCase, 
  AuditLogEntry 
} from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Scale, 
  MapPin, 
  Calendar, 
  Award, 
  FileText, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  FileDown, 
  History, 
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Hash
} from 'lucide-react';
import { generateCertificatePdf } from '../services/pdf';

export const InstrumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [instrument, setInstrument] = useState<Instrument | undefined>(undefined);
  const [applications, setApplications] = useState<Application[]>([]);
  const [certificates, setCertificates] = useState<VerificationCertificate[]>([]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [stampings, setStampings] = useState<StampingRecord[]>([]);
  const [enforcements, setEnforcements] = useState<EnforcementCase[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const loadData = () => {
      if (!id) return;
      const inst = storage.getInstrumentById(id);
      setInstrument(inst);

      const allApps = storage.getApplications().filter(a => a.instrumentId === id);
      setApplications(allApps);

      const allCerts = storage.getCertificates().filter(c => c.instrumentId === id);
      setCertificates(allCerts);

      const allInsps = storage.getInspections().filter(i => i.instrumentId === id);
      setInspections(allInsps);

      const allStamps = storage.getStampings().filter(s => s.instrumentId === id);
      setStampings(allStamps);

      const allEnf = storage.getEnforcementCases().filter(e => e.instrumentId === id);
      setEnforcements(allEnf);

      const allAudits = storage.getAuditLogs().filter(a => a.entityId === id);
      setAuditLogs(allAudits);
    };

    loadData();
    const unsub = storage.subscribe(loadData);
    return unsub;
  }, [id]);

  if (!instrument) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Instrument Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">No record found with UID {id}</p>
        <Link to="/instruments" className="text-xs font-semibold text-gov-700 hover:underline">
          &larr; Return to Instruments Registry
        </Link>
      </div>
    );
  }

  const currentCert = certificates.find(c => c.id === instrument.currentCertificateId) || certificates[0];
  const currentStamp = stampings.find(s => s.id === instrument.currentStampId) || stampings[0];

  // Lifecycle Stages definition
  const lifecycleStages = [
    { label: 'Registered', done: true },
    { label: 'Application', done: applications.length > 0 },
    { label: 'Scrutiny', done: applications.some(a => ['ACCEPTED', 'SCHEDULED', 'INSPECTION_IN_PROGRESS', 'COMPLETED'].includes(a.status)) },
    { label: 'Scheduled', done: applications.some(a => ['SCHEDULED', 'INSPECTION_IN_PROGRESS', 'COMPLETED'].includes(a.status)) },
    { label: 'Inspection', done: inspections.length > 0 },
    { label: 'Verified', done: inspections.some(i => i.result === 'PASS') },
    { label: 'Stamped', done: stampings.length > 0 },
    { label: 'Certificate Issued', done: certificates.length > 0 },
    { label: 'Active', done: instrument.status === 'ACTIVE' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/instruments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gov-700 hover:text-gov-900 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Instruments Registry
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {instrument.categoryName}
            </h1>
            <StatusBadge status={instrument.status} size="lg" />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
              UID: {instrument.id}
            </span>
            <span className="text-xs text-slate-500">• Occupier: {instrument.organization}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/applications/new?instrumentId=${instrument.id}`}
            className="inline-flex items-center gap-1.5 bg-gov-700 hover:bg-gov-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
          >
            Apply for Re-Verification
          </Link>
        </div>
      </div>

      {/* Visual Lifecycle Stepper */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gov-700" />
          Instrument Digital Lifecycle Flow
        </h3>
        
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center min-w-[700px] justify-between relative">
            <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-slate-200 z-0" />
            {lifecycleStages.map((st, idx) => (
              <div key={st.label} className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    st.done
                      ? 'bg-gov-700 text-white ring-4 ring-gov-100 shadow-xs'
                      : 'bg-white text-slate-400 border-2 border-slate-300'
                  }`}
                >
                  {st.done ? '✓' : idx + 1}
                </div>
                <span className={`text-[11px] font-semibold mt-1.5 ${st.done ? 'text-slate-900' : 'text-slate-400'}`}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Specifications & Certificate Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Metrological Specifications & Location */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-gov-700" />
              Metrological &amp; Technical Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Manufacturer</span>
                <p className="font-bold text-slate-900 text-sm">{instrument.manufacturer}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Model &amp; Series</span>
                <p className="font-bold text-slate-900 text-sm">{instrument.model}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Model Approval Number (DoCA)</span>
                <p className="font-mono font-bold text-gov-800 text-sm">{instrument.modelApprovalNumber}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Serial Number</span>
                <p className="font-mono font-bold text-slate-900 text-sm">{instrument.serialNumber}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Nominal Maximum Capacity</span>
                <p className="font-bold text-emerald-800 text-sm">{instrument.capacity}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Scale Interval (e / d)</span>
                <p className="font-mono font-bold text-slate-800 text-sm">{instrument.scaleInterval}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Accuracy Class</span>
                <p className="font-bold text-slate-900 text-sm">{instrument.accuracyClass.replace(/_/g, ' ')}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <span className="text-slate-500 font-medium">Next Verification Due Date</span>
                <p className={`font-bold text-sm ${instrument.status === 'EXPIRED' ? 'text-rose-700' : 'text-slate-900'}`}>
                  {instrument.nextVerificationDueDate || 'Not verified yet'}
                </p>
              </div>
            </div>

            {/* Installation & Geo Coordinates */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gov-700" />
                Physical Installation Premises
              </h4>
              <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {instrument.installationAddress} • {instrument.district}, {instrument.state}
                {instrument.latitude && (
                  <span className="block mt-1 font-mono text-[11px] text-slate-500">
                    GPS Coordinates: {instrument.latitude}, {instrument.longitude}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Stamping Details */}
          {currentStamp && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Official Stamping &amp; Physical Seal Record
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  VERIFIED &amp; STAMPED
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-emerald-50/40 p-4 rounded-lg border border-emerald-200">
                <div>
                  <span className="text-slate-500 font-medium">Stamp Identifier</span>
                  <p className="font-mono font-bold text-emerald-900 text-sm">{currentStamp.id}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Seal Mark &amp; Quarter</span>
                  <p className="font-bold text-slate-900 text-sm">{currentStamp.quarterAndYear}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Stamping Officer</span>
                  <p className="font-semibold text-slate-900">{currentStamp.officerName}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2">{currentStamp.remarks}</p>
            </div>
          )}
        </div>

        {/* Right: Active Certificate & Public QR Verification Preview */}
        <div className="space-y-6">
          {currentCert ? (
            <div className="bg-white rounded-xl border-2 border-gov-700 p-5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gov-700">Verification Certificate</span>
                    <h4 className="font-mono font-bold text-slate-900 text-sm">{currentCert.certificateNumber}</h4>
                  </div>
                  <StatusBadge status={currentCert.status} size="sm" />
                </div>

                <div className="text-center my-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col items-center">
                  <QRCodeSVG
                    value={currentCert.qrPayloadUrl}
                    size={140}
                    level="H"
                    includeMargin={true}
                    className="rounded shadow-xs"
                  />
                  <p className="text-[10px] text-slate-500 font-medium mt-2">
                    Scan to authenticate certificate on public verification portal
                  </p>
                  <Link
                    to={currentCert.qrPayloadUrl ? currentCert.qrPayloadUrl.replace(/^https?:\/\/[^/]+/, '') : `/verify/${encodeURIComponent(currentCert.certificateNumber)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gov-700 hover:text-gov-900 mt-1 hover:underline"
                  >
                    <span>Open Public Verification Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verification Date:</span>
                    <span className="font-bold text-slate-900">{currentCert.verificationDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valid Until:</span>
                    <span className="font-bold text-slate-900">{currentCert.validUntil}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Issuing Authority:</span>
                    <span className="font-semibold text-slate-900 text-right text-[11px] max-w-[160px] truncate">{currentCert.issuingAuthority}</span>
                  </div>
                </div>

                {/* Cryptographic Hash */}
                <div className="mt-3 p-2 bg-slate-900 rounded text-slate-300 font-mono text-[10px] break-all">
                  <span className="text-amber-400 font-bold block mb-0.5">SHA-256 Canonical Digest:</span>
                  {currentCert.sha256Hash}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex gap-2">
                <button
                  onClick={() => generateCertificatePdf(currentCert)}
                  className="flex-1 bg-gov-700 hover:bg-gov-800 text-white font-semibold py-2 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <FileDown className="w-4 h-4" />
                  Download PDF
                </button>
                <Link
                  to={`/certificates/${currentCert.id}`}
                  className="px-3 py-2 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                >
                  View Form
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6 text-center">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">No Active Certificate</h4>
              <p className="text-xs text-slate-500 mt-1 mb-3">This instrument has not yet completed metrological verification.</p>
              <Link
                to={`/applications/new?instrumentId=${instrument.id}`}
                className="text-xs font-bold text-gov-700 hover:underline"
              >
                Apply for Initial Verification &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Complete Historical Verification Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-gov-700" />
              Complete Verification &amp; Stamping Audit History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable chronological record of inspections, seal stampings, certificate issuances, and enforcement events.
            </p>
          </div>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {/* Certificate Event */}
          {certificates.map(cert => (
            <div key={cert.id} className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-700" /> Certificate Issued: {cert.certificateNumber}
                  </span>
                  <span className="text-[11px] text-slate-500">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-600">
                  Issued by {cert.issuingOfficerName} ({cert.issuingAuthority}). Valid till <strong>{cert.validUntil}</strong>.
                </p>
                <div className="mt-2 font-mono text-[10px] text-slate-500">SHA-256: {cert.sha256Hash}</div>
              </div>
            </div>
          ))}

          {/* Stamping Event */}
          {stampings.map(stamp => (
            <div key={stamp.id} className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-gov-700 ring-4 ring-gov-100" />
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gov-900 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-gov-700" /> Official Seal Stamped: {stamp.id}
                  </span>
                  <span className="text-[11px] text-slate-500">{new Date(stamp.stampedAt).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-600">
                  Quarter Mark: <strong>{stamp.quarterAndYear}</strong> • Officer: {stamp.officerName}
                </p>
                <p className="text-slate-500 mt-1">{stamp.remarks}</p>
              </div>
            </div>
          ))}

          {/* Inspection Event */}
          {inspections.map(insp => (
            <div key={insp.id} className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-amber-100" />
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">
                    Metrological Verification Inspection ({insp.id})
                  </span>
                  <span className="text-[11px] text-slate-500">{new Date(insp.inspectionDate).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-700 font-medium">Result: <span className="font-bold text-emerald-700">{insp.result}</span> • Inspector: {insp.inspectorName}</p>
                <p className="text-slate-500 mt-1">{insp.inspectorRemarks}</p>
                <div className="mt-2 flex gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium text-[10px]">
                    {insp.checklist.length} Checkpoints Verified
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium text-[10px]">
                    {insp.testReadings.length} MPE Test Readings Passed
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Applications Event */}
          {applications.map(app => (
            <div key={app.id} className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-sky-500 ring-4 ring-sky-100" />
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">
                    Application Submitted ({app.id})
                  </span>
                  <span className="text-[11px] text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-600">
                  Service: {app.serviceType.replace(/_/g, ' ')} • Status: <StatusBadge status={app.status} size="sm" />
                </p>
                {app.assignedToName && (
                  <p className="text-slate-500 text-[11px] mt-1">
                    Assigned to: {app.assignedToType} ({app.assignedToName})
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Enforcement Event if any */}
          {enforcements.map(enf => (
            <div key={enf.id} className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-rose-600 ring-4 ring-rose-100" />
              <div className="bg-rose-50/50 p-4 rounded-lg border border-rose-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-700" /> Regulatory Notice: {enf.id}
                  </span>
                  <span className="text-[11px] text-slate-500">{new Date(enf.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-rose-800 font-semibold">{enf.offenseCategory.replace(/_/g, ' ')} ({enf.actSection})</p>
                <p className="text-slate-600 mt-1">{enf.evidenceNotes}</p>
                <div className="mt-2 text-rose-700 font-medium">Status: {enf.status} • Penalty: ₹{enf.penaltyAmount}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
