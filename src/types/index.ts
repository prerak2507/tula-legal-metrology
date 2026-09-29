// Domain Types for Legal Metrology Online Verification System (SIH 26036)

export type UserRole = 
  | 'BUSINESS'           // Instrument User / Commercial Business Owner
  | 'LMO'                // Legal Metrology Officer / Inspector
  | 'GATC'               // Government Approved Test Centre Operator
  | 'CONTROLLER'         // Assistant / Deputy / Controller of Legal Metrology
  | 'STATE_ADMIN'        // State Department Administrator
  | 'CENTRAL_ADMIN'      // National DoCA Administrator
  | 'PUBLIC';            // Unauthenticated citizen / consumer verifying certificate

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  organization: string;
  role: UserRole;
  phone: string;
  address: string;
  state: string;
  district: string;
  designation?: string;
  badgeNumber?: string;  // For LMO
  gatcCode?: string;     // For GATC
  jurisdictionOffice?: string;
  createdAt: string;
}

export type InstrumentCategory =
  | 'NON_AUTOMATIC_WEIGHING'
  | 'AUTOMATIC_WEIGHING'
  | 'BEAM_SCALE'
  | 'COUNTER_MACHINE'
  | 'PLATFORM_SCALE'
  | 'WEIGHBRIDGE'
  | 'FUEL_DISPENSER_PETROL_DIESEL'
  | 'FUEL_DISPENSER_CNG'
  | 'FUEL_DISPENSER_LPG_LNG'
  | 'WATER_METER'
  | 'FLOW_METER'
  | 'GAS_METER'
  | 'ENERGY_METER'
  | 'SPHYGMOMANOMETER'
  | 'CLINICAL_THERMOMETER'
  | 'MOISTURE_METER'
  | 'SPEED_MEASURING_INSTRUMENT'
  | 'STANDARD_WEIGHT';

export type AccuracyClass = 'CLASS_I' | 'CLASS_II' | 'CLASS_III' | 'CLASS_IIII' | 'SPECIAL' | 'NOT_APPLICABLE';

export type InstrumentStatus =
  | 'REGISTERED'
  | 'UNDER_VERIFICATION'
  | 'ACTIVE'              // Verified and stamped, within validity period
  | 'EXPIRING_SOON'        // Within 60 / 30 / 15 days of renewal
  | 'EXPIRED'              // Validity lapsed, unlawful for commercial use
  | 'SUSPENDED'            // Seized or suspended under Section 27
  | 'REVOKED'              // Revoked due to tampering or failed spot audit
  | 'RE_VERIFICATION_PENDING';

export interface Instrument {
  id: string;                     // UID: e.g. LM-DL-2026-001290
  category: InstrumentCategory;
  categoryName: string;
  accuracyClass: AccuracyClass;
  manufacturer: string;
  model: string;
  modelApprovalNumber: string;    // Central Government Model Approval No.
  serialNumber: string;
  capacity: string;               // e.g., "50 kg", "50,000 kg", "60 L/min"
  scaleInterval: string;          // e = 1g, d = 0.5g
  purchaseDate: string;
  installationDate: string;
  ownerId: string;
  ownerName: string;
  organization: string;
  installationAddress: string;
  state: string;
  district: string;
  latitude?: number;
  longitude?: number;
  status: InstrumentStatus;
  lastVerificationDate?: string;
  nextVerificationDueDate: string;
  currentCertificateId?: string;
  currentStampId?: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export type ApplicationServiceType =
  | 'INITIAL_VERIFICATION'
  | 'PERIODIC_RE_VERIFICATION'
  | 'RE_VERIFICATION_AFTER_REPAIR'
  | 'RE_VERIFICATION_AFTER_RELOCATION';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_SCRUTINY'
  | 'CORRECTION_REQUIRED'
  | 'ACCEPTED'
  | 'FEE_PENDING'
  | 'FEE_PAID'
  | 'ASSIGNMENT_PENDING'
  | 'ASSIGNED'
  | 'SCHEDULED'
  | 'INSPECTION_PENDING'
  | 'INSPECTION_IN_PROGRESS'
  | 'RETEST_REQUIRED'
  | 'ADJUSTMENT_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'STAMPED'
  | 'CERTIFICATE_GENERATED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ApplicationDocument {
  id: string;
  title: string;
  type: 'PURCHASE_INVOICE' | 'MODEL_APPROVAL' | 'PREVIOUS_CERTIFICATE' | 'CALIBRATION_REPORT' | 'SITE_PLAN' | 'OTHER';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  fileUrl: string;
}

export interface ScrutinyCheckItem {
  id: string;
  title: string;
  description: string;
  passed: boolean | null; // null = pending
  remarks?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface Application {
  id: string;                     // e.g. APP-2026-00412
  instrumentId: string;
  applicantId: string;
  applicantName: string;
  organization: string;
  serviceType: ApplicationServiceType;
  status: ApplicationStatus;
  state: string;
  district: string;
  location: string;
  preferredDate?: string;
  assignedToType?: 'LMO' | 'GATC';
  assignedToId?: string;
  assignedToName?: string;
  assignmentReason?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  feeAmount: number;
  feeStatus: 'UNPAID' | 'PAID' | 'EXEMPT';
  paymentReference?: string;
  paidAt?: string;
  documents: ApplicationDocument[];
  scrutinyItems: ScrutinyCheckItem[];
  correctionRemarks?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestReadingRow {
  id: string;
  testName: string;             // e.g., "Zero Load", "10 kg Load", "Maximum Capacity (50 kg)", "Eccentric Corner 1"
  standardValue: string;        // e.g., "10.000 kg"
  observedValue: string;        // e.g., "10.002 kg"
  error: string;                // e.g., "+0.002 kg"
  permissibleTolerance: string; // e.g., "±0.005 kg" (MPE)
  result: 'PASS' | 'FAIL';
}

export interface InspectionChecklistItem {
  id: string;
  label: string;
  category: 'VISUAL' | 'METROLOGICAL' | 'ENVIRONMENTAL' | 'SECURITY';
  status: 'PASS' | 'FAIL' | 'ADJUSTMENT_REQUIRED' | 'NOT_APPLICABLE';
  remarks?: string;
}

export interface InspectionRecord {
  id: string;                   // e.g. INSP-2026-00814
  applicationId: string;
  instrumentId: string;
  inspectorId: string;
  inspectorName: string;
  inspectorRole: 'LMO' | 'GATC';
  inspectionDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  checklist: InspectionChecklistItem[];
  testReadings: TestReadingRow[];
  evidencePhotos: {
    id: string;
    caption: string;
    url: string;
    type: 'INSTRUMENT_FRONT' | 'NAMEPLATE_SERIAL' | 'SEAL_APPLIED' | 'TEST_SETUP' | 'READING_DISPLAY';
    timestamp: string;
  }[];
  inspectorRemarks: string;
  result: 'PASS' | 'FAIL' | 'ADJUSTMENT_REQUIRED' | 'RETEST_REQUIRED';
  adjustmentDetails?: string;
  officerSignatureConfirmation: boolean;
  syncStatus: 'SYNCED' | 'PENDING_SYNC';
  createdAt: string;
}

export interface StampingRecord {
  id: string;                   // e.g. STAMP-DL-26-0842
  instrumentId: string;
  applicationId: string;
  inspectionId: string;
  officerId: string;
  officerName: string;
  stampType: 'LEAD_WIRE_SEAL' | 'TAMPER_EVIDENT_BARCODE_SEAL' | 'HOLOGRAM_SECURITY_SEAL';
  quarterAndYear: string;       // e.g. "A-26" (Q1 2026)
  stampedAt: string;
  location: string;
  remarks: string;
}

export interface VerificationCertificate {
  id: string;                   // e.g. CERT-2026-08912
  certificateNumber: string;    // DL/LM/2026/08912
  instrumentId: string;
  applicationId: string;
  inspectionId: string;
  stampId: string;
  issuedToName: string;
  organization: string;
  address: string;
  state: string;
  district: string;
  
  // Metrological Details
  instrumentType: string;
  category: InstrumentCategory;
  manufacturer: string;
  model: string;
  modelApprovalNumber: string;
  serialNumber: string;
  capacity: string;
  scaleInterval: string;
  accuracyClass: AccuracyClass;
  
  // Verification details
  verificationDate: string;
  validUntil: string;
  validityMonths: number;
  issuingAuthority: string;     // e.g., "Office of the Controller of Legal Metrology, Government of NCT of Delhi"
  issuingOfficerName: string;
  issuingOfficerDesignation: string;
  issuingOfficerBadgeOrGATC: string;
  
  // Tamper-Evidence & Public Trust
  status: 'VALID' | 'EXPIRED' | 'REVOKED' | 'SUPERSEDED';
  revocationReason?: string;
  revokedAt?: string;
  sha256Hash: string;
  qrPayloadUrl: string;
  version: number;
  issuedAt: string;
}

export interface FeeRule {
  id: string;
  jurisdiction: string;          // 'NATIONAL' or State code e.g. 'DL', 'GJ'
  category: InstrumentCategory;
  capacityRange: string;
  statutoryFee: number;
  userCharge: number;
  effectiveFrom: string;
  ruleCitation: string;          // First Schedule, Legal Metrology (General) Rules, 2011
}

export interface ValidityRule {
  category: InstrumentCategory;
  validityMonths: number;
  description: string;
  statutoryReference: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  recipientRole: UserRole;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'EXPIRY' | 'ACTION_REQUIRED' | 'SUCCESS';
  link?: string;
  read: boolean;
  createdAt: string;
  channel: 'IN_APP' | 'SIMULATED_EMAIL' | 'SIMULATED_SMS';
}

export interface EnforcementCase {
  id: string;                   // ENF-2026-0031
  instrumentId: string;
  businessName: string;
  violatorName: string;
  location: string;
  district: string;
  state: string;
  offenseCategory: 
    | 'UNVERIFIED_USE'
    | 'TAMPERED_SEAL'
    | 'EXCEEDED_MPE_ERROR'
    | 'UNAPPROVED_MODEL'
    | 'NON_DISPLAY_OF_CERTIFICATE';
  actSection: string;           // Section 24, 30, or 36 of Legal Metrology Act, 2009
  officerId: string;
  officerName: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'SEIZED' | 'COMPOUNDED' | 'CLOSED';
  actionTaken: string;
  penaltyAmount?: number;
  evidenceNotes: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'INSTRUMENT' | 'APPLICATION' | 'INSPECTION' | 'CERTIFICATE' | 'FEE_RULE' | 'ENFORCEMENT' | 'USER';
  entityId: string;
  details: string;
  ipAddress?: string;
}
