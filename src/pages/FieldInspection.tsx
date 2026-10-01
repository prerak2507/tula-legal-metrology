import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { Application, UserProfile } from '../types';
import { OfficerInspection } from '../components/field/OfficerInspection';
import { StatusBadge } from '../components/common/StatusBadge';
import { Scale, AlertTriangle, Calendar, Clock, ShieldCheck, MapPin, CheckCircle2, Smartphone } from 'lucide-react';

const BusinessVisits: React.FC<{ currentUser: UserProfile; applications: Application[] }> = ({ currentUser, applications }) => {
  const scheduledApps = applications.filter(a => a.status === 'SCHEDULED' || a.status === 'ASSIGNED' || a.status === 'INSPECTION_IN_PROGRESS');
  const completedApps = applications.filter(a => a.status === 'COMPLETED');
  return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gov-800 to-gov-950 text-white p-6 rounded-lg shadow-md border border-gov-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-white/10">
                  Commercial Occupier Portal
                </span>
                <span className="text-xs text-white/50">•</span>
                <span className="text-xs text-white/70">{currentUser.organization}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Officer visits to your premises
              </h1>
              <p className="text-xs text-white/70 mt-1 max-w-2xl leading-relaxed">
                See when an officer is coming, how to prepare, and your verified instruments.
              </p>
            </div>
            <Link
              to="/applications/new"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm shrink-0"
            >
              <Scale className="w-4 h-4" />
              Book New Inspection
            </Link>
          </div>
        </div>

        {/* Section 24 Statutory Advisory */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Statutory Requirement: Section 24, Legal Metrology Act, 2009</p>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Verification and stamping are performed exclusively by authorized government Legal Metrology Officers (LMO) or accredited Government Approved Test Centres (GATC). Occupiers must ensure instruments are accessible and maintain unbroken seals.
            </p>
          </div>
        </div>

        {/* Scheduled Inspections Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gov-700" />
              Upcoming Scheduled Inspector Visits ({scheduledApps.length})
            </h2>
            <span className="text-xs text-slate-500">Live Status</span>
          </div>

          {scheduledApps.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No upcoming field inspections currently scheduled for your premises.
            </div>
          ) : (
            scheduledApps.map(app => {
              const inst = storage.getInstrumentById(app.instrumentId);
              return (
                <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gov-800 bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                          {app.id}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {inst?.categoryName || app.instrumentId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Instrument UID: <strong className="font-mono text-slate-700">{app.instrumentId}</strong></p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gov-100 text-gov-800 border border-gov-200">
                      Visit Scheduled
                    </span>
                  </div>

                  {/* Visit Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Scheduled Visit Date</span>
                      <strong className="text-slate-900 font-bold flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-gov-700" />
                        {app.scheduledDate ? `${app.scheduledDate} (${app.scheduledTimeSlot})` : 'Date not fixed yet'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Visiting Officer</span>
                      <strong className="text-slate-900 font-bold flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {app.assignedToName || 'Not assigned yet'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Premises Location</span>
                      <strong className="text-slate-900 font-semibold flex items-center gap-1 mt-0.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {app.location || inst?.installationAddress}
                      </strong>
                    </div>
                  </div>

                  {/* Pre-Inspection Checklist for Occupier */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Pre-Inspection Site Preparation Checklist:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Instrument powered on 30 min before visit</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Spirit level bubble centered correctly</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Central Model Approval certificate copy on site</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Platform unobstructed and clear of dirt/debris</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <Link
                      to={`/applications/${app.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-gov-800 hover:text-gov-900"
                    >
                      View Full Application File &rarr;
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Completed Past Inspections */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Verified &amp; Stamped Instruments ({completedApps.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedApps.map(app => {
              const inst = storage.getInstrumentById(app.instrumentId);
              return (
                <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800">{app.instrumentId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      VERIFIED &amp; STAMPED
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900">{inst?.categoryName}</p>
                  <p className="text-[11px] text-slate-500">Verified at: {app.location}</p>
                  {inst?.currentCertificateId && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">Cert: {inst.currentCertificateId}</span>
                      <Link
                        to={`/certificates/${inst.currentCertificateId}`}
                        className="text-xs font-bold text-gov-700 hover:text-gov-900"
                      >
                        View Certificate &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
};

/** Controllers and admins: every field job in their jurisdiction and where it stands. */
const SupervisorView: React.FC<{ applications: Application[] }> = ({ applications }) => {
  const jobs = applications.filter(a => ['ASSIGNED', 'SCHEDULED', 'INSPECTED_PENDING_SYNC', 'RETEST_REQUIRED', 'ADJUSTMENT_REQUIRED'].includes(a.status));
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-slate-900 text-white p-5 rounded-xl flex items-center gap-3">
        <Smartphone className="w-6 h-6 text-amber-400" />
        <div>
          <h1 className="font-extrabold text-lg">Field jobs in your jurisdiction</h1>
          <p className="text-xs text-slate-400">Inspections are recorded by the assigned LMO or GATC on their phone. Sign in as that officer to record one.</p>
        </div>
      </div>
      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">No field jobs are open right now.</div>
      ) : jobs.map(a => (
        <Link key={a.id} to={`/applications/${a.id}`} className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-gov-300">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono font-bold text-sm text-gov-800">{a.id}</span>
            <StatusBadge status={a.status} />
          </div>
          <p className="text-sm text-slate-800 mt-1">{a.organization} • {a.location}</p>
          <p className="text-xs text-slate-500 mt-0.5">{a.assignedToName ? `${a.assignedToName} (${a.assignedToType})` : 'No officer'}{a.scheduledDate ? ` • ${a.scheduledDate}, ${a.scheduledTimeSlot}` : ''}</p>
        </Link>
      ))}
    </div>
  );
};

export const FieldInspection: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(storage.getCurrentUser());
  const [apps, setApps] = useState<Application[]>(storage.getApplicationsForUser());
  useEffect(() => storage.subscribe(() => { setUser(storage.getCurrentUser()); setApps(storage.getApplicationsForUser()); }), []);
  if (user.role === 'BUSINESS') return <BusinessVisits currentUser={user} applications={apps} />;
  if (user.role === 'LMO' || user.role === 'GATC') return <OfficerInspection />;
  return <SupervisorView applications={apps} />;
};
