import React, { useState, useEffect } from 'react';
import { billingApi } from '../services/api.js';
import { DashboardMetrics } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  FileText,
  Download,
  Calendar,
  Clock,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export const BillingDashboard: React.FC<{
  onNavigateToInvoices?: () => void;
  onNavigateToRecurring?: () => void;
}> = ({ onNavigateToInvoices, onNavigateToRecurring }) => {
  const { isCA } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await billingApi.getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load billing metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
    try {
      setDownloadingId(id);
      await billingApi.downloadPdfBlob(id, invoiceNumber);
    } catch (err: any) {
      alert('Failed to download invoice PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Loading Billing Intelligence &amp; Revenue Metrics...
          </p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error || 'Unable to load dashboard data.'}
        </div>
      </div>
    );
  }

  const { summary, recentInvoices, recurringClients, monthWiseStats } = metrics;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Executive Billing Dashboard
            </h1>
            {isCA && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 border border-sky-200 text-sky-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                CA Read-Only View
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Revenue tracking across one-time PDF invoices and continuous recurring accounts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMetrics}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition-all cursor-pointer"
          >
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Collected</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              ₹ {summary.totalRevenueCollected.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              One-Time (₹{summary.oneTime.totalRevenue.toLocaleString('en-IN')}) + Recurring (₹{summary.recurring.totalCollected.toLocaleString('en-IN')})
            </div>
          </div>
        </div>

        {/* Total Pending Balance */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pending Balance</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600">
              ₹ {summary.totalPendingBalances.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Recurring Pending: ₹{summary.recurring.totalPending.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* One-Time Invoices */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">One-Time Invoices</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {summary.oneTime.totalCount} <span className="text-xs font-normal text-slate-400">invoices</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Billed: ₹{summary.oneTime.totalBilled.toLocaleString('en-IN')} &bull; Paid: {summary.oneTime.paidCount}
            </div>
          </div>
        </div>

        {/* Recurring Accounts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Recurring Clients</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {summary.recurring.totalClients} <span className="text-xs font-normal text-slate-400">clients</span>
            </div>
            <div className="text-[11px] text-amber-600 mt-1 font-medium">
              {summary.recurring.clientsWithPending} with outstanding balance
            </div>
          </div>
        </div>
      </div>

      {/* Month-Wise Continuous Billing Trends */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Continuous Billing Month-Wise Summary</h2>
            <p className="text-xs text-slate-500">Monthly billed amount, payments collected, and carried pending balance</p>
          </div>
          <span className="text-[11px] font-mono bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto font-medium">
            Formula: Total Due = Billed + Prev Pending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-3 px-3.5 font-semibold">Month</th>
                <th className="py-3 px-3.5 font-semibold">Billed Amount</th>
                <th className="py-3 px-3.5 font-semibold">Collected Amount</th>
                <th className="py-3 px-3.5 font-semibold">Remaining Pending</th>
                <th className="py-3 px-3.5 font-semibold">Recovery Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthWiseStats.map((stat) => {
                const recoveryRate = stat.billed > 0 ? Math.round((stat.collected / stat.billed) * 100) : 100;
                return (
                  <tr key={stat.month} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3.5 font-semibold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      {stat.month}
                    </td>
                    <td className="py-3.5 px-3.5 text-slate-700">₹ {stat.billed.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-3.5 text-emerald-600 font-bold">₹ {stat.collected.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-3.5">
                      <span className={`font-semibold ${stat.pending > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        ₹ {stat.pending.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full ${recoveryRate >= 80 ? 'bg-emerald-500' : recoveryRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(recoveryRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-600 font-semibold">{recoveryRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Clients with Pending Balances */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Recurring Clients &amp; Pending Balances
                </h3>
                <p className="text-xs text-slate-500">Current active monthly accounts</p>
              </div>
              {onNavigateToRecurring && (
                <button
                  onClick={onNavigateToRecurring}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  Manage All <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {recurringClients.map((client) => (
                <div
                  key={client.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    client.hasPendingBalance
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{client.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Monthly: ₹{(client.currentMonthlyAmount || client.monthlyAmount || 0).toLocaleString('en-IN')} &bull; Start: {client.billingStartMonth}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-bold ${
                          client.hasPendingBalance ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        ₹ {(client.currentPending || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {client.hasPendingBalance ? 'Pending Balance' : 'Fully Paid'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent One-Time Invoices with PDF Download */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  One-Time Invoices &amp; PDF Downloads
                </h3>
                <p className="text-xs text-slate-500">Generated tax invoices ready for export</p>
              </div>
              {onNavigateToInvoices && (
                <button
                  onClick={onNavigateToInvoices}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  All Invoices <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {recentInvoices.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mt-1">{inv.clientName}</div>
                    <div className="text-[11px] text-slate-500">
                      Date: {inv.invoiceDate} &bull; Total: ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                    disabled={downloadingId === inv.id}
                    className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title="Download Vector PDF Invoice"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingId === inv.id ? 'Saving...' : 'PDF'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
