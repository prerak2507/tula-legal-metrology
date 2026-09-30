import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { PendencyPanel } from '../components/analytics/PendencyPanel';
import { Instrument, Application, VerificationCertificate, EnforcementCase } from '../types';
import { 
  FileBarChart2, 
  Download, 
  Filter, 
  Calendar, 
  Scale, 
  Award, 
  AlertTriangle, 
  UserCheck 
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [allInstruments, setAllInstruments] = useState<Instrument[]>(storage.getInstruments());
  const [allApplications, setAllApplications] = useState<Application[]>(storage.getApplications());
  const [allCertificates, setAllCertificates] = useState<VerificationCertificate[]>(storage.getCertificates());
  const [allEnforcements, setAllEnforcements] = useState<EnforcementCase[]>(storage.getEnforcementCases());
  const [user, setUser] = useState(storage.getCurrentUser());

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setAllInstruments(storage.getInstruments());
      setAllApplications(storage.getApplications());
      setAllCertificates(storage.getCertificates());
      setAllEnforcements(storage.getEnforcementCases());
      setUser(storage.getCurrentUser());
    });
    return unsub;
  }, []);

  // Filter datasets strictly according to user role
  const instruments = storage.getInstrumentsForUser(user);
  const applications = storage.getApplicationsForUser(user);
  const certificates = storage.getCertificatesForUser(user);
  void allInstruments; void allApplications; void allCertificates;

  const getReportHeader = () => {
    if (user.role === 'BUSINESS') {
      return {
        title: 'Commercial Fleet Compliance & Audit Report',
        subtitle: `Statutory verification audit for ${user.organization} under Legal Metrology Act, 2009.`,
        scope: `Commercial Fleet (${user.organization})`
      };
    }
    if (user.role === 'LMO') {
      return {
        title: `${user.district} inspection report`,
        subtitle: `Workload, pending inspections, and enforcement surveillance for ${user.jurisdictionOffice || user.state}.`,
        scope: `${user.district}, ${user.state}`
      };
    }
    if (user.role === 'GATC') {
      return {
        title: 'GATC Laboratory Testing & Calibration Report',
        subtitle: `Accredited testing centre audits under the GATC Rules, 2013 (${user.gatcCode || user.organization}).`,
        scope: `GATC Facility (${user.state})`
      };
    }
    if (user.role === 'CONTROLLER') {
      return {
        title: `${user.state} State Controllerate Metrology Performance Report`,
        subtitle: `Statewide regulatory oversight, pendency analysis, and statutory fee realization across all districts.`,
        scope: `${user.state} State Headquarters`
      };
    }
    if (user.role === 'STATE_ADMIN') {
      return {
        title: `${user.state} State Metrology Administration & GATC Governance`,
        subtitle: `Statewide e-Governance analytics, district quotas, and accredited test laboratory performance.`,
        scope: `${user.state} State Administration`
      };
    }
    return {
      title: 'National Legal Metrology Master Report (Pan-India)',
      subtitle: 'Ministry of Consumer Affairs — Central repository analytics across all 36 States & Union Territories.',
      scope: 'Pan-India National Metrology Registry'
    };
  };

  const rh = getReportHeader();

  // Export functions to CSV
  const exportInstrumentsCSV = () => {
    const headers = ['UID', 'Category', 'Manufacturer', 'Model', 'Serial', 'Capacity', 'State', 'District', 'Status', 'ExpiryDueDate'];
    const rows = instruments.map(i => [
      i.id,
      `"${i.categoryName}"`,
      `"${i.manufacturer}"`,
      `"${i.model}"`,
      i.serialNumber,
      `"${i.capacity}"`,
      i.state,
      i.district,
      i.status,
      i.nextVerificationDueDate,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Legal_Metrology_Instruments_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportApplicationsCSV = () => {
    const headers = ['ApplicationID', 'InstrumentUID', 'Applicant', 'Organization', 'ServiceType', 'Status', 'Fee', 'AssignedOfficer'];
    const rows = applications.map(a => [
      a.id,
      a.instrumentId,
      `"${a.applicantName}"`,
      `"${a.organization}"`,
      a.serviceType,
      a.status,
      a.feeAmount,
      `"${a.assignedToName || 'Unassigned'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Legal_Metrology_Applications_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileBarChart2 className="w-5 h-5 text-gov-700" />
            <span className="text-xs font-bold text-gov-800 uppercase tracking-wider">
              Legal Metrology Analytics
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {rh.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {rh.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportInstrumentsCSV}
            className="inline-flex items-center gap-1.5 bg-gov-700 hover:bg-gov-800 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            {user.role === 'BUSINESS' ? 'Export My Fleet CSV' : 'Export Instruments CSV'}
          </button>
          <button
            onClick={exportApplicationsCSV}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            {user.role === 'BUSINESS' ? 'Export My Applications CSV' : 'Export Applications CSV'}
          </button>
        </div>
      </div>

      {/* Role Scope Banner */}
      <div className="bg-gov-50/80 border border-gov-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gov-700 animate-pulse" />
          <span className="font-semibold text-gov-900">Audit Scope:</span>
          <span className="text-gov-800">{rh.scope}</span>
        </div>
        <span className="text-[11px] font-bold text-gov-800 bg-white px-2.5 py-0.5 rounded-full border border-gov-200 shadow-xs">
          {instruments.length} Instruments • {applications.length} Applications Scoped
        </span>
      </div>

      <PendencyPanel user={user} />

      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {user.role === 'BUSINESS' ? 'My Fleet Compliance' : 'Jurisdiction Verification Rate'}
          </span>
          <p className="text-3xl font-extrabold text-emerald-700 mt-2">
            {instruments.length > 0 ? Math.round((instruments.filter(i => i.status === 'ACTIVE').length / instruments.length) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Within validity</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {user.role === 'BUSINESS' ? 'Applications Processed' : 'Resolution SLA Performance'}
          </span>
          <p className="text-3xl font-extrabold text-gov-800 mt-2">
            {applications.length > 0 ? Math.round((applications.filter(a => a.status === 'COMPLETED').length / applications.length) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Turnaround: 4.2 days statutory standard</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {user.role === 'BUSINESS' ? 'Overdue for Renewal' : 'Critical Expiry Surveillance'}
          </span>
          <p className="text-3xl font-extrabold text-rose-700 mt-2">
            {instruments.filter(i => i.status === 'EXPIRED').length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Non-compliant / re-verification due</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {user.role === 'BUSINESS' ? 'Statutory Fees Paid' : 'Total Revenue Realization'}
          </span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            ₹{applications.reduce((acc, a) => acc + (a.feeStatus === 'PAID' ? a.feeAmount : 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Under First Schedule General Rules</p>
        </div>
      </div>

      {/* Role-Specific Detail Grids */}
      {user.role === 'BUSINESS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Premises Audit Matrix */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Premises &amp; Facility Compliance Matrix
            </h3>
            <div className="space-y-3">
              {instruments.map(inst => (
                <div key={inst.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{inst.categoryName}</span>
                    <span className="block text-[11px] text-slate-500">{inst.installationAddress}</span>
                    <span className="block text-[10px] font-mono text-slate-400 mt-0.5">UID: {inst.id}</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inst.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                      inst.status === 'EXPIRED' ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {inst.status}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1">Due: {inst.nextVerificationDueDate || 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statutory Obligations Guide */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Legal Metrology Compliance Checklist
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-start gap-2">
                <span className="text-emerald-700 font-bold">✓</span>
                <div>
                  <strong className="text-emerald-950 block">Section 24 Periodic Re-Verification:</strong>
                  <span>Weighing scales must be verified annually. Always re-apply 30 days prior to certificate expiry.</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2">
                <span className="text-gov-700 font-bold">§</span>
                <div>
                  <strong className="text-slate-900 block">Certificate display:</strong>
                  <span>Digital certificate or QR label must be exhibited conspicuously at commercial premises.</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2">
                <span className="text-gov-700 font-bold">§</span>
                <div>
                  <strong className="text-slate-900 block">Keep seals intact:</strong>
                  <span>Official Lead-Wire or Barcode seals must remain unbroken. Report accidental damage immediately.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Jurisdictional Breakdown by State
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2">State Jurisdiction</th>
                    <th className="py-2">Total Units</th>
                    <th className="py-2">Active</th>
                    <th className="py-2">Overdue</th>
                    <th className="py-2 text-right">Compliance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {['Delhi', 'Gujarat', 'Maharashtra'].map(state => {
                    const stateInsts = allInstruments.filter(i => i.state === state);
                    const active = stateInsts.filter(i => i.status === 'ACTIVE').length;
                    const expired = stateInsts.filter(i => i.status === 'EXPIRED').length;
                    const rate = stateInsts.length > 0 ? Math.round((active / stateInsts.length) * 100) : 0;
                    return (
                      <tr key={state} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-900">{state}</td>
                        <td className="py-2.5 font-semibold text-slate-700">{stateInsts.length}</td>
                        <td className="py-2.5 text-emerald-700 font-bold">{active}</td>
                        <td className="py-2.5 text-rose-700 font-bold">{expired}</td>
                        <td className="py-2.5 text-right font-extrabold text-gov-800">{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
