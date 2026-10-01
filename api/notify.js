// POST /api/notify
// Sends application / certificate updates by email (Resend) and SMS (Twilio).
// Only fixed templates are accepted, so this endpoint cannot be used to send arbitrary text.
// Channels without credentials report "not_configured" instead of pretending to send.

import { guard, readJson, send } from './_lib/common.js';
import { TEMPLATES } from './_lib/templates.js';

// Templates live in ./_lib/templates.js, shared with the app.

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;
const PHONE_RE = /^\+91[6-9]\d{9}$/;

function clean(params) {
  const out = {};
  for (const [k, v] of Object.entries(params || {})) out[k] = String(v ?? '').replace(/[\r\n<>]/g, ' ').slice(0, 160);
  return out;
}

function allowed(recipient) {
  const list = (process.env.NOTIFY_ALLOWLIST || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return list.length === 0 || list.includes(recipient.toLowerCase());
}

async function sendEmail(to, msg) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: 'not_configured' };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM_EMAIL || 'TULA <onboarding@resend.dev>',
      to: [to],
      subject: msg.subject,
      text: msg.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await r.json().catch(() => ({}));
  return r.ok ? { status: 'sent', providerId: data.id } : { status: 'failed', error: data?.message || `HTTP ${r.status}` };
}

async function sendSms(to, msg) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return { status: 'not_configured' };
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: msg.text.slice(0, 300) }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await r.json().catch(() => ({}));
  return r.ok ? { status: 'sent', providerId: data.sid } : { status: 'failed', error: data?.message || `HTTP ${r.status}` };
}

export default async function handler(req, res) {
  if (!guard(req, res, { name: 'notify', limit: 15, windowMs: 60_000 })) return;

  let body;
  try {
    body = await readJson(req);
  } catch {
    return send(res, 400, { error: 'invalid_json' });
  }

  const build = TEMPLATES[body.template];
  if (!build) return send(res, 422, { error: 'unknown_template' });
  const msg = build(clean(body.params));

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.replace(/[\s-]/g, '') : '';

  const result = { email: { status: 'skipped' }, sms: { status: 'skipped' } };
  try {
    if (email) {
      result.email = !EMAIL_RE.test(email) ? { status: 'failed', error: 'invalid email' }
        : !allowed(email) ? { status: 'blocked', error: 'recipient not on demo allow-list' }
        : await sendEmail(email, msg);
    }
    if (phone) {
      result.sms = !PHONE_RE.test(phone) ? { status: 'failed', error: 'phone must be +91 followed by 10 digits' }
        : !allowed(phone) ? { status: 'blocked', error: 'recipient not on demo allow-list' }
        : await sendSms(phone, msg);
    }
  } catch (e) {
    return send(res, 502, { error: 'provider_error', message: e.message, result });
  }

  return send(res, 200, { template: body.template, subject: msg.subject, text: msg.text, result });
}
