import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { sanitizeInput } from '../services/crypto';
import { VerificationCertificate } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Building, 
  Scale, 
  Camera,
  Upload,
  MapPin,
  Check,
  FileText,
  Printer,
  Flag,
  Globe,
  LayoutDashboard
} from 'lucide-react';
import { TulaLogo } from '../components/common/TulaLogo';

export const PublicVerify: React.FC = () => {
  const { certificateId } = useParams<{ certificateId?: string }>();
  const [searchInput, setSearchInput] = useState(certificateId || '');
  const [certificate, setCertificate] = useState<VerificationCertificate | undefined>(undefined);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [_isScanning, setIsScanning] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [submittedCaseId, setSubmittedCaseId] = useState('');
  const [reportData, setReportData] = useState({
    issueType: 'BROKEN_SEAL',
    location: '',
    description: '',
    contactPhone: '',
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const lookupCert = (term: string) => {
    const sanitized = sanitizeInput(term);
    if (!sanitized) return;
    const found = storage.getCertificateById(sanitized);
    setCertificate(found);
    setSearchInput(sanitized);
    setSearched(true);
  };

  useEffect(() => {
    const targetId = certificateId || 'CERT-2026-08912';
    setTimeout(() => {
      lookupCert(targetId);
    }, 0);
  }, [certificateId]);

  // Clean up camera stream on unmount
  useEffect(() => {
    const currentVideo = videoRef.current;
    return () => {
      if (currentVideo && currentVideo.srcObject) {
        const stream = currentVideo.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        currentVideo.srcObject = null;
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } else {
        setCameraError('Camera access not supported on this browser. Using interactive scanner simulation.');
      }
    } catch (_err: unknown) {
      setCameraError('Camera permission was denied or not available. Using interactive scanner simulation.');
      setCameraActive(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupCert(searchInput);
  };

  const handleQuickScan = (certId: string) => {
    setIsScanning(true);
    setTimeout(() => {
      lookupCert(certId);
      setIsScanning(false);
    }, 400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsScanning(true);
      // Simulate reading QR code from uploaded image
      setTimeout(() => {
        lookupCert('CERT-2026-08912');
        setIsScanning(false);
      }, 700);
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLocation = sanitizeInput(reportData.location);
    const cleanDesc = sanitizeInput(reportData.description);
    const cleanPhone = sanitizeInput(reportData.contactPhone);

    const newCase = storage.createEnforcementCase({
      businessName: certificate?.organization || 'Retail Commercial Premises',
      violatorName: certificate?.issuedToName || 'Commercial Occupier',
      location: certificate?.address || cleanLocation || 'Local Market Area',
      state: certificate?.state || 'Delhi',
      district: certificate?.district || 'South Delhi',
      instrumentId: certificate?.instrumentId || 'UNVERIFIED-SCALE',
      offenseCategory: reportData.issueType === 'BROKEN_SEAL' ? 'TAMPERED_SEAL' : reportData.issueType === 'EXPIRED_STAMP' ? 'UNVERIFIED_USE' : 'EXCEEDED_MPE_ERROR',
      actSection: reportData.issueType === 'EXPIRED_STAMP' ? 'Section 24' : 'Section 30',
      officerId: certificate?.issuingOfficerBadgeOrGATC || 'LMO-DL-CENTRAL',
      officerName: certificate?.issuingOfficerName || 'Jurisdictional LMO',
      actionTaken: 'Citizen Grievance Registered via Live QR Portal. Spot verification notice dispatched under Section 31.',
      status: 'OPEN',
      penaltyAmount: 5000,
      evidenceNotes: `${reportData.issueType}: ${cleanDesc}. Consumer Contact: ${cleanPhone || 'Anonymous Citizen'}`
    });
    setSubmittedCaseId(newCase.id);
    setReportSubmitted(true);
    storage.addAuditLog(
      'TAMPER_REPORT_FILED',
      'ENFORCEMENT',
      newCase.id,
      `Citizen grievance ${newCase.id} filed for ${certificate?.certificateNumber || searchInput}: ${reportData.issueType}`
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <TulaLogo variant="full" theme="light" size="md" />
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-[#0070C0]" />
            <span>Landing Page</span>
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1F497D] hover:bg-[#163a66] text-white text-xs font-bold transition-colors shadow-2xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Enter Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Banner */}
      <div className="text-center space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Statutory Schedule IX Public Verification Engine</span>
            <span className="text-slate-300">•</span>
            <span>Legal Metrology Act, 2009 (Section 24)</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Universal Citizen Access • No Login Required</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Live Metrology QR Verification &amp; Seal Authenticity
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Verify physical stamping seals, Maximum Permissible Error (MPE) compliance, and legal validity periods for commercial weighing and measuring instruments across India in real-time.
        </p>

        {/* Public Access Stat Callout */}
        <div className="max-w-2xl mx-auto bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-left flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">
            ⚖️
          </div>
          <div className="space-y-0.5 text-xs text-amber-950">
            <p className="font-bold text-[12px] text-amber-900">
              Why is this scanner open to every citizen on the front page without login?
            </p>
            <p className="text-[11px] text-amber-800/90 leading-relaxed font-normal">
              Under <strong>Section 24 of The Legal Metrology Act, 2009</strong> and the <strong>Consumer Protection Act, 2019</strong>, every Indian citizen is statutorily entitled to verify that any commercial scale, weighbridge, or fuel dispenser is legally tested and stamped. Zero login friction empowers consumers to immediately expose counterfeit lead seals and protect fair trade on the ground.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Scanner & Lookup Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 text-xs font-bold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'camera'
                ? 'border-[#0070C0] text-[#1F497D] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-[#0070C0] text-[#1F497D] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload QR Sticker</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-[#0070C0] text-[#1F497D] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Manual Certificate Search</span>
          </button>
        </div>

        {/* Tab 1: Live Camera Scanner */}
        {activeTab === 'camera' && (
          <div className="p-6 space-y-5">
            <div className="relative max-w-md mx-auto aspect-square rounded-2xl bg-slate-950 overflow-hidden border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center text-white">
              {/* Actual Video Stream if Camera Allowed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />

              {/* Viewfinder Overlay HUD */}
              <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                {/* 4 Corner Targeting Reticles */}
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-[#0070C0]" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-[#0070C0]" />
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-[#0070C0]" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-[#0070C0]" />
                </div>
              </div>

              {/* Animated Laser Scanning Beam */}
              <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-laserScan pointer-events-none" />

              {/* Simulated Center QR Display */}
              {!cameraActive && (
                <div className="text-center p-6 space-y-3 z-10">
                  <div className="w-24 h-24 mx-auto bg-white p-2 rounded-xl shadow-lg border border-slate-300">
                    <QRCodeSVG
                      value={certificate?.qrPayloadUrl || 'http://localhost:5173/verify/CERT-2026-08912'}
                      size={80}
                      level="M"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-sky-300">Point Camera at Scale QR Sticker</p>
                    <p className="text-[10px] text-slate-400">Aim within viewfinder reticle</p>
                  </div>
                </div>
              )}

              {/* Camera Trigger Toggle */}
              <div className="absolute bottom-3 inset-x-0 flex justify-center z-10">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-[11px] font-semibold text-white transition-colors"
                  >
                    <Camera className="w-3 h-3 text-sky-300" />
                    <span>Enable Real Device Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/80 hover:bg-rose-700 backdrop-blur-md text-[11px] font-semibold text-white transition-colors"
                  >
                    <span>Turn Off Camera</span>
                  </button>
                )}
              </div>
            </div>

            {cameraError && (
              <p className="text-[11px] text-slate-500 text-center">{cameraError}</p>
            )}

            {/* Quick Test Preset Buttons */}
            <div className="space-y-2">
              <p className="text-center text-xs font-bold text-slate-700">
                Or Click Any Scenario to Test Instant Verification:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleQuickScan('CERT-2026-08912')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    searchInput === 'CERT-2026-08912'
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-emerald-700 block">🟢 Valid LMO</span>
                  <p className="font-mono text-xs font-bold text-slate-900 mt-0.5">CERT-2026-08912</p>
                  <p className="text-[10px] text-slate-500">150kg Scale • Insp. Sharma</p>
                </button>

                <button
                  onClick={() => handleQuickScan('CERT-2026-01994')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    searchInput === 'CERT-2026-01994'
                      ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-blue-700 block">🔬 GATC Lab Valid</span>
                  <p className="font-mono text-xs font-bold text-slate-900 mt-0.5">CERT-2026-01994</p>
                  <p className="text-[10px] text-slate-500">CNG Flow • Dr. Patel</p>
                </button>

                <button
                  onClick={() => handleQuickScan('CERT-2025-10101')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    searchInput === 'CERT-2025-10101'
                      ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-amber-700 block">🟡 Expired Stamping</span>
                  <p className="font-mono text-xs font-bold text-slate-900 mt-0.5">CERT-2025-10101</p>
                  <p className="text-[10px] text-slate-500">Re-verification Overdue</p>
                </button>

                <button
                  onClick={() => handleQuickScan('CERT-2025-09999')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    searchInput === 'CERT-2025-09999'
                      ? 'border-rose-500 bg-rose-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-rose-700 block">🔴 Revoked / Tampered</span>
                  <p className="font-mono text-xs font-bold text-slate-900 mt-0.5">CERT-2025-09999</p>
                  <p className="text-[10px] text-slate-500">Severed Wire • Sec 30</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Upload QR Sticker Image */}
        {activeTab === 'upload' && (
          <div className="p-8 text-center space-y-4">
            <div className="max-w-md mx-auto p-8 border-2 border-dashed border-slate-300 hover:border-[#0070C0] rounded-2xl bg-slate-50 transition-colors">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-slate-800">Upload Photo of Physical QR Sticker</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Take a photo of the QR code printed on the instrument nameplate or verification seal
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1F497D] hover:bg-[#163a66] text-white font-bold text-xs cursor-pointer shadow-xs transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <span>Select Image File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              Supports JPG, PNG, and HEIC files up to 10MB
            </p>
          </div>
        )}

        {/* Tab 3: Manual Search */}
        {activeTab === 'manual' && (
          <div className="p-6">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Enter Certificate No. (e.g. DL/LM/2026/08912) or CERT ID..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm focus:ring-2 focus:ring-[#0070C0] focus:bg-white font-mono"
                />
              </div>
              <button
                type="submit"
                className="bg-[#1F497D] hover:bg-[#163a66] text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition-colors shadow-sm shrink-0 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Record</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Verification Result Card */}
      {searched && (
        certificate ? (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl animate-in fade-in duration-200">
            {/* Authenticity Header Banner */}
            <div className={`p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              certificate.status === 'VALID'
                ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800'
                : certificate.status === 'EXPIRED'
                ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700'
                : 'bg-gradient-to-r from-rose-800 via-rose-700 to-red-900'
            }`}>
              <div className="flex items-center gap-4">
                {certificate.status === 'VALID' ? (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-8 h-8 text-emerald-200" />
                  </div>
                ) : certificate.status === 'EXPIRED' ? (
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/30 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-8 h-8 text-amber-200" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/30 border border-rose-400/40 flex items-center justify-center shrink-0">
                    <XCircle className="w-8 h-8 text-rose-200" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 block">
                    DoCA Central Metrology Register • Schedule IX Verified
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
                    {certificate.status === 'VALID' && 'GENUINE & LAWFULLY ACTIVE'}
                    {certificate.status === 'EXPIRED' && 'STAMPING EXPIRED — RE-VERIFICATION DUE'}
                    {certificate.status === 'REVOKED' && 'CERTIFICATE REVOKED / TAMPERED SEAL'}
                  </h3>
                </div>
              </div>
              <StatusBadge status={certificate.status} size="lg" />
            </div>

            {/* Revocation Warning Box if Revoked */}
            {certificate.status === 'REVOKED' && (
              <div className="p-4 bg-rose-50 border-b border-rose-200 text-xs text-rose-900 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold">🚨 Enforcement Action Taken Under Section 30:</p>
                  <p className="leading-relaxed">
                    {certificate.revocationReason || 'Physical lead seal wire was severed or calibrated potentiometer altered. Commercial trading with this instrument constitutes a statutory criminal offense.'}
                  </p>
                </div>
              </div>
            )}

            {/* Expired Warning Box */}
            {certificate.status === 'EXPIRED' && (
              <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold">⚠️ Re-Verification Overdue (Section 24 Violation):</p>
                  <p className="leading-relaxed">
                    The statutory 12-month validity window for this weighing instrument ended on <strong>{certificate.validUntil}</strong>. The occupier must apply for re-verification immediately to avoid Section 48 compounding fines.
                  </p>
                </div>
              </div>
            )}

            {/* Comprehensive Metrological Details */}
            <div className="p-6 space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium">Certificate Identifier</span>
                  <p className="font-mono font-bold text-[#1F497D] text-sm">{certificate.certificateNumber}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium">Instrument UID</span>
                  <p className="font-mono font-bold text-slate-800 text-sm">{certificate.instrumentId}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium">Official Stamp / Lead Seal</span>
                  <p className="font-mono font-bold text-slate-900 text-sm">{certificate.stampId}</p>
                  <span className="text-[10px] text-emerald-700 font-bold">Insignia Quarter: A-26</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium">Category &amp; Make</span>
                  <p className="font-bold text-slate-900 text-sm">{certificate.instrumentType}</p>
                  <p className="text-[11px] text-slate-500">{certificate.manufacturer} • {certificate.model}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium">Nominal Maximum Capacity</span>
                  <p className="font-bold text-emerald-800 text-sm">{certificate.capacity}</p>
                  <p className="text-[10px] text-slate-500">Accuracy: {certificate.accuracyClass.replace('_', ' ')} • {certificate.scaleInterval}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium">Model Approval Number</span>
                  <p className="font-mono font-semibold text-slate-800 text-sm">{certificate.modelApprovalNumber}</p>
                  <span className="text-[10px] text-blue-700 font-medium">DoCA Central Model Approved</span>
                </div>
              </div>

              {/* Authorized Premises & Geo-Coordinates */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#1F497D]" />
                    <span className="font-bold text-slate-900 text-xs">Lawfully Registered Operating Premises</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    {certificate.organization} — {certificate.address}, {certificate.district}, {certificate.state}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Occupier / Contact: <strong>{certificate.issuedToName}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-3 py-1.5 rounded-xl shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Geo-Locked Location Approved</span>
                </div>
              </div>

              {/* Statutory Validity Window */}
              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-950">
                <div className="space-y-0.5">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-blue-800">
                    Statutory Validity Period (Section 24)
                  </span>
                  <p className="text-sm font-extrabold text-[#1F497D]">
                    {certificate.verificationDate} to {certificate.validUntil}
                  </p>
                </div>
                <div className="text-[11px] text-blue-900 font-medium text-right sm:text-right">
                  <p>Issuing Authority:</p>
                  <p className="font-bold text-slate-900">{certificate.issuingAuthority}</p>
                  <p className="text-slate-600">{certificate.issuingOfficerName} ({certificate.issuingOfficerBadgeOrGATC})</p>
                </div>
              </div>

              {/* Cryptographic Digest */}
              <div className="p-3.5 bg-slate-950 rounded-2xl text-slate-300 font-mono text-[10px] break-all border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold">SHA-256 Metrological Integrity Seal:</span>
                  <span className="text-[9px] text-slate-500">Tamper-Proof</span>
                </div>
                <p className="text-slate-400">{certificate.sha256Hash}</p>
              </div>

              {/* Citizen Actions Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-bold text-xs transition-colors"
                >
                  <Flag className="w-3.5 h-3.5 text-rose-600" />
                  <span>Report Broken Seal / Meter Tampering</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>

                  <Link
                    to={`/certificates/${certificate.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1F497D] hover:bg-[#163a66] text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Official Schedule IX &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3 shadow-md animate-in fade-in duration-200">
            <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="font-bold text-slate-900 text-lg">No Matching Certificate Record Found</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              The identifier <strong className="font-mono text-slate-900">{searchInput}</strong> does not exist in the official Legal Metrology National Verification registry. Instruments operating without verified certificates are unlawful under Section 24 of The Legal Metrology Act, 2009.
            </p>
          </div>
        )
      )}

      {/* Statutory Citizen Empowerment & Architecture Context */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="max-w-2xl space-y-1">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#0070C0]">
            <Scale className="w-3.5 h-3.5" />
            <span>Statutory Citizen Charter • Legal Metrology Act, 2009</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Why the Live QR Scanner is Kept Publicly Accessible to Everyone
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unlike internal department tools, TULA places the Live QR Verification Scanner on the front portal, completely unauthenticated and accessible to all 1.4 billion citizens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0070C0] flex items-center justify-center text-sm font-bold">
              1
            </div>
            <h4 className="font-bold text-xs text-slate-900">Statutory Right under Section 24</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Every consumer entering a retail transaction has the lawful right under the Legal Metrology Act and Consumer Protection Act, 2019 to inspect verified stamping before purchase.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#1B7F5A] flex items-center justify-center text-sm font-bold">
              2
            </div>
            <h4 className="font-bold text-xs text-slate-900">Eliminating Physical Seal Forgery</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Traditional lead-and-wire seals can be visually faked with pliers. Scanning the live QR directly queries the state cryptographic ledger to confirm authentic officer signatures.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-sm font-bold">
              3
            </div>
            <h4 className="font-bold text-xs text-slate-900">Zero-Friction Grievance Lodging</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              If a scan flags an instrument as EXPIRED, REVOKED, or OUT-OF-TOLERANCE, citizens can lodge an official grievance in seconds without signing up or facing bureaucratic obstacles.
            </p>
          </div>
        </div>
      </div>

      {/* Grievance / Tampering Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <Flag className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">
                  Report Statutory Metrology Violation
                </h3>
              </div>
              <button
                onClick={() => { setIsReportModalOpen(false); setReportSubmitted(false); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Grievance Registered in National Metrology Registry</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Official Enforcement Case ID: <strong className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{submittedCaseId || 'ENF-2026-0089'}</strong>.
                  Notice has been generated and dispatched to the jurisdictional Controller &amp; LMO for site inspection under Section 30.
                </p>
                <button
                  onClick={() => { setIsReportModalOpen(false); setReportSubmitted(false); }}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
                <p className="text-[11px] text-slate-500">
                  Consumer protection submission regarding instrument <strong>{certificate?.certificateNumber || searchInput}</strong>.
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Violation Category</label>
                  <select
                    value={reportData.issueType}
                    onChange={e => setReportData({ ...reportData, issueType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="BROKEN_SEAL">Broken / Severed Lead Verification Seal (Sec 30)</option>
                    <option value="SHORT_WEIGHT">Short Weight / Measurement Dispensed (Sec 30)</option>
                    <option value="EXPIRED_STAMP">Trading with Expired Verification Stamp (Sec 24)</option>
                    <option value="UNAUTHORIZED_PREMISES">Instrument Moved Away From Registered Premises (Rule 23)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location Details / Shop Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Counter 3, Okhla Mandi, Delhi..."
                    value={reportData.location}
                    onChange={e => setReportData({ ...reportData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Observations / Evidence Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe what you observed (e.g. scale read 100g before any item was placed)..."
                    value={reportData.description}
                    onChange={e => setReportData({ ...reportData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
                  >
                    Lodge Official Grievance
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
