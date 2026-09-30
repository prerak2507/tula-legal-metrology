# TULA (SIH 26036) — Master Jury & Hackathon Demonstration Flow

**Target Duration:** 4 to 6 Minutes  
**Problem Statement:** SIH 26036 (Development of an Online Verification System for Weighing and Measuring Instruments)  
**Department:** Ministry of Consumer Affairs, Food & Public Distribution  

---

## The Core Demonstration Storyboard

The presentation follows one unified, uninterrupted, real-world regulatory lifecycle of a commercial instrument under the Legal Metrology Act, 2009.

```
BUSINESS (Register Weighbridge)
   │
   ▼
ONLINE APPLICATION (6-Step Stepper & Fee Assessment)
   │
   ▼
SCRUTINY & ALLOCATION (Zonal Controller / LMO Assignment)
   │
   ▼
LMO MOBILE FIELD INSPECTION (MPE Tolerances + GPS + Photo Evidence + Digital Signature)
   │
   ▼
STATUTORY DECISION (Pass → Security Seal Applied → Schedule IX Certificate Generated)
   │
   ▼
PUBLIC QR VERIFICATION (Judge scans QR with smartphone → Instant Live Status)
   │
   ▼
EXPIRY SIMULATION & CITIZEN GRIEVANCE (Proactive alerts + Tamper complaint into Enforcement Registry)
```

---

## Step-by-Step Jury Demo Script

### Act 1: The Citizen & Business Reality (1 Minute)
1. **Open Landing Page (`/`):**
   - Point out the headline: **"One Instrument → One Digital ID → One Verified History"**.
   - Explain the core issue: In India today, over 1.4 crore commercial weights and measures rely on decentralized paper stamps, physical certificate books, and periodic manual raids.
   - Show the live stat ticker and the 5 role portals accessible via the Secure Gateway (`/login`).

2. **Login as Business Occupier:**
   - Go to `/login` and select **"Commercial Business & Trader"** (`M/s Apex Logistics & Grain Mandi`).
   - Land on the **Business Dashboard (`/dashboard`)**: Show total fleet of instruments, active certificates, upcoming renewals, and real-time compliance score.

### Act 2: Instrument Registration & 6-Step Application Stepper (1 Minute)
3. **Register / Select Instrument (`/instruments`):**
   - Open Instrument profile (`LM-DL-2026-000001` - 50 Ton Electronic Pitless Weighbridge).
   - Point out the **Complete Instrument Lifecycle Timeline**: Every physical scale has a perpetual "Digital Twin" ledger showing its registration, past stamping inspections, and current status.
4. **File Verification Application (`/applications/new`):**
   - Walk through the **6-Step Guided Stepper**:
     - *Step 1: Instrument Selection* (Pre-fills model approval & serial number).
     - *Step 2: Service Type* (Initial Stamping vs Periodic Re-verification).
     - *Step 3: Document Scrutiny Upload* (Model approval certificate & test weight calibration slip).
     - *Step 4: Geo-Location & Premises* (GPS lock of installation address).
     - *Step 5: Fee Calculation* (Dynamic statutory fee assessed via Legal Metrology Rules Engine).
     - *Step 6: Review & Submit* (Instant Application ID generated: `APP-2026-XXXXX`).

### Act 3: Regulatory Scrutiny & LMO Assignment (45 Seconds)
5. **Switch to State Controller (`/login` → Controller):**
   - Open **Applications Desk (`/applications`)**:
   - Perform statutory document scrutiny on the checklist (Model Approval validity under Section 22, Site Accessibility).
   - Assign the on-site physical verification to **Senior LMO (Shri Rajesh Sharma)** with appointment date and time slot.

### Act 4: The Hero Moment — LMO Mobile Field Mode & Inspection (1.5 Minutes)
6. **Switch to LMO (`/login` → Legal Metrology Officer):**
   - Navigate to `/field` (or `/inspections`).
   - Point out the **Mobile-First Field HUD**:
     - Touch-friendly 48px buttons designed for field conditions.
     - Live Geo-coordinates auto-tagged (`Lat/Lng ±5m accuracy`).
     - Online / Offline toggle (Demonstrating rural resilience with local `syncQueue`).
   - Run the **Dynamic Metrological Checklist**:
     - Leveling bubble, anti-tamper seal check, zero load indicator.
   - Enter **MPE (Maximum Permissible Error) Test Readings**:
     - Load testing at 10,000 kg, 25,000 kg, and 50,000 kg.
     - System automatically computes Error = Observed - Standard, verifying against statutory tolerance limits.
   - Attach **Evidence Photos** (Seal wire photo, display tare reading).
   - Select **Decision: PASS** & stamp type (`LEAD_WIRE_SEAL`).
   - Sign digital confirmation and tap **"Submit Verification & Issue Certificate"**.
   - Confetti triggers! The system instantaneously commits the inspection, generates the tamper-evident stamp, and issues the official Schedule IX Certificate.

### Act 5: The "Wow Moment" — Public QR Verification (1 Minute)
7. **Certificate View & Live QR (`/certificates/:id`):**
   - The official **Schedule IX Certificate of Verification** displays with Government of India & State Department seal, officer insignia, SHA-256 integrity hash, and dynamic QR Code.
   - **Invite the Judge:** *"Respected jury members, please point your phone's standard camera at this QR code on the screen."*
8. **Public Citizen Portal (`/verify/:certificateId`):**
   - Opening the link immediately shows the mobile-optimized citizen page:
     - **Green Banner:** `✓ LAWFULLY VERIFIED INSTRUMENT`.
     - Displays merchant name, accurate capacity, verification date, and issuing officer badge.
     - Highlights statutory consumer rights under Section 24 of the Legal Metrology Act, 2009.

### Act 6: Enforcement & Tamper Grievance Flow (30 Seconds)
9. **Citizen Lodges Grievance:**
   - Tap **"Report Broken Seal / Meter Tampering"** on the verification page.
   - Select "Broken Lead Verification Seal (Sec 30)", enter observation, and submit.
   - System registers an official **Enforcement Case ID (`ENF-2026-XXXX`)**.
10. **Controller Enforcement Desk (`/enforcement`):**
    - Show the new case appearing in real-time in the Controller's enforcement queue for site inspection and Section 48 compounding penalty notice.

---

## 3. Fast-Forward Demo Controls (For Short Jury Slots)

If jury time is limited to 2-3 minutes, use the floating **"Demo Control"** toolbar at the top right of any screen:
- **Fast-Forward:** Instantly advances any pending application to passed inspection + issued certificate.
- **Simulate Expiry:** Sets an active scale's validity to 15 days in the past, immediately triggering alert notifications and an `EXPIRED` status on the public QR scan.
- **Revoke Certificate:** Simulates an enforcement seizure; public QR scan immediately switches from green to flashing red `REVOKED`.
- **Reset to Factory Seed:** Restores all sample instruments, officers, and applications to pristine starting state in 1 second.
