import { describe, it, expect, beforeEach } from 'vitest';
import { storage, WorkflowError } from '../services/storage';
import { evaluateReading, sampleObservedValue } from '../services/rulesEngine';
import { outbox } from '../services/notifications';

async function registerAndApply() {
  const user = storage.registerBusinessUser({
    fullName: 'Test Owner', organization: 'Test Kirana', email: `owner${Date.now()}@example.com`, phone: '+919876543210',
    address: 'Shop 1, Lajpat Nagar', state: 'Delhi', district: 'Central Delhi', notifyByEmail: true, notifyBySms: true,
  });
  const inst = await storage.registerInstrument({
    category: 'COUNTER_MACHINE', categoryName: 'Counter scale 30 kg', accuracyClass: 'CLASS_III', manufacturer: 'Test Scales',
    model: 'T-30', modelApprovalNumber: 'IND/09/2026/001', serialNumber: `SN-${Date.now()}`, capacity: '30 kg', scaleInterval: 'e = 5 g',
    purchaseDate: '2026-09-01', installationDate: '2026-09-01', ownerId: user.id, ownerName: user.fullName, organization: user.organization,
    installationAddress: 'Shop 1, Lajpat Nagar', state: 'Delhi', district: 'Central Delhi', latitude: 28.57, longitude: 77.24,
    nextVerificationDueDate: '', photos: [],
  });
  const app = await storage.createApplication({
    instrumentId: inst.id, applicantId: user.id, applicantName: user.fullName, organization: user.organization,
    serviceType: 'INITIAL_VERIFICATION', state: 'Delhi', district: 'Central Delhi', location: inst.installationAddress,
    feeAmount: storage.feeFor(inst).total, feeStatus: 'UNPAID',
    documents: [{ id: 'd1', title: 'Model approval certificate', type: 'MODEL_APPROVAL', fileName: 'ma.pdf', fileSize: '10 KB', uploadedAt: new Date().toISOString(), fileUrl: 'data:application/pdf;base64,AA==' }],
  });
  return { user, inst, app };
}

describe('end-to-end workflow with enforced order', () => {
  beforeEach(() => storage.resetDemoData());

  it('registration to certificate, with every guard in place', async () => {
    const { user, inst, app } = await registerAndApply();
    expect(inst.id).toMatch(/^LM-DL-\d{4}-\d{6}$/);
    expect(app.status).toBe('SUBMITTED');
    expect(app.documents[0].reviewStatus).toBe('SUBMITTED');

    // An officer cannot assign before scrutiny and fee
    storage.switchDemoRole('CONTROLLER');
    const lmo = storage.getOfficers('LMO', 'Delhi')[0];
    expect(() => storage.assignApplication(app.id, 'LMO', lmo.id, lmo.fullName, 'x')).toThrow(WorkflowError);

    // Officer from another State cannot touch it
    storage.switchDemoRole('STATE_ADMIN'); // Gujarat
    expect(() => storage.updateScrutinyItem(app.id, 'scr-1', true)).toThrow(/Delhi/);

    // Scrutiny by Delhi controller
    storage.switchDemoRole('CONTROLLER');
    ['scr-1', 'scr-2', 'scr-3'].forEach(i => storage.updateScrutinyItem(app.id, i, true));
    expect(storage.getApplicationById(app.id)!.status).toBe('FEE_PENDING');
    expect(storage.getApplicationById(app.id)!.documents[0].reviewStatus).toBe('ACCEPTED');

    // Only the applicant pays
    expect(() => storage.payApplicationFee(app.id, 'UPI-1')).toThrow(WorkflowError);
    storage.setCurrentUser(user);
    storage.payApplicationFee(app.id, 'UPI-1');
    expect(storage.getApplicationById(app.id)!.status).toBe('ASSIGNMENT_PENDING');

    // District-aware suggestion, then assign and schedule
    storage.switchDemoRole('CONTROLLER');
    const s = storage.suggestAssignment(app.id);
    expect('officer' in s && s.officer.district).toBe('Central Delhi');
    if ('officer' in s) storage.assignApplication(app.id, s.type, s.officer.id, s.officer.fullName, s.reason);
    expect(() => storage.scheduleApplication(app.id, '2020-01-01', '09:00 AM - 11:00 AM')).toThrow(/future/);
    storage.scheduleApplication(app.id, new Date().toISOString().slice(0, 10), '11:00 AM - 01:00 PM');

    // Inspection: blank inspection cannot pass
    storage.switchDemoRole('LMO');
    const draft = storage.newInspectionDraft(app.id)!;
    await expect(storage.submitInspection({ applicationId: app.id, checklist: draft.checklist, testReadings: draft.readings, evidencePhotos: [], inspectorRemarks: 'x', result: 'PASS', gps: null })).rejects.toThrow(/Cannot pass/);

    const checklist = draft.checklist.map(c => ({ ...c, status: 'PASS' as const }));
    const readings = draft.readings.map(r => evaluateReading(r, sampleObservedValue(r, 0.5)));
    await expect(storage.submitInspection({ applicationId: app.id, checklist, testReadings: readings, evidencePhotos: [], inspectorRemarks: 'ok', result: 'PASS', gps: null })).rejects.toThrow(/photo/);

    const res = await storage.submitInspection({
      applicationId: app.id, checklist, testReadings: readings, inspectorRemarks: 'All good', result: 'PASS', stampType: 'LEAD_WIRE_SEAL',
      evidencePhotos: [{ id: 'p', caption: 'seal', url: 'data:image/jpeg;base64,AA==', type: 'SEAL_APPLIED', timestamp: new Date().toISOString() }],
      gps: { lat: 28.5701, lng: 77.2401, accuracy: 10 },
    });
    expect(res.certificate).toBeDefined();
    expect(res.certificate!.certificateNumber).toMatch(/^DL\/LM\/\d{4}\/\d{5}$/);
    expect(res.inspection.distanceFromSiteM).toBeLessThan(100);
    // No server in unit tests, so the signature is pending, never faked
    expect(res.certificate!.signatureStatus).toBe('PENDING_SIGNATURE');
    expect(storage.getApplicationById(app.id)!.status).toBe('COMPLETED');
    expect(storage.getInstrumentById(inst.id)!.status).toBe('ACTIVE');

    // Notifications were written for each step
    const templates = outbox.list().filter(m => m.recipientId === user.id).map(m => m.template);
    expect(templates).toEqual(expect.arrayContaining(['APPLICATION_SUBMITTED', 'FEE_RECEIVED', 'INSPECTION_SCHEDULED', 'CERTIFICATE_ISSUED']));
  });

  it('only the assigned officer can record the inspection', async () => {
    storage.switchDemoRole('LMO');
    // APP seeded as ASSIGNED in Gujarat belongs to the GATC
    const gj = storage.getApplications().find(a => a.state === 'Gujarat' && a.assignedToId)!;
    const draft = storage.newInspectionDraft(gj.id)!;
    await expect(storage.submitInspection({ applicationId: gj.id, checklist: draft.checklist, testReadings: draft.readings, evidencePhotos: [], inspectorRemarks: 'x', result: 'FAIL', gps: null })).rejects.toThrow(/assigned/);
  });
});

describe('data isolation', () => {
  beforeEach(() => storage.resetDemoData());

  it('a business sees only its own instruments, applications and certificates', async () => {
    const { user } = await registerAndApply();
    expect(storage.getInstrumentsForUser(user).every(i => i.ownerId === user.id)).toBe(true);
    expect(storage.getInstrumentsForUser(user)).toHaveLength(1);
    expect(storage.getCertificatesForUser(user)).toHaveLength(0);
    storage.switchDemoRole('BUSINESS');
    const rajesh = storage.getCurrentUser();
    expect(storage.getInstrumentsForUser(rajesh).every(i => i.ownerId === rajesh.id)).toBe(true);
  });

  it('cannot apply for someone else\'s instrument', async () => {
    const { user } = await registerAndApply();
    const other = storage.getInstruments().find(i => i.ownerId !== user.id)!;
    await expect(storage.createApplication({
      instrumentId: other.id, applicantId: user.id, applicantName: user.fullName, organization: user.organization, serviceType: 'PERIODIC_RE_VERIFICATION',
      state: other.state, district: other.district, location: '', feeAmount: 1, feeStatus: 'UNPAID',
      documents: [{ id: 'd', title: 'MA', type: 'MODEL_APPROVAL', fileName: 'a.pdf', fileSize: '1 KB', uploadedAt: '', fileUrl: '' }],
    })).rejects.toThrow(/your account/);
  });

  it('officers see only their own State', () => {
    storage.switchDemoRole('CONTROLLER');
    expect(storage.getApplicationsForUser().every(a => a.state === 'Delhi')).toBe(true);
    storage.switchDemoRole('STATE_ADMIN');
    expect(storage.getApplicationsForUser().every(a => a.state === 'Gujarat')).toBe(true);
  });

  it('duplicate open application for the same instrument is refused', async () => {
    const { user, inst } = await registerAndApply();
    await expect(storage.createApplication({
      instrumentId: inst.id, applicantId: user.id, applicantName: user.fullName, organization: user.organization, serviceType: 'INITIAL_VERIFICATION',
      state: 'Delhi', district: 'Central Delhi', location: '', feeAmount: 1, feeStatus: 'UNPAID',
      documents: [{ id: 'd', title: 'MA', type: 'MODEL_APPROVAL', fileName: 'a.pdf', fileSize: '1 KB', uploadedAt: '', fileUrl: '' }],
    })).rejects.toThrow(/already open/);
  });
});

describe('expiry reminders', () => {
  beforeEach(() => storage.resetDemoData());
  it('sends each milestone once', () => {
    const first = storage.runExpiryReminderJob();
    expect(first).toBeGreaterThan(0);
    expect(storage.runExpiryReminderJob()).toBe(0);
    expect(outbox.list().some(m => m.template === 'EXPIRY_REMINDER')).toBe(true);
  });
  it('status is derived from the due date', () => {
    const inst = storage.getInstruments().find(i => i.nextVerificationDueDate && i.nextVerificationDueDate < new Date().toISOString().slice(0, 10) && ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'].includes(i.status));
    if (inst) expect(inst.status).toBe('EXPIRED');
  });
});
