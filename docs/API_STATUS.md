# TULA (SIH 26036) — API & Integration Architecture Matrix

**Project:** TULA — Unified Legal Metrology Platform  
**SIH Problem Statement:** 26036  

---

## 1. External & Backend Integrations Status

| Service / API | Functional Purpose | Required for Demo? | Free Tier / FOSS? | Current Prototype Status | Fallback Mechanism | Environment Variable |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **Local Storage Engine** | In-browser reactive database | **YES** | YES | **WORKING** | Active default store in `storage.ts` | None (Client storage) |
| **Supabase PostgreSQL** | Cloud Multi-Tenant DB + RLS | NO | YES | **ARCHITECTURALLY READY** | Gracefully falls back to local storage engine | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| **Web Geolocation API** | Inspector location lock | NO | YES (Browser) | **WORKING** | Hardcoded zonal station reference (`28.52° N, 77.27° E`) | Standard HTML5 Geolocation |
| **Device Media Stream (Camera)** | Real-time QR optical scan | NO | YES (Browser) | **WORKING** | File upload picker + instant preset test buttons | Standard HTML5 `getUserMedia` |
| **Client-Side Cryptography** | SHA-256 integrity digest | **YES** | YES (Web Crypto) | **WORKING** | Synchronous fallback hash | Standard `window.crypto.subtle` |
| **e-Mudhra / NIC PKI** | Legally binding DSC token | NO | NO (Commercial) | **PLANNED FOR PILOT** | Client-side SHA-256 anti-tamper digest | `VITE_PKI_SERVICE_URL` |
| **Bharat BillPay / e-Kuber** | Treasury Fee Collection | NO | NO (Govt) | **PLANNED FOR PILOT** | Instant simulated payment confirmation | `VITE_PAYMENT_GATEWAY_KEY` |
| **Parivahan API** | Weighbridge vehicle axle sync | NO | NO (MoRTH) | **PLANNED FOR PILOT** | Manual vehicle registration number entry | `VITE_PARIVAHAN_API_KEY` |
| **Twilio / NIC SMS Gateway** | Expiry SMS notices to traders | NO | YES (Twilio) | **PLANNED FOR PILOT** | Rich in-app notification center | `VITE_SMS_API_KEY` |

---

## 2. API Endpoints (Target Cloud REST Architecture)

When deployed with Supabase / PostgREST in Phase 2, the client interacts with the following schema routes:

- `POST /rest/v1/instruments` — Instrument registration & metadata
- `GET /rest/v1/instruments?id=eq.{id}` — Retrieve instrument profile & lifecycle events
- `POST /rest/v1/applications` — File verification application with document links
- `PATCH /rest/v1/applications?id=eq.{id}` — Update scrutiny status, LMO assignment, and schedule
- `POST /rest/v1/inspections` — Submit field inspection checklist & MPE readings
- `POST /rest/v1/certificates` — Issue tamper-evident Schedule IX certificate
- `GET /rest/v1/certificates?id=eq.{id}` — Public verification endpoint (unauthenticated)
- `POST /rest/v1/enforcement_cases` — File consumer grievance or tamper report
- `GET /rest/v1/audit_logs` — Immutable audit trail of administrative activities
