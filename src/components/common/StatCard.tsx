import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  badge?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  badge,
  onClick,
}) => {
  const variantStyles = {
    blue: 'border-l-gov-700 bg-white text-gov-900',
    emerald: 'border-l-emerald-600 bg-white text-emerald-950',
    amber: 'border-l-amber-500 bg-white text-amber-950',
    rose: 'border-l-rose-600 bg-white text-rose-950',
    slate: 'border-l-slate-600 bg-white text-slate-900',
  }[variant];

  const iconBgStyles = {
    blue: 'bg-gov-50 text-gov-700 ring-1 ring-gov-600/10',
    emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10',
    rose: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10',
    slate: 'bg-slate-100 text-slate-700 ring-1 ring-slate-600/10',
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-slate-200 border-l-4 p-5 shadow-sm hover:shadow transition-all ${variantStyles} ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${iconBgStyles}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
