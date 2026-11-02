import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  FileText,
  Repeat,
  Clock,
  Building,
  Users,
  ShieldAlert,
  Lock,
  FlaskConical,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAdmin, isHOD, isEmployee, isCA } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] select-none">
      <div className="p-4 space-y-6">
        {/* Workspace Scope Pill */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Active Workspace Scope
          </div>
          <div className="text-xs font-semibold">
            {isAdmin && <span className="text-indigo-700">Enterprise Administrator (Global)</span>}
            {isHOD && (
              <span className="text-amber-700">Department Lead &bull; {user?.department}</span>
            )}
            {isEmployee && (
              <span className="text-emerald-700">
                Staff Member &bull; {user?.department || 'Operations'}
              </span>
            )}
            {isCA && (
              <span className="text-sky-700">Auditor &bull; Financial Scope (Read-Only)</span>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="space-y-5">
          {/* Financial Operations */}
          {(isAdmin || isCA) && (
            <div>
              <div className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Financial Operations
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('billing-dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'billing-dashboard'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Billing Dashboard</span>
                  </div>
                  {isCA && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${
                        activeTab === 'billing-dashboard'
                          ? 'bg-indigo-700 text-white border-indigo-500'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      RO
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'invoices'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>One-Time Invoices</span>
                  </div>
                  {isCA && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${
                        activeTab === 'invoices'
                          ? 'bg-indigo-700 text-white border-indigo-500'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      RO
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('recurring')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'recurring'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Repeat className="w-4 h-4 shrink-0" />
                    <span>Continuous Billing</span>
                  </div>
                  {isCA && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${
                        activeTab === 'recurring'
                          ? 'bg-indigo-700 text-white border-indigo-500'
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
            <div className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Workforce &amp; Attendance
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'attendance'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  {isAdmin && 'Global Attendance'}
                  {isHOD && 'Department Attendance'}
                  {isEmployee && 'My Attendance'}
                  {isCA && 'Staff Timesheets'}
                </span>
              </button>

              {isHOD && (
                <button
                  onClick={() => setActiveTab('department-team')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'department-team'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4 shrink-0" />
                  <span>My Department Team</span>
                </button>
              )}
            </div>
          </div>

          {/* Governance & Quality */}
          <div>
            <div className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Governance &amp; Verification
            </div>
            <div className="space-y-1">
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'users'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>User &amp; Role Admin</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('rbac-matrix')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'rbac-matrix'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>RBAC Access Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab('test-suite')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'test-suite'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FlaskConical className="w-4 h-4 shrink-0 text-amber-500" />
                <span>System Test Suite</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Compliance Badge */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-2 text-[11px] text-slate-600">
          <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="font-semibold text-slate-800">Enterprise RBAC Policy</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Queries strictly authorized per authenticated session.
        </p>
      </div>
    </aside>
  );
};
