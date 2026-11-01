import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Building2,
  Mail,
  Phone,
  Briefcase,
  AlertCircle,
  TrendingUp,
  Download,
  CalendarCheck,
  Send,
  Printer,
  X,
  CreditCard,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { Employee, AttendanceRecord, LeaveRequest, PayrollRecord } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const HRPage: React.FC = () => {
  const { addToast } = useNotifications();
  const { isSuperAdmin, hasPermission } = useAuth();
  const canManageHR = isSuperAdmin || hasPermission('hr_management');

  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'leaves' | 'payroll'>('employees');
  const [loading, setLoading] = useState(false);

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('ALL');
  const [payrollMonth, setPayrollMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modals
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [applyLeaveOpen, setApplyLeaveOpen] = useState(false);
  const [selectedPaySlip, setSelectedPaySlip] = useState<PayrollRecord | null>(null);

  // Add Employee Form
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empDept, setEmpDept] = useState('Counseling');
  const [empDesignation, setEmpDesignation] = useState('Education Counselor');
  const [empType, setEmpType] = useState('Full-Time');
  const [empSalary, setEmpSalary] = useState('35000');
  const [empJoiningDate, setEmpJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [empBank, setEmpBank] = useState('Nabil Bank');
  const [empAccount, setEmpAccount] = useState('');
  const [empPan, setEmpPan] = useState('');

  // Apply Leave Form
  const [leaveEmpId, setLeaveEmpId] = useState('');
  const [leaveType, setLeaveType] = useState<'Casual Leave' | 'Sick Leave' | 'Paid Leave' | 'Unpaid Leave'>('Casual Leave');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');

  // Load Data
  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (e: any) {
      console.warn('Load employees error:', e);
    }
  };

  const loadAttendance = async (date: string) => {
    try {
      const data = await api.getAttendance({ date });
      setAttendance(data);
    } catch (e: any) {
      console.warn('Load attendance error:', e);
    }
  };

  const loadLeaves = async () => {
    try {
      const data = await api.getLeaves(leaveStatusFilter !== 'ALL' ? { status: leaveStatusFilter } : {});
      setLeaves(data);
    } catch (e: any) {
      console.warn('Load leaves error:', e);
    }
  };

  const loadPayroll = async (monthYear: string) => {
    try {
      const data = await api.getPayroll({ month_year: monthYear });
      setPayroll(data);
    } catch (e: any) {
      console.warn('Load payroll error:', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadEmployees(),
      loadAttendance(attendanceDate),
      loadLeaves(),
      loadPayroll(payrollMonth)
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') loadAttendance(attendanceDate);
    if (activeTab === 'leaves') loadLeaves();
    if (activeTab === 'payroll') loadPayroll(payrollMonth);
  }, [activeTab, attendanceDate, leaveStatusFilter, payrollMonth]);

  // Handlers
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empEmail || !empPhone) {
      addToast('Name, Email and Phone are required', 'warning');
      return;
    }
    try {
      await api.createEmployee({
        full_name: empName,
        email: empEmail,
        phone: empPhone,
        department: empDept,
        designation: empDesignation,
        employment_type: empType,
        monthly_salary: Number(empSalary) || 35000,
        joining_date: empJoiningDate,
        bank_name: empBank,
        account_number: empAccount,
        pan_number: empPan
      });
      addToast(`Employee "${empName}" added to HR directory!`, 'success');
      setAddEmployeeOpen(false);
      loadEmployees();
    } catch (err: any) {
      addToast(err.message || 'Failed to add employee', 'error');
    }
  };

  const handleMarkAttendance = async (empId: string, status: string) => {
    try {
      await api.recordAttendance({
        employee_id: empId,
        date: attendanceDate,
        status,
        check_in_time: status === 'Present' || status === 'Half Day' ? '09:30' : undefined
      });
      addToast(`Attendance marked as ${status}`, 'success');
      loadAttendance(attendanceDate);
    } catch (err: any) {
      addToast(err.message || 'Failed to mark attendance', 'error');
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveEmpId || !leaveReason) {
      addToast('Please select employee and provide a reason', 'warning');
      return;
    }
    try {
      // Calculate days
      const d1 = new Date(leaveStartDate);
      const d2 = new Date(leaveEndDate);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

      await api.applyLeave({
        employee_id: leaveEmpId,
        leave_type: leaveType,
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        days_count: daysCount,
        reason: leaveReason
      });
      addToast('Leave request submitted!', 'success');
      setApplyLeaveOpen(false);
      loadLeaves();
    } catch (err: any) {
      addToast(err.message || 'Failed to submit leave', 'error');
    }
  };

  const handleUpdateLeaveStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await api.updateLeaveStatus(id, status);
      addToast(`Leave application marked as ${status}`, status === 'Approved' ? 'success' : 'info');
      loadLeaves();
    } catch (err: any) {
      addToast(err.message || 'Failed to update leave', 'error');
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      const res = await api.generatePayroll(payrollMonth);
      addToast(`Monthly Payroll generated for ${res.totalEmployees} active employees!`, 'success');
      loadPayroll(payrollMonth);
    } catch (err: any) {
      addToast(err.message || 'Failed to generate payroll', 'error');
    }
  };

  const handlePaySalary = async (id: string, employeeName: string) => {
    if (!confirm(`Mark salary paid for ${employeeName}? This will automatically record an expense in the Finance Ledger.`)) return;
    try {
      await api.payPayroll(id, { paymentMethod: 'Bank Transfer' });
      addToast(`Salary marked as Paid for ${employeeName}! Cross-recorded into Finance.`, 'success');
      loadPayroll(payrollMonth);
    } catch (err: any) {
      addToast(err.message || 'Failed to record payment', 'error');
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete employee "${name}"? This action cannot be undone and will delete all associated attendance, leave, and payroll records permanently from SQLite and Neon Cloud Database.`)) {
      return;
    }
    try {
      await api.deleteEmployee(id);
      addToast(`Employee "${name}" deleted permanently across local and Neon database`, 'success');
      loadEmployees();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete employee', 'error');
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.employee_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.designation?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Quick stats
  const totalEmployees = employees.length;
  const activeStaff = employees.filter(e => e.status === 'Active').length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;
  const totalPayrollAmount = payroll.reduce((acc, p) => acc + (p.net_salary || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">HR Solution & Staff Management</h1>
              <p className="text-xs text-slate-500">Employee directory, daily attendance register, leave requests & monthly payroll</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {canManageHR && (
            <>
              <button
                onClick={() => setApplyLeaveOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                <CalendarCheck className="w-4 h-4 text-slate-600" />
                Apply Leave
              </button>
              <button
                onClick={() => setAddEmployeeOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Staff</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Users className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalEmployees}</div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">{activeStaff} currently active</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Today's Attendance</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><UserCheck className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {attendance.filter(a => a.status === 'Present').length} / {totalEmployees}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Date: {attendanceDate}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Leaves</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{pendingLeavesCount}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Awaiting supervisor approval</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Monthly Payroll</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><DollarSign className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            NPR {totalPayrollAmount > 0 ? totalPayrollAmount.toLocaleString() : (activeStaff * 35000).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Month: {payrollMonth}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'employees'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Employee Directory ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'attendance'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Daily Attendance
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'leaves'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Leave Requests
          {pendingLeavesCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-white font-bold">
              {pendingLeavesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'payroll'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Payroll &amp; Salary Slips
        </button>
      </div>

      {/* TAB 1: EMPLOYEE DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Departments</option>
                <option value="Counseling">Counseling</option>
                <option value="Marketing">Marketing</option>
                <option value="Admissions">Admissions</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="Administration">Administration</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Department &amp; Role</th>
                    <th className="py-3 px-4">Joining Date</th>
                    <th className="py-3 px-4">Salary (Monthly)</th>
                    <th className="py-3 px-4">Status</th>
                    {canManageHR && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={canManageHR ? 7 : 6} className="text-center py-8 text-slate-400">
                        No employees found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {emp.full_name?.charAt(0) || 'E'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{emp.full_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{emp.employee_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {emp.email}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {emp.phone}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-medium text-slate-800">{emp.designation}</span>
                            <div className="text-[11px] text-indigo-600 font-medium">{emp.department}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {emp.joining_date || '2026-01-01'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {emp.currency || 'NPR'} {Number(emp.monthly_salary || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              emp.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {emp.status}
                          </span>
                        </td>
                        {canManageHR && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Employee Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">Select Date:</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing attendance logs for <span className="font-semibold text-slate-700">{attendanceDate}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Today's Status</th>
                    <th className="py-3 px-4">Check-in Time</th>
                    <th className="py-3 px-4">Work Mode</th>
                    <th className="py-3 px-4 text-right">Quick Mark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => {
                    const record = attendance.find((a) => a.employee_id === emp.id);
                    const currentStatus = record?.status || 'Not Marked';

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{emp.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{emp.employee_code}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{emp.department}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              currentStatus === 'Present'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : currentStatus === 'Absent'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : currentStatus === 'Half Day'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {currentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {record?.check_in_time || '--:--'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {record?.work_mode || 'Office'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleMarkAttendance(emp.id, 'Present')}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold transition-colors"
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(emp.id, 'Half Day')}
                              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-semibold transition-colors"
                            >
                              Half Day
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(emp.id, 'Absent')}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold transition-colors"
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE REQUESTS */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
              <select
                value={leaveStatusFilter}
                onChange={(e) => setLeaveStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Requests</option>
                <option value="Pending">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <button
              onClick={() => setApplyLeaveOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Submit Leave Application
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration &amp; Dates</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No leave applications found.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{l.employee_name}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">{l.leave_type}</td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-[11px] text-slate-700">
                            {l.start_date} → {l.end_date}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold">{l.days_count} Day(s)</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{l.reason}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              l.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : l.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {l.status === 'Pending' && canManageHR ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateLeaveStatus(l.id, 'Approved')}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateLeaveStatus(l.id, 'Rejected')}
                                className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-semibold transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Processed</span>
                          )}
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

      {/* TAB 4: PAYROLL & SALARY SLIPS */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">Payroll Month:</span>
              <input
                type="month"
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            {canManageHR && (
              <button
                onClick={handleGeneratePayroll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                Generate Month Payroll (Auto-Calculates Incentives)
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Base Salary</th>
                    <th className="py-3 px-4">Admission Incentive Bonus</th>
                    <th className="py-3 px-4">Net Payable</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payroll.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No payroll records found for {payrollMonth}. Click "Generate Month Payroll" to compute.
                      </td>
                    </tr>
                  ) : (
                    payroll.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{p.employee_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.employee_code}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{p.month_year}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {p.currency} {Number(p.base_salary || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-600">
                          +{p.currency} {Number(p.incentives_bonus || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {p.currency} {Number(p.net_salary || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.payment_status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {p.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedPaySlip(p)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors"
                            >
                              Slip
                            </button>
                            {p.payment_status !== 'Paid' && canManageHR && (
                              <button
                                onClick={() => handlePaySalary(p.id, p.employee_name)}
                                className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold transition-colors"
                              >
                                Mark Paid
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

      {/* MODAL: ADD EMPLOYEE */}
      {addEmployeeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add Staff Member</h2>
              <button onClick={() => setAddEmployeeOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g. Ramesh Shrestha"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="ramesh@gemsgroupservices.com"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="+977 9801234567"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Counseling">Counseling</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Admissions">Admissions</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={empDesignation}
                    onChange={(e) => setEmpDesignation(e.target.value)}
                    placeholder="e.g. Senior Counselor"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Salary (NPR)</label>
                  <input
                    type="number"
                    value={empSalary}
                    onChange={(e) => setEmpSalary(e.target.value)}
                    placeholder="35000"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={empJoiningDate}
                    onChange={(e) => setEmpJoiningDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddEmployeeOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPLY LEAVE */}
      {applyLeaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Apply for Leave</h2>
              <button onClick={() => setApplyLeaveOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleApplyLeave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee *</label>
                <select
                  required
                  value={leaveEmpId}
                  onChange={(e) => setLeaveEmpId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} ({e.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Paid Leave">Paid Annual Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Brief reason for your leave request..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApplyLeaveOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SALARY SLIP VIEW */}
      {selectedPaySlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  GGS
                </div>
                <h3 className="text-sm font-bold text-slate-900">Gems Group Services</h3>
              </div>
              <button onClick={() => setSelectedPaySlip(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-3 border-b border-dashed border-slate-200">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500">Official Salary Slip</h4>
              <p className="text-sm font-extrabold text-slate-800 mt-0.5">Month: {selectedPaySlip.month_year}</p>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee Name:</span>
                <span className="font-semibold text-slate-900">{selectedPaySlip.employee_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Designation:</span>
                <span className="text-slate-700">{selectedPaySlip.designation || 'Counselor'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-700">{selectedPaySlip.department || 'Counseling'}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Basic Monthly Salary:</span>
                  <span className="font-mono text-slate-800">
                    {selectedPaySlip.currency} {Number(selectedPaySlip.base_salary).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Admission Performance Bonus:</span>
                  <span className="font-mono">
                    +{selectedPaySlip.currency} {Number(selectedPaySlip.incentives_bonus).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Deductions:</span>
                  <span className="font-mono">
                    -{selectedPaySlip.currency} {Number(selectedPaySlip.deductions || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Net Payable:</span>
                <span className="text-base text-indigo-600">
                  {selectedPaySlip.currency} {Number(selectedPaySlip.net_salary).toLocaleString()}
                </span>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 text-center">
                Payment Status: <span className="font-bold text-slate-700">{selectedPaySlip.payment_status}</span>
                {selectedPaySlip.payment_date && ` (Paid on ${selectedPaySlip.payment_date})`}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Slip
              </button>
              <button
                onClick={() => setSelectedPaySlip(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
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
export default HRPage;
