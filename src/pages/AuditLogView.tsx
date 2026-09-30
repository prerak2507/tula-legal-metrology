import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { AuditLogEntry } from '../types';
import { History, Search, ShieldCheck, Filter } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [allLogs, setAllLogs] = useState<AuditLogEntry[]>(storage.getAuditLogs());
  const [user, setUser] = useState(storage.getCurrentUser());
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setAllLogs(storage.getAuditLogs());
      setUser(storage.getCurrentUser());
    });
    return unsub;
  }, []);

  const logs = storage.getAuditLogsForUser(user);
  void allLogs;

  const getScopeLabel = () => {
    if (user.role === 'BUSINESS') return `Action Audit Trail for ${user.organization}`;
    if (user.role === 'LMO') return `${user.district}, ${user.state} (officer: ${user.fullName})`;
    if (user.role === 'GATC') return `GATC Lab Operations Audit (${user.gatcCode || user.organization})`;
    if (user.role === 'CONTROLLER') return `${user.state} State Legal Metrology Audit Trail`;
    if (user.role === 'STATE_ADMIN') return `${user.state} State Governance Audit Trail`;
    return 'All States';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEntity = entityFilter === 'ALL' || log.entityType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <History className="w-5 h-5 text-gov-700" />
          <span className="text-xs font-bold text-gov-800 uppercase tracking-wider">
            Regulatory Compliance Audit
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Security &amp; Action Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable audit log recording every application transition, field observation, seal application, and certificate generation.
        </p>
      </div>

      {/* Scope Banner */}
      <div className="bg-gov-50/80 border border-gov-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gov-700 animate-pulse" />
          <span className="font-semibold text-gov-900">Audit Scope:</span>
          <span className="text-gov-800">{getScopeLabel()}</span>
        </div>
        <span className="text-[11px] font-bold text-gov-800 bg-white px-2.5 py-0.5 rounded-full border border-gov-200 shadow-xs">
          {filteredLogs.length} Events Logged
        </span>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search audit trail by Action, Officer Name, Entity ID, or Event text..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-gov-600 focus:bg-white"
          />
        </div>

        <div className="sm:w-56">
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            aria-label="Filter by Entity Type"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-gov-600 focus:bg-white"
          >
            <option value="ALL">All Entity Types</option>
            <option value="CERTIFICATE">Certificates</option>
            <option value="APPLICATION">Applications</option>
            <option value="INSPECTION">Inspections &amp; Stamps</option>
            <option value="INSTRUMENT">Instruments</option>
            <option value="ENFORCEMENT">Enforcement Notices</option>
            <option value="USER">User Sessions</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor &amp; Role</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Event Description</th>
                <th className="py-3 px-4 text-right">Host IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900">{log.actorName}</span>
                    <span className="block text-[10px] text-gov-700 font-semibold">{log.actorRole}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-gov-800 text-[11px] bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 font-medium whitespace-nowrap">
                    {log.entityType} ({log.entityId})
                  </td>
                  <td className="py-3 px-4 text-slate-700 text-xs leading-relaxed max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono text-[10px] whitespace-nowrap">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            No audit records matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
