// Revocation check. A revoked certificate still carries a valid signature, so verification also
// checks the published revocation list. The list is cached on the device for offline checks,
// and the result says how fresh it is.

import { storage } from './storage';
import { cloud } from './cloud';

export interface RevocationEntry { id: string; n: string; reason: string; at: string }
export interface RevocationCheck {
  revoked?: RevocationEntry;
  source: 'live' | 'cached' | 'unavailable';
  listUpdated?: string;
}

const CACHE_KEY = 'lm_revocations_cache_v1';

async function loadList(): Promise<{ list: RevocationEntry[]; source: RevocationCheck['source']; updated?: string }> {
  // Live list from the database first; the published file is the fallback.
  const live = await cloud.publicRevocations().catch(() => null);
  if (live) {
    const data = { updated: new Date().toISOString(), revoked: live };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    return { list: live, source: 'live', updated: data.updated };
  }
  try {
    const r = await fetch('/revocations.json', { cache: 'no-store' });
    if (r.ok) {
      const data = await r.json();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
      return { list: data.revoked || [], source: 'live', updated: data.updated };
    }
  } catch { /* offline */ }
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached) return { list: cached.revoked || [], source: 'cached', updated: cached.updated };
  } catch { /* ignore */ }
  return { list: [], source: 'unavailable' };
}

export async function checkRevocation(certId: string, certNo: string): Promise<RevocationCheck> {
  const { list, source, updated } = await loadList();
  const hit = list.find(e => e.id === certId || e.n === certNo);
  if (hit) return { revoked: hit, source, listUpdated: updated };
  // Revocations made on this device (officer action) apply immediately.
  const local = storage.getCertificateById(certId) || storage.getCertificateById(certNo);
  if (local?.status === 'REVOKED') {
    return { revoked: { id: local.id, n: local.certificateNumber, reason: local.revocationReason || 'Revoked by the issuing office', at: (local.revokedAt || '').slice(0, 10) }, source, listUpdated: updated };
  }
  return { source, listUpdated: updated };
}
