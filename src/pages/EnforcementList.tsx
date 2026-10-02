import React, { useState, useEffect } from 'react';
import { compoundingFee, OFFENCE_LABELS } from '../config/compounding';
import { SOURCES } from '../config/sources';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { EnforcementCase, Instrument } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  Scale, 
  MapPin, 
  Calendar,
  X 
} from 'lucide-react';

export const EnforcementList: React.FC = () => {
  const [allCases, setAllCases] = useState<EnforcementCase[]>(storage.getEnforcementCases());
  const [instruments, setInstruments] = useState<Instrument[]>(storage.getInstruments());
  const [user, setUser] = useState(storage.getCurrentUser());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Enforcement Case Form State
  const [selectedInstId, setSelectedInstId] = useState(instruments[0]?.id || '');
  const [businessName, setBusinessName] = useState('');
  const [violatorName, setViolatorName] = useState('');
  const [location, setLocation] = useState('');
  const [offenseCategory, setOffenseCategory] = useState<EnforcementCase['offenseCategory']>('UNVERIFIED_USE');
  const [actSection, setActSection] = useState('Section 24 read with Section 33, Legal Metrology Act, 2009');
  const [actionTaken, setActionTaken] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState<string>('');
  const [evidenceNotes, setEvidenceNotes] = useState('');

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setAllCases(storage.getEnforcementCases());
      setInstruments(storage.getInstruments());
      setUser(storage.getCurrentUser());
    });
    return unsub;
  }, []);

  // Filter cases according to persona role
  const cases = storage.getEnforcementsForUser(user);
  void allCases;

  const getScopeLabel = () => {
    if (user.role === 'BUSINESS') return `Statutory Notices for ${user.organization}`;
    if (user.role === 'LMO') return `${user.state} Enforcement Division (Officer: ${user.fullName})`;
    if (user.role === 'GATC') return `GATC Surveillance Reports (${user.state})`;
    if (user.role === 'CONTROLLER') return `${user.state}: all districts`;
    if (user.role === 'STATE_ADMIN') return `${user.state} State Legal Metrology Enforcement`;
    return 'Pan-India National Metrology Enforcement Registry';
  };

  const filteredCases = cases.filter(c => {
    return (
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instrumentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.offenseCategory.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const selectedInst = instruments.find(i => i.id === selectedInstId);
  const scheduleFee = compoundingFee(selectedInst?.state || 'Delhi', offenseCategory);
  // Pre-fill the amount from the State's Schedule XI when it is loaded; the officer can still change it.
  useEffect(() => {
    if (scheduleFee) { setPenaltyAmount(String(scheduleFee.amount)); setActSection(`${scheduleFee.section}, Legal Metrology Act, 2009`); }
  }, [scheduleFee?.amount, scheduleFee?.section]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = storage.getCurrentUser();
    const inst = instruments.find(i => i.id === selectedInstId);

    await storage.createEnforcementCase({
      instrumentId: selectedInstId,
      businessName: businessName || inst?.organization || 'Commercial Occupier',
      violatorName: violatorName || inst?.ownerName || 'Authorized Signatory',
      location: location || inst?.installationAddress || 'Site Premises',
      district: inst?.district || 'Central Delhi',
      state: inst?.state || 'Delhi',
      offenseCategory,
      actSection,
      officerId: user.id,
      officerName: user.fullName,
      status: 'OPEN',
      actionTaken: actionTaken || 'Notice of Violation Issued; Compounding proceedings initiated under Section 48.',
      penaltyAmount: penaltyAmount.trim() === '' ? undefined : Number(penaltyAmount),
      evidenceNotes: evidenceNotes || 'Physical spot check detected non-compliance with statutory verification mandates.',
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Enforcement &amp; Legal Metrology Surveillance
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Enforcement Cases &amp; Violations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor citations, seizures, and compounding proceedings under Section 24, 27, 30, and 36 of The Legal Metrology Act, 2009.
          </p>
        </div>

        {user.role === 'BUSINESS' ? (
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200 px-3 py-2 rounded-lg text-xs font-semibold shrink-0">
            <Scale className="w-4 h-4 text-rose-600" />
            <span>Section 48 Compounding & Compliance Desk</span>
          </div>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            File Enforcement Citation
          </button>
        )}
      </div>

      {/* Role Jurisdiction Banner */}
      <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
          <span className="font-semibold text-rose-950">Active Scope:</span>
          <span className="text-rose-800">{getScopeLabel()}</span>
        </div>
        <span className="text-[11px] font-bold text-rose-900 bg-white px-2.5 py-0.5 rounded-full border border-rose-200 shadow-xs">
          {filteredCases.length} {filteredCases.length === 1 ? 'Case' : 'Cases'} Tracked
        </span>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Case ID, Instrument UID, Business Name, Offense Category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-rose-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Enforcement Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCases.map(c => (
          <div
            key={c.id}
            className="bg-white rounded-xl border-l-4 border-l-rose-600 border border-slate-200 p-5 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {c.id}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1.5">{c.businessName}</h3>
                <span className="text-[11px] text-slate-500 font-mono">Instrument: {c.instrumentId}</span>
              </div>
              <StatusBadge status={c.status} size="sm" />
            </div>

            <div className="text-xs space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Offense Category:</span>
                <span className="font-bold text-rose-900">{c.offenseCategory.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statutory Section:</span>
                <span className="font-semibold text-slate-800">{c.actSection}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Compounding fee (Schedule XI):</span>
                {c.penaltyAmount !== undefined && c.penaltyAmount !== null
                  ? <span className="font-extrabold text-slate-900">₹{c.penaltyAmount.toLocaleString('en-IN')}</span>
                  : c.status === 'SEIZED'
                    ? <span className="font-semibold text-slate-600 text-right">Not compounded: sent for prosecution</span>
                    : compoundingFee(c.state, c.offenseCategory)
                      ? <span className="font-semibold text-slate-800 text-right">₹{compoundingFee(c.state, c.offenseCategory)!.amount.toLocaleString('en-IN')} ({compoundingFee(c.state, c.offenseCategory)!.item}), not yet collected</span>
                      : <span className="font-semibold text-slate-600 text-right">To be fixed by the Controller ({c.state} Schedule XI not loaded)</span>}
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-medium text-slate-800">Action: {c.actionTaken}</p>
              <p className="text-[11px] text-slate-500 italic">{c.evidenceNotes}</p>
            </div>

            {/* Compounding Action Controls */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500">
                <span>Officer: {c.officerName}</span>
                <span className="ml-2">• {new Date(c.createdAt).toLocaleDateString()}</span>
              </div>

              {c.status === 'OPEN' && user.role === 'BUSINESS' && c.penaltyAmount !== undefined && c.penaltyAmount !== null && (
                <button
                  type="button"
                  onClick={() => storage.updateEnforcementCaseStatus(c.id, 'COMPOUNDED', `Compounding fee of ₹${c.penaltyAmount?.toLocaleString('en-IN')} paid (demo payment) by ${user.fullName}. Compounded under section 48.`)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
                >
                  Pay compounding fee ₹{c.penaltyAmount?.toLocaleString('en-IN')} (demo)
                </button>
              )}

              {c.status === 'OPEN' && (user.role === 'LMO' || user.role === 'CONTROLLER') && (
                <button
                  type="button"
                  onClick={() => storage.updateEnforcementCaseStatus(c.id, 'COMPOUNDED', `Compounding agreed and recorded by ${user.fullName}. Compounding penalty received under Section 48.`)}
                  className="px-3 py-1 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Record Compounding Settlement
                </button>
              )}

              {c.status === 'COMPOUNDED' && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Compounded under Sec 48
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal to Register Case */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-rose-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">File Legal Metrology Enforcement Citation</h3>
                <p className="text-xs text-rose-200">Statutory notice under the Legal Metrology Act, 2009</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Instrument UID *</label>
                <select
                  value={selectedInstId}
                  onChange={e => setSelectedInstId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                >
                  {instruments.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.id} — {i.categoryName} ({i.organization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business / Trade Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Logistics Fuel Outlet"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Violator / Manager Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Varma"
                    value={violatorName}
                    onChange={e => setViolatorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Offense Category *</label>
                  <select
                    value={offenseCategory}
                    onChange={e => setOffenseCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-semibold"
                  >
                    {Object.entries(OFFENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Compounding fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={penaltyAmount}
                    placeholder="From the State's Schedule XI"
                    onChange={e => setPenaltyAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    {scheduleFee
                      ? <>{selectedInst?.state} {scheduleFee.item}, {scheduleFee.section}. <a href={SOURCES.DL_ENF_2026.url} target="_blank" rel="noreferrer" className="underline">Official schedule (Delhi Gazette, 28 Jan 2026, Government of NCT of Delhi)</a></>
                      : `${selectedInst?.state || 'This State'}'s Schedule XI is not loaded for this offence. Enter the amount from the schedule, or leave it for the Controller.`}
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action Initiated *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seizure notice issued; Compounding proceeding under Section 48."
                  value={actionTaken}
                  onChange={e => setActionTaken(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">On-Site Evidence Observations</label>
                <textarea
                  rows={2}
                  value={evidenceNotes}
                  onChange={e => setEvidenceNotes(e.target.value)}
                  placeholder="Observations recorded during inspection..."
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs"
                >
                  Register Citation Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
