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
  LogOut,
  HelpCircle,
  PlusCircle,
  Calendar,
  Globe,
  X,
  PlayCircle,
  ListChecks,
} from 'lucide-react';

import { TulaLogo } from '../common/TulaLogo';

interface SidebarProps {
  currentUser: UserProfile;
  notifications: NotificationItem[];
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser, notifications, collapsed: collapsedProp, setCollapsed, mobileOpen, onMobileClose }) => {
  const location = useLocation();
  // The drawer on phones is always full width; collapse only applies on large screens.
  const collapsed = collapsedProp && !mobileOpen;
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = notifications.filter(n => !n.read);

  // Role-customized task-oriented navigation
  const isBiz = currentUser.role === 'BUSINESS';
  const isField = currentUser.role === 'LMO' || currentUser.role === 'GATC';
  const navSections = [
    {
      label: 'Overview',
      items: [
        { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Work',
      items: [
        { label: isBiz ? 'My applications' : 'Applications', path: '/applications', icon: FileText },
        {
          label: isBiz ? 'Inspection visits' : currentUser.role === 'GATC' ? 'Test centre jobs' : 'Field inspection',
          path: '/field',
          icon: isBiz ? Calendar : Smartphone,
          highlight: isField,
        },
      ],
    },
    {
      label: 'Records',
      items: [
        { label: isBiz ? 'My instruments' : 'Instrument register', path: '/instruments', icon: Scale },
        { label: 'Certificates', path: '/certificates', icon: Award },
        { label: isBiz ? 'Notices' : 'Enforcement', path: '/enforcement', icon: ShieldAlert },
      ],
    },
    {
      label: 'Oversight',
      items: [
        { label: isBiz ? 'Reports' : 'Pendency and reports', path: '/reports', icon: FileBarChart2 },
        { label: 'SMS and email updates', path: '/notifications', icon: Bell },
        { label: 'Audit trail', path: '/audit', icon: History },
        ...((currentUser.role === 'STATE_ADMIN' || currentUser.role === 'CENTRAL_ADMIN' || currentUser.role === 'CONTROLLER')
          ? [{ label: 'Fees and rules', path: '/admin/rules', icon: Settings }]
          : []),
      ],
    },
    {
      label: 'Public and prototype',
      items: [
        { label: 'Check a certificate', path: '/verify', icon: QrCode },
        { label: 'Guided demo', path: '/demo', icon: PlayCircle },
        { label: 'Built vs planned', path: '/status', icon: ListChecks },
      ],
    },
  ];

  // Dynamic role-based quick action button
  const getQuickAction = () => {
    if (currentUser.role === 'BUSINESS') {
      return { label: 'Apply for verification', path: '/applications/new', icon: PlusCircle };
    }
    if (currentUser.role === 'LMO') {
      return { label: "Today's inspections", path: '/field', icon: Smartphone };
    }
    if (currentUser.role === 'GATC') {
      return { label: "Today's test jobs", path: '/field', icon: Smartphone };
    }
    if (currentUser.role === 'CONTROLLER' || currentUser.role === 'STATE_ADMIN' || currentUser.role === 'CENTRAL_ADMIN') {
      return { label: currentUser.role === 'CONTROLLER' ? 'Pending applications' : 'Pendency and reports', path: currentUser.role === 'CONTROLLER' ? '/applications' : '/reports', icon: currentUser.role === 'CONTROLLER' ? FileText : FileBarChart2 };
    }
    return { label: 'New Application', path: '/applications/new', icon: PlusCircle };
  };
  const quickAction = getQuickAction();
  const QuickActionIcon = quickAction.icon;

  const markAllRead = () => {
    unread.forEach(n => storage.markNotificationRead(n.id));
  };

  return (
    <>
    {mobileOpen && (
      <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={onMobileClose} aria-hidden="true" />
    )}
    <aside
      aria-label="Main navigation"
      className={`fixed top-0 left-0 h-[100dvh] z-50 flex flex-col bg-white border-r border-paper-300 transition-all duration-300 ease-in-out w-[280px] max-w-[85vw] ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      } lg:translate-x-0 lg:shadow-none ${collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'}`}
    >
      {/* ── Top: Official TULA Logo Area ── */}
      <div className={`flex items-center h-16 border-b border-slate-100 shrink-0 ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
        <Link to="/dashboard" className="flex items-center group">
          <TulaLogo size="sm" variant={collapsed ? 'mark' : 'full'} showSubtitle={!collapsed} />
        </Link>
        <button onClick={onMobileClose} className="ml-auto p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Quick Action ── */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <Link
            to={quickAction.path}
            className="flex items-center gap-2 w-full bg-ink hover:bg-ink-800 text-paper font-semibold text-[13px] px-4 py-2.5 rounded-md min-h-[44px] transition-colors shadow-sm"
          >
            <QuickActionIcon className="w-4 h-4 text-brass-300" />
            <span className="truncate">{quickAction.label}</span>
          </Link>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center pt-4 pb-2">
          <Link
            to={quickAction.path}
            className="w-10 h-10 rounded-md bg-ink hover:bg-ink-800 text-white flex items-center justify-center transition-colors shadow-sm"
            title={quickAction.label}
          >
            <QuickActionIcon className="w-4 h-4 text-brass-300" />
          </Link>
        </div>
      )}

      {/* ── Nav Sections ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="font-readout text-[10px] font-medium text-brass-700 uppercase tracking-[0.16em] px-3 mb-1.5">
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
                      flex items-center gap-3 rounded-md text-[13px] font-medium transition-all duration-200 border-l-[3px]
                      ${collapsed ? 'justify-center px-0 py-2.5 mx-auto w-11 h-11' : 'px-3 py-2.5'}
                      ${isActive
                        ? 'bg-paper-100 text-ink font-semibold border-brass'
                        : 'text-ink-600 hover:text-ink hover:bg-paper-50 border-transparent'
                      }
                      ${highlight && !isActive ? 'bg-brass-200/30' : ''}
                    `}
                  >
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-brass-700' : 'text-ink-600/70'
                    }`} />
                    {!collapsed && <span>{item.label}</span>}
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
            <div className={`absolute ${collapsed ? 'left-16' : 'left-4 right-4'} bottom-full mb-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 w-[min(20rem,80vw)]`}>
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
              className="w-9 h-9 rounded-xl bg-ink text-white font-bold text-xs flex items-center justify-center cursor-default shadow-xs"
              title={`${currentUser.fullName} (${currentUser.role})`}
            >
              {currentUser.fullName.charAt(0)}
            </div>
          ) : (
            <div className="p-2.5 rounded-md bg-paper-50 border border-paper-300 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-ink text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{currentUser.organization}</p>
                </div>
              </div>
              <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                  <span className={`w-1.5 h-1.5 rounded-full ${currentUser.accountType === 'SELF' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {currentUser.accountType === 'SELF' ? 'Registered account' : 'Demo account'}
                </span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Link to="/" className="text-slate-500 hover:text-gov-600 font-semibold" title="Return to public landing page">
                    Home
                  </Link>
                  <span className="text-slate-300">•</span>
                  <button onClick={async () => { await storage.signOut(); window.location.assign('/login'); }} className="text-slate-500 hover:text-rose-700 font-semibold" title="Sign out">
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapse Toggle (large screens only) */}
        <div className="px-3 pb-3 hidden lg:block">
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
    </>
  );
};
