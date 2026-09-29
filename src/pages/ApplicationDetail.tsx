import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { 
  Application, 
  Instrument, 
  UserProfile, 
  ApplicationStatus, 
  ScrutinyCheckItem 
} from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { isCategoryGatcEligible } from '../services/rulesEngine';
import { 
  FileText, 
  Scale, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  Smartphone, 
  AlertTriangle, 
  FileCheck,
  Building,
  Check
} from 'lucide-react';

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | undefined>(undefined);
  const [instrument, setInstrument] = useState<Instrument | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.getCurrentUser());
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('11:00 AM - 01:00 PM');
  const [paymentRef, setPaymentRef] = useState('');

  useEffect(() => {
    const load = () => {
      if (!id) return;
      const foundApp = storage.getApplicationById(id);
      setApp(foundApp);
      if (foundApp) {
        setInstrument(storage.getInstrumentById(foundApp.instrumentId));
      }
      setCurrentUser(storage.getCurrentUser());
    };
    load();
    const unsub = storage.subscribe(load);
    return unsub;
  }, [id]);

  if (!app || !instrument) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Application Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">No record found with ID {id}</p>
        <Link to="/applications" className="text-xs font-semibold text-gov-700 hover:underline">
          &larr; Return to Applications
        </Link>
      </div>
    );
  }

  // Scrutiny actions
  const handleScrutinyItemToggle = (itemId: string, pass: boolean) => {
    storage.updateScrutinyItem(app.id, itemId, pass);
  };

  const handleRequestCorrection = () => {
    if (!correctionNotes) {
      alert('Please specify the required corrections for the applicant');
      return;
    }
    storage.updateApplicationStatus(app.id, 'CORRECTION_REQUIRED', correctionNotes);
  };

  const handlePayFee = () => {
    const ref = paymentRef || `UPI-DEMO-${Date.now().toString().slice(-6)}`;
    storage.payApplicationFee(app.id, ref);
  };

  // Assignment logic
  const handleAssignToLMO = () => {
    const demoLMO = storage.getAllDemoUsers().find(u => u.role === 'LMO');
    if (!demoLMO) return;
    const reason = `Assigned to ${demoLMO.fullName} based on jurisdiction District ${instrument.district}`;
    storage.assignApplication(app.id, 'LMO', demoLMO.id, demoLMO.fullName, reason);
  };

  const handleAssignToGATC = () => {
    const demoGATC = storage.getAllDemoUsers().find(u => u.role === 'GATC');
    if (!demoGATC) return;
    const reason = `Assigned to Accredited GATC (${demoGATC.organization}) under Rule 2026 for ${instrument.categoryName}`;
    storage.assignApplication(app.id, 'GATC', demoGATC.id, demoGATC.fullName, reason);
  };

  const handleScheduleInspection = () => {
    const date = scheduledDate || new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0];
    storage.scheduleApplication(app.id, date, scheduledSlot);
  };

  const gatcEligible = isCategoryGatcEligible(instrument.category);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <Link to="/applications" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gov-700 hover:text-gov-900 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications List
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Application {app.id}
              </h1>
              <StatusBadge status={app.status} size="lg" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Service: <strong>{app.serviceType.replace(/_/g, ' ')}</strong> • Created: {new Date(app.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/instruments/${app.instrumentId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300"
            >
              <Scale className="w-3.5 h-3.5" />
              View Instrument UID
            </Link>

            {['SCHEDULED', 'INSPECTION_IN_PROGRESS'].includes(app.status) && (
              <Link
                to={`/field?applicationId=${app.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold shadow-xs"
              >
                <Smartphone className="w-4 h-4" />
                Start Field Inspection
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Workflow Action Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Documents & Scrutiny */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Box */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Application Particulars
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500">Applicant Name &amp; Role</span>
                <p className="font-bold text-slate-900">{app.applicantName}</p>
                <p className="text-[11px] text-slate-600">{app.organization}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500">Instrument Target</span>
                <p className="font-mono font-bold text-gov-800">{instrument.id}</p>
                <p className="text-[11px] text-slate-600">{instrument.categoryName} ({instrument.capacity})</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500">Installation Address</span>
                <p className="font-medium text-slate-800">{app.location}</p>
                <p className="text-[11px] text-slate-500">{app.district}, {app.state}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500">Statutory Fee</span>
                <p className="font-bold text-emerald-800 text-sm">₹{app.feeAmount} ({app.feeStatus})</p>
                {app.paymentReference && <p className="font-mono text-[10px] text-slate-500">Ref: {app.paymentReference}</p>}
              </div>
            </div>
          </div>

          {/* Scrutiny Checklist (Section 11) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-gov-700" />
                  Legal Document Scrutiny Checklist (LMO / Officer)
                </h3>
                <p className="text-[11px] text-slate-500">Examine statutory conformity prior to inspection assignment</p>
              </div>
              <span className="text-xs font-semibold text-gov-800 bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                Rule 24 Scrutiny
              </span>
            </div>

            <div className="space-y-3">
              {app.scrutinyItems.map(item => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-slate-600 text-[11px]">{item.description}</p>
                    {item.remarks && <p className="text-emerald-700 font-medium text-[11px] mt-1">Remark: {item.remarks}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentUser.role === 'BUSINESS' ? (
                      item.passed === true ? (
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                          <Check className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : item.passed === false ? (
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" /> Objection Raised
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded text-xs font-medium bg-slate-200 text-slate-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> In Review
                        </span>
                      )
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleScrutinyItemToggle(item.id, true)}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                            item.passed === true
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> Pass
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScrutinyItemToggle(item.id, false)}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                            item.passed === false
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-rose-50'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Issue
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Request Correction Box — Officers only */}
            {currentUser.role !== 'BUSINESS' && (app.status === 'UNDER_SCRUTINY' || app.status === 'SUBMITTED') ? (
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Return for Applicant Correction (Remarks)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Model approval certificate blurry, re-upload Section 22 document..."
                    value={correctionNotes}
                    onChange={e => setCorrectionNotes(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  />
                  <button
                    onClick={handleRequestCorrection}
                    className="px-3 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0"
                  >
                    Request Correction
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Documents Gallery */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Submitted Supporting Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {app.documents.map(doc => (
                <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{doc.title}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">{doc.fileName} ({doc.fileSize})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                    VERIFIED
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Workflow Transition Engine */}
        <div className="space-y-6">
          {/* Action Card 1: Fee Payment */}
          {app.feeStatus === 'UNPAID' && (
            <div className="bg-white p-5 rounded-xl border-2 border-amber-400 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-900">
                <DollarSign className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-sm">Statutory Fee Pending</h4>
              </div>
              <p className="text-xs text-slate-600">
                Amount Payable: <strong className="text-slate-900 text-sm">₹{app.feeAmount}</strong>
              </p>
              <input
                type="text"
                placeholder="UPI / NEFT Transaction ID"
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
              />
              <button
                onClick={handlePayFee}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded text-xs transition-colors shadow-xs"
              >
                Simulate Fee Payment (₹{app.feeAmount})
              </button>
            </div>
          )}

          {/* Action Card 2: Assignment Engine (Section 13) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-gov-700" />
              Assignment Engine
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Deterministic routing based on jurisdiction District <strong>{instrument.district}</strong> and Category <strong>{instrument.categoryName}</strong>.
            </p>

            {app.assignedToName ? (
              <div className="bg-gov-50 p-3 rounded-lg border border-gov-200 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-gov-700">Current Assignment</span>
                <p className="font-bold text-slate-900 text-sm">{app.assignedToName} ({app.assignedToType})</p>
                <p className="text-[11px] text-slate-600 mt-1 italic">{app.assignmentReason}</p>
              </div>
            ) : currentUser.role === 'BUSINESS' ? (
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-900 block mb-1">Automated Jurisdictional Routing</span>
                <span>Your application is being routed to the jurisdictional Legal Metrology Office for District {instrument.district}. Assignment will be finalized once fee payment and scrutiny are processed.</span>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleAssignToLMO}
                  className="w-full bg-gov-700 hover:bg-gov-800 text-white font-semibold py-2 px-3 rounded text-xs transition-colors text-left flex items-center justify-between"
                >
                  <span>Assign to Zonal LMO Inspector</span>
                  <span className="text-[10px] bg-gov-800 px-1.5 py-0.5 rounded">Jurisdiction</span>
                </button>

                {gatcEligible ? (
                  <button
                    onClick={handleAssignToGATC}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-3 rounded text-xs transition-colors text-left flex items-center justify-between"
                  >
                    <span>Assign to Accredited GATC</span>
                    <span className="text-[10px] bg-emerald-500 text-slate-900 font-bold px-1.5 py-0.5 rounded">Rule 2026 Eligible</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-200">
                    Category not eligible for GATC delegation under Legal Metrology Rules.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Card 3: Scheduling */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gov-700" />
              Inspection Scheduling
            </h4>
            {app.scheduledDate ? (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <span className="text-slate-500 block text-[11px]">Confirmed Appointment:</span>
                <p className="font-bold text-slate-900 text-sm">
                  {app.scheduledDate} ({app.scheduledTimeSlot})
                </p>
                {currentUser.role === 'BUSINESS' && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    ✓ Official Inspector assigned. Keep equipment powered on and site accessible.
                  </p>
                )}
              </div>
            ) : currentUser.role === 'BUSINESS' ? (
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-900 block mb-1">Appointment Scheduling</span>
                <span>The assigned Legal Metrology Officer will schedule the verification time slot following document scrutiny approval.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Time Slot</label>
                  <select
                    value={scheduledSlot}
                    onChange={e => setScheduledSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                    <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                    <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                  </select>
                </div>
                <button
                  onClick={handleScheduleInspection}
                  className="w-full bg-gov-700 hover:bg-gov-800 text-white font-bold py-2 rounded text-xs transition-colors shadow-xs"
                >
                  Confirm Appointment Slot
                </button>
              </div>
            )}
          </div>

          {/* Action Card 4: Launch Field Inspection (LMO / GATC) */}
          {(currentUser.role === 'LMO' || currentUser.role === 'GATC') && (app.status === 'SCHEDULED' || app.status === 'ASSIGNED' || app.status === 'INSPECTION_IN_PROGRESS') && (
            <div className="bg-gradient-to-br from-sky-700 to-gov-900 p-5 rounded-xl text-white shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-300" />
                <h4 className="font-bold text-sm text-white">Execute On-Site Inspection</h4>
              </div>
              <p className="text-xs text-sky-100 leading-relaxed">
                Launch mobile verification toolkit with live GPS stamping, MPE test tolerance calculation, and digital seal generation.
              </p>
              <Link
                to={`/field?applicationId=${app.id}`}
                className="w-full bg-white hover:bg-slate-100 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Smartphone className="w-4 h-4 text-sky-700" />
                <span>Start Field Inspection for {app.id}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
