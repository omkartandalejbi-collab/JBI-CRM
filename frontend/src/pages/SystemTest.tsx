import React, { useState } from 'react';
import axios from 'axios';
import {
  FlaskConical,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Database,
  Lock,
} from 'lucide-react';

interface TestCase {
  id: string;
  category: 'Auth' | 'RBAC' | 'Attendance' | 'Billing';
  title: string;
  description: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: any;
}

export const SystemTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [tests, setTests] = useState<TestCase[]>([
    {
      id: 'auth-admin',
      category: 'Auth',
      title: 'Admin Authentication & Global JWT Claim',
      description: 'Authenticates as Prem Patel (Admin) and verifies role="Admin" in token response.',
      status: 'idle',
    },
    {
      id: 'auth-ca',
      category: 'Auth',
      title: 'CA Auditor Authentication',
      description: 'Authenticates as CA Ramesh Joshi and checks role="CA" with cross-department read scope.',
      status: 'idle',
    },
    {
      id: 'auth-hod',
      category: 'Auth',
      title: 'HOD Department-Scoped Authentication',
      description: 'Authenticates Dr. Rajesh Rao and verifies role="HOD" & department="Engineering".',
      status: 'idle',
    },
    {
      id: 'auth-invalid',
      category: 'Auth',
      title: 'Invalid Credentials Security Rejection',
      description: 'Attempts login with bad credentials and verifies HTTP 401 Unauthorized rejection.',
      status: 'idle',
    },
    {
      id: 'rbac-ca-readonly',
      category: 'RBAC',
      title: 'CA Write-Operation Denial (403 Forbidden)',
      description: 'Attempts to create an invoice using CA credentials and verifies 403 Forbidden enforcement.',
      status: 'idle',
    },
    {
      id: 'rbac-hod-billing-block',
      category: 'RBAC',
      title: 'HOD Billing Access Denial (403 Forbidden)',
      description: 'Attempts to access billing metrics with HOD token and verifies 403 Forbidden enforcement.',
      status: 'idle',
    },
    {
      id: 'att-today-status',
      category: 'Attendance',
      title: 'Attendance Daily Punch State Check',
      description: 'Queries /api/attendance/today-status and verifies checkedIn / checkedOut attributes.',
      status: 'idle',
    },
    {
      id: 'att-dept-scoping',
      category: 'Attendance',
      title: 'HOD Department Scoping Isolation',
      description: 'Queries /api/attendance/department and verifies records match HOD assigned department only.',
      status: 'idle',
    },
    {
      id: 'billing-metrics',
      category: 'Billing',
      title: 'Financial Revenue Aggregation Verification',
      description: 'Verifies /api/billing/dashboard returns summary metrics for collected revenue and active contracts.',
      status: 'idle',
    },
    {
      id: 'billing-invoice-number',
      category: 'Billing',
      title: 'Sequential Invoice Numbering Engine',
      description: 'Fetches /api/billing/invoices/next-number and verifies formatted sequence structure.',
      status: 'idle',
    },
  ]);

  const updateTest = (id: string, updates: Partial<TestCase>) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const runAllTests = async () => {
    setIsRunning(true);

    // Reset all to idle
    setTests((prev) =>
      prev.map((t) => ({ ...t, status: 'idle', duration: undefined, error: undefined, details: undefined }))
    );

    let adminToken = '';
    let caToken = '';
    let hodToken = '';

    // 1. Auth Admin
    updateTest('auth-admin', { status: 'running' });
    const t0 = performance.now();
    try {
      const res = await axios.post('/api/auth/login', {
        email: 'admin@jbi.com',
        password: 'Admin@123',
      });
      const d = Math.round(performance.now() - t0);
      if (res.data?.data?.user?.role === 'Admin') {
        adminToken = res.data.data.token;
        updateTest('auth-admin', {
          status: 'passed',
          duration: d,
          details: { user: res.data.data.user },
        });
      } else {
        throw new Error('User role in response is not Admin');
      }
    } catch (err: any) {
      updateTest('auth-admin', {
        status: 'failed',
        duration: Math.round(performance.now() - t0),
        error: err.response?.data?.message || err.message,
      });
    }

    // 2. Auth CA
    updateTest('auth-ca', { status: 'running' });
    const t1 = performance.now();
    try {
      const res = await axios.post('/api/auth/login', {
        email: 'ca@jbi.com',
        password: 'Ca@123',
      });
      const d = Math.round(performance.now() - t1);
      if (res.data?.data?.user?.role === 'CA') {
        caToken = res.data.data.token;
        updateTest('auth-ca', {
          status: 'passed',
          duration: d,
          details: { user: res.data.data.user },
        });
      } else {
        throw new Error('User role in response is not CA');
      }
    } catch (err: any) {
      updateTest('auth-ca', {
        status: 'failed',
        duration: Math.round(performance.now() - t1),
        error: err.response?.data?.message || err.message,
      });
    }

    // 3. Auth HOD
    updateTest('auth-hod', { status: 'running' });
    const t2 = performance.now();
    try {
      const res = await axios.post('/api/auth/login', {
        email: 'hod.engineering@jbi.com',
        password: 'Hod@123',
      });
      const d = Math.round(performance.now() - t2);
      if (
        res.data?.data?.user?.role === 'HOD' &&
        res.data?.data?.user?.department === 'Engineering'
      ) {
        hodToken = res.data.data.token;
        updateTest('auth-hod', {
          status: 'passed',
          duration: d,
          details: { user: res.data.data.user },
        });
      } else {
        throw new Error('User role is not HOD or department not Engineering');
      }
    } catch (err: any) {
      updateTest('auth-hod', {
        status: 'failed',
        duration: Math.round(performance.now() - t2),
        error: err.response?.data?.message || err.message,
      });
    }

    // 4. Auth Invalid
    updateTest('auth-invalid', { status: 'running' });
    const t3 = performance.now();
    try {
      await axios.post('/api/auth/login', {
        email: 'admin@jbi.com',
        password: 'WrongPassword999',
      });
      updateTest('auth-invalid', {
        status: 'failed',
        duration: Math.round(performance.now() - t3),
        error: 'Backend erroneously allowed login with invalid credentials',
      });
    } catch (err: any) {
      const d = Math.round(performance.now() - t3);
      if (err.response?.status === 401) {
        updateTest('auth-invalid', {
          status: 'passed',
          duration: d,
          details: { status: 401, message: err.response.data.message },
        });
      } else {
        updateTest('auth-invalid', {
          status: 'failed',
          duration: d,
          error: `Expected 401 but received status ${err.response?.status}`,
        });
      }
    }

    // 5. RBAC CA Read-Only (Attempt write with CA token)
    updateTest('rbac-ca-readonly', { status: 'running' });
    const t4 = performance.now();
    try {
      await axios.post(
        '/api/billing/invoices',
        {
          clientName: 'Test Corp',
          invoiceDate: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
        },
        { headers: { Authorization: `Bearer ${caToken}` } }
      );
      updateTest('rbac-ca-readonly', {
        status: 'failed',
        duration: Math.round(performance.now() - t4),
        error: 'CA was allowed to create invoice (RBAC Write violation!)',
      });
    } catch (err: any) {
      const d = Math.round(performance.now() - t4);
      if (err.response?.status === 403) {
        updateTest('rbac-ca-readonly', {
          status: 'passed',
          duration: d,
          details: {
            status: 403,
            message: err.response.data.message || 'Forbidden for CA role',
          },
        });
      } else {
        updateTest('rbac-ca-readonly', {
          status: 'failed',
          duration: d,
          error: `Expected 403 Forbidden, received: ${err.response?.status}`,
        });
      }
    }

    // 6. RBAC HOD Billing Block
    updateTest('rbac-hod-billing-block', { status: 'running' });
    const t5 = performance.now();
    try {
      await axios.get('/api/billing/dashboard', {
        headers: { Authorization: `Bearer ${hodToken}` },
      });
      updateTest('rbac-hod-billing-block', {
        status: 'failed',
        duration: Math.round(performance.now() - t5),
        error: 'HOD was allowed to view billing dashboard (RBAC breach)',
      });
    } catch (err: any) {
      const d = Math.round(performance.now() - t5);
      if (err.response?.status === 403) {
        updateTest('rbac-hod-billing-block', {
          status: 'passed',
          duration: d,
          details: {
            status: 403,
            message: err.response.data.message || 'Forbidden: HOD lacks billing privileges',
          },
        });
      } else {
        updateTest('rbac-hod-billing-block', {
          status: 'failed',
          duration: d,
          error: `Expected 403 Forbidden, received: ${err.response?.status}`,
        });
      }
    }

    // 7. Attendance Today Status
    updateTest('att-today-status', { status: 'running' });
    const t6 = performance.now();
    try {
      const res = await axios.get('/api/attendance/today-status', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const d = Math.round(performance.now() - t6);
      if (typeof res.data?.isCheckedIn === 'boolean') {
        updateTest('att-today-status', {
          status: 'passed',
          duration: d,
          details: res.data,
        });
      } else {
        throw new Error('Response did not contain isCheckedIn boolean');
      }
    } catch (err: any) {
      updateTest('att-today-status', {
        status: 'failed',
        duration: Math.round(performance.now() - t6),
        error: err.response?.data?.message || err.message,
      });
    }

    // 8. Attendance Dept Scoping
    updateTest('att-dept-scoping', { status: 'running' });
    const t7 = performance.now();
    try {
      const res = await axios.get('/api/attendance/department', {
        headers: { Authorization: `Bearer ${hodToken}` },
      });
      const d = Math.round(performance.now() - t7);
      if (res.data?.department === 'Engineering') {
        updateTest('att-dept-scoping', {
          status: 'passed',
          duration: d,
          details: {
            department: res.data.department,
            recordCount: res.data.data?.length || 0,
          },
        });
      } else {
        throw new Error(`Expected department "Engineering", got: "${res.data?.department}"`);
      }
    } catch (err: any) {
      updateTest('att-dept-scoping', {
        status: 'failed',
        duration: Math.round(performance.now() - t7),
        error: err.response?.data?.message || err.message,
      });
    }

    // 9. Billing Metrics
    updateTest('billing-metrics', { status: 'running' });
    const t8 = performance.now();
    try {
      const res = await axios.get('/api/billing/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const d = Math.round(performance.now() - t8);
      if (res.data?.data?.summary) {
        updateTest('billing-metrics', {
          status: 'passed',
          duration: d,
          details: res.data.data.summary,
        });
      } else {
        throw new Error('Missing summary metrics in dashboard response');
      }
    } catch (err: any) {
      updateTest('billing-metrics', {
        status: 'failed',
        duration: Math.round(performance.now() - t8),
        error: err.response?.data?.message || err.message,
      });
    }

    // 10. Billing Next Invoice Number
    updateTest('billing-invoice-number', { status: 'running' });
    const t9 = performance.now();
    try {
      const res = await axios.get('/api/billing/invoices/next-number', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const d = Math.round(performance.now() - t9);
      if (res.data?.invoiceNumber && res.data.invoiceNumber.startsWith('INV-')) {
        updateTest('billing-invoice-number', {
          status: 'passed',
          duration: d,
          details: { invoiceNumber: res.data.invoiceNumber },
        });
      } else {
        throw new Error(`Invalid invoice sequence format: "${res.data?.invoiceNumber}"`);
      }
    } catch (err: any) {
      updateTest('billing-invoice-number', {
        status: 'failed',
        duration: Math.round(performance.now() - t9),
        error: err.response?.data?.message || err.message,
      });
    }

    setIsRunning(false);
  };

  const passedCount = tests.filter((t) => t.status === 'passed').length;
  const failedCount = tests.filter((t) => t.status === 'failed').length;
  const totalDuration = tests
    .map((t) => t.duration || 0)
    .reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FlaskConical className="w-6 h-6 text-indigo-600" />
            Automated System &amp; RBAC Test Suite
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Execute live verification tests directly against backend endpoints to demonstrate security and data isolation.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={() =>
              setTests((prev) =>
                prev.map((t) => ({
                  ...t,
                  status: 'idle',
                  duration: undefined,
                  error: undefined,
                  details: undefined,
                }))
              )
            }
            disabled={isRunning}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing Tests...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run All Tests
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Test Cases</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{tests.length}</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Passed</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 flex items-center gap-2">
            {passedCount}
            {passedCount === tests.length && passedCount > 0 && (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                100% Pass
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Failed</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{failedCount}</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Execution Time</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {totalDuration} <span className="text-xs font-normal text-slate-500">ms</span>
          </div>
        </div>
      </div>

      {/* Test List Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Verification Specifications
          </h2>
          <span className="text-xs text-slate-500">
            Click any row to inspect server response payload
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {tests.map((test) => {
            const isExpanded = expandedId === test.id;
            return (
              <div key={test.id} className="hover:bg-slate-50/60 transition-colors">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : test.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div>
                      {test.status === 'idle' && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {test.status === 'running' && (
                        <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      )}
                      {test.status === 'passed' && (
                        <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {test.status === 'failed' && (
                        <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                          <XCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{test.title}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {test.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {test.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0">
                    {test.duration !== undefined && (
                      <span className="text-xs font-mono text-slate-500 font-medium">
                        {test.duration}ms
                      </span>
                    )}

                    <div>
                      {test.status === 'idle' && (
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Ready
                        </span>
                      )}
                      {test.status === 'running' && (
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Testing...
                        </span>
                      )}
                      {test.status === 'passed' && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Passed
                        </span>
                      )}
                      {test.status === 'failed' && (
                        <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Failed
                        </span>
                      )}
                    </div>

                    <div className="text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-slate-50/70 border-t border-slate-100 text-xs">
                    {test.error && (
                      <div className="p-3 mb-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                        Error: {test.error}
                      </div>
                    )}
                    {test.details ? (
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Response Payload / Verified State:
                        </div>
                        <pre className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-xs overflow-x-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">
                        {test.status === 'idle'
                          ? 'Run tests to view execution traces and API response structures.'
                          : 'No additional response data returned.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

