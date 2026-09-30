import React, { useState } from 'react';
import { weighingMpeKg } from '../../services/rulesEngine';
import { CheckCircle2, XCircle } from 'lucide-react';

// A 150 kg Class III shop scale, e = 20 g. The limit comes from the same OIML R 76 table the
// officer app uses, so the verdict here is the one the app would record.
const MAX = 150;
const E = 0.02;

export const InspectorSim: React.FC = () => {
  const [load, setLoad] = useState(100);
  const [drift, setDrift] = useState(8); // grams the scale reads heavy (+) or light (-)

  const reading = load + drift / 1000;
  const limitKg = weighingMpeKg(load, E, 'CLASS_III');
  const pass = Math.abs(drift / 1000) <= limitKg + 1e-9;
  const limitG = Math.round(limitKg * 1000);

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6 items-stretch">
      <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-5">
        <div>
          <label htmlFor="sim-load" className="flex justify-between text-sm font-bold text-slate-800">
            <span>Test weight placed</span><span className="font-mono">{load} kg</span>
          </label>
          <input id="sim-load" type="range" min={1} max={MAX} value={load} onChange={e => setLoad(Number(e.target.value))} className="w-full accent-gov-700 mt-2" />
        </div>
        <div>
          <label htmlFor="sim-drift" className="flex justify-between text-sm font-bold text-slate-800">
            <span>How far off the scale is</span><span className="font-mono">{drift > 0 ? '+' : ''}{drift} g</span>
          </label>
          <input id="sim-drift" type="range" min={-60} max={60} value={drift} onChange={e => setDrift(Number(e.target.value))} className="w-full accent-amber-600 mt-2" />
          <p className="text-xs text-slate-500 mt-1">Slide right to make the shop scale read heavy, which is how a buyer loses.</p>
        </div>
        <p className="text-xs text-slate-500">150 kg platform scale, accuracy Class III, e = 20 g. Limits from OIML R 76, as adopted in the Legal Metrology rules.</p>
      </div>

      <div className={`rounded-2xl p-5 text-white flex flex-col justify-between transition-colors ${pass ? 'bg-emerald-700' : 'bg-rose-700'}`} aria-live="polite">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-[11px] uppercase tracking-wide text-white/70">Scale shows</p><p className="font-mono text-2xl font-black">{reading.toFixed(3)}</p><p className="text-xs text-white/70">kg</p></div>
          <div><p className="text-[11px] uppercase tracking-wide text-white/70">Error</p><p className="font-mono text-2xl font-black">{drift > 0 ? '+' : ''}{drift}</p><p className="text-xs text-white/70">g</p></div>
          <div><p className="text-[11px] uppercase tracking-wide text-white/70">Legal limit</p><p className="font-mono text-2xl font-black">±{limitG}</p><p className="text-xs text-white/70">g at this load</p></div>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/10 p-3">
          {pass ? <CheckCircle2 className="w-8 h-8 shrink-0" /> : <XCircle className="w-8 h-8 shrink-0" />}
          <div>
            <p className="font-extrabold text-lg">{pass ? 'Pass: certificate can be issued' : 'Fail: TULA will not issue a certificate'}</p>
            <p className="text-sm text-white/80">{pass ? 'Every reading must be inside the limit before the pass option unlocks.' : 'The pass option stays locked. The owner is told to get it repaired and re-tested.'}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/70">Notice the limit changes with the weight: ±10 g up to 10 kg, ±20 g up to 40 kg, ±30 g above. Officers never have to look it up.</p>
      </div>
    </div>
  );
};
