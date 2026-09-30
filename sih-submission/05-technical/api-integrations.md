# API & Integrations

| API / Service | Purpose | Required? | Free Tier? | Current Status | Environment Variable | Fallback |
|---|---|---|---|---|---|---|
| Supabase | Database, Auth, Storage, RLS | YES | YES | Planned | VITE_SUPABASE_URL | Local Storage (Mock) |
| Twilio / Msg91 | SMS OTP & Expiry Notifications | NO | YES (Twilio) | Not Implemented | VITE_SMS_API_KEY | Email/In-app Toasts |
| SendGrid / Resend | Email Notifications | NO | YES | Not Implemented | VITE_EMAIL_API_KEY | In-app Toasts |
| Razorpay / BillDesk | Government Fee Payment Gateway | YES (Prod) | NO | Planned | VITE_PAYMENT_KEY | Bypass (Mock Mode) |
| html2pdf.js / jsPDF | Client-side Certificate Generation | YES | YES (FOSS) | Prototyped | N/A | Server-side PDF Gen |