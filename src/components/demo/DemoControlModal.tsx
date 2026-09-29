import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { X, FastForward, AlertTriangle, ShieldAlert, Bell, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Instrument, Application, VerificationCertificate } from '../../types';

interface DemoControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  instruments: Instrument[];
  applications: Application[];
  certificates: VerificationCertificate[];
}

export const DemoControlModal: React.FC<DemoControlModalProps> = ({
  isOpen,
  onClose,
  instruments,
  applications,
  certificates,
}) => {
  if (!isOpen) return null;

  const [selectedAppId, setSelectedAppId] = useState(
    applications.find(a => a.status !== 'COMPLETED')?.id || applications[0]?.id || ''
  );
  const [selectedInstId, setSelectedInstId] = useState(
    instruments.find(i => i.status === 'ACTIVE')?.id || instruments[0]?.id || ''
  );
  const [selectedCertId, setSelectedCertId] = useState(
    certificates.find(c => c.status === 'VALID')?.id || certificates[0]?.id || ''
  );
  const [revocationReason, setRevocationReason] = useState('Spot inspection detected broken calibration seal and manipulated electronic tare pulser.');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleFastForward = async () => {
    if (!selectedAppId) return;
    await storage.fastForwardApplication(selectedAppId);
    setActionMessage(`Application ${selectedAppId} fast-forwarded! Schedule IX Certificate & Stamp successfully issued.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSimulateExpiry = () => {
    if (!selectedInstId) return;
    storage.simulateInstrumentExpiry(selectedInstId);
    setActionMessage(`Instrument ${selectedInstId} set to EXPIRED (15 days overdue). Expiry alerts triggered!`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRevokeCert = () => {
    if (!selectedCertId) return;
    storage.revokeCertificate(selectedCertId, revocationReason);
    setActionMessage(`Certificate ${selectedCertId} REVOKED. Public QR check will now display REVOKED!`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleTriggerReminders = () => {
    const count = storage.triggerBulkReminders();
    setActionMessage(`Dispatched ${count} automated re-verification reminder notices.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo instruments, applications, and logs to initial state?')) {
      storage.resetDemoData();
      setActionMessage('Demo database reset to factory seed values.');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500 rounded text-slate-900 font-bold text-xs">DEMO</span>
            <div>
              <h3 className="font-bold text-base text-white">Super Admin Demo Control Center</h3>
              <p className="text-xs text-slate-400">SIH Hackathon Presentation & Jury Fast-Forward Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action feedback toast */}
        {actionMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-2 text-emerald-800 text-sm font-medium animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        <div className="p-6 space-y-6 text-sm">
          {/* Section 1: Fast forward application */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <FastForward className="w-4 h-4 text-gov-700" />
              <h4 className="font-bold text-slate-900">1. Instant Fast-Forward Workflow</h4>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Fast-forward an application through field inspection, MPE test readings, lead stamping, and Schedule IX Certificate generation in 1 click.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedAppId}
                onChange={e => setSelectedAppId(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-gov-600"
              >
                {applications.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.instrumentId} ({a.status})
                  </option>
                ))}
              </select>
              <button
                onClick={handleFastForward}
                className="bg-gov-700 hover:bg-gov-800 text-white font-semibold px-4 py-2 rounded text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <FastForward className="w-3.5 h-3.5" />
                Issue Certificate Now
              </button>
            </div>
          </div>

          {/* Section 2: Simulate Expiry */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-slate-900">2. Simulate Expiry & Overdue Alert</h4>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Artificially set an instrument's verification validity date to 15 days in the past to demonstrate expiry warnings, legal metrology non-compliance alerts, and notification dispatches.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedInstId}
                onChange={e => setSelectedInstId(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-600"
              >
                {instruments.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.id} — {i.categoryName} ({i.status})
                  </option>
                ))}
              </select>
              <button
                onClick={handleSimulateExpiry}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Simulate Expiry
              </button>
            </div>
          </div>

          {/* Section 3: Simulate Revocation */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h4 className="font-bold text-slate-900">3. Simulate Certificate Revocation (Enforcement Action)</h4>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Revoke an active certificate to demonstrate tamper-detection and public QR verification alert status.
            </p>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedCertId}
                  onChange={e => setSelectedCertId(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-rose-600"
                >
                  {certificates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.certificateNumber} — {c.instrumentType} ({c.status})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRevokeCert}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Revoke Certificate
                </button>
              </div>
              <input
                type="text"
                value={revocationReason}
                onChange={e => setRevocationReason(e.target.value)}
                placeholder="Enter statutory reason for revocation"
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700"
              />
            </div>
          </div>

          {/* Section 4: Trigger Reminders & Reset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4 text-sky-600" />
                <h5 className="font-bold text-slate-900 text-xs">Automated Reminder Engine</h5>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Scans all instruments and generates 30/15-day statutory re-verification notices.
              </p>
              <button
                onClick={handleTriggerReminders}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 px-3 rounded text-xs transition-colors border border-slate-300"
              >
                Trigger Reminders Now
              </button>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <h5 className="font-bold text-slate-900 text-xs">Reset Demo Database</h5>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Reverts all instruments, applications, and inspection logs to initial seed state.
              </p>
              <button
                onClick={handleResetData}
                className="w-full bg-slate-100 hover:bg-slate-200 text-rose-700 font-semibold py-2 px-3 rounded text-xs transition-colors border border-rose-200"
              >
                Reset to Factory Seed
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs px-5 py-2 rounded transition-colors"
          >
            Close Control Center
          </button>
        </div>
      </div>
    </div>
  );
};
