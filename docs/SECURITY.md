# TULA (SIH 26036) — Security Architecture & Data Protection

**Document Version:** 1.0  
**Compliance Standard:** Information Technology Act, 2000 & Digital Personal Data Protection Act (DPDP), 2023  
**Applicability:** Smart India Hackathon 2026 Evaluation & Pilot Deployment  

---

## 1. Security Architecture Overview

The TULA platform is architected according to the "Defense-in-Depth" paradigm required for critical national public infrastructure and statutory enforcement systems.

```
┌────────────────────────────────────────────────────────┐
│                   PUBLIC ACCESS ZONE                   │
│   • QR Public Verification Portal (/verify/:id)        │
│   • No personal merchant contact data exposed          │
│   • Read-only metrological validity & certificate hash │
└──────────────────────────┬─────────────────────────────┘
                           │ TLS 1.3 / Strict CSP
┌──────────────────────────▼─────────────────────────────┐
│                 AUTHENTICATED USER ZONE                │
│   • Role-Based Access Control (RBAC) Gateway           │
│   • Distinct JWT claims for Business, LMO, GATC, Admin │
│   • Least-Privilege operational isolation               │
└──────────────────────────┬─────────────────────────────┘
                           │ PostgREST / Row-Level Security
┌──────────────────────────▼─────────────────────────────┐
│                   DATA & LEDGER ZONE                   │
│   • PostgreSQL with Multi-Tenant Row-Level Security   │
│   • SHA-256 Metrological Integrity Seals               │
│   • Immutable Chronological Audit Trail Logs           │
└────────────────────────────────────────────────────────┘
```

---

## 2. Key Security Principles Implemented

### A. Role-Based Access Control (RBAC) & Least Privilege
- **Business Owners (`BUSINESS`):** Limited to managing their own registered fleet, filing applications, paying fees, and downloading their own Schedule IX certificates.
- **Legal Metrology Officers (`LMO`):** Restricted to assigned physical inspection queues within their jurisdictional sub-division; cannot alter state-wide fee rules or reassign colleagues' jobs.
- **Government Approved Test Centres (`GATC`):** Sandboxed to testing categories authorized under GATC Rules, 2013; cannot initiate Section 30 enforcement compounding proceedings.
- **Zonal Controllers (`CONTROLLER`):** Authority over allocation, scrutiny, and Section 48 compounding settlements.
- **Central Administrators (`CENTRAL_ADMIN`):** Manages statutory rule parameters, master data, and cross-state audit logs.

### B. Public vs Private Separation (DPDP 2023 Compliance)
When a citizen scans a physical QR code affixed to a commercial scale, the public verification page (`/verify/:certificateId`) intentionally exposes **only statutory public interest data**:
- Certificate status (`VALID`, `EXPIRED`, `REVOKED`)
- Nominal Maximum Capacity and Accuracy Class
- Date of Stamping & Date of Expiry
- Issuing Department & Officer Designation
- SHA-256 Anti-Tamper Verification Seal

**Private data is never exposed publicly:** Merchant mobile numbers, GSTIN bank linkages, internal departmental scrutiny remarks, and fee transaction identifiers remain locked behind authenticated department sessions.

### C. Cryptographic Certificate Integrity (Anti-Counterfeiting)
Counterfeit certificates and falsified lead seals are a major challenge in traditional paper-based metrology:
1. Every certificate generated generates a unique **SHA-256 Metrological Hash**:
   $$\text{Hash} = \text{SHA256}(\text{CertNum} + \text{InstrumentUID} + \text{Serial} + \text{Capacity} + \text{Validity} + \text{StampID})$$
2. If an altered paper certificate is produced with forged dates, scanning the dynamic QR code will retrieve the canonical server record, immediately flagging the discrepancy.

### D. Offline Field Verification Security
For rural field verifications conducted in areas with low or zero cellular signal:
- Inspection records are stored locally with tamper-detection timestamps and GPS coordinates.
- Synced records are signed with the active inspector's authenticated credentials before being committed into the central database.
- Previous inspection logs are append-only; an inspector cannot overwrite or erase historical verification attempts.
