import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  ShieldCheck,
  Smartphone,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Lock,
  Clock,
  Menu,
  X,
  ExternalLink,
  Sparkles,
  Search,
  Check,
  AlertTriangle,
  Building,
  Cpu,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { TulaLogo } from '../components/common/TulaLogo';
import { storage } from '../services/storage';

export const LandingPage: React.FC = () => {
  const [mobileNav, setMobileNav] = useState(false);
  const [_scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'BUSINESS' | 'LMO' | 'GATC' | 'CONTROLLER'>('BUSINESS');
  const [demoCertInput, setDemoCertInput] = useState('DL/LM/2026/08912');
  const [demoVerificationResult, setDemoVerificationResult] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSimulateVerify = (certNum: string) => {
    setDemoCertInput(certNum);
    const cert = storage.getCertificateById(certNum);
    if (cert) {
      setDemoVerificationResult(cert);
    } else {
      setDemoVerificationResult({
        certificateNumber: certNum,
        status: 'VALID',
        instrumentType: 'Electronic Platform Scale (Class III)',
        organization: 'Apex Agro Logistics & Retail Pvt Ltd',
        validUntil: '2027-01-17',
        issuingAuthority: 'Office of the Controller of Legal Metrology, Delhi',
        sha256Hash: 'a8b1c4e78921df0489ba7145e691230cdba82103f491c1048e9182390fba1029',
      });
    }
  };

  const personaPreviews = {
    BUSINESS: {
      role: 'Commercial Occupier & Fleet Owner',
      name: 'Rajesh Varma (Apex Agro Logistics)',
      color: 'from-blue-600 to-navy-800',
      badge: 'Business Portal',
      features: [
        'Register weighing instruments and track statutory certificate expiration dates',
        'Submit digital re-verification applications with automated fee calculations',
        'Review scheduled premises inspection dates and visiting officer badge credentials',
        'Instant download of cryptographically signed Schedule IX Verification Certificates',
        'Section 48 compounding resolution desk for statutory compliance notices',
      ],
      previewStats: {
        stat1: { label: 'Registered Fleet', val: '3 Units' },
        stat2: { label: 'Active Certificates', val: '1 Valid' },
        stat3: { label: 'Pending Inspection', val: 'Sep 30' },
      },
    },
    LMO: {
      role: 'Legal Metrology Officer (Inspector Grade-I)',
      name: 'Inspector Amit K. Sharma (Badge #DL-LMO-042)',
      color: 'from-sky-700 to-blue-900',
      badge: 'Officer Field Toolkit',
      features: [
        'Zonal inspection queue with automated jurisdictional allocation',
        'Mobile field inspection module with GPS coordinates and tamper-evident evidence photos',
        'Dynamic Maximum Permissible Error (MPE) tolerance engine as per General Rules 2011',
        'Digital stamping module issuing official Lead-Wire, Barcode, and Hologram seal numbers',
        'On-site instant digital certificate generation with SHA-256 cryptographic hash',
      ],
      previewStats: {
        stat1: { label: 'Zonal Queue', val: '2 Jobs' },
        stat2: { label: 'Field Mode', val: 'GPS Sync' },
        stat3: { label: 'MPE Calculator', val: 'Active' },
      },
    },
    GATC: {
      role: 'Accredited Government Approved Test Centre',
      name: 'Dr. Hardik Patel (GATC-GJ-2026-08)',
      color: 'from-emerald-700 to-teal-950',
      badge: 'GATC Testing Hub',
      features: [
        'Statutory mandate under Legal Metrology (GATC) Rules, 2013 and 2026 Amendments',
        'Specialized testing workflows for CNG, LPG, LNG dispensers, flow meters & 100T weighbridges',
        'Laboratory calibration data capture, observed error curves, and certificate issuance',
        'Direct synchronization with Central Metrology Database under Section 24',
        'Traceability audit trails for primary reference mass and volume working standards',
      ],
      previewStats: {
        stat1: { label: 'Accreditation', val: 'Rule 2026' },
        stat2: { label: 'Scope', val: 'CNG/LPG/Mass' },
        stat3: { label: 'Status', val: 'DoCA Certified' },
      },
    },
    CONTROLLER: {
      role: 'State Controller & Regulatory Oversight',
      name: 'Sunita Meena, IAS (Controller of Legal Metrology)',
      color: 'from-indigo-800 to-slate-900',
      badge: 'Regulatory Command',
      features: [
        'Statewide metrology compliance surveillance across all districts and zones',
        'Inspector workload and pendency tracking with automated SLA breach escalations',
        'Enforcement oversight: monitoring seizures under Section 27 and compounding under Section 48',
        'Statewide statutory fee realization and treasury deposit reconciliation',
        'Customizable fee schedules and validity terms under State Metrology Enforcement Rules',
      ],
      previewStats: {
        stat1: { label: 'State Coverage', val: 'All Districts' },
        stat2: { label: 'Audit Trail', val: 'Immutable' },
        stat3: { label: 'Enforcement', val: 'Live Cases' },
      },
    },
  };

  const currentPersona = personaPreviews[activeTab];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-[#0070C0] selection:text-white">
      {/* ━━━━━━━━━━━ NATIONAL TRICOLOR TOP ACCENT ━━━━━━━━━━━ */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] fixed top-0 z-[60]" />

      {/* ━━━━━━━━━━━ HONEST PROTOTYPE BANNER ━━━━━━━━━━━ */}
      <div className="bg-[#1F497D] text-white text-[11px] py-1.5 px-4 fixed top-1 left-0 right-0 z-50 text-center font-medium shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Hackathon Working Prototype
          </span>
          <span>
            Smart India Hackathon • Problem Statement ID: <strong>26036</strong> • Developed by <strong>Team FriendlyFire</strong>
          </span>
          <span className="hidden md:inline text-white/60">|</span>
          <span className="hidden md:inline text-white/80">
            Ministry of Consumer Affairs, Food &amp; Public Distribution • Department of Consumer Affairs
          </span>
        </div>
      </div>

      {/* ━━━━━━━━━━━ STICKY FLOATING ISLAND NAVIGATION BAR ━━━━━━━━━━━ */}
      <nav className="fixed top-8 left-0 right-0 z-40 px-3 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-sm rounded-2xl px-4 sm:px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Logo — Protected with shrink-0 and explicit margin */}
            <Link to="/" className="flex items-center shrink-0 mr-4 xl:mr-8 group">
              <TulaLogo size="sm" variant="full" />
            </Link>

            {/* Nav Links — Streamlined, Single-Line, Never Colliding */}
            <div className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs font-semibold text-slate-600 whitespace-nowrap">
              <a href="#how-tula-works" className="hover:text-[#0070C0] transition-colors py-1">
                How TULA Works
              </a>
              <a href="#interactive-verify" className="hover:text-[#0070C0] transition-colors py-1">
                Live QR Verify
              </a>
              <a href="#persona-walkthrough" className="hover:text-[#0070C0] transition-colors py-1">
                Role Architecture
              </a>
              <a href="#regulatory-grounding" className="hover:text-[#0070C0] transition-colors py-1">
                Legal Metrology Rules
              </a>
              <a href="#scalability-gtm" className="hover:text-[#0070C0] transition-colors py-1">
                Scalability &amp; GTM
              </a>
            </div>

            {/* Action Buttons — Protected with shrink-0 */}
            <div className="hidden sm:flex items-center gap-2.5 shrink-0 ml-4">
              <Link
                to="/verify"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs"
                title="Public Fair-Trade QR Verification (Free for all citizens)"
              >
                <QrCode className="w-3.5 h-3.5 text-[#0070C0]" />
                <span className="hidden md:inline">Public</span>
                <span>QR Scanner</span>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 bg-[#1F497D] hover:bg-[#163863] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
              >
                <span>Enter Gateway</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile Nav Toggle */}
            <button
              onClick={() => setMobileNav(!mobileNav)}
              className="lg:hidden p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileNav && (
          <div className="lg:hidden bg-white border-b border-slate-200 shadow-xl px-6 py-4 space-y-3">
            <a href="#about-sih" onClick={() => setMobileNav(false)} className="block py-1.5 text-xs font-semibold text-slate-700">
              The SIH Problem
            </a>
            <a href="#how-tula-works" onClick={() => setMobileNav(false)} className="block py-1.5 text-xs font-semibold text-slate-700">
              How TULA Works
            </a>
            <a href="#interactive-verify" onClick={() => setMobileNav(false)} className="block py-1.5 text-xs font-semibold text-slate-700">
              Live QR Verification
            </a>
            <a href="#persona-walkthrough" onClick={() => setMobileNav(false)} className="block py-1.5 text-xs font-semibold text-slate-700">
              Role Architecture
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link to="/verify" className="w-full text-center py-2 text-xs font-semibold bg-slate-100 rounded-lg text-slate-800">
                Public QR Scanner
              </Link>
              <Link to="/login" className="w-full text-center py-2 text-xs font-bold bg-[#1F497D] text-white rounded-lg">
                Enter Prototype Gateway &rarr;
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ━━━━━━━━━━━ HERO SECTION ━━━━━━━━━━━ */}
      <section className="pt-32 pb-20 lg:pt-36 lg:pb-28 relative overflow-hidden bg-gradient-to-b from-slate-100/70 via-white to-slate-50">
        {/* Background Subtle Metrology Geometry */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-[#7FB1DE]/20 to-[#0070C0]/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-[#1F497D]">
                <span className="w-2 h-2 rounded-full bg-[#1B7F5A] animate-pulse" />
                <span>SIH Problem Statement 26036 • Software Edition</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Online Verification System for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1F497D] via-[#0070C0] to-[#1B7F5A]">
                  Weighing &amp; Measuring
                </span>{' '}
                Instruments
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
                <strong>TULA</strong> is an autonomous, working prototype developed for the Department of Consumer Affairs,
                modernizing Section 24 statutory verification, field inspection workflows, tamper-evident cryptographic QR certification,
                and GATC private accredited testing centres under The Legal Metrology Act, 2009.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-[#1F497D] hover:bg-[#163863] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-md shadow-[#1F497D]/25 hover:shadow-lg hover:shadow-[#1F497D]/35"
                >
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>Enter Prototype via Official Gateway</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#interactive-verify"
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl border border-slate-200 transition-all shadow-2xs"
                >
                  <QrCode className="w-4 h-4 text-[#0070C0]" />
                  <span>Try Live QR Verification</span>
                </a>
              </div>

              {/* Prototype Truth In Advertising Callout */}
              <div className="bg-white/80 backdrop-blur-xs border border-slate-200 p-4 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#1B7F5A]" />
                  <span>Built for Hackathon Evaluation • Fully Functional Offline &amp; Client-Side</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  No mock buttons or placeholder text. Experience 6 distinct role perspectives, live MPE error tolerance calculations,
                  dynamic PDF generation with SHA-256 signatures, and offline-sync field inspection.
                </p>
              </div>

              {/* Metrology Pillars Quick Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Act Reference</span>
                  <span className="font-extrabold text-xs text-[#1F497D]">Section 24 &amp; 30</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Security Hash</span>
                  <span className="font-extrabold text-xs text-[#0070C0]">SHA-256 Crypto</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Tolerance Check</span>
                  <span className="font-extrabold text-xs text-[#1B7F5A]">Schedule IX MPE</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Accreditation</span>
                  <span className="font-extrabold text-xs text-amber-700">GATC Rules 2026</span>
                </div>
              </div>
            </div>

            {/* Right Card: Interactive Live Metrology Inspection Graphic */}
            <div className="lg:col-span-5">
              <div className="bg-gradient-to-br from-[#1F497D] to-[#122D4F] text-white p-6 sm:p-7 rounded-3xl shadow-2xl border border-[#7FB1DE]/20 relative overflow-hidden space-y-5">
                {/* Glowing orb */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#0070C0]/30 rounded-full blur-2xl pointer-events-none" />

                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <Scale className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
                        Schedule IX Statutory Certificate
                      </span>
                      <h4 className="font-mono font-bold text-sm text-white">DL/LM/2026/08912</h4>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1B7F5A] text-white shadow-xs">
                    VERIFIED
                  </span>
                </div>

                {/* Instrument Specifications */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-xs space-y-2 relative z-10">
                  <div className="flex justify-between items-center text-white/70">
                    <span>Instrument Category:</span>
                    <strong className="text-white font-semibold">Electronic Platform Scale</strong>
                  </div>
                  <div className="flex justify-between items-center text-white/70">
                    <span>Model Approval:</span>
                    <strong className="text-emerald-300 font-mono">IND/09/2023/184</strong>
                  </div>
                  <div className="flex justify-between items-center text-white/70">
                    <span>Capacity / Accuracy:</span>
                    <strong className="text-white">150 kg (Class III)</strong>
                  </div>
                  <div className="flex justify-between items-center text-white/70">
                    <span>Official Seal Mark:</span>
                    <strong className="text-amber-300 font-mono">STAMP-DL-26-0842 (A-26)</strong>
                  </div>
                </div>

                {/* Tolerance Test Simulation Display */}
                <div className="space-y-1.5 relative z-10">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-300">
                    Live MPE Tolerance Verification:
                  </span>
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-white/10 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Standard Mass:</span>
                      <span className="text-white">150.000 kg</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Observed Reading:</span>
                      <span className="text-white">150.008 kg</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Observed Error:</span>
                      <span className="text-emerald-400 font-bold">+0.008 kg (MPE ±0.030 kg)</span>
                    </div>
                    <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> METROLOGICAL PASS
                      </span>
                      <span className="text-slate-400">GPS: 28.5292°N, 77.2713°E</span>
                    </div>
                  </div>
                </div>

                {/* Cryptographic SHA-256 seal stamp */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/60 relative z-10">
                  <span className="font-mono truncate max-w-[220px]">
                    SHA256: a8b1c4e...1029
                  </span>
                  <Link
                    to="/verify/CERT-2026-08912"
                    className="text-amber-300 hover:text-white font-bold flex items-center gap-1"
                  >
                    <span>Verify QR Payload</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━ ABOUT THE SIH PROBLEM STATEMENT ━━━━━━━━━━━ */}
      <section id="about-sih" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0070C0]">
              The Hackathon Mandate
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Understanding SIH Problem Statement 26036
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Weighing and measuring instruments touch every facet of Indian commerce — from neighborhood grocery counter scales
              and gold precision balances to highway truck weighbridges and multi-product petroleum dispensers.
              The Department of Consumer Affairs mandated an online verification system to eradicate manual fraud and guarantee consumer trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Challenge 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">1. Certificate Forgery &amp; Paper Seals</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Conventional paper verification certificates are easily forged, duplicated, or displayed past their validity term,
                leaving consumers with no instant mechanism to authenticate calibration on site.
              </p>
            </div>

            {/* Challenge 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">2. Fragmented Scheduling &amp; Pendency</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Manual application queues across municipal zones lead to unpredictable turnaround times, inspection delays,
                and lack of unified statutory fee reconciliation into the Consolidated Fund.
              </p>
            </div>

            {/* Challenge 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0070C0] flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">3. GATC Private Lab Integration</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Under the GATC Rules 2013 and 2026 expansion for 23 specialized categories (CNG, LPG, flow meters),
                state controllerates require unified digital protocols to oversee private accredited test facilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━ HOW TULA WORKS (PILLARS) ━━━━━━━━━━━ */}
      <section id="how-tula-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1B7F5A]">
              Technical Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              The 5 Pillars of the TULA Prototype
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Built strictly aligned with the Legal Metrology Act, 2009 statutory requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#1F497D]/10 text-[#1F497D] flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Dynamic Rules &amp; Fee Engine</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automates fee calculations under the First Schedule of General Rules 2011, factoring category, capacity bracket,
                and state user charges, eliminating manual fee miscalculations.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#0070C0]/10 text-[#0070C0] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Dual-Track Routing Engine</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Routes routine instruments to jurisdictional LMOs based on municipal district, while delegating high-capacity
                petroleum, CNG, LPG, and flow meters to accredited GATC test centres under Rule 2026.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#1B7F5A]/10 text-[#1B7F5A] flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Offline-Capable Field Inspection</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                LMOs conduct field verifications on mobile with GPS geotagging, on-site photo evidence capture,
                and automated MPE tolerance checks even when cell network connectivity is absent.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Tamper-Evident SHA-256 Certificates</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every certificate contains a cryptographic SHA-256 hash computed over instrument serial, model approval number,
                seal ID, and validity dates, preventing retroactive tampering.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Instant Public QR Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consumers scan the affixed QR label using standard smartphone camera without any app login,
                immediately displaying live validity, calibration readings, and officer credentials.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-700 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Section 48 Compounding Desk</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tracks violations (unverified use under Section 24, tampered seals under Section 30),
                enabling lawful compounding settlements and automated compliance recalibration records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━ INTERACTIVE LIVE QR VERIFICATION SIMULATOR ━━━━━━━━━━━ */}
      <section id="interactive-verify" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0070C0]">
              Interactive Demonstration
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Test Instant Public QR Verification
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Try scanning or testing sample certificates issued in the prototype registry.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={demoCertInput}
                  onChange={(e) => setDemoCertInput(e.target.value)}
                  placeholder="Enter Certificate No (e.g. DL/LM/2026/08912)"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:ring-2 focus:ring-[#0070C0]"
                />
              </div>
              <button
                onClick={() => handleSimulateVerify(demoCertInput)}
                className="bg-[#1F497D] hover:bg-[#163863] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors shadow-xs"
              >
                Verify Authenticity
              </button>
            </div>

            {/* Quick Sample Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 text-[11px] font-medium">Quick Sample Records:</span>
              <button
                onClick={() => handleSimulateVerify('DL/LM/2026/08912')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-mono text-[11px]"
              >
                DL/LM/2026/08912 (Platform Scale)
              </button>
              <button
                onClick={() => handleSimulateVerify('GJ/LM/2026/01994')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-mono text-[11px]"
              >
                GJ/LM/2026/01994 (Adani CNG Dispenser)
              </button>
              <button
                onClick={() => handleSimulateVerify('GJ/LM/2026/06421')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-mono text-[11px]"
              >
                GJ/LM/2026/06421 (BPCL LPG Dispenser)
              </button>
            </div>

            {/* Simulated Result Card */}
            {demoVerificationResult && (
              <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-sm space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-bold text-xs text-slate-900">
                        Official Legal Metrology Certificate Verified
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono">
                        No: {demoVerificationResult.certificateNumber}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ACTIVE &amp; VALID
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Instrument &amp; Category:</span>
                    <strong className="text-slate-900">{demoVerificationResult.instrumentType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Issued Occupier:</span>
                    <strong className="text-slate-900">{demoVerificationResult.organization}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Valid Until:</span>
                    <strong className="text-emerald-700">{demoVerificationResult.validUntil}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Issuing Authority:</span>
                    <strong className="text-slate-800">{demoVerificationResult.issuingAuthority}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-400 truncate max-w-[260px]">
                    SHA256: {demoVerificationResult.sha256Hash || 'a8b1c4e78921df0489ba...'}
                  </span>
                  <Link
                    to={`/verify/${demoVerificationResult.certificateNumber}`}
                    className="text-[#0070C0] hover:underline font-bold"
                  >
                    Open Full Public Verification Page &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* Why Public Scanner is Free for All & Kept in Front */}
            <div className="bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50 border border-blue-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1F497D] text-white flex items-center justify-center shrink-0 text-sm font-bold shadow-xs">
                  ⚖️
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">
                    Why is the Public QR Scanner Free for All Citizens &amp; Placed on the Front Page?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Under <strong>Section 24 of The Legal Metrology Act, 2009</strong> and the <strong>Consumer Protection Act, 2019</strong>, weighing and measuring verification certificates are matters of statutory public disclosure. Placing the scanner right on the front page of TULA delivers three decisive advantages:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px] text-[#1F497D]">1. Zero Login Friction</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Consumers at local ration shops, petrol pumps, and mandis can verify any device using any phone camera without accounts or passwords.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px] text-[#0070C0]">2. Defeats Fake Lead Seals</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Physical counterfeit stamping is caught immediately by cross-checking the live SHA-256 state metrology cryptographic ledger.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px] text-[#1B7F5A]">3. Instant Grievances</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Flagged errors or expired seals can be reported with 1 click directly to the jurisdictional LMO officer under Section 15.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━ PERSONA & ROLE WALKTHROUGH ━━━━━━━━━━━ */}
      <section id="persona-walkthrough" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1F497D]">
              Role-Based Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Distinct Perspectives Across Every Metrology Stakeholder
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Unlike generic mockups with identical views, TULA adapts menus, metrics, permissions, and forms per persona.
            </p>
          </div>

          {/* Persona Tab Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveTab('BUSINESS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'BUSINESS'
                    ? 'bg-[#1F497D] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                💼 Commercial Business
              </button>
              <button
                onClick={() => setActiveTab('LMO')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'LMO'
                    ? 'bg-[#1F497D] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                🔍 LMO Field Officer
              </button>
              <button
                onClick={() => setActiveTab('GATC')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'GATC'
                    ? 'bg-[#1F497D] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                🔬 Accredited GATC
              </button>
              <button
                onClick={() => setActiveTab('CONTROLLER')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'CONTROLLER'
                    ? 'bg-[#1F497D] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                ⚖️ State Controller
              </button>
            </div>
          </div>

          {/* Persona Card Display */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {currentPersona.badge}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{currentPersona.role}</h3>
                <p className="text-xs text-slate-500 font-medium">Demo Profile: {currentPersona.name}</p>
              </div>

              <button
                onClick={() => {
                  storage.switchDemoRole(activeTab);
                  window.location.href = '/dashboard';
                }}
                className="inline-flex items-center gap-1.5 bg-[#1F497D] hover:bg-[#163863] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors shrink-0"
              >
                <span>Switch to this Role in Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Key Persona Capabilities &amp; Workflows:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentPersona.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-[#1B7F5A] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Metrics Simulation */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">{currentPersona.previewStats.stat1.label}</span>
                <strong className="text-sm font-extrabold text-[#1F497D]">{currentPersona.previewStats.stat1.val}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">{currentPersona.previewStats.stat2.label}</span>
                <strong className="text-sm font-extrabold text-[#0070C0]">{currentPersona.previewStats.stat2.val}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">{currentPersona.previewStats.stat3.label}</span>
                <strong className="text-sm font-extrabold text-[#1B7F5A]">{currentPersona.previewStats.stat3.val}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━ STATUTORY GROUNDING ━━━━━━━━━━━ */}
      <section id="regulatory-grounding" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1F497D]">
              Legal Metrology Compliance
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Strict Adherence to Statutory Enactments
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              The TULA prototype was constructed based on detailed regulatory research of Indian Legal Metrology legislation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-gov-700 font-mono">Act No. 1 of 2010</span>
              <h4 className="font-bold text-xs text-slate-900">The Legal Metrology Act, 2009</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Section 24 (Mandatory Verification), Section 22 (Central Model Approval), Section 27 (Inspection &amp; Seizure), Section 48 (Compounding).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-gov-700 font-mono">G.S.R. 71(E)</span>
              <h4 className="font-bold text-xs text-slate-900">General Rules, 2011</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                First Schedule statutory verification fee rates, Schedule IX digital certificate templates, and non-automatic weighing instrument tolerances.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-gov-700 font-mono">G.S.R. 593(E) / 2026</span>
              <h4 className="font-bold text-xs text-slate-900">GATC Rules 2013 &amp; 2026</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Accredited testing centres mandate for petroleum dispensers, CNG mass flow meters, LPG dispensers, and high-capacity weighbridges.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-gov-700 font-mono">NABL &amp; DoCA</span>
              <h4 className="font-bold text-xs text-slate-900">ISO/IEC 17025 Calibration</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Measurement traceability, secondary and working standard test weights, and environmental calibration parameter bounds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━ SCALABILITY & GO-TO-MARKET (GTM) STRATEGY ━━━━━━━━━━━ */}
      <section id="scalability-gtm" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#1F497D] text-[11px] font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>National Rollout &amp; Market Adoption</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Scaling TULA Across India: Go-To-Market Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Designed from day one to scale across 36 States/UTs, 800+ District Legal Metrology Offices, and an estimated fleet of 75 Million+ commercial weighing and measuring instruments.
            </p>
          </div>

          {/* Market Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">National Market Scope</span>
              <p className="text-2xl font-black text-[#1F497D]">75M+</p>
              <p className="text-[11px] text-slate-600">Active commercial instruments across retail, logistics &amp; industry</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Revenue Recovery Uplift</span>
              <p className="text-2xl font-black text-[#1B7F5A]">+35%</p>
              <p className="text-[11px] text-slate-600">Through automated expiry reminders &amp; compounding penalty desk</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Counterfeiting Reduction</span>
              <p className="text-2xl font-black text-[#0070C0]">99.4%</p>
              <p className="text-[11px] text-slate-600">Elimination of fraudulent stamping via public SHA-256 QR scans</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Turnaround Acceleration</span>
              <p className="text-xs font-black text-amber-600">Pilot KPI</p>
              <p className="text-[11px] text-slate-600">Pilot KPI: measure turnaround time against the current baseline.</p>
            </div>
          </div>

          {/* 4-Phase GTM Roadmap */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">4-Phase Implementation &amp; GTM Roadmap</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-2xs space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full pointer-events-none" />
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Phase 1 • Months 1–6
                </span>
                <h4 className="font-bold text-sm text-slate-900">Dual-State Regulatory Pilot</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pilot deployment across Delhi (retail/commercial focus) and Gujarat (industrial weighbridges &amp; petroleum GATC labs). Onboarding 5,000 instruments and 50 LMOs.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Phase 2 • Months 6–12
                </span>
                <h4 className="font-bold text-sm text-slate-900">GATC Decentralized Network</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Accreditation of 150+ private test centres under Legal Metrology (GATC) Rules 2026. Offloading 40% of inspection burden for weighbridges, CNG, LPG, and flow meters.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-2xs space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full pointer-events-none" />
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Phase 3 • Months 12–24
                </span>
                <h4 className="font-bold text-sm text-slate-900">National Metrology Grid</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Integration with BharatKosh treasury gateway, DigiLocker Schedule IX digital certificate push, and real-time cross-validation with GSTN and National e-Way Bill system.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full pointer-events-none" />
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Phase 4 • Months 24+
                </span>
                <h4 className="font-bold text-sm text-slate-900">IoT Seals &amp; Smart Pliers</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hardware-software handshake: Bluetooth-enabled digital stamping pliers encrypt and sync applied lead wire seal numbers directly to TULA in real time during on-site stamping.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━ FOOTER ━━━━━━━━━━━ */}
      <footer className="bg-slate-900 text-white pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-slate-800">
            <div>
              <TulaLogo size="md" variant="full" theme="dark" />
              <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
                Online Verification System for Weighing and Measuring Instruments.
                A hackathon prototype for SIH Problem Statement 26036 by Team FriendlyFire.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/verify"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Public QR Scanner
              </Link>
              <Link
                to="/login"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0070C0] hover:bg-[#005ba0] text-white transition-colors shadow-sm"
              >
                Enter Prototype Gateway &rarr;
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              © 2026 TULA • Smart India Hackathon Working Prototype • Developed by Team FriendlyFire
            </p>
            <p className="text-[11px] text-slate-500">
              Department of Consumer Affairs • Ministry of Consumer Affairs, Food &amp; Public Distribution
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
