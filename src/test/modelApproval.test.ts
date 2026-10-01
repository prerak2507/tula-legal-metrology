import { describe, expect, it } from 'vitest';
import { MARK_PATTERN, sameMaker } from '../services/modelApproval';

describe('approval mark format', () => {
  it('accepts marks as printed on nameplates', () => {
    for (const m of ['IND/09/25/235', 'ind/09/26/456', 'IND / 09 / 21 / 1', 'IND/09/2025/235']) expect(MARK_PATTERN.test(m)).toBe(true);
  });
  it('rejects other strings', () => {
    for (const m of ['', 'IND-09-25-235', '09/25/235', 'IND/09/25/', 'IND/09/25/23A']) expect(MARK_PATTERN.test(m)).toBe(false);
  });
});

describe('same maker', () => {
  it('ignores legal suffixes and the M/s prefix', () => {
    expect(sameMaker('M/s Avery India Ltd.', 'Avery India Limited')).toBe(true);
    expect(sameMaker('ESSAE -TERAOKA PRIVATE LIMITED', 'Essae-Teraoka Pvt Ltd')).toBe(true);
  });
  it('flags a different company', () => {
    expect(sameMaker('METTLER-TOLEDO INDIA PRIVATE LIMITED', 'Sartorius India Pvt Ltd')).toBe(false);
  });
});
