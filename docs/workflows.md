# Workflow State Machine & Lifecycle Transitions

**Legal Metrology Online Verification System (SIH 26036)**

---

## 1. Application Lifecycle State Machine

```text
               ┌─────────────┐
               │    DRAFT    │
               └──────┬──────┘
                      │ Submit
                      ▼
               ┌─────────────┐
               │  SUBMITTED  │
               └──────┬──────┘
                      │ Scrutiny Review
                      ▼
             ┌─────────────────┐
             │ UNDER_SCRUTINY  │
             └───────┬─────────┘
        ┌────────────┴─────────────┐
        │ Correction Requested     │ Scrutiny Approved
        ▼                          ▼
┌──────────────────────┐   ┌───────────────┐
│ CORRECTION_REQUIRED  │   │   ACCEPTED    │
└──────────┬───────────┘   └───────┬───────┘
           │ Resubmit              │ Generate Demand Note
           └───────────────────────┼────────────────────────┐
                                   ▼                        │
                           ┌───────────────┐                │
                           │  FEE_PENDING  │                │
                           └───────┬───────┘                │
                                   │ Pay statutory fee      │
                                   ▼                        │
                           ┌───────────────┐                │
                           │   FEE_PAID    │                │
                           └───────┬───────┘                │
                                   │ Route & Assign         │
                                   ▼                        │
                        ┌─────────────────────┐             │
                        │ ASSIGNMENT_PENDING  │             │
                        └──────────┬──────────┘             │
                                   │ Assign to LMO/GATC     │
                                   ▼                        │
                           ┌───────────────┐                │
                           │   ASSIGNED    │                │
                           └───────┬───────┘                │
                                   │ Schedule slot          │
                                   ▼                        │
                           ┌───────────────┐                │
                           │   SCHEDULED   │                │
                           └───────┬───────┘                │
                                   │ Begin Inspection       │
                                   ▼                        │
                      ┌─────────────────────────┐           │
                      │ INSPECTION_IN_PROGRESS  │           │
                      └────────────┬────────────┘           │
      ┌────────────────────────────┼────────────────────────┤
      │                            │                        │
      ▼ (Pass)                     ▼ (Adjustment)           ▼ (Fail)
┌───────────┐             ┌─────────────────────┐   ┌───────────────┐
│ VERIFIED  │             │ ADJUSTMENT_REQUIRED │   │   REJECTED    │
└─────┬─────┘             └──────────┬──────────┘   └───────────────┘
      │ Apply Seal                   │ Recalibrate & Retest
      ▼                              ▼
┌───────────┐             ┌─────────────────────┐
│  STAMPED  │             │   RETEST_REQUIRED   │
└─────┬─────┘             └─────────────────────┘
      │ Issue Schedule IX Cert
      ▼
┌─────────────────────────┐
│  CERTIFICATE_GENERATED  │
└───────────┬─────────────┘
            │ Complete
            ▼
┌─────────────────────────┐
│        COMPLETED        │
└─────────────────────────┘
```

---

## 2. Instrument State Machine

```text
REGISTERED → UNDER_VERIFICATION → VERIFIED_AND_STAMPED → ACTIVE → EXPIRING_SOON → EXPIRED → RE_VERIFICATION_PENDING
                                        │
                                        └── (Violation) → ENFORCEMENT_SEIZED / SUSPENDED
```

- **ACTIVE:** Certificate is valid, within tolerance date.
- **EXPIRING_SOON:** Within 60 / 30 / 15 days of renewal date.
- **EXPIRED:** Validity date has elapsed without completed re-verification. Commercial use is unlawful.
- **SUSPENDED / REVOKED:** Revoked by Controller due to tampering, failed spot audit, or enforcement action.

---

## 3. Assignment Engine Deterministic Logic

Applications are assigned deterministically based on:
1. **Jurisdiction:** State & District match.
2. **Category Eligibility:** If GATC, category must be explicitly authorized under Legal Metrology (GATC) Rules, 2013/2026.
3. **Workload Balance:** Active load of available Inspectors in jurisdiction.
4. **Transparency:** System records `assignment_reason` (e.g., *"Auto-routed to GATC-West-01 based on Rule 2026 for CNG Dispenser in District Ahmedabad"*).
