import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GovBar } from '../components/layout/GovBar';
import { SiteFooter } from '../components/layout/SiteFooter';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import jsQR from 'jsqr';
import { storage } from '../services/storage';
import { SEED_SIGNATURES } from '../data/seedSignatures';
import { verifySignedQr, parseQrText, tamperPayload, SignatureCheck, SignedPayload } from '../services/certSigning';
import { checkRevocation, RevocationCheck } from '../services/revocation';
import { cloud, cloudEnabled } from '../services/cloud';
import { VerificationCertificate } from '../types';
import { TulaLogo } from '../components/common/TulaLogo';
import { ModelApprovalCheck } from '../components/common/ModelApprovalCheck';
import { approvalFromText, REGISTER_URL } from '../services/modelApproval';
import { explainQr, QrExplanation } from '../services/gemini';
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
  | { kind: 'APPROVAL'; mark: string | null; viaLink: boolean; text: string }
  | { kind: 'UNRECOGNISED'; text: string }
  | { kind: 'ERROR'; reason: string };

const SAMPLE_ID = 'CERT-2026-08912';

// Citizen-facing text in English and Hindi. The choice is remembered on the device.
const TEXT = {
  en: {
    title: "Check an instrument's certificate",
    intro: 'Scan the QR on the certificate or seal. The check runs on your phone, needs no login, and works without internet.',
    tabs: ['Scan', 'Upload photo', 'Type number'],
    point: 'Point the camera at the QR code', start: 'Start camera', sample: 'Try a demo certificate',
    samples: ['Genuine', 'Edited copy', 'Expired', 'Revoked'],
    sampleNote: '"Edited copy" takes the genuine certificate and changes only its expiry date. The signature no longer matches, so the check fails.',
    checking: 'Checking…',
    genuine: 'Genuine and valid', genuineText: (d: string) => `Signed by TULA's issuing server and valid until ${d}. The signature was checked on this device. TULA is a student prototype, not a government office.`,
    expired: 'Genuine but expired', expiredText: (d: string) => `This certificate expired on ${d}. The instrument must be re-verified before it is used for trade.`,
    revoked: 'Revoked. Do not rely on this instrument', revokedFallback: 'Revoked by the issuing office',
    fake: 'Fake or edited certificate', fakeText: (reason: string, claim?: string) => `${reason}${claim ? ` It claims to be ${claim}.` : ''} Report it so the district office can inspect.`,
    notFound: 'No certificate with this number', notFoundText: (t: string) => `TULA's registry has no certificate "${t}". TULA can only confirm certificates issued through TULA. Certificates that State offices issue on paper are not published in any government database online, so they cannot be checked here. Ask the seller to show the paper certificate. If this number is on a seal or sticker that claims to be from TULA, report it.`,
    approval: 'This is a model approval mark, not a certificate', approvalText: 'A model approval says the design of an instrument was approved by the Government of India. It does not say that this particular instrument was verified and stamped. Below is what the government register says about this mark.',
    approvalLinkMissing: 'This is a DoCA certificate link that TULA has no record of', approvalLinkMissingText: "The link points to the Department of Consumer Affairs website, but it does not match any entry in TULA's copy of the Model Approval register. Open the link to read the certificate on the government site.",
    unrecognised: 'Not something TULA can check', unrecognisedText: 'This QR is not a TULA certificate and not a model approval mark, so there is no record to show. State offices issue certificates of verification on paper and do not publish them online, so no government database exists to check this against. Ask the seller to show the certificate of verification.',
    scanned: 'What the QR contains',
    explain: 'Explain this QR with AI', explaining: 'Reading the QR…',
    explainNote: 'AI explanation, not a verification. TULA never opens the link. Phone numbers and IDs are hidden before the text is sent.',
    govRecord: 'Government record for this model', govRecordNone: 'No model approval mark is recorded for this instrument, so there is no government record to show.', govRecordOffline: "Connect to the internet to see the government's model approval record for this instrument.", govRecordUnavailable: 'The government record could not be loaded just now. The certificate check above is not affected. Try again in a minute.',
    labels: { cert: 'Certificate', iid: 'Instrument ID', inst: 'Instrument', cap: 'Capacity / class', sn: 'Serial number', owner: 'Owner', place: 'Place', on: 'Verified on', until: 'Valid until', seal: 'Seal', by: 'Verified by' },
    problem: 'Weight or reading looks wrong, seal broken, or certificate expired?', report: 'Report a problem',
    rightsTitle: 'Your right as a buyer',
    rights: 'Every scale, fuel pump or meter used for trade must be verified and stamped under the Legal Metrology Act, 2009. You can ask the seller to show the certificate.',
  },
  hi: {
    title: 'तौल या माप उपकरण का प्रमाणपत्र जाँचें',
    intro: 'प्रमाणपत्र या सील पर लगा QR स्कैन करें। जाँच आपके फ़ोन पर ही होती है, लॉगिन की ज़रूरत नहीं, और इंटरनेट के बिना भी चलती है।',
    tabs: ['स्कैन करें', 'फ़ोटो अपलोड करें', 'नंबर लिखें'],
    point: 'कैमरा QR कोड की ओर रखें', start: 'कैमरा चालू करें', sample: 'डेमो प्रमाणपत्र आज़माएँ',
    samples: ['असली', 'बदली हुई कॉपी', 'अवधि समाप्त', 'रद्द'],
    sampleNote: '"बदली हुई कॉपी" असली प्रमाणपत्र की सिर्फ़ समाप्ति तिथि बदलती है। हस्ताक्षर मेल नहीं खाता, इसलिए जाँच विफल होती है।',
    checking: 'जाँच हो रही है…',
    genuine: 'असली और मान्य', genuineText: (d: string) => `TULA के सर्वर द्वारा हस्ताक्षरित, ${d} तक मान्य। हस्ताक्षर इसी फ़ोन पर जाँचा गया। TULA एक छात्र प्रोटोटाइप है, सरकारी कार्यालय नहीं।`,
    expired: 'असली, पर अवधि समाप्त', expiredText: (d: string) => `यह प्रमाणपत्र ${d} को समाप्त हो गया। व्यापार में उपयोग से पहले उपकरण का दोबारा सत्यापन ज़रूरी है।`,
    revoked: 'रद्द किया गया। इस उपकरण पर भरोसा न करें', revokedFallback: 'जारी करने वाले कार्यालय ने रद्द किया',
    fake: 'नकली या बदला हुआ प्रमाणपत्र', fakeText: (_r: string, claim?: string) => `हस्ताक्षर प्रमाणपत्र के विवरण से मेल नहीं खाता।${claim ? ` यह ${claim} होने का दावा करता है।` : ''} शिकायत करें ताकि ज़िला कार्यालय जाँच कर सके।`,
    notFound: 'इस नंबर का कोई प्रमाणपत्र नहीं', notFoundText: (t: string) => `TULA के रजिस्टर में "${t}" नंबर का कोई प्रमाणपत्र नहीं है। TULA सिर्फ़ TULA से जारी प्रमाणपत्रों की पुष्टि कर सकता है। राज्य कार्यालयों के कागज़ी प्रमाणपत्र किसी सरकारी ऑनलाइन डेटाबेस में प्रकाशित नहीं होते, इसलिए उनकी जाँच यहाँ नहीं हो सकती। विक्रेता से कागज़ी प्रमाणपत्र दिखाने को कहें। अगर यह नंबर TULA के नाम वाली किसी सील या स्टिकर पर है, तो शिकायत करें।`,
    approval: 'यह मॉडल अनुमोदन चिह्न है, प्रमाणपत्र नहीं', approvalText: 'मॉडल अनुमोदन का अर्थ है कि उपकरण का डिज़ाइन भारत सरकार ने अनुमोदित किया है। इससे यह साबित नहीं होता कि यही उपकरण सत्यापित और मुहरबंद है। नीचे इस चिह्न के बारे में सरकारी रजिस्टर की जानकारी है।',
    approvalLinkMissing: 'यह DoCA प्रमाणपत्र का लिंक है, पर TULA के पास इसका रिकॉर्ड नहीं', approvalLinkMissingText: 'यह लिंक उपभोक्ता मामले विभाग की वेबसाइट का है, पर TULA की मॉडल अनुमोदन रजिस्टर की प्रति में इससे मेल खाती कोई प्रविष्टि नहीं है। प्रमाणपत्र सरकारी साइट पर देखने के लिए लिंक खोलें।',
    unrecognised: 'इसकी जाँच TULA नहीं कर सकता', unrecognisedText: 'यह QR न TULA का प्रमाणपत्र है, न मॉडल अनुमोदन चिह्न, इसलिए दिखाने को कोई रिकॉर्ड नहीं है। राज्य कार्यालय सत्यापन प्रमाणपत्र कागज़ पर जारी करते हैं और ऑनलाइन प्रकाशित नहीं करते, इसलिए इसकी जाँच के लिए कोई सरकारी डेटाबेस नहीं है। विक्रेता से सत्यापन प्रमाणपत्र दिखाने को कहें।',
    scanned: 'QR में क्या लिखा है',
    explain: 'AI से यह QR समझें', explaining: 'QR पढ़ा जा रहा है…',
    explainNote: 'यह AI की व्याख्या है, सत्यापन नहीं। TULA लिंक नहीं खोलता। भेजने से पहले फ़ोन नंबर और आईडी छिपा दिए जाते हैं।',
    govRecord: 'इस मॉडल का सरकारी रिकॉर्ड', govRecordNone: 'इस उपकरण का कोई मॉडल अनुमोदन चिह्न दर्ज नहीं है, इसलिए दिखाने को कोई सरकारी रिकॉर्ड नहीं है।', govRecordOffline: 'इस उपकरण का सरकारी मॉडल अनुमोदन रिकॉर्ड देखने के लिए इंटरनेट से जुड़ें।', govRecordUnavailable: 'सरकारी रिकॉर्ड अभी लोड नहीं हो सका। ऊपर की प्रमाणपत्र जाँच पर इसका असर नहीं है। एक मिनट बाद फिर कोशिश करें।',
    labels: { cert: 'प्रमाणपत्र', iid: 'उपकरण आईडी', inst: 'उपकरण', cap: 'क्षमता / श्रेणी', sn: 'क्रम संख्या', owner: 'मालिक', place: 'स्थान', on: 'सत्यापन तिथि', until: 'कब तक मान्य', seal: 'सील', by: 'सत्यापनकर्ता' },
    problem: 'वज़न या रीडिंग गलत लगे, सील टूटी हो, या प्रमाणपत्र समाप्त हो?', report: 'शिकायत करें',
    rightsTitle: 'खरीदार के रूप में आपका अधिकार',
    rights: 'व्यापार में इस्तेमाल होने वाला हर तराज़ू, ईंधन पंप या मीटर विधिक माप विज्ञान अधिनियम, 2009 के तहत सत्यापित और मुहरबंद होना चाहिए। आप विक्रेता से प्रमाणपत्र दिखाने को कह सकते हैं।',
  },
};
type Lang = keyof typeof TEXT;

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
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem('tula-lang') as Lang) === 'hi' ? 'hi' : 'en'; } catch { return 'en'; }
  });
  const T = TEXT[lang];
  const switchLang = (l: Lang) => { setLang(l); try { localStorage.setItem('tula-lang', l); } catch { /* ignore */ } };
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Bring the verdict into view as soon as there is one: a buyer who scans a QR must see the answer
  // first, not the camera box. Instant scroll when the reader prefers reduced motion.
  const resultRef = useRef<HTMLElement>(null);
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
    const approval = await approvalFromText(t);
    if (approval) return { kind: 'APPROVAL', mark: approval.mark, viaLink: approval.kind === 'doca_link', text: t };
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
      const t = text.trim();
      // A TULA link, or something shaped like a certificate number, is looked up; anything else is said plainly.
      const isTulaLink = /\/verify\//.test(t);
      const looksLikeCert = /^[A-Z]{2}\/LM\/\d{4}\/\d+$/i.test(t) || /^CERT-\d{4}-\w+$/i.test(t);
      const approval = p && s ? null : await approvalFromText(t);
      const out: Outcome = p && s ? await verifySigned(p, s)
        : approval ? { kind: 'APPROVAL', mark: approval.mark, viaLink: approval.kind === 'doca_link', text: t }
        : isTulaLink || looksLikeCert ? await lookup(id || t)
        : { kind: 'UNRECOGNISED', text: t };
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

  const scrolledOnce = useRef(false);
  useEffect(() => {
    // A scanned link is a fresh visit: do not let the browser restore an old scroll position over the verdict.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    return () => { if ('scrollRestoration' in history) history.scrollRestoration = 'auto'; };
  }, []);
  useEffect(() => {
    if (busy || !outcome || !resultRef.current) return;
    const el = resultRef.current;
    // First verdict (usually from a scanned QR): jump straight to it. Later ones: smooth, unless reduced motion.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = !scrolledOnce.current || reduce ? 'auto' : 'smooth';
    scrolledOnce.current = true;
    requestAnimationFrame(() => el.scrollIntoView({ behavior, block: 'start' }));
  }, [outcome, busy]);

  const shown = outcome && 'payload' in outcome ? outcome.payload : undefined;
  // The government's model approval record for the certificate's instrument (looked up live, never made up).
  const [gov, setGov] = useState<{ state: 'loading' | 'none' | 'offline' | 'unavailable' } | { state: 'ok'; mark: string; manufacturer?: string } | null>(null);
  useEffect(() => {
    if (!shown) { setGov(null); return; }
    if (!online) { setGov({ state: 'offline' }); return; }
    let live = true;
    setGov({ state: 'loading' });
    void cloud.certificateApproval(shown.id).then(r => {
      if (!live) return;
      if (!r) setGov({ state: navigator.onLine ? 'unavailable' : 'offline' });
      else if (!r.mark) setGov({ state: 'none' });
      else setGov({ state: 'ok', mark: r.mark, manufacturer: r.manufacturer || undefined });
    });
    return () => { live = false; };
  }, [shown, online]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-paper-50">
      <GovBar />
      <header className="bg-paper/95 border-b border-paper-300">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/" aria-label="TULA home"><TulaLogo variant="full" theme="light" size="sm" /></Link>
          <nav className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden text-xs font-bold" role="group" aria-label="Language">
              <button onClick={() => switchLang('en')} aria-pressed={lang === 'en'} className={`px-2.5 py-2 min-h-[40px] ${lang === 'en' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>EN</button>
              <button onClick={() => switchLang('hi')} aria-pressed={lang === 'hi'} className={`px-2.5 py-2 min-h-[40px] ${lang === 'hi' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`} lang="hi">हिं</button>
            </div>
            <Link to="/" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[40px]"><Home className="w-4 h-4" /><span className="hidden sm:inline">Home</span></Link>
            <Link to="/dashboard" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-gov-800 text-white min-h-[40px]"><LayoutDashboard className="w-4 h-4" /><span className="hidden sm:inline">Portal</span></Link>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className={`${lang === 'en' ? 'font-display tracking-tight' : ''} text-3xl sm:text-4xl font-semibold text-ink`} lang={lang}>{T.title}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {T.intro}
          </p>
          {!online && <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1"><WifiOff className="w-3.5 h-3.5" /> Offline: signatures are still checked. Revocations use the last saved list.</p>}
        </div>

        <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-3 border-b border-slate-200" role="tablist">
            {([['camera', T.tabs[0], Camera], ['upload', T.tabs[1], Upload], ['manual', T.tabs[2], Keyboard]] as const).map(([key, label, Icon]) => (
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
                      <p className="text-sm">{T.point}</p>
                      <button onClick={startCamera} className="px-5 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm">{T.start}</button>
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
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{T.sample}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onClick={() => runSample('genuine')} className="px-3 py-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-bold min-h-[44px]">{T.samples[0]}</button>
                <button onClick={() => runSample('tampered')} className="px-3 py-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 text-xs font-bold min-h-[44px]">{T.samples[1]}</button>
                <button onClick={() => runSample('expired')} className="px-3 py-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold min-h-[44px]">{T.samples[2]}</button>
                <button onClick={() => runSample('revoked')} className="px-3 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-xs font-bold min-h-[44px]">{T.samples[3]}</button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">{T.sampleNote}</p>
            </div>
          </div>
        </section>

        {busy && <div className="flex items-center justify-center gap-2 text-sm text-slate-600 py-6"><Loader2 className="w-5 h-5 animate-spin" /> {T.checking}</div>}

        {!busy && outcome && (
          <section ref={resultRef} aria-live="polite" className="bg-white rounded-lg border border-slate-200 overflow-hidden scroll-mt-4">
            {outcome.kind === 'GENUINE' && (
              <Banner tone="green" icon={<ShieldCheck className="w-7 h-7" />} title={T.genuine}
                text={T.genuineText(outcome.payload.exp)} />
            )}
            {outcome.kind === 'EXPIRED' && (
              <Banner tone="amber" icon={<Clock className="w-7 h-7" />} title={T.expired}
                text={T.expiredText(outcome.payload.exp)} />
            )}
            {outcome.kind === 'REVOKED' && (
              <Banner tone="red" icon={<ShieldX className="w-7 h-7" />} title={T.revoked}
                text={`${outcome.revocation.revoked?.reason || T.revokedFallback}${outcome.revocation.revoked?.at ? ` (${outcome.revocation.revoked.at})` : ''}.`} />
            )}
            {outcome.kind === 'TAMPERED' && (
              <Banner tone="red" icon={<ShieldAlert className="w-7 h-7" />} title={T.fake}
                text={T.fakeText(outcome.reason, outcome.claimedNo)} />
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
              <Banner tone="red" icon={<ShieldAlert className="w-7 h-7" />} title={T.notFound}
                text={T.notFoundText(outcome.term)} />
            )}
            {outcome.kind === 'ERROR' && <Banner tone="slate" icon={<Info className="w-7 h-7" />} title="Could not check" text={outcome.reason} />}
            {outcome.kind === 'APPROVAL' && (outcome.mark
              ? <Banner tone="slate" icon={<Info className="w-7 h-7" />} title={T.approval} text={T.approvalText} />
              : <Banner tone="amber" icon={<Info className="w-7 h-7" />} title={T.approvalLinkMissing} text={T.approvalLinkMissingText} />)}
            {outcome.kind === 'APPROVAL' && (
              <div className="p-5 space-y-3">
                {outcome.mark && <ModelApprovalCheck mark={outcome.mark} publicView />}
                {outcome.viaLink && <p className="text-xs text-slate-600">{T.scanned}: <a href={outcome.text} target="_blank" rel="noreferrer" className="underline break-all">{outcome.text}</a></p>}
                {!outcome.viaLink && !outcome.mark && <p className="text-xs"><a href={REGISTER_URL} target="_blank" rel="noreferrer" className="underline">{REGISTER_URL}</a></p>}
              </div>
            )}
            {outcome.kind === 'UNRECOGNISED' && <Banner tone="slate" icon={<Info className="w-7 h-7" />} title={T.unrecognised} text={T.unrecognisedText} />}
            {outcome.kind === 'UNRECOGNISED' && (
              <div className="p-5 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">{T.scanned}</p>
                <p className="font-readout break-all mt-1">{outcome.text.length > 160 ? `${outcome.text.slice(0, 160)}…` : outcome.text}</p>
                <QrExplain key={outcome.text} text={outcome.text} labels={{ button: T.explain, busy: T.explaining, note: T.explainNote }} />
              </div>
            )}

            {(shown || (outcome.kind === 'UNSIGNED' && outcome.cert)) && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 p-5 text-sm">
                {(shown ? [
                  [T.labels.cert, shown.n], [T.labels.iid, shown.iu], [T.labels.inst, shown.cat], [T.labels.cap, `${shown.cap} • ${shown.cls}`],
                  [T.labels.sn, shown.sn], [T.labels.owner, `${shown.org} (${shown.own})`], [T.labels.place, `${shown.dist}, ${shown.st}`],
                  [T.labels.on, shown.dt], [T.labels.until, shown.exp], [T.labels.seal, shown.sid], [T.labels.by, `${shown.off} (${shown.auth})`],
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
                <p className="font-semibold text-slate-600">Demo data: the owner, place, officer and seal on TULA certificates are made up for the prototype.</p>
                <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ECDSA P-256 signature, key {shown.kid}, signed {shown.iat.slice(0, 10)}{outcome.kind === 'GENUINE' && outcome.demoKey ? ' (prototype demo key)' : ''}.</p>
                {'revocation' in outcome && (
                  <p>Revocation list: {outcome.revocation.source === 'live' ? 'checked online just now' : outcome.revocation.source === 'cached' ? `saved copy from ${outcome.revocation.listUpdated?.slice(0, 10) || 'earlier'}` : 'not available on this device yet'}.</p>
                )}
              </div>
            )}

            {shown && gov && (
              <div className="px-5 pb-5 space-y-2">
                <p className="text-xs font-bold text-slate-800">{T.govRecord}</p>
                {gov.state === 'loading' && <p className="text-xs text-slate-500 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {T.checking}</p>}
                {gov.state === 'none' && <p className="text-xs text-slate-600">{T.govRecordNone}</p>}
                {gov.state === 'offline' && <p className="text-xs text-slate-600">{T.govRecordOffline}</p>}
                {gov.state === 'unavailable' && <p className="text-xs text-slate-600">{T.govRecordUnavailable}</p>}
                {gov.state === 'ok' && <ModelApprovalCheck mark={gov.mark} manufacturer={gov.manufacturer} publicView />}
              </div>
            )}

            <div className="border-t border-slate-100 p-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between bg-slate-50">
              <p className="text-xs text-slate-600">{T.problem}</p>
              <button onClick={() => setReportOpen(true)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold min-h-[44px]">
                <Flag className="w-4 h-4" /> {T.report}
              </button>
            </div>
          </section>
        )}

        <section className="text-xs text-slate-600 bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <p className="font-bold text-slate-800">{T.rightsTitle}</p>
          <p>{T.rights}</p>
        </section>
      </main>
      <SiteFooter />

      {reportOpen && (
        <ReportModal
          onClose={() => setReportOpen(false)}
          context={shown ? { certNo: shown.n, instrumentId: shown.iu, org: shown.org, owner: shown.own, state: shown.st, district: shown.dist } : outcome && outcome.kind === 'TAMPERED' ? { certNo: outcome.claimedNo || 'unknown' } : { certNo: term }}
        />
      )}
    </div>
  );
};

/** For a QR TULA could not match: plain checks plus a short AI explanation, only when the buyer asks. */
const QrExplain: React.FC<{ text: string; labels: { button: string; busy: string; note: string } }> = ({ text, labels }) => {
  const [state, setState] = useState<{ busy: boolean; data?: QrExplanation; error?: string }>({ busy: false });
  const run = async () => {
    setState({ busy: true });
    try { setState({ busy: false, data: await explainQr(text) }); } catch (e) { setState({ busy: false, error: (e as Error).message }); }
  };
  if (!state.data) {
    return (
      <div className="mt-3 space-y-1.5">
        <button type="button" onClick={run} disabled={state.busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 min-h-[44px] disabled:opacity-50">
          {state.busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Info className="w-4 h-4" />} {state.busy ? labels.busy : labels.button}
        </button>
        {state.error && <p className="text-xs text-slate-600">{state.error}</p>}
      </div>
    );
  }
  const { precheck, ai } = state.data;
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs text-slate-700">
      {precheck.flags.map((f, i) => <p key={`p${i}`} className={f.level === 'warn' ? 'font-semibold text-rose-700' : ''}>{f.level === 'warn' ? '⚠ ' : '· '}{f.message}</p>)}
      {ai ? <>
        <p className="text-slate-800">{ai.explanation}</p>
        {ai.flags.map((f, i) => <p key={`a${i}`}>· {f}</p>)}
      </> : <p>The AI explanation is not available right now. The checks above still apply.</p>}
      <p className="text-[11px] text-slate-500">{labels.note}</p>
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
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-lg max-h-[90dvh] overflow-y-auto">
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
