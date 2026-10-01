import { describe, expect, it } from 'vitest';
import { compoundingFee } from '../config/compounding';

// Delhi Schedule XI as substituted by the Delhi Legal Metrology (Enforcement) Amendment Rules, 2026.
describe('Delhi compounding fees (Schedule XI, 2026)', () => {
  it('charges Rs 10,000 under item 11 for an unverified instrument', () => {
    expect(compoundingFee('Delhi', 'UNVERIFIED_USE')).toMatchObject({ amount: 10000, item: 'Schedule XI, item 11' });
  });

  it('charges Rs 5,000 under item 17 for a certificate not displayed', () => {
    expect(compoundingFee('Delhi', 'NON_DISPLAY_OF_CERTIFICATE')).toMatchObject({ amount: 5000, item: 'Schedule XI, item 17' });
  });

  it('leaves the amount to the Controller where the schedule is not loaded', () => {
    expect(compoundingFee('Gujarat', 'UNVERIFIED_USE')).toBeNull();
    expect(compoundingFee('Delhi', 'UNAPPROVED_MODEL')).toBeNull();
  });
});
