import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  ShieldCheck,
  Check,
  X,
  Lock,
  Info,
  Key,
  ShieldAlert,
  Building,
  Users,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

export const RbacMatrix: React.FC = () => {
  const { user } = useAuth();
  const [roleFocus, setRoleFocus] = useState<'all' | 'Admin' | 'HOD' | 'Employee' | 'CA'>('all');

  const matrixData = [
    {
      module: 'User & Role Management (CRUD)',
      admin: { allowed: true, note: 'Create, update, deactivate, assign HOD & departments' },
      hod: { allowed: false, note: 'Blocked (403 Forbidden)' },
      emp: { allowed: false, note: 'Blocked (403 Forbidden)' },
      ca: { allowed: false, note: 'Blocked (403 Forbidden)' },
    },
    {
      module: 'Cross-Department Attendance',
      admin: { allowed: true, note: 'Full visibility across all 4 departments' },
      hod: { allowed: false, note: 'Scope restricted strictly to own department' },
      emp: { allowed: false, note: 'Blocked from other employees’ data' },
      ca: { allowed: false, note: 'Blocked (403 Forbidden)' },
    },
    {
      module: 'Department-Scoped Attendance (HOD)',
      admin: { allowed: true, note: 'Can filter by any department' },
      hod: { allowed: true, note: 'Allowed only for assigned department' },
      emp: { allowed: false, note: 'Blocked from viewing peers' },
      ca: { allowed: false, note: 'Blocked (403 Forbidden)' },
    },
    {
      module: 'Self Attendance Punch (Check-In / Check-Out)',
      admin: { allowed: true, note: 'Can punch self attendance' },
      hod: { allowed: true, note: 'Can punch self attendance' },
      emp: { allowed: true, note: 'Enforced once per day (Server timestamp)' },
      ca: { allowed: false, note: 'No attendance module access' },
    },
    {
      module: 'Billing Dashboard (Metrics & Revenue)',
      admin: { allowed: true, note: 'Full access to all revenue & pending balances' },
      hod: { allowed: false, note: 'Blocked (403 Forbidden)' },
      emp: { allowed: false, note: 'Blocked (403 Forbidden)' },
      ca: { allowed: true, note: 'Read-only access to audit financials' },
    },
    {
      module: 'One-Time Invoice Creation (PDF Form)',
      admin: { allowed: true, note: 'Can generate invoices with auto tax & numbering' },
      hod: { allowed: false, note: 'Blocked (403 Forbidden)' },
      emp: { allowed: false, note: 'Blocked (403 Forbidden)' },
      ca: { allowed: false, note: 'Blocked: Read-only access only' },
    },
    {
      module: 'One-Time Invoice PDF Download',
      admin: { allowed: true, note: 'Can download PDF vector invoices' },
      hod: { allowed: false, note: 'Blocked (403 Forbidden)' },
      emp: { allowed: false, note: 'Blocked (403 Forbidden)' },
      ca: { allowed: true, note: 'Permitted to download PDF invoices' },
    },
    {
      module: 'Recurring Client Creation & Rate Revision',
      admin: { allowed: true, note: 'Add clients, revise monthly fee, history preserved' },
      hod: { allowed: false, note: 'Blocked (403 Forbidden)' },
      emp: { allowed: false, note: 'Blocked (403 Forbidden)' },
      ca: { allowed: false, note: 'Blocked: Read-only access only' },
    },
    {
      module: 'Recording Payments & Carry-Forward Ledger',
      admin: { allowed: true, note: 'Record partial/multiple payments per month' },
      hod: { allowed: false, note: 'Blocked (403 Forbidden)' },
      emp: { allowed: false, note: 'Blocked (403 Forbidden)' },
      ca: { allowed: false, note: 'Blocked: Read-only access only' },
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
          <span>Security &amp; Governance</span>
          <span className="text-slate-300">&bull;</span>
          <span>Access Control</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="w-7 h-7 text-brand-600" />
          <span>RBAC Enterprise Security Matrix</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Specification of hierarchical role permissions enforced by middleware at every REST API endpoint.
        </p>
      </div>

      {/* Active Session Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-crm-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Active Session Claims
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {user?.name} &bull; <span className="text-brand-600 font-extrabold">{user?.role}</span>{' '}
              {user?.department ? `(${user.department} Department)` : ''}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 font-mono font-medium self-start sm:self-auto flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Security: Signed JWT (HMAC-SHA256)</span>
        </div>
      </div>

      {/* 4 Role Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-indigo-200/90 rounded-2xl p-4 shadow-crm-card">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Super Admin</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 leading-relaxed">
            Full enterprise write and read authority across all departments, invoices, users, rates, and attendance.
          </div>
        </div>

        <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-crm-card">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>Department HOD</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 leading-relaxed">
            Strictly scoped to supervising assigned department staff. Blocked from billing, invoices, and other depts.
          </div>
        </div>

        <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-crm-card">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Employee Staff</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 leading-relaxed">
            Restricted to personal daily check-in / check-out punch and viewing own attendance logs.
          </div>
        </div>

        <div className="bg-white border border-sky-200/90 rounded-2xl p-4 shadow-crm-card">
          <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Chartered Accountant</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 leading-relaxed">
            Read-only financial auditor scope. Can inspect billing dashboards and download vector PDF tax invoices.
          </div>
        </div>
      </div>

      {/* RBAC Matrix Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-crm-card">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Permission Matrix by API Action</h2>
          <span className="text-[11px] text-slate-500 font-medium font-mono">
            Middleware: authenticateToken + requireRole
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4 w-1/4">System Module Action</th>
                <th className="py-3.5 px-4 text-indigo-700 font-bold">Admin (Super)</th>
                <th className="py-3.5 px-4 text-amber-700 font-bold">HOD (Dept Lead)</th>
                <th className="py-3.5 px-4 text-emerald-700 font-bold">Employee</th>
                <th className="py-3.5 px-4 text-sky-700 font-bold">CA Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{row.module}</td>

                  {/* Admin */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900">Allowed</span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{row.admin.note}</div>
                      </div>
                    </div>
                  </td>

                  {/* HOD */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-1.5">
                      {row.hod.allowed ? (
                        <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                      )}
                      <div>
                        <span className={`font-bold ${row.hod.allowed ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {row.hod.allowed ? 'Scoped' : 'Blocked'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{row.hod.note}</div>
                      </div>
                    </div>
                  </td>

                  {/* Employee */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-1.5">
                      {row.emp.allowed ? (
                        <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                      )}
                      <div>
                        <span className={`font-bold ${row.emp.allowed ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {row.emp.allowed ? 'Self Only' : 'Blocked'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{row.emp.note}</div>
                      </div>
                    </div>
                  </td>

                  {/* CA */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-1.5">
                      {row.ca.allowed ? (
                        <Check className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                      )}
                      <div>
                        <span className={`font-bold ${row.ca.allowed ? 'text-sky-700' : 'text-slate-400'}`}>
                          {row.ca.allowed ? 'Read-Only' : 'Blocked'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{row.ca.note}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
