import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { cloud, cloudEnabled, CloudStatus } from '../../services/cloud';
import { Globe, GitBranch, Search, Sparkles, Sliders, Menu, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { RoleSwitcherDropdown } from './RoleSwitcherDropdown';
import { DemoControlModal } from '../demo/DemoControlModal';
import { ConnectedWorkflowModal } from '../common/ConnectedWorkflowModal';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { AiAssistantModal } from '../ai/AiAssistantModal';
import { storage } from '../../services/storage';
import { UserProfile, Instrument, Application, VerificationCertificate, NotificationItem } from '../../types';

export const AppShell: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.getCurrentUser());
  const [instruments, setInstruments] = useState<Instrument[]>(storage.getInstruments());
  const [applications, setApplications] = useState<Application[]>(storage.getApplications());
  const [certificates, setCertificates] = useState<VerificationCertificate[]>(storage.getCertificates());
  const [notifications, setNotifications] = useState<NotificationItem[]>(storage.getNotificationsForUser());
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const location = useLocation();
  const [cs, setCs] = useState<CloudStatus>(cloud.status());
  useEffect(() => { const off = cloud.subscribe(() => setCs(cloud.status())); return () => { off(); }; }, []);

  const pendingSync = storage.getOfflineQueue().length + certificates.filter(c => c.signatureStatus === 'PENDING_SIGNATURE').length;

  // Close the phone drawer after navigating.
  useEffect(() => setMobileNavOpen(false), [location.pathname]);

  // Connectivity: when the device comes back online, issue and sign anything recorded offline.
  useEffect(() => {
    const runSync = async () => {
      const r = await storage.syncPending();
      if (r.issued || r.signed) {
        setSyncMessage(`Back online: ${r.issued} certificate(s) issued, ${r.signed} signed.`);
        setTimeout(() => setSyncMessage(null), 6000);
      }
    };
    const goOnline = () => { setOnline(true); void runSync(); };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    storage.runExpiryReminderJob();
    void runSync();
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);


  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setCurrentUser(storage.getCurrentUser());
      setInstruments(storage.getInstruments());
      setApplications(storage.getApplications());
      setCertificates(storage.getCertificates());
      setNotifications(storage.getNotificationsForUser());
    });
    return unsubscribe;
  }, []);

  // Determine page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/instruments')) return 'Instruments';
    if (path.startsWith('/applications/new')) return 'New Application';
    if (path.startsWith('/applications')) return 'Applications';
    if (path.startsWith('/field') || path.startsWith('/inspections')) return 'Field Verification';
    if (path.startsWith('/certificates')) return 'Certificates';
    if (path.startsWith('/enforcement')) return 'Enforcement';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/audit')) return 'Audit Trail';
    if (path.startsWith('/admin/rules')) return 'Rules & Fees';
    if (path.startsWith('/verify')) return 'Public Verification';
    if (path.startsWith('/notifications')) return 'SMS / Email Updates';
    return 'TULA';
  };

  // Portal pages need a signed-in account when the live database is on.
  if (cloudEnabled && !cs.ready) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500" aria-busy="true">Checking your sign-in…</div>;
  }
  if (cloudEnabled && !cs.signedIn) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50/80">
      {/* Sidebar — starts from top-0 with zero overlap */}
      <Sidebar
        currentUser={currentUser}
        notifications={notifications}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area — offset by sidebar width */}
      <div
        className={`transition-all duration-300 ease-in-out min-w-0 ${
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* ── Slim Top Accent Strip ── */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] sticky top-0 z-30" />

        {/* ── Clean Main Header ── */}
        <header className="sticky top-[3px] z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80">
          <div className="flex items-center justify-between h-14 px-3 sm:px-5 gap-2">

            {/* Left: Page context */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-2.5 -ml-1 rounded-lg text-slate-700 hover:bg-slate-100"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">{getPageTitle()}</h2>
                <p className="text-[10px] text-slate-400 font-medium leading-tight hidden xl:block">
                  Dept. of Consumer Affairs • Ministry of Consumer Affairs, Food &amp; Public Distribution
                </p>
              </div>
            </div>

            {/* Right: Action buttons — clean, spaced */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Connectivity */}
              {!online ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold" title="No network. Work is saved on this device.">
                  <WifiOff className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Offline</span>
                </span>
              ) : cs.pending > 0 ? (
                <button onClick={() => cloud.flush()} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold" title={cs.lastError || 'Changes waiting to be saved to the database'}>
                  <RefreshCw className="w-3.5 h-3.5" /> {cs.pending}<span className="hidden sm:inline"> saving</span>
                </button>
              ) : pendingSync > 0 ? (
                <button onClick={() => storage.syncPending()} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold" title="Items waiting to sync. Tap to retry.">
                  <RefreshCw className="w-3.5 h-3.5" /> {pendingSync}<span className="hidden sm:inline"> to sync</span>
                </button>
              ) : cloudEnabled ? (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold" title={cs.realtime ? 'Connected to the live database. Changes from other devices appear instantly.' : 'Saved to the live database.'}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cs.realtime ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'}`} /> Live
                </span>
              ) : null}
              {/* Search */}
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200/80 text-xs font-medium transition-colors"
                title="Search instruments, applications, certificates (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search...</span>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-400 ml-1">⌘K</kbd>
              </button>
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Divider */}
              <div className="hidden lg:block w-px h-6 bg-slate-200" />

              {/* TULA Gemini AI Advisor */}
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="inline-flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200/80 text-xs font-bold text-purple-900 transition-all"
                title="Ask the TULA help assistant (Google Gemini)"
                aria-label="Open help assistant"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Help</span>
              </button>

              {/* Connected Workflow */}
              <button
                onClick={() => setIsWorkflowModalOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-xs font-semibold text-blue-800 transition-colors"
                title="View how all 6 stakeholder roles connect in real-time"
              >
                <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                <span>Workflow</span>
              </button>

              {/* Landing Page */}
              <Link
                to="/"
                className="hidden sm:inline-flex p-2 rounded-lg text-slate-400 hover:text-[#0070C0] hover:bg-blue-50 transition-colors"
                title="Return to Public Landing Page"
                aria-label="Public home page"
              >
                <Globe className="w-4 h-4" />
              </Link>

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-slate-200" />

              {/* User Role Switcher — contains user profile info */}
              <RoleSwitcherDropdown
                currentUser={currentUser}
                onOpenDemoControl={() => setIsDemoModalOpen(true)}
              />
            </div>
          </div>
        </header>

        {/* ── Compact Demo Notice ── */}
        <div className="bg-amber-50/80 border-b border-amber-200/60 px-5 py-1.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[9px] font-extrabold uppercase tracking-wider border border-amber-300/80">
              <Sparkles className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
              Demo
            </span>
            <span className="text-[11px] text-amber-800 truncate hidden sm:inline">
              Prototype on a live database. Demo payments and gateways are marked. <Link to="/status" className="underline font-semibold">What is live and what is planned</Link>
            </span>
            <Link to="/status" className="text-[11px] text-amber-800 underline sm:hidden">Prototype status</Link>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-semibold transition-colors"
              title="Demo simulation controls"
            >
              <Sliders className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Controls</span>
            </button>
            <Link to="/login" className="text-[10px] text-amber-700 hover:text-amber-900 font-bold hover:underline whitespace-nowrap">
              Switch Account →
            </Link>
          </div>
        </div>

        {syncMessage && (
          <div role="status" className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {syncMessage}
          </div>
        )}

        {/* Page Content */}
        <main className="p-3 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </main>

        {/* Floating AI Metrology Assistant Trigger */}
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="fixed bottom-5 right-5 z-30 hidden md:flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white font-semibold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border border-purple-400/40 cursor-pointer group"
          title="Open the TULA help assistant (Gemini)"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-200 group-hover:rotate-12 transition-transform" />
          <span className="tracking-tight">Help</span>
        </button>

        {/* Honest Prototype Footer */}
        <footer className="border-t border-slate-200/80 bg-white px-6 py-4 text-center text-[11px] text-slate-500">
          <p className="font-semibold text-slate-700">
            TULA prototype for Smart India Hackathon, problem statement 26036 • Team FriendlyFire
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Legal Metrology Act, 2009 • Legal Metrology (General) Rules, 2011 • Legal Metrology (Government Approved Test Centre) Rules, 2013
          </p>
        </footer>
      </div>

      {/* Connected Workflow Modal */}
      <ConnectedWorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
      />

      {/* Demo Control Modal */}
      <DemoControlModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        instruments={instruments}
        applications={applications}
        certificates={certificates}
      />
      {/* Global Search Command Palette */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* TULA AI Metrology Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};
