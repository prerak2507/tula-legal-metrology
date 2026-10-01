import React from 'react';
import { InstrumentStatus, ApplicationStatus } from '../../types';

interface StatusBadgeProps {
  status: InstrumentStatus | ApplicationStatus | 'VALID' | 'EXPIRED' | 'REVOKED' | 'SUPERSEDED' | 'PASS' | 'FAIL' | 'ADJUSTMENT_REQUIRED' | 'RETEST_REQUIRED' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-bold',
  }[size];

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';

  switch (status) {
    case 'ACTIVE':
    case 'VALID':
    case 'PASS':
    case 'COMPLETED':
    case 'ACCEPTED':
    case 'FEE_PAID':
    case 'CERTIFICATE_GENERATED':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500/20';
      break;

    case 'EXPIRING_SOON':
    case 'UNDER_SCRUTINY':
    case 'INSPECTION_PENDING':
    case 'INSPECTION_IN_PROGRESS':
    case 'SCHEDULED':
    case 'FEE_PENDING':
    case 'ASSIGNMENT_PENDING':
    case 'ASSIGNED':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-500/20';
      break;

    case 'EXPIRED':
    case 'REVOKED':
    case 'FAIL':
    case 'REJECTED':
    case 'SUSPENDED':
    case 'CANCELLED':
      colorClasses = 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-500/20';
      break;

    case 'CORRECTION_REQUIRED':
    case 'ADJUSTMENT_REQUIRED':
    case 'RETEST_REQUIRED':
      colorClasses = 'bg-orange-50 text-orange-800 border-orange-300 ring-1 ring-orange-500/20';
      break;

    case 'REGISTERED':
    case 'SUBMITTED':
    case 'DRAFT':
    case 'UNDER_VERIFICATION':
    case 'OPEN':
      colorClasses = 'bg-gov-50 text-gov-800 border-gov-300 ring-1 ring-gov-500/20';
      break;
  }

  // Format label
  const formattedText = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${sizeClasses} tracking-wide uppercase transition-all shadow-sm`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {formattedText}
    </span>
  );
};
