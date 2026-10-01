import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const InstrumentsList = lazy(() => import('./pages/InstrumentsList').then(m => ({ default: m.InstrumentsList })));
const InstrumentDetail = lazy(() => import('./pages/InstrumentDetail').then(m => ({ default: m.InstrumentDetail })));
const ApplicationsList = lazy(() => import('./pages/ApplicationsList').then(m => ({ default: m.ApplicationsList })));
const ApplicationNew = lazy(() => import('./pages/ApplicationNew').then(m => ({ default: m.ApplicationNew })));
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail').then(m => ({ default: m.ApplicationDetail })));
const FieldInspection = lazy(() => import('./pages/FieldInspection').then(m => ({ default: m.FieldInspection })));
const CertificatesList = lazy(() => import('./pages/CertificatesList').then(m => ({ default: m.CertificatesList })));
const CertificateView = lazy(() => import('./pages/CertificateView').then(m => ({ default: m.CertificateView })));
const PublicVerify = lazy(() => import('./pages/PublicVerify').then(m => ({ default: m.PublicVerify })));
const EnforcementList = lazy(() => import('./pages/EnforcementList').then(m => ({ default: m.EnforcementList })));
const ReportsView = lazy(() => import('./pages/ReportsView').then(m => ({ default: m.ReportsView })));
const AuditLogView = lazy(() => import('./pages/AuditLogView').then(m => ({ default: m.AuditLogView })));
const AdminRules = lazy(() => import('./pages/AdminRules').then(m => ({ default: m.AdminRules })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const StatusPage = lazy(() => import('./pages/StatusPage').then(m => ({ default: m.StatusPage })));
const HelpPage = lazy(() => import('./pages/InfoPages').then(m => ({ default: m.HelpPage })));
const AccessibilityPage = lazy(() => import('./pages/InfoPages').then(m => ({ default: m.AccessibilityPage })));
const PrivacyPage = lazy(() => import('./pages/InfoPages').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/InfoPages').then(m => ({ default: m.TermsPage })));
const DemoGuide = lazy(() => import('./pages/DemoGuide').then(m => ({ default: m.DemoGuide })));

const PageSkeleton: React.FC = () => (
  <div className="p-6 space-y-3 animate-pulse" aria-busy="true" aria-label="Loading">
    <div className="h-6 w-1/3 bg-paper-200 rounded" />
    <div className="h-4 w-2/3 bg-paper-200 rounded" />
    <div className="h-32 w-full bg-paper-100 rounded-xl" />
  </div>
);
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Public Landing Page — the world-class homepage */}
        <Route path="/" element={<LandingPage />} />

        {/* Unauthenticated / Standalone Routes */}
        <Route path="/verify" element={<PublicVerify />} />
        <Route path="/verify/:certificateId" element={<PublicVerify />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/demo" element={<DemoGuide />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Authenticated Application Shell with Sidebar */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/instruments" element={<InstrumentsList />} />
          <Route path="/instruments/:id" element={<InstrumentDetail />} />
          <Route path="/applications" element={<ApplicationsList />} />
          <Route path="/applications/new" element={<ApplicationNew />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/field" element={<FieldInspection />} />
          <Route path="/inspections" element={<FieldInspection />} />
          <Route path="/certificates" element={<CertificatesList />} />
          <Route path="/certificates/:id" element={<CertificateView />} />
          <Route path="/enforcement" element={<EnforcementList />} />
          <Route path="/reports" element={<ReportsView />} />
          <Route path="/audit" element={<AuditLogView />} />
          <Route path="/admin/rules" element={<AdminRules />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* Customized 404 Not Found Catch-All Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
