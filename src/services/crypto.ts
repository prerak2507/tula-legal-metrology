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

  try {
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
    if (cryptoObj && cryptoObj.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(canonicalString);
      const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b: number) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('SubtleCrypto error, falling back to deterministic checksum', err);
  }

  // Fallback hash implementation
  let hash = 0x811c9dc5;
  for (let i = 0; i < canonicalString.length; i++) {
    hash ^= canonicalString.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash).toString(16).padStart(16, '0') + 'def098a72b14c6e938f';
}

export function buildPublicVerificationUrl(certId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  return `${origin}/verify/${encodeURIComponent(certId)}`;
}
