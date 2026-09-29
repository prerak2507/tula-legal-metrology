import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { Application, ApplicationStatus, ApplicationServiceType } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Calendar, 
  UserCheck, 
  ChevronRight, 
  ArrowRight 
} from 'lucide-react';

export const ApplicationsList: React.FC = () => {
  const [allApplications, setAllApplications] = useState<Application[]>(storage.getApplications());
  const [user, setUser] = useState(storage.getCurrentUser());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setAllApplications(storage.getApplications());
      setUser(storage.getCurrentUser());
    });
    return unsub;
  }, []);

  // Role-based filtering
  const applications = user.role === 'BUSINESS'
    ? allApplications.filter(a => a.applicantId === user.id)
    : (user.role === 'LMO')
    ? allApplications.filter(a => a.assignedToId === user.id || a.state === user.state)
    : (user.role === 'GATC')
    ? allApplications.filter(a => a.assignedToId === user.id || (a.state === user.state && a.assignedToType === 'GATC'))
    : (user.role === 'CONTROLLER' || user.role === 'STATE_ADMIN')
    ? allApplications.filter(a => a.state === user.state)
    : allApplications;

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.instrumentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesService = serviceFilter === 'ALL' || app.serviceType === serviceFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-gov-700" />
            <span className="text-xs font-bold text-gov-800 uppercase tracking-wider">
              Verification Workflow Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Verification &amp; Stamping Applications
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete lifecycle workflow: Submission → Document Scrutiny → Fee Payment → Assignment → Scheduling → Inspection → Certification.
          </p>
        </div>

        <Link
          to="/applications/new"
          className="inline-flex items-center gap-2 bg-gov-700 hover:bg-gov-800 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Verification Application
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by App ID, Instrument UID, Business..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-gov-600 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Filter by Application Status"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-gov-600 focus:bg-white"
            >
              <option value="ALL">All Application Statuses</option>
              <option value="SUBMITTED">Submitted (Pending Scrutiny)</option>
              <option value="UNDER_SCRUTINY">Under Scrutiny</option>
              <option value="CORRECTION_REQUIRED">Correction Required</option>
              <option value="ACCEPTED">Accepted (Fee Demand)</option>
              <option value="FEE_PAID">Fee Paid (Ready to Assign)</option>
              <option value="ASSIGNED">Assigned to Officer/GATC</option>
              <option value="SCHEDULED">Scheduled for Inspection</option>
              <option value="INSPECTION_IN_PROGRESS">Inspection In Progress</option>
              <option value="COMPLETED">Completed (Certificate Issued)</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              aria-label="Filter by Service Type"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-gov-600 focus:bg-white"
            >
              <option value="ALL">All Service Types</option>
              <option value="INITIAL_VERIFICATION">Initial Verification (New)</option>
              <option value="PERIODIC_RE_VERIFICATION">Periodic Re-Verification (Annual)</option>
              <option value="RE_VERIFICATION_AFTER_REPAIR">Re-Verification After Repair</option>
              <option value="RE_VERIFICATION_AFTER_RELOCATION">Re-Verification After Relocation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Instrument UID</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Applicant &amp; Organization</th>
                <th className="py-3 px-4">Assigned Authority</th>
                <th className="py-3 px-4">Fee Status</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-gov-800">
                    <Link to={`/applications/${app.id}`} className="hover:underline">
                      {app.id}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-800 font-medium">
                    <Link to={`/instruments/${app.instrumentId}`} className="hover:text-gov-700 hover:underline">
                      {app.instrumentId}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {app.serviceType.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{app.organization}</p>
                    <p className="text-[11px] text-slate-500">{app.applicantName} • {app.district}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    {app.assignedToName ? (
                      <div>
                        <span className="font-semibold text-slate-800">{app.assignedToName}</span>
                        <span className="block text-[10px] text-slate-500 font-medium">({app.assignedToType})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 font-semibold ${
                      app.feeStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      ₹{app.feeAmount} ({app.feeStatus})
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={app.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/applications/${app.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-gov-50 hover:bg-gov-100 text-gov-800 font-semibold text-xs transition-colors border border-gov-200"
                    >
                      <span>Manage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApps.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            No applications match the selected criteria.
          </div>
        )}
      </div>
    </div>
  );
};
