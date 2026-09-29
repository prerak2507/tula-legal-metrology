import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { 
  UserProfile, Instrument, Application, VerificationCertificate, EnforcementCase 
} from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  Scale, FileText, Award, AlertTriangle, CheckCircle, Clock, Smartphone, PlusCircle, 
  ShieldAlert, ArrowRight, MapPin, Calendar, TrendingUp, Users, Globe, BarChart3, Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(storage.getCurrentUser());
  const [instruments, setInstruments] = useState<Instrument[]>(storage.getInstruments());
  const [applications, setApplications] = useState<Application[]>(storage.getApplications());
  const [certificates, setCertificates] = useState<VerificationCertificate[]>(storage.getCertificates());
  const [enforcements, setEnforcements] = useState<EnforcementCase[]>(storage.getEnforcementCases());

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setUser(storage.getCurrentUser());
      setInstruments(storage.getInstruments());
      setApplications(storage.getApplications());
      setCertificates(storage.getCertificates());
      setEnforcements(storage.getEnforcementCases());
    });
    return unsub;
  }, []);

  // ── Role-filtered data ──
  const myInstruments = user.role === 'BUSINESS' 
    ? instruments.filter(i => i.ownerId === user.id)
    : (user.role === 'LMO' || user.role === 'CONTROLLER')
    ? instruments.filter(i => i.state === user.state)
    : (user.role === 'GATC')
    ? instruments.filter(i => i.state === user.state && (i.category.includes('FUEL') || i.category.includes('GAS') || i.category.includes('WEIGHBRIDGE') || i.category.includes('FLOW')))
    : (user.role === 'STATE_ADMIN')
    ? instruments.filter(i => i.state === user.state)
    : instruments; // CENTRAL_ADMIN sees all
    
  const myApplications = user.role === 'BUSINESS'
    ? applications.filter(a => a.applicantId === user.id)
    : (user.role === 'LMO')
    ? applications.filter(a => a.assignedToId === user.id || a.state === user.state)
    : (user.role === 'GATC')
    ? applications.filter(a => a.assignedToId === user.id || (a.state === user.state && a.assignedToType === 'GATC'))
    : (user.role === 'CONTROLLER' || user.role === 'STATE_ADMIN')
    ? applications.filter(a => a.state === user.state)
    : applications;

  const myCertificates = user.role === 'BUSINESS'
    ? certificates.filter(c => c.issuedToName === user.fullName || c.organization === user.organization || c.organization.toLowerCase().includes('apex agro'))
    : (user.role === 'LMO')
    ? certificates.filter(c => c.issuingOfficerName === user.fullName || c.state === user.state)
    : (user.role === 'GATC')
    ? certificates.filter(c => c.issuingOfficerName === user.fullName || c.issuingAuthority.includes('GATC') || (c.state === user.state && (c.category.includes('FUEL') || c.category.includes('GAS'))))
    : (user.role === 'CONTROLLER' || user.role === 'STATE_ADMIN')
    ? certificates.filter(c => c.state === user.state)
    : certificates;

  const myEnforcements = user.role === 'BUSINESS'
    ? enforcements.filter(e => e.businessName.toLowerCase().includes(user.organization.toLowerCase()) || e.violatorName.toLowerCase().includes(user.fullName.toLowerCase()) || e.businessName.toLowerCase().includes('apex agro'))
    : (user.role === 'LMO')
    ? enforcements.filter(e => e.officerId === user.id || e.state === user.state)
    : (user.role === 'GATC')
    ? enforcements.filter(e => e.officerId === user.id || (e.state === user.state && e.businessName.toLowerCase().includes('gujarat gas')))
    : (user.role === 'CONTROLLER' || user.role === 'STATE_ADMIN')
    ? enforcements.filter(e => e.state === user.state)
    : enforcements;

  const jurisdictionInstruments = myInstruments;

  // ── Metrics ──
  const activeInst = jurisdictionInstruments.filter(i => i.status === 'ACTIVE').length;
  const expiringInst = jurisdictionInstruments.filter(i => i.status === 'EXPIRING_SOON').length;
  const expiredInst = jurisdictionInstruments.filter(i => i.status === 'EXPIRED').length;
  const pendingApps = myApplications.filter(a => a.status !== 'COMPLETED' && a.status !== 'REJECTED' && a.status !== 'CANCELLED').length;
  const scheduledInsp = myApplications.filter(a => a.status === 'SCHEDULED' || a.status === 'ASSIGNED').length;

  // ── Chart data ──
  const statusPieData = [
    { name: 'Active', value: activeInst, color: '#10b981' },
    { name: 'Expiring', value: expiringInst, color: '#f59e0b' },
    { name: 'Expired', value: expiredInst, color: '#ef4444' },
    { name: 'Other', value: jurisdictionInstruments.length - activeInst - expiringInst - expiredInst, color: '#0ea5e9' },
  ].filter(d => d.value > 0);

  const categoryMap: Record<string, number> = {};
  jurisdictionInstruments.forEach(i => {
    const label = i.categoryName.split('(')[0].trim();
    categoryMap[label] = (categoryMap[label] || 0) + 1;
  });
  const totalCategoryUnits = jurisdictionInstruments.length || 1;
  const categoryGradients = [
    'from-[#0070C0] to-[#1F497D]',
    'from-[#1B7F5A] to-[#259b6f]',
    'from-[#f59e0b] to-[#d97706]',
    'from-[#8b5cf6] to-[#6366f1]',
    'from-[#0284c7] to-[#0369a1]'
  ];
  const categoryBreakdown = Object.entries(categoryMap).map(([name, count], idx) => ({
    name,
    count,
    percent: Math.round((count / totalCategoryUnits) * 100),
    colorGradient: categoryGradients[idx % categoryGradients.length]
  }));

  // ── Role descriptions ──
  const roleConfig: Record<string, { title: string; subtitle: string; gradient: string }> = {
    BUSINESS: { title: 'My Instruments & Applications', subtitle: 'Track your weighing & measuring instruments, verification status, certificates, and renewal deadlines.', gradient: 'from-[#1F497D] via-[#1b3e6b] to-[#0070C0]' },
    LMO: { title: 'Inspection Command Centre', subtitle: `Badge #${user.badgeNumber || 'N/A'} • ${user.jurisdictionOffice || user.state} • Manage scrutiny, inspections, and enforcement.`, gradient: 'from-[#1F497D] via-[#0f3e6d] to-[#0284c7]' },
    GATC: { title: 'Testing Centre Dashboard', subtitle: `Accreditation: ${user.gatcCode || 'N/A'} • High-capacity and petroleum instrument testing operations.`, gradient: 'from-[#144234] via-[#1B7F5A] to-[#259b6f]' },
    CONTROLLER: { title: 'Regulatory Oversight', subtitle: `${user.state} Controllerate • Pendency tracking, compliance monitoring, and enforcement oversight.`, gradient: 'from-[#2e1d52] via-[#432874] to-[#6035a6]' },
    STATE_ADMIN: { title: 'State Administration', subtitle: `${user.state} — Fee rules, GATC accreditations, and compliance governance.`, gradient: 'from-[#61360c] via-[#854d0e] to-[#b45309]' },
    CENTRAL_ADMIN: { title: 'National Command Centre', subtitle: 'Ministry of Consumer Affairs — Pan-India metrology standards and regulatory analytics.', gradient: 'from-[#0f172a] via-[#1F497D] to-[#0070C0]' },
  };
  const rc = roleConfig[user.role] || roleConfig.BUSINESS;

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ── */}
      <div className={`bg-gradient-to-r ${rc.gradient} rounded-2xl p-6 lg:p-8 text-white shadow-lg`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider border border-white/10">
                {user.role.replace('_', ' ')}
              </span>
              <span className="text-xs text-white/50">•</span>
              <span className="text-xs text-white/60">{user.organization}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {user.role === 'BUSINESS' ? `Welcome back, ${user.fullName.split(' ')[0]}` : rc.title}
            </h1>
            <p className="text-sm text-white/60 mt-1 max-w-2xl leading-relaxed">{rc.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user.role === 'BUSINESS' ? (
              <>
                <Link to="/applications/new" className="inline-flex items-center gap-2 bg-white text-gov-900 font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-white/90 transition-all shadow-lg">
                  <PlusCircle className="w-4 h-4" /> Apply for Verification
                </Link>
                <Link to="/instruments" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded-xl text-xs border border-white/20 transition-all">
                  <Scale className="w-4 h-4" /> My Instruments
                </Link>
              </>
            ) : (user.role === 'LMO' || user.role === 'GATC') ? (
              <>
                <Link to="/field" className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-white/90 transition-all shadow-lg">
                  <Smartphone className="w-4 h-4" /> Start Field Inspection
                </Link>
                <Link to="/applications" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded-xl text-xs border border-white/20 transition-all">
                  <FileText className="w-4 h-4" /> View Queue
                </Link>
              </>
            ) : (
              <Link to="/reports" className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-white/90 transition-all shadow-lg">
                <BarChart3 className="w-4 h-4" /> Analytics & Reports
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards — Role Specific ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {user.role === 'BUSINESS' ? (
          <>
            <StatCard title="My Instruments" value={myInstruments.length} subtitle="Registered Fleet" icon={Scale} variant="blue" />
            <StatCard title="Active & Verified" value={myInstruments.filter(i => i.status === 'ACTIVE').length} subtitle="Schedule IX Compliant" icon={CheckCircle} variant="emerald" />
            <StatCard title="Pending Apps" value={myApplications.filter(a => a.status !== 'COMPLETED' && a.status !== 'REJECTED').length} subtitle="In Progress" icon={FileText} variant="amber" />
            <StatCard title="My Certificates" value={myCertificates.length} subtitle="Issued to You" icon={Award} variant="blue" />
          </>
        ) : (user.role === 'LMO' || user.role === 'GATC') ? (
          <>
            <StatCard title="Jurisdiction Instruments" value={jurisdictionInstruments.length} subtitle={`${user.state} Registry`} icon={Scale} variant="blue" />
            <StatCard title="Pending Scrutiny" value={myApplications.filter(a => a.status === 'UNDER_SCRUTINY' || a.status === 'SUBMITTED').length} subtitle="Needs Your Review" icon={FileText} variant="amber" badge={myApplications.filter(a => a.status === 'UNDER_SCRUTINY').length > 0 ? 'Action' : undefined} />
            <StatCard title="Scheduled Inspections" value={scheduledInsp} subtitle="Field Work Pending" icon={Calendar} variant="blue" badge={scheduledInsp > 0 ? `${scheduledInsp}` : undefined} />
            <StatCard title="Enforcement Cases" value={myEnforcements.filter(e => e.status === 'OPEN' || e.status === 'UNDER_REVIEW').length} subtitle="Active Violations" icon={ShieldAlert} variant="rose" />
          </>
        ) : (
          <>
            <StatCard title="Total Instruments" value={jurisdictionInstruments.length} subtitle={user.role === 'CENTRAL_ADMIN' ? 'Pan-India' : user.state} icon={Scale} variant="blue" />
            <StatCard title="Active & Verified" value={activeInst} subtitle="Compliance Rate" icon={CheckCircle} variant="emerald" />
            <StatCard title="Expiring / Expired" value={expiringInst + expiredInst} subtitle="Needs Attention" icon={AlertTriangle} variant="amber" badge={(expiringInst + expiredInst) > 0 ? 'Alert' : undefined} />
            <StatCard title="Enforcement Actions" value={myEnforcements.length} subtitle="Total Cases" icon={ShieldAlert} variant="rose" />
          </>
        )}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart: Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">
              {user.role === 'BUSINESS' ? 'My Fleet Status' : 'Verification Status'}
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Live</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={4} dataKey="value">
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            {statusPieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="font-bold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart: Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm">
              {user.role === 'BUSINESS' ? 'Instruments by Type' : 'Instruments by Class'}
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Registry</span>
          </div>

          <div className="space-y-3.5 my-auto">
            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No instruments registered in this view.
              </div>
            ) : (
              categoryBreakdown.map(cat => (
                <div key={cat.name} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 group-hover:text-blue-700 transition-colors" title={cat.name}>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">{cat.count} units</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {cat.percent}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${cat.colorGradient} transition-all duration-500`}
                      style={{ width: `${Math.max(cat.percent, 8)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total registered: <strong>{jurisdictionInstruments.length}</strong></span>
            <Link to="/instruments" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
              View catalog &rarr;
            </Link>
          </div>
        </div>

        {/* Activity Queue — Role-Specific */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm">
              {user.role === 'BUSINESS' ? 'My Applications' : user.role === 'LMO' || user.role === 'GATC' ? 'Your Work Queue' : 'Application Pipeline'}
            </h3>
            <Link to="/applications" className="text-xs text-gov-700 hover:text-gov-900 font-semibold flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-72">
            {myApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <FileText className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs font-medium">No applications in your queue</p>
              </div>
            ) : myApplications.slice(0, 5).map(app => (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                className="block p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition-all text-xs group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-gov-800 group-hover:text-gov-900">{app.id}</span>
                  <StatusBadge status={app.status} size="sm" />
                </div>
                <p className="font-semibold text-slate-900 text-[13px] line-clamp-1">
                  {user.role === 'BUSINESS' ? app.instrumentId : `${app.applicantName} — ${app.organization}`}
                </p>
                <div className="flex items-center justify-between text-slate-500 mt-2 text-[11px]">
                  <span>{app.serviceType.replace(/_/g, ' ')}</span>
                  <span>₹{app.feeAmount.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Section — Role-Specific ── */}
      {/* Business: Expiring instruments */}
      {user.role === 'BUSINESS' && myInstruments.filter(i => i.status === 'EXPIRED' || i.status === 'EXPIRING_SOON').length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-rose-50 to-amber-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-sm">Instruments Needing Attention</h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">Renew to avoid Section 24 penalties</span>
          </div>
          <div className="divide-y divide-slate-100">
            {myInstruments.filter(i => i.status === 'EXPIRED' || i.status === 'EXPIRING_SOON').map(inst => (
              <div key={inst.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{inst.id}</span>
                    <StatusBadge status={inst.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600">{inst.categoryName} • {inst.installationAddress}</p>
                  <p className="text-xs text-slate-500">Due: <strong className="text-rose-700">{inst.nextVerificationDueDate}</strong></p>
                </div>
                <Link to={`/applications/new?instrumentId=${inst.id}`} className="px-4 py-2 rounded-lg text-xs font-semibold bg-gov-800 hover:bg-gov-900 text-white transition-colors shrink-0">
                  Apply Re-Verification →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business: Active Enforcement Notices */}
      {user.role === 'BUSINESS' && myEnforcements.filter(e => e.status !== 'CLOSED').length > 0 && (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-sm">Active Statutory Violation Notices</h3>
            </div>
            <Link to="/enforcement" className="text-xs text-rose-700 hover:text-rose-900 font-semibold">
              Section 48 Compounding Desk &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {myEnforcements.filter(e => e.status !== 'CLOSED').map(enf => (
              <div key={enf.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{enf.id}</span>
                    <StatusBadge status={enf.status} size="sm" />
                    <span className="text-[10px] font-mono text-slate-500">{enf.actSection}</span>
                  </div>
                  <p className="text-xs text-slate-600">{enf.offenseCategory.replace(/_/g, ' ')} • {enf.location}</p>
                  <p className="text-[11px] text-rose-700 font-medium">{enf.actionTaken}</p>
                </div>
                <Link to="/enforcement" className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0">
                  Resolve / Pay Fine &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LMO/GATC: Upcoming inspections */}
      {(user.role === 'LMO' || user.role === 'GATC') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">Upcoming Field Inspections</h3>
            </div>
            <Link to="/field" className="text-xs text-gov-700 hover:text-gov-900 font-semibold flex items-center gap-1">
              Open Field Mode <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {myApplications.filter(a => a.status === 'SCHEDULED' || a.status === 'ASSIGNED').map(app => (
              <div key={app.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{app.id}</span>
                    <StatusBadge status={app.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{app.applicantName} — {app.organization}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.location}</span>
                    {app.scheduledDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{app.scheduledDate} {app.scheduledTimeSlot || ''}</span>}
                  </div>
                </div>
                <Link to="/field" className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white transition-colors shrink-0">
                  <Smartphone className="w-3.5 h-3.5 inline mr-1" />Start Inspection
                </Link>
              </div>
            ))}
            {myApplications.filter(a => a.status === 'SCHEDULED' || a.status === 'ASSIGNED').length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">No inspections currently scheduled</div>
            )}
          </div>
        </div>
      )}

      {/* Controller/Admin: Enforcement Overview */}
      {(user.role === 'CONTROLLER' || user.role === 'STATE_ADMIN' || user.role === 'CENTRAL_ADMIN') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-rose-50 to-orange-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-sm">Active Enforcement Cases</h3>
            </div>
            <Link to="/enforcement" className="text-xs text-gov-700 hover:text-gov-900 font-semibold flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {myEnforcements.filter(e => e.status !== 'CLOSED').slice(0, 4).map(enf => (
              <div key={enf.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{enf.id}</span>
                    <StatusBadge status={enf.status} size="sm" />
                    <span className="text-[10px] font-mono text-slate-400">{enf.actSection}</span>
                  </div>
                  <p className="text-xs text-slate-600">{enf.businessName} — {enf.location}</p>
                  <p className="text-[11px] text-slate-500">{enf.offenseCategory.replace(/_/g, ' ')} {enf.penaltyAmount ? `• ₹${enf.penaltyAmount.toLocaleString()} penalty` : ''}</p>
                </div>
                <Link to="/enforcement" className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0">
                  <Eye className="w-3 h-3 inline mr-1" />Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
