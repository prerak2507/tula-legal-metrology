import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEED_SIGNATURES } from '../../data/seedSignatures';
import { b64urlToBytes, bytesToB64url, verifySignedQr } from '../../services/certSigning';
import { ShieldCheck, ShieldX, RotateCcw, Pencil, ArrowRight } from 'lucide-react';

// A real certificate signed by TULA's issuing key. The visitor can edit it; the badge is the
// exact check a buyer's phone runs on a scanned QR.
const SEED = SEED_SIGNATURES['CERT-2026-08912'];
const ORIGINAL = JSON.parse(new TextDecoder().decode(b64urlToBytes(SEED.p))) as Record<string, string>;

const FIELDS: { key: string; label: string; hint: string }[] = [
  { key: 'exp', label: 'Valid until', hint: 'Try 2029-01-17' },
  { key: 'cap', label: 'Capacity', hint: 'Try 500 kg' },
  { key: 'org', label: 'Owner', hint: 'Any other shop' },
  { key: 'sn', label: 'Serial no.', hint: 'Copy onto another scale' },
];

export const ForgeChallenge: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>({ ...ORIGINAL });
  const [state, setState] = useState<'checking' | 'genuine' | 'rejected'>('checking');
  const [attempts, setAttempts] = useState(0);

  const changed = useMemo(() => FIELDS.filter(f => values[f.key] !== ORIGINAL[f.key]).map(f => f.label), [values]);

  useEffect(() => {
    let live = true;
    const p = bytesToB64url(new TextEncoder().encode(JSON.stringify(values)));
    verifySignedQr(p, SEED.s, new Date('2026-06-01')).then(r => {
      if (live) setState(r.status === 'VALID' || r.status === 'EXPIRED' ? 'genuine' : 'rejected');
    });
    return () => { live = false; };
  }, [values]);

  const edit = (key: string, v: string) => {
    if (v !== values[key] && values[key] === ORIGINAL[key]) setAttempts(a => a + 1);
    setValues(prev => ({ ...prev, [key]: v }));
  };

  const ok = state === 'genuine';

  return (
    <div className="relative">
      <div className={`absolute -inset-3 rounded-[28px] blur-2xl opacity-40 transition-colors duration-500 ${ok ? 'bg-emerald-400' : 'bg-rose-500'}`} aria-hidden="true" />
      <div className="relative rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className={`px-5 py-4 flex items-center justify-between gap-3 text-white transition-colors duration-300 ${ok ? 'bg-emerald-600' : 'bg-rose-600'}`} aria-live="polite">
          <div className="flex items-center gap-2.5">
            {ok ? <ShieldCheck className="w-7 h-7" /> : <ShieldX className="w-7 h-7" />}
            <div>
              <p className="font-extrabold text-lg leading-tight">{state === 'checking' ? 'Checking…' : ok ? 'Genuine certificate' : 'Rejected: edited copy'}</p>
              <p className="text-xs text-white/85">{ok ? 'Signature matches every field' : `Changed: ${changed.join(', ')}. The signature no longer matches.`}</p>
            </div>
          </div>
          {!ok && (
            <button onClick={() => setValues({ ...ORIGINAL })} className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold">
              <RotateCcw className="w-3.5 h-3.5" /> Undo
            </button>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-mono font-bold text-slate-900">{ORIGINAL.n}</p>
            <p className="text-[11px] text-slate-500">Verification certificate · {ORIGINAL.st}</p>
          </div>
          <p className="text-sm text-slate-600">{ORIGINAL.cat}</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {FIELDS.map(f => {
              const dirty = values[f.key] !== ORIGINAL[f.key];
              return (
                <label key={f.key} className="block">
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    {f.label} <Pencil className="w-3 h-3" />
                  </span>
                  <input
                    value={values[f.key]}
                    onChange={e => edit(f.key, e.target.value)}
                    aria-label={`${f.label} (editable)`}
                    className={`mt-1 w-full rounded-lg border px-2.5 py-2 text-sm font-semibold outline-none transition-colors ${dirty ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-gov-500 focus:bg-white'}`}
                  />
                  <span className="text-[10px] text-slate-400">{f.hint}</span>
                </label>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            <span>Checked in your browser with TULA's public key, the same way a buyer's phone checks a scanned QR. No server involved.</span>
            <Link to={`/verify/${encodeURIComponent(ORIGINAL.n)}`} className="inline-flex items-center gap-1 font-bold text-gov-700 hover:underline">Open the real one <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {attempts >= 2 && (
            <p className="mt-2 text-xs font-semibold text-slate-700">{attempts} forgery attempts, {attempts} caught. That is the point.</p>
          )}
        </div>
      </div>
    </div>
  );
};
