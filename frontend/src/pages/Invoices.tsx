import React, { useState, useEffect } from 'react';
import { billingApi } from '../services/api.js';
import { Invoice, InvoiceItem } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Search,
  AlertCircle,
  X,
  ShieldAlert,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Building,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const Invoices: React.FC = () => {
  const { isAdmin, isCA } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('Payment due within 15 days of invoice date. Bank transfer preferred.');
  const [taxRate, setTaxRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await billingApi.getAllInvoices({
        status: statusFilter,
        search: search || undefined,
      });
      setInvoices(data);
    } catch (err: any) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, search]);

  const handleOpenCreateModal = async () => {
    try {
      setFormError(null);
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setClientAddress('');
      setItems([{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
      setDiscount(0);
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      const nextNum = await billingApi.getNextInvoiceNumber();
      setInvoiceNumber(nextNum);
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setDueDate(d.toISOString().split('T')[0]);
      setShowCreateModal(true);
    } catch (err) {
      alert('Failed to generate next invoice number.');
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index] };
    if (field === 'quantity') item.quantity = Number(value) || 0;
    else if (field === 'unitPrice') item.unitPrice = Number(value) || 0;
    else if (field === 'description') item.description = String(value);

    item.amount = item.quantity * item.unitPrice;
    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = Math.max(0, subtotal + taxAmount - discount);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clientName.trim()) {
      setFormError('Client name is required.');
      return;
    }

    if (items.some((i) => !i.description.trim() || i.quantity <= 0 || i.unitPrice < 0)) {
      setFormError('Please fill out all invoice items with valid descriptions, quantities, and rates.');
      return;
    }

    try {
      setIsSubmitting(true);
      await billingApi.createInvoice({
        invoiceNumber,
        clientName,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        clientAddress: clientAddress || null,
        invoiceDate,
        dueDate,
        items,
        taxRate,
        discount,
        notes,
      });

      setShowCreateModal(false);
      fetchInvoices();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async (id: string, invNum: string) => {
    try {
      setDownloadingId(id);
      await billingApi.downloadPdfBlob(id, invNum);
    } catch (err) {
      alert('Error downloading PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await billingApi.updateInvoice(id, { status: newStatus });
      fetchInvoices();
    } catch (err: any) {
      alert('Failed to update status.');
    }
  };

  // Metrics summary
  const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPaid = invoices.filter((i) => i.status === 'Paid').reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPending = invoices.filter((i) => i.status === 'Pending').reduce((acc, inv) => acc + inv.totalAmount, 0);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <span>Financial Operations</span>
            <span className="text-slate-300">&bull;</span>
            <span>Billing Suite</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              One-Time Invoices &amp; Tax Documents
            </h1>
            {isCA && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 border border-sky-200 text-sky-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Auditor Read-Only
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, manage status, and export GST-compliant vector PDF invoices.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-xs shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Tax Invoice</span>
          </button>
        )}
      </div>

      {/* Metric Mini-Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-crm-card flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Filtered Total Billed</div>
            <div className="text-xl font-bold text-slate-900 mt-1">₹ {totalBilled.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-crm-card flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Settled (Paid)</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">₹ {totalPaid.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-crm-card flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Outstanding Balance</div>
            <div className="text-xl font-bold text-amber-600 mt-1">₹ {totalPending.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-crm-card">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client or invoice #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-500/10 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 self-stretch md:self-auto overflow-x-auto">
          {['All', 'Paid', 'Pending', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-crm-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">
            <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading invoices ledger...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">No invoices found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== 'All'
                ? 'Try adjusting your search criteria or filter to locate the document.'
                : 'Get started by creating your first corporate tax invoice.'}
            </p>
            {isAdmin && !search && statusFilter === 'All' && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Invoice</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Client / Account</th>
                  <th className="py-3.5 px-4">Invoice Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Invoice Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>{inv.invoiceNumber}</span>
                    </td>

                    {/* Client */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inv.clientName}</div>
                      {inv.clientEmail && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{inv.clientEmail}</div>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{inv.invoiceDate}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{inv.dueDate}</td>

                    {/* Amount */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono">
                        ₹ {inv.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Sub: ₹{inv.subtotal.toLocaleString('en-IN')} + {inv.taxRate}% GST
                      </div>
                    </td>

                    {/* Status with dropdown for admin */}
                    <td className="py-3.5 px-4">
                      {isAdmin ? (
                        <select
                          value={inv.status}
                          onChange={(e) => handleUpdateStatus(inv.id, e.target.value)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : inv.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : inv.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-500'
                                : inv.status === 'Pending'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          {inv.status}
                        </span>
                      )}
                    </td>

                    {/* PDF Download Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                        disabled={downloadingId === inv.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 hover:border-brand-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadingId === inv.id ? 'Generating...' : 'PDF'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-crm-modal flex flex-col max-h-[90vh] my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">Generate New Tax Invoice</h3>
                <p className="text-xs text-slate-500">Document #{invoiceNumber} &bull; Auto-calculated GST breakdown</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateInvoice} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

              {/* Section 1: Client Information */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-brand-600" />
                  <span>Client &amp; Billing Entity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Client / Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Innovations Pvt Ltd"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-500/15 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Client Email</label>
                    <input
                      type="email"
                      placeholder="billing@acme.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-500/15 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-500/15 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address</label>
                    <input
                      type="text"
                      placeholder="402 Business Bay, Pune, MH 411001"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-500/15 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Issue Date</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
                  />
                </div>
              </div>

              {/* Section 3: Line Items */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-brand-600" />
                    <span>Line Items</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Item description..."
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-16 px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-center text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-24 px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-right text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
                      />
                      <div className="w-24 text-right font-mono font-bold text-xs text-slate-800 pr-1">
                        ₹ {item.amount.toLocaleString('en-IN')}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Taxes, Discounts & Live Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 bg-slate-50/60 p-4 rounded-xl border">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-right sm:self-center font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹ {subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({taxRate}%):</span>
                    <span>₹ {taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>- ₹ {discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                    <span>Final Amount:</span>
                    <span className="text-brand-600 font-extrabold">₹ {totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Section 5: Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-600 outline-none"
                />
              </div>
            </div>

            {/* Pinned Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Generating Tax Invoice...' : 'Create & Save Invoice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  );
};
