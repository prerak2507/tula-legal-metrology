import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserProfile, NotificationItem } from '../../types';
import { storage } from '../../services/storage';
import {
  Scale,
  LayoutDashboard,
  FileText,
  QrCode,
  Award,
  Smartphone,
  ShieldAlert,
  FileBarChart2,
  History,
  Settings,
  Bell,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Calendar,
} from 'lucide-react';

import { TulaLogo } from '../common/TulaLogo';

interface SidebarProps {
  currentUser: UserProfile;
  notifications: NotificationItem[];
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser, notifications, collapsed, setCollapsed }) => {
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = notifications.filter(n => !n.read);

  // Role-customized task-oriented navigation
  const navSections = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: currentUser.role === 'BUSINESS' ? 'My Workflow' : 'Operational Work',
      items: [
        { label: currentUser.role === 'BUSINESS' ? 'Verification Requests' : 'Applications Queue', path: '/applications', icon: FileText },
        {
          label: currentUser.role === 'BUSINESS' ? 'Scheduled Premises Visits' : currentUser.role === 'GATC' ? 'Lab Testing Hub' : 'Field Inspection HUD',
          path: '/field',
          icon: currentUser.role === 'BUSINESS' ? Calendar : Smartphone,
          highlight: currentUser.role === 'LMO' || currentUser.role === 'GATC',
        },
      ],
    },
    {
      label: 'Instrument Lifecycle',
      items: [
        { label: currentUser.role === 'BUSINESS' ? 'My Instrument Fleet' : 'Instrument Registry', path: '/instruments', icon: Scale },
        { label: currentUser.role === 'BUSINESS' ? 'Verification Certificates' : 'Schedule IX Certificates', path: '/certificates', icon: Award },
      ],
    },
    {
      label: 'Trust & Compliance',
      items: [
        { label: 'Live QR Public Verification', path: '/verify', icon: QrCode },
        { label: currentUser.role === 'BUSINESS' ? 'Notices & Compliance' : 'Enforcement & Grievances', path: '/enforcement', icon: ShieldAlert },
      ],
    },
    {
      label: 'Governance & Audit',
      items: [
        { label: currentUser.role === 'BUSINESS' ? 'Compliance Analytics' : 'Reports & Pendency', path: '/reports', icon: FileBarChart2 },
        { label: 'Statutory Audit Trail', path: '/audit', icon: History },
        ...((currentUser.role === 'STATE_ADMIN' || currentUser.role === 'CENTRAL_ADMIN' || currentUser.role === 'CONTROLLER')
          ? [{ label: 'Legal Metrology Rules Engine', path: '/admin/rules', icon: Settings }]
          : []),
      ],
    },
  ];

  // Dynamic role-based quick action button
  const getQuickAction = () => {
    if (currentUser.role === 'BUSINESS') {
      return { label: 'Apply for Verification', path: '/applications/new', icon: PlusCircle };
    }
    if (currentUser.role === 'LMO') {
      return { label: 'Start Field Inspection', path: '/field', icon: Smartphone };
    }
    if (currentUser.role === 'GATC') {
      return { label: 'Lab Test & Stamping', path: '/field', icon: Smartphone };
    }
    if (currentUser.role === 'CONTROLLER' || currentUser.role === 'STATE_ADMIN' || currentUser.role === 'CENTRAL_ADMIN') {
      return { label: 'Analytics & Audit', path: '/reports', icon: FileBarChart2 };
    }
    return { label: 'New Application', path: '/applications/new', icon: PlusCircle };
  };
  const quickAction = getQuickAction();
  const QuickActionIcon = quickAction.icon;

  const markAllRead = () => {
    unread.forEach(n => storage.markNotificationRead(n.id));
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* ── Top: Official TULA Logo Area ── */}
      <div className={`flex items-center h-16 border-b border-slate-100 shrink-0 ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
        <Link to="/dashboard" className="flex items-center group">
          <TulaLogo size="sm" variant={collapsed ? 'mark' : 'full'} showSubtitle={!collapsed} />
        </Link>
      </div>

      {/* ── Quick Action ── */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <Link
            to={quickAction.path}
            className="flex items-center gap-2 w-full bg-gov-800 hover:bg-gov-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <QuickActionIcon className="w-4 h-4 text-amber-400" />
            <span className="truncate">{quickAction.label}</span>
          </Link>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center pt-4 pb-2">
          <Link
            to={quickAction.path}
            className="w-9 h-9 rounded-xl bg-gov-800 hover:bg-gov-900 text-white flex items-center justify-center transition-colors shadow-sm"
            title={quickAction.label}
          >
            <QuickActionIcon className="w-4 h-4 text-amber-400" />
          </Link>
        </div>
      )}

      {/* ── Nav Sections ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1.5">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                const highlight = 'highlight' in item && item.highlight;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`
                      flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200
                      ${collapsed ? 'justify-center px-0 py-2.5 mx-auto w-11 h-11' : 'px-3 py-2.5'}
                      ${isActive
                        ? 'bg-gov-50 text-gov-800 font-semibold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }
                      ${highlight && !isActive ? 'ring-1 ring-amber-300/50 bg-amber-50/40' : ''}
                    `}
                  >
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-gov-700' : 'text-slate-400'
                    }`} />
                    {!collapsed && <span>{item.label}</span>}
                    {isActive && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gov-700" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom: Notification + User ── */}
      <div className="border-t border-slate-100 shrink-0">
        {/* Notifications */}
        <div className="relative px-3 py-2">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={`
              flex items-center gap-3 w-full rounded-xl text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all
              ${collapsed ? 'justify-center px-0 py-2.5 mx-auto w-11 h-11' : 'px-3 py-2.5'}
            `}
            title="Notifications"
          >
            <div className="relative">
              <Bell className="w-[18px] h-[18px] text-slate-400" />
              {unread.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unread.length}
                </span>
              )}
            </div>
            {!collapsed && <span>Notifications</span>}
            {!collapsed && unread.length > 0 && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                {unread.length}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div className={`absolute ${collapsed ? 'left-16' : 'left-4 right-4'} bottom-full mb-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 w-80`}>
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">Alerts</span>
                {unread.length > 0 && (
                  <button onClick={markAllRead} className="text-[11px] font-semibold text-gov-700 hover:text-gov-900 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.slice(0, 6).map(n => (
                    <div key={n.id} className={`p-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-amber-50/40' : ''}`}>
                      <h5 className="font-semibold text-xs text-slate-900">{n.title}</h5>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => { storage.markNotificationRead(n.id); setNotifOpen(false); }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-gov-700 hover:text-gov-900 mt-1.5"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Official Auth Status */}
        <div className={`px-3 py-3 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1F497D] to-[#0070C0] text-white font-bold text-xs flex items-center justify-center cursor-default shadow-xs"
              title={`${currentUser.fullName} (${currentUser.role}) • e-Pramaan SSO Authenticated`}
            >
              {currentUser.fullName.charAt(0)}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1F497D] to-[#0070C0] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{currentUser.organization}</p>
                </div>
              </div>
              <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  e-Pramaan SSO
                </span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Link to="/" className="text-slate-500 hover:text-[#0070C0] font-semibold" title="Return to public landing page">
                    Home
                  </Link>
                  <span className="text-slate-300">•</span>
                  <Link to="/login" className="text-slate-500 hover:text-[#1F497D] font-semibold" title="Switch account at National Gateway">
                    Gateway
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className="px-3 pb-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`
              flex items-center gap-2 w-full rounded-xl text-[12px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all
              ${collapsed ? 'justify-center py-2' : 'px-3 py-2'}
            `}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
