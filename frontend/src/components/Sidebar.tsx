import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  FileText,
  Repeat,
  Clock,
  Building,
  Users,
  ShieldCheck,
  ShieldAlert,
  Lock,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { user, isAdmin, isHOD, isEmployee, isCA } = useAuth();

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full overflow-y-auto no-scrollbar select-none">
      <div className="p-3 sm:p-3.5 space-y-4">
        {/* Workspace Scope Pill */}
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Authorized Scope
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Session Authenticated" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
              {isAdmin && <ShieldCheck className="w-3 h-3 text-brand-600" />}
              {isHOD && <Building className="w-3 h-3 text-amber-600" />}
              {isCA && <FileText className="w-3 h-3 text-sky-600" />}
              {isEmployee && <Clock className="w-3 h-3 text-emerald-600" />}
            </div>
            <div className="text-xs font-bold text-slate-800 truncate">
              {isAdmin && 'Global Enterprise Scope'}
              {isHOD && `${user?.department} Lead`}
              {isCA && 'Financial Auditor Scope'}
              {isEmployee && `${user?.department || 'Operations'} Staff`}
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="space-y-3.5">
          {/* Financial Operations */}
          {(isAdmin || isCA) && (
            <div>
              <div className="px-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center justify-between">
                <span>Financial Suite</span>
                <span className="text-[9px] font-mono text-slate-400">REV</span>
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => handleSelectTab('billing-dashboard')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'billing-dashboard'
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <LayoutDashboard className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'billing-dashboard' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Billing Intelligence</span>
                  </div>
                  {isCA && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded border font-semibold ${
                        activeTab === 'billing-dashboard'
                          ? 'bg-brand-700 text-white border-brand-500'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      RO
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleSelectTab('invoices')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'invoices'
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'invoices' ? 'text-white' : 'text-slate-400'}`} />
                    <span>One-Time Invoices</span>
                  </div>
                  {isCA && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded border font-semibold ${
                        activeTab === 'invoices'
                          ? 'bg-brand-700 text-white border-brand-500'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      RO
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleSelectTab('recurring')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'recurring'
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Repeat className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'recurring' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Continuous Billing</span>
                  </div>
                  {isCA && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded border font-semibold ${
                        activeTab === 'recurring'
                          ? 'bg-brand-700 text-white border-brand-500'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      RO
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Workforce & Attendance */}
          <div>
            <div className="px-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center justify-between">
              <span>Workforce Suite</span>
              <span className="text-[9px] font-mono text-slate-400">HR</span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleSelectTab('attendance')}
                className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'attendance'
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'attendance' ? 'text-white' : 'text-slate-400'}`} />
                <span>
                  {isAdmin && 'Global Attendance'}
                  {isHOD && 'Department Timesheets'}
                  {isEmployee && 'My Attendance'}
                  {isCA && 'Staff Audit Logs'}
                </span>
              </button>

              {isHOD && (
                <button
                  onClick={() => handleSelectTab('department-team')}
                  className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'department-team'
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Building className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'department-team' ? 'text-white' : 'text-slate-400'}`} />
                  <span>My Department Team</span>
                </button>
              )}
            </div>
          </div>

          {/* Governance & Security */}
          <div>
            <div className="px-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center justify-between">
              <span>Governance &amp; Security</span>
              <span className="text-[9px] font-mono text-slate-400">SYS</span>
            </div>
            <div className="space-y-0.5">
              {isAdmin && (
                <button
                  onClick={() => handleSelectTab('users')}
                  className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'users' ? 'text-white' : 'text-slate-400'}`} />
                  <span>User &amp; Role Admin</span>
                </button>
              )}

              <button
                onClick={() => handleSelectTab('rbac-matrix')}
                className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'rbac-matrix'
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'rbac-matrix' ? 'text-white' : 'text-slate-400'}`} />
                <span>RBAC Security Matrix</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Compliance Badge */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 shrink-0">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5 font-medium">
            <Lock className="w-3 h-3 text-brand-600 shrink-0" />
            <span>RBAC Enforced</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">v2.4</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between shrink-0 h-full overflow-y-auto no-scrollbar select-none">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden z-10 animate-in slide-in-from-left duration-200">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
                  JBI
                </div>
                <span className="font-bold text-slate-900 text-xs">CRM Navigation</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {navContent}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
