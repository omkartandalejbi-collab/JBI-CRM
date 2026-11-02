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
  Plus,
  RefreshCw,
  CheckCircle2,
  Receipt,
  Building2,
  Users,
} from 'lucide-react';

export const BillingDashboard: React.FC<{
  onNavigateToInvoices?: () => void;
  onNavigateToRecurring?: () => void;
}> = ({ onNavigateToInvoices, onNavigateToRecurring }) => {
  const { isCA, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchMetrics = async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) setIsRefreshing(true);
      else setLoading(true);
      const data = await billingApi.getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load billing metrics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
      <div className="p-8 sm:p-12 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold tracking-wide">
            Aggregating executive revenue, invoices, and recovery logs...
          </p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{error || 'Unable to load dashboard data.'}</span>
        </div>
      </div>
    );
  }

  const { summary, recentInvoices, recurringClients, monthWiseStats } = metrics;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <span>Operations</span>
            <span className="text-slate-300">&bull;</span>
            <span>Financial Suite</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Executive Billing &amp; Revenue
            </h1>
            {isCA && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 border border-sky-200 text-sky-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Auditor Read-Only
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated analytics across one-time PDF tax invoices and continuous recurring accounts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchMetrics(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {isAdmin && onNavigateToInvoices && (
            <button
              onClick={onNavigateToInvoices}
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Collected */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-crm-card hover:shadow-crm-card-hover hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Collected</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹ {summary.totalRevenueCollected.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>One-Time (₹{summary.oneTime.totalRevenue.toLocaleString('en-IN')}) + Recurring (₹{summary.recurring.totalCollected.toLocaleString('en-IN')})</span>
            </div>
          </div>
        </div>

        {/* Total Pending Balance */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-crm-card hover:shadow-crm-card-hover hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pending Balances</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
              ₹ {summary.totalPendingBalances.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5 font-medium">
              Outstanding recurring accounts: {summary.recurring.clientsWithPending}
            </div>
          </div>
        </div>

        {/* One-Time Invoices */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-crm-card hover:shadow-crm-card-hover hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">One-Time Invoices</span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.oneTime.totalCount}{' '}
              <span className="text-xs font-medium text-slate-400">issued</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5 font-medium">
              Billed: ₹{summary.oneTime.totalBilled.toLocaleString('en-IN')} &bull; Paid: {summary.oneTime.paidCount}
            </div>
          </div>
        </div>

        {/* Recurring Accounts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-crm-card hover:shadow-crm-card-hover hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Continuous Clients</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.recurring.totalClients}{' '}
              <span className="text-xs font-medium text-slate-400">clients</span>
            </div>
            <div className="text-[11px] text-amber-600 mt-1.5 font-medium">
              {summary.recurring.clientsWithPending} accounts require follow-up
            </div>
          </div>
        </div>
      </div>

      {/* Month-Wise Continuous Billing Trends */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-crm-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Continuous Billing Month-Wise Performance
            </h2>
            <p className="text-xs text-slate-500">
              Aggregated monthly billed fees, payments collected, carried pending balances &amp; recovery rate
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 text-xs font-mono font-medium rounded-lg border border-slate-200 self-start sm:self-auto">
            <span>Formula: Total Due = Billed + Prev Pending</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4">Billing Month</th>
                <th className="py-3.5 px-4">Billed Amount</th>
                <th className="py-3.5 px-4">Collected Amount</th>
                <th className="py-3.5 px-4">Remaining Pending</th>
                <th className="py-3.5 px-4">Recovery Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthWiseStats.map((stat) => {
                const recoveryRate = stat.billed > 0 ? Math.round((stat.collected / stat.billed) * 100) : 100;
                return (
                  <tr key={stat.month} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono">{stat.month}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      ₹ {stat.billed.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 font-bold font-mono">
                      ₹ {stat.collected.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono font-semibold ${
                          stat.pending > 0 ? 'text-amber-600' : 'text-slate-400'
                        }`}
                      >
                        ₹ {stat.pending.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/70">
                          <div
                            className={`h-full rounded-full transition-all ${
                              recoveryRate >= 80
                                ? 'bg-emerald-500'
                                : recoveryRate >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(recoveryRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-700 font-bold">
                          {recoveryRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Clients with Pending Balances */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-crm-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Recurring Client Accounts
                </h3>
                <p className="text-xs text-slate-500">Active monthly accounts and outstanding balance alerts</p>
              </div>
              {onNavigateToRecurring && (
                <button
                  onClick={onNavigateToRecurring}
                  className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 font-semibold cursor-pointer group"
                >
                  <span>Open Suite</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {recurringClients.map((client) => (
                <div
                  key={client.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    client.hasPendingBalance
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        {client.name}
                        {client.hasPendingBalance && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded border border-amber-300">
                            Action Due
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Monthly: ₹{(client.currentMonthlyAmount || client.monthlyAmount || 0).toLocaleString('en-IN')} &bull; Started {client.billingStartMonth}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-bold font-mono ${
                          client.hasPendingBalance ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        ₹ {(client.currentPending || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {client.hasPendingBalance ? 'Pending Balance' : 'Fully Cleared'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent One-Time Invoices with PDF Download */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-crm-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-brand-600" />
                  Recent Tax Invoices
                </h3>
                <p className="text-xs text-slate-500">Vector PDF generation and status ledger</p>
              </div>
              {onNavigateToInvoices && (
                <button
                  onClick={onNavigateToInvoices}
                  className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 font-semibold cursor-pointer group"
                >
                  <span>All Invoices</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {recentInvoices.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/80 hover:bg-slate-50 flex items-center justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
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
                    className="p-2.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white border border-brand-200 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95"
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
