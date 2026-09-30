import React, { useEffect, useMemo, useState } from 'react';
import { storage } from '../services/storage';
import { FeeRule, ValidityRule, InstrumentCategory } from '../types';
import { calculateStatutoryFee, stateCode } from '../services/rulesEngine';
import { CATEGORY_LABELS, LIVE_STATES } from '../config/geo';
import { checkSupabaseConnection } from '../services/supabase';
import { Settings, Save, CheckCircle2, AlertTriangle, Server, Map } from 'lucide-react';

const CATS = Object.keys(CATEGORY_LABELS) as InstrumentCategory[];

export const AdminRules: React.FC = () => {
  const user = storage.getCurrentUser();
  const canEditAll = user.role === 'CENTRAL_ADMIN';
  const editableStates = canEditAll ? Object.keys(LIVE_STATES) : (user.state in LIVE_STATES ? [user.state] : []);
  const [jurisdiction, setJurisdiction] = useState<string>(editableStates[0] || 'Delhi');
  const [rules, setRules] = useState<FeeRule[]>(storage.getFeeRules());
  const [validity, setValidity] = useState<ValidityRule[]>(storage.getValidityRules());
  const [edits, setEdits] = useState<Record<string, { fee: string; charge: string }>>({});
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
  const rows = useMemo(() => CATS.map(cat => {
    const eff = calculateStatutoryFee(cat, jurisdiction, rules);
    const override = rules.find(r => r.category === cat && r.jurisdiction === code);
    return { cat, eff, override };
  }), [rules, jurisdiction, code]);

  const canEdit = editableStates.includes(jurisdiction);

  const saveFees = () => {
    const next = [...rules];
    for (const [cat, v] of Object.entries(edits)) {
      const fee = parseInt(v.fee, 10), charge = parseInt(v.charge, 10);
      if (Number.isNaN(fee) || Number.isNaN(charge) || fee < 0 || charge < 0) continue;
      const idx = next.findIndex(r => r.category === cat && r.jurisdiction === code);
      const rule: FeeRule = {
        id: `FEE-${code}-${cat}`, jurisdiction: code, category: cat as InstrumentCategory, capacityRange: 'All',
        statutoryFee: fee, userCharge: charge, effectiveFrom: new Date().toISOString().slice(0, 10),
        ruleCitation: `${jurisdiction} schedule, updated by ${user.fullName}`,
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
        <p className="text-sm text-slate-600">Each State loads its own schedule. Changes apply to new applications immediately and are written to the audit trail.</p>
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
          <table className="w-full text-sm min-w-[560px]">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="py-2">Instrument</th><th>Verification fee (₹)</th><th>Service charge (₹)</th><th>Total</th><th>Source</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ cat, eff, override }) => {
                const e = edits[cat];
                return (
                  <tr key={cat}>
                    <td className="py-2 font-semibold text-slate-800">{CATEGORY_LABELS[cat]}</td>
                    <td><input disabled={!canEdit} inputMode="numeric" value={e?.fee ?? String(eff.statutory)} onChange={ev => setEdits(p => ({ ...p, [cat]: { fee: ev.target.value, charge: p[cat]?.charge ?? String(eff.userCharge) } }))} className="w-24 border border-slate-300 rounded p-1.5 disabled:bg-slate-50" /></td>
                    <td><input disabled={!canEdit} inputMode="numeric" value={e?.charge ?? String(eff.userCharge)} onChange={ev => setEdits(p => ({ ...p, [cat]: { fee: p[cat]?.fee ?? String(eff.statutory), charge: ev.target.value } }))} className="w-24 border border-slate-300 rounded p-1.5 disabled:bg-slate-50" /></td>
                    <td className="font-bold">₹{(eff.statutory + eff.userCharge).toLocaleString('en-IN')}</td>
                    <td className="text-xs text-slate-500">{override ? `${jurisdiction} rule` : 'Default'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {canEdit && <button onClick={saveFees} disabled={!Object.keys(edits).length} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gov-700 text-white text-sm font-bold disabled:opacity-40"><Save className="w-4 h-4" /> Save {jurisdiction} fees</button>}
        <p className="text-[11px] text-slate-500">Prototype values are demo figures. A State replaces them with its gazetted schedule.</p>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h2 className="font-bold text-sm text-slate-900">Validity period (months)</h2>
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
