import React from 'react';
import { Link } from 'react-router-dom';
import { computeMetrics, formatDuration } from '../../services/analytics';
import { storage } from '../../services/storage';
import { UserProfile } from '../../types';
import { Clock, CalendarClock, AlertTriangle, Layers, Timer, FileCheck2, ShieldCheck, MapPin, WifiOff } from 'lucide-react';

const Bar: React.FC<{ label: string; value: number; max: number; tone?: string }> = ({ label, value, max, tone = 'bg-gov-700' }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-28 shrink-0 text-slate-600 truncate">{label}</span>
    <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
      <div className={`h-full ${tone}`} style={{ width: `${max ? Math.max((value / max) * 100, value ? 4 : 0) : 0}%` }} />
    </div>
    <span className="w-6 text-right font-bold text-slate-900">{value}</span>
  </div>
);

const Tile: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; note?: string; warn?: boolean }> = ({ icon, label, value, note, warn }) => (
  <div className={`bg-white rounded-xl border p-4 ${warn ? 'border-amber-300' : 'border-slate-200'}`}>
    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{icon}{label}</div>
    <p className={`text-2xl font-black mt-1 ${warn ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p>
    {note && <p className="text-[11px] text-slate-500">{note}</p>}
  </div>
);

export const PendencyPanel: React.FC<{ user: UserProfile }> = ({ user }) => {
  const m = computeMetrics(user);
  const stageMax = Math.max(1, ...m.byStage.map(s => s.count));
  const ageMax = Math.max(1, ...m.ageing.map(a => a.count));
  const officers = user.role === 'BUSINESS' ? [] : storage.getAllUsers().filter(u => (u.role === 'LMO' || u.role === 'GATC') && (user.role === 'CENTRAL_ADMIN' || u.state === user.state));
  const apps = storage.getApplications();
  const workload = officers.map(o => ({
    o,
    open: apps.filter(a => a.assignedToId === o.id && ['ASSIGNED', 'SCHEDULED', 'RETEST_REQUIRED'].includes(a.status)).length,
    done: apps.filter(a => a.assignedToId === o.id && a.status === 'COMPLETED').length,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile icon={<Layers className="w-3.5 h-3.5" />} label="Open applications" value={m.openCount} />
        <Tile icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Older than 30 days" value={m.breaches} note="Service target: 30 days" warn={m.breaches > 0} />
        <Tile icon={<CalendarClock className="w-3.5 h-3.5" />} label="Visits next 7 days" value={m.inspectionsDue7} />
        <Tile icon={<Clock className="w-3.5 h-3.5" />} label="Visits overdue" value={m.inspectionsOverdue} warn={m.inspectionsOverdue > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Pending by stage</h3>
          {m.byStage.map(s => <Bar key={s.key} label={s.label} value={s.count} max={stageMax} />)}
        </section>
        <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">How long they have waited</h3>
          {m.ageing.map((a, i) => <Bar key={a.label} label={a.label} value={a.count} max={ageMax} tone={i === 3 ? 'bg-rose-500' : i === 2 ? 'bg-amber-500' : 'bg-gov-700'} />)}
        </section>
        <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Pending by district</h3>
          {m.byDistrict.length === 0 ? <p className="text-xs text-slate-500">Nothing pending.</p>
            : m.byDistrict.slice(0, 6).map(d => <Bar key={d.district} label={d.district} value={d.count} max={m.byDistrict[0].count} tone="bg-gov-600" />)}
        </section>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Measured results</h3>
          <Link to="/demo" className="text-xs font-semibold text-gov-700 underline">Run the live demo to add a measurement</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile icon={<Timer className="w-3.5 h-3.5" />} label="Application → certificate" value={formatDuration(m.liveRuns.medianMs)} note={m.liveRuns.completed ? `Median of ${m.liveRuns.completed} live run(s) on the database` : 'No live run completed yet'} />
          <Tile icon={<FileCheck2 className="w-3.5 h-3.5" />} label="Paper used" value="0 forms" note={`${m.paperless.docsUploaded} document(s) uploaded, ${m.paperless.certificatesDigital} digital certificate(s)`} />
          <Tile icon={<ShieldCheck className="w-3.5 h-3.5" />} label="Certificates signed" value={`${m.certificates.signedPct}%`} note={`${m.certificates.signed} of ${m.certificates.total}`} />
          <Tile icon={<MapPin className="w-3.5 h-3.5" />} label="Inspections with GPS" value={m.totalInspections ? `${Math.round((m.gpsCaptured / m.totalInspections) * 100)}%` : '—'} note={`${m.offlineInspections} recorded offline`} />
        </div>
        <p className="text-[11px] text-slate-500 flex gap-1.5"><WifiOff className="w-3.5 h-3.5 shrink-0" />Live runs are applications filed through TULA (not the seeded demo records), timed from their own records in the database. Seeded demo records are excluded. Office visits avoided in live runs: {m.paperless.officeVisitsAvoided} (filing and collecting the certificate happen online).</p>
      </section>

      {workload.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Officer workload</h3>
          <ul className="divide-y divide-slate-100">
            {workload.map(w => (
              <li key={w.o.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                <span><strong>{w.o.fullName}</strong> <span className="text-xs text-slate-500">({w.o.role}, {w.o.district})</span></span>
                <span className="text-xs text-slate-700"><strong>{w.open}</strong> open • {w.done} done</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
