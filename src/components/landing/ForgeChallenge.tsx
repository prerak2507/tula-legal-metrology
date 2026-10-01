import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEED_SIGNATURES } from '../../data/seedSignatures';
import { b64urlToBytes, bytesToB64url, verifySignedQr } from '../../services/certSigning';
import { ShieldCheck, ShieldX, RotateCcw, ArrowRight } from 'lucide-react';
import { Rosette } from './Guilloche';

// A real certificate signed by TULA's issuing key. The visitor can edit it; the stamp is the
// exact check a buyer's phone runs on a scanned QR.
const SEED = SEED_SIGNATURES['CERT-2026-08912'];
const ORIGINAL = JSON.parse(new TextDecoder().decode(b64urlToBytes(SEED.p))) as Record<string, string>;

const FIELDS: { key: string; label: string; hint: string }[] = [
  { key: 'exp', label: 'Valid until', hint: 'try 2029-01-17' },
  { key: 'cap', label: 'Capacity', hint: 'try 500 kg' },
  { key: 'org', label: 'Owner', hint: 'any other shop' },
  { key: 'sn', label: 'Serial no.', hint: 'copy onto another scale' },
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
    <div className="relative font-plex">
      {/* Instruction tab */}
      <div className="absolute -top-3 left-6 z-10 px-3 py-1 rounded-full bg-brass-300 text-ink text-[11px] font-bold tracking-wide shadow">
        Try to forge it. Edit any field.
      </div>

      <div className="relative rounded-[6px] bg-paper-50 text-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] p-2">
        {/* Double security border */}
        <div className="relative rounded-[3px] border-2 border-brass/70 p-1">
          <div className="relative overflow-hidden rounded-[2px] border border-brass/40 px-5 pt-6 pb-4 sm:px-6">
            <Rosette className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 text-brass/15" />

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="font-readout text-[10px] uppercase tracking-[0.2em] text-brass-700">Legal Metrology · {ORIGINAL.st}</p>
                <h3 className="font-display text-xl sm:text-2xl font-semibold leading-tight mt-1">Certificate of Verification</h3>
                <p className="text-xs text-ink-600 mt-0.5">{ORIGINAL.cat}</p>
              </div>
              <p className="font-readout text-xs font-semibold text-ink-700 text-right whitespace-nowrap">{ORIGINAL.n}</p>
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
              {FIELDS.map(f => {
                const dirty = values[f.key] !== ORIGINAL[f.key];
                return (
                  <label key={f.key} className="block">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-600">{f.label}</span>
                    <input
                      value={values[f.key]}
                      onChange={e => edit(f.key, e.target.value)}
                      aria-label={`${f.label} (editable)`}
                      className={`mt-1 w-full bg-transparent border-0 border-b-2 border-dashed px-0.5 py-1.5 text-sm font-semibold outline-none transition-colors min-h-[40px] ${dirty ? 'border-seal text-seal-700 bg-seal-50/60' : 'border-paper-400 focus:border-ink focus:bg-white/60'}`}
                    />
                    <span className="text-[10px] text-ink-600/70">{f.hint}</span>
                  </label>
                );
              })}
            </div>

            {/* Rubber stamp */}
            <div className="relative mt-4 flex items-end justify-between gap-3 min-h-[96px]">
              <p className="text-[11px] text-ink-600 max-w-[60%]">
                Checked in your browser with TULA's public key, the same way a buyer's phone checks a scanned QR.
              </p>
              {state !== 'checking' && (
                <div key={state} className={`stamp-in shrink-0 w-[104px] h-[104px] rounded-full border-[3px] flex items-center justify-center ${ok ? 'border-verify text-verify' : 'border-seal text-seal'}`} style={{ transform: 'rotate(-14deg)' }}>
                  <div className={`w-[88px] h-[88px] rounded-full border flex flex-col items-center justify-center text-center ${ok ? 'border-verify' : 'border-seal'}`}>
                    {ok ? <ShieldCheck className="w-5 h-5" /> : <ShieldX className="w-5 h-5" />}
                    <span className="font-readout font-bold text-[13px] tracking-[0.12em] mt-0.5">{ok ? 'GENUINE' : 'FORGED'}</span>
                    <span className="font-readout text-[8px] tracking-[0.1em]">{ok ? 'SIGNATURE OK' : 'SIG. MISMATCH'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Result line */}
      <div className={`mt-3 rounded-lg px-4 py-3 flex items-center justify-between gap-3 text-sm transition-colors ${ok ? 'bg-verify text-white' : state === 'checking' ? 'bg-ink-700 text-paper' : 'bg-seal text-white'}`} aria-live="polite">
        <p>
          <strong>{state === 'checking' ? 'Checking…' : ok ? 'Genuine. ' : 'Rejected. '}</strong>
          {state === 'checking' ? '' : ok ? 'The signature matches every field.' : `You changed ${changed.join(', ').toLowerCase()}, so the signature no longer matches.`}
        </p>
        {ok ? (
          <Link to={`/verify/${encodeURIComponent(ORIGINAL.n)}`} className="shrink-0 inline-flex items-center gap-1 font-bold underline-offset-2 hover:underline">Open it <ArrowRight className="w-4 h-4" /></Link>
        ) : state === 'rejected' && (
          <button onClick={() => setValues({ ...ORIGINAL })} className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-md bg-white/15 hover:bg-white/25 text-xs font-bold min-h-[36px]">
            <RotateCcw className="w-3.5 h-3.5" /> Undo
          </button>
        )}
      </div>
      {attempts >= 2 && (
        <p className="mt-2 text-xs text-paper/70">{attempts} forgery attempts, {attempts} caught.</p>
      )}
    </div>
  );
};
