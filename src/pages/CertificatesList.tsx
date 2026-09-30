import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { VerificationCertificate } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { generateCertificatePdf } from '../services/pdf';
import { 
  Award, 
  Search, 
  Filter, 
  FileDown, 
  ExternalLink, 
  QrCode, 
  ShieldCheck, 
  Calendar, 
  MapPin,
  Eye
} from 'lucide-react';

export const CertificatesList: React.FC = () => {
  const [allCertificates, setAllCertificates] = useState<VerificationCertificate[]>(storage.getCertificates());
  const [user, setUser] = useState(storage.getCurrentUser());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setAllCertificates(storage.getCertificates());
      setUser(storage.getCurrentUser());
    });
    return unsub;
  }, []);

  // Filter certificates according to persona role
  const certificates = storage.getCertificatesForUser(user);
  void allCertificates;

  const filteredCerts = certificates.filter(cert => {
    const matchesSearch = 
      cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.instrumentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getScopeLabel = () => {
    if (user.role === 'BUSINESS') return `Issued to ${user.organization}`;
    if (user.role === 'LMO') return `${user.state} Zonal Office (${user.badgeNumber || 'Inspector Grade-I'})`;
    if (user.role === 'GATC') return `GATC Accredited Facility (${user.gatcCode || user.organization})`;
    if (user.role === 'CONTROLLER') return `${user.state} State Controllerate (All Districts)`;
    if (user.role === 'STATE_ADMIN') return `${user.state} State Metrology Administration`;
    return 'National Metrology Central Registry (Pan-India)';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-gov-700" />
            <span className="text-xs font-bold text-gov-800 uppercase tracking-wider">
              Statutory Certification
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Digital Certificates of Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident legal certificates issued under Section 24 of The Legal Metrology Act, 2009 with cryptographic SHA-256 integrity.
          </p>
        </div>

        <Link
          to="/verify"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs shrink-0"
        >
          <QrCode className="w-4 h-4 text-amber-400" />
          Public QR Verification Portal
        </Link>
      </div>

      {/* Role Jurisdiction Banner */}
      <div className="bg-gov-50/80 border border-gov-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gov-700 animate-pulse" />
          <span className="font-semibold text-gov-900">Current Scope:</span>
          <span className="text-gov-800">{getScopeLabel()}</span>
        </div>
        <span className="text-[11px] font-bold text-gov-800 bg-white px-2.5 py-0.5 rounded-full border border-gov-200 shadow-xs">
          {filteredCerts.length} {filteredCerts.length === 1 ? 'Certificate' : 'Certificates'} Available
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Certificate No (e.g. DL/LM/2026/08912), Instrument UID, Serial..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-gov-600 focus:bg-white"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Filter by Certificate Status"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-gov-600 focus:bg-white"
          >
            <option value="ALL">All Certificate Statuses</option>
            <option value="VALID">Valid Certificates</option>
            <option value="EXPIRING_SOON">Expiring Soon</option>
            <option value="EXPIRED">Expired</option>
            <option value="REVOKED">Revoked / Suspended</option>
          </select>
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCerts.map(cert => (
          <div
            key={cert.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold text-gov-700 uppercase tracking-wider">
                    Verification Certificate
                  </span>
                  <h3 className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {cert.certificateNumber}
                  </h3>
                </div>
                <StatusBadge status={cert.status} size="sm" />
              </div>

              {/* Instrument & Holder */}
              <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Instrument UID:</span>
                  <Link to={`/instruments/${cert.instrumentId}`} className="font-mono font-bold text-gov-800 hover:underline">
                    {cert.instrumentId}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Occupier / Business:</span>
                  <span className="font-semibold text-slate-900 line-clamp-1">{cert.organization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal Capacity:</span>
                  <span className="font-bold text-slate-900">{cert.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stamp ID:</span>
                  <span className="font-mono font-semibold text-emerald-800">{cert.stampId}</span>
                </div>
              </div>

              {/* Validity & Authority */}
              <div className="text-xs text-slate-500 space-y-1 mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Valid From: <strong>{cert.verificationDate}</strong> to <strong>{cert.validUntil}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="line-clamp-1">{cert.issuingAuthority}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
              <Link
                to={`/certificates/${cert.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-gov-50 hover:bg-gov-100 text-gov-800 text-xs font-semibold border border-gov-200"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full</span>
              </Link>

              <div className="flex items-center gap-1.5">
                <Link
                  to={cert.qrPayloadUrl ? cert.qrPayloadUrl.replace(/^https?:\/\/[^/]+/, '') : `/verify/${encodeURIComponent(cert.certificateNumber)}`}
                  className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="Verify QR"
                >
                  <QrCode className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => generateCertificatePdf(cert)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-gov-700 hover:bg-gov-800 text-white text-xs font-semibold shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCerts.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No certificates found matching your criteria.
        </div>
      )}
    </div>
  );
};
