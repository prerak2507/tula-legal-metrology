// POST /api/sign
// Signs a verification certificate payload with the issuing authority's ECDSA P-256 key.
// The private key lives only in the server environment (CERT_SIGNING_PRIVATE_KEY, base64 PKCS8 DER).
// The browser never sees it. Anyone can verify with the public key shipped in the app.

import { createPrivateKey, sign as cryptoSign } from 'node:crypto';
import { guard, readJson, send, isIsoDate, shortText, clientIp } from './_lib/common.js';
import { asUser, SUPABASE_URL, PUBLIC_ORIGIN } from './_lib/supabase.js';

const FIELDS = {
  id: 40, n: 40, iu: 40, sn: 60, cat: 120, cap: 40, cls: 20, org: 120, own: 80,
  st: 40, dist: 60, dt: 10, exp: 10, sid: 40, auth: 20, off: 80,
};

let cachedKey = null;
function loadKey() {
  if (cachedKey) return cachedKey;
  const raw = process.env.CERT_SIGNING_PRIVATE_KEY;
  if (!raw) return null;
  cachedKey = keyFromBase64(raw);
  return cachedKey;
}

export function validatePayload(p) {
  if (!p || typeof p !== 'object') return 'payload must be an object';
  for (const [k, max] of Object.entries(FIELDS)) {
    if (!shortText(p[k], max)) return `field ${k} missing or too long`;
  }
  if (!isIsoDate(p.dt) || !isIsoDate(p.exp)) return 'dates must be YYYY-MM-DD';
  if (p.exp <= p.dt) return 'expiry must be after verification date';
  const months = (Date.parse(p.exp) - Date.parse(p.dt)) / (1000 * 60 * 60 * 24 * 30.4);
  if (months > 61) return 'validity longer than 5 years is not allowed';
  if (!['LMO', 'GATC'].includes(p.auth)) return 'auth must be LMO or GATC';
  if (Date.parse(p.dt) > Date.now() + 36 * 60 * 60 * 1000) return 'verification date is in the future';
  return null;
}

/** Builds the signed JSON (fixed key order) and signs it. Shared by the endpoint and the seed script. */
export function signPayload(input, key, kid, iat = new Date().toISOString()) {
  const signed = { v: 1, kid, iat };
  for (const k of Object.keys(FIELDS)) signed[k] = String(input[k]).trim();
  const bytes = Buffer.from(JSON.stringify(signed), 'utf8');
  const signature = cryptoSign('sha256', bytes, { key, dsaEncoding: 'ieee-p1363' });
  return { signed, p: b64url(bytes), s: b64url(signature) };
}

export function keyFromBase64(raw) {
  return createPrivateKey({ key: Buffer.from(raw.replace(/\s+/g, ''), 'base64'), format: 'der', type: 'pkcs8' });
}

const b64url = buf => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export default async function handler(req, res) {
  if (!guard(req, res, { name: 'sign', limit: 20, windowMs: 60_000 })) return;

  const key = loadKey();
  const kid = process.env.CERT_SIGNING_KEY_ID || 'tula-demo-2026-09';
  if (!key) {
    return send(res, 503, { error: 'signing_not_configured', message: 'The certificate signing key is not configured on this deployment.' });
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    return send(res, 400, { error: 'invalid_json' });
  }

  // Live mode: sign a certificate stored in the database, only for the officer who inspected it.
  if (body?.certId) return signStored(req, res, String(body.certId), key, kid);

  // Payload mode is for local development only.
  if (process.env.TULA_ALLOW_PAYLOAD_SIGNING !== '1') {
    return send(res, 401, { error: 'sign_in_required', message: 'Sign in as the inspecting officer to sign a certificate.' });
  }
  const input = body?.payload;
  const problem = validatePayload(input);
  if (problem) return send(res, 422, { error: 'invalid_payload', message: problem });

  // Fixed key order so the signed bytes are stable. Server stamps version, key id and time.
  const { signed, p, s } = signPayload(input, key, kid);

  // Issuance log (visible in the hosting provider's function logs).
  console.log(JSON.stringify({ event: 'certificate_signed', kid, cert: signed.n, instrument: signed.iu, ip: clientIp(req), at: signed.iat }));

  return send(res, 200, { p, s, kid, iat: signed.iat });
}

const encode = s => encodeURIComponent(s);

function fieldsFromRecord(c, auth) {
  return {
    id: c.id, n: c.certificateNumber, iu: c.instrumentId, sn: c.serialNumber, cat: c.instrumentType, cap: c.capacity,
    cls: String(c.accuracyClass || '').replace('CLASS_', 'Class '), org: c.organization, own: c.issuedToName, st: c.state,
    dist: c.district, dt: c.verificationDate, exp: c.validUntil, sid: c.stampId, auth, off: c.issuingOfficerName,
  };
}

async function signStored(req, res, certId, key, kid) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token || !SUPABASE_URL) return send(res, 401, { error: 'sign_in_required', message: 'Sign in as the inspecting officer to sign a certificate.' });

  const user = await asUser(token, '/auth/v1/user');
  if (!user.ok || !user.data?.id) return send(res, 401, { error: 'invalid_session', message: 'Your session has expired. Sign in again.' });

  const prof = await asUser(token, `/rest/v1/profiles?auth_id=eq.${user.data.id}&select=id,role,state`);
  const me = Array.isArray(prof.data) ? prof.data[0] : null;
  if (!me || !['LMO', 'GATC'].includes(me.role)) return send(res, 403, { error: 'not_an_officer', message: 'Only an LMO or GATC can sign certificates.' });

  const certRes = await asUser(token, `/rest/v1/certificates?id=eq.${encode(certId)}&select=data,state`);
  const row = Array.isArray(certRes.data) ? certRes.data[0] : null;
  if (!row) return send(res, 404, { error: 'not_found', message: 'Certificate not found in the database yet. Try again in a moment.' });
  const cert = row.data;
  if (cert.signatureStatus === 'SIGNED' && cert.signedPayload) {
    return send(res, 200, { p: cert.signedPayload, s: cert.signature, kid: cert.signingKid, iat: cert.signedAt, qr: cert.qrPayloadUrl });
  }

  const inspRes = await asUser(token, `/rest/v1/inspections?id=eq.${encode(cert.inspectionId)}&select=inspector_id`);
  const insp = Array.isArray(inspRes.data) ? inspRes.data[0] : null;
  if (!insp || insp.inspector_id !== me.id) return send(res, 403, { error: 'not_inspector', message: 'Only the officer who did the inspection can sign this certificate.' });

  const fields = fieldsFromRecord(cert, me.role);
  const problem = validatePayload(fields);
  if (problem) return send(res, 422, { error: 'invalid_record', message: problem });

  const { signed, p, s } = signPayload(fields, key, kid);
  const qr = `${PUBLIC_ORIGIN}/verify/${encode(cert.certificateNumber)}?p=${p}&s=${s}`;
  const data = { ...cert, signatureStatus: 'SIGNED', signedPayload: p, signature: s, signingKid: kid, signedAt: signed.iat, signingError: null, qrPayloadUrl: qr };
  const upd = await asUser(token, `/rest/v1/certificates?id=eq.${encode(certId)}`, { method: 'PATCH', body: JSON.stringify({ data }), headers: { Prefer: 'return=minimal' } });
  if (!upd.ok) return send(res, 502, { error: 'save_failed', message: 'Signed, but the database refused the update.' });

  console.log(JSON.stringify({ event: 'certificate_signed', kid, cert: signed.n, by: me.id, ip: clientIp(req), at: signed.iat }));
  return send(res, 200, { p, s, kid, iat: signed.iat, qr });
}
