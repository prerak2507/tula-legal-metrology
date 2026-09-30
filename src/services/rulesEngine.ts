import {
  InstrumentCategory, FeeRule, ValidityRule, InspectionChecklistItem, TestReadingRow, AccuracyClass, Instrument,
} from '../types';

// ---------------------------------------------------------------------------
// Rules are DATA. Each State loads its own fee schedule and validity periods
// (from its Legal Metrology (Enforcement) Rules) through the Rules screen; the
// engine never hard-codes a State's numbers. Values below are the demo defaults
// used by the prototype and are labelled as such everywhere they appear.
// ---------------------------------------------------------------------------

export const STATE_CODES: Record<string, string> = {
  Delhi: 'DL', Gujarat: 'GJ', Maharashtra: 'MH', Karnataka: 'KA', 'Tamil Nadu': 'TN', Rajasthan: 'RJ',
  'Uttar Pradesh': 'UP', 'West Bengal': 'WB', Telangana: 'TS', Kerala: 'KL', Punjab: 'PB', Haryana: 'HR',
};
export const stateCode = (state: string) => STATE_CODES[state] || 'IN';

const DEMO_CITATION = 'Demo value. Replace with the State Legal Metrology (Enforcement) Rules schedule';

export const DEFAULT_VALIDITY_RULES: ValidityRule[] = [
  { category: 'NON_AUTOMATIC_WEIGHING', validityMonths: 12, description: 'Annual re-verification', statutoryReference: DEMO_CITATION },
  { category: 'AUTOMATIC_WEIGHING', validityMonths: 12, description: 'Annual re-verification', statutoryReference: DEMO_CITATION },
  { category: 'PLATFORM_SCALE', validityMonths: 12, description: 'Annual re-verification', statutoryReference: DEMO_CITATION },
  { category: 'COUNTER_MACHINE', validityMonths: 12, description: 'Annual re-verification', statutoryReference: DEMO_CITATION },
  { category: 'BEAM_SCALE', validityMonths: 12, description: 'Annual re-verification', statutoryReference: DEMO_CITATION },
  { category: 'WEIGHBRIDGE', validityMonths: 12, description: 'Annual re-verification', statutoryReference: DEMO_CITATION },
  { category: 'FUEL_DISPENSER_PETROL_DIESEL', validityMonths: 12, description: 'Annual re-verification', statutoryReference: DEMO_CITATION },
  { category: 'FUEL_DISPENSER_CNG', validityMonths: 12, description: 'Annual re-verification', statutoryReference: DEMO_CITATION },
  { category: 'FUEL_DISPENSER_LPG_LNG', validityMonths: 12, description: 'Annual re-verification', statutoryReference: DEMO_CITATION },
  { category: 'FLOW_METER', validityMonths: 12, description: 'Annual re-verification', statutoryReference: DEMO_CITATION },
  { category: 'WATER_METER', validityMonths: 24, description: 'Two-year re-verification', statutoryReference: DEMO_CITATION },
  { category: 'STANDARD_WEIGHT', validityMonths: 24, description: 'Two-year re-verification', statutoryReference: DEMO_CITATION },
  { category: 'SPHYGMOMANOMETER', validityMonths: 12, description: 'Annual re-verification', statutoryReference: DEMO_CITATION },
];

export const DEFAULT_FEE_RULES: FeeRule[] = [
  { id: 'FEE-IN-01', jurisdiction: 'NATIONAL', category: 'NON_AUTOMATIC_WEIGHING', capacityRange: 'Up to 50 kg', statutoryFee: 200, userCharge: 50, effectiveFrom: '2026-04-01', ruleCitation: DEMO_CITATION },
  { id: 'FEE-IN-02', jurisdiction: 'NATIONAL', category: 'PLATFORM_SCALE', capacityRange: '50 kg to 500 kg', statutoryFee: 500, userCharge: 100, effectiveFrom: '2026-04-01', ruleCitation: DEMO_CITATION },
  { id: 'FEE-IN-03', jurisdiction: 'NATIONAL', category: 'WEIGHBRIDGE', capacityRange: '10 t to 100 t', statutoryFee: 4000, userCharge: 500, effectiveFrom: '2026-04-01', ruleCitation: DEMO_CITATION },
  { id: 'FEE-IN-04', jurisdiction: 'NATIONAL', category: 'FUEL_DISPENSER_PETROL_DIESEL', capacityRange: 'Per nozzle', statutoryFee: 2000, userCharge: 300, effectiveFrom: '2026-04-01', ruleCitation: DEMO_CITATION },
  { id: 'FEE-IN-05', jurisdiction: 'NATIONAL', category: 'FUEL_DISPENSER_CNG', capacityRange: 'Per hose', statutoryFee: 3000, userCharge: 400, effectiveFrom: '2026-04-01', ruleCitation: DEMO_CITATION },
  { id: 'FEE-IN-06', jurisdiction: 'NATIONAL', category: 'WATER_METER', capacityRange: '15 mm to 50 mm', statutoryFee: 150, userCharge: 30, effectiveFrom: '2026-04-01', ruleCitation: DEMO_CITATION },
  // State overrides: show how two States can charge differently for the same instrument.
  { id: 'FEE-GJ-03', jurisdiction: 'GJ', category: 'WEIGHBRIDGE', capacityRange: '10 t to 100 t', statutoryFee: 3500, userCharge: 400, effectiveFrom: '2026-04-01', ruleCitation: `${DEMO_CITATION} (Gujarat)` },
  { id: 'FEE-DL-02', jurisdiction: 'DL', category: 'PLATFORM_SCALE', capacityRange: '50 kg to 500 kg', statutoryFee: 450, userCharge: 100, effectiveFrom: '2026-04-01', ruleCitation: `${DEMO_CITATION} (Delhi)` },
  { id: 'FEE-MH-04', jurisdiction: 'MH', category: 'FUEL_DISPENSER_PETROL_DIESEL', capacityRange: 'Per nozzle', statutoryFee: 2200, userCharge: 300, effectiveFrom: '2026-04-01', ruleCitation: `${DEMO_CITATION} (Maharashtra)` },
];

// Categories a State may route to a Government Approved Test Centre. Configurable list,
// maintained per the GATC Rules, 2013 as amended.
export const GATC_ELIGIBLE: InstrumentCategory[] = [
  'FUEL_DISPENSER_PETROL_DIESEL', 'FUEL_DISPENSER_CNG', 'FUEL_DISPENSER_LPG_LNG', 'WATER_METER', 'FLOW_METER',
  'GAS_METER', 'WEIGHBRIDGE', 'PLATFORM_SCALE', 'SPHYGMOMANOMETER', 'CLINICAL_THERMOMETER', 'STANDARD_WEIGHT',
];

export function isCategoryGatcEligible(category: InstrumentCategory): boolean {
  return GATC_ELIGIBLE.includes(category);
}

/** Categories that go to a GATC by default when the State has one (heavy / specialised test equipment). */
export function prefersGatc(category: InstrumentCategory): boolean {
  return ['FUEL_DISPENSER_CNG', 'FUEL_DISPENSER_LPG_LNG', 'WEIGHBRIDGE', 'FLOW_METER', 'GAS_METER'].includes(category);
}

/** State rule first, then the national demo default, then the first rule. */
export function calculateStatutoryFee(
  category: InstrumentCategory,
  state?: string,
  customRules?: FeeRule[],
): { statutory: number; userCharge: number; total: number; citation: string; ruleId: string; jurisdiction: string } {
  const rules = customRules && customRules.length ? customRules : DEFAULT_FEE_RULES;
  const code = state ? stateCode(state) : 'NATIONAL';
  const match =
    rules.find(r => r.category === category && r.jurisdiction === code) ||
    rules.find(r => r.category === category && r.jurisdiction === 'NATIONAL') ||
    rules.find(r => r.category === 'NON_AUTOMATIC_WEIGHING' && r.jurisdiction === 'NATIONAL') ||
    rules[0];
  return {
    statutory: match.statutoryFee,
    userCharge: match.userCharge,
    total: match.statutoryFee + match.userCharge,
    citation: match.ruleCitation,
    ruleId: match.id,
    jurisdiction: match.jurisdiction,
  };
}

export function getValidityPeriodMonths(category: InstrumentCategory, customRules?: ValidityRule[]): number {
  const rules = customRules && customRules.length ? customRules : DEFAULT_VALIDITY_RULES;
  return rules.find(r => r.category === category)?.validityMonths ?? 12;
}

/** Quarter verification mark, e.g. 2026-09-30 -> "C-26" (A=Jan-Mar ... D=Oct-Dec). */
export function quarterMark(date: Date): string {
  return `${'ABCD'[Math.floor(date.getMonth() / 3)]}-${String(date.getFullYear()).slice(-2)}`;
}

// ---------------------------------------------------------------------------
// Quantities and Maximum Permissible Error
// ---------------------------------------------------------------------------

/** "150 kg", "100,000 kg", "500 g", "60 t" -> kilograms. Returns null when not a mass. */
export function parseMassKg(text: string | undefined): number | null {
  if (!text) return null;
  const m = text.replace(/,/g, '').match(/([\d.]+)\s*(kg|g|t|tonne|tonnes|mg)\b/i);
  if (!m) return null;
  const v = parseFloat(m[1]);
  const u = m[2].toLowerCase();
  if (u === 'g') return v / 1000;
  if (u === 'mg') return v / 1e6;
  if (u.startsWith('t')) return v * 1000;
  return v;
}

/** Verification scale interval e from strings like "e = 10 kg, d = 5 kg" or "e=20g". */
export function parseScaleIntervalKg(text: string | undefined): number | null {
  if (!text) return null;
  const e = text.match(/e\s*=\s*([\d.,]+\s*(?:kg|g|mg|t))/i);
  return parseMassKg(e ? e[1] : text);
}

const R76_BANDS: Record<string, [number, number][]> = {
  // [upper limit of load in multiples of e, MPE in e] for initial verification, OIML R 76-1 Table 6
  CLASS_I: [[50000, 0.5], [200000, 1], [Infinity, 1.5]],
  CLASS_II: [[5000, 0.5], [20000, 1], [Infinity, 1.5]],
  CLASS_III: [[500, 0.5], [2000, 1], [Infinity, 1.5]],
  CLASS_IIII: [[50, 0.5], [200, 1], [Infinity, 1.5]],
};

/** MPE for a non-automatic weighing instrument at a given load (kg), per OIML R 76-1. */
export function weighingMpeKg(loadKg: number, eKg: number, cls: AccuracyClass): number {
  const bands = R76_BANDS[cls] || R76_BANDS.CLASS_III;
  const n = loadKg / eKg;
  const band = bands.find(([upper]) => n <= upper)!;
  return band[1] * eKg;
}

/** Fuel dispensers: OIML R 117-1 accuracy class 0.5, i.e. 0.5 % of the delivered volume. */
export const dispenserMpeLitres = (volumeL: number) => volumeL * 0.005;

const isWeighing = (c: InstrumentCategory) =>
  ['NON_AUTOMATIC_WEIGHING', 'PLATFORM_SCALE', 'COUNTER_MACHINE', 'BEAM_SCALE', 'WEIGHBRIDGE', 'AUTOMATIC_WEIGHING'].includes(c);
const isDispenser = (c: InstrumentCategory) => c.startsWith('FUEL_DISPENSER');

function fmt(value: number, unit: string): string {
  const decimals = unit === 'kg' && value < 1000 ? (value < 10 ? 3 : 2) : unit === 'L' ? 3 : 0;
  return `${value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${unit}`;
}

function niceRound(v: number): number {
  if (v <= 0) return 0;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.round(v / p * 2) / 2 * p;
}

function row(id: string, testName: string, nominal: number, unit: string, mpe: number, rule: string): TestReadingRow {
  return {
    id, testName, nominal, unit, mpe, mpeRule: rule,
    standardValue: fmt(nominal, unit),
    permissibleTolerance: `± ${fmt(mpe, unit)}`,
    observedValue: '',
    error: '',
    result: 'PENDING',
  };
}

/** Builds the test plan for an instrument, sized to its real capacity and class. */
export function buildTestPlan(inst: Pick<Instrument, 'category' | 'capacity' | 'scaleInterval' | 'accuracyClass'>): TestReadingRow[] {
  if (isDispenser(inst.category)) {
    const r = 'OIML R 117-1 class 0.5 (±0.5 %)';
    return [
      row('tr-1', 'Minimum flow rate delivery', 5, 'L', dispenserMpeLitres(5), r),
      row('tr-2', 'Maximum flow rate delivery', 20, 'L', dispenserMpeLitres(20), r),
      row('tr-3', 'Repeatability run (maximum flow)', 20, 'L', dispenserMpeLitres(20), r),
    ];
  }

  if (isWeighing(inst.category)) {
    const max = parseMassKg(inst.capacity) ?? 50;
    const e = parseScaleIntervalKg(inst.scaleInterval) ?? niceRound(max / 3000);
    const cls = inst.accuracyClass === 'NOT_APPLICABLE' || inst.accuracyClass === 'SPECIAL' ? 'CLASS_III' : inst.accuracyClass;
    const r = `OIML R 76-1, ${cls.replace('CLASS_', 'Class ')}, e = ${fmt(e, 'kg')}`;
    const points: [string, number][] = [
      ['Zero load', 0],
      ['25 % of Max', niceRound(max * 0.25)],
      ['50 % of Max', niceRound(max * 0.5)],
      ['Max capacity', max],
      ['Eccentricity, corner load (1/3 Max)', niceRound(max / 3)],
    ];
    return points.map(([name, load], i) => row(`tr-${i + 1}`, name, load, 'kg', Math.max(weighingMpeKg(load, e, cls), 0.5 * e), r));
  }

  // Other meters: percentage-of-reading check against a reference standard.
  const r = 'Reference standard, ±2 % of reading (configurable per instrument type)';
  return [
    row('tr-1', 'Low range check', 10, 'units', 0.2, r),
    row('tr-2', 'Mid range check', 50, 'units', 1, r),
    row('tr-3', 'High range check', 100, 'units', 2, r),
  ];
}

/** Applies an observed reading: computes error and PASS / FAIL against the MPE. */
export function evaluateReading(r: TestReadingRow, observedText: string): TestReadingRow {
  const cleaned = observedText.replace(/,/g, '').trim();
  const observed = cleaned === '' ? NaN : parseFloat(cleaned);
  if (Number.isNaN(observed) || r.nominal === undefined || r.mpe === undefined) {
    return { ...r, observedValue: observedText, error: '', result: 'PENDING' };
  }
  const err = observed - r.nominal;
  const sign = err > 0 ? '+' : err < 0 ? '−' : '';
  return {
    ...r,
    observedValue: observedText,
    error: `${sign}${fmt(Math.abs(err), r.unit || '')}`,
    result: Math.abs(err) <= r.mpe + 1e-9 ? 'PASS' : 'FAIL',
  };
}

export type Verdict = 'PASS' | 'ADJUSTMENT_REQUIRED' | 'FAIL' | 'INCOMPLETE';

/** The only way to get PASS is a complete checklist and every reading within MPE. */
export function recommendVerdict(checklist: InspectionChecklistItem[], readings: TestReadingRow[]): { verdict: Verdict; reasons: string[] } {
  const reasons: string[] = [];
  const unchecked = checklist.filter(c => c.status === 'NOT_CHECKED').length;
  const pending = readings.filter(r => r.result === 'PENDING').length;
  if (unchecked) reasons.push(`${unchecked} checklist item(s) not checked`);
  if (pending) reasons.push(`${pending} reading(s) not entered`);
  if (unchecked || pending) return { verdict: 'INCOMPLETE', reasons };

  const failedChecks = checklist.filter(c => c.status === 'FAIL');
  const adjustChecks = checklist.filter(c => c.status === 'ADJUSTMENT_REQUIRED');
  const failedReadings = readings.filter(r => r.result === 'FAIL');
  if (failedChecks.length) return { verdict: 'FAIL', reasons: failedChecks.map(c => `Failed: ${c.label}`) };
  if (failedReadings.length || adjustChecks.length) {
    return {
      verdict: 'ADJUSTMENT_REQUIRED',
      reasons: [...failedReadings.map(r => `${r.testName}: error ${r.error} exceeds MPE ${r.permissibleTolerance}`), ...adjustChecks.map(c => `Needs adjustment: ${c.label}`)],
    };
  }
  return { verdict: 'PASS', reasons: ['All checks passed and every reading is within MPE'] };
}

/** Demo helper: plausible in-tolerance readings (clearly labelled in the UI). */
export function sampleObservedValue(r: TestReadingRow, seed = Math.random()): string {
  if (r.nominal === undefined || r.mpe === undefined) return '';
  const offset = (seed - 0.5) * r.mpe; // within ±0.5 MPE
  const v = r.nominal + offset;
  const decimals = r.unit === 'L' ? 3 : r.unit === 'kg' && r.nominal < 1000 ? 3 : 0;
  return (r.nominal === 0 ? 0 : v).toFixed(decimals);
}

// ---------------------------------------------------------------------------
// Checklists (start unchecked; the officer must mark every item)
// ---------------------------------------------------------------------------
const item = (id: string, label: string, category: InspectionChecklistItem['category']): InspectionChecklistItem =>
  ({ id, label, category, status: 'NOT_CHECKED' });

export function generateDynamicChecklist(category: InstrumentCategory): InspectionChecklistItem[] {
  const common = [
    item('chk-vis-1', 'Model approval number on nameplate matches the application', 'VISUAL'),
    item('chk-vis-2', 'Manufacturer, serial number and Max capacity clearly marked', 'VISUAL'),
    item('chk-vis-3', 'Seal points and casing intact, no sign of tampering', 'SECURITY'),
  ];
  if (isDispenser(category)) {
    return [
      ...common,
      item('chk-fuel-1', 'Nozzle cut-off and totaliser working', 'METROLOGICAL'),
      item('chk-fuel-2', 'Pulser / calibration seal intact', 'SECURITY'),
      item('chk-fuel-3', 'Price computation matches volume delivered', 'METROLOGICAL'),
    ];
  }
  if (category === 'WEIGHBRIDGE') {
    return [
      ...common,
      item('chk-env-1', 'Instrument level (bubble centred)', 'ENVIRONMENTAL'),
      item('chk-wb-1', 'Platform clearance, approach ramps and pit drainage clear', 'ENVIRONMENTAL'),
      item('chk-wb-2', 'Indicator and printer show the same weight', 'METROLOGICAL'),
    ];
  }
  return [
    ...common,
    item('chk-env-1', 'Instrument level (bubble centred)', 'ENVIRONMENTAL'),
    item('chk-met-1', 'Zero-setting and tare return to zero', 'METROLOGICAL'),
    item('chk-met-2', 'Display readable, no missing segments', 'VISUAL'),
  ];
}

/** Back-compat name used by older code and tests. */
export function generateDefaultTestReadings(category: InstrumentCategory, capacityStr: string): TestReadingRow[] {
  return buildTestPlan({ category, capacity: capacityStr, scaleInterval: '', accuracyClass: 'CLASS_III' });
}
