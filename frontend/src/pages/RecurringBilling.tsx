import React, { useState, useEffect } from 'react';
import { billingApi } from '../services/api.js';
import { RecurringClient } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Repeat,
  Plus,
  Calendar,
  History,
  CreditCard,
  X,
  ChevronRight,
  ShieldAlert,
  Edit2,
} from 'lucide-react';

export const RecurringBilling: React.FC = () => {
  const { isAdmin, isCA } = useAuth();
  const [clients, setClients] = useState<RecurringClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<RecurringClient | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<{ client: RecurringClient; month: string } | null>(null);
  const [showRateModal, setShowRateModal] = useState<RecurringClient | null>(null);

  // Forms
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAmount, setNewClientAmount] = useState<number>(5000);
  const [newClientStartMonth, setNewClientStartMonth] = useState('2026-10');

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(1000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash'>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Rate Update Form
  const [revisedAmount, setRevisedAmount] = useState<number>(6000);
  const [effectiveMonth, setEffectiveMonth] = useState('2026-11');
  const [rateReason, setRateReason] = useState('Scope & SLA Enhancement');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await billingApi.getAllRecurringClients();
      setClients(data);

      if (selectedClient) {
        const refreshed = await billingApi.getClientHistory(selectedClient.id);
        setSelectedClient(refreshed);
      } else if (data.length > 0) {
        const firstHistory = await billingApi.getClientHistory(data[0].id);
        setSelectedClient(firstHistory);
      }
    } catch (err: any) {
      console.error('Failed to load recurring clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSelectClient = async (client: RecurringClient) => {
    try {
      const full = await billingApi.getClientHistory(client.id);
      setSelectedClient(full);
    } catch (err) {
      setSelectedClient(client);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await billingApi.addRecurringClient({
        name: newClientName,
        company: newClientCompany || null,
        email: newClientEmail || null,
        phone: newClientPhone || null,
        monthlyAmount: Number(newClientAmount),
        billingStartMonth: newClientStartMonth,
      });

      setShowAddClientModal(false);
      setNewClientName('');
      setNewClientCompany('');
      fetchClients();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add recurring client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      await billingApi.recordPayment(showPaymentModal.client.id, showPaymentModal.month, {
        amount: Number(paymentAmount),
        paymentDate,
        paymentMethod,
        referenceNumber: paymentRef || null,
        notes: paymentNotes || null,
      });

      setShowPaymentModal(null);
      setPaymentRef('');
      setPaymentNotes('');
      fetchClients();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRateModal) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      await billingApi.updateClientRate(showRateModal.id, {
        newMonthlyAmount: Number(revisedAmount),
        effectiveMonth,
        reason: rateReason,
      });

      setShowRateModal(null);
      fetchClients();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update rate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitNextMonth = async (clientId: string) => {
    const nextMonth = prompt('Enter next billing month to initialize (YYYY-MM):', '2026-11');
    if (!nextMonth) return;
    try {
      await billingApi.initMonth(clientId, nextMonth);
      fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initialize month.');
    }
  };

  // Grand total pending across all recurring accounts
  const totalPendingAcrossAll = clients.reduce((sum, c) => sum + Math.max(0, c.currentPending || 0), 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Continuous (Recurring) Billing
            </h1>
            {isCA && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 border border-sky-200 text-sky-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                CA Read-Only View
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated monthly fee carry-forward, multi-payment tracking, and pending balance carry-over.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setFormError(null);
              setShowAddClientModal(true);
            }}
            className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-colors self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Recurring Client
          </button>
        )}
      </div>

      {/* Formula Explanation Callout */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">
              Continuous Balance Carry-Forward Formula
            </div>
            <div className="text-[11px] font-mono text-indigo-700 mt-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 inline-block font-medium">
              Total Due = This Month&apos;s Amount + Previous Pending
            </div>
            <div className="text-[11px] font-mono text-amber-700 mt-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block ml-2 font-medium">
              Pending = Total Due &minus; Amount Paid
            </div>
          </div>
        </div>

        <div className="flex items-center justify-start md:justify-end space-x-6 text-right">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Outstanding (All Clients)
            </div>
            <div className="text-xl font-bold text-amber-600">
              ₹ {totalPendingAcrossAll.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Recurring Clients
            </div>
            <div className="text-xl font-bold text-slate-900">
              {clients.length} <span className="text-xs text-slate-400 font-normal">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Master-Detail Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Client Accounts List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Recurring Client Accounts ({clients.length})
          </h2>

          <div className="space-y-2">
            {clients.map((c) => {
              const isSelected = selectedClient?.id === c.id;
              const hasPending = (c.currentPending || 0) > 0;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/60 border-indigo-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        {c.name}
                        {isSelected && <ChevronRight className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Monthly: ₹{c.currentMonthlyAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-bold font-mono ${
                          hasPending ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        ₹ {(c.currentPending || 0).toLocaleString('en-IN')}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          hasPending
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {hasPending ? 'Pending Balance' : 'Cleared'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Client Ledger */}
        <div className="lg:col-span-8 space-y-6">
          {selectedClient ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-bold text-slate-900">{selectedClient.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                      {selectedClient.company || 'Enterprise Client'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Contact: {selectedClient.email || 'N/A'} &bull; {selectedClient.phone || 'N/A'} &bull; Start: {selectedClient.billingStartMonth}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setRevisedAmount(selectedClient.currentMonthlyAmount);
                          setShowRateModal(selectedClient);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Change Monthly Rate & Preserve History"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        Revise Rate
                      </button>

                      <button
                        onClick={() => handleInitNextMonth(selectedClient.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Roll forward / initialize next billing cycle"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Init Next Month
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Rate Change History */}
              {selectedClient.rateHistory && selectedClient.rateHistory.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-indigo-600" />
                    Rate Revision History (Audit Trail)
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {selectedClient.rateHistory.map((rh) => (
                      <span key={rh.id} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                        From ₹{rh.previousAmount.toLocaleString()} &rarr; <strong className="text-slate-900">₹{rh.newAmount.toLocaleString()}</strong> ({rh.effectiveMonth}) &bull; {rh.reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Month-Wise Continuous Ledger Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Month-Wise Billing &amp; Carry-Forward Ledger
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Auto roll-over of unpaid balances into subsequent months
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-3 px-3">Billing Month</th>
                        <th className="py-3 px-3">Monthly Bill</th>
                        <th className="py-3 px-3">Prev. Pending</th>
                        <th className="py-3 px-3 font-bold text-slate-900">Total Due</th>
                        <th className="py-3 px-3 text-emerald-600">Amount Paid</th>
                        <th className="py-3 px-3 font-bold text-amber-600">Remaining Pending</th>
                        <th className="py-3 px-3">Status</th>
                        {isAdmin && <th className="py-3 px-3 text-right">Payment Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedClient.monthRecords?.map((m) => (
                        <React.Fragment key={m.id}>
                          <tr className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                              {m.month}
                            </td>
                            <td className="py-3.5 px-3 text-slate-700 font-mono">
                              ₹ {m.billAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3 text-slate-500 font-mono">
                              + ₹ {m.previousPending.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3 font-bold text-slate-900 font-mono bg-slate-50/70">
                              = ₹ {m.totalDue.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3 text-emerald-600 font-bold font-mono">
                              ₹ {m.amountPaid.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3 font-bold font-mono text-amber-600">
                              ₹ {m.remainingPending.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  m.status === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : m.status === 'Partial'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                            {isAdmin && (
                              <td className="py-3.5 px-3 text-right">
                                <button
                                  onClick={() => {
                                    setPaymentAmount(m.remainingPending > 0 ? m.remainingPending : selectedClient.currentMonthlyAmount);
                                    setShowPaymentModal({ client: selectedClient, month: m.month });
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 text-xs font-semibold transition-all cursor-pointer"
                                >
                                  + Record Payment
                                </button>
                              </td>
                            )}
                          </tr>

                          {/* Nested Payments Details */}
                          {m.payments && m.payments.length > 0 && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={isAdmin ? 8 : 7} className="py-2.5 px-6">
                                <div className="text-[11px] text-slate-600 space-y-1">
                                  <div className="font-semibold text-slate-800">Payments recorded for {m.month}:</div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {m.payments.map((p) => (
                                      <div key={p.id} className="p-2 rounded-lg bg-white border border-slate-200 text-[11px]">
                                        <div className="text-emerald-700 font-bold">₹ {p.amount.toLocaleString()} on {p.paymentDate}</div>
                                        <div className="text-slate-500 text-[10px]">{p.paymentMethod} {p.referenceNumber ? `&bull; Ref: ${p.referenceNumber}` : ''}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Select a recurring client on the left to inspect month-by-month billing and carry-forward balances.
            </div>
          )}
        </div>
      </div>

      {/* ADD RECURRING CLIENT MODAL (Admin Only) */}
      {showAddClientModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Add Recurring Client
              </h2>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Corporation"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Billing Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newClientAmount}
                  onChange={(e) => setNewClientAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Starting Month (YYYY-MM) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="2026-10"
                  value={newClientStartMonth}
                  onChange={(e) => setNewClientStartMonth(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="billing@client.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL (Admin Only) */}
      {showPaymentModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Record Payment
                </h2>
                <p className="text-xs text-slate-500">
                  {showPaymentModal.client.name} &bull; Month: {showPaymentModal.month}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received (₹) * (Partial / Full)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="UPI">UPI (Google Pay/PhonePe/Paytm)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Transaction ID</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-9988221 or UPI Ref"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Received 1st installment"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Recording...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVISE RATE MODAL (Admin Only) */}
      {showRateModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-600" />
                  Revise Monthly Amount
                </h2>
                <p className="text-xs text-slate-500">{showRateModal.name}</p>
              </div>
              <button
                onClick={() => setShowRateModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateRate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Monthly Amount</label>
                <div className="text-sm font-bold text-slate-700 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  ₹ {showRateModal.currentMonthlyAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Monthly Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={revisedAmount}
                  onChange={(e) => setRevisedAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Month (YYYY-MM) *</label>
                <input
                  type="text"
                  required
                  placeholder="2026-11"
                  value={effectiveMonth}
                  onChange={(e) => setEffectiveMonth(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Revision</label>
                <input
                  type="text"
                  placeholder="e.g. Scope upgrade & dedicated maintenance"
                  value={rateReason}
                  onChange={(e) => setRateReason(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRateModal(null)}
                  className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Update & Preserve History'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
