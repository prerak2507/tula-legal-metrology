import {
  InstrumentCategory, FeeRule, ValidityRule, InspectionChecklistItem, TestReadingRow, AccuracyClass, Instrument,
} from '../types';

// ---------------------------------------------------------------------------
// Rules are DATA. Each State loads its own fee schedule and validity periods
// (from its Legal Metrology (Enforcement) Rules) through the Rules screen. The
// defaults below are the gazetted Delhi and Gujarat schedules, each row citing
// its source; a State admin can override them on the Rules screen.
// ---------------------------------------------------------------------------

export const STATE_CODES: Record<string, string> = {
  Delhi: 'DL', Gujarat: 'GJ', Maharashtra: 'MH', Karnataka: 'KA', 'Tamil Nadu': 'TN', Rajasthan: 'RJ',
  'Uttar Pradesh': 'UP', 'West Bengal': 'WB', Telangana: 'TS', Kerala: 'KL', Punjab: 'PB', Haryana: 'HR',
};
export const stateCode = (state: string) => STATE_CODES[state] || 'IN';

// ---------------------------------------------------------------------------
// Validity: Legal Metrology (General) Rules, 2011, rule 27. Re-verification every 24 months for
// weights, measures, beam scales and counter machines, and every 12 months for other instruments.
// Confirmed by the Delhi Weights & Measures FAQ. Sources: src/config/sources.ts (GR_2011, DL_FAQ).
// ---------------------------------------------------------------------------
const R27_24 = 'Legal Metrology (General) Rules, 2011, rule 27(a): 24 months';
const R27_12 = 'Legal Metrology (General) Rules, 2011, rule 27(c): 12 months';
export const DEFAULT_VALIDITY_RULES: ValidityRule[] = [
  { category: 'NON_AUTOMATIC_WEIGHING', validityMonths: 12, description: 'Every 12 months', statutoryReference: R27_12 },
  { category: 'AUTOMATIC_WEIGHING', validityMonths: 12, description: 'Every 12 months', statutoryReference: R27_12 },
  { category: 'PLATFORM_SCALE', validityMonths: 12, description: 'Every 12 months', statutoryReference: R27_12 },
  { category: 'WEIGHBRIDGE', validityMonths: 12, description: 'Every 12 months', statutoryReference: R27_12 },
  { category: 'COUNTER_MACHINE', validityMonths: 24, description: 'Every 24 months', statutoryReference: R27_24 },
  { category: 'BEAM_SCALE', validityMonths: 24, description: 'Every 24 months', statutoryReference: R27_24 },
  { category: 'STANDARD_WEIGHT', validityMonths: 24, description: 'Every 24 months', statutoryReference: R27_24 },
  { category: 'FUEL_DISPENSER_PETROL_DIESEL', validityMonths: 12, description: 'Every 12 months', statutoryReference: R27_12 },
  { category: 'FUEL_DISPENSER_CNG', validityMonths: 12, description: 'Every 12 months', statutoryReference: R27_12 },
  { category: 'FUEL_DISPENSER_LPG_LNG', validityMonths: 12, description: 'Every 12 months', statutoryReference: R27_12 },
  { category: 'FLOW_METER', validityMonths: 12, description: 'Every 12 months', statutoryReference: R27_12 },
  { category: 'WATER_METER', validityMonths: 12, description: 'Every 12 months', statutoryReference: R27_12 },
  { category: 'GAS_METER', validityMonths: 12, description: 'Every 12 months', statutoryReference: R27_12 },
  { category: 'SPHYGMOMANOMETER', validityMonths: 12, description: 'Every 12 months', statutoryReference: R27_12 },
  { category: 'CLINICAL_THERMOMETER', validityMonths: 12, description: 'Every 12 months', statutoryReference: R27_12 },
];

// ---------------------------------------------------------------------------
// Fees: Schedule IX of the State Legal Metrology (Enforcement) Rules, 2011. Delhi and Gujarat publish
// the same Schedule IX (both follow the model rules circulated by the Centre). Rows with `upTo` are
// capacity tiers in kg (or L/min for flow meters); the first tier that covers the capacity applies.
// Sources: src/config/sources.ts (DL_ENF, GJ_FEES).
// ---------------------------------------------------------------------------
type Tier = [upTo: number, fee: number, label: string];
const T = Infinity;
const SCHEDULE_IX: { key: string; categories: InstrumentCategory[]; item: string; unit: FeeRule['unit']; tiers: Tier[]; classes?: AccuracyClass[] }[] = [
  { key: 'NAWI-I-II', categories: ['NON_AUTOMATIC_WEIGHING', 'PLATFORM_SCALE', 'WEIGHBRIDGE'], classes: ['CLASS_I', 'CLASS_II', 'SPECIAL'], item: 'item 8 (class I and II)', unit: 'kg',
    tiers: [[10, 200, 'up to 10 kg'], [50, 250, '10 kg to 50 kg'], [1000, 500, '50 kg to 1 t'], [10000, 1000, '1 t to 10 t'], [50000, 2000, '10 t to 50 t'], [T, 3000, 'above 50 t']] },
  { key: 'NAWI-III', categories: ['NON_AUTOMATIC_WEIGHING', 'PLATFORM_SCALE', 'WEIGHBRIDGE'], item: 'item 7 (electronic, class III and IIII)', unit: 'kg',
    tiers: [[20, 100, 'up to 20 kg'], [300, 200, '25 kg to 300 kg'], [1500, 250, '500 kg to 1500 kg'], [3000, 500, '2 t to 3 t'], [10000, 1000, '5 t to 10 t'], [150000, 2000, '15 t to 150 t'], [300000, 3000, '200 t to 300 t'], [T, 4000, '400 t']] },
  { key: 'AWI', categories: ['AUTOMATIC_WEIGHING'], item: 'item 9 (automatic weighing instruments)', unit: 'kg',
    tiers: [[10, 200, 'up to 10 kg'], [50, 250, '10 kg to 50 kg'], [1000, 500, '50 kg to 1 t'], [10000, 1000, '1 t to 10 t'], [50000, 2000, '10 t to 50 t'], [100000, 3000, '50 t to 100 t'], [T, 4000, 'above 100 t']] },
  { key: 'BEAM-AB', categories: ['BEAM_SCALE'], classes: ['CLASS_I', 'CLASS_II', 'SPECIAL'], item: 'item 4 (beam scales class A and B)', unit: 'kg',
    tiers: [[0.5, 60, '500 g and below'], [5, 100, '1 kg to 5 kg'], [50, 150, '10 kg to 50 kg'], [100, 300, '100 kg'], [T, 400, '200 kg']] },
  { key: 'BEAM-CD', categories: ['BEAM_SCALE'], item: 'item 5 (beam scales class C and D)', unit: 'kg',
    tiers: [[0.5, 10, '500 g and below'], [5, 15, '1 kg to 5 kg'], [50, 20, '10 kg to 50 kg'], [200, 100, '100 kg to 200 kg'], [T, 200, '300 kg to 1000 kg']] },
  { key: 'COUNTER', categories: ['COUNTER_MACHINE'], item: 'item 18 (counter machines)', unit: 'kg',
    tiers: [[10, 20, 'up to 10 kg'], [T, 50, 'above 10 kg']] },
  { key: 'PUMP', categories: ['FUEL_DISPENSER_PETROL_DIESEL'], item: 'item 10(a) (dispensing pumps)', unit: 'unit', tiers: [[T, 1000, 'each pump']] },
  { key: 'CNG', categories: ['FUEL_DISPENSER_CNG'], item: 'item 16 (CNG dispensers)', unit: 'unit', tiers: [[T, 1000, 'each unit']] },
  { key: 'LPG', categories: ['FUEL_DISPENSER_LPG_LNG'], item: 'item 17 (LPG dispensers)', unit: 'unit', tiers: [[T, 1000, 'each unit']] },
  { key: 'FLOW', categories: ['FLOW_METER'], item: 'item 11 (flow meters)', unit: 'L/min',
    tiers: [[100, 2000, 'up to 100 L/min'], [500, 3000, '100 to 500 L/min'], [T, 5000, 'above 500 L/min']] },
  { key: 'WATER', categories: ['WATER_METER'], item: 'item 14 (water meters)', unit: 'unit', tiers: [[T, 25, 'each meter']] },
  { key: 'THERMO', categories: ['CLINICAL_THERMOMETER'], item: 'item 13 (clinical thermometers)', unit: 'unit', tiers: [[T, 0.5, 'each']] },
  { key: 'WEIGHTS', categories: ['STANDARD_WEIGHT'], item: 'item 1(e) and 1(f) (weights)', unit: 'kg',
    tiers: [[0.5, 5, '500 g and below'], [1, 10, '1 kg'], [2, 15, '2 kg'], [20, 20, '5 kg to 20 kg'], [50, 25, '50 kg'], [100, 50, '100 kg'], [200, 100, '200 kg'], [500, 200, '500 kg'], [1000, 500, '1000 kg'], [2000, 1000, '2000 kg'], [T, 2000, '5000 kg']] },
];

const SCHEDULE_SOURCES: Record<string, { citation: string; url: string }> = {
  DL: { citation: 'Delhi Legal Metrology (Enforcement) Rules, 2011, Schedule IX', url: 'https://weightnmeasures.delhi.gov.in/sites/default/files/inline-files/delhi_legal_metrology_enforcement_rules_2011_english.pdf' },
  GJ: { citation: 'Gujarat Legal Metrology (Enforcement) Rules, 2011, Schedule IX', url: 'https://lmdca.gujarat.gov.in/en/fee-structure' },
};

export const DEFAULT_FEE_RULES: FeeRule[] = Object.entries(SCHEDULE_SOURCES).flatMap(([code, src]) =>
  SCHEDULE_IX.flatMap(s => s.categories.flatMap(category => s.tiers.map(([upTo, fee, label], i) => ({
    id: `FEE-${code}-${s.key}-${category}-${i + 1}`,
    jurisdiction: code,
    category,
    capacityRange: label,
    statutoryFee: fee,
    userCharge: 0,
    effectiveFrom: '2011-04-01',
    ruleCitation: `${src.citation}, ${s.item}`,
    upTo: Number.isFinite(upTo) ? upTo : undefined,
    unit: s.unit,
    accuracyClasses: s.classes,
    sourceUrl: src.url,
  })))));

// Rule 16(2): verification at the user's premises adds half the Schedule IX fee plus the officer's
// expenses (minimum Rs 100), except for instruments verified in situ because they cannot be moved.
export const IN_SITU_EXEMPT: InstrumentCategory[] = [
  'FUEL_DISPENSER_PETROL_DIESEL', 'FUEL_DISPENSER_CNG', 'FUEL_DISPENSER_LPG_LNG', 'FLOW_METER',
  'WEIGHBRIDGE', 'PLATFORM_SCALE', 'AUTOMATIC_WEIGHING',
];
export const VISIT_EXPENSES_MINIMUM = 100;

/** "150 kg" -> 150, "100,000 kg" -> 100000, "60 t" -> 60000, "500 g" -> 0.5, "45 Litres / min" -> 45. */
export function parseCapacity(capacity?: string): number | undefined {
  if (!capacity) return undefined;
  const m = capacity.replace(/,/g, '').match(/([\d.]+)\s*(mg|g|kg|t|tonnes?|tons?|l|litres?|liters?)?/i);
  if (!m) return undefined;
  const v = parseFloat(m[1]);
  const u = (m[2] || 'kg').toLowerCase();
  if (u === 'mg') return v / 1e6;
  if (u === 'g') return v / 1000;
  if (u.startsWith('t')) return v * 1000;
  return v;
}

/** Three-month periods since validity ended, a part period counting as one (rule 16(3): "for every
 *  quarter of the year or part thereof"). One day late is one quarter. */
export function quartersLate(dueDate: string, on: Date = new Date()): number {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime()) || on <= due) return 0;
  let k = 1;
  const end = (n: number) => { const d = new Date(due); d.setMonth(d.getMonth() + 3 * n); return d; };
  while (end(k) < on) k++;
  return k;
}

export interface FeeBreakdown {
  statutory: number;          // Schedule IX
  onSite: number;             // rule 16(2): half the Schedule IX fee
  visitMinimum: number;       // rule 16(2): officer's expenses, at least Rs 100
  lateFee: number;            // rule 16(3): half the fee per quarter after expiry
  lateQuarters: number;
  userCharge: number;         // onSite + visitMinimum + lateFee
  total: number;
  citation: string;
  sourceUrl?: string;
  ruleId: string;
  jurisdiction: string;
  tierLabel: string;
  listed: boolean;            // false when the instrument is not in the schedule
  inSitu: boolean;
}

/**
 * Fee for verifying one instrument: the State's Schedule IX tier for its capacity and class, plus the
 * rule 16 charges. A State without its own loaded schedule falls back to Delhi's, and says so.
 */
export function calculateStatutoryFee(
  category: InstrumentCategory,
  state?: string,
  customRules?: FeeRule[],
  opts: { capacity?: string; accuracyClass?: AccuracyClass; atPremises?: boolean; dueDate?: string; on?: Date } = {},
): FeeBreakdown {
  const rules = customRules && customRules.length ? customRules : DEFAULT_FEE_RULES;
  const code = state ? stateCode(state) : 'DL';
  const own = rules.filter(r => r.jurisdiction === code && r.category === category);
  const pool = own.length ? own : rules.filter(r => r.jurisdiction === 'DL' && r.category === category);
  const borrowed = !own.length && code !== 'DL';
  const cap = parseCapacity(opts.capacity);
  const byClass = pool.filter(r => r.accuracyClasses?.length && opts.accuracyClass && r.accuracyClasses.includes(opts.accuracyClass));
  const candidates = (byClass.length ? byClass : pool.filter(r => !r.accuracyClasses?.length)).length
    ? (byClass.length ? byClass : pool.filter(r => !r.accuracyClasses?.length))
    : pool;
  const tiers = [...candidates].sort((a, b) => (a.upTo ?? Infinity) - (b.upTo ?? Infinity));
  const override = own.find(r => r.id.endsWith('-OVR'));
  const fromSchedule = tiers.filter(r => !r.id.endsWith('-OVR'));
  const match = override
    || (cap === undefined ? fromSchedule[0] : fromSchedule.find(r => r.upTo === undefined || cap <= r.upTo) || fromSchedule[fromSchedule.length - 1]);

  const listed = !!match;
  const statutory = match ? match.statutoryFee : 500;
  const inSitu = IN_SITU_EXEMPT.includes(category);
  const atPremises = opts.atPremises !== false;
  const onSite = atPremises && !inSitu ? Math.round(statutory / 2 * 100) / 100 : 0;
  const visitMinimum = atPremises && !inSitu ? VISIT_EXPENSES_MINIMUM : 0;
  const lateQuarters = opts.dueDate ? quartersLate(opts.dueDate, opts.on) : 0;
  const lateFee = Math.round(statutory / 2 * lateQuarters * 100) / 100;
  const userCharge = onSite + visitMinimum + lateFee;
  const citation = match
    ? `${match.ruleCitation}${borrowed ? ` (${state}'s own schedule not loaded yet; Delhi's applied)` : ''}`
    : 'Not listed in Schedule IX. Demo value until the Controller fixes the fee';
  return {
    statutory, onSite, visitMinimum, lateFee, lateQuarters, userCharge, total: statutory + userCharge,
    citation, sourceUrl: match?.sourceUrl, ruleId: match?.id || 'UNLISTED', jurisdiction: match?.jurisdiction || code,
    tierLabel: match?.capacityRange || '', listed, inSitu,
  };
}

export function getValidityPeriodMonths(category: InstrumentCategory, customRules?: ValidityRule[]): number {
  const rules = customRules && customRules.length ? customRules : DEFAULT_VALIDITY_RULES;
  return rules.find(r => r.category === category)?.validityMonths ?? 12;
}

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
    const r = 'LM (General) Rules 2011, Eighth Schedule (OIML R 117-1), class 0.5: ±0.5 %';
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
    const r = `LM (General) Rules 2011, Seventh Schedule (OIML R 76-1), ${cls.replace('CLASS_', 'Class ')}, e = ${fmt(e, 'kg')}`;
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
