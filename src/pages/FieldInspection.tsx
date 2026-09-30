import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { syncQueue } from '../services/syncQueue';
import { 
  Application, 
  InspectionChecklistItem, 
  TestReadingRow,
  UserProfile 
} from '../types';
import { generateDynamicChecklist, generateDefaultTestReadings } from '../services/rulesEngine';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  ShieldCheck, 
  Calendar,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const FieldInspection: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialAppId = searchParams.get('applicationId') || '';

  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>(initialAppId);
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.getCurrentUser());
  
  // Offline State Tracking
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(syncQueue.getPendingCount());
  const [gpsLocation, setGpsLocation] = useState<string>('Detecting GPS coordinates...');
  const [_gpsCoordinates, setGpsCoordinates] = useState<{ lat?: number; lng?: number }>({});

  // Inspection form state
  const [checklist, setChecklist] = useState<InspectionChecklistItem[]>([]);
  const [testReadings, setTestReadings] = useState<TestReadingRow[]>([]);
  const [evidencePhotos, setEvidencePhotos] = useState<any[]>([]);
  const [inspectorRemarks, setInspectorRemarks] = useState('');
  const [verificationResult, setVerificationResult] = useState<'PASS' | 'FAIL' | 'ADJUSTMENT_REQUIRED' | 'RETEST_REQUIRED'>('PASS');
  const [adjustmentDetails, setAdjustmentDetails] = useState('');
  const [stampType, setStampType] = useState<'LEAD_WIRE_SEAL' | 'TAMPER_EVIDENT_BARCODE_SEAL' | 'HOLOGRAM_SECURITY_SEAL'>('LEAD_WIRE_SEAL');
  const [signedConfirmation, setSignedConfirmation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Monitor network online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubSync = syncQueue.subscribe(() => {
      setPendingSyncCount(syncQueue.getPendingCount());
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubSync();
    };
  }, []);

  // Geolocation detection
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setGpsLocation(`Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`);
          setGpsCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setGpsLocation('28.52920° N, 77.27130° E (Zonal GPS Station Reference)');
          setGpsCoordinates({ lat: 28.5292, lng: 77.2713 });
        },
        { timeout: 5000 }
      );
    } else {
      setTimeout(() => {
        setGpsLocation('28.52920° N, 77.27130° E (Zonal Reference)');
      }, 0);
    }
  }, []);

  // Load inspection jobs
  useEffect(() => {
    const allApps = storage.getApplications();
    const user = storage.getCurrentUser();

    const relevantApps = user.role === 'BUSINESS'
      ? allApps.filter(a => a.applicantId === user.id)
      : user.role === 'LMO'
      ? allApps.filter(a => a.assignedToId === user.id || a.state === user.state)
      : user.role === 'GATC'
      ? allApps.filter(a => a.assignedToId === user.id || (a.state === user.state && a.assignedToType === 'GATC'))
      : allApps.filter(a => a.state === user.state || user.role === 'CENTRAL_ADMIN');

    setApplications(relevantApps);
    if (!selectedAppId && relevantApps.length > 0) {
      const activeApp = relevantApps.find(a => a.status === 'SCHEDULED' || a.status === 'ASSIGNED' || a.status === 'INSPECTION_IN_PROGRESS') || relevantApps[0];
      setSelectedAppId(activeApp.id);
    }
  }, [selectedAppId]);

  // Load dynamic checklist & test readings when application changes
  useEffect(() => {
    if (!selectedAppId) return;
    const app = storage.getApplicationById(selectedAppId);
    if (!app) return;
    const inst = storage.getInstrumentById(app.instrumentId);
    if (!inst) return;

    setChecklist(generateDynamicChecklist(inst.category));
    setTestReadings(generateDefaultTestReadings(inst.category, inst.capacity));
    setEvidencePhotos([
      {
        id: 'photo-1',
        caption: 'Instrument Display & Zero Reading Verification',
        url: inst.photos[0] || 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=600&q=80',
        type: 'READING_DISPLAY',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'photo-2',
        caption: 'Lead Wire Stamping Hole / Security Wire Pass-through',
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
        type: 'SEAL_APPLIED',
        timestamp: new Date().toISOString(),
      }
    ]);
    setInspectorRemarks(`Verified on-site at ${inst.installationAddress}. Error within statutory Maximum Permissible Error (MPE) as per Legal Metrology (General) Rules, 2011.`);
  }, [selectedAppId]);

  const currentApp = applications.find(a => a.id === selectedAppId);
  const currentInst = currentApp ? storage.getInstrumentById(currentApp.instrumentId) : undefined;

  const handleReadingChange = (rowId: string, field: 'observedValue' | 'error' | 'result', val: string) => {
    setTestReadings(prev => prev.map(r => r.id === rowId ? { ...r, [field]: val } : r));
  };

  const handleChecklistStatusChange = (itemId: string, status: InspectionChecklistItem['status']) => {
    setChecklist(prev => prev.map(c => c.id === itemId ? { ...c, status } : c));
  };

  const handleAddPhoto = () => {
    const newP = {
      id: `photo-${Date.now()}`,
      caption: `On-site Physical Inspection Evidence #${evidencePhotos.length + 1}`,
      url: 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=600&q=80',
      type: 'TEST_SETUP',
      timestamp: new Date().toISOString(),
    };
    setEvidencePhotos([...evidencePhotos, newP]);
  };

  const handleSubmitInspection = async () => {
    if (!currentApp || !currentInst) return;
    setIsSubmitting(true);

    try {
      if (!isOnline) {
        // Queue offline
        syncQueue.enqueue({
          applicationId: currentApp.id,
          instrumentId: currentInst.id,
          timestamp: new Date().toISOString(),
          checklist,
          testReadings,
          evidencePhotos,
          inspectorRemarks,
          result: verificationResult,
          adjustmentDetails,
          stampType,
        });
        alert('Device is currently OFFLINE. Verification record has been stored locally in PENDING SYNC queue.');
        setIsSubmitting(false);
        return;
      }

      // Online submission: Complete inspection, apply stamp, generate certificate
      const result = await storage.completeInspectionAndIssueCertificate({
        applicationId: currentApp.id,
        instrumentId: currentInst.id,
        checklist,
        testReadings,
        evidencePhotos,
        inspectorRemarks,
        result: verificationResult,
        adjustmentDetails,
        stampType,
      });

      if (verificationResult === 'PASS') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      }

      if (result.certificate) {
        navigate(`/certificates/${result.certificate.id}`);
      } else {
        navigate(`/applications/${currentApp.id}`);
      }
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessSyncQueue = async () => {
    const queue = syncQueue.getQueue().filter(q => q.status === 'PENDING_SYNC');
    for (const item of queue) {
      await storage.completeInspectionAndIssueCertificate({
        applicationId: item.applicationId,
        instrumentId: item.instrumentId,
        checklist: item.checklist,
        testReadings: item.testReadings,
        evidencePhotos: item.evidencePhotos,
        inspectorRemarks: item.inspectorRemarks,
        result: item.result,
        adjustmentDetails: item.adjustmentDetails,
        stampType: item.stampType,
      });
      syncQueue.markSynced(item.queueId);
    }
    syncQueue.clearSynced();
    alert('Synchronized all pending field verification inspections with central server!');
  };

  // Dedicated view for Business Owners (Occupiers do not conduct inspections, they receive scheduled visits)
  if (currentUser.role === 'BUSINESS') {
    const scheduledApps = applications.filter(a => a.status === 'SCHEDULED' || a.status === 'ASSIGNED' || a.status === 'INSPECTION_IN_PROGRESS');
    const completedApps = applications.filter(a => a.status === 'COMPLETED');

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gov-800 to-gov-950 text-white p-6 rounded-2xl shadow-md border border-gov-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-white/10">
                  Commercial Occupier Portal
                </span>
                <span className="text-xs text-white/50">•</span>
                <span className="text-xs text-white/70">{currentUser.organization}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Premises Verification Schedule &amp; Officer Visits
              </h1>
              <p className="text-xs text-white/70 mt-1 max-w-2xl leading-relaxed">
                Track scheduled on-site inspections by Legal Metrology Officers, review pre-inspection site requirements, and access verified stamping records under Section 24.
              </p>
            </div>
            <Link
              to="/applications/new"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm shrink-0"
            >
              <Scale className="w-4 h-4" />
              Book New Inspection
            </Link>
          </div>
        </div>

        {/* Section 24 Statutory Advisory */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Statutory Requirement: Section 24, Legal Metrology Act, 2009</p>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Verification and stamping are performed exclusively by authorized government Legal Metrology Officers (LMO) or accredited Government Approved Test Centres (GATC). Occupiers must ensure instruments are accessible and maintain unbroken seals.
            </p>
          </div>
        </div>

        {/* Scheduled Inspections Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gov-700" />
              Upcoming Scheduled Inspector Visits ({scheduledApps.length})
            </h2>
            <span className="text-xs text-slate-500">Live Status</span>
          </div>

          {scheduledApps.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No upcoming field inspections currently scheduled for your premises.
            </div>
          ) : (
            scheduledApps.map(app => {
              const inst = storage.getInstrumentById(app.instrumentId);
              return (
                <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gov-800 bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                          {app.id}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {inst?.categoryName || app.instrumentId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Instrument UID: <strong className="font-mono text-slate-700">{app.instrumentId}</strong></p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      Visit Scheduled
                    </span>
                  </div>

                  {/* Visit Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Scheduled Visit Date</span>
                      <strong className="text-slate-900 font-bold flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-gov-700" />
                        {app.scheduledDate || 'Sep 30, 2026'} ({app.scheduledTimeSlot || '02:00 PM - 04:00 PM'})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Visiting Officer</span>
                      <strong className="text-slate-900 font-bold flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {app.assignedToName || 'Inspector Amit K. Sharma (Badge #DL-LMO-042)'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Premises Location</span>
                      <strong className="text-slate-900 font-semibold flex items-center gap-1 mt-0.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {app.location || inst?.installationAddress}
                      </strong>
                    </div>
                  </div>

                  {/* Pre-Inspection Checklist for Occupier */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Pre-Inspection Site Preparation Checklist:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Instrument powered on 30 min before visit</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Spirit level bubble centered correctly</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Central Model Approval certificate copy on site</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Platform unobstructed and clear of dirt/debris</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <Link
                      to={`/applications/${app.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-gov-800 hover:text-gov-900"
                    >
                      View Full Application File &rarr;
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Completed Past Inspections */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Verified &amp; Stamped Instruments ({completedApps.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedApps.map(app => {
              const inst = storage.getInstrumentById(app.instrumentId);
              return (
                <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800">{app.instrumentId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      VERIFIED &amp; STAMPED
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900">{inst?.categoryName}</p>
                  <p className="text-[11px] text-slate-500">Verified at: {app.location}</p>
                  {inst?.currentCertificateId && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">Cert: {inst.currentCertificateId}</span>
                      <Link
                        to={`/certificates/${inst.currentCertificateId}`}
                        className="text-xs font-bold text-gov-700 hover:text-gov-900"
                      >
                        View Certificate &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mobile Top Header & Network Sync Status Bar */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 rounded-lg text-slate-900">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-white">Mobile Field Verification Hub</h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gov-700 text-gov-100">
                LMO / GATC Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Officer: {currentUser.fullName} • Badge: {currentUser.badgeNumber || currentUser.gatcCode || 'DL-LMO-042'}
            </p>
          </div>
        </div>

        {/* Sync & Connectivity Status Indicator (Section 16) */}
        <div className="flex items-center gap-3 bg-slate-800/80 px-3.5 py-2 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Wifi className="w-4 h-4" /> ONLINE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <WifiOff className="w-4 h-4" /> OFFLINE MODE
              </span>
            )}
          </div>

          {pendingSyncCount > 0 && (
            <button
              onClick={handleProcessSyncQueue}
              className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded transition-colors"
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Sync {pendingSyncCount} Records</span>
            </button>
          )}
        </div>
      </div>

      {/* Assigned Daily Job Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Select Assigned Field Verification Job:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {applications.map(a => {
            const isSelected = a.id === selectedAppId;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedAppId(a.id)}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-gov-700 bg-gov-50/50 ring-2 ring-gov-600/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-xs text-gov-800">{a.id}</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    {a.status}
                  </span>
                </div>
                <p className="font-bold text-slate-900 text-xs line-clamp-1">{a.instrumentId}</p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{a.organization}</p>
              </button>
            );
          })}
        </div>
      </div>

      {currentApp && currentInst ? (
        <div className="space-y-6">
          {/* Target Instrument & Geotag Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold font-mono text-gov-800 bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                  UID: {currentInst.id}
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">{currentInst.categoryName}</h3>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                Capacity: {currentInst.capacity}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Model Approval &amp; Serial:</span>
                <p className="font-mono font-bold text-slate-800">{currentInst.modelApprovalNumber} • {currentInst.serialNumber}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Occupier / Business:</span>
                <p className="font-bold text-slate-800">{currentInst.organization} ({currentInst.ownerName})</p>
              </div>
            </div>

            {/* Geotagging Badge (Section 15 requirement) */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gov-700 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">On-Site Geotag GPS Coordinate:</span>
                  <span className="block font-mono text-[11px] text-slate-600">{gpsLocation}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                GEO-VERIFIED
              </span>
            </div>
          </div>

          {/* Dynamic Inspection Checklist (Section 17) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gov-700" />
                  Dynamic Metrological Inspection Checklist
                </h3>
                <p className="text-[11px] text-slate-500">Legal Metrology (General) Rules, 2011 Schedule Verification</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {checklist.filter(c => c.status === 'PASS').length} / {checklist.length} Passed
              </span>
            </div>

            <div className="space-y-3">
              {checklist.map((item, idx) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">#{idx + 1}. {item.label}</span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleChecklistStatusChange(item.id, 'PASS')}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                        item.status === 'PASS'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50'
                      }`}
                    >
                      Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChecklistStatusChange(item.id, 'ADJUSTMENT_REQUIRED')}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                        item.status === 'ADJUSTMENT_REQUIRED'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      Adjust
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChecklistStatusChange(item.id, 'FAIL')}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                        item.status === 'FAIL'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-rose-50'
                      }`}
                    >
                      Fail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Readings & MPE Verification Table (Section 18) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-gov-700" />
                  Metrological Test Readings &amp; Maximum Permissible Error (MPE)
                </h3>
                <p className="text-[11px] text-slate-500">Record standard reference vs. observed indication</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Test Stage</th>
                    <th className="py-2.5 px-3">Standard Reference</th>
                    <th className="py-2.5 px-3">Observed Reading</th>
                    <th className="py-2.5 px-3">Indication Error</th>
                    <th className="py-2.5 px-3">Permissible MPE</th>
                    <th className="py-2.5 px-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {testReadings.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.testName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{row.standardValue}</td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={row.observedValue}
                          onChange={e => handleReadingChange(row.id, 'observedValue', e.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono w-28"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={row.error}
                          onChange={e => handleReadingChange(row.id, 'error', e.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono w-24 text-emerald-700 font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{row.permissibleTolerance}</td>
                      <td className="py-2.5 px-3 text-right">
                        <select
                          value={row.result}
                          onChange={e => handleReadingChange(row.id, 'result', e.target.value)}
                          aria-label={`Test result for ${row.testName}`}
                          className={`border rounded px-2 py-1 text-xs font-bold ${
                            row.result === 'PASS' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="PASS">PASS</option>
                          <option value="FAIL">FAIL</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Photographic Evidence Gallery (Section 19) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gov-700" />
                  Photographic Evidence &amp; Seal Capture
                </h3>
                <p className="text-[11px] text-slate-500">Attach on-site visual evidence prior to seal stamping</p>
              </div>
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                Capture/Attach Photo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {evidencePhotos.map(photo => (
                <div key={photo.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-36 object-cover rounded-md border border-slate-200"
                  />
                  <div>
                    <p className="font-bold text-slate-900">{photo.caption}</p>
                    <span className="text-[10px] text-slate-500 font-mono">Timestamp: {new Date(photo.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stamping & Final Verification Decision (Sections 20 & 21) */}
          <div className="bg-white p-5 rounded-xl border-2 border-gov-700 shadow-md space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gov-700" />
              Final Metrological Decision &amp; Stamping Authorization
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Verification Decision *</label>
                <select
                  value={verificationResult}
                  onChange={e => setVerificationResult(e.target.value as any)}
                  className={`w-full border-2 rounded-lg p-2.5 text-xs font-bold ${
                    verificationResult === 'PASS'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : verificationResult === 'ADJUSTMENT_REQUIRED'
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
                      : 'border-rose-600 bg-rose-50 text-rose-900'
                  }`}
                >
                  <option value="PASS">PASS — Apply Official Stamping &amp; Issue Certificate</option>
                  <option value="ADJUSTMENT_REQUIRED">ADJUSTMENT REQUIRED — Issue Correction Notice</option>
                  <option value="RETEST_REQUIRED">RETEST REQUIRED — Retesting within 14 Days</option>
                  <option value="FAIL">FAIL — Rejection Notice &amp; Enforcement Action</option>
                </select>
              </div>

              {verificationResult === 'PASS' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stamping Seal Type *</label>
                  <select
                    value={stampType}
                    onChange={e => setStampType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold"
                  >
                    <option value="LEAD_WIRE_SEAL">Lead Wire Seal with Quarter Mark (A-26)</option>
                    <option value="TAMPER_EVIDENT_BARCODE_SEAL">Tamper-Evident Barcode Seal</option>
                    <option value="HOLOGRAM_SECURITY_SEAL">Hologram Security Seal</option>
                  </select>
                </div>
              )}
            </div>

            {verificationResult === 'ADJUSTMENT_REQUIRED' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Instructions</label>
                <textarea
                  rows={2}
                  value={adjustmentDetails}
                  onChange={e => setAdjustmentDetails(e.target.value)}
                  placeholder="Specify calibration or leveling adjustment required by authorized repairer..."
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inspector Metrological Remarks *</label>
              <textarea
                rows={2}
                value={inspectorRemarks}
                onChange={e => setInspectorRemarks(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
              />
            </div>

            {/* Officer Sign-Off Check */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signedConfirmation}
                  onChange={e => setSignedConfirmation(e.target.checked)}
                  className="w-4 h-4 text-gov-700 rounded focus:ring-gov-600"
                />
                <span className="font-semibold text-slate-800">
                  I solemnly certify that I have physically inspected and verified this instrument under the Legal Metrology Act, 2009.
                </span>
              </label>
              <span className="font-mono text-[11px] text-gov-800 font-bold shrink-0">
                Sign-off: {currentUser.fullName}
              </span>
            </div>

            {/* Submission Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={isSubmitting || !signedConfirmation}
                onClick={handleSubmitInspection}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gov-700 hover:bg-gov-800 text-white font-extrabold px-8 py-3 rounded-lg text-sm transition-all shadow-md disabled:opacity-50"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>
                  {isSubmitting
                    ? 'Submitting & Generating Certificate...'
                    : verificationResult === 'PASS'
                    ? 'Submit, Stamp & Generate Schedule IX Certificate'
                    : 'Submit Inspection Result'}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
          Select an assigned verification job above to commence on-site field testing.
        </div>
      )}
    </div>
  );
};
