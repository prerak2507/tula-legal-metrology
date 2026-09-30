# TULA (SIH 26036) — Comprehensive Prototype Feature Audit

**Document Date:** September 30, 2026  
**Problem Statement:** SIH 26036 — Development of an Online Verification System for Weighing and Measuring Instruments  
**Department:** Ministry of Consumer Affairs, Food & Public Distribution — Department of Consumer Affairs  

---

## 1. Executive Summary & Audit Matrix

This audit evaluates the current state of the TULA Legal Metrology prototype against the requirements of Smart India Hackathon (SIH 2026) Problem Statement 26036. The objective is to identify functional strengths, partial flows, mocked components, and gaps requiring immediate refinement to ensure an airtight, government-grade demonstration.

| Category / Component | Status | Implementation Details & Observations |
| :--- | :---: | :--- |
| **Framework & Core Architecture** | **WORKING** | React 19 + TypeScript + Vite + Tailwind CSS. Reactive subscription store in `storage.ts` with local storage persistence and memory fallback. |
| **Routing & Navigation** | **WORKING** | React Router v7 with AppShell, clean responsive sidebar, dedicated public portals (`/verify/:certificateId`), and gateway authentication (`/login`). |
| **Authentication & RBAC** | **WORKING** | Multi-role gateway (Business, LMO, GATC, Controller, Admin). Context-aware UI filtering based on active user role. |
| **Landing Page & Public Messaging** | **WORKING** | Clean hero with "One Instrument → One Digital ID → One Verified History", visual lifecycle, trust badges, and public verification CTA. Zero fake claims. |
| **Instrument Registry & Lifecycle** | **WORKING** | Full CRUD for instruments, category-based categorization, status tracking (`REGISTERED`, `UNDER_VERIFICATION`, `ACTIVE`, `EXPIRED`, `REVOKED`), detailed timeline. |
| **Verification Application Stepper** | **WORKING** | 6-step guided wizard (Instrument → Service → Documents → Location → Review → Submit). Auto-calculates fees based on rule engine. |
| **Document & Evidence Upload** | **PARTIAL** | UI drag-and-drop file upload with simulated upload progress and client-side thumbnail preview. Storage is client-side mock object URLs. |
| **Document Scrutiny (Admin/LMO)** | **WORKING** | Checklist-based scrutiny interface with Approve / Request Correction / Reject states with statutory remarks. |
| **LMO / GATC Assignment & Scheduling** | **WORKING** | Dynamic assignment to LMO or Government Approved Test Centre (GATC) based on jurisdiction and capacity, with appointment calendar slots. |
| **Field Verification Mode (Mobile)** | **WORKING** | Mobile-responsive touch-first inspection interface with dynamic test checklist, MPE (Maximum Permissible Error) tolerance validation, photo capture, and digital signature. |
| **Offline-First PWA & Sync Queue** | **PARTIAL** | Dedicated offline status simulation, `syncQueue.ts` local queue staging, and background reconciliation banner. Requires IndexedDB integration for native PWA offline service workers. |
| **Verification Decision Engine** | **WORKING** | Supports `PASS`, `FAIL`, `ADJUSTMENT_REQUIRED`, `RETEST_REQUIRED` without destroying historical attempt records. |
| **Digital Stamping & Certification** | **WORKING** | Automatic generation of Schedule IX verification certificate with official Government stamp ID (`STAMP-DL-26-XXXX`), SHA-256 integrity hash, and dynamic QR payload. |
| **Public QR Verification (`/verify/:id`)** | **WORKING** | High-trust mobile-optimized public page showing statutory consumer rights, live verification status (`VALID`, `EXPIRED`, `REVOKED`), issuing officer details, and inspection history. |
| **Public Consumer Reporting** | **WORKING** | Integrated reporting modal on `/verify/:id` generating actionable enforcement complaints routed to Controller / Admin dashboard. |
| **Rule Engine (Legal Metrology Rules)** | **WORKING** | Centralized `rulesEngine.ts` parameterizing test procedures, MPE limits, validity intervals (12 vs 24 vs 60 months), and statutory fee schedules by instrument category and state. |
| **Notification Center** | **WORKING** | In-app notification center with categorized alerts (`SUCCESS`, `WARNING`, `EXPIRY`, `SYSTEM`), unread badges, and direct workflow deep links. |
| **Admin & Controller Analytics** | **WORKING** | Recharts-powered pendency analytics, district breakdown, officer workload, and compliance trends. |
| **Demo Control Center (Fast-Forward)** | **WORKING** | Non-invasive demo toolbar allowing instantaneous simulation of application progression, fast-forwarding inspections, expiring instruments, and data resets. |
| **Cryptographic Signing (Digital PKI)** | **PLANNED** | SHA-256 integrity hash implemented client-side. Real HSM / eMudhra PKI digital signature server pipeline is planned for Pilot deployment. |
| **Government Portal Integrations** | **PLANNED** | Integration with Parivahan (for Weighbridges), GSTIN portal, and e-Kuber payment gateway planned for state pilot. |

---

## 2. Granular Feature Breakdown

### A. Core Workflow (Primary Demo Journey)
- **Status:** **WORKING & SEAMLESS**
- **Journey:** Business Registers Instrument → Applies for Verification → Scrutiny & Assignment → LMO Field Inspection (Mobile) → Pass / Fail Decision → Digital Stamping → Certificate Issued → Public Scans QR → Status Displayed → Proactive Expiry Reminder.
- **Reliability:** Fully contained in local state; zero server crashes or broken endpoints during offline demonstrations.

### B. Field Inspection Module
- **Status:** **WORKING**
- **Mobile Experience:** Optimized for 375px–430px smartphone viewports with high touch targets (48px+), clear toggle switches, and real-time tolerance indicators.
- **Evidence Handling:** Simulated camera/photo uploads with automated timestamp and GPS coordinate tagging.

### C. Public Verification Portal
- **Status:** **WORKING**
- **Mobile Readability:** Instant 3-second comprehension for consumers verifying merchant scales at markets, petrol pumps, or commercial weighbridges.
- **Consumer Protection:** Clear statutory banner informing citizens of their right to demand stamped instruments under Section 24 of the Legal Metrology Act, 2009.

### D. Areas for Continuous Polish in This Transformation
1. **Visual Density & Spacing:** Enhance contrast, typography, and card padding across dark and light surfaces. Ensure zero purple tones (strict adherence to Indian Gov Navy, Slate, Teal, and Warm Gold).
2. **Interactive Polish:** Ensure every secondary action button (e.g. "Export CSV", "Print Receipt", "Filter by Date") provides an immediate modal, feedback toast, or filtered state—**strictly NO DEAD BUTTONS**.
3. **Demo Toolbar Accessibility:** Keep the floating Demo Control Center discrete yet instantly accessible during presentations.
