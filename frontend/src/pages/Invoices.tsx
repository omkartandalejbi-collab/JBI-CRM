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
  const [notes, setNotes] = useState('Payment due within 15 days of invoice date.');
  const [taxRate, setTaxRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: 'Cloud CRM Customization & Module Setup', quantity: 1, unitPrice: 25000, amount: 25000 },
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
      setFormError('Please fill out all invoice items with valid quantities and rates.');
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

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & CA Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              One-Time Billing &amp; PDF Invoices
            </h1>
            {isCA && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 border border-sky-200 text-sky-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                CA Read-Only Mode (Download Permitted)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate, manage, and download professional vector tax invoices automatically.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New Invoice
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client or invoice #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {['All', 'Pending', 'Paid', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No invoices found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Date &amp; Due</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inv.clientName}</div>
                      {inv.clientEmail && (
                        <div className="text-[11px] text-slate-500">{inv.clientEmail}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>Issued: {inv.invoiceDate}</div>
                      <div className="text-[11px] text-slate-500">Due: {inv.dueDate}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {inv.items?.length || 0} line item(s)
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹ {inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Download PDF Button */}
                        <button
                          onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                          disabled={downloadingId === inv.id}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Generate &amp; Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingId === inv.id ? 'Generating...' : 'PDF'}</span>
                        </button>

                        {/* Status Change (Admin only) */}
                        {isAdmin && (
                          <select
                            value={inv.status}
                            onChange={(e) => handleUpdateStatus(inv.id, e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg text-[11px] text-slate-800 py-1 px-2 focus:outline-none focus:border-indigo-600"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE INVOICE MODAL (Admin Only) */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-6 text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Generate One-Time PDF Invoice
                </h2>
                <p className="text-xs text-slate-500">
                  Automated calculation, tax breakdown, and vector PDF generator
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-6">
              {/* Row 1: Invoice # and Client Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client / Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Technologies India"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Row 2: Client Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    placeholder="accounts@client.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Row 3: Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Client Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  placeholder="Street, City, State, PIN"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Itemized Services / Products */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Itemized Services / Products
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Service / Item Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                        className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        min={1}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-16 p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 text-center focus:outline-none focus:border-indigo-600"
                      />
                      <input
                        type="number"
                        placeholder="Rate (₹)"
                        value={item.unitPrice}
                        min={0}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-28 p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 text-right focus:outline-none focus:border-indigo-600"
                      />
                      <div className="w-24 text-right font-bold text-xs text-slate-800">
                        ₹ {item.amount.toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculations Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="text-slate-900 font-semibold">
                    ₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>GST Rate:</span>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18% (Standard GST)</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                  <span className="text-slate-900 font-semibold">
                    ₹ {taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Discount (₹):</span>
                  <input
                    type="number"
                    value={discount}
                    min={0}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-28 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-right text-slate-900"
                  />
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>Grand Total (Due):</span>
                  <span className="text-indigo-600">
                    ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Terms
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Creating Invoice...' : 'Create & Generate PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
