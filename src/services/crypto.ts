// Cryptographic integrity services for Legal Metrology Verification Certificates

export async function generateCertificateSha256(payload: {
  certificateNumber: string;
  instrumentId: string;
  serialNumber: string;
  applicantOrganization: string;
  category: string;
  capacity: string;
  verificationDate: string;
  validUntil: string;
  stampId: string;
  issuingAuthority: string;
}): Promise<string> {
  const canonicalString = [
    `CERT:${payload.certificateNumber.trim()}`,
    `INST:${payload.instrumentId.trim()}`,
    `SR:${payload.serialNumber.trim()}`,
    `ORG:${payload.applicantOrganization.trim()}`,
    `CAT:${payload.category.trim()}`,
    `CAP:${payload.capacity.trim()}`,
    `DATE:${payload.verificationDate.trim()}`,
    `EXP:${payload.validUntil.trim()}`,
    `STAMP:${payload.stampId.trim()}`,
    `AUTH:${payload.issuingAuthority.trim()}`,
  ].join('|');

  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
  if (!cryptoObj?.subtle) {
    throw new Error('Secure hashing is not available in this browser. Use a current Chrome, Safari or Firefox over HTTPS.');
  }
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', new TextEncoder().encode(canonicalString));
  return Array.from(new Uint8Array(hashBuffer)).map((b: number) => b.toString(16).padStart(2, '0')).join('');
}

export function buildPublicVerificationUrl(certId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  return `${origin}/verify/${encodeURIComponent(certId)}`;
}
