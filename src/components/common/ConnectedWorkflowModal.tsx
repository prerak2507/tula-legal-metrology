import React from 'react';
import { 
  X, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Scale, 
  FileText, 
  QrCode, 
  Building, 
  Users, 
  Cpu, 
  AlertTriangle,
  BadgeCheck,
  Search
} from 'lucide-react';
import { TulaLogo } from './TulaLogo';

interface ConnectedWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectedWorkflowModal: React.FC<ConnectedWorkflowModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '1',
      actor: 'Commercial Occupier',
      name: 'Rajesh Varma (Apex Agro Logistics)',
      role: 'BUSINESS',
      icon: '💼',
      color: 'border-blue-500 bg-blue-50/50',
      badgeColor: 'bg-blue-100 text-blue-800',
      title: 'Fleet Registration & Verification Application',
      description: 'Business registers weighing instruments (UID: LM-DL-2026-001290) and files periodic re-verification application (APP-2026-00101) with statutory fee payment.',
      artifacts: ['Instrument UID: LM-DL-2026-001290', 'Application ID: APP-2026-00101', 'BharatKosh Fee: ₹250']
    },
    {
      step: '2',
      actor: 'Legal Metrology Officer',
      name: 'Insp. Amit K. Sharma (Central Delhi)',
      role: 'LMO',
      icon: '🔍',
      color: 'border-sky-500 bg-sky-50/50',
      badgeColor: 'bg-sky-100 text-sky-800',
      title: 'Statutory Scrutiny & On-Site Inspection',
      description: 'LMO reviews model approval in the Central Register, visits warehouse at Okhla, runs 4-point MPE tolerance testing with standard weights, and applies official lead seal (STAMP-DL-26-0842).',
      artifacts: ['Inspection: INSP-2026-00814', 'MPE Tolerance: ±0.008 kg (PASS)', 'Physical Lead Seal: STAMP-DL-26-0842']
    },
    {
      step: '3',
      actor: 'Accredited GATC Testing Lab',
      name: 'Dr. Hardik Patel (Gujarat Metrology)',
      role: 'GATC',
      icon: '🔬',
      color: 'border-emerald-500 bg-emerald-50/50',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      title: 'Specialized High-Capacity / Fuel Verification',
      description: 'Complex instruments (100T weighbridges & CNG/LPG mass flow meters) are routed to accredited GATC labs per Legal Metrology (GATC) Rules 2026 for high-precision calibration.',
      artifacts: ['Accreditation: GATC-GJ-2026-08', 'Application: APP-2026-00103', 'Calibrated Flow Tolerance: PASS']
    },
    {
      step: '4',
      actor: 'TULA Core Cryptographic Engine',
      name: 'Automated Schedule IX Minting',
      role: 'SYSTEM',
      icon: '⚡',
      color: 'border-indigo-500 bg-indigo-50/50',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      title: 'Digital Seal & QR Generation',
      description: 'System automatically issues tamper-evident Verification Certificate (CERT-2026-08912), generates a SHA-256 hash digest, and creates a scannable QR verification payload.',
      artifacts: ['Certificate: CERT-2026-08912', 'SHA-256 Integrity Digest', 'Statutory 12-Month Validity Window']
    },
    {
      step: '5',
      actor: 'General Public & Citizen',
      name: 'Consumer / Fair-Trade Verification',
      role: 'CITIZEN',
      icon: '📱',
      color: 'border-amber-500 bg-amber-50/50',
      badgeColor: 'bg-amber-100 text-amber-800',
      title: 'Live QR Instant Verification',
      description: 'Consumers scan the physical QR sticker attached to the weighing scale in grocery shops or petrol pumps to verify authenticity, validity dates, and report tampered seals.',
      artifacts: ['Live Camera QR Scan', 'Tamper Evident Seal Audit', 'Sec 30 Grievance Lodging']
    },
    {
      step: '6',
      actor: 'State Regulatory Controller',
      name: 'Sunita Meena, IAS (Delhi State HQ)',
      role: 'CONTROLLER',
      icon: '⚖️',
      color: 'border-purple-500 bg-purple-50/50',
      badgeColor: 'bg-purple-100 text-purple-800',
      title: 'Regulatory Oversight & Compounding Settlement',
      description: 'State Controller monitors jurisdiction pendency, oversees quota compliance, and resolves Section 48 compounding settlements for expired instruments (ENF-2026-0044).',
      artifacts: ['State Pendency SLA Monitor', 'Section 48 Compounding Desk', 'Inspection Quota Audit']
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#1F497D] via-[#163a66] to-[#0070C0] text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <TulaLogo variant="mark" size="sm" theme="light" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-300 bg-white/10 px-2 py-0.5 rounded-full">
                  Architecture &amp; Data Relatability
                </span>
                <span className="text-xs text-white/60">• SIH 26036</span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight mt-0.5">
                How TULA Connects Every Role in Real Time
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
            <p className="font-semibold text-sm mb-1 text-[#1F497D]">
              No Disconnected Data: One Unified Relational Lifecycle
            </p>
            <p>
              In TULA, every application, certificate, and enforcement notice is directly connected across all 6 stakeholder roles. When <strong>Rajesh Varma (Business)</strong> submits an application, <strong>Insp. Amit Sharma (LMO)</strong> sees the exact same case in his scrutiny queue. Once inspected, <strong>CERT-2026-08912</strong> is verifiable by any citizen via the <strong>Live QR Scanner</strong>, and visible to <strong>Controller Sunita Meena</strong> for compliance oversight.
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-4">
            {steps.map((s, idx) => (
              <div
                key={s.step}
                className={`p-4 rounded-2xl border-2 ${s.color} transition-all hover:shadow-md flex flex-col md:flex-row md:items-start gap-4`}
              >
                <div className="flex items-center gap-3 md:flex-col md:items-center shrink-0">
                  <span className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-800 font-extrabold text-sm flex items-center justify-center shadow-xs">
                    {s.step}
                  </span>
                  <span className="text-2xl p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    {s.icon}
                  </span>
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${s.badgeColor}`}>
                      {s.actor}
                    </span>
                    <span className="text-xs font-bold text-slate-900">• {s.name}</span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm">{s.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {s.artifacts.map((art, aIdx) => (
                      <span
                        key={aIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-semibold text-slate-700 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {art}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Statutory Anchor */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-sm">Statutory Legal Framework Compliance</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Every transition in this lifecycle strictly implements the statutory mandates of <strong>The Legal Metrology Act, 2009 (Act 1 of 2010)</strong>, <strong>Schedule IX Verification Certificates</strong>, and the <strong>2026 GATC Decentralized Verification Guidelines</strong> issued by the Department of Consumer Affairs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Team FriendlyFire • SIH Problem Statement 26036
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1F497D] hover:bg-[#163a66] text-white font-bold text-xs transition-colors shadow-xs"
          >
            Close &amp; Continue Exploration
          </button>
        </div>
      </div>
    </div>
  );
};
