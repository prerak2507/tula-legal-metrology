import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { outbox } from '../services/notifications';
import { NotificationItem, OutboxMessage, DeliveryStatus } from '../types';
import { Bell, Mail, MessageSquare, RefreshCw, Info, ExternalLink } from 'lucide-react';

const STATUS_LABEL: Record<DeliveryStatus, { text: string; cls: string }> = {
  sent: { text: 'Sent', cls: 'bg-emerald-100 text-emerald-800' },
  not_configured: { text: 'Gateway not set up', cls: 'bg-slate-200 text-slate-700' },
  failed: { text: 'Failed', cls: 'bg-rose-100 text-rose-800' },
  skipped: { text: 'Not requested', cls: 'bg-slate-100 text-slate-500' },
  blocked: { text: 'Blocked (demo allow-list)', cls: 'bg-amber-100 text-amber-800' },
  queued_offline: { text: 'Queued (offline)', cls: 'bg-amber-100 text-amber-800' },
  pending: { text: 'Sending…', cls: 'bg-gov-100 text-gov-800' },
};

export const Notifications: React.FC = () => {
  const [user, setUser] = useState(storage.getCurrentUser());
  const [inApp, setInApp] = useState<NotificationItem[]>(storage.getNotificationsForUser());
  const [messages, setMessages] = useState<OutboxMessage[]>(outbox.list());
  const [health, setHealth] = useState<{ email: boolean; sms: boolean } | null>(null);

  useEffect(() => {
    const refresh = () => { setUser(storage.getCurrentUser()); setInApp(storage.getNotificationsForUser()); setMessages(outbox.list()); };
    const a = storage.subscribe(refresh);
    const b = outbox.subscribe(refresh);
    fetch('/api/health').then(r => (r.ok ? r.json() : null)).then(d => d && setHealth({ email: d.email?.configured, sms: d.sms?.configured })).catch(() => setHealth(null));
    return () => { a(); b(); };
  }, []);

  const officer = user.role !== 'BUSINESS';
  const mine = officer ? messages : messages.filter(m => m.recipientId === user.id);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Updates by SMS and email</h1>
        <p className="text-sm text-slate-600">Every step of an application sends an update: received, fee paid, visit booked, result, certificate issued, and reminders before expiry.</p>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2"><Mail className="w-5 h-5 text-gov-700" /><span>Email: <strong>{health === null ? 'checking…' : health.email ? 'connected (Resend)' : 'not set up on this deployment'}</strong></span></div>
        <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-gov-700" /><span>SMS: <strong>{health === null ? 'checking…' : health.sms ? 'connected (Twilio)' : 'not set up on this deployment'}</strong></span></div>
        <div className="flex items-center gap-2"><Bell className="w-5 h-5 text-gov-700" /><span>In-app: <strong>always on</strong></span></div>
        <p className="sm:col-span-3 text-xs text-slate-500 flex gap-1.5"><Info className="w-4 h-4 shrink-0" />When a gateway is not set up, messages are still written below with their exact text, and marked "gateway not set up". Nothing is shown as sent unless the provider accepted it. Pilot: NIC SMS gateway and a government email relay.</p>
      </section>

      <section className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-bold text-sm text-slate-900">{officer ? 'All outgoing messages (this device)' : 'Messages sent to you'}</h2>
          <button onClick={() => outbox.flush()} className="inline-flex items-center gap-1 text-xs font-semibold text-gov-700 px-2 py-1.5 rounded hover:bg-gov-50"><RefreshCw className="w-3.5 h-3.5" /> Retry queued</button>
        </div>
        {mine.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 text-center">No messages yet. Submit an application to see the first one.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {mine.slice(0, 60).map(m => (
              <li key={m.id} className="p-4 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-slate-900">{m.subject}</p>
                  <span className="text-[11px] text-slate-400">{new Date(m.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs text-slate-700 font-mono bg-slate-50 rounded p-2 break-words">{m.text}</p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {m.email || 'no email'} <span className={`px-1.5 rounded font-bold ${STATUS_LABEL[m.emailStatus].cls}`}>{STATUS_LABEL[m.emailStatus].text}</span></span>
                  <span className="inline-flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {m.phone || 'no phone'} <span className={`px-1.5 rounded font-bold ${STATUS_LABEL[m.smsStatus].cls}`}>{STATUS_LABEL[m.smsStatus].text}</span></span>
                </div>
                {m.error && <p className="text-[11px] text-slate-500">{m.error}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200">
        <h2 className="font-bold text-sm text-slate-900 p-4 border-b border-slate-100">In-app alerts</h2>
        {inApp.length === 0 ? <p className="p-6 text-sm text-slate-500 text-center">No alerts.</p> : (
          <ul className="divide-y divide-slate-100">
            {inApp.slice(0, 40).map(n => (
              <li key={n.id} className={`p-4 flex items-start justify-between gap-3 ${n.read ? '' : 'bg-amber-50/40'}`}>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-600">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                </div>
                {n.link && <Link to={n.link} onClick={() => storage.markNotificationRead(n.id)} className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-gov-700">Open <ExternalLink className="w-3 h-3" /></Link>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
