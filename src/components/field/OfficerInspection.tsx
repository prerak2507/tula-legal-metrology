import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { storage, WorkflowError } from '../../services/storage';
import { Application, InspectionChecklistItem, InspectionRecord, TestReadingRow, StampingRecord } from '../../types';
import { evaluateReading, recommendVerdict, sampleObservedValue } from '../../services/rulesEngine';
import {
  Smartphone, Wifi, WifiOff, Camera, MapPin, CheckCircle2, AlertTriangle, Scale, ShieldCheck, Trash2, Loader2, Info, RefreshCw,
} from 'lucide-react';

type Photo = InspectionRecord['evidencePhotos'][number];
type Decision = 'PASS' | 'ADJUSTMENT_REQUIRED' | 'RETEST_REQUIRED' | 'FAIL';

interface Draft {
  checklist: InspectionChecklistItem[];
  readings: TestReadingRow[];
  photos: Photo[];
  remarks: string;
  decision: Decision | '';
  adjustment: string;
  stampType: StampingRecord['stampType'];
  declared: boolean;
}

const draftKey = (appId: string) => `lm_inspection_draft_v2_${appId}`;

function loadDraft(appId: string): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(appId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Resizes a camera photo so it fits in device storage (~100-200 KB). */
function compressImage(file: File, maxSide = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read the photo.')); };
    img.src = url;
  });
}

const CHECK_OPTIONS: { value: InspectionChecklistItem['status']; label: string; on: string }[] = [
  { value: 'PASS', label: 'OK', on: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'ADJUSTMENT_REQUIRED', label: 'Adjust', on: 'bg-amber-500 text-white border-amber-500' },
  { value: 'FAIL', label: 'Fail', on: 'bg-rose-600 text-white border-rose-600' },
  { value: 'NOT_APPLICABLE', label: 'N/A', on: 'bg-slate-600 text-white border-slate-600' },
];

export const OfficerInspection: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = storage.getCurrentUser();
  const [online, setOnline] = useState(navigator.onLine);
  const [jobs, setJobs] = useState<Application[]>([]);
  const [appId, setAppId] = useState(params.get('applicationId') || '');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsState, setGpsState] = useState<'idle' | 'locating' | 'ok' | 'denied' | 'unavailable'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queuedMsg, setQueuedMsg] = useState<string | null>(null);
  // Practice run on an already-completed job: the full screen works, nothing is saved.
  const [practice, setPractice] = useState(false);
  const [practiceMsg, setPracticeMsg] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState(storage.getOfflineQueue().length);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const refresh = () => {
      const mine = storage.getApplications().filter(a => a.assignedToId === user.id);
      setJobs(mine);
      setQueueCount(storage.getOfflineQueue().length);
    };
    refresh();
    const unsub = storage.subscribe(refresh);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); unsub(); };
  }, [user.id]);

  const openJobs = jobs.filter(a => ['ASSIGNED', 'SCHEDULED', 'INSPECTION_IN_PROGRESS', 'RETEST_REQUIRED'].includes(a.status));
  const doneJobs = jobs.filter(a => ['COMPLETED', 'INSPECTED_PENDING_SYNC', 'ADJUSTMENT_REQUIRED', 'REJECTED'].includes(a.status));

  useEffect(() => {
    if (!appId && openJobs.length) setAppId(openJobs[0].id);
  }, [openJobs.length]);

  const app = jobs.find(a => a.id === appId);
  const inst = app ? storage.getInstrumentById(app.instrumentId) : undefined;
  const editable = !!app && (practice || ['ASSIGNED', 'SCHEDULED', 'INSPECTION_IN_PROGRESS', 'RETEST_REQUIRED'].includes(app.status));

  // Load the saved draft or start a fresh one for the selected job.
  useEffect(() => {
    if (!appId) { setDraft(null); return; }
    const saved = practice ? null : loadDraft(appId);
    if (saved) { setDraft(saved); return; }
    const fresh = storage.newInspectionDraft(appId);
    if (!fresh) { setDraft(null); return; }
    setDraft({ checklist: fresh.checklist, readings: fresh.readings, photos: [], remarks: '', decision: '', adjustment: '', stampType: 'LEAD_WIRE_SEAL', declared: false });
  }, [appId, practice]);

  // Autosave the draft on the device, so a reload or dead network loses nothing.
  useEffect(() => {
    if (!appId || !draft || !editable || practice) return;
    try { localStorage.setItem(draftKey(appId), JSON.stringify(draft)); } catch { /* storage full */ }
  }, [draft, appId, editable]);

  const captureLocation = () => {
    if (!('geolocation' in navigator)) { setGpsState('unavailable'); return; }
    setGpsState('locating');
    navigator.geolocation.getCurrentPosition(
      p => { setGps({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }); setGpsState('ok'); },
      err => { setGps(null); setGpsState(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };
  useEffect(() => { if (appId) captureLocation(); }, [appId]);

  const distanceM = useMemo(() => {
    if (!gps || inst?.latitude === undefined || inst?.longitude === undefined) return undefined;
    const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(inst.latitude - gps.lat), dLon = toRad(inst.longitude - gps.lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(gps.lat)) * Math.cos(toRad(inst.latitude)) * Math.sin(dLon / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(a)));
  }, [gps, inst]);

  const verdict = useMemo(() => (draft ? recommendVerdict(draft.checklist, draft.readings) : null), [draft]);

  if (!draft && openJobs.length === 0 && doneJobs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
        <Smartphone className="w-10 h-10 text-slate-300 mx-auto" />
        <h1 className="font-bold text-slate-900">No inspections assigned to you</h1>
        <p className="text-sm text-slate-500">When the district office assigns you a job it appears here, and you can work on it without a network.</p>
        <Link to="/applications" className="inline-block mt-2 text-sm font-semibold text-gov-700 underline">View applications</Link>
      </div>
    );
  }

  const update = (patch: Partial<Draft>) => setDraft(d => (d ? { ...d, ...patch } : d));
  const setCheck = (id: string, status: InspectionChecklistItem['status']) =>
    update({ checklist: draft!.checklist.map(c => (c.id === id ? { ...c, status } : c)) });
  const setReading = (id: string, value: string) =>
    update({ readings: draft!.readings.map(r => (r.id === id ? evaluateReading(r, value) : r)) });
  const fillSample = () => update({ readings: draft!.readings.map((r, i) => evaluateReading(r, sampleObservedValue(r, 0.3 + (i % 5) * 0.1))) });

  const addPhoto = async (e: React.ChangeEvent<HTMLInputElement>, type: Photo['type'], caption: string) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await compressImage(file);
      update({ photos: [...draft!.photos, { id: `ph-${Date.now()}`, caption, url, type, timestamp: new Date().toISOString(), source: 'CAMERA' }] });
    } catch (err) {
      setError((err as Error).message);
    }
  };
  const addSamplePhoto = () => update({
    photos: [...draft!.photos, { id: `ph-${Date.now()}`, caption: 'Demo sample photo (no camera)', url: '/tula-logo.png', type: 'SEAL_APPLIED', timestamp: new Date().toISOString(), source: 'DEMO_SAMPLE' }],
  });

  const submit = async () => {
    if (!app || !draft) return;
    setError(null);
    if (!draft.decision) { setError('Choose a decision.'); return; }
    if (!draft.declared) { setError('Confirm the declaration before submitting.'); return; }
    if (practice) {
      setPracticeMsg(`Practice result: ${draft.decision.replace(/_/g, ' ').toLowerCase()}. Nothing was saved. On a real job this would ${draft.decision === 'PASS' ? 'issue and sign the certificate' : 'go back to the owner with your instructions'}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await storage.submitInspection({
        applicationId: app.id,
        checklist: draft.checklist,
        testReadings: draft.readings,
        evidencePhotos: draft.photos,
        inspectorRemarks: draft.remarks,
        result: draft.decision,
        adjustmentDetails: draft.adjustment,
        stampType: draft.stampType,
        gps,
      });
      try { localStorage.removeItem(draftKey(app.id)); } catch { /* ignore */ }
      if (res.queued) {
        setQueuedMsg(`${app.id} saved on this phone. The certificate will be issued and signed automatically when you are back online.`);
      } else if (res.certificate) {
        navigate(`/certificates/${res.certificate.id}`);
      } else {
        navigate(`/applications/${app.id}`);
      }
    } catch (e) {
      setError(e instanceof WorkflowError || e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const allowedDecisions: { value: Decision; label: string; enabled: boolean }[] = [
    { value: 'PASS', label: 'Pass: stamp and issue certificate', enabled: verdict?.verdict === 'PASS' },
    { value: 'ADJUSTMENT_REQUIRED', label: 'Adjustment required', enabled: true },
    { value: 'RETEST_REQUIRED', label: 'Re-test needed', enabled: true },
    { value: 'FAIL', label: 'Fail: not fit for trade', enabled: true },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24">
      {/* Status bar */}
      <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-amber-500 rounded-lg text-slate-900"><Smartphone className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-base">Field inspection</h1>
            <p className="text-xs text-slate-400 truncate">{user.fullName} • {user.badgeNumber || user.gatcCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          {online ? <span className="inline-flex items-center gap-1 text-emerald-400"><Wifi className="w-4 h-4" /> Online</span>
            : <span className="inline-flex items-center gap-1 text-rose-300"><WifiOff className="w-4 h-4" /> Offline: work is saved on this phone</span>}
          {queueCount > 0 && (
            <button onClick={() => storage.syncPending()} disabled={!online} className="inline-flex items-center gap-1 bg-amber-500 text-slate-900 px-2 py-1 rounded disabled:opacity-60">
              <RefreshCw className="w-3 h-3" /> {queueCount} waiting to sync
            </button>
          )}
        </div>
      </div>

      {queuedMsg && (
        <div role="status" className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-sm text-amber-900 flex gap-2">
          <WifiOff className="w-5 h-5 shrink-0" /><span>{queuedMsg}</span>
        </div>
      )}

      {practiceMsg && (
        <div role="status" className="p-4 rounded-xl bg-gov-50 border border-gov-300 text-sm text-gov-900 flex gap-2">
          <Info className="w-5 h-5 shrink-0" /><span>{practiceMsg}</span>
        </div>
      )}

      {openJobs.length === 0 && doneJobs.length > 0 && !practice && (
        <section className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-sm text-amber-950 space-y-3">
          <p><strong>No open jobs right now.</strong> Try the inspection screen on {doneJobs[0].instrumentId} as a practice run (nothing is saved), or run the live demo to get a real job assigned to you in about two minutes.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" onClick={() => { setPractice(true); setPracticeMsg(null); setError(null); setAppId(doneJobs[0].id); }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gov-700 text-white font-bold min-h-[44px]">
              <Smartphone className="w-4 h-4" /> Practice an inspection
            </button>
            <Link to="/demo" className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-white border border-amber-400 font-bold min-h-[44px]">Run the live demo</Link>
          </div>
        </section>
      )}

      {/* Job picker */}
      <section className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Your jobs ({openJobs.length} open)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[...openJobs, ...doneJobs].map(a => (
            <button key={a.id} type="button" onClick={() => { setPractice(false); setPracticeMsg(null); setAppId(a.id); setQueuedMsg(null); setError(null); }}
              className={`p-3 rounded-lg border text-left min-h-[64px] ${a.id === appId ? 'border-gov-700 bg-gov-50 ring-2 ring-gov-600/20' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-xs text-gov-800">{a.id}</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">{a.status.replace(/_/g, ' ').toLowerCase()}</span>
              </div>
              <p className="text-xs text-slate-800 mt-1 line-clamp-1">{a.organization}</p>
              <p className="text-[11px] text-slate-500 line-clamp-1">{a.scheduledDate ? `${a.scheduledDate}, ${a.scheduledTimeSlot}` : a.location}</p>
            </button>
          ))}
        </div>
      </section>

      {app && inst && draft && (
        !editable ? (
          <div className="bg-white p-5 rounded-xl border border-slate-200 text-sm text-slate-700 space-y-2">
            <p><strong>{app.id}</strong> is {app.status.replace(/_/g, ' ').toLowerCase()}.</p>
            <Link to={`/applications/${app.id}`} className="text-gov-700 font-semibold underline">Open the application</Link>
          </div>
        ) : (
          <>
            {practice && (
              <p className="p-3 rounded-lg bg-gov-50 border border-gov-200 text-xs text-gov-900 font-semibold">Practice run on {app.id}. Everything works the same, but nothing is saved or issued.</p>
            )}
            {/* Instrument + location */}
            <section className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono font-bold text-gov-800">{inst.id}</span>
                  <h3 className="font-bold text-slate-900">{inst.categoryName}</h3>
                  <p className="text-xs text-slate-600">{inst.manufacturer} {inst.model} • SN {inst.serialNumber} • {inst.capacity} • {inst.scaleInterval}</p>
                  <p className="text-xs text-slate-500">{inst.organization}, {inst.installationAddress}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2 bg-slate-50 border-slate-200">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gov-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Location</p>
                    {gpsState === 'locating' && <p className="text-slate-600">Getting GPS fix…</p>}
                    {gpsState === 'ok' && gps && (
                      <p className="text-slate-700 font-mono">{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)} (±{Math.round(gps.accuracy)} m)
                        {distanceM !== undefined && <span className={`ml-1 font-sans font-bold ${distanceM <= 500 ? 'text-emerald-700' : 'text-amber-700'}`}>{distanceM <= 500 ? 'On site' : `${(distanceM / 1000).toFixed(1)} km from registered site`}</span>}
                      </p>
                    )}
                    {(gpsState === 'denied' || gpsState === 'unavailable') && <p className="text-amber-700">Location not captured ({gpsState === 'denied' ? 'permission denied' : 'GPS unavailable'}). It will be recorded as not captured.</p>}
                  </div>
                </div>
                <button type="button" onClick={captureLocation} className="px-3 py-2 rounded-lg bg-white border border-slate-300 font-semibold min-h-[40px]">Refresh</button>
              </div>
            </section>

            {/* Checklist */}
            <section className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-gov-700" /> Checklist</h3>
                <span className="text-xs text-slate-500">{draft.checklist.filter(c => c.status !== 'NOT_CHECKED').length}/{draft.checklist.length} checked</span>
              </div>
              {draft.checklist.map((c, i) => (
                <div key={c.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <p className="text-sm text-slate-900"><span className="font-bold">{i + 1}.</span> {c.label}</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CHECK_OPTIONS.map(o => (
                      <button key={o.value} type="button" onClick={() => setCheck(c.id, o.value)}
                        className={`py-2 min-h-[44px] rounded-lg border text-xs font-bold ${c.status === o.value ? o.on : 'bg-white border-slate-300 text-slate-700'}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* Readings */}
            <section className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5"><Scale className="w-4 h-4 text-gov-700" /> Test readings</h3>
                <button type="button" onClick={fillSample} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-dashed border-slate-400 text-slate-600" title="For demos without test weights">Fill sample readings (demo)</button>
              </div>
              <p className="text-[11px] text-slate-500">Type what the instrument shows. Error and pass / fail are calculated against the limit. {draft.readings[0]?.mpeRule && <>Limits: {draft.readings[0].mpeRule}.</>}</p>
              {draft.readings.map(r => (
                <div key={r.id} className={`p-3 rounded-lg border ${r.result === 'FAIL' ? 'border-rose-300 bg-rose-50' : r.result === 'PASS' ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p className="text-sm font-bold text-slate-900">{r.testName}</p>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${r.result === 'PASS' ? 'bg-emerald-600 text-white' : r.result === 'FAIL' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {r.result === 'PENDING' ? 'Not entered' : r.result}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs items-end">
                    <div><span className="block text-slate-500">Test load</span><span className="font-mono font-bold">{r.standardValue}</span></div>
                    <label className="block">
                      <span className="block text-slate-500">Reading ({r.unit})</span>
                      <input type="text" inputMode="decimal" value={r.observedValue} onChange={e => setReading(r.id, e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 font-mono text-sm min-h-[44px]" aria-label={`Reading for ${r.testName}`} />
                    </label>
                    <div><span className="block text-slate-500">Error</span><span className="font-mono">{r.error || '—'}</span></div>
                    <div><span className="block text-slate-500">Limit (MPE)</span><span className="font-mono">{r.permissibleTolerance}</span></div>
                  </div>
                </div>
              ))}
            </section>

            {/* Photos */}
            <section className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5"><Camera className="w-4 h-4 text-gov-700" /> Photos</h3>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg bg-gov-700 text-white text-xs font-bold cursor-pointer min-h-[48px]">
                  <Camera className="w-4 h-4" /> Nameplate
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={e => addPhoto(e, 'NAMEPLATE_SERIAL', 'Nameplate and serial number')} />
                </label>
                <label className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg bg-gov-700 text-white text-xs font-bold cursor-pointer min-h-[48px]">
                  <Camera className="w-4 h-4" /> Seal applied
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={e => addPhoto(e, 'SEAL_APPLIED', 'Verification seal after stamping')} />
                </label>
              </div>
              <button type="button" onClick={addSamplePhoto} className="text-[11px] font-semibold text-slate-600 underline">No camera? Add a demo sample photo</button>
              {draft.photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {draft.photos.map(p => (
                    <figure key={p.id} className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                      <img src={p.url} alt={p.caption} className="w-full h-28 object-cover" />
                      <figcaption className="p-1.5 text-[10px] text-slate-700">{p.caption}<br /><span className="text-slate-400">{new Date(p.timestamp).toLocaleTimeString('en-IN')}{p.source === 'DEMO_SAMPLE' ? ' • demo' : ''}</span></figcaption>
                      <button type="button" onClick={() => update({ photos: draft.photos.filter(x => x.id !== p.id) })} className="absolute top-1 right-1 p-1.5 rounded bg-white/90 text-rose-600" aria-label="Remove photo"><Trash2 className="w-3.5 h-3.5" /></button>
                    </figure>
                  ))}
                </div>
              )}
            </section>

            {/* Decision */}
            <section className="bg-white p-4 rounded-xl border-2 border-gov-700 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-gov-700" /> Decision</h3>
              {verdict && (
                <div className={`p-3 rounded-lg text-xs border ${verdict.verdict === 'PASS' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : verdict.verdict === 'INCOMPLETE' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                  <p className="font-bold flex items-center gap-1.5"><Info className="w-4 h-4" /> Calculated result: {verdict.verdict.replace(/_/g, ' ').toLowerCase()}</p>
                  <ul className="mt-1 list-disc pl-5 space-y-0.5">{verdict.reasons.slice(0, 4).map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              )}
              <div className="grid grid-cols-1 gap-2">
                {allowedDecisions.map(d => (
                  <label key={d.value} className={`flex items-center gap-2 p-3 rounded-lg border text-sm min-h-[48px] ${!d.enabled ? 'opacity-40' : draft.decision === d.value ? 'border-gov-700 bg-gov-50' : 'border-slate-200'}`}>
                    <input type="radio" name="decision" disabled={!d.enabled} checked={draft.decision === d.value} onChange={() => update({ decision: d.value })} />
                    <span className="font-semibold">{d.label}</span>
                    {!d.enabled && <span className="text-[11px] text-slate-500">(needs all checks and readings to pass)</span>}
                  </label>
                ))}
              </div>
              {draft.decision === 'PASS' && (
                <label className="block text-xs">
                  <span className="font-semibold text-slate-700">Seal type</span>
                  <select value={draft.stampType} onChange={e => update({ stampType: e.target.value as StampingRecord['stampType'] })} className="mt-1 w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm">
                    <option value="LEAD_WIRE_SEAL">Lead wire seal with quarter mark</option>
                    <option value="TAMPER_EVIDENT_BARCODE_SEAL">Tamper-evident barcode seal</option>
                    <option value="HOLOGRAM_SECURITY_SEAL">Hologram security seal</option>
                  </select>
                </label>
              )}
              {draft.decision && draft.decision !== 'PASS' && (
                <label className="block text-xs">
                  <span className="font-semibold text-slate-700">What must the owner do?</span>
                  <textarea rows={2} value={draft.adjustment} onChange={e => update({ adjustment: e.target.value })} className="mt-1 w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="e.g. Recalibrate span by a licensed repairer, then re-apply" />
                </label>
              )}
              <label className="block text-xs">
                <span className="font-semibold text-slate-700">Remarks *</span>
                <textarea rows={2} value={draft.remarks} onChange={e => update({ remarks: e.target.value })} className="mt-1 w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Anything the office should know" />
              </label>
              <label className="flex items-start gap-2 text-xs text-slate-800">
                <input type="checkbox" checked={draft.declared} onChange={e => update({ declared: e.target.checked })} className="mt-0.5 w-5 h-5" />
                <span>I physically inspected and tested this instrument on site, and the readings above are what I observed.</span>
              </label>
              {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</p>}
              <button type="button" onClick={submit} disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 bg-gov-700 hover:bg-gov-800 text-white font-extrabold py-3.5 rounded-lg text-sm disabled:opacity-50">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                {submitting ? 'Saving…' : practice ? 'Check my result (practice)' : !online ? 'Save offline' : draft.decision === 'PASS' ? 'Submit and issue certificate' : 'Submit result'}
              </button>
              <p className="text-[11px] text-slate-500 text-center">Draft is saved on this phone as you type.</p>
            </section>
          </>
        )
      )}
    </div>
  );
};
