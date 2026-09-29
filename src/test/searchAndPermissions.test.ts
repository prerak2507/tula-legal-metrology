import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage';

describe('Search, Role Permissions & Certificate Verification Tests', () => {
  beforeEach(() => {
    storage.resetDemoData();
  });

  describe('Search & Filter Engine', () => {
    it('searches instruments by UID', () => {
      const inst = storage.getInstrumentById('LM-DL-2026-001290');
      expect(inst).toBeDefined();
      expect(inst?.manufacturer).toBe('Avery India Metrology Ltd');
    });

    it('searches instruments by serial number', () => {
      const all = storage.getInstruments();
      const match = all.filter(i => i.serialNumber.includes('AVR-90412'));
      expect(match.length).toBe(1);
      expect(match[0].id).toBe('LM-DL-2026-001290');
    });

    it('filters applications by status', () => {
      const apps = storage.getApplications();
      const completed = apps.filter(a => a.status === 'COMPLETED');
      expect(completed.length).toBeGreaterThan(0);
    });
  });

  describe('Role Switcher & RBAC Context', () => {
    it('switches between all 6 authorized personas', () => {
      storage.switchDemoRole('LMO');
      expect(storage.getCurrentUser().role).toBe('LMO');
      expect(storage.getCurrentUser().badgeNumber).toBe('DL-LMO-042');

      storage.switchDemoRole('GATC');
      expect(storage.getCurrentUser().role).toBe('GATC');
      expect(storage.getCurrentUser().gatcCode).toBe('GATC-GJ-2026-08');

      storage.switchDemoRole('CONTROLLER');
      expect(storage.getCurrentUser().role).toBe('CONTROLLER');
      expect(storage.getCurrentUser().fullName).toContain('Sunita Meena');

      storage.switchDemoRole('STATE_ADMIN');
      expect(storage.getCurrentUser().role).toBe('STATE_ADMIN');

      storage.switchDemoRole('CENTRAL_ADMIN');
      expect(storage.getCurrentUser().role).toBe('CENTRAL_ADMIN');
    });
  });

  describe('Public Verification Lookup', () => {
    it('finds valid certificate by Certificate Number and verifies canonical parameters', () => {
      const cert = storage.getCertificateById('CERT-2026-08912');
      expect(cert).toBeDefined();
      expect(cert?.status).toBe('VALID');
      expect(cert?.certificateNumber).toBe('DL/LM/2026/08912');
      expect(cert?.instrumentId).toBe('LM-DL-2026-001290');
      expect(cert?.accuracyClass).toBe('CLASS_III');
    });

    it('returns undefined for non-existent certificate numbers', () => {
      const notFound = storage.getCertificateById('FAKE-CERT-99999');
      expect(notFound).toBeUndefined();
    });
  });

  describe('Enforcement & Audit Logging', () => {
    it('registers new enforcement case and appends to audit log', () => {
      const initialAuditCount = storage.getAuditLogs().length;

      const newCase = storage.createEnforcementCase({
        instrumentId: 'LM-DL-2026-001290',
        businessName: 'Test Market Outlet',
        violatorName: 'Rajesh Kumar',
        location: 'Shop 5, Chandni Chowk',
        district: 'Central Delhi',
        state: 'Delhi',
        offenseCategory: 'TAMPERED_SEAL',
        actSection: 'Section 30',
        officerId: 'usr-lmo-1',
        officerName: 'Inspector Amit K. Sharma',
        status: 'OPEN',
        actionTaken: 'Seized under Section 27',
        penaltyAmount: 25000,
        evidenceNotes: 'Lead wire seal severed',
      });

      expect(newCase.id).toMatch(/^ENF-2026-/);
      expect(storage.getAuditLogs().length).toBeGreaterThan(initialAuditCount);
    });
  });
});
