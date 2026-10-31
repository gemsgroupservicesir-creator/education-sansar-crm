import { db, logAudit } from '../db/database.ts';

export interface Employee {
  id: string;
  employee_code: string;
  user_id?: string | null;
  counselor_id?: string | null;
  full_name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  employment_type: string;
  joining_date: string;
  monthly_salary: number;
  currency: string;
  bank_name?: string | null;
  account_number?: string | null;
  pan_number?: string | null;
  emergency_contact?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export function getEmployees(): Employee[] {
  try {
    return db.prepare(`
      SELECT e.*, c.name as linked_counselor_name, u.role as linked_user_role
      FROM hr_employees e
      LEFT JOIN counselors c ON e.counselor_id = c.id
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.created_at DESC
    `).all() as any[];
  } catch (err: any) {
    console.warn('[HR Employees] Query failed:', err.message);
    return [];
  }
}

export function getEmployee(id: string): Employee | null {
  return (db.prepare("SELECT * FROM hr_employees WHERE id = ?").get(id) as Employee) || null;
}

export function createEmployee(data: Partial<Employee>, performedBy: string = 'Super Admin'): Employee {
  const id = 'EMP-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  
  // Auto generate Employee Code if not given
  let employeeCode = data.employee_code;
  if (!employeeCode) {
    const count = (db.prepare("SELECT count(*) as count FROM hr_employees").get() as any).count || 0;
    employeeCode = `ES-EMP-${(count + 1).toString().padStart(3, '0')}`;
  }

  // Auto link to counselor if department is Counseling
  let counselorId = data.counselor_id || null;
  let userId = data.user_id || null;
  if (!counselorId && data.email) {
    const counselor = db.prepare("SELECT id, user_id FROM counselors WHERE LOWER(email) = LOWER(?)").get(data.email) as any;
    if (counselor) {
      counselorId = counselor.id;
      if (!userId) userId = counselor.user_id;
    }
  }

  db.prepare(`
    INSERT INTO hr_employees (
      id, employee_code, user_id, counselor_id, full_name, email, phone,
      department, designation, employment_type, joining_date, monthly_salary,
      currency, bank_name, account_number, pan_number, emergency_contact, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    employeeCode,
    userId,
    counselorId,
    data.full_name,
    data.email?.toLowerCase().trim(),
    data.phone,
    data.department || 'Counseling',
    data.designation || 'Education Counselor',
    data.employment_type || 'Full-Time',
    data.joining_date || new Date().toISOString().split('T')[0],
    data.monthly_salary ? Number(data.monthly_salary) : 35000,
    data.currency || 'NPR',
    data.bank_name || null,
    data.account_number || null,
    data.pan_number || null,
    data.emergency_contact || null,
    data.status || 'Active'
  );

  logAudit({
    userName: performedBy,
    action: 'CREATE_EMPLOYEE',
    entity: 'hr_employee',
    entityId: id,
    newValue: { code: employeeCode, name: data.full_name, department: data.department }
  });

  return getEmployee(id)!;
}

export function updateEmployee(id: string, data: Partial<Employee>, performedBy: string = 'Super Admin'): boolean {
  const existing = getEmployee(id);
  if (!existing) return false;

  db.prepare(`
    UPDATE hr_employees
    SET full_name = ?,
        email = ?,
        phone = ?,
        department = ?,
        designation = ?,
        employment_type = ?,
        joining_date = ?,
        monthly_salary = ?,
        currency = ?,
        bank_name = ?,
        account_number = ?,
        pan_number = ?,
        emergency_contact = ?,
        status = ?,
        counselor_id = ?,
        user_id = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.full_name !== undefined ? data.full_name : existing.full_name,
    data.email !== undefined ? data.email.toLowerCase().trim() : existing.email,
    data.phone !== undefined ? data.phone : existing.phone,
    data.department !== undefined ? data.department : existing.department,
    data.designation !== undefined ? data.designation : existing.designation,
    data.employment_type !== undefined ? data.employment_type : existing.employment_type,
    data.joining_date !== undefined ? data.joining_date : existing.joining_date,
    data.monthly_salary !== undefined ? Number(data.monthly_salary) : existing.monthly_salary,
    data.currency !== undefined ? data.currency : existing.currency,
    data.bank_name !== undefined ? data.bank_name : existing.bank_name,
    data.account_number !== undefined ? data.account_number : existing.account_number,
    data.pan_number !== undefined ? data.pan_number : existing.pan_number,
    data.emergency_contact !== undefined ? data.emergency_contact : existing.emergency_contact,
    data.status !== undefined ? data.status : existing.status,
    data.counselor_id !== undefined ? data.counselor_id : existing.counselor_id,
    data.user_id !== undefined ? data.user_id : existing.user_id,
    id
  );

  logAudit({
    userName: performedBy,
    action: 'UPDATE_EMPLOYEE',
    entity: 'hr_employee',
    entityId: id,
    oldValue: existing,
    newValue: data
  });

  return true;
}

export function deleteEmployee(id: string, performedBy: string = 'Super Admin'): boolean {
  const existing = getEmployee(id);
  if (!existing) return false;

  db.prepare("DELETE FROM hr_attendance WHERE employee_id = ?").run(id);
  db.prepare("DELETE FROM hr_leaves WHERE employee_id = ?").run(id);
  db.prepare("DELETE FROM hr_payroll WHERE employee_id = ?").run(id);
  db.prepare("DELETE FROM hr_employees WHERE id = ?").run(id);

  logAudit({
    userName: performedBy,
    action: 'DELETE_EMPLOYEE',
    entity: 'hr_employee',
    entityId: id,
    oldValue: existing
  });

  return true;
}

// ==========================================
// 2. ATTENDANCE MANAGEMENT
// ==========================================
export function getAttendance(params: { date?: string; employee_id?: string; month?: string } = {}) {
  let sql = `
    SELECT a.*, e.employee_code, e.department, e.designation
    FROM hr_attendance a
    JOIN hr_employees e ON a.employee_id = e.id
    WHERE 1=1
  `;
  const queryParams: any[] = [];

  if (params.date) {
    sql += " AND a.date = ?";
    queryParams.push(params.date);
  }
  if (params.employee_id) {
    sql += " AND a.employee_id = ?";
    queryParams.push(params.employee_id);
  }
  if (params.month) {
    sql += " AND a.date LIKE ?";
    queryParams.push(`${params.month}%`);
  }

  sql += " ORDER BY a.date DESC, e.full_name ASC";
  return db.prepare(sql).all(...queryParams) as any[];
}

export function recordAttendance(data: {
  employee_id: string;
  date: string;
  status: string;
  check_in_time?: string;
  check_out_time?: string;
  work_mode?: string;
  notes?: string;
}, performedBy: string = 'Super Admin') {
  const emp = getEmployee(data.employee_id);
  if (!emp) throw new Error('Employee not found');

  const id = 'ATT-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

  db.prepare(`
    INSERT INTO hr_attendance (id, employee_id, employee_name, date, status, check_in_time, check_out_time, work_mode, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (employee_id, date) DO UPDATE SET
      status = excluded.status,
      check_in_time = excluded.check_in_time,
      check_out_time = excluded.check_out_time,
      work_mode = excluded.work_mode,
      notes = excluded.notes
  `).run(
    id,
    data.employee_id,
    emp.full_name,
    data.date,
    data.status || 'Present',
    data.check_in_time || '09:30',
    data.check_out_time || '18:00',
    data.work_mode || 'Office',
    data.notes || null
  );

  return { success: true, employee_id: data.employee_id, date: data.date, status: data.status };
}

// ==========================================
// 3. LEAVE MANAGEMENT
// ==========================================
export function getLeaves(params: { employee_id?: string; status?: string } = {}) {
  let sql = `
    SELECT l.*, e.employee_code, e.department, e.designation
    FROM hr_leaves l
    JOIN hr_employees e ON l.employee_id = e.id
    WHERE 1=1
  `;
  const queryParams: any[] = [];

  if (params.employee_id) {
    sql += " AND l.employee_id = ?";
    queryParams.push(params.employee_id);
  }
  if (params.status) {
    sql += " AND l.status = ?";
    queryParams.push(params.status);
  }

  sql += " ORDER BY l.applied_at DESC";
  return db.prepare(sql).all(...queryParams) as any[];
}

export function applyLeave(data: {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count?: number;
  reason: string;
}, performedBy: string = 'Employee') {
  const emp = getEmployee(data.employee_id);
  if (!emp) throw new Error('Employee not found');

  const id = 'LV-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const days = data.days_count || 1;

  db.prepare(`
    INSERT INTO hr_leaves (id, employee_id, employee_name, leave_type, start_date, end_date, days_count, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
  `).run(
    id,
    data.employee_id,
    emp.full_name,
    data.leave_type || 'Casual Leave',
    data.start_date,
    data.end_date,
    days,
    data.reason
  );

  return { id, success: true, message: 'Leave application submitted successfully' };
}

export function updateLeaveStatus(id: string, status: 'Approved' | 'Rejected', remarks?: string, approvedBy: string = 'Super Admin') {
  const leave = db.prepare("SELECT * FROM hr_leaves WHERE id = ?").get(id) as any;
  if (!leave) throw new Error('Leave application not found');

  db.prepare(`
    UPDATE hr_leaves
    SET status = ?,
        approved_by = ?,
        approval_remarks = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(status, approvedBy, remarks || null, id);

  return { success: true, id, status };
}

// ==========================================
// 4. PAYROLL & SALARY SLIPS
// ==========================================
export function getPayroll(params: { month_year?: string; employee_id?: string } = {}) {
  let sql = `
    SELECT p.*, e.employee_code, e.department, e.designation, e.bank_name, e.account_number, e.pan_number
    FROM hr_payroll p
    JOIN hr_employees e ON p.employee_id = e.id
    WHERE 1=1
  `;
  const queryParams: any[] = [];

  if (params.month_year) {
    sql += " AND p.month_year = ?";
    queryParams.push(params.month_year);
  }
  if (params.employee_id) {
    sql += " AND p.employee_id = ?";
    queryParams.push(params.employee_id);
  }

  sql += " ORDER BY p.month_year DESC, p.created_at DESC";
  return db.prepare(sql).all(...queryParams) as any[];
}

export function generateMonthlyPayroll(monthYear: string, performedBy: string = 'Super Admin') {
  const employees = getEmployees().filter(e => e.status === 'Active');
  const results: any[] = [];

  for (const emp of employees) {
    const id = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const baseSalary = emp.monthly_salary || 35000;

    // Calculate admission performance incentive if linked counselor
    let admissionIncentive = 0;
    if (emp.counselor_id) {
      // Count students enrolled under this counselor in the given month
      const enrollments = db.prepare(`
        SELECT count(*) as count 
        FROM students 
        WHERE counselor_id = ? AND admission_date LIKE ?
      `).get(emp.counselor_id, `${monthYear}%`) as any;
      
      const count = enrollments?.count || 0;
      // NPR 2,500 bonus per converted student admission
      admissionIncentive = count * 2500;
    }

    const deductions = 0;
    const netSalary = baseSalary + admissionIncentive - deductions;

    db.prepare(`
      INSERT INTO hr_payroll (
        id, employee_id, employee_name, month_year, base_salary,
        incentives_bonus, deductions, net_salary, currency, payment_status, remarks
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
      ON CONFLICT (employee_id, month_year) DO UPDATE SET
        base_salary = excluded.base_salary,
        incentives_bonus = excluded.incentives_bonus,
        deductions = excluded.deductions,
        net_salary = excluded.net_salary,
        updated_at = datetime('now')
    `).run(
      id,
      emp.id,
      emp.full_name,
      monthYear,
      baseSalary,
      admissionIncentive,
      deductions,
      netSalary,
      emp.currency || 'NPR',
      admissionIncentive > 0 ? `Includes admission incentive for ${admissionIncentive / 2500} students` : 'Standard monthly salary'
    );

    results.push({
      employee_id: emp.id,
      name: emp.full_name,
      baseSalary,
      admissionIncentive,
      netSalary
    });
  }

  return { success: true, monthYear, totalEmployees: employees.length, results };
}

export function markPayrollPaid(id: string, paymentMethod: string = 'Bank Transfer', remarks?: string, performedBy: string = 'Super Admin') {
  const pay = db.prepare(`
    SELECT p.*, e.full_name 
    FROM hr_payroll p 
    JOIN hr_employees e ON p.employee_id = e.id 
    WHERE p.id = ?
  `).get(id) as any;
  if (!pay) throw new Error('Payroll record not found');

  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE hr_payroll
    SET payment_status = 'Paid',
        payment_date = ?,
        payment_method = ?,
        remarks = COALESCE(?, remarks),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(today, paymentMethod, remarks || null, id);

  // Cross-link with Finance: Automatically record salary expense in Finance Transactions!
  try {
    const txnId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    db.prepare(`
      INSERT INTO finance_transactions (
        id, transaction_id, type, category, title, amount, currency,
        transaction_date, payment_method, reference_number, status, notes, recorded_by
      )
      VALUES (?, ?, 'EXPENSE', 'Salaries & Payroll', ?, ?, ?, ?, ?, ?, 'Completed', ?, ?)
    `).run(
      txnId,
      'TXN-' + Date.now().toString().slice(-6),
      `Salary Payment: ${pay.full_name} (${pay.month_year})`,
      pay.net_salary,
      pay.currency || 'NPR',
      today,
      paymentMethod,
      'PAYROLL-' + pay.id,
      `Salary disbursed for ${pay.month_year} via ${paymentMethod}`,
      performedBy
    );
  } catch (err: any) {
    console.warn('[Finance Cross-link] Failed to auto-record salary expense:', err.message);
  }

  return { success: true, id, status: 'Paid', paymentDate: today };
}
