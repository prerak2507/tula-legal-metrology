# TULA (SIH 26036) — Prototype Status & Capability Breakdown

**Version:** 1.0.0 (SIH 2026 Evaluation Release)  
**Problem Statement:** 26036 — Online Verification System for Weighing and Measuring Instruments  
**Submission Category:** Software  
**Status Date:** September 30, 2026  

---

## 1. Feature Implementation Matrix

| Module | Sub-Feature | Implementation Status | Technical Mechanism |
| :--- | :--- | :---: | :--- |
| **Authentication & RBAC** | Multi-Role Login Gateway | **WORKING** | Single-sign-on simulated gateway (`/login`) for Business, LMO, GATC, Controller, Admin. |
| | Session Context & Switcher | **WORKING** | `RoleSwitcherDropdown` and `DemoBar` keeping track of active role state without state loss. |
| **Instrument Management** | Instrument Registry & CRUD | **WORKING** | Unique ID generation (`LM-DL-2026-XXXXXX`), category metadata, serial tracking. |
| | Digital Twin Lifecycle History | **WORKING** | Continuous timeline from registration to multiple periodic re-verifications. |
| **Application Processing** | 6-Step Guided Stepper | **WORKING** | Instrument → Service → Docs → Location → Review → Fee Submit (`/applications/new`). |
| | Statutory Document Scrutiny | **WORKING** | Checklist scrutiny with pass/correction/reject actions under Section 22/24. |
| | LMO & GATC Allocation | **WORKING** | Capacity & jurisdiction-aware assignment with appointment scheduling. |
| **Field Verification Mode** | Mobile-First Field HUD | **WORKING** | High-contrast touch UI for smartphones with geo-coordinate auto-lock. |
| | Metrological Checklist | **WORKING** | Dynamic checklist generated from `rulesEngine.ts` by instrument category. |
| | MPE Test Readings | **WORKING** | Auto-calculated error vs statutory Maximum Permissible Error tolerance. |
| | Evidence Photo Capture | **WORKING** | Multi-photo upload with automated timestamp and inspection metadata. |
| | Statutory Decisions | **WORKING** | `PASS`, `FAIL`, `ADJUSTMENT_REQUIRED`, `RETEST_REQUIRED` with complete audit trail. |
| **Certification & Stamping** | Schedule IX Certificate Engine | **WORKING** | Automated generation with official stamp ID (`STAMP-DL-26-XXXX`). |
| | Cryptographic Integrity Seal | **WORKING** | Client-side SHA-256 digest of metrological parameters for anti-tamper checking. |
| | High-Resolution Print Slip | **WORKING** | CSS print styles for field thermal printers and A4 certificate printing. |
| **Public Trust Layer** | Live QR Verification (`/verify/:id`) | **WORKING** | Instant public verification page accessible to citizens without account login. |
| | Citizen Grievance Portal | **WORKING** | "Report Broken Seal / Meter Tampering" creating official cases in Enforcement Registry. |
| | Statutory Consumer Rights HUD | **WORKING** | Informational charter citing consumer rights under Section 24 & CPA 2019. |
| **Regulatory Engine** | Configurable Metrology Rules | **WORKING** | Parameterized fees, inspection validity periods (12/24/60 mo), and MPE thresholds. |
| | Admin Rules Control UI | **WORKING** | `/admin/rules` page allowing inspection and dynamic adjustment of state parameters. |
| **Resilience & Governance** | Offline-First Sync Queue | **WORKING** | Local queue staging (`syncQueue.ts`) with background batch reconciliation. |
| | Immutable Audit Log | **WORKING** | Detailed chronological tracking of all administrative actions and inspections (`/audit`). |
| | Expiry Engine & Notifications | **WORKING** | Automated calculation of 30/15-day expiry windows with in-app notification center. |
| | Fast-Forward Demo Control Center | **WORKING** | One-click simulation modal for rapid jury evaluation and scenario testing. |
| **Backend & Cloud Services** | PostgreSQL Database | **PLANNED** | Schema designed; currently running on optimized local storage subscriber engine. |
| | Hardware Security Module (HSM) PKI | **PLANNED** | SHA-256 hash active; digital signature USB token / eMudhra API targeted for Pilot. |
| | SMS / WhatsApp Citizen Alerts | **PLANNED** | In-app toasts active; Twilio/NIC SMS gateway integration targeted for Phase 2. |
