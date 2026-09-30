import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Globe, GitBranch, Search, Sparkles, Sliders } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { RoleSwitcherDropdown } from './RoleSwitcherDropdown';
import { DemoControlModal } from '../demo/DemoControlModal';
import { ConnectedWorkflowModal } from '../common/ConnectedWorkflowModal';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { storage } from '../../services/storage';
import { UserProfile, Instrument, Application, VerificationCertificate, NotificationItem } from '../../types';

export const AppShell: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.getCurrentUser());
  const [instruments, setInstruments] = useState<Instrument[]>(storage.getInstruments());
  const [applications, setApplications] = useState<Application[]>(storage.getApplications());
  const [certificates, setCertificates] = useState<VerificationCertificate[]>(storage.getCertificates());
  const [notifications, setNotifications] = useState<NotificationItem[]>(storage.getNotifications());
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setCurrentUser(storage.getCurrentUser());
      setInstruments(storage.getInstruments());
      setApplications(storage.getApplications());
      setCertificates(storage.getCertificates());
      setNotifications(storage.getNotifications());
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
    return 'TULA';
  };

  return (
    <div className="min-h-screen bg-slate-50/80">
      {/* Sidebar — starts from top-0 with zero overlap */}
      <Sidebar
        currentUser={currentUser}
        notifications={notifications}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Area — offset by sidebar width */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
        }`}
      >
        {/* ── Slim Top Accent Strip ── */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] sticky top-0 z-30" />

        {/* ── Clean Main Header ── */}
        <header className="sticky top-[3px] z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80">
          <div className="flex items-center justify-between h-14 px-5">

            {/* Left: Page context */}
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">{getPageTitle()}</h2>
                <p className="text-[10px] text-slate-400 font-medium leading-tight hidden sm:block">
                  Dept. of Consumer Affairs • Ministry of Consumer Affairs, Food &amp; Public Distribution
                </p>
              </div>
            </div>

            {/* Right: Action buttons — clean, spaced */}
            <div className="flex items-center gap-2">
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
                className="p-2 rounded-lg text-slate-400 hover:text-[#0070C0] hover:bg-blue-50 transition-colors"
                title="Return to Public Landing Page"
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
              SIH 26036 prototype — seeded statutory records for evaluation
            </span>
            <span className="text-[11px] text-amber-800 sm:hidden">SIH 26036 Demo</span>
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

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </main>

        {/* Honest Prototype Footer */}
        <footer className="border-t border-slate-200/80 bg-white px-6 py-4 text-center text-[11px] text-slate-500">
          <p className="font-semibold text-slate-700">
            TULA — Working Prototype for Smart India Hackathon (SIH Problem Statement 26036) • Developed by Team FriendlyFire
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Legal Metrology Act, 2009 • Legal Metrology (General) Rules, 2011 • GATC Rules 2013/2026 • Department of Consumer Affairs, Govt. of India
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
    </div>
  );
};
