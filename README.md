# TULA (तुला) — Verified Weights and Measures
### National Online Verification System for Weighing and Measuring Instruments
**Smart India Hackathon • Problem Statement ID: 26036 (Software Edition)**  
*Developed for Ministry of Consumer Affairs, Food & Public Distribution • Department of Consumer Affairs*  
*Developed by Team FriendlyFire*

---

[![SIH Problem Statement](https://img.shields.io/badge/SIH%202024%2F2026-PS%2026036-1F497D.svg?style=for-the-badge)](https://sih.gov.in)
[![Statutory Act](https://img.shields.io/badge/Statutory%20Grounding-Legal%20Metrology%20Act%2C%202009-1B7F5A.svg?style=for-the-badge)](https://consumeraffairs.nic.in)
[![React](https://img.shields.io/badge/React-19.x-0070C0.svg?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

---

## 📌 Executive Summary

**TULA** (*तुला*, the ancient Sanskrit and Hindi standard for balance and fair measure) is an enterprise e-governance platform designed to eliminate counterfeit physical lead seals, automate statutory verification workflows, and safeguard consumer trust across Indian commercial trade.

Under **Section 24 of The Legal Metrology Act, 2009**, every weighing and measuring instrument used in commercial transactions—from retail counter scales and gold precision balances to highway weighbridges and petroleum fuel dispensers—must undergo mandatory initial verification and periodic re-verification. 

TULA digitizes this entire lifecycle through a **dual-track routing engine**, **offline-ready field inspection tools**, **cryptographic SHA-256 Schedule IX certificates**, and an **open public camera QR scanner** accessible to all 1.4 billion citizens without login friction.

---

## ⚖️ Statutory Grounding

TULA is strictly grounded in Indian Metrological Law and gazetted amendments:
1. **The Legal Metrology Act, 2009**:
   - **Section 24**: Mandatory verification and stamping before commercial deployment.
   - **Section 30**: Penalties for tampering, altering, or operating with unverified measuring instruments.
   - **Section 48**: Compounding of statutory offenses and fine remittance.
2. **Legal Metrology (General) Rules, 2011**:
   - First Schedule fee tables, verification frequencies (annual vs. biennial), and Maximum Permissible Error (MPE) tolerance calculation.
   - Schedule IX format for Verification Certificates and stamping protocols.
3. **Legal Metrology (Government Approved Test Centre) Rules, 2013 & 2026 Amendments**:
   - Third-party accredited private testing labs (GATCs) authorized for testing petroleum dispensers, CNG/LPG mass flow meters, and high-capacity weighbridges.
4. **Consumer Protection Act, 2019**:
   - Right to transparency, fair measure, and instant grievance redressal.

---

## 🚀 Core Platform Features

### 1. Dual-Track Routing & Dynamic Fee Engine
- **Automated Fee Calculation**: Computes exact statutory fees based on device category, capacity bracket, class accuracy, and state user fees.
- **Dual-Track Allocation**:
  - *Track 1 (Standard/Zonal)*: Commercial scales, non-automatic weighing instruments routed to jurisdictional Legal Metrology Officers (LMOs).
  - *Track 2 (Heavy/Specialized)*: CNG/LPG dispensers, LNG cryogenic flow meters, and 100-tonne weighbridges routed to accredited GATCs under the 2026 amendments.

### 2. Inspector Mobile Field Toolkit (Offline Capable)
- Conducts on-site verification with GPS geotagging and photo evidence capture.
- Automated MPE (Maximum Permissible Error) evaluation engine against reference standard weights.
- Issues official physical stamp serials (Lead-Wire Seal, Hologram Security Sticker, Barcode).
- Generates on-site cryptographically hashed certificates.

### 3. Open Public QR Verification Scanner (Universal Citizen Access)
- **Zero Authentication Required**: Open to 100% of citizens from the home page.
- **Instant Fraud Detection**: Allows consumers at grocery shops, petrol pumps, or mandis to scan physical stickers with any smartphone camera to query the live state metrology ledger.
- **1-Click Grievance Lodging**: Reports broken seals, expired certificates, or suspected tampering directly to jurisdictional LMOs under Section 15.

### 4. 6 Distinct Stakeholder Perspectives (Gateway Architecture)
- **💼 Commercial Occupier & Trader**: Register fleet, schedule re-verification, view visiting inspector credentials, and manage compounding notices.
- **🔍 Legal Metrology Officer (LMO)**: Zonal queue, GPS mobile inspection, tolerance validation, and digital stamping.
- **🔬 Accredited GATC Test Centre**: Laboratory calibration curves, observed error tables, and Rule 2026 compliance.
- **⚖️ State Controller (IAS)**: Statewide revenue dashboards, pendency audits, and compounding approval.
- **🏛️ State Administrator**: District quotas, fee rule schedule customization, and GATC licensing.
- **🇮🇳 Central Ministry Admin**: Pan-India metrology analytics, national model approvals, and inter-state trade monitoring.

### 5. Cryptographic Security & Tamper Resistance
- Every digital certificate embeds a SHA-256 cryptographic hash calculated over device serial, model approval, seal ID, and validity window.
- QR codes embed digital signatures verifying the certificate was generated by an authorized officer token.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript (Strict Type Safety) |
| **Bundler & Tooling** | Vite 6 + Oxlint |
| **Styling & Design System** | Tailwind CSS + Lucide Icons + Curated Metrology Design Tokens |
| **Routing** | React Router v7 |
| **Data & Cryptography** | Client-Side Storage with Reactive Event Emitters, SHA-256 Hashes, Dynamic QR Generator |
| **Document Engine** | jsPDF (Schedule IX Certificate Generation) + html2canvas |
| **Data Visualization** | Recharts (Zonal Pendency, Revenue, Compliance Trends) |

---

## 💻 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `pnpm`

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/prerak2507/tula-legal-metrology.git
   cd tula-legal-metrology
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Launch the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 👥 Hackathon Team Credentials

- **Team Name**: FriendlyFire
- **Problem Statement ID**: 26036 (Software Edition)
- **Ministry**: Ministry of Consumer Affairs, Food & Public Distribution
- **Department**: Department of Consumer Affairs

---

## 📄 License & Disclaimer

Developed as a functional working prototype for evaluation during the **Smart India Hackathon**. All statutory references correspond to published Gazettes under the Legal Metrology Act, 2009. Demo data is utilized for prototype visualization and sandbox simulation.
