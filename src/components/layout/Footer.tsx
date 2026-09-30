import React from 'react';
import { Scale, ShieldCheck, FileText, ExternalLink } from 'lucide-react';
import { TulaLogo } from '../common/TulaLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 text-xs border-t border-slate-800 mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Portal Overview */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3 text-white">
              <TulaLogo variant="mark" size="sm" theme="light" />
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white">TULA</span>
                <span className="ml-2 text-xs text-sky-300 font-medium">Verified weights and measures</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              Unified digital prototype platform for end-to-end verification, re-verification, scrutiny, field inspection, stamping, and digital certification of weighing and measuring instruments under the Legal Metrology Act, 2009 (Act 1 of 2010).
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SHA-256 Tamper Evident
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-sky-400" /> verification Compliant
              </span>
            </div>
          </div>

          {/* Col 2: Statutory Acts & Rules */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Statutory References</h4>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>• The Legal Metrology Act, 2009</li>
              <li>• The Legal Metrology (General) Rules, 2011</li>
              <li>• Legal Metrology (GATC) Rules, 2013 &amp; 2026</li>
              <li>• Legal Metrology (Model Approval) Rules, 2011</li>
              <li>• First Schedule Verification Fees</li>
            </ul>
          </div>

          {/* Col 3: Hackathon Prototype Notice */}
          <div>
            <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-3">Prototype Disclosure</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Developed as a demonstration prototype for Smart India Hackathon Problem Statement 26036 (Department of Consumer Affairs). Certificates and digital stamps generated within this platform are for demonstration and verification simulation purposes.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <p>© 2026 Department of Consumer Affairs, Ministry of Consumer Affairs, Food &amp; Public Distribution.</p>
          <p className="font-mono text-[10px] text-slate-400">
            System ID: SIH-26036-LM-PROD • Build v2.4.0 (Offline-Ready)
          </p>
        </div>
      </div>
    </footer>
  );
};
