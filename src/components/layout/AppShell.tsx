import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Globe, GitBranch } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { RoleSwitcherDropdown } from './RoleSwitcherDropdown';
import { DemoControlModal } from '../demo/DemoControlModal';
import { ConnectedWorkflowModal } from '../common/ConnectedWorkflowModal';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        {/* Top Header Bar with Integrated Role Switcher */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
          {/* National Tricolor Top Accent */}
          <div className="h-[3px] w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#1F497D] text-sm tracking-tight">TULA</span>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">•</span>
                  <span className="text-[11px] text-slate-600 font-semibold hidden sm:inline">
                    Online Verification System for Weights &amp; Measures
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Department of Consumer Affairs • Ministry of Consumer Affairs, Food &amp; Public Distribution
                </p>
              </div>
            </div>

            {/* Top Bar Quick Links & Role Switcher */}
            <div className="flex items-center gap-1.5">
              <Link
                to="/"
                className="p-2 rounded-xl text-slate-500 hover:text-[#1F497D] hover:bg-slate-100 transition-colors"
                title="Return to Public Landing Page"
              >
                <Globe className="w-4 h-4 text-[#0070C0]" />
              </Link>

              <button
                onClick={() => setIsWorkflowModalOpen(true)}
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-semibold text-blue-900 transition-colors shadow-2xs"
                title="View how all 6 stakeholder roles connect in real-time"
              >
                <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                <span>Connected Workflow</span>
              </button>

              <RoleSwitcherDropdown
                currentUser={currentUser}
                onOpenDemoControl={() => setIsDemoModalOpen(true)}
              />
            </div>
          </div>
        </header>

        {/* Demo Data Notice Banner */}
        <div className="bg-amber-50/90 border-b border-amber-200/70 px-4 sm:px-6 py-1.5 flex items-center justify-between text-[11px] text-amber-950">
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase tracking-wider text-[9px] bg-amber-200/90 text-amber-950 px-1.5 py-0.5 rounded border border-amber-300">
              Demo Data Active
            </span>
            <span className="hidden sm:inline">
              Operating with seeded statutory records for SIH Problem Statement 26036 (Department of Consumer Affairs) prototype evaluation.
            </span>
            <span className="sm:hidden">
              SIH 26036 Demo Data Active
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/login" className="text-amber-800 hover:text-amber-950 font-bold hover:underline">
              Switch Gateway Account &rarr;
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
    </div>
  );
};
