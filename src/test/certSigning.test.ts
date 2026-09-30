import { describe, it, expect } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { verifySignedQr, tamperPayload, parseQrText, buildVerifyUrl, b64urlToBytes } from '../services/certSigning';
import { SEED_SIGNATURES } from '../data/seedSignatures';
// @ts-expect-error plain JS module shared with the serverless function
import { signPayload, validatePayload } from '../../api/sign.js';

const genuine = SEED_SIGNATURES['CERT-2026-08912'];

describe('signed QR verification (runs fully offline)', () => {
  it('accepts a genuine certificate', async () => {
    const r = await verifySignedQr(genuine.p, genuine.s, new Date('2026-09-30'));
    expect(r.status).toBe('VALID');
    if (r.status === 'VALID') expect(r.payload.n).toBe('DL/LM/2026/08912');
  });

  it('rejects a copy with the expiry date changed', async () => {
    const edited = tamperPayload(genuine.p, 'exp', '2029-12-31');
    expect((await verifySignedQr(edited, genuine.s)).status).toBe('TAMPERED');
  });

  it('rejects a copy with the serial number changed', async () => {
    const edited = tamperPayload(genuine.p, 'sn', 'SN-FAKE-0001');
    expect((await verifySignedQr(edited, genuine.s)).status).toBe('TAMPERED');
  });

  it('rejects a signature taken from a different certificate', async () => {
    const other = SEED_SIGNATURES['CERT-2026-01994'];
    expect((await verifySignedQr(genuine.p, other.s)).status).toBe('TAMPERED');
  });

  it('rejects a certificate signed by an attacker key', async () => {
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const fields = JSON.parse(new TextDecoder().decode(b64urlToBytes(genuine.p)));
    const forged = signPayload(fields, privateKey, 'tula-demo-2026-09');
    expect((await verifySignedQr(forged.p, forged.s)).status).toBe('TAMPERED');
    const unknownKid = signPayload(fields, privateKey, 'attacker-key');
    expect((await verifySignedQr(unknownKid.p, unknownKid.s)).status).toBe('UNKNOWN_KEY');
  });

  it('reports expiry for a genuine but old certificate', async () => {
    const old = SEED_SIGNATURES['CERT-2025-10101'];
    expect((await verifySignedQr(old.p, old.s, new Date('2026-09-30'))).status).toBe('EXPIRED');
  });

  it('treats garbage as malformed, not valid', async () => {
    expect((await verifySignedQr('not-base64!!', 'x')).status).toMatch(/MALFORMED|TAMPERED/);
  });

  it('parses the QR URL back into its parts', () => {
    const url = buildVerifyUrl('https://tula.example', 'DL/LM/2026/08912', genuine.p, genuine.s);
    expect(url).toContain('/verify/DL%2FLM%2F2026%2F08912?p=');
    const parsed = parseQrText(url);
    expect(parsed.id).toBe('DL/LM/2026/08912');
    expect(parsed.p).toBe(genuine.p);
    expect(parsed.s).toBe(genuine.s);
  });
});

describe('signing endpoint validation', () => {
  const base = { id: 'CERT-1', n: 'DL/LM/2026/00001', iu: 'LM-DL-2026-000001', sn: 'SN1', cat: 'Scale', cap: '30 kg', cls: 'Class III', org: 'Shop', own: 'Owner', st: 'Delhi', dist: 'South Delhi', dt: '2026-09-30', exp: '2027-09-29', sid: 'STAMP-1', auth: 'LMO', off: 'Officer' };
  it('accepts a complete payload', () => expect(validatePayload(base)).toBeNull());
  it('rejects expiry before issue', () => expect(validatePayload({ ...base, exp: '2026-01-01' })).toMatch(/expiry/));
  it('rejects validity over 5 years', () => expect(validatePayload({ ...base, exp: '2035-01-01' })).toMatch(/5 years/));
  it('rejects a missing field', () => expect(validatePayload({ ...base, sn: '' })).toMatch(/sn/));
  it('rejects an unknown authority type', () => expect(validatePayload({ ...base, auth: 'ANYONE' })).toMatch(/auth/));
});
