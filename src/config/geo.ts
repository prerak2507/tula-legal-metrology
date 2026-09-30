import { InstrumentCategory, AccuracyClass } from '../types';

/** States that have officers configured in the prototype. A State joins by adding officers and its rules. */
export const LIVE_STATES: Record<string, string[]> = {
  Delhi: ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
  Gujarat: ['Ahmedabad', 'Amreli', 'Bhavnagar', 'Gandhinagar', 'Jamnagar', 'Kutch', 'Rajkot', 'Surat', 'Vadodara'],
};

export const CATEGORY_LABELS: Partial<Record<InstrumentCategory, string>> = {
  NON_AUTOMATIC_WEIGHING: 'Electronic weighing scale',
  COUNTER_MACHINE: 'Counter scale',
  PLATFORM_SCALE: 'Platform scale',
  BEAM_SCALE: 'Beam scale',
  WEIGHBRIDGE: 'Weighbridge',
  FUEL_DISPENSER_PETROL_DIESEL: 'Fuel dispenser (petrol / diesel)',
  FUEL_DISPENSER_CNG: 'CNG dispenser',
  FUEL_DISPENSER_LPG_LNG: 'LPG dispenser',
  WATER_METER: 'Water meter',
  FLOW_METER: 'Flow meter',
  STANDARD_WEIGHT: 'Standard weights',
};

export const ACCURACY_CLASSES: { value: AccuracyClass; label: string }[] = [
  { value: 'CLASS_I', label: 'Class I (special)' },
  { value: 'CLASS_II', label: 'Class II (high, e.g. jewellery)' },
  { value: 'CLASS_III', label: 'Class III (medium, most shop scales)' },
  { value: 'CLASS_IIII', label: 'Class IIII (ordinary)' },
  { value: 'NOT_APPLICABLE', label: 'Not applicable (meters, dispensers)' },
];
