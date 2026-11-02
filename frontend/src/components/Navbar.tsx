import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Clock,
  LogOut,
  Search,
  Building2,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'Admin':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
          label: 'Super Admin',
        };
      case 'HOD':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: `HOD • ${user?.department || 'Dept'}`,
        };
      case 'CA':
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          dot: 'bg-sky-500',
          label: 'Auditor CA (Read-Only)',
        };
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: `Employee • ${user?.department || 'General'}`,
        };
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const badge = getRoleBadge(user?.role);

  return (
    <header className="h-16 shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 select-none shadow-xs">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Toggle + Brand & Workspace */}
        <div className="flex items-center space-x-2 sm:space-x-3.5 shrink-0">
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl lg:hidden cursor-pointer"
            title="Toggle Menu"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-black text-xs sm:text-sm tracking-tight shadow-md shadow-brand-500/20 shrink-0">
              JBI
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">
                  JBI Enterprise CRM
                </span>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                  Cloud v2.4
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[160px] md:max-w-none">Jadhavar Business Intelligence</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Quick Search bar (Linear / Attio style) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              <span className="text-slate-500 group-hover:text-slate-700">Quick search invoices, clients, staff...</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right: Live Telemetry & User Profile */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Mobile search icon button */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
            title="Quick Search"
            aria-label="Open search dialog"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Live System Indicator (Desktop) */}
          <div className="hidden xl:flex items-center space-x-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/90 text-emerald-700 font-medium text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Online</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500 text-xs bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-[11px] font-medium text-slate-700">{time}</span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* User profile dropdown pill */}
          {user && (
            <div className="flex items-center space-x-1.5 sm:space-x-2.5">
              <div className="flex items-center space-x-2 p-1 sm:pl-2.5 sm:pr-2 sm:py-1 bg-slate-50 sm:hover:bg-slate-100/70 border border-slate-200 rounded-xl transition-colors">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-[11px] font-bold text-white shadow-2xs">
                  {getInitials(user.name)}
                </div>
                <div className="text-left hidden md:block leading-tight pr-1">
                  <div className="text-xs font-semibold text-slate-800">{user.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                title="Sign out of workspace"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Search Modal Overlay (when clicked) */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-24 px-4 overflow-y-auto"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-crm-modal p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-3 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search invoices, clients, users, or modules..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
            <div className="text-[11px] text-slate-400 px-1 flex items-center justify-between">
              <span>Quick Navigation suggestions</span>
              <span>Press ESC to close</span>
            </div>
            <div className="space-y-1 text-xs">
              <div
                onClick={() => setShowSearchModal(false)}
                className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">Billing Dashboard</span>
                  <span className="text-slate-400">&bull; Revenue &amp; Recovery metrics</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Jump</span>
              </div>
              <div
                onClick={() => setShowSearchModal(false)}
                className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">One-Time Invoices</span>
                  <span className="text-slate-400">&bull; Tax PDF generation &amp; history</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Jump</span>
              </div>
              <div
                onClick={() => setShowSearchModal(false)}
                className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">Attendance Log</span>
                  <span className="text-slate-400">&bull; Daily check-in/out &amp; timesheets</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Jump</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
