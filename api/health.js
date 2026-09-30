// GET /api/health
// Reports which server-side services are configured, without revealing any secret.

import { send } from './_lib/common.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  return send(res, 200, {
    ok: true,
    time: new Date().toISOString(),
    signing: {
      configured: Boolean(process.env.CERT_SIGNING_PRIVATE_KEY),
      kid: process.env.CERT_SIGNING_KEY_ID || 'tula-demo-2026-09',
    },
    ai: { configured: Boolean(process.env.GEMINI_API_KEY) },
    email: { configured: Boolean(process.env.RESEND_API_KEY) },
    sms: { configured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) },
  });
}
