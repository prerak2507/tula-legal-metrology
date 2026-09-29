import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { Instrument, ApplicationServiceType, ApplicationDocument } from '../types';
import { calculateStatutoryFee } from '../services/rulesEngine';
import { 
  FileText, 
  Scale, 
  UploadCloud, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  DollarSign, 
  AlertCircle 
} from 'lucide-react';

export const ApplicationNew: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedInstrumentId = searchParams.get('instrumentId') || '';

  const [instruments, setInstruments] = useState<Instrument[]>(storage.getInstruments());
  const [selectedInstId, setSelectedInstId] = useState<string>(preselectedInstrumentId || (instruments[0]?.id || ''));
  const [serviceType, setServiceType] = useState<ApplicationServiceType>('PERIODIC_RE_VERIFICATION');
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [remarks, setRemarks] = useState('');

  // Documents State
  const [documents, setDocuments] = useState<ApplicationDocument[]>([
    {
      id: 'doc-init-1',
      title: 'Valid Model Approval Certificate (Section 22)',
      type: 'MODEL_APPROVAL',
      fileName: 'Model_Approval_Certified.pdf',
      fileSize: '620 KB',
      uploadedAt: new Date().toISOString(),
      fileUrl: '#',
    },
    {
      id: 'doc-init-2',
      title: 'Original Purchase Tax Invoice',
      type: 'PURCHASE_INVOICE',
      fileName: 'Tax_Invoice_Equipment.pdf',
      fileSize: '410 KB',
      uploadedAt: new Date().toISOString(),
      fileUrl: '#',
    }
  ]);

  const selectedInst = instruments.find(i => i.id === selectedInstId) || instruments[0];

  // Dynamic fee calculation via rule engine
  const feeCalculation = selectedInst ? calculateStatutoryFee(selectedInst.category) : { statutory: 200, userCharge: 50, total: 250, citation: 'First Schedule, General Rules 2011' };

  const handleDocumentAdd = (type: ApplicationDocument['type'], title: string) => {
    const newDoc: ApplicationDocument = {
      id: `doc-${Date.now()}`,
      title,
      type,
      fileName: `${title.replace(/\s+/g, '_')}_Uploaded.pdf`,
      fileSize: '512 KB',
      uploadedAt: new Date().toISOString(),
      fileUrl: '#',
    };
    setDocuments([...documents, newDoc]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;

    const user = storage.getCurrentUser();
    const newApp = storage.createApplication({
      instrumentId: selectedInst.id,
      applicantId: user.id,
      applicantName: user.fullName,
      organization: user.organization,
      serviceType,
      state: selectedInst.state,
      district: selectedInst.district,
      location: selectedInst.installationAddress,
      preferredDate: preferredDate || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
      feeAmount: feeCalculation.total,
      feeStatus: 'UNPAID',
      documents,
    });

    navigate(`/applications/${newApp.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link to="/applications" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gov-700 hover:text-gov-900 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications List
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          File Verification Application
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit statutory verification request under Section 24 of The Legal Metrology Act, 2009.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Instrument */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-gov-700 text-white font-bold text-xs flex items-center justify-center">1</span>
            <h3 className="font-bold text-sm text-slate-900">Select Instrument from Fleet</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Instrument *</label>
            <select
              value={selectedInstId}
              onChange={e => setSelectedInstId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-gov-600 focus:bg-white"
            >
              {instruments.map(i => (
                <option key={i.id} value={i.id}>
                  {i.id} — {i.categoryName} ({i.serialNumber}) • Status: {i.status}
                </option>
              ))}
            </select>
          </div>

          {selectedInst && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Manufacturer &amp; Model:</span>
                <p className="font-bold text-slate-900">{selectedInst.manufacturer} • {selectedInst.model}</p>
              </div>
              <div>
                <span className="text-slate-500">Nominal Capacity:</span>
                <p className="font-bold text-slate-900">{selectedInst.capacity}</p>
              </div>
              <div>
                <span className="text-slate-500">Installation Site:</span>
                <p className="font-semibold text-slate-800 line-clamp-1">{selectedInst.installationAddress}</p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Verification Service Type */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-gov-700 text-white font-bold text-xs flex items-center justify-center">2</span>
            <h3 className="font-bold text-sm text-slate-900">Verification Service Category</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'PERIODIC_RE_VERIFICATION', title: 'Periodic Re-Verification', desc: 'Mandatory annual or biennial re-testing under Section 24' },
              { id: 'INITIAL_VERIFICATION', title: 'Initial Verification', desc: 'First-time stamping of newly installed instrument' },
              { id: 'RE_VERIFICATION_AFTER_REPAIR', title: 'Re-Verification After Repair', desc: 'Mandatory testing following repair, calibration or part replacement' },
              { id: 'RE_VERIFICATION_AFTER_RELOCATION', title: 'Re-Verification After Relocation', desc: 'Testing after physical dismantling or site change' },
            ].map(srv => (
              <label
                key={srv.id}
                className={`p-4 rounded-lg border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  serviceType === srv.id
                    ? 'border-gov-700 bg-gov-50/50 ring-1 ring-gov-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-slate-900">{srv.title}</span>
                  <input
                    type="radio"
                    name="serviceType"
                    checked={serviceType === srv.id}
                    onChange={() => setServiceType(srv.id as ApplicationServiceType)}
                    className="text-gov-700 focus:ring-gov-600"
                  />
                </div>
                <p className="text-slate-500 mt-1 leading-relaxed text-[11px]">{srv.desc}</p>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Inspection Date</label>
            <input
              type="date"
              value={preferredDate}
              onChange={e => setPreferredDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded p-2 text-xs"
            />
          </div>
        </div>

        {/* Step 3: Supporting Documents */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-gov-700 text-white font-bold text-xs flex items-center justify-center">3</span>
            <h3 className="font-bold text-sm text-slate-900">Mandatory Supporting Documents</h3>
          </div>

          <div className="space-y-2">
            {documents.map((doc, idx) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">{doc.title}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">{doc.fileName} ({doc.fileSize})</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  ATTACHED
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleDocumentAdd('CALIBRATION_REPORT', 'Internal Calibration & Error Log')}
              className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-300"
            >
              + Attach Calibration Log
            </button>
            <button
              type="button"
              onClick={() => handleDocumentAdd('SITE_PLAN', 'Premises Layout & Safety Clearance')}
              className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-300"
            >
              + Attach Site Layout Plan
            </button>
          </div>
        </div>

        {/* Step 4: Statutory Fee Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-gov-700 text-white font-bold text-xs flex items-center justify-center">4</span>
            <h3 className="font-bold text-sm text-slate-900">Statutory Fee Computation (Rule Engine)</h3>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Statutory Verification &amp; Stamping Fee (First Schedule):</span>
              <span className="font-semibold text-slate-900">₹{feeCalculation.statutory}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>e-Governance User Processing Charge:</span>
              <span className="font-semibold text-slate-900">₹{feeCalculation.userCharge}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Total Payable Amount:</span>
              <span className="text-gov-800">₹{feeCalculation.total}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 italic">
              Governed by: {feeCalculation.citation}
            </p>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/applications"
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-gov-700 hover:bg-gov-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition-colors shadow-md"
          >
            <span>Submit Verification Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
