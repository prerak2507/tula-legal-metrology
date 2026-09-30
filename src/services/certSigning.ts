// Certificate signing and offline verification.
//
// Issue:  the app sends the certificate fields to /api/sign. The server adds a key id and
//         timestamp, signs the exact JSON bytes with ECDSA P-256, and returns
//         p = base64url(JSON bytes) and s = base64url(signature).
// QR:     /verify/<certificate no>?p=...&s=...  The certificate travels inside the QR.
// Verify: any browser checks s over p with the public key for p.kid. No server or login needed,
//         so a phone with no network can still tell a genuine certificate from an edited or fake one.

import { findTrustedKey } from '../config/trustedKeys';
import { VerificationCertificate } from '../types';

export interface SignedFields {
  id: string;      // certificate id
  n: string;       // certificate number
  iu: string;      // instrument UID
  sn: string;      // serial number
  cat: string;     // instrument type
  cap: string;     // capacity
  cls: string;     // accuracy class
  org: string;     // organisation
  own: string;     // owner / occupier name
  st: string;      // state
  dist: string;    // district
  dt: string;      // verification date YYYY-MM-DD
  exp: string;     // valid until YYYY-MM-DD
  sid: string;     // stamp / seal id
  auth: 'LMO' | 'GATC';
  off: string;     // officer name
}

export interface SignedPayload extends SignedFields {
  v: number;
  kid: string;
  iat: string;
}

export type SignatureCheck =
  | { status: 'VALID'; payload: SignedPayload; demoKey: boolean; keyLabel: string }
  | { status: 'EXPIRED'; payload: SignedPayload; demoKey: boolean; keyLabel: string }
  | { status: 'TAMPERED'; reason: string }
  | { status: 'UNKNOWN_KEY'; kid: string }
  | { status: 'MALFORMED'; reason: string }
  | { status: 'UNSUPPORTED'; reason: string };

export function fieldsFromCertificate(c: VerificationCertificate, auth: 'LMO' | 'GATC'): SignedFields {
  return {
    id: c.id,
    n: c.certificateNumber,
    iu: c.instrumentId,
    sn: c.serialNumber,
    cat: c.instrumentType,
    cap: c.capacity,
    cls: c.accuracyClass.replace('CLASS_', 'Class '),
    org: c.organization,
    own: c.issuedToName,
    st: c.state,
    dist: c.district,
    dt: c.verificationDate,
    exp: c.validUntil,
    sid: c.stampId,
    auth,
    off: c.issuingOfficerName,
  };
}

export type SignResult =
  | { ok: true; p: string; s: string; kid: string; iat: string; qr?: string }
  | { ok: false; reason: 'offline' | 'not_configured' | 'rejected' | 'network'; message: string };

/** Asks the issuing server to sign. Never throws. */
export async function requestSignature(fields: SignedFields, certId?: string, accessToken?: string): Promise<SignResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, reason: 'offline', message: 'Device is offline. The certificate will be signed when the connection returns.' };
  }
  try {
    const r = await fetch('/api/sign', {
      method: 'POST',
      // Live mode: the server loads the certificate from the database and checks the officer's sign-in.
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify(certId && accessToken ? { certId } : { payload: fields }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.p && data.s) return { ok: true, p: data.p, s: data.s, kid: data.kid, iat: data.iat, qr: data.qr };
    if (r.status === 503) return { ok: false, reason: 'not_configured', message: data.message || 'Signing key not configured on this deployment.' };
    if (r.status === 404 && !data.error) return { ok: false, reason: 'not_configured', message: 'Signing service is not deployed here.' };
    return { ok: false, reason: 'rejected', message: data.message || `Signing failed (HTTP ${r.status}).` };
  } catch {
    return { ok: false, reason: 'network', message: 'Could not reach the signing service. Will retry automatically.' };
  }
}

// ---------- encoding helpers ----------
export function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function buildVerifyUrl(origin: string, certificateNumber: string, p?: string, s?: string): string {
  const base = `${origin}/verify/${encodeURIComponent(certificateNumber)}`;
  return p && s ? `${base}?p=${p}&s=${s}` : base;
}

/** Pulls p and s out of anything a QR might contain: a full URL, a path, or a bare id. */
export function parseQrText(text: string): { id?: string; p?: string; s?: string } {
  const t = text.trim();
  try {
    const u = new URL(t, 'https://placeholder.invalid');
    const m = u.pathname.match(/\/verify\/(.+)$/);
    const id = m ? decodeURIComponent(m[1]) : undefined;
    const p = u.searchParams.get('p') || undefined;
    const s = u.searchParams.get('s') || undefined;
    if (id || p) return { id, p, s };
  } catch {
    /* fall through */
  }
  return { id: t };
}

const keyCache = new Map<string, CryptoKey>();

async function importKey(kid: string): Promise<CryptoKey | null> {
  if (keyCache.has(kid)) return keyCache.get(kid)!;
  const trusted = findTrustedKey(kid);
  if (!trusted) return null;
  const key = await crypto.subtle.importKey('jwk', trusted.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  keyCache.set(kid, key);
  return key;
}

/** Verifies a signed QR. Works fully offline. */
export async function verifySignedQr(p: string, s: string, today = new Date()): Promise<SignatureCheck> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return { status: 'UNSUPPORTED', reason: 'This browser cannot check signatures. Open the link in Chrome, Safari or Firefox.' };
  }
  let bytes: Uint8Array;
  let sig: Uint8Array;
  let payload: SignedPayload;
  try {
    bytes = b64urlToBytes(p);
    sig = b64urlToBytes(s);
    payload = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return { status: 'MALFORMED', reason: 'The QR data is damaged or incomplete.' };
  }
  if (!payload || typeof payload.kid !== 'string') return { status: 'MALFORMED', reason: 'The QR has no signing key id.' };
  if (sig.length !== 64) return { status: 'TAMPERED', reason: 'The signature has the wrong length.' };

  const key = await importKey(payload.kid);
  if (!key) return { status: 'UNKNOWN_KEY', kid: payload.kid };
  const trusted = findTrustedKey(payload.kid)!;

  const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sig as BufferSource, bytes as BufferSource);
  if (!ok) return { status: 'TAMPERED', reason: 'The signature does not match the certificate details. It was edited or forged.' };

  const todayStr = today.toISOString().slice(0, 10);
  const base = { payload, demoKey: trusted.demo, keyLabel: trusted.label };
  return payload.exp < todayStr ? { status: 'EXPIRED', ...base } : { status: 'VALID', ...base };
}

/** Builds a copy of a signed QR with one field changed, to show that tampering is detected. */
export function tamperPayload(p: string, field: keyof SignedFields, value: string): string {
  const obj = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
  obj[field] = value;
  return bytesToB64url(new TextEncoder().encode(JSON.stringify(obj)));
}
