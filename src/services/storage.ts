import { 
  UserProfile, 
  Instrument, 
  Application, 
  InspectionRecord, 
  VerificationCertificate, 
  EnforcementCase, 
  AuditLogEntry, 
  NotificationItem,
  StampingRecord,
  FeeRule,
  UserRole,
  ApplicationStatus,
  InstrumentStatus
} from '../types';
import { 
  DEMO_USERS, 
  INITIAL_INSTRUMENTS, 
  INITIAL_APPLICATIONS, 
  INITIAL_CERTIFICATES, 
  INITIAL_INSPECTIONS, 
  INITIAL_STAMPINGS, 
  INITIAL_ENFORCEMENT_CASES, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_NOTIFICATIONS 
} from '../data/seedData';
import { DEFAULT_FEE_RULES, generateDynamicChecklist, generateDefaultTestReadings, getValidityPeriodMonths } from './rulesEngine';
import { generateCertificateSha256, buildPublicVerificationUrl } from './crypto';

const STORAGE_KEYS = {
  USERS: 'lm_users_v1',
  CURRENT_USER: 'lm_current_user_v1',
  INSTRUMENTS: 'lm_instruments_v1',
  APPLICATIONS: 'lm_applications_v1',
  CERTIFICATES: 'lm_certificates_v1',
  INSPECTIONS: 'lm_inspections_v1',
  STAMPINGS: 'lm_stampings_v1',
  ENFORCEMENTS: 'lm_enforcements_v1',
  AUDIT_LOGS: 'lm_audit_logs_v1',
  NOTIFICATIONS: 'lm_notifications_v1',
  FEE_RULES: 'lm_fee_rules_v1',
  OFFLINE_QUEUE: 'lm_offline_queue_v1',
};


const memoryStore = new Map<string, string>();
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return memoryStore.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {}
    memoryStore.set(key, value);
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {}
    memoryStore.delete(key);
  }
};

class MetrologyStorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initStorage();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  private initStorage(): void {
    if (!safeStorage.getItem(STORAGE_KEYS.USERS)) {
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      // Default to Business User
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0]));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.INSTRUMENTS)) {
      safeStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(INITIAL_INSTRUMENTS));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
      safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(INITIAL_APPLICATIONS));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.CERTIFICATES)) {
      safeStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(INITIAL_CERTIFICATES));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.INSPECTIONS)) {
      safeStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(INITIAL_INSPECTIONS));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.STAMPINGS)) {
      safeStorage.setItem(STORAGE_KEYS.STAMPINGS, JSON.stringify(INITIAL_STAMPINGS));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.ENFORCEMENTS)) {
      safeStorage.setItem(STORAGE_KEYS.ENFORCEMENTS, JSON.stringify(INITIAL_ENFORCEMENT_CASES));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      safeStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.FEE_RULES)) {
      safeStorage.setItem(STORAGE_KEYS.FEE_RULES, JSON.stringify(DEFAULT_FEE_RULES));
    }
  }

  // --- Auth & User State ---
  public getCurrentUser(): UserProfile {
    const raw = safeStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return DEMO_USERS[0];
    try {
      return JSON.parse(raw);
    } catch {
      return DEMO_USERS[0];
    }
  }

  public setCurrentUser(user: UserProfile): void {
    safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.addAuditLog('USER_SWITCH_OR_LOGIN', 'USER', user.id, `User active context switched to ${user.fullName} (${user.role})`);
    this.notify();
  }

  public switchDemoRole(role: UserRole): void {
    const found = DEMO_USERS.find(u => u.role === role);
    if (found) {
      this.setCurrentUser(found);
    }
  }

  public getAllDemoUsers(): UserProfile[] {
    return DEMO_USERS;
  }

  // --- Instruments ---
  public getInstruments(): Instrument[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.INSTRUMENTS);
    return raw ? JSON.parse(raw) : [];
  }

  public getInstrumentById(id: string): Instrument | undefined {
    return this.getInstruments().find(i => i.id === id);
  }

  public registerInstrument(newInst: Omit<Instrument, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Instrument {
    const instruments = this.getInstruments();
    const count = instruments.length + 1;
    const padded = String(count).padStart(6, '0');
    const stateCode = newInst.state === 'Delhi' ? 'DL' : newInst.state === 'Gujarat' ? 'GJ' : 'IN';
    const id = `LM-${stateCode}-2026-${padded}`;
    
    const instrument: Instrument = {
      ...newInst,
      id,
      status: 'REGISTERED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    instruments.unshift(instrument);
    safeStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(instruments));
    
    this.addAuditLog('INSTRUMENT_REGISTERED', 'INSTRUMENT', id, `Registered new instrument ${newInst.categoryName} with serial ${newInst.serialNumber}`);
    this.notify();
    return instrument;
  }

  public updateInstrument(id: string, updates: Partial<Instrument>): Instrument | undefined {
    const instruments = this.getInstruments();
    const idx = instruments.findIndex(i => i.id === id);
    if (idx === -1) return undefined;

    instruments[idx] = {
      ...instruments[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    safeStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(instruments));
    this.notify();
    return instruments[idx];
  }

  // --- Applications ---
  public getApplications(): Application[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    return raw ? JSON.parse(raw) : [];
  }

  public getApplicationById(id: string): Application | undefined {
    return this.getApplications().find(a => a.id === id);
  }

  public createApplication(app: Omit<Application, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'scrutinyItems'>): Application {
    const apps = this.getApplications();
    const count = apps.length + 1;
    const id = `APP-2026-${String(count).padStart(5, '0')}`;

    // Standard scrutiny checklist template
    const scrutinyItems = [
      {
        id: 'scr-1',
        title: 'Applicant Identity & Business Registration',
        description: 'Check legal identity and GSTIN registration in Department database',
        passed: null,
      },
      {
        id: 'scr-2',
        title: 'Instrument Model Approval Conformity',
        description: 'Verify Central Government Model Approval Certificate validity under Section 22',
        passed: null,
      },
      {
        id: 'scr-3',
        title: 'Site Accessibility & Calibration Test Weight Availability',
        description: 'Verify testing environment compliance for on-site verification',
        passed: null,
      }
    ];

    const newApp: Application = {
      ...app,
      id,
      status: 'SUBMITTED',
      scrutinyItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    apps.unshift(newApp);
    safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

    // Update instrument status to UNDER_VERIFICATION
    this.updateInstrument(app.instrumentId, { status: 'UNDER_VERIFICATION' });

    this.addAuditLog('APPLICATION_SUBMITTED', 'APPLICATION', id, `Submitted verification application for instrument ${app.instrumentId}`);
    
    // Add Notification for applicant
    this.createNotification({
      recipientId: app.applicantId,
      recipientRole: 'BUSINESS',
      title: '✅ Application Submitted Successfully',
      message: `Your verification application ${id} for instrument ${app.instrumentId} has been submitted for scrutiny.`,
      type: 'SUCCESS',
      link: `/applications/${id}`,
      channel: 'IN_APP',
    });

    this.notify();
    return newApp;
  }

  public updateApplicationStatus(id: string, status: ApplicationStatus, notes?: string): Application | undefined {
    const apps = this.getApplications();
    const idx = apps.findIndex(a => a.id === id);
    if (idx === -1) return undefined;

    const currentApp = apps[idx];
    apps[idx] = {
      ...currentApp,
      status,
      updatedAt: new Date().toISOString(),
    };

    if (notes) {
      if (status === 'CORRECTION_REQUIRED') {
        apps[idx].correctionRemarks = notes;
      } else if (status === 'REJECTED') {
        apps[idx].rejectionReason = notes;
      }
    }

    safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    this.addAuditLog('APPLICATION_STATUS_UPDATED', 'APPLICATION', id, `Application ${id} status updated to ${status}. Notes: ${notes || 'N/A'}`);
    this.notify();
    return apps[idx];
  }

  public updateScrutinyItem(appId: string, itemId: string, passed: boolean, remarks?: string): void {
    const apps = this.getApplications();
    const idx = apps.findIndex(a => a.id === appId);
    if (idx === -1) return;

    const user = this.getCurrentUser();
    apps[idx].scrutinyItems = apps[idx].scrutinyItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          passed,
          remarks: remarks || item.remarks,
          verifiedAt: new Date().toISOString(),
          verifiedBy: user.fullName,
        };
      }
      return item;
    });

    // Check if all passed
    const allPassed = apps[idx].scrutinyItems.every(i => i.passed === true);
    if (allPassed) {
      apps[idx].status = 'ACCEPTED';
    }

    safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    this.addAuditLog('SCRUTINY_ITEM_REVIEWED', 'APPLICATION', appId, `Scrutiny item ${itemId} marked as ${passed ? 'PASSED' : 'CORRECTION_REQUIRED'}`);
    this.notify();
  }

  public assignApplication(appId: string, assignedToType: 'LMO' | 'GATC', assignedToId: string, assignedToName: string, reason: string): void {
    const apps = this.getApplications();
    const idx = apps.findIndex(a => a.id === appId);
    if (idx === -1) return;

    apps[idx] = {
      ...apps[idx],
      assignedToType,
      assignedToId,
      assignedToName,
      assignmentReason: reason,
      status: 'ASSIGNED',
      updatedAt: new Date().toISOString(),
    };

    safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    this.addAuditLog('APPLICATION_ASSIGNED', 'APPLICATION', appId, `Assigned to ${assignedToType} (${assignedToName}). Reason: ${reason}`);
    this.notify();
  }

  public scheduleApplication(appId: string, date: string, timeSlot: string): void {
    const apps = this.getApplications();
    const idx = apps.findIndex(a => a.id === appId);
    if (idx === -1) return;

    apps[idx] = {
      ...apps[idx],
      scheduledDate: date,
      scheduledTimeSlot: timeSlot,
      status: 'SCHEDULED',
      updatedAt: new Date().toISOString(),
    };

    safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    this.addAuditLog('INSPECTION_SCHEDULED', 'APPLICATION', appId, `Scheduled inspection on ${date} (${timeSlot})`);
    this.notify();
  }

  public payApplicationFee(appId: string, paymentRef: string): void {
    const apps = this.getApplications();
    const idx = apps.findIndex(a => a.id === appId);
    if (idx === -1) return;

    apps[idx] = {
      ...apps[idx],
      feeStatus: 'PAID',
      paymentReference: paymentRef,
      paidAt: new Date().toISOString(),
      status: 'ASSIGNMENT_PENDING',
      updatedAt: new Date().toISOString(),
    };

    safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    this.addAuditLog('FEE_PAID', 'APPLICATION', appId, `Statutory fee ₹${apps[idx].feeAmount} paid with ref ${paymentRef}`);
    this.notify();
  }

  // --- Inspections & Field Verification ---
  public getInspections(): InspectionRecord[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.INSPECTIONS);
    return raw ? JSON.parse(raw) : [];
  }

  public getInspectionByAppId(appId: string): InspectionRecord | undefined {
    return this.getInspections().find(i => i.applicationId === appId);
  }

  public async completeInspectionAndIssueCertificate(params: {
    applicationId: string;
    instrumentId: string;
    checklist: any[];
    testReadings: any[];
    evidencePhotos: any[];
    inspectorRemarks: string;
    result: 'PASS' | 'FAIL' | 'ADJUSTMENT_REQUIRED' | 'RETEST_REQUIRED';
    adjustmentDetails?: string;
    stampType?: 'LEAD_WIRE_SEAL' | 'TAMPER_EVIDENT_BARCODE_SEAL' | 'HOLOGRAM_SECURITY_SEAL';
  }): Promise<{ inspection: InspectionRecord; stamp?: StampingRecord; certificate?: VerificationCertificate }> {
    const user = this.getCurrentUser();
    const app = this.getApplicationById(params.applicationId);
    const inst = this.getInstrumentById(params.instrumentId);

    if (!app || !inst) {
      throw new Error('Application or Instrument not found');
    }

    const inspections = this.getInspections();
    const inspCount = inspections.length + 1;
    const inspId = `INSP-2026-${String(inspCount).padStart(5, '0')}`;

    const inspection: InspectionRecord = {
      id: inspId,
      applicationId: params.applicationId,
      instrumentId: params.instrumentId,
      inspectorId: user.id,
      inspectorName: user.fullName,
      inspectorRole: user.role === 'GATC' ? 'GATC' : 'LMO',
      inspectionDate: new Date().toISOString(),
      location: inst.installationAddress,
      latitude: inst.latitude,
      longitude: inst.longitude,
      checklist: params.checklist,
      testReadings: params.testReadings,
      evidencePhotos: params.evidencePhotos,
      inspectorRemarks: params.inspectorRemarks,
      result: params.result,
      adjustmentDetails: params.adjustmentDetails,
      officerSignatureConfirmation: true,
      syncStatus: 'SYNCED',
      createdAt: new Date().toISOString(),
    };

    inspections.unshift(inspection);
    safeStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(inspections));

    if (params.result !== 'PASS') {
      // Retest or adjustment required
      const newStatus = params.result === 'ADJUSTMENT_REQUIRED' ? 'ADJUSTMENT_REQUIRED' : params.result === 'RETEST_REQUIRED' ? 'RETEST_REQUIRED' : 'REJECTED';
      this.updateApplicationStatus(params.applicationId, newStatus, params.adjustmentDetails || params.inspectorRemarks);
      this.addAuditLog('INSPECTION_COMPLETED_NON_PASS', 'INSPECTION', inspId, `Inspection resulted in ${params.result}`);
      this.notify();
      return { inspection };
    }

    // Pass -> Create Stamping Record
    const stampings = this.getStampings();
    const stampCount = stampings.length + 1;
    const stateCode = inst.state === 'Delhi' ? 'DL' : inst.state === 'Gujarat' ? 'GJ' : 'IN';
    const stampId = `STAMP-${stateCode}-26-${String(stampCount).padStart(4, '0')}`;
    
    const stamp: StampingRecord = {
      id: stampId,
      instrumentId: inst.id,
      applicationId: app.id,
      inspectionId: inspId,
      officerId: user.id,
      officerName: user.fullName,
      stampType: params.stampType || 'LEAD_WIRE_SEAL',
      quarterAndYear: 'A-26',
      stampedAt: new Date().toISOString(),
      location: inst.installationAddress,
      remarks: `Official Metrology Verification Stamp applied following complete compliance check`,
    };

    stampings.unshift(stamp);
    safeStorage.setItem(STORAGE_KEYS.STAMPINGS, JSON.stringify(stampings));

    // Calculate Validity
    const validityMonths = getValidityPeriodMonths(inst.category);
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
    expiryDate.setDate(expiryDate.getDate() - 1);
    const validUntilStr = expiryDate.toISOString().split('T')[0];
    const verificationDateStr = today.toISOString().split('T')[0];

    // Issue Certificate
    const certificates = this.getCertificates();
    const certCount = certificates.length + 1;
    const certNum = `${stateCode}/LM/2026/${String(certCount).padStart(5, '0')}`;
    const certId = `CERT-2026-${String(certCount).padStart(5, '0')}`;

    const issuingAuthority = user.role === 'GATC'
      ? `${user.organization} (Accredited GATC under Rule 2026)`
      : `Office of the Controller of Legal Metrology, Government of ${inst.state}`;

    // Compute Cryptographic Integrity Hash
    const sha256Hash = await generateCertificateSha256({
      certificateNumber: certNum,
      instrumentId: inst.id,
      serialNumber: inst.serialNumber,
      applicantOrganization: inst.organization,
      category: inst.category,
      capacity: inst.capacity,
      verificationDate: verificationDateStr,
      validUntil: validUntilStr,
      stampId,
      issuingAuthority,
    });

    const qrPayloadUrl = buildPublicVerificationUrl(certId);

    const certificate: VerificationCertificate = {
      id: certId,
      certificateNumber: certNum,
      instrumentId: inst.id,
      applicationId: app.id,
      inspectionId: inspId,
      stampId,
      issuedToName: inst.ownerName,
      organization: inst.organization,
      address: inst.installationAddress,
      state: inst.state,
      district: inst.district,
      instrumentType: inst.categoryName,
      category: inst.category,
      manufacturer: inst.manufacturer,
      model: inst.model,
      modelApprovalNumber: inst.modelApprovalNumber,
      serialNumber: inst.serialNumber,
      capacity: inst.capacity,
      scaleInterval: inst.scaleInterval,
      accuracyClass: inst.accuracyClass,
      verificationDate: verificationDateStr,
      validUntil: validUntilStr,
      validityMonths,
      issuingAuthority,
      issuingOfficerName: user.fullName,
      issuingOfficerDesignation: user.designation || 'Legal Metrology Officer',
      issuingOfficerBadgeOrGATC: user.badgeNumber || user.gatcCode || 'Authorized Metrologist',
      status: 'VALID',
      sha256Hash,
      qrPayloadUrl,
      version: 1,
      issuedAt: new Date().toISOString(),
    };

    certificates.unshift(certificate);
    safeStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certificates));

    // Update Application to COMPLETED
    this.updateApplicationStatus(app.id, 'COMPLETED');

    // Update Instrument to ACTIVE with dates
    this.updateInstrument(inst.id, {
      status: 'ACTIVE',
      lastVerificationDate: verificationDateStr,
      nextVerificationDueDate: validUntilStr,
      currentCertificateId: certId,
      currentStampId: stampId,
    });

    // Add Audit Log
    this.addAuditLog('CERTIFICATE_ISSUED', 'CERTIFICATE', certId, `Issued Schedule IX Certificate ${certNum} for Instrument ${inst.id}. Valid till ${validUntilStr}`);

    // Create Notification
    this.createNotification({
      recipientId: inst.ownerId,
      recipientRole: 'BUSINESS',
      title: '🎉 Verification Certificate Issued',
      message: `Digital Certificate of Verification ${certNum} has been issued for ${inst.categoryName} (${inst.id}). Valid until ${validUntilStr}.`,
      type: 'SUCCESS',
      link: `/certificates/${certId}`,
      channel: 'IN_APP',
    });

    this.notify();
    return { inspection, stamp, certificate };
  }

  // --- Stampings ---
  public getStampings(): StampingRecord[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.STAMPINGS);
    return raw ? JSON.parse(raw) : [];
  }

  // --- Certificates ---
  public getCertificates(): VerificationCertificate[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.CERTIFICATES);
    return raw ? JSON.parse(raw) : [];
  }

  public getCertificateById(id: string): VerificationCertificate | undefined {
    return this.getCertificates().find(c => c.id === id || c.certificateNumber === id);
  }

  public revokeCertificate(id: string, reason: string): boolean {
    const certs = this.getCertificates();
    const idx = certs.findIndex(c => c.id === id || c.certificateNumber === id);
    if (idx === -1) return false;

    certs[idx].status = 'REVOKED';
    certs[idx].revocationReason = reason;
    certs[idx].revokedAt = new Date().toISOString();

    safeStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certs));

    // Update instrument status to REVOKED or SUSPENDED
    const instId = certs[idx].instrumentId;
    this.updateInstrument(instId, { status: 'REVOKED' });

    this.addAuditLog('CERTIFICATE_REVOKED', 'CERTIFICATE', id, `Certificate revoked. Reason: ${reason}`);
    this.notify();
    return true;
  }

  // --- Enforcement ---
  public getEnforcementCases(): EnforcementCase[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.ENFORCEMENTS);
    return raw ? JSON.parse(raw) : [];
  }

  public createEnforcementCase(data: Omit<EnforcementCase, 'id' | 'createdAt'>): EnforcementCase {
    const cases = this.getEnforcementCases();
    const count = cases.length + 1;
    const id = `ENF-2026-${String(count).padStart(4, '0')}`;

    const newCase: EnforcementCase = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };

    cases.unshift(newCase);
    safeStorage.setItem(STORAGE_KEYS.ENFORCEMENTS, JSON.stringify(cases));

    this.addAuditLog('ENFORCEMENT_NOTICE_ISSUED', 'ENFORCEMENT', id, `Registered enforcement action against ${data.businessName} under ${data.actSection}`);
    this.notify();
    return newCase;
  }

  public updateEnforcementCaseStatus(caseId: string, status: EnforcementCase['status'], notes?: string): boolean {
    const cases = this.getEnforcementCases();
    const idx = cases.findIndex(c => c.id === caseId);
    if (idx === -1) return false;
    cases[idx].status = status;
    if (notes) {
      cases[idx].actionTaken = `${cases[idx].actionTaken} | ${notes}`;
    }
    if (status === 'COMPOUNDED' || status === 'CLOSED') {
      cases[idx].resolvedAt = new Date().toISOString();
    }
    safeStorage.setItem(STORAGE_KEYS.ENFORCEMENTS, JSON.stringify(cases));
    this.addAuditLog('ENFORCEMENT_RESOLVED', 'ENFORCEMENT', caseId, `Enforcement case ${caseId} status changed to ${status}. ${notes || ''}`);
    this.notify();
    return true;
  }

  // --- Notifications ---
  public getNotifications(): NotificationItem[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return raw ? JSON.parse(raw) : [];
  }

  public createNotification(item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): NotificationItem {
    const list = this.getNotifications();
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newItem);
    safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    this.notify();
    return newItem;
  }

  public markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
      this.notify();
    }
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLogEntry[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  public addAuditLog(action: string, entityType: AuditLogEntry['entityType'], entityId: string, details: string): void {
    const user = this.getCurrentUser();
    const logs = this.getAuditLogs();
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action,
      entityType,
      entityId,
      details,
      ipAddress: '127.0.0.1 (Client Secure)',
    };
    logs.unshift(entry);
    // Keep max 200 logs
    if (logs.length > 200) logs.pop();
    safeStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  // --- Demo Control Center Fast-Forward Actions ---
  public resetDemoData(): void {
    safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
    safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0]));
    safeStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(INITIAL_INSTRUMENTS));
    safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(INITIAL_APPLICATIONS));
    safeStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(INITIAL_CERTIFICATES));
    safeStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(INITIAL_INSPECTIONS));
    safeStorage.setItem(STORAGE_KEYS.STAMPINGS, JSON.stringify(INITIAL_STAMPINGS));
    safeStorage.setItem(STORAGE_KEYS.ENFORCEMENTS, JSON.stringify(INITIAL_ENFORCEMENT_CASES));
    safeStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    safeStorage.setItem(STORAGE_KEYS.FEE_RULES, JSON.stringify(DEFAULT_FEE_RULES));
    this.notify();
  }

  public async fastForwardApplication(appId: string): Promise<void> {
    const app = this.getApplicationById(appId);
    if (!app) return;

    const inst = this.getInstrumentById(app.instrumentId);
    if (!inst) return;

    const checklist = generateDynamicChecklist(inst.category);
    const testReadings = generateDefaultTestReadings(inst.category, inst.capacity);

    await this.completeInspectionAndIssueCertificate({
      applicationId: app.id,
      instrumentId: inst.id,
      checklist,
      testReadings,
      evidencePhotos: [
        {
          id: 'ev-ff-1',
          caption: 'Verification load and seal application',
          url: inst.photos[0] || 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=600&q=80',
          type: 'SEAL_APPLIED',
          timestamp: new Date().toISOString(),
        }
      ],
      inspectorRemarks: 'Fast-Forward Demo: Verified all metrological parameters within statutory MPE tolerances under Legal Metrology Act, 2009.',
      result: 'PASS',
      stampType: 'LEAD_WIRE_SEAL',
    });
  }

  public simulateInstrumentExpiry(instId: string): void {
    const inst = this.getInstrumentById(instId);
    if (!inst) return;

    // Set due date to 15 days in past
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 15);
    const pastDateStr = pastDate.toISOString().split('T')[0];

    this.updateInstrument(instId, {
      status: 'EXPIRED',
      nextVerificationDueDate: pastDateStr,
    });

    // Mark current certificate expired if exists
    if (inst.currentCertificateId) {
      const certs = this.getCertificates();
      const cert = certs.find(c => c.id === inst.currentCertificateId);
      if (cert) {
        cert.status = 'EXPIRED';
        cert.validUntil = pastDateStr;
        safeStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certs));
      }
    }

    this.createNotification({
      recipientId: inst.ownerId,
      recipientRole: 'BUSINESS',
      title: '🚨 Instrument Verification Expired (Simulated)',
      message: `${inst.categoryName} [${inst.id}] validity expired on ${pastDateStr}. Commercial usage is unlawful.`,
      type: 'EXPIRY',
      link: `/instruments/${inst.id}`,
      channel: 'IN_APP',
    });

    this.addAuditLog('SIMULATION_EXPIRY_TRIGGERED', 'INSTRUMENT', instId, `Simulated expiry for instrument ${instId}`);
    this.notify();
  }

  public triggerBulkReminders(): number {
    const instruments = this.getInstruments();
    const today = new Date();
    let sent = 0;

    instruments.forEach(inst => {
      const dueDate = new Date(inst.nextVerificationDueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30 && diffDays > 0) {
        this.createNotification({
          recipientId: inst.ownerId,
          recipientRole: 'BUSINESS',
          title: `⏳ Re-verification Due in ${diffDays} Days`,
          message: `Mandatory re-verification for ${inst.categoryName} [${inst.id}] is due on ${inst.nextVerificationDueDate}. File application to prevent penalty.`,
          type: 'EXPIRY',
          link: `/instruments/${inst.id}`,
          channel: 'IN_APP',
        });
        sent++;
      } else if (diffDays <= 0) {
        this.createNotification({
          recipientId: inst.ownerId,
          recipientRole: 'BUSINESS',
          title: `🚨 Instrument Expired Notice`,
          message: `Instrument ${inst.id} has expired validity since ${inst.nextVerificationDueDate}.`,
          type: 'WARNING',
          link: `/instruments/${inst.id}`,
          channel: 'IN_APP',
        });
        sent++;
      }
    });

    this.notify();
    return sent;
  }
}

export const storage = new MetrologyStorageService();
