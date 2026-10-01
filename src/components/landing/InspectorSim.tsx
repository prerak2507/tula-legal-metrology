import React, { useState } from 'react';
import { weighingMpeKg } from '../../services/rulesEngine';
import { CheckCircle2, XCircle } from 'lucide-react';

// A 150 kg Class III shop scale, e = 20 g. The limit comes from the same OIML R 76 table the
// officer app uses, so the verdict here is the one the app would record.
const MAX = 150;
const E = 0.02;
const RANGE = 60; // gauge spans -60 g to +60 g

export const InspectorSim: React.FC = () => {
  const [load, setLoad] = useState(100);
  const [drift, setDrift] = useState(8); // grams the scale reads heavy (+) or light (-)

  const reading = load + drift / 1000;
  const limitKg = weighingMpeKg(load, E, 'CLASS_III');
  const pass = Math.abs(drift / 1000) <= limitKg + 1e-9;
  const limitG = Math.round(limitKg * 1000);
  const pos = (g: number) => `${((g + RANGE) / (RANGE * 2)) * 100}%`;

  return (
    <div className="grid lg:grid-cols-[5fr_7fr] gap-5 items-stretch font-plex">
      {/* Controls */}
      <div className="rounded-lg bg-paper-50 border border-paper-300 p-5 sm:p-6 space-y-6">
        <div>
          <label htmlFor="sim-load" className="flex justify-between items-baseline text-sm font-semibold text-ink">
            <span>Test weight placed</span><span className="font-readout text-base">{load} kg</span>
          </label>
          <input id="sim-load" type="range" min={1} max={MAX} value={load} onChange={e => setLoad(Number(e.target.value))} className="w-full accent-ink mt-3 h-6" />
        </div>
        <div>
          <label htmlFor="sim-drift" className="flex justify-between items-baseline text-sm font-semibold text-ink">
            <span>How far off the scale is</span><span className="font-readout text-base">{drift > 0 ? '+' : ''}{drift} g</span>
          </label>
          <input id="sim-drift" type="range" min={-RANGE} max={RANGE} value={drift} onChange={e => setDrift(Number(e.target.value))} className="w-full accent-brass mt-3 h-6" />
          <p className="text-xs text-ink-600 mt-1">Slide right and the shop scale reads heavy. That is how a buyer loses.</p>
        </div>
        <p className="text-xs text-ink-600 border-t border-paper-300 pt-4">150 kg platform scale, accuracy Class III, e = 20 g. Limits from OIML R 76, as adopted in the Legal Metrology rules.</p>
      </div>

      {/* Instrument panel */}
      <div className="rounded-lg bg-ink text-paper p-5 sm:p-6 flex flex-col gap-5" aria-live="polite">
        <div className="grid grid-cols-3 gap-3">
          {[['Scale shows', reading.toFixed(3), 'kg'], ['Error', `${drift > 0 ? '+' : ''}${drift}`, 'g'], ['Legal limit', `±${limitG}`, 'g at this load']].map(([k, v, u]) => (
            <div key={k} className="rounded-md bg-ink-900 border border-ink-700 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-paper/60">{k}</p>
              <p className="font-readout text-xl sm:text-3xl font-semibold text-brass-300 tabular-nums mt-1">{v}</p>
              <p className="text-[11px] text-paper/50">{u}</p>
            </div>
          ))}
        </div>

        {/* Tolerance gauge */}
        <div>
          <div className="relative h-12 rounded-md bg-ink-900 border border-ink-700 overflow-hidden">
            <div className="absolute inset-y-0 bg-verify/40 border-x-2 border-verify transition-all duration-300"
              style={{ left: pos(-limitG), width: `calc(${pos(limitG)} - ${pos(-limitG)})` }} />
            <div className="absolute inset-y-0 w-px bg-paper/30" style={{ left: pos(0) }} />
            <div className={`absolute top-1 bottom-1 w-1 rounded-full transition-all duration-150 ${pass ? 'bg-paper' : 'bg-seal'}`}
              style={{ left: `calc(${pos(drift)} - 2px)` }} />
          </div>
          <div className="flex justify-between font-readout text-[10px] text-paper/50 mt-1">
            <span>−60 g</span><span>light</span><span>0</span><span>heavy</span><span>+60 g</span>
          </div>
        </div>

        <div className={`mt-auto flex items-start gap-3 rounded-md p-4 transition-colors ${pass ? 'bg-verify' : 'bg-seal'}`}>
          {pass ? <CheckCircle2 className="w-7 h-7 shrink-0" /> : <XCircle className="w-7 h-7 shrink-0" />}
          <div>
            <p className="font-semibold text-base">{pass ? 'Pass. A certificate can be issued.' : 'Fail. TULA will not issue a certificate.'}</p>
            <p className="text-sm text-white/85">{pass ? 'The pass option unlocks only when every reading is inside the green band.' : 'The pass option stays locked. The owner is told to get it repaired and re-tested.'}</p>
          </div>
        </div>
        <p className="text-xs text-paper/60">The band changes with the weight: ±10 g up to 10 kg, ±20 g up to 40 kg, ±30 g above. Officers never look it up.</p>
      </div>
    </div>
  );
};
