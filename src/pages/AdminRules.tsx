import React, { useState, useEffect } from 'react';
import { DEFAULT_FEE_RULES, DEFAULT_VALIDITY_RULES, isCategoryGatcEligible } from '../services/rulesEngine';
import { FeeRule, ValidityRule, InstrumentCategory } from '../types';
import { 
  Settings, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  Layers, 
  Plus, 
  Sparkles, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Terminal,
  ExternalLink,
  Bot
} from 'lucide-react';
import { testGeminiConnection, isGeminiConfigured, askMetrologyAssistant } from '../services/gemini';
import { checkSupabaseConnection, isSupabaseConfigured } from '../services/supabase';

export const AdminRules: React.FC = () => {
  const [feeRules, setFeeRules] = useState<FeeRule[]>(DEFAULT_FEE_RULES);
  const [validityRules, setValidityRules] = useState<ValidityRule[]>(DEFAULT_VALIDITY_RULES);

  // Cloud status state
  const [geminiStatus, setGeminiStatus] = useState<{ testing: boolean; ok?: boolean; message?: string }>({
    testing: false,
    ok: isGeminiConfigured,
    message: isGeminiConfigured ? 'VITE_GEMINI_API_KEY configured (Ready to test)' : 'Missing key'
  });
  const [geminiSampleResponse, setGeminiSampleResponse] = useState<string | null>(null);

  const [supabaseStatus, setSupabaseStatus] = useState<{ testing: boolean; ok?: boolean; message?: string; tablesExist?: boolean }>({
    testing: false,
    ok: isSupabaseConfigured,
    message: isSupabaseConfigured ? 'Supabase credentials configured' : 'Missing credentials'
  });

  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Run initial health check
  useEffect(() => {
    runSupabaseCheck();
    runGeminiCheck();
  }, []);

  const runGeminiCheck = async () => {
    setGeminiStatus({ testing: true });
    try {
      const res = await testGeminiConnection();
      setGeminiStatus({ testing: false, ok: res.ok, message: res.message });
      if (res.ok) {
        // Fetch a quick 1-sentence regulatory proof
        const answer = await askMetrologyAssistant('In 1 clear sentence, state Section 24 requirement under Legal Metrology Act 2009.');
        setGeminiSampleResponse(answer);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setGeminiStatus({ testing: false, ok: false, message: errorMsg });
    }
  };

  const runSupabaseCheck = async () => {
    setSupabaseStatus(prev => ({ ...prev, testing: true }));
    try {
      const res = await checkSupabaseConnection();
      setSupabaseStatus({ 
        testing: false, 
        ok: res.ok, 
        message: res.message, 
        tablesExist: res.tablesExist 
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setSupabaseStatus({ testing: false, ok: false, message: errorMsg });
    }
  };

  const copySqlToClipboard = () => {
    const sql = `-- Legal Metrology Online Verification System Schema (SIH 26036)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    organization TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    designation TEXT,
    badge_number TEXT,
    gatc_code TEXT,
    jurisdiction_office TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instruments (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    category_name TEXT NOT NULL,
    accuracy_class TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    model_approval_number TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    capacity TEXT NOT NULL,
    scale_interval TEXT NOT NULL,
    purchase_date DATE,
    installation_date DATE,
    owner_id UUID,
    owner_name TEXT NOT NULL,
    organization TEXT NOT NULL,
    installation_address TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    status TEXT NOT NULL,
    last_verification_date DATE,
    next_verification_due_date DATE NOT NULL,
    current_certificate_id TEXT,
    current_stamp_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    instrument_id TEXT,
    applicant_id UUID,
    applicant_name TEXT NOT NULL,
    organization TEXT NOT NULL,
    service_type TEXT NOT NULL,
    status TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    location TEXT NOT NULL,
    preferred_date DATE,
    assigned_to_type TEXT,
    assigned_to_name TEXT,
    scheduled_date DATE,
    scheduled_time_slot TEXT,
    fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    fee_status TEXT DEFAULT 'UNPAID',
    payment_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-gov-700" />
          <span className="text-xs font-bold text-gov-800 uppercase tracking-wider">
            National Metrology Master Engine
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Statutory Rules, Fee Engine &amp; Cloud Integration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configurable rule engine for statutory verification fee schedules, validity terms, Google Gemini AI scrutiny, and Supabase cloud persistence.
        </p>
      </div>

      {/* Cloud & AI Infrastructure Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gemini AI Card */}
        <div className="p-5 bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/40 rounded-xl border border-purple-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  Google Gemini AI Engine
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    geminiStatus.ok 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {geminiStatus.ok ? 'Active ⚡' : 'Offline'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">Model: gemini-3.5-flash / gemini-3.8-flash</p>
              </div>
            </div>

            <button
              onClick={runGeminiCheck}
              disabled={geminiStatus.testing}
              className="p-2 rounded-lg bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 transition-colors cursor-pointer"
              title="Test Gemini API Live"
            >
              <RefreshCw className={`w-4 h-4 ${geminiStatus.testing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <p className="text-xs text-slate-600">
            {geminiStatus.message}
          </p>

          {geminiSampleResponse && (
            <div className="p-3 bg-white rounded-lg border border-purple-100 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-[10px] text-purple-900 uppercase tracking-wider flex items-center gap-1">
                <Bot className="w-3 h-3 text-purple-600" />
                Live Gemini Grounded Response:
              </span>
              <p className="italic text-[11px] text-slate-800">"{geminiSampleResponse}"</p>
            </div>
          )}

          <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Key: <code className="bg-purple-100/60 px-1 py-0.5 rounded font-mono text-[10px]">VITE_GEMINI_API_KEY</code></span>
            <span className="font-semibold text-purple-800">Scrutiny &amp; Regulatory Q&amp;A Enabled</span>
          </div>
        </div>

        {/* Supabase Card */}
        <div className="p-5 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 rounded-xl border border-emerald-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  Supabase PostgreSQL Cloud
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    supabaseStatus.ok 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {supabaseStatus.ok ? 'Connected (Auth 200)' : 'Disconnected'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">mpxaxvimwrnaclftngva.supabase.co</p>
              </div>
            </div>

            <button
              onClick={runSupabaseCheck}
              disabled={supabaseStatus.testing}
              className="p-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 transition-colors cursor-pointer"
              title="Test Supabase Live"
            >
              <RefreshCw className={`w-4 h-4 ${supabaseStatus.testing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <p className="text-xs text-slate-600">
            {supabaseStatus.message}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={copySqlToClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied SQL Script!' : 'Copy SQL Schema Script'}</span>
            </button>
            <span className="text-[11px] text-slate-500">Paste in Supabase SQL Editor</span>
          </div>

          <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Fallback: <strong className="text-slate-700">Zero-latency Offline Cache</strong></span>
            <span className="font-semibold text-emerald-800">SIH Demo Resilient</span>
          </div>
        </div>
      </div>


      {/* Fee Engine Rules (First Schedule, General Rules 2011) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gov-700" />
              Statutory Verification Fee Rules (First Schedule)
            </h3>
            <p className="text-[11px] text-slate-500">Legal Metrology (General) Rules, 2011 Schedule Rates</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Instrument Category</th>
                <th className="py-2.5 px-3">Capacity Bracket</th>
                <th className="py-2.5 px-3">Statutory Fee</th>
                <th className="py-2.5 px-3">User Charge</th>
                <th className="py-2.5 px-3">Total Payable</th>
                <th className="py-2.5 px-3">Statutory Authority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feeRules.map(rule => (
                <tr key={rule.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 font-mono font-bold text-gov-800">{rule.id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{rule.category.replace(/_/g, ' ')}</td>
                  <td className="py-3 px-3 text-slate-700 font-medium">{rule.capacityRange}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">₹{rule.statutoryFee}</td>
                  <td className="py-3 px-3 text-slate-600 font-medium">₹{rule.userCharge}</td>
                  <td className="py-3 px-3 font-extrabold text-emerald-800">₹{rule.statutoryFee + rule.userCharge}</td>
                  <td className="py-3 px-3 text-[11px] text-slate-500 max-w-xs">{rule.ruleCitation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validity Periods Rules */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-gov-700" />
            Statutory Validity Term Configuration
          </h3>
          <p className="text-[11px] text-slate-500">Periodicity under Section 24 and State Legal Metrology Enforcement Rules</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Instrument Category</th>
                <th className="py-2.5 px-3">Validity Term</th>
                <th className="py-2.5 px-3">Statutory Rule Description</th>
                <th className="py-2.5 px-3">Legal Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {validityRules.map((rule, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 font-semibold text-slate-900">{rule.category.replace(/_/g, ' ')}</td>
                  <td className="py-3 px-3 font-bold text-gov-800">
                    <span className="px-2 py-0.5 rounded bg-gov-50 border border-gov-200">
                      {rule.validityMonths} Months
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{rule.description}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{rule.statutoryReference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GATC 2026 Delegation Matrix */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-700" />
          GATC Statutory Delegation Matrix (2026 Amendments)
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Under the <strong>Legal Metrology (Government Approved Test Centre) Amendment Rules, 2026</strong>, 23 categories of instruments may be delegated to accredited private GATCs and RRSL facilities for verification and stamping:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 text-xs">
          {[
            'Fuel Dispensers (Petrol/Diesel)',
            'CNG Gas Dispensers',
            'LPG & LNG Delivery Units',
            'Hydrogen Fuel Dispensers',
            'Water Meters (Residential & Bulk)',
            'Industrial Mass Flow Meters',
            'Heavy Weighbridges (Road/Rail)',
            'Platform Weighing Scales',
            'Automatic Gravimetric Filling Scales',
          ].map((cat, i) => (
            <div key={i} className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200 flex items-center gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span className="font-semibold text-slate-800">{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
