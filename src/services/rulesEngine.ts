import { InstrumentCategory, FeeRule, ValidityRule, InspectionChecklistItem, TestReadingRow } from '../types';

export const DEFAULT_VALIDITY_RULES: ValidityRule[] = [
  {
    category: 'NON_AUTOMATIC_WEIGHING',
    validityMonths: 12,
    description: '1 Year periodic verification under General Rules 2011',
    statutoryReference: 'Rule 24, Legal Metrology (General) Rules, 2011',
  },
  {
    category: 'AUTOMATIC_WEIGHING',
    validityMonths: 12,
    description: '1 Year periodic verification for automatic weighers',
    statutoryReference: 'Rule 24, Legal Metrology (General) Rules, 2011',
  },
  {
    category: 'WEIGHBRIDGE',
    validityMonths: 12,
    description: 'Annual verification required for heavy road/rail weighbridges',
    statutoryReference: 'Schedule VII, Legal Metrology (General) Rules, 2011',
  },
  {
    category: 'FUEL_DISPENSER_PETROL_DIESEL',
    validityMonths: 12,
    description: 'Annual re-verification for retail petroleum dispensing units',
    statutoryReference: 'Schedule VIII, General Rules & GATC Rules 2026',
  },
  {
    category: 'FUEL_DISPENSER_CNG',
    validityMonths: 12,
    description: 'Annual verification for compressed natural gas dispensers',
    statutoryReference: 'GATC Amendment Rules 2026 Notification S.O. 124(E)',
  },
  {
    category: 'FUEL_DISPENSER_LPG_LNG',
    validityMonths: 12,
    description: 'Annual verification for LPG/LNG dispensing systems',
    statutoryReference: 'GATC Amendment Rules 2026 Notification S.O. 124(E)',
  },
  {
    category: 'WATER_METER',
    validityMonths: 24,
    description: '2 Years periodic verification for residential and bulk flow water meters',
    statutoryReference: 'Schedule VI, Legal Metrology (General) Rules, 2011',
  },
  {
    category: 'FLOW_METER',
    validityMonths: 12,
    description: 'Annual industrial mass/volumetric flow meter verification',
    statutoryReference: 'Schedule VI, General Rules 2011',
  },
  {
    category: 'STANDARD_WEIGHT',
    validityMonths: 24,
    description: '2 Years periodic verification for cast iron and brass weights',
    statutoryReference: 'First Schedule, General Rules 2011',
  },
  {
    category: 'SPHYGMOMANOMETER',
    validityMonths: 12,
    description: 'Annual clinical blood pressure instrument verification',
    statutoryReference: 'Schedule X, General Rules 2011',
  },
  {
    category: 'COUNTER_MACHINE',
    validityMonths: 12,
    description: '1 Year periodic verification for commercial counter scales',
    statutoryReference: 'First Schedule, General Rules 2011',
  },
  {
    category: 'PLATFORM_SCALE',
    validityMonths: 12,
    description: '1 Year periodic verification for platform scales',
    statutoryReference: 'First Schedule, General Rules 2011',
  },
];

export const DEFAULT_FEE_RULES: FeeRule[] = [
  {
    id: 'FEE-01',
    jurisdiction: 'NATIONAL',
    category: 'NON_AUTOMATIC_WEIGHING',
    capacityRange: 'Up to 50 kg',
    statutoryFee: 200,
    userCharge: 50,
    effectiveFrom: '2024-04-01',
    ruleCitation: 'First Schedule, Legal Metrology (General) Rules, 2011',
  },
  {
    id: 'FEE-02',
    jurisdiction: 'NATIONAL',
    category: 'PLATFORM_SCALE',
    capacityRange: '50 kg to 500 kg',
    statutoryFee: 500,
    userCharge: 100,
    effectiveFrom: '2024-04-01',
    ruleCitation: 'First Schedule, Legal Metrology (General) Rules, 2011',
  },
  {
    id: 'FEE-03',
    jurisdiction: 'NATIONAL',
    category: 'WEIGHBRIDGE',
    capacityRange: '10 tonnes to 100 tonnes',
    statutoryFee: 4000,
    userCharge: 500,
    effectiveFrom: '2024-04-01',
    ruleCitation: 'First Schedule, Legal Metrology (General) Rules, 2011',
  },
  {
    id: 'FEE-04',
    jurisdiction: 'NATIONAL',
    category: 'FUEL_DISPENSER_PETROL_DIESEL',
    capacityRange: 'Single/Multi Nozzle Delivery',
    statutoryFee: 2000,
    userCharge: 300,
    effectiveFrom: '2026-01-01',
    ruleCitation: 'GATC Amendment Rules 2026',
  },
  {
    id: 'FEE-05',
    jurisdiction: 'NATIONAL',
    category: 'FUEL_DISPENSER_CNG',
    capacityRange: 'Dual Hose Mass Flow',
    statutoryFee: 3000,
    userCharge: 400,
    effectiveFrom: '2026-01-01',
    ruleCitation: 'GATC Amendment Rules 2026 (Clean Fuel Dispensers)',
  },
  {
    id: 'FEE-06',
    jurisdiction: 'NATIONAL',
    category: 'WATER_METER',
    capacityRange: '15mm to 50mm line',
    statutoryFee: 150,
    userCharge: 30,
    effectiveFrom: '2024-04-01',
    ruleCitation: 'First Schedule, Legal Metrology (General) Rules, 2011',
  },
];

// Determine GATC eligibility under 2013 and 2026 Amendment Rules
export function isCategoryGatcEligible(category: InstrumentCategory): boolean {
  const eligibleCategories: InstrumentCategory[] = [
    'FUEL_DISPENSER_PETROL_DIESEL',
    'FUEL_DISPENSER_CNG',
    'FUEL_DISPENSER_LPG_LNG',
    'WATER_METER',
    'FLOW_METER',
    'GAS_METER',
    'ENERGY_METER',
    'WEIGHBRIDGE',
    'PLATFORM_SCALE',
  ];
  return eligibleCategories.includes(category);
}

// Calculate fee dynamically
export function calculateStatutoryFee(category: InstrumentCategory, customRules?: FeeRule[]): { statutory: number; userCharge: number; total: number; citation: string } {
  const rules = customRules || DEFAULT_FEE_RULES;
  const match = rules.find(r => r.category === category) || rules[0];
  return {
    statutory: match.statutoryFee,
    userCharge: match.userCharge,
    total: match.statutoryFee + match.userCharge,
    citation: match.ruleCitation,
  };
}

// Calculate validity period
export function getValidityPeriodMonths(category: InstrumentCategory, customRules?: ValidityRule[]): number {
  const rules = customRules || DEFAULT_VALIDITY_RULES;
  const match = rules.find(r => r.category === category);
  return match ? match.validityMonths : 12;
}

// Generate dynamic checklist by instrument category
export function generateDynamicChecklist(category: InstrumentCategory): InspectionChecklistItem[] {
  const commonVisual: InspectionChecklistItem[] = [
    {
      id: 'chk-vis-1',
      label: 'Model Approval Number marked legibly on nameplate and verifies against DoCA register',
      category: 'VISUAL',
      status: 'PASS',
    },
    {
      id: 'chk-vis-2',
      label: 'Manufacturer name, serial number, and maximum capacity clearly displayed',
      category: 'VISUAL',
      status: 'PASS',
    },
    {
      id: 'chk-vis-3',
      label: 'Physical seal points, wire holes, and tamper-evident casing intact and undamaged',
      category: 'SECURITY',
      status: 'PASS',
    },
    {
      id: 'chk-vis-4',
      label: 'Level indicator (spirit level / leveling bubble) perfectly centered',
      category: 'ENVIRONMENTAL',
      status: 'PASS',
    },
  ];

  if (category.includes('FUEL') || category.includes('DISPENSER')) {
    return [
      ...commonVisual,
      {
        id: 'chk-fuel-1',
        label: 'Nozzle delivery cut-off mechanism and totalizer functioning properly',
        category: 'METROLOGICAL',
        status: 'PASS',
      },
      {
        id: 'chk-fuel-2',
        label: 'Prover tank test volume conforms to ±0.3% Maximum Permissible Error (MPE)',
        category: 'METROLOGICAL',
        status: 'PASS',
      },
      {
        id: 'chk-fuel-3',
        label: 'Electronic pulser calibration seal and micro-switch tamper seal verify intact',
        category: 'SECURITY',
        status: 'PASS',
      },
    ];
  }

  if (category === 'WEIGHBRIDGE') {
    return [
      ...commonVisual,
      {
        id: 'chk-wb-1',
        label: 'Platform clearance, approach ramps, pit drainage, and deck foundations checked',
        category: 'ENVIRONMENTAL',
        status: 'PASS',
      },
      {
        id: 'chk-wb-2',
        label: 'Corner load eccentricity test performed with test weights at 1/3 capacity',
        category: 'METROLOGICAL',
        status: 'PASS',
      },
      {
        id: 'chk-wb-3',
        label: 'Repeatability and linearity tests within Maximum Permissible Error (MPE)',
        category: 'METROLOGICAL',
        status: 'PASS',
      },
    ];
  }

  // Standard Non-Automatic / Counter / Platform scales
  return [
    ...commonVisual,
    {
      id: 'chk-met-1',
      label: 'Zero-setting and tare device returns to true zero within ±0.25e',
      category: 'METROLOGICAL',
      status: 'PASS',
    },
    {
      id: 'chk-met-2',
      label: 'Eccentricity test (four corners and center) within prescribed tolerance',
      category: 'METROLOGICAL',
      status: 'PASS',
    },
    {
      id: 'chk-met-3',
      label: 'Increasing and decreasing load tests across 5 representative test points',
      category: 'METROLOGICAL',
      status: 'PASS',
    },
    {
      id: 'chk-met-4',
      label: 'Repeatability of 3 consecutive weighings at 80% maximum capacity',
      category: 'METROLOGICAL',
      status: 'PASS',
    },
  ];
}

// Generate default test readings table by category
export function generateDefaultTestReadings(category: InstrumentCategory, capacityStr: string): TestReadingRow[] {
  if (category.includes('FUEL')) {
    return [
      {
        id: 'tr-1',
        testName: 'Low Delivery Rate (5 Litres / min)',
        standardValue: '5.000 L (Standard Prover)',
        observedValue: '5.004 L',
        error: '+0.004 L (+0.08%)',
        permissibleTolerance: '±0.015 L (±0.3% MPE)',
        result: 'PASS',
      },
      {
        id: 'tr-2',
        testName: 'High Delivery Rate (Full Flow 20 L)',
        standardValue: '20.000 L (Calibrated Measure)',
        observedValue: '20.010 L',
        error: '+0.010 L (+0.05%)',
        permissibleTolerance: '±0.060 L (±0.3% MPE)',
        result: 'PASS',
      },
      {
        id: 'tr-3',
        testName: 'Repeatability Run 3',
        standardValue: '20.000 L',
        observedValue: '19.995 L',
        error: '-0.005 L (-0.025%)',
        permissibleTolerance: '±0.060 L (±0.3% MPE)',
        result: 'PASS',
      },
    ];
  }

  if (category === 'WEIGHBRIDGE') {
    return [
      {
        id: 'tr-wb-1',
        testName: 'Zero & Tare Stability Test',
        standardValue: '0 kg',
        observedValue: '0 kg',
        error: '0 kg',
        permissibleTolerance: '±5 kg',
        result: 'PASS',
      },
      {
        id: 'tr-wb-2',
        testName: 'Eccentricity Corner 1 (North-East)',
        standardValue: '10,000 kg',
        observedValue: '10,002 kg',
        error: '+2 kg',
        permissibleTolerance: '±10 kg',
        result: 'PASS',
      },
      {
        id: 'tr-wb-3',
        testName: 'Eccentricity Corner 2 (North-West)',
        standardValue: '10,000 kg',
        observedValue: '9,998 kg',
        error: '-2 kg',
        permissibleTolerance: '±10 kg',
        result: 'PASS',
      },
      {
        id: 'tr-wb-4',
        testName: 'Half Capacity Test',
        standardValue: '25,000 kg',
        observedValue: '25,005 kg',
        error: '+5 kg',
        permissibleTolerance: '±15 kg',
        result: 'PASS',
      },
      {
        id: 'tr-wb-5',
        testName: 'Full Working Load Test',
        standardValue: '50,000 kg',
        observedValue: '50,008 kg',
        error: '+8 kg',
        permissibleTolerance: '±20 kg',
        result: 'PASS',
      },
    ];
  }

  // Commercial scale
  return [
    {
      id: 'tr-1',
      testName: 'Zero Load Check',
      standardValue: '0.000 kg',
      observedValue: '0.000 kg',
      error: '0.000 kg',
      permissibleTolerance: '±0.002 kg',
      result: 'PASS',
    },
    {
      id: 'tr-2',
      testName: 'Quarter Capacity Load',
      standardValue: '10.000 kg',
      observedValue: '10.001 kg',
      error: '+0.001 kg',
      permissibleTolerance: '±0.005 kg',
      result: 'PASS',
    },
    {
      id: 'tr-3',
      testName: 'Half Capacity Load',
      standardValue: '25.000 kg',
      observedValue: '25.002 kg',
      error: '+0.002 kg',
      permissibleTolerance: '±0.005 kg',
      result: 'PASS',
    },
    {
      id: 'tr-4',
      testName: 'Maximum Capacity (Full Load)',
      standardValue: '50.000 kg',
      observedValue: '50.003 kg',
      error: '+0.003 kg',
      permissibleTolerance: '±0.010 kg',
      result: 'PASS',
    },
    {
      id: 'tr-5',
      testName: 'Eccentric Load (Corner 1)',
      standardValue: '15.000 kg',
      observedValue: '15.001 kg',
      error: '+0.001 kg',
      permissibleTolerance: '±0.005 kg',
      result: 'PASS',
    },
  ];
}
