import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';

// Route-level code splitting using React.lazy
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
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh] p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-[#1F497D] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-slate-600">Loading TULA Portal...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Unauthenticated / Standalone Routes */}
          <Route path="/verify" element={<PublicVerify />} />
          <Route path="/verify/:certificateId" element={<PublicVerify />} />
          <Route path="/login" element={<Login />} />

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
          </Route>

          {/* 404 Catch-All Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
