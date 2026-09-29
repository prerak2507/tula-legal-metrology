import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { InstrumentsList } from './pages/InstrumentsList';
import { InstrumentDetail } from './pages/InstrumentDetail';
import { ApplicationsList } from './pages/ApplicationsList';
import { ApplicationNew } from './pages/ApplicationNew';
import { ApplicationDetail } from './pages/ApplicationDetail';
import { FieldInspection } from './pages/FieldInspection';
import { CertificatesList } from './pages/CertificatesList';
import { CertificateView } from './pages/CertificateView';
import { PublicVerify } from './pages/PublicVerify';
import { EnforcementList } from './pages/EnforcementList';
import { ReportsView } from './pages/ReportsView';
import { AuditLogView } from './pages/AuditLogView';
import { AdminRules } from './pages/AdminRules';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page — the world-class homepage */}
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

        {/* Customized 404 Not Found Catch-All Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
