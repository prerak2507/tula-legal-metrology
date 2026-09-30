import { describe, it, expect } from 'vitest';
import { generateCertificateSha256, sanitizeInput, buildPublicVerificationUrl } from '../services/crypto';

describe('Crypto & Security Service Tests', () => {
  it('should generate a 64-character SHA-256 hex digest for certificate payload', async () => {
    const payload = {
      certificateNumber: 'DL/LM/2026/08912',
      instrumentId: 'LM-DL-2026-000001',
      serialNumber: 'SR-998822',
      applicantOrganization: 'Apex Agro Logistics',
      category: 'NON_AUTOMATIC_WEIGHING',
      capacity: '150 kg',
      verificationDate: '2026-01-18',
      validUntil: '2027-01-17',
      stampId: 'STAMP-DL-26-0842',
      issuingAuthority: 'Office of the Controller of Legal Metrology',
    };

    const hash = await generateCertificateSha256(payload);
    expect(hash).toBeTypeOf('string');
    expect(hash.length).toBe(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/i);
  });

  it('should produce identical hashes for identical payloads (deterministic)', async () => {
    const payload = {
      certificateNumber: 'CERT-100',
      instrumentId: 'INST-100',
      serialNumber: 'SR-100',
      applicantOrganization: 'Test Org',
      category: 'WEIGHBRIDGE',
      capacity: '50000 kg',
      verificationDate: '2026-02-01',
      validUntil: '2027-01-31',
      stampId: 'STAMP-100',
      issuingAuthority: 'Metrology Dept',
    };

    const hash1 = await generateCertificateSha256(payload);
    const hash2 = await generateCertificateSha256(payload);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes when payload changes', async () => {
    const payload1 = {
      certificateNumber: 'CERT-100',
      instrumentId: 'INST-100',
      serialNumber: 'SR-100',
      applicantOrganization: 'Test Org',
      category: 'WEIGHBRIDGE',
      capacity: '50000 kg',
      verificationDate: '2026-02-01',
      validUntil: '2027-01-31',
      stampId: 'STAMP-100',
      issuingAuthority: 'Metrology Dept',
    };

    const payload2 = {
      ...payload1,
      serialNumber: 'SR-101', // modified
    };

    const hash1 = await generateCertificateSha256(payload1);
    const hash2 = await generateCertificateSha256(payload2);
    expect(hash1).not.toBe(hash2);
  });

  it('should sanitize input strings by removing HTML brackets and trimming', () => {
    const raw = '  <script>alert("xss")</script> CERT-2026-08912  ';
    const clean = sanitizeInput(raw);
    expect(clean).toBe('scriptalert("xss")/script CERT-2026-08912');
  });

  it('should build public verification URL with encoded cert ID', () => {
    const url = buildPublicVerificationUrl('CERT/2026/08912');
    expect(url).toContain('/verify/CERT%2F2026%2F08912');
  });
});
