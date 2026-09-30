import React, { useState } from 'react';
import { DEFAULT_FEE_RULES, DEFAULT_VALIDITY_RULES } from '../services/rulesEngine';
import { FeeRule, ValidityRule } from '../types';
import { Settings, DollarSign, Clock, Layers } from 'lucide-react';

export const AdminRules: React.FC = () => {
  const [feeRules, _setFeeRules] = useState<FeeRule[]>(DEFAULT_FEE_RULES);
  const [validityRules, _setValidityRules] = useState<ValidityRule[]>(DEFAULT_VALIDITY_RULES);

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
          Statutory Rules &amp; Fee Engine Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configurable rule engine for statutory verification fee schedules, validity terms, and GATC eligibility matrices.
        </p>
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
