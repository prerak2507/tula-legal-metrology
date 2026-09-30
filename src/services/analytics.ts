// Pendency, inspection and impact metrics, computed from the records. Nothing is typed in by hand.
// Live runs (applications created in this browser) are reported separately from seeded demo records.

import { storage } from './storage';
import { INITIAL_APPLICATIONS } from '../data/seedData';
import { Application, UserProfile } from '../types';

const DAY = 86_400_000;
const seededIds = new Set(INITIAL_APPLICATIONS.map(a => a.id));

export const STAGES: { key: string; label: string; statuses: Application['status'][] }[] = [
  { key: 'scrutiny', label: 'Scrutiny', statuses: ['SUBMITTED', 'UNDER_SCRUTINY', 'CORRECTION_REQUIRED'] },
  { key: 'fee', label: 'Fee pending', statuses: ['FEE_PENDING', 'ACCEPTED'] },
  { key: 'assign', label: 'To assign', statuses: ['FEE_PAID', 'ASSIGNMENT_PENDING'] },
  { key: 'visit', label: 'Visit due', statuses: ['ASSIGNED', 'SCHEDULED', 'INSPECTION_IN_PROGRESS', 'RETEST_REQUIRED'] },
  { key: 'sync', label: 'Awaiting sync', statuses: ['INSPECTED_PENDING_SYNC'] },
  { key: 'repair', label: 'Needs repair', statuses: ['ADJUSTMENT_REQUIRED'] },
];

const OPEN = STAGES.flatMap(s => s.statuses);

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 60_000) return `${Math.round(ms / 1000)} s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min`;
  if (ms < DAY) return `${(ms / 3_600_000).toFixed(1)} h`;
  return `${(ms / DAY).toFixed(1)} days`;
}

export function computeMetrics(user: UserProfile = storage.getCurrentUser()) {
  const apps = user.role === 'BUSINESS' ? storage.getApplicationsForUser(user)
    : user.role === 'CENTRAL_ADMIN' ? storage.getApplications()
    : storage.getApplications().filter(a => a.state === user.state);
  const certs = storage.getCertificates();
  const inspections = storage.getInspections();
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(now + 7 * DAY).toISOString().slice(0, 10);

  const open = apps.filter(a => OPEN.includes(a.status));
  const byStage = STAGES.map(s => ({ ...s, count: open.filter(a => s.statuses.includes(a.status)).length }));
  const age = (a: Application) => (now - Date.parse(a.createdAt)) / DAY;
  const ageing = [
    { label: '0–7 days', count: open.filter(a => age(a) <= 7).length },
    { label: '8–15 days', count: open.filter(a => age(a) > 7 && age(a) <= 15).length },
    { label: '16–30 days', count: open.filter(a => age(a) > 15 && age(a) <= 30).length },
    { label: 'Over 30 days', count: open.filter(a => age(a) > 30).length },
  ];
  const districts = new Map<string, number>();
  open.forEach(a => districts.set(a.district, (districts.get(a.district) || 0) + 1));
  const byDistrict = [...districts.entries()].map(([district, count]) => ({ district, count })).sort((a, b) => b.count - a.count);

  const scheduled = apps.filter(a => a.status === 'SCHEDULED');
  const inspectionsDue7 = scheduled.filter(a => a.scheduledDate && a.scheduledDate >= today && a.scheduledDate <= in7).length;
  const inspectionsOverdue = scheduled.filter(a => a.scheduledDate && a.scheduledDate < today).length;
  const appIds = new Set(apps.map(a => a.id));
  const myInspections = inspections.filter(i => appIds.has(i.applicationId));
  const monthStart = today.slice(0, 8) + '01';
  const inspectionsThisMonth = myInspections.filter(i => i.inspectionDate.slice(0, 10) >= monthStart).length;
  const offlineInspections = myInspections.filter(i => i.createdAt && storage.getAuditLogs().some(l => l.entityId === i.id && l.action === 'INSPECTION_RECORDED_OFFLINE')).length;
  const gpsCaptured = myInspections.filter(i => i.locationSource === 'DEVICE_GPS').length;

  // Turnaround: application filed -> certificate issued
  const turnaround = (subset: Application[]) => subset
    .filter(a => a.status === 'COMPLETED')
    .map(a => {
      const c = certs.find(x => x.applicationId === a.id);
      return c ? Date.parse(c.issuedAt) - Date.parse(a.createdAt) : null;
    })
    .filter((x): x is number => x !== null && x >= 0);
  const liveApps = apps.filter(a => !seededIds.has(a.id));
  const liveTurnaround = turnaround(liveApps);
  const allTurnaround = turnaround(apps);

  const myCerts = certs.filter(c => appIds.has(c.applicationId) || user.role === 'CENTRAL_ADMIN');
  const signed = myCerts.filter(c => c.signatureStatus === 'SIGNED').length;

  const docsUploaded = apps.reduce((n, a) => n + a.documents.filter(d => d.fileUrl?.startsWith('data:')).length, 0);
  const completedLive = liveApps.filter(a => a.status === 'COMPLETED').length;

  const breaches = open.filter(a => age(a) > 30).length;

  return {
    openCount: open.length,
    byStage, ageing, byDistrict, breaches,
    inspectionsDue7, inspectionsOverdue, inspectionsThisMonth, offlineInspections, gpsCaptured, totalInspections: myInspections.length,
    liveRuns: { count: liveApps.length, completed: completedLive, medianMs: median(liveTurnaround), fastestMs: liveTurnaround.length ? Math.min(...liveTurnaround) : null },
    allRecords: { completed: allTurnaround.length, medianMs: median(allTurnaround) },
    certificates: { total: myCerts.length, signed, signedPct: myCerts.length ? Math.round((signed / myCerts.length) * 100) : 0 },
    paperless: { docsUploaded, certificatesDigital: myCerts.length, officeVisitsAvoided: completedLive * 2 },
  };
}

/** The most recent end-to-end run in this browser, for the live demo stopwatch. */
export function latestRun() {
  const logs = storage.getAuditLogs();
  const issued = logs.find(l => l.action === 'CERTIFICATE_ISSUED');
  if (!issued) return null;
  const cert = storage.getCertificateById(issued.entityId);
  if (!cert) return null;
  const app = storage.getApplicationById(cert.applicationId);
  if (!app || seededIds.has(app.id)) return null;
  const registered = logs.find(l => l.action === 'USER_REGISTERED' && l.entityId === app.applicantId);
  const start = registered ? Date.parse(registered.timestamp) : Date.parse(app.createdAt);
  const appLogs = logs.filter(l => l.entityId === app.id || l.entityId === cert.id);
  return {
    appId: app.id,
    certId: cert.id,
    certNo: cert.certificateNumber,
    fromRegistration: Boolean(registered),
    totalMs: Date.parse(cert.issuedAt) - start,
    applicationToCertificateMs: Date.parse(cert.issuedAt) - Date.parse(app.createdAt),
    actions: appLogs.length,
    signed: cert.signatureStatus === 'SIGNED',
  };
}
