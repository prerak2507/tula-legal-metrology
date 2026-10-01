// Compounding fees (section 48, Legal Metrology Act, 2009) from Schedule XI of the State Enforcement
// Rules. Delhi: Delhi Legal Metrology (Enforcement) Rules, 2011, Schedule XI, with the Delhi amendment
// of 28 Jan 2026 grading section 8(3) by type of business. Source: src/config/sources.ts (DL_ENF).
import { EnforcementCase } from '../types';

export interface CompoundingFee { amount: number; item: string; section: string }
type Offence = EnforcementCase['offenseCategory'];

const DELHI: Partial<Record<Offence, CompoundingFee>> = {
  // Item 11: S. 24, use of unverified weight or measure (penal section 33).
  UNVERIFIED_USE: { amount: 5000, item: 'Schedule XI, item 11', section: 'Section 24 read with section 33' },
  // A broken seal or an error beyond limits means the stamp no longer covers the instrument: same item.
  TAMPERED_SEAL: { amount: 5000, item: 'Schedule XI, item 11', section: 'Section 24 read with section 33' },
  EXCEEDED_MPE_ERROR: { amount: 5000, item: 'Schedule XI, item 11', section: 'Section 24 read with section 33' },
  // Rule 22: certificate of verification to be displayed. Item 16: S. 53(3), contravention of any rule.
  NON_DISPLAY_OF_CERTIFICATE: { amount: 500, item: 'Schedule XI, item 16', section: 'Section 53(3); Delhi Enforcement Rules, rule 22' },
};

/** Fee from the State's Schedule XI, or null when that State's schedule is not loaded or the offence is not listed. */
export function compoundingFee(state: string, offence: Offence): CompoundingFee | null {
  if (state === 'Delhi') return DELHI[offence] ?? null;
  return null;
}

export const OFFENCE_LABELS: Record<Offence, string> = {
  UNVERIFIED_USE: 'Unverified instrument used for trade (section 24)',
  TAMPERED_SEAL: 'Stamp or seal broken or tampered',
  EXCEEDED_MPE_ERROR: 'Error beyond the permitted limit',
  UNAPPROVED_MODEL: 'Model not approved (section 22)',
  NON_DISPLAY_OF_CERTIFICATE: 'Certificate of verification not displayed (rule 22)',
};
