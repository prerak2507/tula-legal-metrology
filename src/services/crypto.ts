// Cryptographic integrity services for Legal Metrology Verification Certificates

/**
 * Standard pure JS SHA-256 implementation as a reliable fallback when Web Crypto API is unavailable.
 */
function sha256Pure(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = (sha256Pure as any).h = (sha256Pure as any).h || [];
  let k = (sha256Pure as any).k = (sha256Pure as any).k || [];
  let primeCounter = k[lengthProperty];

  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  hash = hash.slice(0, 8);

  for (i = 0; i < ascii[lengthProperty]; i++) {
    const charCode = ascii.charCodeAt(i);
    words[i >> 2] |= charCode << ((3 - (i % 4)) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      if (i >= 16) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[i] + (w[i] | 0)) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

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
    console.warn('SubtleCrypto error, falling back to pure JS SHA-256 implementation', err);
  }

  return sha256Pure(canonicalString);
}

export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // remove HTML brackets
    .slice(0, 500); // cap length
}

export function buildPublicVerificationUrl(certId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  return `${origin}/verify/${encodeURIComponent(certId.trim())}`;
}
