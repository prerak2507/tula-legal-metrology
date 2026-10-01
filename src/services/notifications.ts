// SMS / email outbox.
// Every application and certificate event creates an outbox message. When online, the message is
// sent through /api/notify (Resend for email, Twilio for SMS). The status records what really
// happened: sent, not_configured (no provider keys on this deployment), failed, or queued_offline.

import { NotificationTemplate, OutboxMessage, DeliveryStatus } from '../types';
import { cloud } from './cloud';
import { TEMPLATES } from '../../api/_lib/templates.js';

const KEY = 'lm_outbox_v2';

let memory: OutboxMessage[] = [];

const read = (): OutboxMessage[] => {
  try {
    if (typeof localStorage !== 'undefined') return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch { /* blocked storage: fall back to memory */ }
  return memory;
};
const write = (list: OutboxMessage[]) => {
  const trimmed = list.slice(0, 300);
  cloud.onLocalWrite(KEY, read(), trimmed); // save to the live database too
  memory = trimmed;
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch { /* storage full or unavailable */ }
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());

/** Same templates the server sends (api/_lib/templates.js), so the outbox shows the exact text. */
export function renderTemplate(template: NotificationTemplate, p: Record<string, string>): { subject: string; text: string } {
  const build = TEMPLATES[template];
  return build ? build(p) : { subject: template, text: '' };
}

interface QueueInput {
  template: NotificationTemplate;
  recipientId: string;
  email?: string;
  phone?: string;
  params: Record<string, string>;
}

function normalisePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d+]/g, '');
  if (/^\+91[6-9]\d{9}$/.test(digits)) return digits;
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  return undefined;
}

async function deliver(msg: OutboxMessage, params: Record<string, string>): Promise<Partial<OutboxMessage>> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      emailStatus: msg.email ? 'queued_offline' : 'skipped',
      smsStatus: msg.phone ? 'queued_offline' : 'skipped',
    };
  }
  try {
    const r = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: msg.template, email: msg.email, phone: msg.phone, params }),
    });
    if (r.status === 404) {
      return { emailStatus: msg.email ? 'not_configured' : 'skipped', smsStatus: msg.phone ? 'not_configured' : 'skipped', error: 'Notification service not deployed here' };
    }
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const status: DeliveryStatus = r.status === 429 ? 'pending' : 'failed';
      return { emailStatus: msg.email ? status : 'skipped', smsStatus: msg.phone ? status : 'skipped', error: data.message || data.error || `HTTP ${r.status}` };
    }
    const errs = [data.result?.email?.error, data.result?.sms?.error].filter(Boolean).join('; ');
    return {
      emailStatus: data.result?.email?.status ?? 'skipped',
      smsStatus: data.result?.sms?.status ?? 'skipped',
      error: errs || undefined,
    };
  } catch {
    return { emailStatus: msg.email ? 'pending' : 'skipped', smsStatus: msg.phone ? 'pending' : 'skipped', error: 'Network error, will retry' };
  }
}

export const outbox = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  list(): OutboxMessage[] {
    return read();
  },

  /** Creates the message and tries to send it straight away. */
  queue(input: QueueInput): OutboxMessage {
    const { subject, text } = renderTemplate(input.template, input.params);
    const email = input.email?.trim() || undefined;
    const phone = normalisePhone(input.phone);
    const msg: OutboxMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      template: input.template,
      recipientId: input.recipientId,
      email,
      phone,
      subject,
      text,
      emailStatus: email ? 'pending' : 'skipped',
      smsStatus: phone ? 'pending' : 'skipped',
      params: input.params,
      createdAt: new Date().toISOString(),
    };
    write([msg, ...read()]);
    emit();
    void this.send(msg.id);
    return msg;
  },

  async send(id: string): Promise<void> {
    const msg = read().find(m => m.id === id);
    if (!msg) return;
    const update = await deliver(msg, msg.params ?? {});
    write(read().map(m => (m.id === id ? { ...m, ...update, attemptedAt: new Date().toISOString() } : m)));
    emit();
  },

  /** Retries messages that were queued offline or hit a network error. */
  async flush(): Promise<number> {
    const retry = read().filter(m => [m.emailStatus, m.smsStatus].some(s => s === 'pending' || s === 'queued_offline'));
    for (const m of retry) await this.send(m.id);
    return retry.length;
  },

  clear() {
    write([]);
    emit();
  },
};
