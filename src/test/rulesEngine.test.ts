import { describe, it, expect } from 'vitest';
import { 
  calculateStatutoryFee, 
  getValidityPeriodMonths, 
  isCategoryGatcEligible, 
  generateDynamicChecklist,
  generateDefaultTestReadings
} from '../services/rulesEngine';

describe('Legal Metrology Rules Engine', () => {
  describe('Fee Calculation Engine (First Schedule)', () => {
    it('calculates statutory fee for non-automatic weighing instruments', () => {
      const result = calculateStatutoryFee('NON_AUTOMATIC_WEIGHING');
      expect(result.statutory).toBe(200);
      expect(result.userCharge).toBe(50);
      expect(result.total).toBe(250);
      expect(result.citation).toContain('First Schedule');
    });

    it('calculates correct heavy weighbridge statutory verification fee', () => {
      const result = calculateStatutoryFee('WEIGHBRIDGE');
      expect(result.statutory).toBe(4000);
      expect(result.userCharge).toBe(500);
      expect(result.total).toBe(4500);
    });

    it('calculates clean fuel CNG dispenser fee under 2026 GATC rules', () => {
      const result = calculateStatutoryFee('FUEL_DISPENSER_CNG');
      expect(result.statutory).toBe(3000);
      expect(result.userCharge).toBe(400);
      expect(result.total).toBe(3400);
    });
  });

  describe('Validity Term Engine (Section 24 Periodic Rules)', () => {
    it('returns 12 months for standard commercial weighing instruments', () => {
      expect(getValidityPeriodMonths('NON_AUTOMATIC_WEIGHING')).toBe(12);
      expect(getValidityPeriodMonths('COUNTER_MACHINE')).toBe(12);
      expect(getValidityPeriodMonths('WEIGHBRIDGE')).toBe(12);
    });

    it('returns 24 months for bulk water meters and standard cast iron weights', () => {
      expect(getValidityPeriodMonths('WATER_METER')).toBe(24);
      expect(getValidityPeriodMonths('STANDARD_WEIGHT')).toBe(24);
    });
  });

  describe('GATC 2026 Delegation Matrix', () => {
    it('authorizes petroleum and clean gas dispensers for accredited GATC verification', () => {
      expect(isCategoryGatcEligible('FUEL_DISPENSER_PETROL_DIESEL')).toBe(true);
      expect(isCategoryGatcEligible('FUEL_DISPENSER_CNG')).toBe(true);
      expect(isCategoryGatcEligible('FUEL_DISPENSER_LPG_LNG')).toBe(true);
      expect(isCategoryGatcEligible('WATER_METER')).toBe(true);
    });

    it('restricts standard consumer thermometers and weights from GATC delegation', () => {
      expect(isCategoryGatcEligible('CLINICAL_THERMOMETER')).toBe(false);
      expect(isCategoryGatcEligible('STANDARD_WEIGHT')).toBe(false);
    });
  });

  describe('Dynamic Checklists & MPE Tolerance Generation', () => {
    it('generates fuel-specific prover and pulser security checks for dispensers', () => {
      const checklist = generateDynamicChecklist('FUEL_DISPENSER_PETROL_DIESEL');
      const hasProver = checklist.some(c => c.label.includes('Prover tank'));
      const hasPulser = checklist.some(c => c.label.includes('pulser calibration seal'));
      expect(hasProver).toBe(true);
      expect(hasPulser).toBe(true);
    });

    it('generates repeatability and eccentricity checks for scales', () => {
      const checklist = generateDynamicChecklist('NON_AUTOMATIC_WEIGHING');
      const hasEccentricity = checklist.some(c => c.label.includes('Eccentricity test'));
      const hasZero = checklist.some(c => c.label.includes('Zero-setting'));
      expect(hasEccentricity).toBe(true);
      expect(hasZero).toBe(true);
    });

    it('generates calibrated test reading steps within MPE tolerances', () => {
      const readings = generateDefaultTestReadings('NON_AUTOMATIC_WEIGHING', '50 kg');
      expect(readings.length).toBeGreaterThan(3);
      expect(readings[0].result).toBe('PASS');
    });
  });
});
