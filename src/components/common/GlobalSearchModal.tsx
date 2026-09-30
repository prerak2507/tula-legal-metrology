import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { Instrument, Application, VerificationCertificate } from '../../types';
import { Search, Scale, FileText, Award, ArrowRight, X, Clock, ShieldCheck } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [certificates, setCertificates] = useState<VerificationCertificate[]>([]);

  useEffect(() => {
    if (isOpen) {
      setInstruments(storage.getInstrumentsForUser());
      setApplications(storage.getApplicationsForUser());
      setCertificates(storage.getCertificatesForUser());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingInstruments = q
    ? instruments.filter(
        i =>
          i.id.toLowerCase().includes(q) ||
          i.categoryName.toLowerCase().includes(q) ||
          i.serialNumber.toLowerCase().includes(q) ||
          i.organization.toLowerCase().includes(q) ||
          i.ownerName.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const matchingCertificates = q
    ? certificates.filter(
        c =>
          c.id.toLowerCase().includes(q) ||
          c.certificateNumber.toLowerCase().includes(q) ||
          c.instrumentId.toLowerCase().includes(q) ||
          c.organization.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const matchingApplications = q
    ? applications.filter(
        a =>
          a.id.toLowerCase().includes(q) ||
          a.instrumentId.toLowerCase().includes(q) ||
          a.applicantName.toLowerCase().includes(q) ||
          a.organization.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const totalMatches = matchingInstruments.length + matchingCertificates.length + matchingApplications.length;

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by Instrument ID, Serial Number, Certificate, Application..."
            className="w-full bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Scroll Area */}
        <div className="overflow-y-auto p-3 space-y-4 flex-1">
          {!q && (
            <div className="p-6 text-center text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-700">Quick Search Shortcuts</p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setQuery('LM-DL-2026')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition-colors"
                >
                  LM-DL-2026 (Delhi Fleet)
                </button>
                <button
                  onClick={() => setQuery('CERT-2026')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition-colors"
                >
                  CERT-2026 (Certificates)
                </button>
                <button
                  onClick={() => setQuery('APP-2026')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition-colors"
                >
                  APP-2026 (Applications)
                </button>
              </div>
            </div>
          )}

          {q && totalMatches === 0 && (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-bold text-slate-800">No records found matching "{query}"</p>
              <p className="text-xs text-slate-500">
                Check for typos or try searching by serial number, owner, or state code.
              </p>
            </div>
          )}

          {/* Matching Instruments */}
          {matchingInstruments.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                Instruments ({matchingInstruments.length})
              </span>
              {matchingInstruments.map(inst => (
                <div
                  key={inst.id}
                  onClick={() => handleSelect(`/instruments/${inst.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100/80 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gov-50 text-gov-700 flex items-center justify-center shrink-0">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-gov-800">
                          {inst.id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                          {inst.categoryName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {inst.organization} • Serial: {inst.serialNumber} • Capacity: {inst.capacity}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {/* Matching Certificates */}
          {matchingCertificates.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                Certificates ({matchingCertificates.length})
              </span>
              {matchingCertificates.map(cert => (
                <div
                  key={cert.id}
                  onClick={() => handleSelect(`/certificates/${cert.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100/80 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                          {cert.certificateNumber}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                          {cert.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {cert.organization} • Instrument: {cert.instrumentId} • Valid till: {cert.validUntil}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {/* Matching Applications */}
          {matchingApplications.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                Applications ({matchingApplications.length})
              </span>
              {matchingApplications.map(app => (
                <div
                  key={app.id}
                  onClick={() => handleSelect(`/applications/${app.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100/80 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-blue-800">
                          {app.id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-medium">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {app.organization} • Target: {app.instrumentId} • Preferred: {app.preferredDate}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 px-4">
          <span>Navigate with mouse or tap</span>
          <span>Press <strong className="font-mono text-slate-700">ESC</strong> to exit</span>
        </div>
      </div>
    </div>
  );
};
