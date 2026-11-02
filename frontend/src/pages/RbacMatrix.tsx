import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { ShieldCheck, Check, X, Lock, Info, Key, ShieldAlert } from 'lucide-react';

export const RbacMatrix: React.FC = () => {
  const { user } = useAuth();

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
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Roles &amp; Permissions Matrix (RBAC Specification)
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Complete formal documentation of JBI CRM hierarchical role capabilities and backend security guarantees.
        </p>
      </div>

      {/* Current User Session Status */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Your Active Session
            </div>
            <div className="text-sm font-bold text-slate-900">
              {user?.name} — <span className="text-indigo-600">{user?.role}</span>{' '}
              {user?.department ? `(${user.department} Department)` : ''}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-mono self-start sm:self-auto font-medium">
          Security Level: JWT Verified (HMAC SHA-256)
        </div>
      </div>

      {/* RBAC Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Hierarchical Permission Matrix</h2>
          <span className="text-[11px] text-slate-500 font-medium">
            Backend RBAC Middleware active on every API route
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 w-1/4">Feature / Module Action</th>
                <th className="py-3 px-4 text-indigo-700">Admin (Super)</th>
                <th className="py-3 px-4 text-amber-700">HOD (4 Depts)</th>
                <th className="py-3 px-4 text-emerald-700">Employee</th>
                <th className="py-3 px-4 text-sky-700">Chartered Accountant (CA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{row.module}</td>

                  {/* Admin */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-1.5 text-indigo-700">
                      <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-900">Full Access</span>
                        <div className="text-[10px] text-slate-500">{row.admin.note}</div>
                      </div>
                    </div>
                  </td>

                  {/* HOD */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-1.5">
                      {row.hod.allowed ? (
                        <>
                          <Check className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                          <div>
                            <span className="font-semibold text-amber-700">Department Scoped</span>
                            <div className="text-[10px] text-slate-500">{row.hod.note}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-400">No Access</span>
                            <div className="text-[10px] text-slate-400">{row.hod.note}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Employee */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-1.5">
                      {row.emp.allowed ? (
                        <>
                          <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                          <div>
                            <span className="font-semibold text-emerald-700">Self Only</span>
                            <div className="text-[10px] text-slate-500">{row.emp.note}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-400">No Access</span>
                            <div className="text-[10px] text-slate-400">{row.emp.note}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* CA */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-1.5">
                      {row.ca.allowed ? (
                        <>
                          <Check className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
                          <div>
                            <span className="font-semibold text-sky-700">Read-Only</span>
                            <div className="text-[10px] text-slate-500">{row.ca.note}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-400">No Access</span>
                            <div className="text-[10px] text-slate-400">{row.ca.note}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Architecture Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-indigo-600" />
            Backend Middleware Enforcement
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hiding menu items is not enough. The backend middleware intercepts every request, validates JWT signatures, verifies the active status in SQLite, and checks role permissions.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Department Query Scoping
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            An HOD of Engineering cannot view Sales data even by modifying the URL or API payload. Queries executed by HODs are automatically scoped to <code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">req.user.department</code>.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-sky-600" />
            Chartered Accountant Isolation
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Chartered Accountants (CA) have strictly read-only access to the Billing module. All POST, PUT, and DELETE operations return a 403 Forbidden status, preventing modifications.
          </p>
        </div>
      </div>
    </div>
  );
};
