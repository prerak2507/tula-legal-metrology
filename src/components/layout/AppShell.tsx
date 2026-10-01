import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { cloud, cloudEnabled, CloudStatus } from '../../services/cloud';
import { Globe, GitBranch, Search, Sparkles, Sliders, Menu, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { RoleSwitcherDropdown } from './RoleSwitcherDropdown';
import { GovBar } from './GovBar';
import { SiteFooter } from './SiteFooter';
import { DemoControlModal } from '../demo/DemoControlModal';
import { ConnectedWorkflowModal } from '../common/ConnectedWorkflowModal';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { AiAssistantModal } from '../ai/AiAssistantModal';
import { storage } from '../../services/storage';
import { UserProfile, Instrument, Application, VerificationCertificate, NotificationItem } from '../../types';

const ROLE_NAMES: Record<string, string> = {
  BUSINESS: 'Shop owner',
  LMO: 'Legal Metrology Officer',
  GATC: 'Govt. Approved Test Centre',
  CONTROLLER: 'Controller of Legal Metrology',
  STATE_ADMIN: 'State administrator',
  CENTRAL_ADMIN: 'DoCA administrator',
};

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
    if (path.startsWith('/dashboard')) return 'Home';
    if (path.startsWith('/instruments')) return 'Instruments';
    if (path.startsWith('/applications/new')) return 'New application';
    if (path.startsWith('/applications')) return 'Applications';
    if (path.startsWith('/field') || path.startsWith('/inspections')) return 'Field inspection';
    if (path.startsWith('/certificates')) return 'Certificates';
    if (path.startsWith('/enforcement')) return 'Enforcement';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/audit')) return 'Audit trail';
    if (path.startsWith('/admin/rules')) return 'Fees and rules';
    if (path.startsWith('/verify')) return 'Check a certificate';
    if (path.startsWith('/notifications')) return 'SMS and email updates';
    return 'TULA';
  };

  // Portal pages need a signed-in account when the live database is on.
  if (cloudEnabled && !cs.ready) {
    return <div className="min-h-screen w-full flex items-center justify-center text-sm text-ink-600 bg-paper-50" aria-busy="true">Checking your sign-in…</div>;
  }
  if (cloudEnabled && !cs.signedIn) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return (
    <div className="min-h-screen w-full bg-paper-50">
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
        } flex flex-col min-h-screen`}
      >
        <GovBar />

        {/* ── Clean Main Header ── */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-paper-300">
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
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-ink leading-tight truncate">{getPageTitle()}</h1>
                <p className="text-[11px] text-ink-600 leading-tight truncate">
                  <span className="font-semibold text-brass-700">{ROLE_NAMES[currentUser.role] || currentUser.role}</span>
                  <span className="hidden sm:inline"> · {currentUser.role === 'CENTRAL_ADMIN' ? 'All States' : currentUser.role === 'STATE_ADMIN' ? currentUser.state : `${currentUser.district}, ${currentUser.state}`}</span>
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
                className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-paper-50 hover:bg-paper-100 text-ink-600 hover:text-ink border border-paper-300 text-xs font-medium transition-colors"
                title="Search instruments, applications, certificates (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
                <kbd className="text-[10px] font-readout px-1.5 py-0.5 bg-white rounded border border-paper-300 text-ink-600 ml-1">Ctrl K</kbd>
              </button>
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="md:hidden p-2.5 rounded-md text-ink-600 hover:text-ink hover:bg-paper-100 transition-colors"
                title="Search"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Divider */}
              <div className="hidden lg:block w-px h-6 bg-slate-200" />

              {/* TULA Gemini AI Advisor */}
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="inline-flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-md bg-white hover:bg-paper-100 border border-paper-300 text-xs font-semibold text-ink transition-all"
                title="Ask the TULA help assistant (Google Gemini)"
                aria-label="Open help assistant"
              >
                <Sparkles className="w-3.5 h-3.5 text-brass-700" />
                <span className="hidden sm:inline">Ask</span>
              </button>

              {/* Connected Workflow */}
              <button
                onClick={() => setIsWorkflowModalOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white hover:bg-paper-100 border border-paper-300 text-xs font-semibold text-ink transition-colors"
                title="Trace how one application moved through every role"
              >
                <GitBranch className="w-3.5 h-3.5 text-brass-700" />
                <span>Workflow</span>
              </button>

              {/* Landing Page */}
              <Link
                to="/"
                className="hidden sm:inline-flex p-2 rounded-md text-ink-600 hover:text-ink hover:bg-paper-100 transition-colors"
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

        <div className="bg-brass-200/50 border-b border-brass/30 px-3 sm:px-5 py-1.5 flex items-center justify-between gap-4 text-[11px] text-ink">
          <p className="min-w-0 truncate">
            <span className="font-readout font-semibold tracking-wider text-brass-700 mr-2">DEMO</span>
            <span className="hidden sm:inline">Live database. Payments and SMS / email gateways are simulated. </span>
            <Link to="/status" className="underline font-semibold">Built vs planned</Link>
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ink hover:bg-ink-800 text-paper font-semibold transition-colors min-h-[28px]"
              title="Presenter shortcuts"
            >
              <Sliders className="w-3 h-3 text-brass-300" />
              <span className="hidden sm:inline">Shortcuts</span>
            </button>
            <Link to="/login" className="font-semibold hover:underline whitespace-nowrap">Switch role</Link>
          </div>
        </div>

        {syncMessage && (
          <div role="status" className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {syncMessage}
          </div>
        )}

        {/* Page Content */}
        <main id="main" className="flex-1 w-full p-3 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </main>

        <SiteFooter />
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
