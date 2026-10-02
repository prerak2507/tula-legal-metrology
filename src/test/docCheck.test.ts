import { describe, expect, it } from 'vitest';
import { compareDocument, normaliseClass, normaliseDate, normaliseMark, DocCheckResponse } from '../services/docCheck';
import { maskSensitive, precheckQr, safeAiText } from '../../api/_lib/qrcheck.js';

const app = { modelApprovalNumber: 'IND/09/25/49', manufacturer: 'Jayan Electronics', capacity: '30 kg', accuracyClass: 'CLASS_III' };
const register = { company: 'M/s. JAYAN ELECTRONICS', equipment: 'Non-automatic Weighing Instrument', issueDate: '2025-02-21', pdf: 'https://lm.doca.gov.in/x.pdf' };
const fields = { readable: true, approvalMark: 'IND/09/25/49', company: 'M/s Jayan Electronics', maxCapacity: '30 kg', accuracyClass: 'accuracy class-III', issueDate: '21.02.2025' };
const base = (over: Partial<DocCheckResponse> = {}): DocCheckResponse =>
  ({ exact: false, officialChecked: true, register, uploaded: { ...fields }, official: { ...fields }, visualHints: [], ...over });

describe('normalisers', () => {
  it('treats different spellings of a mark, class and date as equal', () => {
    expect(normaliseMark('IND / 09 / 2025 / 049')).toBe('IND/09/25/49');
    expect(normaliseClass('medium accuracy (Class III)')).toBe('III');
    expect(normaliseClass('CLASS_IIII')).toBe('IIII');
    expect(normaliseDate('21.02.2025')).toBe('2025-02-21');
  });
});

describe('compareDocument', () => {
  it('reports an exact copy of DoCA\'s file without reading it', () => {
    expect(compareDocument(base({ exact: true, uploaded: null, official: null }), app).status).toBe('exact');
  });
  it('passes a document that matches the register, DoCA\'s copy and the application', () => {
    const v = compareDocument(base(), app);
    expect(v.status).toBe('match');
    expect(v.findings.some(f => f.level === 'warn')).toBe(false);
  });
  it('flags a capacity above what the model is approved for', () => {
    const v = compareDocument(base(), { ...app, capacity: '150 kg' });
    expect(v.status).toBe('mismatch');
    expect(v.findings.find(f => f.level === 'warn')?.text).toMatch(/approved model goes up to 30 kg/);
  });
  it('flags a different company, mark and class', () => {
    const v = compareDocument(base({ uploaded: { ...fields, company: 'Avery India', approvalMark: 'IND/09/25/50', accuracyClass: 'Class II' } }), app);
    const warns = v.findings.filter(f => f.level === 'warn').map(f => f.text).join(' | ');
    expect(warns).toMatch(/IND\/09\/25\/50/);
    expect(warns).toMatch(/Avery India/);
    expect(warns).toMatch(/Class II/);
  });
  it('flags a document that differs from DoCA\'s published copy', () => {
    const v = compareDocument(base({ official: { ...fields, maxCapacity: '15 kg' } }), app);
    expect(v.findings.some(f => /published copy \(15 kg\)/.test(f.text))).toBe(true);
  });
  it('warns when the mark is not in the register, and says when it could not read the file', () => {
    expect(compareDocument(base({ register: null, official: null }), app).status).toBe('mismatch');
    expect(compareDocument(base({ uploaded: { ...fields, readable: false } }), app).status).toBe('unreadable');
  });
  it('shows AI visual hints only as low-confidence information', () => {
    const v = compareDocument(base({ visualHints: ['text pasted over the date'] }), app);
    expect(v.status).toBe('match');
    expect(v.findings.at(-1)).toEqual({ level: 'info', text: 'AI hint (low confidence): text pasted over the date' });
  });
});

describe('QR plain checks', () => {
  it('spots payment QRs, shortened links and government look-alikes', () => {
    expect(precheckQr('upi://pay?pa=shop@okbank&am=10').kind).toBe('payment');
    expect(precheckQr('https://bit.ly/abc').flags.some(f => /shortened/.test(f.message))).toBe(true);
    expect(precheckQr('http://legalmetrology-verify.in/c/1').flags.map(f => f.message).join(' ')).toMatch(/government-sounding/);
    expect(precheckQr('https://lm.doca.gov.in/x').flags[0].level).toBe('info');
    expect(precheckQr('8901234567890').kind).toBe('product_code');
  });
  it('hides UPI IDs, e-mails and long numbers before anything is sent', () => {
    const m = maskSensitive('pay ramesh123@okbank or call 9876543210, mail a.b@shop.com');
    expect(m).not.toMatch(/ramesh123|9876543210|a\.b@shop\.com/);
    expect(m).toMatch(/ra•••@okbank/);
  });
  it('also hides spaced phone and Aadhaar-style numbers, Wi-Fi passwords and payee names', () => {
    const m = maskSensitive('call +91 98765 43210 or 98765-43210, id 1234 5678 9012; WIFI:S:Shop;T:WPA;P:secret123;; upi://pay?pa=x@ok&pn=Ramesh Kumar');
    expect(m).not.toMatch(/98765 43210|98765-43210|1234 5678 9012|secret123|Ramesh/);
  });
  it('drops AI text that carries links, numbers or reassurances', () => {
    expect(safeAiText('This QR opens a shop website. Ask the seller for the certificate.')).toBeTruthy();
    expect(safeAiText('Visit www.example.com to confirm.')).toBeNull();
    expect(safeAiText('Call 9876543210 for help.')).toBeNull();
    expect(safeAiText('This certificate is genuine.')).toBeNull();
  });
});

describe('compareDocument when the mark is not in DoCA\'s register', () => {
  it('reports it without needing the document read', () => {
    const v = compareDocument({ exact: false, officialChecked: false, register: null, uploaded: null, official: null, visualHints: [] }, app);
    expect(v.status).toBe('mismatch');
    expect(v.findings[0].text).toMatch(/not in DoCA's register/);
  });
});
