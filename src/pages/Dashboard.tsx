import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { UserProfile, Application, Instrument } from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Scale, FileText, Award, AlertTriangle, CheckCircle, Clock, Smartphone, PlusCircle,
  ShieldAlert, ArrowRight, MapPin, Calendar, BarChart3, Settings, WifiOff,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// One layout for every role. What changes is the work list at the top: each role sees its own next actions.

const DAY = 86_400_000;
const ageDays = (iso: string) => Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / DAY));
const OPEN = (a: Application) => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(a.status);

const STAGES: { key: string; label: string; hint: string; statuses: Application['status'][]; mine?: boolean }[] = [
  { key: 'scrutiny', label: 'Document scrutiny', hint: 'Your action', statuses: ['SUBMITTED', 'UNDER_SCRUTINY'], mine: true },
  { key: 'assign', label: 'Officer to assign', hint: 'Your action', statuses: ['ACCEPTED', 'FEE_PAID', 'ASSIGNMENT_PENDING'], mine: true },
  { key: 'trader', label: 'Waiting for trader', hint: 'Corrections or fee', statuses: ['CORRECTION_REQUIRED', 'FEE_PENDING'] },
  { key: 'field', label: 'With field officers', hint: 'Assigned or booked', statuses: ['ASSIGNED', 'SCHEDULED', 'INSPECTION_PENDING', 'INSPECTION_IN_PROGRESS', 'INSPECTED_PENDING_SYNC'] },
  { key: 'retest', label: 'Re-test or repair', hint: 'Owner to fix', statuses: ['RETEST_REQUIRED', 'ADJUSTMENT_REQUIRED'] },
];

const Panel: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, action, children, className = '' }) => (
  <section className={`bg-white rounded-lg border border-paper-300 ${className}`}>
    <div className="px-4 sm:px-5 py-3.5 border-b border-paper-200 flex items-center justify-between gap-3">
      <h2 className="font-semibold text-ink text-[15px]">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const Empty: React.FC<{ text: string; to?: string; cta?: string }> = ({ text, to, cta }) => (
  <div className="px-5 py-8 text-center text-sm text-ink-600">
    <p>{text}</p>
    {to && cta && <Link to={to} className="inline-block mt-2 font-semibold text-ink underline">{cta}</Link>}
  </div>
);

const Row: React.FC<{ to: string; title: React.ReactNode; meta: React.ReactNode; right?: React.ReactNode; cta: string; urgent?: boolean }> = ({ to, title, meta, right, cta, urgent }) => (
  <li>
    <Link to={to} className={`group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-paper-50 border-l-[3px] ${urgent ? 'border-seal' : 'border-transparent'}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink flex flex-wrap items-center gap-2">{title}</div>
        <div className="text-xs text-ink-600 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">{meta}</div>
      </div>
      {right}
      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-ink group-hover:gap-2 transition-all">{cta} <ArrowRight className="w-3.5 h-3.5" /></span>
    </Link>
  </li>
);

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(storage.getCurrentUser());
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = storage.subscribe(() => { setUser(storage.getCurrentUser()); setTick(t => t + 1); });
    return unsub;
  }, []);

  const instruments = storage.getInstrumentsForUser(user);
  const applications = storage.getApplicationsForUser(user);
  const certificates = storage.getCertificatesForUser(user);
  const enforcements = storage.getEnforcementsForUser(user);
  const role = user.role;
  const isField = role === 'LMO' || role === 'GATC';
  const isAdmin = role === 'STATE_ADMIN' || role === 'CENTRAL_ADMIN';

  const active = instruments.filter(i => i.status === 'ACTIVE').length;
  const expiring = instruments.filter(i => i.status === 'EXPIRING_SOON').length;
  const expired = instruments.filter(i => i.status === 'EXPIRED').length;
  const openApps = applications.filter(OPEN);
  const openCases = enforcements.filter(e => e.status !== 'CLOSED');

  const place = role === 'CENTRAL_ADMIN' ? 'All States' : role === 'STATE_ADMIN' ? user.state : `${user.district}, ${user.state}`;
  const firstName = user.fullName.replace(/^(Inspector|Dr\.|Shri|Smt\.)\s+/i, '').split(' ')[0];
  const heading: Record<string, { title: string; text: string }> = {
    BUSINESS: { title: `Namaste, ${firstName}`, text: 'Your instruments, applications and what is due next.' },
    LMO: { title: "Today's inspections", text: `Jobs assigned to you in ${user.district}. They work offline once opened.` },
    GATC: { title: "Today's test jobs", text: 'Heavy and specialised instruments routed to your test centre.' },
    CONTROLLER: { title: 'Pending applications', text: `Every open application in ${user.district}, by stage and age.` },
    STATE_ADMIN: { title: `${user.state} overview`, text: 'Districts, pendency and compliance across the State.' },
    CENTRAL_ADMIN: { title: 'National overview', text: 'Pendency and compliance across participating States.' },
  };
  const h = heading[role] || heading.BUSINESS;

  // ── Role-specific work lists ──
  const myJobs = applications
    .filter(a => a.assignedToId === user.id && ['ASSIGNED', 'SCHEDULED', 'INSPECTION_PENDING', 'INSPECTION_IN_PROGRESS', 'RETEST_REQUIRED'].includes(a.status))
    .sort((a, b) => (a.scheduledDate || '9999').localeCompare(b.scheduledDate || '9999'));
  const offlineWaiting = storage.getOfflineQueue().length;

  const stageCounts = STAGES.map(s => ({ ...s, items: openApps.filter(a => s.statuses.includes(a.status)) }));
  const myActionItems = stageCounts.filter(s => s.mine).flatMap(s => s.items.map(a => ({ a, stage: s.label })))
    .sort((x, y) => x.a.createdAt.localeCompare(y.a.createdAt));

  const traderTodo: { key: string; to: string; title: React.ReactNode; meta: React.ReactNode; cta: string; urgent?: boolean }[] = [
    ...instruments.filter(i => i.status === 'EXPIRED' || i.status === 'EXPIRING_SOON').map((i: Instrument) => ({
      key: i.id, to: `/applications/new?instrumentId=${i.id}`, urgent: i.status === 'EXPIRED',
      title: <>{i.id} <StatusBadge status={i.status} size="sm" /></>,
      meta: <><span>{i.categoryName}</span><span>Due {i.nextVerificationDueDate}</span></>, cta: 'Apply for re-verification',
    })),
    ...openApps.filter(a => a.status === 'CORRECTION_REQUIRED' || a.status === 'FEE_PENDING').map(a => ({
      key: a.id, to: `/applications/${a.id}`, urgent: true,
      title: <>{a.id} <StatusBadge status={a.status} size="sm" /></>,
      meta: <><span>{a.instrumentId}</span><span>₹{a.feeAmount.toLocaleString('en-IN')}</span></>, cta: a.status === 'FEE_PENDING' ? 'Pay the fee' : 'Fix and resubmit',
    })),
    ...openApps.filter(a => a.status === 'SCHEDULED' || a.status === 'ASSIGNED').map(a => ({
      key: a.id, to: `/applications/${a.id}`,
      title: <>{a.id} <StatusBadge status={a.status} size="sm" /></>,
      meta: <><span>{a.assignedToName || 'Officer'} will visit</span>{a.scheduledDate && <span>{a.scheduledDate} {a.scheduledTimeSlot || ''}</span>}</>, cta: 'See details',
    })),
    ...openCases.map(e => ({
      key: e.id, to: '/enforcement', urgent: true,
      title: <>{e.id} <StatusBadge status={e.status} size="sm" /></>,
      meta: <><span>{e.offenseCategory.replace(/_/g, ' ').toLowerCase()}</span><span>{e.actSection}</span></>, cta: 'Respond',
    })),
  ];

  const areaKey = (x: { district: string; state: string }) => (role === 'CENTRAL_ADMIN' ? x.state : x.district);
  const areas = isAdmin ? Array.from(new Set(instruments.map(areaKey).concat(applications.map(areaKey)))).sort().map(name => {
    const inst = instruments.filter(i => areaKey(i) === name);
    const open = openApps.filter(a => areaKey(a) === name);
    return {
      name,
      instruments: inst.length,
      open: open.length,
      oldest: open.length ? Math.max(...open.map(a => ageDays(a.createdAt))) : 0,
      lapsed: inst.filter(i => i.status === 'EXPIRED').length,
      compliance: inst.length ? Math.round((inst.filter(i => i.status === 'ACTIVE' || i.status === 'EXPIRING_SOON').length / inst.length) * 100) : 0,
    };
  }) : [];

  const pie = [
    { name: 'Valid', value: active, color: '#1E6B47' },
    { name: 'Due within 30 days', value: expiring, color: '#B07D2B' },
    { name: 'Expired', value: expired, color: '#A5302A' },
    { name: 'Other', value: instruments.length - active - expiring - expired, color: '#97A6BC' },
  ].filter(d => d.value > 0);

  const btnPrimary = 'inline-flex items-center justify-center gap-2 bg-brass-300 hover:bg-brass-200 text-ink font-semibold px-4 py-2.5 rounded-md text-sm min-h-[44px]';
  const btnGhost = 'inline-flex items-center justify-center gap-2 border border-paper/30 hover:bg-paper/10 text-paper font-semibold px-4 py-2.5 rounded-md text-sm min-h-[44px]';

  return (
    <div className="space-y-5">
      {/* ── Heading: same for every role ── */}
      <section className="relative overflow-hidden rounded-lg bg-ink text-paper p-5 sm:p-6">
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="font-readout text-[11px] uppercase tracking-[0.16em] text-brass-300">{user.organization} · {place}</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-2">{h.title}</h2>
            <p className="text-sm text-paper/70 mt-1 max-w-2xl">{h.text}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {role === 'BUSINESS' && <><Link to="/applications/new" className={btnPrimary}><PlusCircle className="w-4 h-4" /> Apply for verification</Link><Link to="/instruments" className={btnGhost}><Scale className="w-4 h-4" /> My instruments</Link></>}
            {isField && <><Link to="/field" className={btnPrimary}><Smartphone className="w-4 h-4" /> Open field inspection</Link><Link to="/applications" className={btnGhost}><FileText className="w-4 h-4" /> All my jobs</Link></>}
            {role === 'CONTROLLER' && <><Link to="/applications" className={btnPrimary}><FileText className="w-4 h-4" /> Open the queue</Link><Link to="/reports" className={btnGhost}><BarChart3 className="w-4 h-4" /> Pendency report</Link></>}
            {isAdmin && <><Link to="/reports" className={btnPrimary}><BarChart3 className="w-4 h-4" /> Pendency and reports</Link><Link to="/admin/rules" className={btnGhost}><Settings className="w-4 h-4" /> Fees and rules</Link></>}
          </div>
        </div>
      </section>

      {/* ── Controller: queue by stage ── */}
      {role === 'CONTROLLER' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-paper-300 border border-paper-300 rounded-lg overflow-hidden">
          {stageCounts.map(s => (
            <Link key={s.key} to="/applications" className={`bg-white p-4 hover:bg-paper-50 border-t-[3px] ${s.mine && s.items.length ? 'border-brass' : 'border-transparent'}`}>
              <p className="text-xs text-ink-600">{s.label}</p>
              <p className="font-readout text-3xl font-semibold text-ink mt-1 tabular-nums">{s.items.length}</p>
              <p className={`text-[11px] mt-0.5 ${s.mine ? 'text-brass-700 font-semibold' : 'text-ink-600'}`}>{s.hint}</p>
            </Link>
          ))}
        </div>
      )}

      {/* ── Work list: the main thing on every home screen ── */}
      {role === 'BUSINESS' && (
        <Panel title="Needs your attention" action={<span className="text-xs text-ink-600">{traderTodo.length} item{traderTodo.length === 1 ? '' : 's'}</span>}>
          {traderTodo.length === 0
            ? <Empty text="Nothing is due. All your instruments are within validity." to="/applications/new" cta="Apply for a new verification" />
            : <ul className="divide-y divide-paper-200">{traderTodo.map(({ key, ...t }) => <Row key={key} {...t} />)}</ul>}
        </Panel>
      )}

      {isField && (
        <Panel title={`Assigned to you (${myJobs.length})`} action={offlineWaiting > 0 ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-brass-700"><WifiOff className="w-3.5 h-3.5" /> {offlineWaiting} saved offline, will sync</span> : <Link to="/field" className="text-xs font-semibold text-ink underline">Field inspection</Link>}>
          {myJobs.length === 0
            ? <Empty text="No open jobs right now. You can practise on a recent instrument, or run the guided demo to get one assigned." to="/field" cta="Practise an inspection" />
            : <ul className="divide-y divide-paper-200">{myJobs.map(a => (
              <Row key={a.id} to={`/field?applicationId=${a.id}`} urgent={a.status === 'RETEST_REQUIRED'}
                title={<>{a.id} <StatusBadge status={a.status} size="sm" /></>}
                meta={<><span>{a.organization}</span><span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{a.location}</span>{a.scheduledDate && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{a.scheduledDate} {a.scheduledTimeSlot || ''}</span>}</>}
                cta="Inspect" />
            ))}</ul>}
        </Panel>
      )}

      {role === 'CONTROLLER' && (
        <Panel title="Waiting on you, oldest first" action={<span className="text-xs text-ink-600">Over 7 days marked red</span>}>
          {myActionItems.length === 0
            ? <Empty text="Nothing is waiting for scrutiny or assignment." />
            : <ul className="divide-y divide-paper-200">{myActionItems.slice(0, 8).map(({ a, stage }) => {
              const age = ageDays(a.createdAt);
              return (
                <Row key={a.id} to={`/applications/${a.id}`} urgent={age > 7}
                  title={<>{a.id} <span className="font-normal text-ink-600">· {a.organization}</span></>}
                  meta={<><span>{stage}</span><span>{a.serviceType.replace(/_/g, ' ').toLowerCase()}</span><span>{a.instrumentId}</span></>}
                  right={<span className={`font-readout text-sm tabular-nums shrink-0 ${age > 7 ? 'text-seal font-semibold' : 'text-ink-600'}`}>{age} day{age === 1 ? '' : 's'}</span>}
                  cta={stage === 'Document scrutiny' ? 'Scrutinise' : 'Assign'} />
              );
            })}</ul>}
        </Panel>
      )}

      {isAdmin && (
        <Panel title={role === 'CENTRAL_ADMIN' ? 'By State' : 'By district'} action={<Link to="/reports" className="text-xs font-semibold text-ink underline">Full report</Link>}>
          {areas.length === 0 ? <Empty text="No records yet." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-600">
                  <tr className="border-b border-paper-200">
                    <th className="px-5 py-2.5 font-semibold">{role === 'CENTRAL_ADMIN' ? 'State' : 'District'}</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Instruments</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Valid</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Expired</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Open applications</th>
                    <th className="px-5 py-2.5 font-semibold text-right">Oldest open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-200">
                  {areas.map(r => (
                    <tr key={r.name} className="hover:bg-paper-50">
                      <th scope="row" className="px-5 py-3 text-left font-semibold text-ink">{r.name}</th>
                      <td className="px-3 py-3 text-right font-readout tabular-nums">{r.instruments}</td>
                      <td className="px-3 py-3 text-right font-readout tabular-nums">{r.compliance}%</td>
                      <td className={`px-3 py-3 text-right font-readout tabular-nums ${r.lapsed ? 'text-seal font-semibold' : ''}`}>{r.lapsed}</td>
                      <td className="px-3 py-3 text-right font-readout tabular-nums">{r.open}</td>
                      <td className={`px-5 py-3 text-right font-readout tabular-nums ${r.oldest > 7 ? 'text-seal font-semibold' : ''}`}>{r.open ? `${r.oldest} d` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {/* ── Key numbers ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {role === 'BUSINESS' ? (
          <>
            <StatCard title="My instruments" value={instruments.length} subtitle="Registered" icon={Scale} variant="blue" />
            <StatCard title="Valid" value={active + expiring} subtitle="Within validity" icon={CheckCircle} variant="emerald" />
            <StatCard title="Applications open" value={openApps.length} subtitle="In progress" icon={FileText} variant="amber" />
            <StatCard title="Certificates" value={certificates.length} subtitle="Issued to you" icon={Award} variant="slate" />
          </>
        ) : isField ? (
          <>
            <StatCard title="Assigned to you" value={myJobs.length} subtitle="Open jobs" icon={Smartphone} variant="blue" />
            <StatCard title="Booked visits" value={myJobs.filter(a => a.scheduledDate).length} subtitle="With a date" icon={Calendar} variant="amber" />
            <StatCard title="Certificates issued" value={certificates.filter(c => c.issuingOfficerName === user.fullName).length} subtitle="By you" icon={Award} variant="emerald" />
            <StatCard title="Open cases" value={openCases.length} subtitle="Enforcement" icon={ShieldAlert} variant="rose" />
          </>
        ) : (
          <>
            <StatCard title="Instruments" value={instruments.length} subtitle={place} icon={Scale} variant="blue" />
            <StatCard title="Valid" value={instruments.length ? `${Math.round(((active + expiring) / instruments.length) * 100)}%` : '—'} subtitle={`${active + expiring} of ${instruments.length}`} icon={CheckCircle} variant="emerald" />
            <StatCard title="Expired or due" value={expired + expiring} subtitle="Need re-verification" icon={AlertTriangle} variant="amber" />
            <StatCard title="Open cases" value={openCases.length} subtitle="Enforcement" icon={ShieldAlert} variant="rose" />
          </>
        )}
      </div>

      {/* ── Register status and recent applications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5">
        <Panel title={role === 'BUSINESS' ? 'My instruments by status' : 'Register by status'} action={<Link to="/instruments" className="text-xs font-semibold text-ink underline">Open register</Link>}>
          {pie.length === 0 ? <Empty text="No instruments yet." to={role === 'BUSINESS' ? '/instruments' : undefined} cta="Add an instrument" /> : (
            <div className="p-4 sm:p-5 grid grid-cols-[140px_1fr] items-center gap-4">
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pie} cx="50%" cy="50%" innerRadius={40} outerRadius={64} paddingAngle={2} dataKey="value" stroke="none">
                      {pie.map(d => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-sm">
                {pie.map(d => (
                  <li key={d.name} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-ink-700"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />{d.name}</span>
                    <span className="font-readout font-semibold tabular-nums">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title={role === 'BUSINESS' ? 'My applications' : 'Recent applications'} action={<Link to="/applications" className="text-xs font-semibold text-ink underline">View all</Link>}>
          {applications.length === 0 ? <Empty text="No applications yet." to={role === 'BUSINESS' ? '/applications/new' : undefined} cta="Apply for verification" /> : (
            <ul className="divide-y divide-paper-200">
              {[...applications].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5).map(a => (
                <Row key={a.id} to={`/applications/${a.id}`}
                  title={<>{a.id} <StatusBadge status={a.status} size="sm" /></>}
                  meta={<><span>{role === 'BUSINESS' ? a.instrumentId : a.organization}</span><span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />updated {new Date(a.updatedAt).toLocaleDateString('en-IN')}</span></>}
                  cta="Open" />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};
