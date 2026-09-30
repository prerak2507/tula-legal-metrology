import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import jsQR from 'jsqr';
import { storage } from '../services/storage';
import { SEED_SIGNATURES } from '../data/seedSignatures';
import { verifySignedQr, parseQrText, tamperPayload, SignatureCheck, SignedPayload } from '../services/certSigning';
import { checkRevocation, RevocationCheck } from '../services/revocation';
import { cloud, cloudEnabled } from '../services/cloud';
import { VerificationCertificate } from '../types';
import { TulaLogo } from '../components/common/TulaLogo';
import {
  ShieldCheck, ShieldAlert, ShieldX, Search, Camera, Upload, Keyboard, Clock, Flag, Loader2, WifiOff, Info, X, CheckCircle2, LayoutDashboard, Home,
} from 'lucide-react';

type Outcome =
  | { kind: 'GENUINE'; payload: SignedPayload; demoKey: boolean; revocation: RevocationCheck }
  | { kind: 'EXPIRED'; payload: SignedPayload; revocation: RevocationCheck }
  | { kind: 'REVOKED'; payload?: SignedPayload; cert?: VerificationCertificate; revocation: RevocationCheck }
  | { kind: 'TAMPERED'; reason: string; claimedNo?: string }
  | { kind: 'UNKNOWN_KEY'; kid: string }
  | { kind: 'UNSIGNED'; cert: VerificationCertificate }
  | { kind: 'NOT_FOUND'; term: string }
  | { kind: 'ERROR'; reason: string };

const SAMPLE_ID = 'CERT-2026-08912';

export const PublicVerify: React.FC = () => {
  const { certificateId } = useParams<{ certificateId?: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [term, setTerm] = useState(certificateId || '');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [reportOpen, setReportOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const verifySigned = useCallback(async (p: string, s: string): Promise<Outcome> => {
    const check: SignatureCheck = await verifySignedQr(p, s);
    if (check.status === 'TAMPERED') {
      let claimedNo: string | undefined;
      try { claimedNo = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(p.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((p.length + 3) % 4)), c => c.charCodeAt(0)))).n; } catch { /* ignore */ }
      return { kind: 'TAMPERED', reason: check.reason, claimedNo };
    }
    if (check.status === 'MALFORMED') return { kind: 'TAMPERED', reason: check.reason };
    if (check.status === 'UNKNOWN_KEY') return { kind: 'UNKNOWN_KEY', kid: check.kid };
    if (check.status === 'UNSUPPORTED') return { kind: 'ERROR', reason: check.reason };
    const revocation = await checkRevocation(check.payload.id, check.payload.n);
    if (revocation.revoked) return { kind: 'REVOKED', payload: check.payload, revocation };
    if (check.status === 'EXPIRED') return { kind: 'EXPIRED', payload: check.payload, revocation };
    return { kind: 'GENUINE', payload: check.payload, demoKey: check.demoKey, revocation };
  }, []);

  /** Lookup by number: uses the record's own signature when this device has it. */
  const lookup = useCallback(async (raw: string): Promise<Outcome> => {
    const t = raw.trim();
    if (!t) return { kind: 'ERROR', reason: 'Enter a certificate number.' };
    let cert = storage.getCertificateById(t);
    if (!cert && cloudEnabled) {
      // Not on this device: ask the live registry (public, no login).
      const remote = await cloud.publicCertificate(t);
      if (remote?.signedPayload && remote?.signature) return verifySigned(remote.signedPayload, remote.signature);
      if (remote) cert = { ...(remote as unknown as VerificationCertificate) };
    }
    if (!cert) return { kind: 'NOT_FOUND', term: t };
    if (cert.signedPayload && cert.signature) return verifySigned(cert.signedPayload, cert.signature);
    if (cert.status === 'REVOKED') return { kind: 'REVOKED', cert, revocation: { source: 'cached', revoked: { id: cert.id, n: cert.certificateNumber, reason: cert.revocationReason || 'Revoked', at: cert.revokedAt || '' } } };
    return { kind: 'UNSIGNED', cert };
  }, [verifySigned]);

  const handleText = useCallback(async (text: string) => {
    setBusy(true);
    try {
      const { id, p, s } = parseQrText(text);
      const out = p && s ? await verifySigned(p, s) : await lookup(id || text);
      setOutcome(out);
      if (id) setTerm(id);
    } finally {
      setBusy(false);
    }
  }, [lookup, verifySigned]);

  // Deep links: /verify/<no>?p=..&s=.. (what the QR contains) or /verify/<no>
  useEffect(() => {
    const p = search.get('p'), s = search.get('s');
    if (p && s) { setBusy(true); verifySigned(p, s).then(setOutcome).finally(() => setBusy(false)); setTerm(certificateId || ''); return; }
    if (certificateId) { setTerm(certificateId); setTab('manual'); setBusy(true); lookup(certificateId).then(setOutcome).finally(() => setBusy(false)); }
  }, [certificateId, search, lookup, verifySigned]);

  // ----- camera scanning (jsQR on video frames)
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);
  useEffect(() => stopCamera, [stopCamera]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;
    if (video.readyState >= 2) {
      const w = video.videoWidth, h = video.videoHeight;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(video, 0, 0, w, h);
      const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
      if (code?.data) {
        stopCamera();
        void handleText(code.data);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [handleText, stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setCameraError('Camera is blocked or not available. Use "Upload photo" or type the certificate number.');
    }
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      if (code?.data) await handleText(code.data);
      else setOutcome({ kind: 'ERROR', reason: 'No QR code found in that photo. Take a closer, sharper photo of the QR and try again.' });
    } catch {
      setOutcome({ kind: 'ERROR', reason: 'Could not read that image.' });
    } finally {
      setBusy(false);
    }
  };

  const runSample = async (which: 'genuine' | 'tampered' | 'expired' | 'revoked') => {
    stopCamera();
    const sig = which === 'expired' ? SEED_SIGNATURES['CERT-2025-10101'] : which === 'revoked' ? SEED_SIGNATURES['CERT-2025-09999'] : SEED_SIGNATURES[SAMPLE_ID];
    if (!sig) return;
    setBusy(true);
    const p = which === 'tampered' ? tamperPayload(sig.p, 'exp', '2029-12-31') : sig.p;
    setOutcome(await verifySigned(p, sig.s));
    setBusy(false);
  };

  const shown = outcome && 'payload' in outcome ? outcome.payload : undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/" aria-label="TULA home"><TulaLogo variant="full" theme="light" size="sm" /></Link>
          <nav className="flex items-center gap-2">
            <Link to="/" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[40px]"><Home className="w-4 h-4" /><span className="hidden sm:inline">Home</span></Link>
            <Link to="/dashboard" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-gov-800 text-white min-h-[40px]"><LayoutDashboard className="w-4 h-4" /><span className="hidden sm:inline">Portal</span></Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Check an instrument's certificate</h1>
          <p className="text-sm text-slate-600 mt-1">
            Scan the QR on the certificate or seal. The check runs on your phone, needs no login, and works without internet.
          </p>
          {!online && <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1"><WifiOff className="w-3.5 h-3.5" /> Offline: signatures are still checked. Revocations use the last saved list.</p>}
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-3 border-b border-slate-200" role="tablist">
            {([['camera', 'Scan', Camera], ['upload', 'Upload photo', Upload], ['manual', 'Type number', Keyboard]] as const).map(([key, label, Icon]) => (
              <button key={key} role="tab" aria-selected={tab === key} onClick={() => { setTab(key); if (key !== 'camera') stopCamera(); }}
                className={`py-3 min-h-[48px] text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 ${tab === key ? 'text-gov-800 border-b-2 border-gov-700 bg-gov-50/50' : 'text-slate-500'}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <div className="p-4 sm:p-6">
            {tab === 'camera' && (
              <div className="space-y-3">
                <div className="relative mx-auto max-w-sm aspect-square rounded-xl bg-slate-900 overflow-hidden">
                  <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`} />
                  {!cameraOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-300 gap-3">
                      <Camera className="w-10 h-10" />
                      <p className="text-sm">Point the camera at the QR code</p>
                      <button onClick={startCamera} className="px-5 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm">Start camera</button>
                    </div>
                  )}
                  {cameraOn && <div className="absolute inset-8 border-2 border-emerald-400 rounded-xl pointer-events-none" />}
                </div>
                <canvas ref={canvasRef} className="hidden" />
                {cameraOn && <button onClick={stopCamera} className="mx-auto block text-xs font-semibold text-slate-600 underline">Stop camera</button>}
                {cameraError && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">{cameraError}</p>}
              </div>
            )}
            {tab === 'upload' && (
              <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-50 text-center">
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm font-bold text-slate-800">Choose a photo or screenshot of the QR</span>
                <span className="text-xs text-slate-500">The image stays on your device</span>
                <input type="file" accept="image/*" className="sr-only" onChange={onUpload} />
              </label>
            )}
            {tab === 'manual' && (
              <form onSubmit={e => { e.preventDefault(); navigate(`/verify/${encodeURIComponent(term.trim())}`); }} className="flex flex-col sm:flex-row gap-2">
                <label htmlFor="certno" className="sr-only">Certificate number</label>
                <input id="certno" value={term} onChange={e => setTerm(e.target.value)} placeholder="e.g. DL/LM/2026/08912" className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono" />
                <button type="submit" className="px-5 py-3 rounded-xl bg-gov-800 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5"><Search className="w-4 h-4" /> Check</button>
              </form>
            )}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Try a sample</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onClick={() => runSample('genuine')} className="px-3 py-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-bold min-h-[44px]">Genuine</button>
                <button onClick={() => runSample('tampered')} className="px-3 py-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 text-xs font-bold min-h-[44px]">Edited copy</button>
                <button onClick={() => runSample('expired')} className="px-3 py-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold min-h-[44px]">Expired</button>
                <button onClick={() => runSample('revoked')} className="px-3 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-xs font-bold min-h-[44px]">Revoked</button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">"Edited copy" takes the genuine certificate and changes only its expiry date. The signature no longer matches, so the check fails.</p>
            </div>
          </div>
        </section>

        {busy && <div className="flex items-center justify-center gap-2 text-sm text-slate-600 py-6"><Loader2 className="w-5 h-5 animate-spin" /> Checking…</div>}

        {!busy && outcome && (
          <section aria-live="polite" className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {outcome.kind === 'GENUINE' && (
              <Banner tone="green" icon={<ShieldCheck className="w-7 h-7" />} title="Genuine and valid"
                text={`Signed by the issuing authority and valid until ${outcome.payload.exp}. The signature was checked on this device.`} />
            )}
            {outcome.kind === 'EXPIRED' && (
              <Banner tone="amber" icon={<Clock className="w-7 h-7" />} title="Genuine but expired"
                text={`This certificate expired on ${outcome.payload.exp}. The instrument must be re-verified before it is used for trade.`} />
            )}
            {outcome.kind === 'REVOKED' && (
              <Banner tone="red" icon={<ShieldX className="w-7 h-7" />} title="Revoked. Do not rely on this instrument"
                text={`${outcome.revocation.revoked?.reason || 'Revoked by the issuing office'}${outcome.revocation.revoked?.at ? ` (${outcome.revocation.revoked.at})` : ''}.`} />
            )}
            {outcome.kind === 'TAMPERED' && (
              <Banner tone="red" icon={<ShieldAlert className="w-7 h-7" />} title="Fake or edited certificate"
                text={`${outcome.reason}${outcome.claimedNo ? ` It claims to be ${outcome.claimedNo}.` : ''} Report it so the district office can inspect.`} />
            )}
            {outcome.kind === 'UNKNOWN_KEY' && (
              <Banner tone="red" icon={<ShieldAlert className="w-7 h-7" />} title="Not signed by a recognised authority"
                text={`The signing key "${outcome.kid}" is not on TULA's trusted list.`} />
            )}
            {outcome.kind === 'UNSIGNED' && (
              <Banner tone="amber" icon={<Info className="w-7 h-7" />} title="Record found, digital signature pending"
                text="This record exists on this device but has not been signed yet (it was issued while the signing service was unreachable). Treat it as unconfirmed." />
            )}
            {outcome.kind === 'NOT_FOUND' && (
              <Banner tone="red" icon={<ShieldAlert className="w-7 h-7" />} title="No certificate found"
                text={`Nothing matches "${outcome.term}". A certificate printed on an instrument should scan as a QR. If this number came from a seal or sticker, report it.`} />
            )}
            {outcome.kind === 'ERROR' && <Banner tone="slate" icon={<Info className="w-7 h-7" />} title="Could not check" text={outcome.reason} />}

            {(shown || (outcome.kind === 'UNSIGNED' && outcome.cert)) && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 p-5 text-sm">
                {(shown ? [
                  ['Certificate', shown.n], ['Instrument ID', shown.iu], ['Instrument', shown.cat], ['Capacity / class', `${shown.cap} • ${shown.cls}`],
                  ['Serial number', shown.sn], ['Owner', `${shown.org} (${shown.own})`], ['Place', `${shown.dist}, ${shown.st}`],
                  ['Verified on', shown.dt], ['Valid until', shown.exp], ['Seal', shown.sid], ['Verified by', `${shown.off} (${shown.auth})`],
                ] : [
                  ['Certificate', outcome.kind === 'UNSIGNED' ? outcome.cert.certificateNumber : ''], ['Instrument', outcome.kind === 'UNSIGNED' ? outcome.cert.instrumentType : ''],
                  ['Owner', outcome.kind === 'UNSIGNED' ? outcome.cert.organization : ''], ['Valid until', outcome.kind === 'UNSIGNED' ? outcome.cert.validUntil : ''],
                ]).map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-semibold text-slate-900 break-words">{v}</dd></div>
                ))}
              </dl>
            )}

            {shown && (
              <div className="px-5 pb-4 text-[11px] text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ECDSA P-256 signature, key {shown.kid}, signed {shown.iat.slice(0, 10)}{outcome.kind === 'GENUINE' && outcome.demoKey ? ' (prototype demo key)' : ''}.</p>
                {'revocation' in outcome && (
                  <p>Revocation list: {outcome.revocation.source === 'live' ? 'checked online just now' : outcome.revocation.source === 'cached' ? `saved copy from ${outcome.revocation.listUpdated?.slice(0, 10) || 'earlier'}` : 'not available on this device yet'}.</p>
                )}
              </div>
            )}

            <div className="border-t border-slate-100 p-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between bg-slate-50">
              <p className="text-xs text-slate-600">Weight or reading looks wrong, seal broken, or certificate expired?</p>
              <button onClick={() => setReportOpen(true)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold min-h-[44px]">
                <Flag className="w-4 h-4" /> Report a problem
              </button>
            </div>
          </section>
        )}

        <section className="text-xs text-slate-600 bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <p className="font-bold text-slate-800">Your right as a buyer</p>
          <p>Every scale, fuel pump or meter used for trade must be verified and stamped under the Legal Metrology Act, 2009. You can ask the seller to show the certificate.</p>
        </section>
      </main>

      {reportOpen && (
        <ReportModal
          onClose={() => setReportOpen(false)}
          context={shown ? { certNo: shown.n, instrumentId: shown.iu, org: shown.org, owner: shown.own, state: shown.st, district: shown.dist } : outcome && outcome.kind === 'TAMPERED' ? { certNo: outcome.claimedNo || 'unknown' } : { certNo: term }}
        />
      )}
    </div>
  );
};

const Banner: React.FC<{ tone: 'green' | 'amber' | 'red' | 'slate'; icon: React.ReactNode; title: string; text: string }> = ({ tone, icon, title, text }) => {
  const cls = { green: 'bg-emerald-600', amber: 'bg-amber-500', red: 'bg-rose-600', slate: 'bg-slate-600' }[tone];
  return (
    <div className={`${cls} text-white p-5 flex items-start gap-3`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <h2 className="text-lg font-extrabold">{title}</h2>
        <p className="text-sm text-white/90 mt-0.5">{text}</p>
      </div>
    </div>
  );
};

const ReportModal: React.FC<{ onClose: () => void; context: { certNo: string; instrumentId?: string; org?: string; owner?: string; state?: string; district?: string } }> = ({ onClose, context }) => {
  const [issue, setIssue] = useState<'BROKEN_SEAL' | 'SHORT_WEIGHT' | 'EXPIRED' | 'FAKE_CERTIFICATE'>('SHORT_WEIGHT');
  const [place, setPlace] = useState('');
  const [details, setDetails] = useState('');
  const [phone, setPhone] = useState('');
  const [caseId, setCaseId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place.trim() && !context.org) { setErr('Tell us where the shop or pump is.'); return; }
    if (details.trim().length < 10) { setErr('Describe what happened in a sentence or two.'); return; }
    const categories = { BROKEN_SEAL: 'TAMPERED_SEAL', SHORT_WEIGHT: 'EXCEEDED_MPE_ERROR', EXPIRED: 'UNVERIFIED_USE', FAKE_CERTIFICATE: 'NON_DISPLAY_OF_CERTIFICATE' } as const;
    if (cloudEnabled && navigator.onLine) {
      try {
        const id = await cloud.reportProblem({
          businessName: context.org || place.trim(), violatorName: context.owner || 'Not known', location: place.trim() || context.org || '',
          state: context.state || 'Delhi', district: context.district || 'Not given', instrumentId: context.instrumentId || '',
          offenseCategory: categories[issue],
          details: `${issue.replace(/_/g, ' ').toLowerCase()} | certificate ${context.certNo} | ${details.trim()} | contact ${phone.trim() || 'anonymous'}`,
        });
        setCaseId(id);
        return;
      } catch (ex) {
        setErr((ex as Error).message);
        return;
      }
    }
    const c = await storage.createEnforcementCase({
      businessName: context.org || place.trim(),
      violatorName: context.owner || 'Not known',
      location: place.trim() || context.org || '',
      state: context.state || 'Delhi',
      district: context.district || 'Not given',
      instrumentId: context.instrumentId || 'Not identified',
      offenseCategory: categories[issue],
      actSection: 'To be decided by the inspecting officer',
      officerId: 'unassigned',
      officerName: 'District office (to assign)',
      actionTaken: 'Citizen report received through public verification page. Awaiting spot check.',
      status: 'UNDER_REVIEW',
      evidenceNotes: `${issue.replace(/_/g, ' ').toLowerCase()} | certificate ${context.certNo} | ${details.trim()} | contact ${phone.trim() || 'anonymous'}`,
    });
    setCaseId(c.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 id="report-title" className="font-bold text-slate-900">Report a problem</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        {caseId ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-slate-900">Report {caseId} received</p>
            <p className="text-sm text-slate-600">The district Legal Metrology office will review it and may do a surprise check. Keep this number for follow-up.</p>
            <button onClick={onClose} className="mt-2 px-5 py-2.5 rounded-lg bg-gov-800 text-white text-sm font-bold">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-4 space-y-3 text-sm">
            <p className="text-xs text-slate-500">Certificate: <span className="font-mono">{context.certNo || 'not scanned'}</span></p>
            <label className="block"><span className="text-xs font-semibold text-slate-700">What is wrong?</span>
              <select value={issue} onChange={e => setIssue(e.target.value as typeof issue)} className="mt-1 w-full border border-slate-300 rounded-lg p-2.5">
                <option value="SHORT_WEIGHT">Short weight or wrong reading</option>
                <option value="BROKEN_SEAL">Seal broken or missing</option>
                <option value="EXPIRED">Certificate expired</option>
                <option value="FAKE_CERTIFICATE">Certificate looks fake</option>
              </select>
            </label>
            {!context.org && (
              <label className="block"><span className="text-xs font-semibold text-slate-700">Shop / pump and area</span>
                <input value={place} onChange={e => setPlace(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-2.5" placeholder="e.g. Sharma Kirana, Lajpat Nagar" />
              </label>
            )}
            <label className="block"><span className="text-xs font-semibold text-slate-700">What happened?</span>
              <textarea rows={3} value={details} onChange={e => setDetails(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-2.5" placeholder="e.g. Paid for 1 kg, weighed 920 g at home" />
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Phone (optional, for follow-up)</span>
              <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" className="mt-1 w-full border border-slate-300 rounded-lg p-2.5" />
            </label>
            {err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
            <button type="submit" className="w-full py-3 rounded-lg bg-rose-600 text-white font-bold">Send report</button>
          </form>
        )}
      </div>
    </div>
  );
};
