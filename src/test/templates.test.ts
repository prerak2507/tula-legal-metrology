import { describe, expect, it } from 'vitest';
import { TEMPLATES, fmtDate } from '../../api/_lib/templates.js';

describe('SMS and email text', () => {
  it('writes dates the way an office letter does', () => {
    expect(fmtDate('2026-09-14')).toBe('14 Sep 2026');
  });
  it('says an expired instrument has expired, with the offence', () => {
    const t = TEMPLATES.EXPIRY_REMINDER({ instrumentId: 'LM-MH-2026-003819', dueDate: '2026-09-14', days: '0', expired: '1', link: 'x' }).text;
    expect(t).toContain('expired on 14 Sep 2026');
    expect(t).toContain('section 24');
    expect(t).not.toContain('0 days');
  });
  it('counts days for one still due', () => {
    expect(TEMPLATES.EXPIRY_REMINDER({ instrumentId: 'I', dueDate: '2026-10-08', days: '7', expired: '0', link: 'x' }).text).toContain('in 7 days');
    expect(TEMPLATES.EXPIRY_REMINDER({ instrumentId: 'I', dueDate: '2026-10-01', days: '0', expired: '0', link: 'x' }).text).toContain('due today');
  });
  it('keeps the certificate SMS short', () => {
    const t = TEMPLATES.CERTIFICATE_ISSUED({ certNo: 'DL/LM/2026/08914', instrumentId: 'LM-DL-2026-001550', validUntil: '2027-09-29', link: 'https://tula-legal-metrology.vercel.app/verify/DL%2FLM%2F2026%2F08914' }).text;
    expect(t.length).toBeLessThan(220);
    expect(t).toContain('29 Sep 2027');
  });
});
