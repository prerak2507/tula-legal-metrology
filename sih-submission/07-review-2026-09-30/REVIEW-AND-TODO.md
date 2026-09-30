# TULA review and to-do (30 Sep 2026)

Tested live at https://tula-legal-metrology.vercel.app, read the code in `D:\SIH`, and probed Supabase and Gemini with the keys in `.env`.

Deck: `TULA_SIH2026_FriendlyFire_v3.pptx` / `.pdf` in this folder (6 slides, official SIH template, pointer headings kept word for word).

## 1. What I tested end to end

Business applies for a 100 t weighbridge → fee auto-calculated (₹250 → ₹4,500) → simulated payment → Gujarat State Admin runs scrutiny and assigns to GATC → schedules a slot → GATC runs the field inspection → certificate `GJ/LM/2026/00006` issued → found on public verify.

The flow completes. Unit tests: 18/18 pass. `tsc -b` is clean. No console errors on the main flow.

## 2. Bugs found (fix before the demo)

| # | Severity | What happens | Fix |
|---|---|---|---|
| 1 | Critical | Any direct link or refresh (`/verify/...`, `/dashboard`) returns Vercel's **404 NOT_FOUND**. Every printed QR code lands on this. | Add `vercel.json`: `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}` |
| 2 | Critical | Landing page "Open Full Public Verification Page" goes to the in-app 404. Certificate numbers contain `/` (`DL/LM/2026/08912`) and aren't encoded. | Use `encodeURIComponent(...)` in `LandingPage.tsx:673`, `CertificatesList.tsx:202`, `InstrumentDetail.tsx:293` (`crypto.ts` already does it) |
| 3 | Critical | Data lives only in `localStorage`. A judge scanning the QR on their own phone won't find any certificate made during the demo. | Apply the Supabase migration and write/read through Supabase (see section 4) |
| 4 | High | "Gemini AI Scrutiny" returns a hardcoded **APPROVE (92% confidence)** when Gemini fails or isn't configured, still labelled as Gemini. Live has no key, so every judge sees the fake result. | On failure show "AI unavailable, continue manual scrutiny". Never invent a recommendation (`gemini.ts` catch block) |
| 5 | High | Certificate issued with **all MPE readings left blank**. Checklist comes pre-filled 7/7 Pass, and photos are pre-attached. | Start the checklist empty, make every reading required, compute pass/fail from reading vs MPE |
| 6 | High | Business user's "new application" dropdown lists **all 13 instruments** from every state, not just their own 3. They can apply against someone else's weighbridge, and the certificate then goes to the real owner. | Filter `storage.getInstruments()` by `ownerId` in `ApplicationNew.tsx:23` |
| 7 | High | Mobile: at phone width the sidebar never collapses and takes about two thirds of the screen. Dashboard text wraps one word per line. The pitch says "mobile field app". | Hide the sidebar under `md`, use a hamburger / bottom nav |
| 8 | Medium | "Assignment engine" always picks the first LMO in the list (Delhi officer for an Ahmedabad job). | Match on `district` + category (GATC-eligible → GATC) |
| 9 | Medium | Field GPS shows Delhi coordinates marked **GEO-VERIFIED** for an Ahmedabad site (hardcoded fallback). | Label the fallback "location not captured", don't mark it verified |
| 10 | Medium | Documents show **VERIFIED** to the business the moment they submit, before scrutiny. | Show "Submitted" until an officer passes them |
| 11 | Medium | AI chat on live shows "check VITE_GEMINI_API_KEY" to the user. | Friendly message, or hide the button when AI is off |
| 12 | Low | Seal mark "A-26 (Quarter 1, 2026)" on a 30 Sep issue. "Full Working Load Test" uses 50 t on a 100 t bridge. "Mundra Port Road, Ahmedabad" (Mundra is in Kutch). | Derive the quarter from the date, fix the seed data |
| 13 | Low | Public verify only displays the stored hash. It never recomputes it, so tampering isn't detected. | Recompute on verify. For the pilot, verify an Ed25519 signature |

## 3. Claims in the old deck (v2) that don't match the code

- "Zustand + LocalForage / IndexedDB": neither is in `package.json`. State is `localStorage`.
- "SHA-256 + signing", "signed QR": there's no signing key. It's a plain hash anyone can recompute.
- "Supabase Auth + RBAC", "RLS": the migration isn't applied (every table returns `PGRST205`). Login is demo buttons.
- "offline PWA": no service worker or manifest.
- Gemini is wired into the app but **missing from the tech slide**.
- Landing page says "No mock buttons or placeholder text" while payment, e-Pramaan SSO and uploads are simulated. Remove that line.
- "GATC Rules 2026", "23 specialized categories", "Section 15 grievances": find the gazette citation or remove them. A judge from DoCA will check.

v3 fixes the deck side: it marks each item as working, partial, or pilot. Fix bugs 1–7 and it will match what the judges see.

## 4. How Supabase and Gemini work in this problem statement

Supabase is the backend (the PS asks for "centralized databases" and "role-based secure login"):

- **Postgres**: instruments, applications, inspections, certificates, enforcement cases, audit log. The schema is already in `supabase/migrations/`.
- **Auth**: phone OTP for traders, officer accounts with `role` + `state` + `district` claims (e-Pramaan SSO later).
- **Row-Level Security**: a trader sees only their instruments, an LMO sees their district, a Controller sees their state. This replaces the client-side filtering that caused bug 6.
- **Storage**: inspection photos, uploaded documents, certificate PDFs.
- **Edge Functions**: `sign-certificate` (Ed25519 private key stays on the server), `gemini-proxy` (Gemini key stays on the server).
- **pg_cron**: a daily job finds certificates expiring in 30/15/7 days and queues reminders. This is the PS's "automated alerts".
- **Realtime**: Controller dashboards update live.
- **Public verify**: an RPC that returns only public fields for a certificate ID, callable without login.

Gemini is an assistant, not a decision maker. Where it fits:

1. **Document scrutiny**: reads the uploaded model approval certificate and invoice, returns JSON (model approval no., serial, capacity, class). The rule engine compares it with the form and flags mismatches. The officer accepts or rejects each flag.
2. **Nameplate photo → specs**: the field officer photographs the nameplate, Gemini fills manufacturer, model, serial, capacity. This covers the PS's "entry of instrument specifications".
3. **Help chat** in Hindi / Gujarati / English for traders and citizens, grounded on the Act and Rules text.
4. **Complaint triage**: classifies a citizen report (broken seal, expired, short weight) and routes it to the district LMO.
5. **Pendency summaries**: SQL computes the numbers. Gemini only writes the plain-language summary for the Controller.

Guardrails to state on stage: Gemini never computes fees, MPE or pass/fail. Output uses a fixed JSON schema. Every AI output is audit-logged with the model version. If AI is down, manual scrutiny continues.

## 5. Keys: test results

- **Supabase**: the URL and publishable key connect, but **no tables exist**. Run the migration: `supabase db push`, or paste `supabase/migrations/20260101000000_legal_metrology_schema.sql` then `supabase/seed.sql` into the SQL editor. Add RLS policies, since the migration has none.
- **Gemini**: the key works. `gemini-3.5-flash`, `gemini-3.8-flash`, `gemini-3.1-flash-lite` and `gemini-flash-latest` answer. `gemini-2.5-pro` in the fallback list returns 404 ("no longer available to new users"), so remove it.
- **Security**: `.env` is git-ignored (good). But anything prefixed `VITE_` is baked into the public JS bundle. If you add `VITE_GEMINI_API_KEY` to Vercel, anyone can copy the key from DevTools. Move the Gemini call into a Supabase Edge Function and keep the key as a function secret. The live bundle currently contains neither key, which is why AI and cloud are off in production.

## 6. To-do list, in order

**Before submitting the PPT**
- [ ] Fill Team ID on slide 1
- [ ] Confirm the GitHub repo is public if you want to cite it (it isn't on the slide yet)
- [ ] Export to PDF (portal accepts PDF only). A PDF is already in this folder.

**Before the demo (1–2 days)**
- [ ] Bugs 1, 2, 4, 6 (small code changes)
- [ ] Bug 5: empty checklist, readings required, auto verdict from MPE
- [ ] Bug 7: mobile sidebar
- [ ] Remove "No mock buttons" and any unsourced legal claims from the landing page

**Pilot build (what the deck promises)**
- [ ] Apply the Supabase migration, add RLS policies, move reads/writes from localStorage to Supabase
- [ ] Supabase Auth with roles and districts
- [ ] Edge Function `gemini-proxy`, then remove `VITE_GEMINI_API_KEY` from the client
- [ ] Edge Function `sign-certificate` (Ed25519) + verify recomputes and checks the signature
- [ ] pg_cron expiry job → notifications table (SMS/email later)
- [ ] Real uploads to Supabase Storage + Gemini extraction
- [ ] Service worker + manifest (vite-plugin-pwa) for an installable offline field app
- [ ] District-aware assignment
