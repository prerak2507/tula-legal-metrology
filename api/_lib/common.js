// Shared helpers for TULA serverless functions (Vercel Node runtime).
// Files under api/_lib are not exposed as routes.

const buckets = new Map();

/** Best-effort per-instance rate limit. Returns true when the call is allowed. */
export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now - entry.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/** Rejects cross-site browser calls. Same-origin calls and non-browser tools pass. */
export function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  try {
    const o = new URL(origin);
    return o.host === host || extra.includes(origin);
  } catch {
    return false;
  }
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error('payload_too_large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export function send(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

/** Common guard: method, origin and rate limit. Returns false when a response was already sent. */
export function guard(req, res, { method = 'POST', limit = 30, windowMs = 60_000, name = 'api' } = {}) {
  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return false;
  }
  if (req.method !== method) {
    send(res, 405, { error: 'method_not_allowed' });
    return false;
  }
  if (!originAllowed(req)) {
    send(res, 403, { error: 'origin_not_allowed' });
    return false;
  }
  if (!rateLimit(`${name}:${clientIp(req)}`, limit, windowMs)) {
    send(res, 429, { error: 'rate_limited', message: 'Too many requests. Try again in a minute.' }, { 'Retry-After': String(Math.ceil(windowMs / 1000)) });
    return false;
  }
  return true;
}

export const isIsoDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
export const shortText = (s, max) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;
