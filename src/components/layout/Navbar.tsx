import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserProfile, NotificationItem } from '../../types';
import { TulaLogo } from '../common/TulaLogo';
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
  Menu, 
  X, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { storage } from '../../services/storage';

interface NavbarProps {
  currentUser: UserProfile;
  notifications: NotificationItem[];
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, notifications }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read);

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Instruments', path: '/instruments', icon: Scale },
    { label: 'Applications', path: '/applications', icon: FileText },
    { label: 'Field Verification', path: '/field', icon: Smartphone, highlight: currentUser.role === 'LMO' || currentUser.role === 'GATC' },
    { label: 'Certificates', path: '/certificates', icon: Award },
    { label: 'Public QR Verify', path: '/verify', icon: QrCode },
    { label: 'Enforcement', path: '/enforcement', icon: ShieldAlert },
    { label: 'Reports', path: '/reports', icon: FileBarChart2 },
    { label: 'Audit Trail', path: '/audit', icon: History },
  ];

  // Admin rule engine link
  if (currentUser.role === 'STATE_ADMIN' || currentUser.role === 'CENTRAL_ADMIN' || currentUser.role === 'CONTROLLER') {
    navLinks.push({ label: 'Rules & Fees', path: '/admin/rules', icon: Settings });
  }

  const markAllRead = () => {
    unreadNotifications.forEach(n => storage.markNotificationRead(n.id));
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* National Tricolor Top Stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Emblem */}
          <Link to="/dashboard" className="flex items-center gap-3 shrink-0 group">
            <TulaLogo variant="full" theme="light" size="sm" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gov-50 text-gov-800 border-b-2 border-gov-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  } ${link.highlight ? 'ring-1 ring-amber-400/50 bg-amber-50/50 text-amber-900' : ''}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-gov-700' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons (Notifications + User profile + Mobile menu trigger) */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fadeIn">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">Alerts & Reminders</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-gov-100 text-gov-800 text-[10px] font-bold">
                        {unreadNotifications.length} new
                      </span>
                    </div>
                    {unreadNotifications.length > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] font-semibold text-gov-700 hover:text-gov-900 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">No notifications</div>
                    ) : (
                      notifications.slice(0, 8).map(n => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-amber-50/40' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-xs text-slate-900 leading-snug">{n.title}</h5>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          {n.link && (
                            <Link
                              to={n.link}
                              onClick={() => {
                                storage.markNotificationRead(n.id);
                                setNotifDropdownOpen(false);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-gov-700 hover:text-gov-900 mt-2"
                            >
                              <span>View details</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gov-700 text-white font-bold text-xs flex items-center justify-center ring-2 ring-gov-600/20">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.fullName}</p>
                <p className="text-[10px] text-slate-500 font-medium">{currentUser.organization.slice(0, 24)}...</p>
              </div>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-slate-200 space-y-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                    isActive
                      ? 'bg-gov-700 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
