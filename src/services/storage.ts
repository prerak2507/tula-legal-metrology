import {
  UserProfile, Instrument, Application, InspectionRecord, VerificationCertificate, EnforcementCase, AuditLogEntry,
  NotificationItem, StampingRecord, FeeRule, ValidityRule, UserRole, ApplicationStatus, InstrumentStatus,
  InspectionChecklistItem, TestReadingRow, NotificationTemplate,
} from '../types';
import {
  DEMO_USERS, INITIAL_INSTRUMENTS, INITIAL_APPLICATIONS, INITIAL_CERTIFICATES, INITIAL_INSPECTIONS,
  INITIAL_STAMPINGS, INITIAL_ENFORCEMENT_CASES, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS,
} from '../data/seedData';
import { SEED_SIGNATURES } from '../data/seedSignatures';
import {
  DEFAULT_FEE_RULES, DEFAULT_VALIDITY_RULES, generateDynamicChecklist, buildTestPlan, getValidityPeriodMonths,
  recommendVerdict, evaluateReading, sampleObservedValue, stateCode, quarterMark, prefersGatc, isCategoryGatcEligible,
  calculateStatutoryFee,
} from './rulesEngine';
import { generateCertificateSha256 } from './crypto';
import { requestSignature, fieldsFromCertificate, buildVerifyUrl } from './certSigning';
import { outbox } from './notifications';
import { cloud, cloudEnabled, MAPPINGS } from './cloud';
import { DEMO_PASSWORD } from '../config/cloud';

// Bumped to v2: returning visitors get the corrected seed data instead of stale v1 records.
const K = {
  USERS: 'lm_users_v2',
  CURRENT_USER: 'lm_current_user_v2',
  INSTRUMENTS: 'lm_instruments_v2',
  APPLICATIONS: 'lm_applications_v2',
  CERTIFICATES: 'lm_certificates_v2',
  INSPECTIONS: 'lm_inspections_v2',
  STAMPINGS: 'lm_stampings_v2',
  ENFORCEMENTS: 'lm_enforcements_v2',
  AUDIT_LOGS: 'lm_audit_logs_v2',
  NOTIFICATIONS: 'lm_notifications_v2',
  FEE_RULES: 'lm_fee_rules_v3',
  VALIDITY_RULES: 'lm_validity_rules_v3',
  OFFLINE_QUEUE: 'lm_offline_queue_v2',
  REMINDER_LOG: 'lm_reminder_log_v2',
};

const memoryStore = new Map<string, string>();
const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) return window.localStorage.getItem(key);
    } catch { /* blocked */ }
    return memoryStore.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch { /* blocked or full */ }
    memoryStore.set(key, value);
  },
};

const load = <T,>(key: string, fallback: T): T => {
  const raw = safeStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};
/** Writes locally and queues the changed records for the live database. */
const save = (key: string, value: unknown) => {
  if (MAPPINGS[key] && Array.isArray(value)) cloud.onLocalWrite(key, load<unknown[]>(key, []), value);
  safeStorage.setItem(key, JSON.stringify(value));
};
/** Local-only write (used when applying data that came from the database). */
const saveLocal = (key: string, value: unknown) => safeStorage.setItem(key, JSON.stringify(value));

const sortKey = (o: any): string => o?.createdAt || o?.timestamp || o?.issuedAt || o?.inspectionDate || o?.stampedAt || '';

/** Database-issued sequential id when signed in; local sequence otherwise (tests, offline demo). */
async function newId(localIds: string[], prefix: string, pad: number): Promise<string> {
  if (cloudEnabled && cloud.session()) return cloud.nextId(prefix, pad);
  return nextSeq(localIds, prefix, pad);
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const origin = () => (typeof window !== 'undefined' ? window.location.origin : 'https://tula-legal-metrology.vercel.app');
const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/** Next sequential id for a prefix, based on the highest existing number (never reuses an id). */
function nextSeq(ids: string[], prefix: string, pad: number): string {
  let max = 0;
  for (const id of ids) {
    if (!id.startsWith(prefix)) continue;
    const n = parseInt(id.slice(prefix.length), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
}

export class WorkflowError extends Error {}

/** Statuses before an officer is assigned; scrutiny and fee can still move the status. */
const PRE_ASSIGNMENT: ApplicationStatus[] = ['SUBMITTED', 'UNDER_SCRUTINY', 'ACCEPTED', 'FEE_PENDING', 'FEE_PAID', 'ASSIGNMENT_PENDING'];
const OPEN_STATUSES: ApplicationStatus[] = [...PRE_ASSIGNMENT, 'CORRECTION_REQUIRED', 'ASSIGNED', 'SCHEDULED', 'INSPECTION_IN_PROGRESS', 'INSPECTED_PENDING_SYNC', 'RETEST_REQUIRED', 'ADJUSTMENT_REQUIRED'];
const OFFICER_ROLES: UserRole[] = ['LMO', 'GATC', 'CONTROLLER', 'STATE_ADMIN', 'CENTRAL_ADMIN'];

export interface QueuedInspection {
  queueId: string;
  applicationId: string;
  inspectionId: string;
  officerId: string;
  queuedAt: string;
  attempts: number;
  stampType?: StampingRecord['stampType'];
  lastError?: string;
}

export interface InspectionSubmission {
  applicationId: string;
  checklist: InspectionChecklistItem[];
  testReadings: TestReadingRow[];
  evidencePhotos: InspectionRecord['evidencePhotos'];
  inspectorRemarks: string;
  result: 'PASS' | 'FAIL' | 'ADJUSTMENT_REQUIRED' | 'RETEST_REQUIRED';
  adjustmentDetails?: string;
  stampType?: StampingRecord['stampType'];
  gps?: { lat: number; lng: number; accuracy: number } | null;
}

class MetrologyStorageService {
  private listeners = new Set<() => void>();
  private syncing = false;

  constructor() {
    this.initStorage();
    cloud.registerApplier({
      replaceAll: (key, items, keepIds) => {
        const m = MAPPINGS[key];
        const local = load<any[]>(key, []);
        const kept = local.filter(o => keepIds.has(m.key(o)));
        const merged = [...kept, ...(items as any[]).filter(o => !keepIds.has(m.key(o)))];
        merged.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
        saveLocal(key, merged);
        this.notify();
      },
      upsertOne: (key, item) => {
        const m = MAPPINGS[key];
        const list = load<any[]>(key, []);
        const idx = list.findIndex(o => m.key(o) === m.key(item));
        if (idx >= 0) list[idx] = item; else list.unshift(item);
        saveLocal(key, list);
        this.notify();
      },
      setProfiles: profiles => {
        const demoIds = new Set(DEMO_USERS.map(u => u.id));
        saveLocal(K.USERS, profiles.filter(p => !demoIds.has(p.id)));
        this.notify();
      },
      setCurrentUser: u => {
        if (u) saveLocal(K.CURRENT_USER, u);
        else safeStorage.setItem(K.CURRENT_USER, '');
        this.notify();
      },
      instrumentState: id => load<Instrument[]>(K.INSTRUMENTS, []).find(i => i.id === id)?.state,
      currentState: () => load<UserProfile | null>(K.CURRENT_USER, null)?.state,
    });
  }

  /** True when the live database is in use and someone is signed in. */
  isLive(): boolean {
    return cloudEnabled && !!cloud.session();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  private seedCertificates(): VerificationCertificate[] {
    return INITIAL_CERTIFICATES.map(c => {
      const sig = SEED_SIGNATURES[c.id];
      return sig
        ? { ...c, signatureStatus: 'SIGNED', signedPayload: sig.p, signature: sig.s, signingKid: sig.kid, signedAt: sig.iat, qrPayloadUrl: buildVerifyUrl(origin(), c.certificateNumber, sig.p, sig.s) }
        : { ...c, signatureStatus: 'LEGACY_UNSIGNED', qrPayloadUrl: buildVerifyUrl(origin(), c.certificateNumber) };
    });
  }

  private initStorage(): void {
    const init = (key: string, value: unknown) => {
      if (!safeStorage.getItem(key)) saveLocal(key, value);
    };
    init(K.USERS, []);
    init(K.CURRENT_USER, DEMO_USERS[0]);
    init(K.INSTRUMENTS, INITIAL_INSTRUMENTS);
    init(K.APPLICATIONS, INITIAL_APPLICATIONS);
    init(K.CERTIFICATES, this.seedCertificates());
    init(K.INSPECTIONS, INITIAL_INSPECTIONS);
    init(K.STAMPINGS, INITIAL_STAMPINGS);
    init(K.ENFORCEMENTS, INITIAL_ENFORCEMENT_CASES);
    init(K.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    init(K.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    init(K.FEE_RULES, DEFAULT_FEE_RULES);
    init(K.VALIDITY_RULES, DEFAULT_VALIDITY_RULES);
    init(K.OFFLINE_QUEUE, []);
  }

  // ------------------------------------------------------------------ users
  getCurrentUser(): UserProfile {
    return load<UserProfile>(K.CURRENT_USER, DEMO_USERS[0]);
  }

  setCurrentUser(user: UserProfile): void {
    save(K.CURRENT_USER, user);
    this.addAuditLog('USER_LOGIN', 'USER', user.id, `${user.fullName} signed in as ${user.role}`);
    this.notify();
  }

  /** Signs in as one of the six evaluator accounts (real sign-in when the live database is on). */
  async switchDemoRole(role: UserRole): Promise<void> {
    const found = DEMO_USERS.find(u => u.role === role);
    if (!found) return;
    if (cloudEnabled) {
      const profile = await cloud.signIn(found.email, DEMO_PASSWORD);
      this.addAuditLog('USER_LOGIN', 'USER', profile.id, `${profile.fullName} signed in as ${profile.role}`);
      this.notify();
      return;
    }
    this.setCurrentUser(found);
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    const profile = await cloud.signIn(email, password);
    this.addAuditLog('USER_LOGIN', 'USER', profile.id, `${profile.fullName} signed in as ${profile.role}`);
    this.notify();
    return profile;
  }

  async signOut(): Promise<void> {
    await cloud.signOut();
    this.notify();
  }

  getAllDemoUsers(): UserProfile[] {
    return DEMO_USERS;
  }

  getRegisteredUsers(): UserProfile[] {
    return load<UserProfile[]>(K.USERS, []);
  }

  getAllUsers(): UserProfile[] {
    const seen = new Set<string>();
    return [...DEMO_USERS, ...this.getRegisteredUsers()].filter(u => (seen.has(u.id) ? false : (seen.add(u.id), true)));
  }

  getUserById(id: string): UserProfile | undefined {
    return this.getAllUsers().find(u => u.id === id);
  }

  /** Self-registration for businesses. Phone is marked verified after the OTP step in the UI. */
  registerBusinessUser(input: {
    fullName: string; organization: string; email: string; phone: string; gstin?: string;
    address: string; state: string; district: string; notifyByEmail: boolean; notifyBySms: boolean;
  }): UserProfile {
    const users = this.getRegisteredUsers();
    const email = input.email.trim().toLowerCase();
    if (this.getAllUsers().some(u => u.email.toLowerCase() === email)) {
      throw new WorkflowError('An account with this email already exists. Sign in instead.');
    }
    const id = nextSeq(users.map(u => u.id), 'usr-self-', 4);
    const user: UserProfile = {
      id,
      email,
      fullName: input.fullName.trim(),
      organization: input.organization.trim(),
      role: 'BUSINESS',
      phone: input.phone.trim(),
      address: input.address.trim(),
      state: input.state,
      district: input.district.trim(),
      gstin: input.gstin?.trim().toUpperCase() || undefined,
      accountType: 'SELF',
      phoneVerified: true,
      notifyByEmail: input.notifyByEmail,
      notifyBySms: input.notifyBySms,
      createdAt: new Date().toISOString(),
    };
    save(K.USERS, [...users, user]);
    save(K.CURRENT_USER, user);
    this.addAuditLog('USER_REGISTERED', 'USER', id, `Business account created for ${user.organization} (${user.state})`);
    this.notify();
    return user;
  }

  /** Officers for a state, least-loaded first. */
  getOfficers(role: 'LMO' | 'GATC', state: string): UserProfile[] {
    const load = (id: string) => this.getApplications().filter(a => a.assignedToId === id && ['ASSIGNED', 'SCHEDULED'].includes(a.status)).length;
    return this.getAllUsers().filter(u => u.role === role && u.state === state).sort((a, b) => load(a.id) - load(b.id));
  }

  // ------------------------------------------------------------ rules (per state, editable)
  getFeeRules(): FeeRule[] {
    return load<FeeRule[]>(K.FEE_RULES, DEFAULT_FEE_RULES);
  }
  saveFeeRules(rules: FeeRule[]): void {
    save(K.FEE_RULES, rules);
    this.addAuditLog('FEE_RULES_UPDATED', 'FEE_RULE', 'fee-rules', `Fee schedule updated (${rules.length} rules)`);
    this.notify();
  }
  getValidityRules(): ValidityRule[] {
    return load<ValidityRule[]>(K.VALIDITY_RULES, DEFAULT_VALIDITY_RULES);
  }
  saveValidityRules(rules: ValidityRule[]): void {
    save(K.VALIDITY_RULES, rules);
    this.addAuditLog('VALIDITY_RULES_UPDATED', 'FEE_RULE', 'validity-rules', `Validity periods updated (${rules.length} rules)`);
    this.notify();
  }
  feeFor(inst: Instrument) {
    return calculateStatutoryFee(inst.category, inst.state, this.getFeeRules(), {
      capacity: inst.capacity, accuracyClass: inst.accuracyClass, atPremises: true, dueDate: inst.nextVerificationDueDate,
    });
  }

  // ------------------------------------------------------------ instruments
  getInstruments(): Instrument[] {
    return load<Instrument[]>(K.INSTRUMENTS, []).map(i => ({ ...i, status: this.deriveInstrumentStatus(i) }));
  }

  /** What a user may see: owners see their own, officers their state, central admin everything. */
  getInstrumentsForUser(user: UserProfile = this.getCurrentUser()): Instrument[] {
    const all = this.getInstruments();
    if (user.role === 'BUSINESS') return all.filter(i => i.ownerId === user.id);
    if (user.role === 'CENTRAL_ADMIN') return all;
    return all.filter(i => i.state === user.state);
  }

  getApplicationsForUser(user: UserProfile = this.getCurrentUser()): Application[] {
    const all = this.getApplications();
    if (user.role === 'BUSINESS') return all.filter(a => a.applicantId === user.id);
    if (user.role === 'CENTRAL_ADMIN') return all;
    if (user.role === 'LMO' || user.role === 'GATC') return all.filter(a => a.assignedToId === user.id || (a.state === user.state && !a.assignedToId));
    return all.filter(a => a.state === user.state);
  }

  getCertificatesForUser(user: UserProfile = this.getCurrentUser()): VerificationCertificate[] {
    const all = this.getCertificates();
    if (user.role === 'BUSINESS') {
      const owned = new Set(this.getInstrumentsForUser(user).map(i => i.id));
      return all.filter(c => owned.has(c.instrumentId));
    }
    if (user.role === 'CENTRAL_ADMIN') return all;
    return all.filter(c => c.state === user.state);
  }

  getEnforcementsForUser(user: UserProfile = this.getCurrentUser()): EnforcementCase[] {
    const all = this.getEnforcementCases();
    if (user.role === 'BUSINESS') {
      const owned = new Set(this.getInstrumentsForUser(user).map(i => i.id));
      return all.filter(e => owned.has(e.instrumentId));
    }
    if (user.role === 'CENTRAL_ADMIN') return all;
    return all.filter(e => e.state === user.state);
  }

  /** Validity dates decide EXPIRING_SOON / EXPIRED, so status never goes stale. */
  private deriveInstrumentStatus(i: Instrument): InstrumentStatus {
    if (!['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'].includes(i.status) || !i.nextVerificationDueDate) return i.status;
    const days = Math.ceil((Date.parse(i.nextVerificationDueDate) - Date.parse(todayStr())) / 86_400_000);
    if (days < 0) return 'EXPIRED';
    if (days <= 30) return 'EXPIRING_SOON';
    return 'ACTIVE';
  }

  getInstrumentById(id: string): Instrument | undefined {
    return this.getInstruments().find(i => i.id === id);
  }

  async registerInstrument(newInst: Omit<Instrument, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Instrument> {
    const instruments = load<Instrument[]>(K.INSTRUMENTS, []);
    if (instruments.some(i => i.serialNumber.trim().toLowerCase() === newInst.serialNumber.trim().toLowerCase() && i.manufacturer === newInst.manufacturer)) {
      throw new WorkflowError('An instrument with this manufacturer and serial number is already registered.');
    }
    const year = new Date().getFullYear();
    const id = await newId(instruments.map(i => i.id), `LM-${stateCode(newInst.state)}-${year}-`, 6);
    const instrument: Instrument = { ...newInst, id, status: 'REGISTERED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    save(K.INSTRUMENTS, [instrument, ...load<Instrument[]>(K.INSTRUMENTS, [])]);
    this.addAuditLog('INSTRUMENT_REGISTERED', 'INSTRUMENT', id, `Registered ${newInst.categoryName}, serial ${newInst.serialNumber}`);
    this.notify();
    return instrument;
  }

  updateInstrument(id: string, updates: Partial<Instrument>): Instrument | undefined {
    const instruments = load<Instrument[]>(K.INSTRUMENTS, []);
    const idx = instruments.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    instruments[idx] = { ...instruments[idx], ...updates, updatedAt: new Date().toISOString() };
    save(K.INSTRUMENTS, instruments);
    this.notify();
    return instruments[idx];
  }

  // ------------------------------------------------------------ applications
  getApplications(): Application[] {
    return load<Application[]>(K.APPLICATIONS, []);
  }

  getApplicationById(id: string): Application | undefined {
    return this.getApplications().find(a => a.id === id);
  }

  private writeApp(app: Application) {
    save(K.APPLICATIONS, this.getApplications().map(a => (a.id === app.id ? app : a)));
  }

  private contactFor(userId: string) {
    const u = this.getUserById(userId);
    return {
      email: u && u.notifyByEmail !== false ? u.email : undefined,
      phone: u && u.notifyBySms !== false ? u.phone : undefined,
    };
  }

  private message(template: NotificationTemplate, recipientId: string, params: Record<string, string>) {
    outbox.queue({ template, recipientId, ...this.contactFor(recipientId), params });
  }

  async createApplication(app: Omit<Application, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'scrutinyItems'>): Promise<Application> {
    const inst = this.getInstrumentById(app.instrumentId);
    if (!inst) throw new WorkflowError('Instrument not found.');
    if (inst.ownerId !== app.applicantId) throw new WorkflowError('You can only apply for instruments registered to your account.');
    const open = this.getApplications().find(a => a.instrumentId === inst.id && OPEN_STATUSES.includes(a.status));
    if (open) throw new WorkflowError(`Application ${open.id} is already open for this instrument.`);
    if (!app.documents.length) throw new WorkflowError('Attach at least the model approval certificate.');

    const apps = this.getApplications();
    const id = await newId(apps.map(a => a.id), `APP-${new Date().getFullYear()}-`, 5);
    const scrutinyItems = [
      { id: 'scr-1', title: 'Applicant identity and business registration', description: 'Name, GSTIN and address match the account', passed: null },
      { id: 'scr-2', title: 'Model approval', description: 'Model approval number on the certificate matches the instrument', passed: null },
      { id: 'scr-3', title: 'Site readiness', description: 'Site is accessible and test weights / prover can be brought in', passed: null },
    ];
    const newApp: Application = {
      ...app,
      documents: app.documents.map(d => ({ ...d, reviewStatus: 'SUBMITTED' })),
      id,
      status: 'SUBMITTED',
      scrutinyItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    save(K.APPLICATIONS, [newApp, ...this.getApplications()]);
    this.updateInstrument(app.instrumentId, { status: 'UNDER_VERIFICATION' });
    this.addAuditLog('APPLICATION_SUBMITTED', 'APPLICATION', id, `Application for ${app.instrumentId} submitted (fee Rs ${app.feeAmount})`);
    this.createNotification({
      recipientId: app.applicantId, recipientRole: 'BUSINESS', title: 'Application submitted',
      message: `${id} for ${app.instrumentId} is with the ${app.district} office for scrutiny. Pay the fee to avoid delay.`,
      type: 'SUCCESS', link: `/applications/${id}`, channel: 'IN_APP',
    });
    this.message('APPLICATION_SUBMITTED', app.applicantId, { appId: id, instrumentId: app.instrumentId, link: `${origin()}/applications/${id}` });
    this.notify();
    return newApp;
  }

  /** Status before assignment is derived from scrutiny and fee, so it can never disagree with them. */
  private recomputePreAssignment(app: Application): Application {
    if (!PRE_ASSIGNMENT.includes(app.status)) return app;
    const items = app.scrutinyItems;
    const allPassed = items.every(i => i.passed === true);
    const anyReviewed = items.some(i => i.passed !== null);
    let status: ApplicationStatus;
    if (allPassed) status = app.feeStatus === 'PAID' || app.feeStatus === 'EXEMPT' ? 'ASSIGNMENT_PENDING' : 'FEE_PENDING';
    else if (anyReviewed) status = 'UNDER_SCRUTINY';
    else status = 'SUBMITTED';
    return { ...app, status };
  }

  updateApplicationStatus(id: string, status: ApplicationStatus, notes?: string): Application | undefined {
    const app = this.getApplicationById(id);
    if (!app) return undefined;
    const next: Application = { ...app, status, updatedAt: new Date().toISOString() };
    if (notes && status === 'CORRECTION_REQUIRED') next.correctionRemarks = notes;
    if (notes && status === 'REJECTED') next.rejectionReason = notes;
    this.writeApp(next);
    this.addAuditLog('APPLICATION_STATUS_UPDATED', 'APPLICATION', id, `Status ${app.status} -> ${status}${notes ? `. ${notes}` : ''}`);
    this.notify();
    return next;
  }

  private requireOfficer(app: Application) {
    const u = this.getCurrentUser();
    if (!OFFICER_ROLES.includes(u.role)) throw new WorkflowError('Only officers can do this.');
    if (u.role !== 'CENTRAL_ADMIN' && u.state !== app.state) throw new WorkflowError(`This application belongs to ${app.state}. Your jurisdiction is ${u.state}.`);
    return u;
  }

  updateScrutinyItem(appId: string, itemId: string, passed: boolean, remarks?: string): void {
    const app = this.getApplicationById(appId);
    if (!app) return;
    const user = this.requireOfficer(app);
    if (!PRE_ASSIGNMENT.includes(app.status)) throw new WorkflowError('Scrutiny is closed for this application.');
    const scrutinyItems = app.scrutinyItems.map(i => (i.id === itemId ? { ...i, passed, remarks: remarks || i.remarks, verifiedAt: new Date().toISOString(), verifiedBy: user.fullName } : i));
    let next = this.recomputePreAssignment({ ...app, scrutinyItems, updatedAt: new Date().toISOString() });
    if (scrutinyItems.every(i => i.passed === true)) next = { ...next, documents: next.documents.map(d => ({ ...d, reviewStatus: 'ACCEPTED' })) };
    this.writeApp(next);
    this.addAuditLog('SCRUTINY_ITEM_REVIEWED', 'APPLICATION', appId, `${itemId} marked ${passed ? 'passed' : 'objection'}${remarks ? `: ${remarks}` : ''}`);
    this.notify();
  }

  requestCorrection(appId: string, note: string): void {
    const app = this.getApplicationById(appId);
    if (!app) return;
    this.requireOfficer(app);
    if (!note.trim()) throw new WorkflowError('Write what the applicant must correct.');
    this.updateApplicationStatus(appId, 'CORRECTION_REQUIRED', note.trim());
    this.createNotification({ recipientId: app.applicantId, recipientRole: 'BUSINESS', title: 'Correction needed', message: `${appId}: ${note}`, type: 'ACTION_REQUIRED', link: `/applications/${appId}`, channel: 'IN_APP' });
    this.message('CORRECTION_REQUIRED', app.applicantId, { appId, note: note.trim(), link: `${origin()}/applications/${appId}` });
  }

  resubmitApplication(appId: string, response: string): void {
    const app = this.getApplicationById(appId);
    if (!app || app.status !== 'CORRECTION_REQUIRED') return;
    if (this.getCurrentUser().id !== app.applicantId) throw new WorkflowError('Only the applicant can resubmit.');
    const scrutinyItems = app.scrutinyItems.map(i => (i.passed === false ? { ...i, passed: null, remarks: `Applicant: ${response}` } : i));
    const next = this.recomputePreAssignment({ ...app, status: 'UNDER_SCRUTINY', scrutinyItems, updatedAt: new Date().toISOString() });
    this.writeApp(next);
    this.addAuditLog('APPLICATION_RESUBMITTED', 'APPLICATION', appId, `Applicant responded: ${response}`);
    this.notify();
  }

  payApplicationFee(appId: string, paymentRef: string): void {
    const app = this.getApplicationById(appId);
    if (!app) return;
    if (app.feeStatus !== 'UNPAID') throw new WorkflowError('Fee is already paid.');
    if (this.getCurrentUser().id !== app.applicantId) throw new WorkflowError('Only the applicant can pay this fee.');
    const next = this.recomputePreAssignment({ ...app, feeStatus: 'PAID', paymentReference: paymentRef, paidAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    this.writeApp(next);
    this.addAuditLog('FEE_PAID', 'APPLICATION', appId, `Fee Rs ${app.feeAmount} paid, ref ${paymentRef}`);
    this.message('FEE_RECEIVED', app.applicantId, { appId, amount: String(app.feeAmount), ref: paymentRef });
    this.notify();
  }

  /** Suggests an officer: GATC for heavy / specialised categories when the state has one, else the least-loaded LMO. */
  suggestAssignment(appId: string): { type: 'LMO' | 'GATC'; officer: UserProfile; reason: string } | { error: string } {
    const app = this.getApplicationById(appId);
    const inst = app && this.getInstrumentById(app.instrumentId);
    if (!app || !inst) return { error: 'Application not found.' };
    const gatcs = isCategoryGatcEligible(inst.category) ? this.getOfficers('GATC', app.state) : [];
    const lmos = this.getOfficers('LMO', app.state);
    const districtLmo = lmos.find(l => l.district === app.district);
    if (prefersGatc(inst.category) && gatcs.length) {
      return { type: 'GATC', officer: gatcs[0], reason: `${inst.categoryName} needs specialised test equipment; ${gatcs[0].organization} is the approved test centre for ${app.state}` };
    }
    if (districtLmo) return { type: 'LMO', officer: districtLmo, reason: `Jurisdiction: ${app.district} district, least pending visits` };
    if (lmos.length) return { type: 'LMO', officer: lmos[0], reason: `No LMO posted in ${app.district}; nearest ${app.state} LMO with the fewest pending visits` };
    if (gatcs.length) return { type: 'GATC', officer: gatcs[0], reason: `No LMO available in ${app.state}; routed to approved test centre` };
    return { error: `No officer is configured for ${app.state}.` };
  }

  assignApplication(appId: string, assignedToType: 'LMO' | 'GATC', assignedToId: string, assignedToName: string, reason: string): void {
    const app = this.getApplicationById(appId);
    if (!app) return;
    this.requireOfficer(app);
    if (app.status !== 'ASSIGNMENT_PENDING') throw new WorkflowError('Finish scrutiny and collect the fee before assigning.');
    const officer = this.getUserById(assignedToId);
    if (!officer || officer.role !== assignedToType || officer.state !== app.state) throw new WorkflowError('Pick an officer from the same state.');
    this.writeApp({ ...app, assignedToType, assignedToId, assignedToName, assignmentReason: reason, status: 'ASSIGNED', updatedAt: new Date().toISOString() });
    this.addAuditLog('APPLICATION_ASSIGNED', 'APPLICATION', appId, `Assigned to ${assignedToType} ${assignedToName}. ${reason}`);
    this.createNotification({ recipientId: assignedToId, recipientRole: assignedToType, title: 'New inspection assigned', message: `${appId}: ${app.location}`, type: 'ACTION_REQUIRED', link: `/applications/${appId}`, channel: 'IN_APP' });
    this.notify();
  }

  scheduleApplication(appId: string, date: string, timeSlot: string): void {
    const app = this.getApplicationById(appId);
    if (!app) return;
    this.requireOfficer(app);
    if (!['ASSIGNED', 'SCHEDULED'].includes(app.status)) throw new WorkflowError('Assign an officer first.');
    if (date < todayStr()) throw new WorkflowError('Pick today or a future date.');
    this.writeApp({ ...app, scheduledDate: date, scheduledTimeSlot: timeSlot, status: 'SCHEDULED', updatedAt: new Date().toISOString() });
    this.addAuditLog('INSPECTION_SCHEDULED', 'APPLICATION', appId, `Inspection on ${date} (${timeSlot})`);
    this.createNotification({ recipientId: app.applicantId, recipientRole: 'BUSINESS', title: 'Inspection scheduled', message: `${appId}: ${date}, ${timeSlot}. Officer ${app.assignedToName}.`, type: 'INFO', link: `/applications/${appId}`, channel: 'IN_APP' });
    this.message('INSPECTION_SCHEDULED', app.applicantId, { appId, instrumentId: app.instrumentId, date, slot: timeSlot, officer: app.assignedToName || 'assigned officer' });
    this.notify();
  }

  // ------------------------------------------------------------ inspections
  getInspections(): InspectionRecord[] {
    return load<InspectionRecord[]>(K.INSPECTIONS, []);
  }

  getInspectionByAppId(appId: string): InspectionRecord | undefined {
    return this.getInspections().find(i => i.applicationId === appId);
  }

  getOfflineQueue(): QueuedInspection[] {
    return load<QueuedInspection[]>(K.OFFLINE_QUEUE, []);
  }

  /** Builds the checklist and test plan for an application's instrument. */
  newInspectionDraft(appId: string): { checklist: InspectionChecklistItem[]; readings: TestReadingRow[] } | null {
    const app = this.getApplicationById(appId);
    const inst = app && this.getInstrumentById(app.instrumentId);
    if (!inst) return null;
    return { checklist: generateDynamicChecklist(inst.category), readings: buildTestPlan(inst) };
  }

  /**
   * Records an inspection. PASS is accepted only when the recorded checklist and readings compute to PASS.
   * Online: the certificate is issued and signed. Offline: the inspection is saved on the device and
   * the certificate is issued and signed automatically when the connection returns.
   */
  async submitInspection(sub: InspectionSubmission): Promise<{ inspection: InspectionRecord; certificate?: VerificationCertificate; queued: boolean }> {
    const user = this.getCurrentUser();
    const app = this.getApplicationById(sub.applicationId);
    const inst = app && this.getInstrumentById(app.instrumentId);
    if (!app || !inst) throw new WorkflowError('Application or instrument not found.');
    if (user.role !== 'LMO' && user.role !== 'GATC') throw new WorkflowError('Only an LMO or GATC can record an inspection.');
    if (app.assignedToId !== user.id) throw new WorkflowError(`This job is assigned to ${app.assignedToName || 'another officer'}.`);
    if (!['ASSIGNED', 'SCHEDULED', 'INSPECTION_IN_PROGRESS', 'RETEST_REQUIRED'].includes(app.status)) throw new WorkflowError('This application is not waiting for an inspection.');

    const readings = sub.testReadings.map(r => evaluateReading(r, r.observedValue));
    const { verdict, reasons } = recommendVerdict(sub.checklist, readings);
    if (sub.result === 'PASS' && verdict !== 'PASS') throw new WorkflowError(`Cannot pass: ${reasons.join('; ')}`);
    if (sub.result === 'PASS' && sub.evidencePhotos.length === 0) throw new WorkflowError('Add at least one photo (nameplate or seal) before passing.');
    if (!sub.inspectorRemarks.trim()) throw new WorkflowError('Add inspector remarks.');

    const inspections = this.getInspections();
    const inspId = await newId(inspections.map(i => i.id), `INSP-${new Date().getFullYear()}-`, 5);
    const distance = sub.gps && inst.latitude !== undefined && inst.longitude !== undefined
      ? Math.round(haversineM(sub.gps.lat, sub.gps.lng, inst.latitude, inst.longitude))
      : undefined;
    const online = isOnline();
    const inspection: InspectionRecord = {
      id: inspId,
      applicationId: app.id,
      instrumentId: inst.id,
      inspectorId: user.id,
      inspectorName: user.fullName,
      inspectorRole: user.role === 'GATC' ? 'GATC' : 'LMO',
      inspectionDate: new Date().toISOString(),
      location: inst.installationAddress,
      latitude: sub.gps?.lat,
      longitude: sub.gps?.lng,
      locationSource: sub.gps ? 'DEVICE_GPS' : 'NOT_CAPTURED',
      gpsAccuracyM: sub.gps ? Math.round(sub.gps.accuracy) : undefined,
      distanceFromSiteM: distance,
      checklist: sub.checklist,
      testReadings: readings,
      evidencePhotos: sub.evidencePhotos,
      inspectorRemarks: sub.inspectorRemarks.trim(),
      result: sub.result,
      adjustmentDetails: sub.adjustmentDetails,
      officerSignatureConfirmation: true,
      syncStatus: online ? 'SYNCED' : 'PENDING_SYNC',
      createdAt: new Date().toISOString(),
    };
    save(K.INSPECTIONS, [inspection, ...this.getInspections()]);
    this.addAuditLog(online ? 'INSPECTION_RECORDED' : 'INSPECTION_RECORDED_OFFLINE', 'INSPECTION', inspId,
      `${sub.result} for ${inst.id}. GPS: ${sub.gps ? `${distance ?? '?'} m from registered site` : 'not captured'}`);

    if (sub.result !== 'PASS') {
      const status: ApplicationStatus = sub.result === 'ADJUSTMENT_REQUIRED' ? 'ADJUSTMENT_REQUIRED' : sub.result === 'RETEST_REQUIRED' ? 'RETEST_REQUIRED' : 'REJECTED';
      this.updateApplicationStatus(app.id, status, sub.adjustmentDetails || sub.inspectorRemarks);
      this.createNotification({ recipientId: app.applicantId, recipientRole: 'BUSINESS', title: 'Inspection result', message: `${inst.id}: ${sub.result.replace(/_/g, ' ').toLowerCase()}. ${sub.adjustmentDetails || ''}`, type: 'WARNING', link: `/applications/${app.id}`, channel: 'IN_APP' });
      this.message('INSPECTION_FAILED', app.applicantId, { appId: app.id, instrumentId: inst.id, result: sub.result.replace(/_/g, ' '), link: `${origin()}/applications/${app.id}` });
      this.notify();
      return { inspection, queued: false };
    }

    if (!online) {
      const queue = this.getOfflineQueue();
      save(K.OFFLINE_QUEUE, [...queue, { queueId: `q-${Date.now()}`, applicationId: app.id, inspectionId: inspId, officerId: user.id, queuedAt: new Date().toISOString(), attempts: 0, stampType: sub.stampType }]);
      this.updateApplicationStatus(app.id, 'INSPECTED_PENDING_SYNC', 'Inspection saved offline on the officer device');
      this.notify();
      return { inspection, queued: true };
    }

    const certificate = await this.issueCertificate(app.id, inspection, sub.stampType || 'LEAD_WIRE_SEAL');
    return { inspection, certificate, queued: false };
  }

  /** Back-compat wrapper used by older callers and tests. */
  async completeInspectionAndIssueCertificate(params: {
    applicationId: string; instrumentId: string; checklist: InspectionChecklistItem[]; testReadings: TestReadingRow[];
    evidencePhotos: InspectionRecord['evidencePhotos']; inspectorRemarks: string;
    result: 'PASS' | 'FAIL' | 'ADJUSTMENT_REQUIRED' | 'RETEST_REQUIRED'; adjustmentDetails?: string; stampType?: StampingRecord['stampType'];
  }) {
    const r = await this.submitInspection({ ...params, gps: null });
    return { inspection: r.inspection, certificate: r.certificate };
  }

  private async issueCertificate(appId: string, inspection: InspectionRecord, stampType: StampingRecord['stampType']): Promise<VerificationCertificate> {
    const app = this.getApplicationById(appId)!;
    const inst = this.getInstrumentById(app.instrumentId)!;
    const officer = this.getUserById(inspection.inspectorId) || this.getCurrentUser();
    const code = stateCode(inst.state);
    const now = new Date(inspection.inspectionDate);
    const year = now.getFullYear();

    const stampings = this.getStampings();
    const stampId = await newId(stampings.map(s => s.id), `STAMP-${code}-${String(year).slice(-2)}-`, 4);
    const stamp: StampingRecord = {
      id: stampId, instrumentId: inst.id, applicationId: app.id, inspectionId: inspection.id, officerId: officer.id,
      officerName: officer.fullName, stampType, quarterAndYear: quarterMark(now), stampedAt: inspection.inspectionDate,
      location: inst.installationAddress, remarks: 'Verification mark applied after all tests passed',
    };
    save(K.STAMPINGS, [stamp, ...this.getStampings()]);

    const validityMonths = getValidityPeriodMonths(inst.category, this.getValidityRules());
    const verificationDate = inspection.inspectionDate.slice(0, 10);
    const expiry = new Date(verificationDate);
    expiry.setMonth(expiry.getMonth() + validityMonths);
    expiry.setDate(expiry.getDate() - 1);
    const validUntil = expiry.toISOString().slice(0, 10);

    const certs = this.getCertificates();
    const seq = await newId(certs.map(c => c.id), `CERT-${year}-`, 5);
    const certNum = `${code}/LM/${year}/${seq.slice(-5)}`;
    const issuingAuthority = officer.role === 'GATC'
      ? `${officer.organization} (Government Approved Test Centre)`
      : `Controller of Legal Metrology, ${inst.state} (demo)`;

    const sha256Hash = await generateCertificateSha256({
      certificateNumber: certNum, instrumentId: inst.id, serialNumber: inst.serialNumber, applicantOrganization: inst.organization,
      category: inst.category, capacity: inst.capacity, verificationDate, validUntil, stampId, issuingAuthority,
    });

    let cert: VerificationCertificate = {
      id: seq, certificateNumber: certNum, instrumentId: inst.id, applicationId: app.id, inspectionId: inspection.id, stampId,
      issuedToName: inst.ownerName, organization: inst.organization, address: inst.installationAddress, state: inst.state,
      district: inst.district, instrumentType: inst.categoryName, category: inst.category, manufacturer: inst.manufacturer,
      model: inst.model, modelApprovalNumber: inst.modelApprovalNumber, serialNumber: inst.serialNumber, capacity: inst.capacity,
      scaleInterval: inst.scaleInterval, accuracyClass: inst.accuracyClass, verificationDate, validUntil, validityMonths,
      issuingAuthority, issuingOfficerName: officer.fullName, issuingOfficerDesignation: officer.designation || (officer.role === 'GATC' ? 'GATC Director' : 'Legal Metrology Officer'),
      issuingOfficerBadgeOrGATC: officer.badgeNumber || officer.gatcCode || officer.id,
      status: 'VALID', sha256Hash, qrPayloadUrl: buildVerifyUrl(origin(), certNum), version: 1, issuedAt: new Date().toISOString(),
      signatureStatus: 'PENDING_SIGNATURE',
    };
    save(K.CERTIFICATES, [cert, ...load<VerificationCertificate[]>(K.CERTIFICATES, [])]);

    this.updateApplicationStatus(app.id, 'COMPLETED');
    this.updateInstrument(inst.id, { status: 'ACTIVE', lastVerificationDate: verificationDate, nextVerificationDueDate: validUntil, currentCertificateId: cert.id, currentStampId: stampId });
    this.addAuditLog('CERTIFICATE_ISSUED', 'CERTIFICATE', cert.id, `Certificate ${certNum} for ${inst.id}, valid till ${validUntil}`);

    cert = (await this.signCertificate(cert.id)) || cert;
    this.createNotification({ recipientId: inst.ownerId, recipientRole: 'BUSINESS', title: 'Certificate issued', message: `${certNum} for ${inst.categoryName}. Valid until ${validUntil}.`, type: 'SUCCESS', link: `/certificates/${cert.id}`, channel: 'IN_APP' });
    this.message('CERTIFICATE_ISSUED', inst.ownerId, { certNo: certNum, instrumentId: inst.id, validUntil, link: cert.qrPayloadUrl });
    this.notify();
    return cert;
  }

  /** Requests the authority signature for a certificate. Safe to call repeatedly. */
  async signCertificate(certId: string): Promise<VerificationCertificate | undefined> {
    const cert = this.getCertificateById(certId);
    if (!cert || cert.signatureStatus === 'SIGNED') return cert;
    const officer = this.getInspections().find(i => i.id === cert.inspectionId);
    if (this.isLive()) await cloud.flush(); // the server signs the stored record, so it must be saved first
    const res = await requestSignature(fieldsFromCertificate(cert, officer?.inspectorRole ?? 'LMO'), this.isLive() ? cert.id : undefined, cloud.accessToken());
    const certs = this.getCertificates();
    const idx = certs.findIndex(c => c.id === certId);
    if (res.ok) {
      certs[idx] = { ...certs[idx], signatureStatus: 'SIGNED', signedPayload: res.p, signature: res.s, signingKid: res.kid, signedAt: res.iat, signingError: undefined, qrPayloadUrl: res.qr || buildVerifyUrl(origin(), cert.certificateNumber, res.p, res.s) };
      this.addAuditLog('CERTIFICATE_SIGNED', 'CERTIFICATE', certId, `Signed with key ${res.kid}`);
    } else {
      certs[idx] = { ...certs[idx], signingError: res.message };
    }
    save(K.CERTIFICATES, certs);
    this.notify();
    return certs[idx];
  }

  /** Runs when the device comes back online: issues queued certificates, signs pending ones, sends queued messages. */
  async syncPending(): Promise<{ issued: number; signed: number; failed: number }> {
    if (this.syncing || !isOnline()) return { issued: 0, signed: 0, failed: 0 };
    this.syncing = true;
    let issued = 0, signed = 0, failed = 0;
    try {
      const remaining: QueuedInspection[] = [];
      for (const q of this.getOfflineQueue()) {
        const insp = this.getInspections().find(i => i.id === q.inspectionId);
        const app = this.getApplicationById(q.applicationId);
        if (!insp || !app || app.status !== 'INSPECTED_PENDING_SYNC') continue;
        try {
          save(K.INSPECTIONS, this.getInspections().map(i => (i.id === insp.id ? { ...i, syncStatus: 'SYNCED' } : i)));
          await this.issueCertificate(app.id, { ...insp, syncStatus: 'SYNCED' }, q.stampType || 'LEAD_WIRE_SEAL');
          this.addAuditLog('OFFLINE_INSPECTION_SYNCED', 'INSPECTION', insp.id, `Synced inspection recorded offline at ${insp.inspectionDate}`);
          issued++;
        } catch (e) {
          failed++;
          remaining.push({ ...q, attempts: q.attempts + 1, lastError: (e as Error).message });
        }
      }
      save(K.OFFLINE_QUEUE, remaining);
      for (const c of this.getCertificates().filter(c => c.signatureStatus === 'PENDING_SIGNATURE')) {
        const r = await this.signCertificate(c.id);
        if (r?.signatureStatus === 'SIGNED') signed++;
      }
      await outbox.flush();
    } finally {
      this.syncing = false;
      this.notify();
    }
    return { issued, signed, failed };
  }

  // ------------------------------------------------------------ stampings & certificates
  getStampings(): StampingRecord[] {
    return load<StampingRecord[]>(K.STAMPINGS, []);
  }

  getCertificates(): VerificationCertificate[] {
    return load<VerificationCertificate[]>(K.CERTIFICATES, []).map(c =>
      c.status === 'VALID' && c.validUntil < todayStr() ? { ...c, status: 'EXPIRED' } : c,
    );
  }

  getCertificateById(id: string): VerificationCertificate | undefined {
    const term = id.trim().toUpperCase();
    return this.getCertificates().find(c => c.id.toUpperCase() === term || c.certificateNumber.toUpperCase() === term);
  }

  revokeCertificate(id: string, reason: string): boolean {
    const certs = load<VerificationCertificate[]>(K.CERTIFICATES, []);
    const idx = certs.findIndex(c => c.id === id || c.certificateNumber === id);
    if (idx === -1) return false;
    certs[idx] = { ...certs[idx], status: 'REVOKED', revocationReason: reason, revokedAt: new Date().toISOString() };
    save(K.CERTIFICATES, certs);
    this.updateInstrument(certs[idx].instrumentId, { status: 'REVOKED' });
    this.addAuditLog('CERTIFICATE_REVOKED', 'CERTIFICATE', id, `Revoked: ${reason}`);
    this.notify();
    return true;
  }

  // ------------------------------------------------------------ enforcement
  getEnforcementCases(): EnforcementCase[] {
    return load<EnforcementCase[]>(K.ENFORCEMENTS, []);
  }

  async createEnforcementCase(data: Omit<EnforcementCase, 'id' | 'createdAt'>): Promise<EnforcementCase> {
    const cases = this.getEnforcementCases();
    const id = await newId(cases.map(c => c.id), `ENF-${new Date().getFullYear()}-`, 4);
    const c: EnforcementCase = { ...data, id, createdAt: new Date().toISOString() };
    save(K.ENFORCEMENTS, [c, ...this.getEnforcementCases()]);
    this.addAuditLog('ENFORCEMENT_CASE_OPENED', 'ENFORCEMENT', id, `${data.offenseCategory} at ${data.businessName} (${data.actSection})`);
    this.notify();
    return c;
  }

  updateEnforcementCaseStatus(caseId: string, status: EnforcementCase['status'], notes?: string): boolean {
    const cases = this.getEnforcementCases();
    const idx = cases.findIndex(c => c.id === caseId);
    if (idx === -1) return false;
    cases[idx] = { ...cases[idx], status, actionTaken: notes ? `${cases[idx].actionTaken} | ${notes}` : cases[idx].actionTaken, resolvedAt: ['COMPOUNDED', 'CLOSED'].includes(status) ? new Date().toISOString() : cases[idx].resolvedAt };
    save(K.ENFORCEMENTS, cases);
    this.addAuditLog('ENFORCEMENT_STATUS_CHANGED', 'ENFORCEMENT', caseId, `Status ${status}. ${notes || ''}`);
    this.notify();
    return true;
  }

  // ------------------------------------------------------------ in-app notifications
  getNotifications(): NotificationItem[] {
    return load<NotificationItem[]>(K.NOTIFICATIONS, []);
  }

  getNotificationsForUser(user: UserProfile = this.getCurrentUser()): NotificationItem[] {
    return this.getNotifications().filter(n => n.recipientId === user.id || (n.recipientRole === user.role && !n.recipientId.startsWith('usr-')));
  }

  createNotification(item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): NotificationItem {
    const n: NotificationItem = { ...item, id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, read: false, createdAt: new Date().toISOString() };
    save(K.NOTIFICATIONS, [n, ...this.getNotifications()].slice(0, 300));
    this.notify();
    return n;
  }

  markNotificationRead(id: string): void {
    save(K.NOTIFICATIONS, this.getNotifications().map(n => (n.id === id ? { ...n, read: true } : n)));
    this.notify();
  }

  // ------------------------------------------------------------ audit log
  getAuditLogs(): AuditLogEntry[] {
    return load<AuditLogEntry[]>(K.AUDIT_LOGS, []);
  }

  /** Audit entries about records the user may see, plus their own actions. */
  getAuditLogsForUser(user: UserProfile = this.getCurrentUser()): AuditLogEntry[] {
    const all = this.getAuditLogs();
    if (user.role === 'CENTRAL_ADMIN') return all;
    const ids = new Set<string>([
      ...this.getInstrumentsForUser(user).map(i => i.id),
      ...this.getApplicationsForUser(user).map(a => a.id),
      ...this.getCertificatesForUser(user).map(c => c.id),
      ...this.getEnforcementsForUser(user).map(e => e.id),
      ...this.getInspections().filter(i => this.getApplicationsForUser(user).some(a => a.id === i.applicationId)).map(i => i.id),
    ]);
    return all.filter(l => l.actorId === user.id || ids.has(l.entityId));
  }

  addAuditLog(action: string, entityType: AuditLogEntry['entityType'], entityId: string, details: string): void {
    const user = this.getCurrentUser();
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(), actorId: user.id, actorName: user.fullName, actorRole: user.role,
      action, entityType, entityId, details, ipAddress: isOnline() ? 'browser (online)' : 'browser (offline)',
    };
    save(K.AUDIT_LOGS, [entry, ...this.getAuditLogs()].slice(0, 1000));
  }

  // ------------------------------------------------------------ expiry reminders (daily job)
  /** Sends reminders at 30, 15, 7 and 1 days before expiry, once per milestone. Pilot: pg_cron job. */
  runExpiryReminderJob(force = false): number {
    const sent = load<Record<string, true>>(K.REMINDER_LOG, {});
    let count = 0;
    for (const inst of this.getInstruments()) {
      if (!inst.nextVerificationDueDate || !['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'].includes(inst.status)) continue;
      const days = Math.ceil((Date.parse(inst.nextVerificationDueDate) - Date.parse(todayStr())) / 86_400_000);
      const milestone = days < 0 ? 'expired' : [1, 7, 15, 30].find(m => days <= m);
      if (milestone === undefined) continue;
      const key = `${inst.id}:${inst.nextVerificationDueDate}:${milestone}`;
      if (sent[key] && !force) continue;
      sent[key] = true;
      count++;
      this.createNotification({
        recipientId: inst.ownerId, recipientRole: 'BUSINESS',
        title: days < 0 ? 'Verification expired' : `Re-verification due in ${days} day${days === 1 ? '' : 's'}`,
        message: `${inst.categoryName} (${inst.id}) ${days < 0 ? 'expired on' : 'is due on'} ${inst.nextVerificationDueDate}. Using it for trade after expiry is an offence.`,
        type: days < 0 ? 'WARNING' : 'EXPIRY', link: `/applications/new?instrumentId=${inst.id}`, channel: 'IN_APP',
      });
      this.message('EXPIRY_REMINDER', inst.ownerId, { instrumentId: inst.id, dueDate: inst.nextVerificationDueDate, days: String(Math.max(days, 0)), link: `${origin()}/applications/new?instrumentId=${inst.id}` });
    }
    save(K.REMINDER_LOG, sent);
    if (count) this.addAuditLog('EXPIRY_REMINDER_JOB', 'INSTRUMENT', 'job', `${count} reminder(s) generated`);
    this.notify();
    return count;
  }

  /** Kept for the demo controls. */
  triggerBulkReminders(): number {
    return this.runExpiryReminderJob(true);
  }

  // ------------------------------------------------------------ demo controls
  resetDemoData(): void {
    if (this.isLive()) {
      void cloud.pull().then(() => this.notify());
      return;
    }
    for (const key of Object.values(K)) safeStorage.setItem(key, '');
    try {
      for (const key of Object.values(K)) window.localStorage.removeItem(key);
    } catch { /* ignore */ }
    outbox.clear();
    this.initStorage();
    this.notify();
  }

  /** Demo shortcut: completes a SCHEDULED application with in-tolerance sample readings. Logged as a demo action. */
  async fastForwardApplication(appId: string): Promise<void> {
    const app = this.getApplicationById(appId);
    const inst = app && this.getInstrumentById(app.instrumentId);
    if (!app || !inst || !app.assignedToId) throw new WorkflowError('Pick an application that has an assigned officer.');
    if (this.getCurrentUser().id !== app.assignedToId) throw new WorkflowError(`Sign in as the assigned officer (${app.assignedToName}) to use this shortcut.`);
    {
      const checklist = generateDynamicChecklist(inst.category).map(c => ({ ...c, status: 'PASS' as const }));
      const readings = buildTestPlan(inst).map(r => evaluateReading(r, sampleObservedValue(r, 0.6)));
      this.addAuditLog('DEMO_FAST_FORWARD', 'APPLICATION', appId, 'Demo control: inspection filled with sample in-tolerance readings');
      await this.submitInspection({
        applicationId: appId, checklist, testReadings: readings,
        evidencePhotos: [{ id: 'ev-demo', caption: 'Demo sample photo', url: '/logo/tula-logo-badge.png', type: 'SEAL_APPLIED', timestamp: new Date().toISOString(), source: 'DEMO_SAMPLE' }],
        inspectorRemarks: 'Demo fast-forward: sample readings within MPE.', result: 'PASS', stampType: 'LEAD_WIRE_SEAL', gps: null,
      });
    }
    this.notify();
  }

  simulateInstrumentExpiry(instId: string): void {
    const past = new Date();
    past.setDate(past.getDate() - 15);
    this.updateInstrument(instId, { status: 'EXPIRED', nextVerificationDueDate: past.toISOString().slice(0, 10) });
    this.addAuditLog('DEMO_EXPIRY_SIMULATED', 'INSTRUMENT', instId, 'Demo control: validity moved 15 days into the past');
    this.runExpiryReminderJob(true);
  }
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const storage = new MetrologyStorageService();
