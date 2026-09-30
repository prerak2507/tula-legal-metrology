import { describe, it, expect } from 'vitest';
import {
  calculateStatutoryFee, getValidityPeriodMonths, isCategoryGatcEligible, generateDynamicChecklist, buildTestPlan,
  weighingMpeKg, dispenserMpeLitres, evaluateReading, recommendVerdict, parseMassKg, parseScaleIntervalKg, quarterMark,
  sampleObservedValue, DEFAULT_FEE_RULES,
} from '../services/rulesEngine';

describe('MPE limits (OIML R 76-1, initial verification)', () => {
  it('Class III bands: 0.5e up to 500e, 1e up to 2000e, 1.5e above', () => {
    const e = 0.02; // 20 g
    expect(weighingMpeKg(10, e, 'CLASS_III')).toBeCloseTo(0.01);   // 500e
    expect(weighingMpeKg(30, e, 'CLASS_III')).toBeCloseTo(0.02);   // 1500e
    expect(weighingMpeKg(150, e, 'CLASS_III')).toBeCloseTo(0.03);  // 7500e
  });
  it('Class II and IIII use their own bands', () => {
    expect(weighingMpeKg(0.5, 0.001, 'CLASS_II')).toBeCloseTo(0.0005);
    expect(weighingMpeKg(10, 0.001, 'CLASS_II')).toBeCloseTo(0.001);
    expect(weighingMpeKg(40, 1, 'CLASS_IIII')).toBeCloseTo(0.5);
    expect(weighingMpeKg(300, 1, 'CLASS_IIII')).toBeCloseTo(1.5);
  });
  it('fuel dispensers use 0.5 % of volume (R 117 class 0.5)', () => {
    expect(dispenserMpeLitres(20)).toBeCloseTo(0.1);
  });
});

describe('parsing', () => {
  it('reads capacities and intervals', () => {
    expect(parseMassKg('100,000 kg')).toBe(100000);
    expect(parseMassKg('500 g')).toBe(0.5);
    expect(parseMassKg('60 t')).toBe(60000);
    expect(parseMassKg('30 L/min')).toBeNull();
    expect(parseScaleIntervalKg('e = 10 kg, d = 5 kg')).toBe(10);
    expect(parseScaleIntervalKg('e = 20 g, d = 5 g')).toBeCloseTo(0.02);
  });
  it('quarter mark follows the calendar quarter', () => {
    expect(quarterMark(new Date('2026-02-10'))).toBe('A-26');
    expect(quarterMark(new Date('2026-09-30'))).toBe('C-26');
    expect(quarterMark(new Date('2026-12-01'))).toBe('D-26');
  });
});

describe('test plan sized to the instrument', () => {
  it('a 100 t weighbridge is tested up to its full 100 t capacity', () => {
    const plan = buildTestPlan({ category: 'WEIGHBRIDGE', capacity: '100,000 kg', scaleInterval: 'e = 10 kg', accuracyClass: 'CLASS_III' });
    expect(plan.map(r => r.nominal)).toContain(100000);
    expect(plan.find(r => r.nominal === 100000)?.mpe).toBe(15);
    expect(plan.every(r => r.result === 'PENDING' && r.observedValue === '')).toBe(true);
  });
  it('a 150 kg scale gets 150 kg as its top test point', () => {
    const plan = buildTestPlan({ category: 'PLATFORM_SCALE', capacity: '150 kg', scaleInterval: 'e = 20 g', accuracyClass: 'CLASS_III' });
    expect(Math.max(...plan.map(r => r.nominal!))).toBe(150);
  });
  it('dispensers get volume tests', () => {
    const plan = buildTestPlan({ category: 'FUEL_DISPENSER_PETROL_DIESEL', capacity: '45 L/min', scaleInterval: '', accuracyClass: 'NOT_APPLICABLE' });
    expect(plan.every(r => r.unit === 'L')).toBe(true);
  });
});

describe('readings and verdict', () => {
  const plan = buildTestPlan({ category: 'PLATFORM_SCALE', capacity: '150 kg', scaleInterval: 'e = 20 g', accuracyClass: 'CLASS_III' });
  const checklist = generateDynamicChecklist('PLATFORM_SCALE');

  it('computes error and pass / fail from the observed value', () => {
    const top = plan.find(r => r.nominal === 150)!;
    expect(evaluateReading(top, '150.02').result).toBe('PASS');
    expect(evaluateReading(top, '150.05').result).toBe('FAIL');
    expect(evaluateReading(top, '').result).toBe('PENDING');
    expect(evaluateReading(top, 'abc').result).toBe('PENDING');
  });
  it('checklist starts unchecked, so a blank inspection is INCOMPLETE, never PASS', () => {
    expect(checklist.every(c => c.status === 'NOT_CHECKED')).toBe(true);
    expect(recommendVerdict(checklist, plan).verdict).toBe('INCOMPLETE');
  });
  it('PASS needs every check and every reading within MPE', () => {
    const allOk = checklist.map(c => ({ ...c, status: 'PASS' as const }));
    const good = plan.map(r => evaluateReading(r, sampleObservedValue(r, 0.5)));
    expect(recommendVerdict(allOk, good).verdict).toBe('PASS');
    const bad = good.map((r, i) => (i === 3 ? evaluateReading(r, String(r.nominal! + 1)) : r));
    expect(recommendVerdict(allOk, bad).verdict).toBe('ADJUSTMENT_REQUIRED');
    const failed = allOk.map((c, i) => (i === 0 ? { ...c, status: 'FAIL' as const } : c));
    expect(recommendVerdict(failed, good).verdict).toBe('FAIL');
  });
  it('sample readings always fall inside the limit', () => {
    for (let s = 0; s <= 1; s += 0.1) plan.forEach(r => expect(evaluateReading(r, sampleObservedValue(r, s)).result).toBe('PASS'));
  });
});

describe('fees by State', () => {
  it('uses the State rule when one exists, otherwise the default', () => {
    expect(calculateStatutoryFee('WEIGHBRIDGE').total).toBe(4500);
    expect(calculateStatutoryFee('WEIGHBRIDGE', 'Gujarat').total).toBe(3900);
    expect(calculateStatutoryFee('WEIGHBRIDGE', 'Delhi').total).toBe(4500);
    expect(calculateStatutoryFee('PLATFORM_SCALE', 'Delhi').total).toBe(550);
  });
  it('accepts an edited schedule without code changes', () => {
    const edited = [...DEFAULT_FEE_RULES, { ...DEFAULT_FEE_RULES[0], id: 'X', jurisdiction: 'DL', category: 'WEIGHBRIDGE' as const, statutoryFee: 100, userCharge: 1 }];
    expect(calculateStatutoryFee('WEIGHBRIDGE', 'Delhi', edited).total).toBe(101);
  });
  it('validity and GATC routing are configurable data', () => {
    expect(getValidityPeriodMonths('WEIGHBRIDGE')).toBe(12);
    expect(getValidityPeriodMonths('WATER_METER')).toBe(24);
    expect(isCategoryGatcEligible('FUEL_DISPENSER_CNG')).toBe(true);
    expect(isCategoryGatcEligible('COUNTER_MACHINE')).toBe(false);
  });
});
