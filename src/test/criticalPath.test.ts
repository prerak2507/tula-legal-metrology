import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage';
import { generateDynamicChecklist, generateDefaultTestReadings } from '../services/rulesEngine';

describe('Legal Metrology Critical Path End-to-End Workflow', () => {
  beforeEach(() => {
    storage.resetDemoData();
  });

  it('executes full critical path from registration to certificate and public verification', async () => {
    // 1. Role Switch: Business User
    storage.switchDemoRole('BUSINESS');
    const user = storage.getCurrentUser();
    expect(user.role).toBe('BUSINESS');
    expect(user.fullName).toBe('Rajesh Varma');

    // 2. Register New Instrument (One Instrument -> One Digital Identity)
    const newInst = storage.registerInstrument({
      category: 'COUNTER_MACHINE',
      categoryName: 'Precision Commercial Counter Scale (Class III)',
      accuracyClass: 'CLASS_III',
      manufacturer: 'Essae India Scales Ltd',
      model: 'ES-Counter-2026',
      modelApprovalNumber: 'IND/09/2026/044',
      serialNumber: 'SN-TEST-88912',
      capacity: '30 kg',
      scaleInterval: 'e = 5 g, d = 1 g',
      purchaseDate: '2026-03-01',
      installationDate: '2026-03-05',
      ownerId: user.id,
      ownerName: user.fullName,
      organization: user.organization,
      installationAddress: 'Shop 12, Khan Market, New Delhi',
      state: 'Delhi',
      district: 'Central Delhi',
      nextVerificationDueDate: '2027-03-04',
      photos: ['https://images.unsplash.com/photo-1584727638096-042c45049ebe'],
    });

    expect(newInst.id).toMatch(/^LM-DL-2026-/);
    expect(newInst.status).toBe('REGISTERED');

    // 3. Create Verification Application
    const newApp = storage.createApplication({
      instrumentId: newInst.id,
      applicantId: user.id,
      applicantName: user.fullName,
      organization: user.organization,
      serviceType: 'INITIAL_VERIFICATION',
      state: newInst.state,
      district: newInst.district,
      location: newInst.installationAddress,
      feeAmount: 250,
      feeStatus: 'UNPAID',
      documents: [
        {
          id: 'doc-t1',
          title: 'Purchase Tax Invoice',
          type: 'PURCHASE_INVOICE',
          fileName: 'Invoice_Essae.pdf',
          fileSize: '300 KB',
          uploadedAt: new Date().toISOString(),
          fileUrl: '#',
        }
      ],
    });

    expect(newApp.id).toMatch(/^APP-2026-/);
    expect(newApp.status).toBe('SUBMITTED');

    // Instrument state transitioned to UNDER_VERIFICATION
    const instAfterApp = storage.getInstrumentById(newInst.id);
    expect(instAfterApp?.status).toBe('UNDER_VERIFICATION');

    // 4. Role Switch: LMO Inspector for Scrutiny
    storage.switchDemoRole('LMO');
    const lmo = storage.getCurrentUser();
    expect(lmo.role).toBe('LMO');

    // Scrutinize items
    storage.updateScrutinyItem(newApp.id, 'scr-1', true, 'Identity verified');
    storage.updateScrutinyItem(newApp.id, 'scr-2', true, 'Model approved');
    storage.updateScrutinyItem(newApp.id, 'scr-3', true, 'Environment acceptable');

    const appAfterScrutiny = storage.getApplicationById(newApp.id);
    expect(appAfterScrutiny?.status).toBe('ACCEPTED');

    // 5. Pay Statutory Fee
    storage.payApplicationFee(newApp.id, 'UPI-SBIN-2609291122');
    const appAfterFee = storage.getApplicationById(newApp.id);
    expect(appAfterFee?.feeStatus).toBe('PAID');
    expect(appAfterFee?.status).toBe('ASSIGNMENT_PENDING');

    // 6. Assignment to LMO based on Jurisdiction
    storage.assignApplication(
      newApp.id,
      'LMO',
      lmo.id,
      lmo.fullName,
      'Assigned to Central Delhi Zonal Inspector based on local jurisdiction'
    );
    const appAfterAssign = storage.getApplicationById(newApp.id);
    expect(appAfterAssign?.status).toBe('ASSIGNED');
    expect(appAfterAssign?.assignedToId).toBe(lmo.id);

    // 7. Scheduling
    storage.scheduleApplication(newApp.id, '2026-10-02', '11:00 AM - 01:00 PM');
    const appAfterSchedule = storage.getApplicationById(newApp.id);
    expect(appAfterSchedule?.status).toBe('SCHEDULED');

    // 8. Field Inspection & Observations Entry
    const checklist = generateDynamicChecklist(newInst.category);
    const testReadings = generateDefaultTestReadings(newInst.category, newInst.capacity);

    const inspectionResult = await storage.completeInspectionAndIssueCertificate({
      applicationId: newApp.id,
      instrumentId: newInst.id,
      checklist,
      testReadings,
      evidencePhotos: [
        {
          id: 'ev-test-1',
          caption: 'Zero reading on display',
          url: 'https://images.unsplash.com/photo-1584727638096-042c45049ebe',
          type: 'READING_DISPLAY',
          timestamp: new Date().toISOString(),
        }
      ],
      inspectorRemarks: 'Inspected under Legal Metrology Act 2009. Errors within MPE limits.',
      result: 'PASS',
      stampType: 'LEAD_WIRE_SEAL',
    });

    // 9. Verification & Stamping Result Checks
    expect(inspectionResult.inspection.result).toBe('PASS');
    expect(inspectionResult.stamp).toBeDefined();
    expect(inspectionResult.stamp?.quarterAndYear).toBe('A-26');
    expect(inspectionResult.certificate).toBeDefined();

    const cert = inspectionResult.certificate!;
    expect(cert.status).toBe('VALID');
    expect(cert.sha256Hash).toBeDefined();
    expect(cert.sha256Hash.length).toBeGreaterThan(16);
    expect(cert.qrPayloadUrl).toContain(`/verify/${cert.id}`);

    // Instrument status now ACTIVE
    const activeInst = storage.getInstrumentById(newInst.id);
    expect(activeInst?.status).toBe('ACTIVE');
    expect(activeInst?.currentCertificateId).toBe(cert.id);
    expect(activeInst?.currentStampId).toBe(inspectionResult.stamp?.id);

    // 10. Public Verification Check
    const publicFoundCert = storage.getCertificateById(cert.id);
    expect(publicFoundCert).toBeDefined();
    expect(publicFoundCert?.status).toBe('VALID');
    expect(publicFoundCert?.instrumentId).toBe(newInst.id);

    // 11. Expiry Simulation Check
    storage.simulateInstrumentExpiry(newInst.id);
    const expiredInst = storage.getInstrumentById(newInst.id);
    expect(expiredInst?.status).toBe('EXPIRED');
    const expiredCert = storage.getCertificateById(cert.id);
    expect(expiredCert?.status).toBe('EXPIRED');

    // 12. Revocation Check
    storage.revokeCertificate(cert.id, 'Test revocation on tampering');
    const revokedCert = storage.getCertificateById(cert.id);
    expect(revokedCert?.status).toBe('REVOKED');
  });
});
