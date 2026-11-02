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
  DollarSign,
  AlertCircle,
  Building,
  Mail,
  Phone,
  CheckCircle2,
  Search,
  Receipt,
  ArrowRight,
} from 'lucide-react';

export const RecurringBilling: React.FC = () => {
  const { isAdmin, isCA } = useAuth();
  const [clients, setClients] = useState<RecurringClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<RecurringClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSearch, setClientSearch] = useState('');

  // Modals
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<{ client: RecurringClient; month: string } | null>(null);
  const [showRateModal, setShowRateModal] = useState<RecurringClient | null>(null);

  // Forms
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAmount, setNewClientAmount] = useState<number>(0);
  const [newClientStartMonth, setNewClientStartMonth] = useState(new Date().toISOString().slice(0, 7));

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash'>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Rate Update Form
  const [revisedAmount, setRevisedAmount] = useState<number>(0);
  const [effectiveMonth, setEffectiveMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rateReason, setRateReason] = useState('');

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
      setNewClientEmail('');
      setNewClientPhone('');
      setNewClientAmount(0);
      setNewClientStartMonth(new Date().toISOString().slice(0, 7));
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
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const defaultNext = d.toISOString().slice(0, 7);
    const nextMonth = prompt('Enter next billing month to initialize (YYYY-MM):', defaultNext);
    if (!nextMonth) return;
    try {
      await billingApi.initMonth(clientId, nextMonth);
      fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initialize month.');
    }
  };

  // Grand totals
  const totalMonthlyRunRate = clients.reduce((sum, c) => sum + (c.currentMonthlyAmount || 0), 0);
  const totalPendingAcrossAll = clients.reduce((sum, c) => sum + Math.max(0, c.currentPending || 0), 0);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <span>Financial Operations</span>
            <span className="text-slate-300">&bull;</span>
            <span>Recurring Suite</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Continuous &amp; Recurring Billing
            </h1>
            {isCA && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 border border-sky-200 text-sky-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Auditor Read-Only
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated monthly balance carry-forward, rate revision audit trails, and multi-installment tracking.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setFormError(null);
              setNewClientName('');
              setNewClientCompany('');
              setNewClientEmail('');
              setNewClientPhone('');
              setNewClientAmount(0);
              setNewClientStartMonth(new Date().toISOString().slice(0, 7));
              setShowAddClientModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-xs shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recurring Client</span>
          </button>
        )}
      </div>

      {/* Formula & Financial Summary Ribbon */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-crm-card grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        <div className="md:col-span-7 flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">
              Continuous Balance Carry-Forward Model
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-[11px] font-mono text-brand-700 bg-brand-50/80 px-2.5 py-1 rounded-lg border border-brand-200 font-semibold">
                Total Due = Current Billed + Prev Pending
              </span>
              <span className="text-[11px] font-mono text-amber-700 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold">
                Pending = Total Due &minus; Amount Paid
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Monthly Run-Rate
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              ₹ {totalMonthlyRunRate.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Outstanding
            </div>
            <div className="text-xl font-extrabold text-amber-600 mt-0.5">
              ₹ {totalPendingAcrossAll.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Master-Detail Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Client Accounts List */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Client Accounts ({clients.length})
            </h2>
            <span className="text-[11px] text-slate-400">Select to inspect</span>
          </div>

          {/* Quick Filter Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter recurring accounts..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-600 outline-none shadow-2xs"
            />
          </div>

          {/* Accounts Cards List */}
          <div className="space-y-2">
            {filteredClients.map((c) => {
              const isSelected = selectedClient?.id === c.id;
              const hasPending = (c.currentPending || 0) > 0;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-50/70 border-brand-500 shadow-sm ring-1 ring-brand-500/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {isSelected && <ChevronRight className="w-3.5 h-3.5 text-brand-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Fee: ₹{(c.currentMonthlyAmount || 0).toLocaleString('en-IN')} / mo
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
                        className={`text-[9px] px-2 py-0.2 rounded-full font-bold border inline-block mt-0.5 ${
                          hasPending
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {hasPending ? 'Action Due' : 'Cleared'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Client Ledger */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {selectedClient ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-crm-card space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-slate-900">{selectedClient.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                      {selectedClient.company || 'Enterprise Account'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    {selectedClient.email && <span>Email: {selectedClient.email}</span>}
                    {selectedClient.phone && <span>Phone: {selectedClient.phone}</span>}
                    <span>Start: {selectedClient.billingStartMonth}</span>
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
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        title="Change Monthly Rate & Preserve History"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Revise Rate</span>
                      </button>

                      <button
                        onClick={() => handleInitNextMonth(selectedClient.id)}
                        className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        title="Roll forward / initialize next billing cycle"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Roll Month</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Rate Change History Audit Trail */}
              {selectedClient.rateHistory && selectedClient.rateHistory.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-brand-600" />
                    <span>Rate Revision History (Audit Trail)</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {selectedClient.rateHistory.map((rh) => (
                      <span
                        key={rh.id}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs"
                      >
                        From ₹{rh.previousAmount.toLocaleString()} &rarr;{' '}
                        <strong className="text-slate-900">₹{rh.newAmount.toLocaleString()}</strong> ({rh.effectiveMonth}) &bull; {rh.reason}
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
                    Auto roll-over of unpaid balances
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200/90 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-3 px-3.5">Billing Month</th>
                        <th className="py-3 px-3.5">Monthly Fee</th>
                        <th className="py-3 px-3.5">Prev. Pending</th>
                        <th className="py-3 px-3.5 font-bold text-slate-900">Total Due</th>
                        <th className="py-3 px-3.5 text-emerald-600">Amount Paid</th>
                        <th className="py-3 px-3.5 font-bold text-amber-600">Remaining Pending</th>
                        <th className="py-3 px-3.5">Status</th>
                        {isAdmin && <th className="py-3 px-3.5 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedClient.monthRecords?.map((m) => (
                        <React.Fragment key={m.id}>
                          <tr className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-brand-600" />
                              {m.month}
                            </td>
                            <td className="py-3.5 px-3.5 text-slate-700 font-mono">
                              ₹ {m.billAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3.5 text-slate-500 font-mono">
                              + ₹ {m.previousPending.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3.5 font-bold text-slate-900 font-mono bg-slate-50/60">
                              = ₹ {m.totalDue.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3.5 text-emerald-600 font-bold font-mono">
                              ₹ {m.amountPaid.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3.5 font-bold font-mono text-amber-600">
                              ₹ {m.remainingPending.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
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
                              <td className="py-3.5 px-3.5 text-right">
                                <button
                                  onClick={() => {
                                    setPaymentAmount(m.remainingPending > 0 ? m.remainingPending : selectedClient.currentMonthlyAmount);
                                    setShowPaymentModal({ client: selectedClient, month: m.month });
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white border border-brand-200 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                                >
                                  + Record Payment
                                </button>
                              </td>
                            )}
                          </tr>

                          {/* Nested Payments Details */}
                          {m.payments && m.payments.length > 0 && (
                            <tr className="bg-slate-50/40">
                              <td colSpan={isAdmin ? 8 : 7} className="py-2.5 px-6">
                                <div className="text-[11px] text-slate-600 space-y-1.5">
                                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                    <Receipt className="w-3.5 h-3.5 text-brand-600" />
                                    <span>Settled payments for {m.month}:</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {m.payments.map((p) => (
                                      <div
                                        key={p.id}
                                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] shadow-2xs"
                                      >
                                        <div className="text-emerald-700 font-bold font-mono">
                                          ₹ {p.amount.toLocaleString('en-IN')} on {p.paymentDate}
                                        </div>
                                        <div className="text-slate-500 text-[10px] mt-0.5">
                                          {p.paymentMethod} {p.referenceNumber ? `• Ref: ${p.referenceNumber}` : ''}
                                        </div>
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
            <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Select a recurring client on the left to inspect month-by-month billing and carry-forward balances.
            </div>
          )}
        </div>
      </div>

      {/* ADD RECURRING CLIENT MODAL (Admin Only) */}
      {showAddClientModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-crm-modal flex flex-col max-h-[90vh] my-auto overflow-hidden text-slate-900">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-600" />
                Add Recurring Client
              </h2>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {formError}
                  </div>
                )}

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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:border-brand-600 outline-none"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-brand-600 outline-none"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
                  />
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm cursor-pointer disabled:opacity-60"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-crm-modal flex flex-col max-h-[90vh] my-auto overflow-hidden text-slate-900">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Record Settlement Payment
                </h2>
                <p className="text-xs text-slate-500">
                  {showPaymentModal.client.name} &bull; Month: {showPaymentModal.month}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {formError}
                  </div>
                )}

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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 outline-none cursor-pointer"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1st installment received via NEFT"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
                  />
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm cursor-pointer disabled:opacity-60"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-crm-modal flex flex-col max-h-[90vh] my-auto overflow-hidden text-slate-900">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-brand-600" />
                  Revise Monthly Amount
                </h2>
                <p className="text-xs text-slate-500">{showRateModal.name}</p>
              </div>
              <button
                onClick={() => setShowRateModal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Monthly Fee</label>
                  <div className="text-sm font-bold text-slate-700 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono">
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand-600 outline-none"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-brand-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Revision</label>
                  <input
                    type="text"
                    placeholder="e.g. Scope upgrade & dedicated maintenance"
                    value={rateReason}
                    onChange={(e) => setRateReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
                  />
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowRateModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm cursor-pointer disabled:opacity-60"
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
