# System Architecture

**Project:** Legal Metrology Online Verification & Stamping System  
**SIH Problem ID:** 26036  
**Central Design Concept:** ONE INSTRUMENT → ONE DIGITAL IDENTITY → COMPLETE LIFECYCLE → COMPLETE VERIFICATION HISTORY → TRUSTED CERTIFICATION

---

## 1. High-Level Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        User Interfaces (Frontend)                      │
│                                                                        │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │ Business Portal │  │ LMO Field PWA    │  │ GATC Verification Hub │  │
│  └────────┬────────┘  └────────┬─────────┘  └──────────┬────────────┘  │
│           │                    │                       │               │
│  ┌────────┴────────┐  ┌────────┴─────────┐  ┌──────────┴────────────┐  │
│  │ Controller/Admin│  │ Public QR Verify │  │ Demo Control Center   │  │
│  └────────┬────────┘  └────────┬─────────┘  └──────────┬────────────┘  │
└───────────┼────────────────────┼───────────────────────┼───────────────┘
            │                    │                       │
┌───────────▼────────────────────▼───────────────────────▼───────────────┐
│                        Application & Core Services                     │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │ Workflow State Engine │  │ Assignment Engine (Jurisdiction/GATC) │  │
│  ├───────────────────────┤  ├───────────────────────────────────────┤  │
│  │ Dynamic Rule Engine   │  │ Local & Offline Sync Queue Engine     │  │
│  ├───────────────────────┤  ├───────────────────────────────────────┤  │
│  │ Fee Calculation Engine│  │ Local Cryptographic & QR Engine       │  │
│  ├───────────────────────┤  ├───────────────────────────────────────┤  │
│  │ Validity & Expiry Svc │  │ Audit Trail & Security Module         │  │
│  └───────────────────────┘  └───────────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                        Data Layer & Dual Persistence                   │
│                                                                        │
│  ┌─────────────────────────────────┐ ┌───────────────────────────────┐ │
│  │ Supabase PostgreSQL DB          │ │ In-Memory / LocalStorage      │ │
│  │ - Row Level Security (RLS)      │ │ Offline Cache & Fallback      │ │
│  │ - Supabase Auth & Storage       │ │ Seeded Real Datasets          │ │
│  └─────────────────────────────────┘ └───────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Pillars

### 2.1 One Instrument → One Digital Identity (UID)
Each instrument is assigned a canonical identifier upon registration (e.g. `LM-DL-2026-001290`). This UID persists across:
- Transfer of ownership or re-location
- Periodic re-verification cycles
- Repair / calibration / re-stamping
- Enforcement citations and inspections
- Certificate issuances (with incremental revision tracking)

### 2.2 Dynamic Rule Engine
Instead of hard-coded values, the system evaluates:
- **`Rule`**: Configurable by state, instrument category, accuracy class, capacity, and validity duration.
- **`FeeRule`**: Dynamically computes statutory verification and stamping fees based on capacity, category, and service type (First Schedule compliance).
- **`ChecklistRule`**: Renders tailored metrological checklists (Visual Inspection, Zero Setting, Repeatability, Eccentricity, MPE Tolerances).

### 2.3 Field Mode & Offline Resilience
The mobile field verification interface allows Legal Metrology Officers to:
- Access their assigned daily inspection queue even in low/no connectivity areas.
- Record test readings, capture inspection photographs, and sign off.
- Automatically queue submissions with status `PENDING_SYNC` and reconcile seamlessly when online.

### 2.4 Cryptographic Integrity & Trusted Verification
- Every issued certificate computes a canonical SHA-256 hash incorporating the certificate number, instrument UID, owner identity, issuing officer/GATC, stamping seal ID, and validity timestamp.
- A scannable QR code embeds a tamper-evident public verification link (`/verify/{certificateId}`).
- The public portal validates authenticity, active status, validity window, and issuing authority without disclosing sensitive commercial information.
