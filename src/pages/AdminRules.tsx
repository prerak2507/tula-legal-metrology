import React, { useEffect, useMemo, useState } from 'react';
import { storage } from '../services/storage';
import { FeeRule, ValidityRule, InstrumentCategory } from '../types';
import { IN_SITU_EXEMPT, stateCode } from '../services/rulesEngine';
import { CATEGORY_LABELS, LIVE_STATES } from '../config/geo';
import { checkSupabaseConnection } from '../services/supabase';
import { Settings, Save, CheckCircle2, AlertTriangle, Server, Map, ExternalLink } from 'lucide-react';

const CATS = Object.keys(CATEGORY_LABELS) as InstrumentCategory[];

export const AdminRules: React.FC = () => {
  const user = storage.getCurrentUser();
  const canEditAll = user.role === 'CENTRAL_ADMIN';
  const editableStates = canEditAll ? Object.keys(LIVE_STATES) : (user.state in LIVE_STATES ? [user.state] : []);
  const [jurisdiction, setJurisdiction] = useState<string>(editableStates[0] || 'Delhi');
  const [rules, setRules] = useState<FeeRule[]>(storage.getFeeRules());
  const [validity, setValidity] = useState<ValidityRule[]>(storage.getValidityRules());
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [health, setHealth] = useState<Record<string, boolean> | null>(null);
  const [db, setDb] = useState<string>('checking…');

  useEffect(() => {
    fetch('/api/health').then(r => (r.ok ? r.json() : Promise.reject())).then(d => setHealth({
      'Certificate signing': d.signing?.configured, 'AI assistant (Gemini)': d.ai?.configured, 'Email (Resend)': d.email?.configured, 'SMS (Twilio)': d.sms?.configured,
    })).catch(() => setHealth({}));
    checkSupabaseConnection().then(r => setDb(r.ok ? (r.tablesExist ? 'Connected, tables present' : 'Connected, tables not created yet (pilot step)') : r.message)).catch(() => setDb('Not reachable'));
  }, []);

  const code = stateCode(jurisdiction);
  // The State's Schedule IX tiers per instrument, and any flat override a State admin has set.
  const rows = useMemo(() => CATS.map(cat => {
    const own = rules.filter(r => r.category === cat && r.jurisdiction === code);
    const override = own.find(r => r.id.endsWith('-OVR'));
    const tiers = own.filter(r => !r.id.endsWith('-OVR'))
      .sort((a, b) => (a.accuracyClasses?.length ? 0 : 1) - (b.accuracyClasses?.length ? 0 : 1) || (a.upTo ?? Infinity) - (b.upTo ?? Infinity));
    return { cat, tiers, override };
  }), [rules, code]);

  const canEdit = editableStates.includes(jurisdiction);

  const saveFees = () => {
    const next = [...rules];
    for (const [cat, v] of Object.entries(edits)) {
      const id = `FEE-${code}-${cat}-OVR`;
      const idx = next.findIndex(r => r.id === id);
      if (v.trim() === '') { if (idx >= 0) next.splice(idx, 1); continue; }
      const fee = Number(v);
      if (Number.isNaN(fee) || fee < 0) continue;
      const rule: FeeRule = {
        id, jurisdiction: code, category: cat as InstrumentCategory, capacityRange: 'All capacities',
        statutoryFee: fee, userCharge: 0, effectiveFrom: new Date().toISOString().slice(0, 10),
        ruleCitation: `${jurisdiction} override set by ${user.fullName} (replaces Schedule IX until removed)`,
      };
      if (idx >= 0) next[idx] = rule; else next.push(rule);
    }
    storage.saveFeeRules(next);
    setRules(next);
    setEdits({});
    setSaved(`Saved. New applications in ${jurisdiction} use these fees from now on. No redeploy needed.`);
  };

  const saveValidity = () => {
    storage.saveValidityRules(validity);
    setSaved('Validity periods saved.');
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-gov-800 uppercase tracking-wider"><Settings className="w-4 h-4" /> Rules engine</div>
        <h1 className="text-2xl font-extrabold text-slate-900">Fees and validity by State</h1>
        <p className="text-sm text-slate-600">Loaded from each State&apos;s gazetted rules. Overrides apply to new applications immediately and are written to the audit trail.</p>
      </div>

      {saved && <p role="status" className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5" />{saved}</p>}

      <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2"><Map className="w-4 h-4 text-gov-700" /> Fee schedule</h2>
          <label className="text-xs flex items-center gap-2">State
            <select value={jurisdiction} onChange={e => { setJurisdiction(e.target.value); setEdits({}); }} className="border border-slate-300 rounded-lg p-2 text-sm">
              {Object.keys(LIVE_STATES).map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
        {!canEdit && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">View only. {user.role === 'CENTRAL_ADMIN' ? '' : `Your account can edit ${editableStates.join(', ') || 'no State'} only.`}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead><tr className="text-left text-xs text-ink-600 border-b border-paper-300">
              <th className="py-2 pr-3">Instrument</th><th className="pr-3">Schedule IX fee by capacity</th><th className="pr-3">At the premises (rule 16(2))</th><th className="pr-3">State override (₹)</th><th>Source</th>
            </tr></thead>
            <tbody className="divide-y divide-paper-200 align-top">
              {rows.map(({ cat, tiers, override }) => {
                const src = tiers[0]?.sourceUrl || override?.sourceUrl;
                return (
                  <tr key={cat}>
                    <td className="py-2.5 pr-3 font-semibold text-ink">{CATEGORY_LABELS[cat]}</td>
                    <td className="py-2.5 pr-3 text-xs text-ink-700">
                      {tiers.length ? tiers.map(t => (
                        <span key={t.id} className="inline-block mr-2 mb-1 whitespace-nowrap"><span className="text-ink-600">{t.accuracyClasses?.length ? 'Class I/II, ' : ''}{t.capacityRange}</span> <strong className="font-readout">₹{t.statutoryFee.toLocaleString('en-IN')}</strong></span>
                      )) : <span className="text-brass-700">Not listed in Schedule IX</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-ink-700">{IN_SITU_EXEMPT.includes(cat) ? 'No extra: verified in place' : 'Half the fee + expenses (min ₹100)'}</td>
                    <td className="py-2.5 pr-3"><input disabled={!canEdit} inputMode="decimal" placeholder="none" aria-label={`Override fee for ${CATEGORY_LABELS[cat]}`}
                      value={edits[cat] ?? (override ? String(override.statutoryFee) : '')} onChange={ev => setEdits(p => ({ ...p, [cat]: ev.target.value }))}
                      className="w-24 border border-paper-300 rounded p-1.5 disabled:bg-paper-50" /></td>
                    <td className="py-2.5 text-xs">{src ? <a href={src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-ink underline">Official <ExternalLink className="w-3 h-3" /></a> : <span className="text-ink-600">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {canEdit && <button onClick={saveFees} disabled={!Object.keys(edits).length} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gov-700 text-white text-sm font-bold disabled:opacity-40"><Save className="w-4 h-4" /> Save {jurisdiction} overrides</button>}
        <p className="text-[11px] text-ink-600">Fees are the gazetted Schedule IX of the {jurisdiction} Legal Metrology (Enforcement) Rules, 2011. An override replaces the schedule for that instrument and is written to the audit trail. Leave it empty to use the schedule.</p>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h2 className="font-bold text-sm text-slate-900">Validity period (months)</h2>
        <p className="text-[11px] text-ink-600">Legal Metrology (General) Rules, 2011, rule 27: 24 months for weights, measures, beam scales and counter machines; 12 months for other instruments.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {validity.map((v, i) => (
            <label key={v.category} className="flex items-center justify-between gap-2 text-sm p-2 rounded border border-slate-200">
              <span>{CATEGORY_LABELS[v.category] || v.category.replace(/_/g, ' ').toLowerCase()}</span>
              <input disabled={!canEditAll && user.role !== 'STATE_ADMIN'} type="number" min={1} max={60} value={v.validityMonths}
                onChange={e => setValidity(list => list.map((x, j) => (j === i ? { ...x, validityMonths: Math.max(1, Math.min(60, parseInt(e.target.value || '1', 10))) } : x)))}
                className="w-20 border border-slate-300 rounded p-1.5 disabled:bg-slate-50" />
            </label>
          ))}
        </div>
        {(canEditAll || user.role === 'STATE_ADMIN') && <button onClick={saveValidity} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gov-700 text-white text-sm font-bold"><Save className="w-4 h-4" /> Save validity</button>}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
        <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2"><Server className="w-4 h-4 text-gov-700" /> Services on this deployment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {health === null ? <p className="text-slate-500">Checking…</p> : Object.keys(health).length === 0 ? <p className="text-amber-700 flex gap-1.5"><AlertTriangle className="w-4 h-4" /> Server functions not reachable.</p>
            : Object.entries(health).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between p-2 rounded border border-slate-200"><span>{k}</span><span className={`text-xs font-bold ${v ? 'text-emerald-700' : 'text-amber-700'}`}>{v ? 'on' : 'not set up'}</span></div>
            ))}
          <div className="flex items-center justify-between p-2 rounded border border-slate-200 sm:col-span-2"><span>Central database (Supabase)</span><span className="text-xs font-bold text-slate-700">{db}</span></div>
        </div>
      </section>
    </div>
  );
};
