import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  GraduationCap,
  Receipt,
  CreditCard,
  CheckCircle2,
  Clock,
  Printer,
  X,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import {
  FinanceTransaction,
  FinanceInvoice,
  FinanceOverviewData,
  UniversityCommissionSummary
} from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const FinancePage: React.FC = () => {
  const { addToast } = useNotifications();
  const { isSuperAdmin, hasPermission } = useAuth();
  const canManageFinance = isSuperAdmin || hasPermission('finance_management');

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'invoices' | 'commissions'>('overview');
  const [loading, setLoading] = useState(false);

  // Data states
  const [overview, setOverview] = useState<FinanceOverviewData | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [commissions, setCommissions] = useState<UniversityCommissionSummary[]>([]);

  // Filter states
  const [txnTypeFilter, setTxnTypeFilter] = useState('ALL');
  const [txnCategoryFilter, setTxnCategoryFilter] = useState('ALL');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [addTxnOpen, setAddTxnOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [payInvoiceModalOpen, setPayInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceInvoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<FinanceInvoice | null>(null);

  // Add Transaction Form
  const [txnType, setTxnType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [txnCategory, setTxnCategory] = useState('Student Fee');
  const [txnTitle, setTxnTitle] = useState('');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnDate, setTxnDate] = useState(new Date().toISOString().split('T')[0]);
  const [txnMethod, setTxnMethod] = useState('Bank Transfer');
  const [txnRef, setTxnRef] = useState('');
  const [txnNotes, setTxnNotes] = useState('');

  // Create Invoice Form
  const [invRecipient, setInvRecipient] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invPhone, setInvPhone] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDueDate, setInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [invType, setInvType] = useState<'STUDENT_FEE' | 'UNIVERSITY_COMMISSION'>('STUDENT_FEE');
  const [invItemDesc, setInvItemDesc] = useState('Consultancy & Admission Processing Fee');

  // Pay Invoice Form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payRef, setPayRef] = useState('');

  // Data Loading
  const loadOverview = async () => {
    try {
      const data = await api.getFinanceOverview();
      setOverview(data);
    } catch (e: any) {
      console.warn('Overview load error:', e);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await api.getFinanceTransactions({
        type: txnTypeFilter !== 'ALL' ? txnTypeFilter : undefined,
        category: txnCategoryFilter !== 'ALL' ? txnCategoryFilter : undefined,
      });
      setTransactions(data);
    } catch (e: any) {
      console.warn('Transactions load error:', e);
    }
  };

  const loadInvoices = async () => {
    try {
      const data = await api.getFinanceInvoices({
        status: invoiceStatusFilter !== 'ALL' ? invoiceStatusFilter : undefined,
      });
      setInvoices(data);
    } catch (e: any) {
      console.warn('Invoices load error:', e);
    }
  };

  const loadCommissions = async () => {
    try {
      const data = await api.getUniversityCommissions();
      setCommissions(data);
    } catch (e: any) {
      console.warn('Commissions load error:', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadOverview(), loadTransactions(), loadInvoices(), loadCommissions()]).finally(() =>
      setLoading(false)
    );
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') loadTransactions();
    if (activeTab === 'invoices') loadInvoices();
    if (activeTab === 'commissions') loadCommissions();
    if (activeTab === 'overview') loadOverview();
  }, [activeTab, txnTypeFilter, txnCategoryFilter, invoiceStatusFilter]);

  // Handlers
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnTitle || !txnAmount) {
      addToast('Title and Amount are required', 'warning');
      return;
    }
    try {
      await api.createFinanceTransaction({
        type: txnType,
        category: txnCategory,
        title: txnTitle,
        amount: Number(txnAmount) || 0,
        transaction_date: txnDate,
        payment_method: txnMethod,
        reference_number: txnRef,
        notes: txnNotes
      });
      addToast(`${txnType === 'INCOME' ? 'Income' : 'Expense'} recorded successfully!`, 'success');
      setAddTxnOpen(false);
      setTxnTitle('');
      setTxnAmount('');
      setTxnNotes('');
      loadTransactions();
      loadOverview();
    } catch (err: any) {
      addToast(err.message || 'Failed to record transaction', 'error');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invRecipient || !invAmount) {
      addToast('Recipient and Amount are required', 'warning');
      return;
    }
    try {
      const amt = Number(invAmount) || 0;
      await api.createFinanceInvoice({
        recipient_name: invRecipient,
        recipient_email: invEmail,
        recipient_phone: invPhone,
        total_amount: amt,
        due_date: invDueDate,
        invoice_type: invType,
        items: [{ description: invItemDesc, qty: 1, unit_price: amt, amount: amt }]
      });
      addToast(`Invoice created for ${invRecipient}!`, 'success');
      setCreateInvoiceOpen(false);
      setInvRecipient('');
      setInvAmount('');
      loadInvoices();
      loadOverview();
    } catch (err: any) {
      addToast(err.message || 'Failed to create invoice', 'error');
    }
  };

  const handleRecordInvoicePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !payAmount) return;
    try {
      await api.recordInvoicePayment(selectedInvoice.id, {
        amount: Number(payAmount) || 0,
        paymentMethod: payMethod,
        referenceNumber: payRef
      });
      addToast(`Payment of NPR ${Number(payAmount).toLocaleString()} recorded! Ledger updated.`, 'success');
      setPayInvoiceModalOpen(false);
      setSelectedInvoice(null);
      setPayAmount('');
      loadInvoices();
      loadOverview();
      loadTransactions();
    } catch (err: any) {
      addToast(err.message || 'Failed to record payment', 'error');
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.student_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Finance &amp; Accounting Management</h1>
            <p className="text-xs text-slate-500">Student fee collection, partner university commissions, operating expenses &amp; P&amp;L</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {canManageFinance && (
            <>
              <button
                onClick={() => setCreateInvoiceOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                <Receipt className="w-4 h-4 text-slate-600" />
                Create Invoice
              </button>
              <button
                onClick={() => setAddTxnOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Record Transaction
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Revenue (Income)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            NPR {overview?.totalIncome?.toLocaleString() || '0'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Student fees + Uni commissions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Expenses</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600">
            NPR {overview?.totalExpense?.toLocaleString() || '0'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Salaries, ads, events &amp; rent</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Net Profit / Margin</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className={`mt-2 text-2xl font-bold ${(overview?.netProfit || 0) >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            NPR {overview?.netProfit?.toLocaleString() || '0'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            Margin: {overview?.profitMargin || 0}% operating profit
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Receivables</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            NPR {((overview?.totalStudentFeeDue || 0) + (overview?.totalUniCommissionDue || 0)).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Outstanding student &amp; uni dues</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          P&amp;L Overview
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'transactions'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          General Ledger ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'invoices'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Student Fee Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('commissions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'commissions'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Partner University Commissions
        </button>
      </div>

      {/* TAB 1: P&L OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Revenue Breakdown by Stream
              </h3>
              <span className="text-xs font-semibold text-emerald-600">
                NPR {overview?.totalIncome?.toLocaleString() || '0'}
              </span>
            </div>

            <div className="space-y-3">
              {overview?.incomeBreakdown && overview.incomeBreakdown.length > 0 ? (
                overview.incomeBreakdown.map((item) => {
                  const pct = overview.totalIncome > 0 ? Math.round((item.amount / overview.totalIncome) * 100) : 0;
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{item.category} ({item.count})</span>
                        <span className="font-semibold text-slate-900">
                          NPR {Number(item.amount).toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 py-6 text-center">
                  No income transactions logged yet. Click "Record Transaction" to add your first revenue entry.
                </div>
              )}
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Operating Expenses Breakdown
              </h3>
              <span className="text-xs font-semibold text-rose-600">
                NPR {overview?.totalExpense?.toLocaleString() || '0'}
              </span>
            </div>

            <div className="space-y-3">
              {overview?.expenseBreakdown && overview.expenseBreakdown.length > 0 ? (
                overview.expenseBreakdown.map((item) => {
                  const pct = overview.totalExpense > 0 ? Math.round((item.amount / overview.totalExpense) * 100) : 0;
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{item.category} ({item.count})</span>
                        <span className="font-semibold text-slate-900">
                          NPR {Number(item.amount).toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 py-6 text-center">
                  No expense records logged yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL LEDGER & TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={txnTypeFilter}
                onChange={(e) => setTxnTypeFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
              >
                <option value="ALL">All Types</option>
                <option value="INCOME">Income Only</option>
                <option value="EXPENSE">Expense Only</option>
              </select>

              <select
                value={txnCategoryFilter}
                onChange={(e) => setTxnCategoryFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
              >
                <option value="ALL">All Categories</option>
                <option value="Student Fee">Student Fee</option>
                <option value="University Commission">University Commission</option>
                <option value="Salaries & Payroll">Salaries &amp; Payroll</option>
                <option value="Digital Ads (Meta/Google)">Digital Ads</option>
                <option value="Office Rent">Office Rent</option>
                <option value="Event & Fair Expenses">Events &amp; Fairs</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date &amp; ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No transactions found. Click "Record Transaction" to add entries.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{t.transaction_date}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{t.transaction_id}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              t.type === 'INCOME'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {t.type === 'INCOME' ? '+' : '-'} {t.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{t.category}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{t.title}</div>
                          {t.reference_number && (
                            <div className="text-[10px] text-slate-400">Ref: {t.reference_number}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{t.payment_method}</td>
                        <td className={`py-3.5 px-4 text-right font-bold text-sm ${
                          t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {t.type === 'INCOME' ? '+' : '-'} {t.currency} {Number(t.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
              <select
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
              >
                <option value="ALL">All Invoices</option>
                <option value="Paid">Fully Paid</option>
                <option value="Partial">Partially Paid</option>
                <option value="Sent">Pending Payment</option>
              </select>
            </div>

            <button
              onClick={() => setCreateInvoiceOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Invoice
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Student / Recipient</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Paid Amount</th>
                    <th className="py-3 px-4">Remaining Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        No invoices created yet. Click "Create Invoice" to bill a student.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{inv.recipient_name}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{inv.due_date}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {inv.currency} {Number(inv.total_amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-600">
                          {inv.currency} {Number(inv.paid_amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-600">
                          {inv.currency} {Number(inv.due_amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inv.status === 'Partial'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPrintInvoice(inv)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium"
                            >
                              Receipt
                            </button>
                            {inv.status !== 'Paid' && canManageFinance && (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setPayAmount(String(inv.due_amount));
                                  setPayInvoiceModalOpen(true);
                                }}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold"
                              >
                                Collect Fee
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PARTNER UNIVERSITY COMMISSIONS */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Partner University Agency Commissions</h3>
              <p className="text-xs text-slate-500">
                Track admitted students converted to our partner Indian/international universities and collect consultant commission.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-700">
              Avg. Industry Rate: <span className="text-emerald-600">NPR 45,000 / admission</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {commissions.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                No students enrolled with universities yet. Once admissions are confirmed in the pipeline, university commissions will appear here.
              </div>
            ) : (
              commissions.map((comm) => (
                <div key={comm.university_id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{comm.university_name}</h4>
                      <p className="text-[11px] text-slate-500">{comm.total_enrolled_students} Enrolled Students</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        comm.settlement_status === 'SETTLED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : comm.settlement_status === 'PARTIAL'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {comm.settlement_status}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated Commission:</span>
                      <span className="font-bold text-slate-900">NPR {comm.estimated_commission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Received:</span>
                      <span className="font-semibold">NPR {comm.received_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Pending Balance:</span>
                      <span>NPR {comm.pending_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {canManageFinance && comm.pending_amount > 0 && (
                    <button
                      onClick={() => {
                        setInvRecipient(comm.university_name);
                        setInvAmount(String(comm.pending_amount));
                        setInvType('UNIVERSITY_COMMISSION');
                        setInvItemDesc(`Agency Commission for ${comm.total_enrolled_students} student admissions`);
                        setCreateInvoiceOpen(true);
                      }}
                      className="w-full mt-2 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                    >
                      Invoice University
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: RECORD TRANSACTION */}
      {addTxnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Record Transaction</h2>
              <button onClick={() => setAddTxnOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTransaction} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setTxnType('INCOME'); setTxnCategory('Student Fee'); }}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      txnType === 'INCOME' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    + Income (Revenue)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTxnType('EXPENSE'); setTxnCategory('Digital Ads (Meta/Google)'); }}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      txnType === 'EXPENSE' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    - Expense (Outflow)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={txnCategory}
                  onChange={(e) => setTxnCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  {txnType === 'INCOME' ? (
                    <>
                      <option value="Student Fee">Student Fee</option>
                      <option value="University Commission">University Commission</option>
                      <option value="Consultancy Fee">Consultancy Fee</option>
                      <option value="Processing Fee">Application Processing Fee</option>
                      <option value="Other Income">Other Income</option>
                    </>
                  ) : (
                    <>
                      <option value="Digital Ads (Meta/Google)">Digital Ads (Meta / Google)</option>
                      <option value="Salaries & Payroll">Salaries &amp; Staff Payroll</option>
                      <option value="Office Rent">Office Rent &amp; Maintenance</option>
                      <option value="Event & Fair Expenses">Education Fair &amp; Event Expenses</option>
                      <option value="Software & Tech">Software, Hosting &amp; Tech</option>
                      <option value="Utilities">Utilities &amp; Office Supplies</option>
                      <option value="Other Expense">Other Expense</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title / Description *</label>
                <input
                  type="text"
                  required
                  value={txnTitle}
                  onChange={(e) => setTxnTitle(e.target.value)}
                  placeholder="e.g. Meta Ads Nepal Campaign Spend"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (NPR) *</label>
                  <input
                    type="number"
                    required
                    value={txnAmount}
                    onChange={(e) => setTxnAmount(e.target.value)}
                    placeholder="25000"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={txnDate}
                    onChange={(e) => setTxnDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={txnMethod}
                    onChange={(e) => setTxnMethod(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="eSewa">eSewa</option>
                    <option value="Khalti">Khalti</option>
                    <option value="ConnectIPS">ConnectIPS</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Txn #</label>
                  <input
                    type="text"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                    placeholder="Bank Ref / Chq #"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddTxnOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE INVOICE */}
      {createInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Create New Invoice</h2>
              <button onClick={() => setCreateInvoiceOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Type</label>
                <select
                  value={invType}
                  onChange={(e) => setInvType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="STUDENT_FEE">Student Fee Invoice</option>
                  <option value="UNIVERSITY_COMMISSION">University Commission Invoice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {invType === 'STUDENT_FEE' ? 'Student Full Name *' : 'University Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={invRecipient}
                  onChange={(e) => setInvRecipient(e.target.value)}
                  placeholder={invType === 'STUDENT_FEE' ? 'e.g. Pooja Pokhrel' : 'e.g. SRM Institute'}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Amount (NPR) *</label>
                  <input
                    type="number"
                    required
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    placeholder="45000"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Description</label>
                <input
                  type="text"
                  value={invItemDesc}
                  onChange={(e) => setInvItemDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateInvoiceOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COLLECT / RECORD INVOICE PAYMENT */}
      {payInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Record Fee Collection</h2>
              <button onClick={() => setPayInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordInvoicePayment} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-semibold text-slate-800">{selectedInvoice.recipient_name}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Current Due:</span>
                  <span>NPR {Number(selectedInvoice.due_amount).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (NPR) *</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="eSewa">eSewa</option>
                  <option value="Khalti">Khalti</option>
                  <option value="ConnectIPS">ConnectIPS</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Reference #</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Txn ID / Cheque #"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayInvoiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE RECEIPT / INVOICE */}
      {printInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  GGS
                </div>
                <h3 className="text-sm font-bold text-slate-900">Gems Group Services</h3>
              </div>
              <button onClick={() => setPrintInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-3 border-b border-dashed border-slate-200">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500">Official Payment Receipt</h4>
              <p className="text-sm font-extrabold text-slate-800 mt-0.5">Invoice: {printInvoice.invoice_number}</p>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Billed To:</span>
                <span className="font-semibold text-slate-900">{printInvoice.recipient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-mono text-slate-700">{printInvoice.due_date}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Billed:</span>
                  <span className="font-mono text-slate-800">
                    {printInvoice.currency} {Number(printInvoice.total_amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Amount Paid:</span>
                  <span className="font-mono">
                    {printInvoice.currency} {Number(printInvoice.paid_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Remaining Balance:</span>
                  <span className="font-mono">
                    {printInvoice.currency} {Number(printInvoice.due_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Payment Status:</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full ${
                  printInvoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {printInvoice.status}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => setPrintInvoice(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FinancePage;
