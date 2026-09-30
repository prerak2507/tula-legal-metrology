// Public Supabase settings for server functions. The URL and publishable key are public by design;
// every request below runs with the caller's own access token, so row-level security still applies.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function fromEnvFile(name) {
  const f = resolve(process.cwd(), '.env.production');
  if (!existsSync(f)) return '';
  const line = readFileSync(f, 'utf8').split(/\r?\n/).find(l => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim() : '';
}

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || fromEnvFile('VITE_SUPABASE_URL');
export const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || fromEnvFile('VITE_SUPABASE_ANON_KEY');
export const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || 'https://tula-legal-metrology.vercel.app';

/** Calls Supabase REST / Auth as the signed-in user. */
export async function asUser(token, path, init = {}) {
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    signal: AbortSignal.timeout(10_000),
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}
