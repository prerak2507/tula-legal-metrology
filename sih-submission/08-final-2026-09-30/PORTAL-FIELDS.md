# SIH portal fields (PS 26036, Team FriendlyFire)

Deck to upload: TULA_SIH2026_FriendlyFire_v8.pdf (v4 to v7 kept for reference; every link in it is clickable). Team ID: 182718.

## Idea Title (98 of 100 characters)

TULA: Online Verification, Signed QR Certificates and Offline Field Inspection for Legal Metrology

## Idea Description

TULA is a working web and mobile platform for the online verification, certification and lifecycle management of weighing and measuring instruments under the Legal Metrology Act, 2009. Every instrument gets one permanent Digital ID, and everything that happens to it attaches to that ID: registration, application, document scrutiny, officer assignment, field inspection, certificate, expiry reminders and enforcement.

What it does, mapped to the problem statement:
- Online registration: traders create an account and register their scales, fuel dispensers and meters. Officers, GATCs, Controllers and administrators have role-based accounts.
- Online application for verification and re-verification, with document upload and the fee taken from the State's gazetted Schedule IX (Delhi and Gujarat loaded), including the rule 16 on-site and late fees. Validity follows rule 27 of the General Rules, 2011. The instrument's model approval mark is checked against the Department of Consumer Affairs' public Model Approval register (10,050 entries, 2011 to 2026), so an unapproved or mistyped model is flagged at scrutiny.
- Scheduling and allocation: after scrutiny and fee payment, the Controller assigns an LMO by district and workload, or a GATC for heavy and specialised equipment, and books the visit.
- Digital inspection record: the officer's phone app shows a checklist and a test plan sized to the instrument. The officer types what the instrument shows; TULA computes the error against the OIML R 76 / R 117 limit. A certificate cannot be issued while any reading is out of limit, and the database enforces this, not only the app. Camera photos and GPS location are saved with the record.
- Digital certificate in the statutory form (Schedule VIII of the State Enforcement Rules) with QR and authentication: the server signs the certificate (ECDSA P-256). The QR carries the certificate details and the signature, so any phone can check it without login and even without internet, in Hindi or English. An edited or forged copy is rejected, and revoked certificates are flagged from a live revocation list.
- Validity tracking and alerts: status follows the dates, and owners get SMS / email reminders at 30, 15, 7 and 1 days before expiry.
- Dashboards: pending applications by stage, age and district, inspections due and overdue, officer workload, and results measured from the records.
- Search, export and print: search across records, certificate PDF with QR, CSV reports.
- Mobile support for field officers: an installable app that keeps working with no network. Inspections save on the phone and are issued, signed and sent automatically once back online.
- Secure login: real accounts, with database rules (row-level security) that stop one account reading another's records and block illegal changes, such as an owner marking their own instrument as verified.

What is new compared with paper registers and typical State portals: a certificate a buyer can check on the spot that cannot be faked; field work that does not need a network; a pass or fail that is calculated, not typed; one platform where each State keeps its own fees, officers and data; and an AI assistant (Google Gemini) that flags odd documents and answers traders in Hindi, Gujarati or English but never approves anything.

Who it helps: traders and MSMEs apply and renew without office visits; LMOs and GATCs work from their phones; Controllers see pendency live; buyers can check any scale or pump in seconds.

Status: the prototype runs on a live database at https://tula-legal-metrology.vercel.app with a guided demo at /demo. Payment is a demo step, and SMS / email send once provider keys are added. Production needs each State's gazetted fee schedule, NIC SMS, treasury payment, e-Pramaan sign-in and hosting on government cloud. Plan: a field trial with 5 LMOs and 1 GATC in one district, then a district pilot, State rollout, and multi-State adoption through DoCA.

## Abstract / Summary

TULA is an online verification system for weighing and measuring instruments (SIH PS 26036). Each instrument gets a Digital ID that carries its whole verification history. Traders register and apply online; Controllers scrutinise documents and assign an LMO or GATC; officers inspect on a phone app that works offline, with pass or fail calculated from readings against OIML limits; certificates are signed on the server and carry a QR that any phone can verify without login or internet, so fakes and edited copies are rejected. Owners get SMS / email reminders before expiry, and officials see live pendency by stage, age and district. Fees, validity and officers are configured per State, and database rules keep each State's and each trader's data separate. The working prototype runs on a live database (React, Supabase, Vercel, Google Gemini) and will be tested with serving Legal Metrology Officers in one district before scaling State by State.

## Technology Bucket

Keep the bucket closest to "software / web and mobile development". If the list has a cybersecurity or e-governance option, that also fits, because the core innovation is the signed, tamper-proof certificate.

## YouTube link

Optional. Leave blank for now.
