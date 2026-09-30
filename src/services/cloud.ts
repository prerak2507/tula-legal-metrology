// Live data layer.
// - Supabase Postgres is the source of truth. Row-level security decides what each account sees.
// - The browser keeps a local copy so pages render instantly and field work continues offline.
// - Every local change is queued and written to the database; the queue survives reloads and
//   flushes when the device is back online. A change the database refuses is rolled back by a re-pull.
// - Realtime pushes other people's changes into the local copy, so every screen stays current.

import { createClient, SupabaseClient, Session, RealtimeChannel } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/cloud';
import type { UserProfile } from '../types';

type Row = Record<string, unknown>;
interface Mapping { table: string; key: (o: any) => string; row: (o: any) => Row }

let instrumentStates: (id: string) => string | undefined = () => undefined;
let currentState: () => string | undefined = () => undefined;

export const MAPPINGS: Record<string, Mapping> = {
  lm_instruments_v2: { table: 'instruments', key: o => o.id, row: o => ({ id: o.id, state: o.state, district: o.district, owner_id: o.ownerId, data: o }) },
  lm_applications_v2: { table: 'applications', key: o => o.id, row: o => ({ id: o.id, state: o.state, district: o.district, applicant_id: o.applicantId, assigned_to_id: o.assignedToId ?? null, instrument_id: o.instrumentId, status: o.status, data: o }) },
  lm_inspections_v2: { table: 'inspections', key: o => o.id, row: o => ({ id: o.id, application_id: o.applicationId, instrument_id: o.instrumentId, inspector_id: o.inspectorId, state: instrumentStates(o.instrumentId) || currentState() || 'Delhi', data: o }) },
  lm_stampings_v2: { table: 'stampings', key: o => o.id, row: o => ({ id: o.id, instrument_id: o.instrumentId, state: instrumentStates(o.instrumentId) || currentState() || 'Delhi', data: o }) },
  lm_certificates_v2: { table: 'certificates', key: o => o.id, row: o => ({ id: o.id, cert_no: o.certificateNumber, instrument_id: o.instrumentId, state: o.state, status: o.status, data: o }) },
  lm_enforcements_v2: { table: 'enforcement_cases', key: o => o.id, row: o => ({ id: o.id, instrument_id: o.instrumentId && o.instrumentId !== 'Not identified' ? o.instrumentId : null, state: o.state, data: o }) },
  lm_audit_logs_v2: { table: 'audit_logs', key: o => o.id, row: o => ({ id: o.id, actor_id: o.actorId, entity_id: o.entityId, state: currentState() ?? null, data: o }) },
  lm_notifications_v2: { table: 'notifications', key: o => o.id, row: o => ({ id: o.id, recipient_id: o.recipientId, recipient_role: o.recipientRole, data: o }) },
  lm_outbox_v2: { table: 'outbox', key: o => o.id, row: o => ({ id: o.id, recipient_id: o.recipientId, data: o }) },
  lm_fee_rules_v2: { table: 'fee_rules', key: o => o.id, row: o => ({ id: o.id, jurisdiction: o.jurisdiction, data: o }) },
  lm_validity_rules_v2: { table: 'validity_rules', key: o => o.category, row: o => ({ id: o.category, data: o }) },
};
const TABLE_TO_KEY = Object.fromEntries(Object.entries(MAPPINGS).map(([k, m]) => [m.table, k]));

export interface CloudStatus {
  enabled: boolean;
  signedIn: boolean;
  online: boolean;
  pending: number;
  lastSyncAt?: string;
  lastError?: string;
  realtime: boolean;
  /** Startup session check finished */
  ready: boolean;
}

const QUEUE_KEY = 'lm_cloud_queue_v1';
interface Pending { table: string; id: string; row: Row; v: number }
let versionSeq = 0;

const hasWindow = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
export const cloudEnabled = hasWindow && !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
export const sb: SupabaseClient | null = cloudEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'tula-auth' } })
  : null;

let session: Session | null = null;
let channel: RealtimeChannel | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
const status: CloudStatus = { enabled: cloudEnabled, signedIn: false, online: hasWindow ? navigator.onLine : true, pending: 0, realtime: false, ready: !cloudEnabled };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());

// Hooks the storage layer registers (avoids a circular import).
type Applier = {
  replaceAll: (key: string, items: unknown[], keepIds: Set<string>) => void;
  upsertOne: (key: string, item: unknown) => void;
  setProfiles: (profiles: UserProfile[]) => void;
  setCurrentUser: (u: UserProfile | null) => void;
  instrumentState: (id: string) => string | undefined;
  currentState: () => string | undefined;
};
let applier: Applier | null = null;

const readQueue = (): Pending[] => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
};
const writeQueue = (q: Pending[]) => {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* full */ }
  status.pending = q.length;
  emit();
};

export const cloud = {
  status: () => ({ ...status }),
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
  session: () => session,
  accessToken: () => session?.access_token,

  registerApplier(a: Applier) {
    applier = a;
    instrumentStates = a.instrumentState;
    currentState = a.currentState;
  },

  /** Called by storage on every write to a synced key. Queues only records that changed. */
  onLocalWrite(key: string, prev: unknown[], next: unknown[]) {
    const m = MAPPINGS[key];
    if (!m || !cloudEnabled) return;
    const before = new Map(prev.map(o => [m.key(o), JSON.stringify(o)]));
    const changed = next.filter(o => before.get(m.key(o)) !== JSON.stringify(o));
    if (!changed.length) return;
    const q = readQueue();
    for (const o of changed) {
      const id = m.key(o);
      const idx = q.findIndex(p => p.table === m.table && p.id === id);
      const item = { table: m.table, id, row: m.row(o), v: Date.now() * 1000 + (versionSeq++ % 1000) };
      if (idx >= 0) q[idx] = item; else q.push(item);
    }
    writeQueue(q);
    this.scheduleFlush();
  },

  scheduleFlush(delay = 250) {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => { void this.flush(); }, delay);
  },

  /** Writes queued changes. Returns true when the queue is empty afterwards. */
  async flush(): Promise<boolean> {
    if (!sb || !session || !navigator.onLine) return readQueue().length === 0;
    if (flushing) { await new Promise(r => setTimeout(r, 200)); return this.flush(); }
    flushing = true;
    let needsPull = false;
    try {
      // Parent records first so security checks that look them up succeed.
      const order = ['profiles', 'fee_rules', 'validity_rules', 'instruments', 'applications', 'inspections', 'stampings', 'certificates', 'enforcement_cases', 'notifications', 'outbox', 'audit_logs'];
      const q = readQueue().sort((a, b) => order.indexOf(a.table) - order.indexOf(b.table));
      const done = new Set<string>();
      for (const table of order) {
        const rows = q.filter(p => p.table === table);
        if (!rows.length) continue;
        // Update rows that exist and insert the new ones. (An upsert would also have to pass the
        // insert rule, which rightly blocks officers from "inserting" a trader's application.)
        const ids = rows.map(r => r.id);
        const existing = new Set<string>();
        if (table !== 'audit_logs') {
          const { data, error } = await sb.from(table).select('id').in('id', ids);
          if (error) { status.lastError = error.message; continue; }
          (data || []).forEach((r: { id: string }) => existing.add(r.id));
        }
        const inserts = rows.filter(r => !existing.has(r.id));
        const updates = rows.filter(r => existing.has(r.id));
        const fail = (r: Pending, err: { code?: string; message: string }) => {
          const refused = ['42501', 'P0001', '23502', '23514'].includes(err.code || '') || /row-level security|violates|only an officer|can only be set/i.test(err.message);
          if (err.code === '23505') { done.add(`${r.table}:${r.id}:${r.v}`); return; } // already there
          if (refused) {
            done.add(`${r.table}:${r.id}:${r.v}`);
            status.lastError = `The server refused a change to ${table} ${r.id}: ${err.message}`;
            needsPull = true;
          } else {
            status.lastError = err.message;
          }
        };
        if (inserts.length) {
          const { error } = await sb.from(table).insert(inserts.map(r => r.row));
          if (!error) inserts.forEach(r => done.add(`${r.table}:${r.id}:${r.v}`));
          else for (const r of inserts) {
            const res = await sb.from(table).insert(r.row);
            if (!res.error) done.add(`${r.table}:${r.id}:${r.v}`); else fail(r, res.error);
          }
        }
        for (const r of updates) {
          const { id, ...rest } = r.row as { id: string };
          const res = await sb.from(table).update(rest).eq('id', id).select('id');
          if (res.error) fail(r, res.error);
          else if (!res.data || res.data.length === 0) fail(r, { code: '42501', message: 'not allowed to change this record' });
          else done.add(`${r.table}:${r.id}:${r.v}`);
        }
      }
      // Only remove the exact versions that were written; a newer edit made meanwhile stays queued.
      writeQueue(readQueue().filter(p => !done.has(`${p.table}:${p.id}:${p.v}`)));
      if (done.size) status.lastSyncAt = new Date().toISOString();
      if (readQueue().length) setTimeout(() => { void this.flush(); }, 300);
    } catch (e) {
      status.lastError = (e as Error).message;
    } finally {
      flushing = false;
      emit();
    }
    if (needsPull) await this.pull();
    return readQueue().length === 0;
  },

  /** Replaces the local copy with what the database says this account may see. */
  async pull(): Promise<void> {
    if (!sb || !session || !applier || !navigator.onLine) return;
    try {
      const tables = Object.entries(MAPPINGS);
      const results = await Promise.all(tables.map(([, m]) => sb!.from(m.table).select('data').limit(5000)));
      // Decide what to keep after the fetch, so edits made while it was running are not overwritten.
      const pendingIds = new Map<string, Set<string>>();
      readQueue().forEach(p => {
        const k = TABLE_TO_KEY[p.table];
        if (!pendingIds.has(k)) pendingIds.set(k, new Set());
        pendingIds.get(k)!.add(p.id);
      });
      results.forEach((res, i) => {
        const [key] = tables[i];
        if (res.error) { status.lastError = res.error.message; return; }
        applier!.replaceAll(key, (res.data || []).map((r: { data: unknown }) => r.data), pendingIds.get(key) || new Set());
      });
      const profiles = await sb.from('profiles').select('data');
      if (!profiles.error) applier.setProfiles((profiles.data || []).map((r: { data: UserProfile }) => r.data));
      status.lastSyncAt = new Date().toISOString();
    } catch (e) {
      status.lastError = (e as Error).message;
    }
    emit();
  },

  startRealtime() {
    if (!sb || channel) return;
    channel = sb.channel('tula-live');
    for (const m of Object.values(MAPPINGS)) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: m.table }, payload => {
        const rec = (payload.new as { data?: unknown } | null)?.data;
        const key = TABLE_TO_KEY[m.table];
        if (!rec || !applier) return;
        const pendingHere = readQueue().some(p => p.table === m.table && p.id === m.key(rec));
        if (!pendingHere) applier.upsertOne(key, rec);
      });
    }
    channel.subscribe(s => { status.realtime = s === 'SUBSCRIBED'; emit(); });
  },

  stopRealtime() {
    if (channel && sb) void sb.removeChannel(channel);
    channel = null;
    status.realtime = false;
  },

  async loadProfile(): Promise<UserProfile | null> {
    if (!sb || !session) return null;
    const { data, error } = await sb.from('profiles').select('data').eq('auth_id', session.user.id).maybeSingle();
    if (error || !data) return null;
    return data.data as UserProfile;
  },

  /** Restores a saved session at startup, pulls data and goes live. */
  async init(): Promise<void> {
    if (!sb) return;
    const { data } = await sb.auth.getSession();
    status.ready = true;
    session = data.session;
    status.signedIn = !!session;
    sb.auth.onAuthStateChange((_e, s) => { session = s; status.signedIn = !!s; emit(); });
    window.addEventListener('online', () => { status.online = true; emit(); void this.flush().then(() => this.pull()); });
    window.addEventListener('offline', () => { status.online = false; emit(); });
    status.pending = readQueue().length;
    if (session) {
      const profile = navigator.onLine ? await this.loadProfile() : null;
      if (profile) applier?.setCurrentUser(profile);
      await this.flush();
      await this.pull();
      this.startRealtime();
    }
    emit();
  },

  async signIn(email: string, password: string): Promise<UserProfile> {
    if (!sb) throw new Error('Cloud database is not configured.');
    if (!navigator.onLine) throw new Error('You are offline. Sign in needs a connection the first time.');
    // Write anything still queued under the previous account before switching.
    if (session) await this.flush();
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email or password is not right.' : error.message);
    session = data.session;
    status.signedIn = true;
    const profile = await this.loadProfile();
    if (!profile) throw new Error('Signed in, but no TULA profile is linked to this account.');
    applier?.setCurrentUser(profile);
    await this.pull();
    this.stopRealtime();
    this.startRealtime();
    emit();
    return profile;
  },

  async signUp(email: string, password: string, profile: Partial<UserProfile>): Promise<{ profile: UserProfile | null; needsConfirmation: boolean }> {
    if (!sb) throw new Error('Cloud database is not configured.');
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password, options: { data: { profile } } });
    if (error) throw new Error(error.message);
    if (!data.session) return { profile: null, needsConfirmation: true };
    session = data.session;
    status.signedIn = true;
    const p = await this.loadProfile();
    if (p) applier?.setCurrentUser(p);
    await this.pull();
    this.startRealtime();
    emit();
    return { profile: p, needsConfirmation: false };
  },

  async signOut() {
    if (!sb) return;
    await this.flush();
    this.stopRealtime();
    await sb.auth.signOut();
    session = null;
    status.signedIn = false;
    applier?.setCurrentUser(null);
    emit();
  },

  /** Sequential id from the database (no collisions across devices). Offline: a unique local id. */
  async nextId(prefix: string, pad: number): Promise<string> {
    if (sb && session && navigator.onLine) {
      const { data, error } = await sb.rpc('next_serial', { p_prefix: prefix });
      if (!error && typeof data === 'number') return `${prefix}${String(data).padStart(pad, '0')}`;
    }
    const rand = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
    return `${prefix}X${rand.slice(-pad)}`;
  },

  async publicCertificate(term: string): Promise<Record<string, string> | null> {
    if (!sb || !navigator.onLine) return null;
    const { data, error } = await sb.rpc('public_certificate', { term });
    if (error || !data) return null;
    return data as Record<string, string>;
  },

  async publicRevocations(): Promise<{ id: string; n: string; reason: string; at: string }[] | null> {
    if (!sb || !navigator.onLine) return null;
    const { data, error } = await sb.rpc('public_revocations');
    return error ? null : (data as { id: string; n: string; reason: string; at: string }[]);
  },

  /** Headline counts for the public landing page (no personal data). */
  async publicStats(): Promise<Record<string, number> | null> {
    if (!sb || !navigator.onLine) return null;
    const { data, error } = await sb.rpc('public_stats');
    return error ? null : (data as Record<string, number>);
  },

  /** Current fee schedule (public read). */
  async publicFeeRules(): Promise<unknown[] | null> {
    if (!sb || !navigator.onLine) return null;
    const { data, error } = await sb.from('fee_rules').select('data');
    return error ? null : (data || []).map((r: { data: unknown }) => r.data);
  },

  async reportProblem(p: Record<string, string>): Promise<string> {
    if (!sb) throw new Error('offline');
    const { data, error } = await sb.rpc('report_problem', { p });
    if (error) throw new Error(error.message);
    return data as string;
  },
};
