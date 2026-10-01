import React, { useState } from 'react';
import { GovBar } from '../components/layout/GovBar';
import { SiteFooter } from '../components/layout/SiteFooter';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Home,
  QrCode,
  LogIn,
  LayoutDashboard,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Scale,
  Compass,
} from 'lucide-react';
import { TulaLogo } from '../components/common/TulaLogo';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleQuickLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const clean = searchQuery.trim();
    // If it looks like a certificate, redirect to verify
    if (clean.toUpperCase().startsWith('IND-') || clean.toUpperCase().startsWith('CERT-') || clean.toUpperCase().startsWith('VER-')) {
      navigate(`/verify/${encodeURIComponent(clean)}`);
    } else {
      navigate(`/verify?q=${encodeURIComponent(clean)}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-paper-50 flex flex-col justify-between text-slate-800 antialiased">
      <GovBar />

      {/* Header Bar */}
      <header className="px-4 sm:px-8 py-4 border-b border-paper-300 bg-paper/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <TulaLogo size="sm" variant="full" />
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link
              to="/verify"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium"
            >
              <QrCode className="w-3.5 h-3.5 text-gov-600" />
              <span>Check a certificate</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gov-800 text-white hover:bg-gov-900 transition-colors font-bold shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Central 404 Hero Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-6">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Statutory Registry Notice • 404 Not Found</span>
        </div>

        {/* Big Stylized 404 with Metrology Balance Graphic */}
        <div className="relative inline-block mb-6 select-none">
          <span className="text-8xl sm:text-9xl font-black text-slate-200/80 tracking-tighter">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-xl border border-slate-200 flex items-center justify-center text-gov-800 animate-bounce duration-1000">
              <Scale className="w-10 h-10 text-gov-600" />
            </div>
          </div>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl font-semibold text-ink tracking-tight mb-3">
          Statutory Endpoint or Metrology Record Not Found
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed mb-8">
          The requested URL, verification certificate hash, or internal resource path does not exist in the TULA Legal Metrology Registry.
        </p>

        {/* Quick Certificate / Instrument Lookup Box */}
        <div className="max-w-md mx-auto mb-10">
          <form
            onSubmit={handleQuickLookup}
            className="flex items-center bg-white rounded-xl border border-slate-300 shadow-sm focus-within:border-gov-600 focus-within:ring-2 focus-within:ring-gov-600/20 p-1.5 transition-all"
          >
            <Search className="w-4 h-4 text-slate-400 ml-2.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Certificate ID (e.g. IND-2026-WB-0042)..."
              className="w-full text-xs sm:text-sm px-3 py-2 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-hidden"
            />
            <button
              type="submit"
              className="bg-gov-800 hover:bg-gov-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              Verify ID
            </button>
          </form>
          <p className="text-[11px] text-slate-400 mt-2 text-left px-2">
            Tip: Enter an official Verification Certificate Number to jump directly to live public verification.
          </p>
        </div>

        {/* Suggested Hub Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
          {/* Card 1: Landing Page */}
          <Link
            to="/"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-gov-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-gov-600 transition-colors flex items-center justify-between">
              Public Portal
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Return to the main homepage, problem statement overview, and architecture guide.
            </p>
          </Link>

          {/* Card 2: Public QR Scanner */}
          <Link
            to="/verify"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#1B7F5A] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#1B7F5A] transition-colors flex items-center justify-between">
              Live QR Scanner
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Open to 100% of citizens. Verify any commercial stamping certificate in real-time.
            </p>
          </Link>

          {/* Card 3: Gateway Login */}
          <Link
            to="/login"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-gov-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <LogIn className="w-5 h-5" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-gov-800 transition-colors flex items-center justify-between">
              Sign in
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Sign in as Commercial Occupier, Field Officer (LMO), GATC Laboratory, or State Controller.
            </p>
          </Link>
        </div>

        {/* Diagnostic info */}
        <div className="mt-10 inline-flex items-center gap-2 text-[11px] text-slate-400 bg-slate-100/80 px-3.5 py-1.5 rounded-full">
          <Compass className="w-3.5 h-3.5" />
          <span>Error 404: this page does not exist. Use the links above to continue.</span>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};
