import { db, logAudit } from '../db/database.ts';
import { isNeonEnabled, persistTransactionToNeon, deleteTransactionFromNeon, persistInvoiceToNeon, deleteInvoiceFromNeon, persistDeletedRecordToNeon } from '../db/neon.ts';

export interface FinanceTransaction {
  id: string;
  transaction_id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  title: string;
  amount: number;
  currency: string;
  transaction_date: string;
  payment_method: string;
  reference_number?: string | null;
  student_id?: string | null;
  student_name?: string | null;
  university_id?: string | null;
  university_name?: string | null;
  status: string;
  notes?: string | null;
  recorded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FinanceInvoice {
  id: string;
  invoice_number: string;
  invoice_type: 'STUDENT_FEE' | 'UNIVERSITY_COMMISSION';
  recipient_name: string;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  currency: string;
  due_date: string;
  status: string;
  items: any[];
  notes?: string | null;
  student_id?: string | null;
  university_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// 1. TRANSACTIONS & GENERAL LEDGER
// ==========================================
export function getTransactions(filters: {
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  limit?: number;
} = {}): FinanceTransaction[] {
  try {
    let sql = "SELECT * FROM finance_transactions WHERE 1=1";
    const params: any[] = [];

    if (filters.type && filters.type !== 'ALL') {
      sql += " AND type = ?";
      params.push(filters.type);
    }
    if (filters.category && filters.category !== 'ALL') {
      sql += " AND category = ?";
      params.push(filters.category);
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
      sql += " AND payment_method = ?";
      params.push(filters.paymentMethod);
    }
    if (filters.startDate) {
      sql += " AND transaction_date >= ?";
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += " AND transaction_date <= ?";
      params.push(filters.endDate);
    }

    sql += " ORDER BY transaction_date DESC, created_at DESC";
    if (filters.limit) {
      sql += " LIMIT ?";
      params.push(filters.limit);
    }

    return db.prepare(sql).all(...params) as any[];
  } catch (err: any) {
    console.warn('[Finance Transactions] Query failed:', err.message);
    return [];
  }
}

export function createTransaction(data: Partial<FinanceTransaction>, performedBy: string = 'Super Admin'): FinanceTransaction {
  const id = 'FTXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const txnId = data.transaction_id || `TXN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  db.prepare(`
    INSERT INTO finance_transactions (
      id, transaction_id, type, category, title, amount, currency,
      transaction_date, payment_method, reference_number, student_id, student_name,
      university_id, university_name, status, notes, recorded_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    txnId,
    data.type || 'INCOME',
    data.category || 'Student Fee',
    data.title || 'General Transaction',
    data.amount ? Number(data.amount) : 0,
    data.currency || 'NPR',
    data.transaction_date || new Date().toISOString().split('T')[0],
    data.payment_method || 'Bank Transfer',
    data.reference_number || null,
    data.student_id || null,
    data.student_name || null,
    data.university_id || null,
    data.university_name || null,
    data.status || 'Completed',
    data.notes || null,
    performedBy
  );

  logAudit({
    userName: performedBy,
    action: 'CREATE_FINANCE_TRANSACTION',
    entity: 'finance_transaction',
    entityId: id,
    newValue: { type: data.type, title: data.title, amount: data.amount }
  });

  const newTxn = db.prepare("SELECT * FROM finance_transactions WHERE id = ?").get(id) as any;
  if (isNeonEnabled() && newTxn) {
    persistTransactionToNeon(newTxn).catch(e => console.warn('[Neon Sync] Tx defer:', e.message));
  }
  return newTxn;
}

export function updateTransaction(id: string, data: Partial<FinanceTransaction>, performedBy: string = 'Super Admin'): boolean {
  const existing = db.prepare("SELECT * FROM finance_transactions WHERE id = ?").get(id) as any;
  if (!existing) return false;

  db.prepare(`
    UPDATE finance_transactions
    SET type = ?,
        category = ?,
        title = ?,
        amount = ?,
        currency = ?,
        transaction_date = ?,
        payment_method = ?,
        reference_number = ?,
        student_id = ?,
        student_name = ?,
        university_id = ?,
        university_name = ?,
        status = ?,
        notes = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.type !== undefined ? data.type : existing.type,
    data.category !== undefined ? data.category : existing.category,
    data.title !== undefined ? data.title : existing.title,
    data.amount !== undefined ? Number(data.amount) : existing.amount,
    data.currency !== undefined ? data.currency : existing.currency,
    data.transaction_date !== undefined ? data.transaction_date : existing.transaction_date,
    data.payment_method !== undefined ? data.payment_method : existing.payment_method,
    data.reference_number !== undefined ? data.reference_number : existing.reference_number,
    data.student_id !== undefined ? data.student_id : existing.student_id,
    data.student_name !== undefined ? data.student_name : existing.student_name,
    data.university_id !== undefined ? data.university_id : existing.university_id,
    data.university_name !== undefined ? data.university_name : existing.university_name,
    data.status !== undefined ? data.status : existing.status,
    data.notes !== undefined ? data.notes : existing.notes,
    id
  );

  const updatedTx = db.prepare("SELECT * FROM finance_transactions WHERE id = ?").get(id) as any;
  if (isNeonEnabled() && updatedTx) {
    persistTransactionToNeon(updatedTx).catch(e => console.warn('[Neon Sync] Tx update defer:', e.message));
  }

  return true;
}

export function deleteTransaction(id: string, performedBy: string = 'Super Admin'): boolean {
  const existing = db.prepare("SELECT * FROM finance_transactions WHERE id = ?").get(id) as any;
  if (!existing) return false;

  db.prepare("DELETE FROM finance_transactions WHERE id = ?").run(id);

  const tombId = 'DEL-TX-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  db.prepare(`
    INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by, deleted_at)
    VALUES (?, 'finance_transaction', ?, ?, ?, ?, datetime('now'))
  `).run(tombId, id, existing.transaction_id || id, JSON.stringify({ title: existing.title, amount: existing.amount }), performedBy);

  if (isNeonEnabled()) {
    deleteTransactionFromNeon(id).catch(e => console.warn('[Neon Delete] Tx defer:', e.message));
    persistDeletedRecordToNeon({
      id: tombId,
      entity_type: 'finance_transaction',
      entity_id: id,
      identifier: existing.transaction_id || id,
      details: JSON.stringify({ title: existing.title, amount: existing.amount }),
      deleted_by: performedBy
    }).catch(e => console.warn('[Neon Tombstone] Tx defer:', e.message));
  }

  logAudit({
    userName: performedBy,
    action: 'DELETE_FINANCE_TRANSACTION',
    entity: 'finance_transaction',
    entityId: id,
    oldValue: existing
  });

  return true;
}

// ==========================================
// 2. INVOICES & FEE COLLECTION
// ==========================================
export function getInvoices(filters: {
  invoice_type?: string;
  status?: string;
  student_id?: string;
  university_id?: string;
} = {}): FinanceInvoice[] {
  try {
    let sql = "SELECT * FROM finance_invoices WHERE 1=1";
    const params: any[] = [];

    if (filters.invoice_type && filters.invoice_type !== 'ALL') {
      sql += " AND invoice_type = ?";
      params.push(filters.invoice_type);
    }
    if (filters.status && filters.status !== 'ALL') {
      sql += " AND status = ?";
      params.push(filters.status);
    }
    if (filters.student_id) {
      sql += " AND student_id = ?";
      params.push(filters.student_id);
    }
    if (filters.university_id) {
      sql += " AND university_id = ?";
      params.push(filters.university_id);
    }

    sql += " ORDER BY created_at DESC";
    const rows = db.prepare(sql).all(...params) as any[];

    return rows.map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || [])
    }));
  } catch (err: any) {
    console.warn('[Finance Invoices] Query failed:', err.message);
    return [];
  }
}

export function createInvoice(data: Partial<FinanceInvoice>, performedBy: string = 'Super Admin'): FinanceInvoice {
  const id = 'INV-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const count = (db.prepare("SELECT count(*) as count FROM finance_invoices").get() as any).count || 0;
  const invoiceNumber = data.invoice_number || `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

  const total = Number(data.total_amount) || 0;
  const paid = Number(data.paid_amount) || 0;
  const due = Math.max(0, total - paid);

  let initialStatus = data.status || 'Sent';
  if (paid >= total && total > 0) initialStatus = 'Paid';
  else if (paid > 0) initialStatus = 'Partial';

  const itemsJson = JSON.stringify(data.items || [
    { description: 'Admission Processing & Consultancy Service', qty: 1, unit_price: total, amount: total }
  ]);

  db.prepare(`
    INSERT INTO finance_invoices (
      id, invoice_number, invoice_type, recipient_name, recipient_email, recipient_phone,
      total_amount, paid_amount, due_amount, currency, due_date, status, items, notes,
      student_id, university_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    invoiceNumber,
    data.invoice_type || 'STUDENT_FEE',
    data.recipient_name,
    data.recipient_email || null,
    data.recipient_phone || null,
    total,
    paid,
    due,
    data.currency || 'NPR',
    data.due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    initialStatus,
    itemsJson,
    data.notes || null,
    data.student_id || null,
    data.university_id || null
  );

  logAudit({
    userName: performedBy,
    action: 'CREATE_INVOICE',
    entity: 'finance_invoice',
    entityId: id,
    newValue: { invoiceNumber, recipient: data.recipient_name, total }
  });

  const createdInv = getInvoices({}).find(i => i.id === id)!;
  if (isNeonEnabled() && createdInv) {
    persistInvoiceToNeon(createdInv).catch(e => console.warn('[Neon Sync] Invoice defer:', e.message));
  }

  return createdInv;
}

export function deleteInvoice(id: string, performedBy: string = 'Super Admin'): boolean {
  const existing = db.prepare("SELECT * FROM finance_invoices WHERE id = ?").get(id) as any;
  if (!existing) return false;

  db.prepare("DELETE FROM finance_invoices WHERE id = ?").run(id);

  const tombId = 'DEL-INV-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  db.prepare(`
    INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by, deleted_at)
    VALUES (?, 'finance_invoice', ?, ?, ?, ?, datetime('now'))
  `).run(tombId, id, existing.invoice_number || id, JSON.stringify({ recipient: existing.recipient_name, total: existing.total_amount }), performedBy);

  if (isNeonEnabled()) {
    deleteInvoiceFromNeon(id).catch(e => console.warn('[Neon Delete] Invoice defer:', e.message));
    persistDeletedRecordToNeon({
      id: tombId,
      entity_type: 'finance_invoice',
      entity_id: id,
      identifier: existing.invoice_number || id,
      details: JSON.stringify({ recipient: existing.recipient_name, total: existing.total_amount }),
      deleted_by: performedBy
    }).catch(e => console.warn('[Neon Tombstone] Invoice defer:', e.message));
  }

  logAudit({
    userName: performedBy,
    action: 'DELETE_FINANCE_INVOICE',
    entity: 'finance_invoice',
    entityId: id,
    oldValue: existing
  });

  return true;
}

export function recordInvoicePayment(
  invoiceId: string,
  amount: number,
  paymentMethod: string = 'Bank Transfer',
  referenceNumber?: string,
  performedBy: string = 'Super Admin'
) {
  const inv = db.prepare("SELECT * FROM finance_invoices WHERE id = ?").get(invoiceId) as any;
  if (!inv) throw new Error('Invoice not found');

  const paymentAmount = Number(amount) || 0;
  const newPaid = Number(inv.paid_amount) + paymentAmount;
  const newDue = Math.max(0, Number(inv.total_amount) - newPaid);
  const newStatus = newDue <= 0 ? 'Paid' : 'Partial';

  db.prepare(`
    UPDATE finance_invoices
    SET paid_amount = ?,
        due_amount = ?,
        status = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(newPaid, newDue, newStatus, invoiceId);

  // Auto record Income in General Ledger
  const today = new Date().toISOString().split('T')[0];
  const txnCategory = inv.invoice_type === 'UNIVERSITY_COMMISSION' ? 'University Commission' : 'Student Fee';

  createTransaction({
    type: 'INCOME',
    category: txnCategory,
    title: `Payment for ${inv.invoice_number} (${inv.recipient_name})`,
    amount: paymentAmount,
    currency: inv.currency,
    transaction_date: today,
    payment_method: paymentMethod,
    reference_number: referenceNumber || `PAY-${inv.invoice_number}`,
    student_id: inv.student_id,
    student_name: inv.invoice_type === 'STUDENT_FEE' ? inv.recipient_name : null,
    university_id: inv.university_id,
    university_name: inv.invoice_type === 'UNIVERSITY_COMMISSION' ? inv.recipient_name : null,
    notes: `Recorded against invoice ${inv.invoice_number}. Remaining due: ${newDue} ${inv.currency}`
  }, performedBy);

  // If student invoice, also update students fee_paid
  if (inv.student_id) {
    try {
      db.prepare(`
        UPDATE students
        SET fee_paid = fee_paid + ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(paymentAmount, inv.student_id);
    } catch (e) {}
  }

  return { success: true, invoiceId, paidAmount: newPaid, dueAmount: newDue, status: newStatus };
}

// ==========================================
// 3. FINANCIAL OVERVIEW & P&L DASHBOARD
// ==========================================
export function getFinanceOverview(params: { month?: string; year?: string } = {}) {
  try {
    let dateFilter = "";
    const queryParams: any[] = [];
    if (params.month) {
      dateFilter = " AND transaction_date LIKE ?";
      queryParams.push(`${params.month}%`);
    } else if (params.year) {
      dateFilter = " AND transaction_date LIKE ?";
      queryParams.push(`${params.year}%`);
    }

    // Income sum
    const incomeRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM finance_transactions 
      WHERE type = 'INCOME' AND status = 'Completed' ${dateFilter}
    `).get(...queryParams) as any;
    const totalIncome = Number(incomeRow?.total || 0);

    // Expense sum
    const expenseRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM finance_transactions 
      WHERE type = 'EXPENSE' AND status = 'Completed' ${dateFilter}
    `).get(...queryParams) as any;
    const totalExpense = Number(expenseRow?.total || 0);

    const netProfit = totalIncome - totalExpense;

    // Income breakdown by category
    const incomeBreakdown = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as amount, count(*) as count
      FROM finance_transactions
      WHERE type = 'INCOME' AND status = 'Completed' ${dateFilter}
      GROUP BY category
      ORDER BY amount DESC
    `).all(...queryParams) as any[];

    // Expense breakdown by category
    const expenseBreakdown = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as amount, count(*) as count
      FROM finance_transactions
      WHERE type = 'EXPENSE' AND status = 'Completed' ${dateFilter}
      GROUP BY category
      ORDER BY amount DESC
    `).all(...queryParams) as any[];

    // Outstanding Student Fees
    const studentDueRow = db.prepare(`
      SELECT COALESCE(SUM(due_amount), 0) as totalDue
      FROM finance_invoices
      WHERE invoice_type = 'STUDENT_FEE' AND status != 'Paid' AND status != 'Cancelled'
    `).get() as any;
    const totalStudentFeeDue = Number(studentDueRow?.totalDue || 0);

    // Outstanding University Commissions
    const uniDueRow = db.prepare(`
      SELECT COALESCE(SUM(due_amount), 0) as totalDue
      FROM finance_invoices
      WHERE invoice_type = 'UNIVERSITY_COMMISSION' AND status != 'Paid' AND status != 'Cancelled'
    `).get() as any;
    const totalUniCommissionDue = Number(uniDueRow?.totalDue || 0);

    return {
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin: totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0,
      totalStudentFeeDue,
      totalUniCommissionDue,
      incomeBreakdown,
      expenseBreakdown,
      currency: 'NPR'
    };
  } catch (err: any) {
    console.warn('[Finance Overview] Failed to compute KPIs:', err.message);
    return {
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      profitMargin: 0,
      totalStudentFeeDue: 0,
      totalUniCommissionDue: 0,
      incomeBreakdown: [],
      expenseBreakdown: [],
      currency: 'NPR'
    };
  }
}

// ==========================================
// 4. UNIVERSITY COMMISSIONS TRACKER
// ==========================================
export function getUniversityCommissionsSummary() {
  try {
    // Group admitted students by university
    const uniAdmissions = db.prepare(`
      SELECT 
        u.id as university_id,
        u.name as university_name,
        u.city as university_city,
        u.country as university_country,
        count(s.id) as total_enrolled_students
      FROM universities u
      LEFT JOIN students s ON s.university = u.name OR s.university LIKE '%' || u.short_name || '%'
      GROUP BY u.id
      HAVING total_enrolled_students > 0
      ORDER BY total_enrolled_students DESC
    `).all() as any[];

    // Match with commission invoices
    return uniAdmissions.map(uni => {
      // Indicative: NPR 45,000 average agency commission per admitted international student
      const estimatedCommission = uni.total_enrolled_students * 45000;
      
      const invoices = db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as totalInvoiced,
               COALESCE(SUM(paid_amount), 0) as totalPaid,
               COALESCE(SUM(due_amount), 0) as totalDue
        FROM finance_invoices
        WHERE university_id = ? AND invoice_type = 'UNIVERSITY_COMMISSION'
      `).get(uni.university_id) as any;

      const invoiced = Number(invoices?.totalInvoiced || 0);
      const received = Number(invoices?.totalPaid || 0);
      const pending = invoiced > 0 ? Number(invoices?.totalDue || 0) : estimatedCommission;

      return {
        university_id: uni.university_id,
        university_name: uni.university_name,
        total_enrolled_students: uni.total_enrolled_students,
        estimated_commission: estimatedCommission,
        invoiced_amount: invoiced,
        received_amount: received,
        pending_amount: pending,
        settlement_status: received >= estimatedCommission && estimatedCommission > 0 ? 'SETTLED' : received > 0 ? 'PARTIAL' : 'PENDING'
      };
    });
  } catch (err: any) {
    console.warn('[University Commissions] Summary failed:', err.message);
    return [];
  }
}
