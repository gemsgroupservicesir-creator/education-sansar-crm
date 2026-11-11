export type UserRole = 
  | 'Super Admin'
  | 'Admin'
  | 'Counselor'
  | 'Telecaller'
  | 'Marketing Manager'
  | 'Management';

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD';

export type LeadStatus = 
  | 'New Lead'
  | 'Contacted'
  | 'Not Reachable'
  | 'Counseling Scheduled'
  | 'Counseling Done'
  | 'Interested'
  | 'Application Started'
  | 'Documents Pending'
  | 'Application Submitted'
  | 'Offer Received'
  | 'Fee Pending'
  | 'Fee Paid'
  | 'Admission Confirmed'
  | 'Enrolled'
  | 'Lost'
  | 'Not Interested'
  | 'Duplicate';

export type LeadSource = 
  | 'Meta Ads'
  | 'Facebook'
  | 'Instagram'
  | 'Website'
  | 'Google'
  | 'WhatsApp'
  | 'Referral'
  | 'Walk-in'
  | 'Phone'
  | 'Consultant'
  | 'Event'
  | 'Organic'
  | 'Other';

export type FollowUpType = 
  | 'Call'
  | 'WhatsApp'
  | 'Meeting'
  | 'Email'
  | 'Document Follow-up'
  | 'Application Follow-up'
  | 'Fee Follow-up';

export type FollowUpStatus = 'Pending' | 'Completed' | 'Missed' | 'Rescheduled' | 'Cancelled';

export type ApplicationStatus = 
  | 'Not Started'
  | 'Application Started'
  | 'Documents Pending'
  | 'Submitted'
  | 'Under Review'
  | 'Offer Received'
  | 'Rejected'
  | 'Fee Pending'
  | 'Fee Paid'
  | 'Admission Confirmed';

export type DocumentType = 
  | 'Passport'
  | 'Citizenship'
  | 'Aadhaar'
  | '10th Marksheet'
  | '12th Marksheet'
  | 'Graduation Marksheet'
  | 'Entrance Exam Score'
  | 'Photo'
  | 'Signature'
  | 'Application Form'
  | 'Offer Letter'
  | 'Fee Receipt'
  | 'Other';

export type DocumentStatus = 'Pending' | 'Uploaded' | 'Verified' | 'Rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: number;
  permissions?: string[];
}

export interface Counselor {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  username?: string;
  role?: string;
  joining_date?: string;
  status?: string;
  specialization_country?: string;
  assigned_cities?: string;
  is_active: number;
  max_capacity: number;
  current_active_leads: number;
  total_assigned_leads: number;
  total_admissions: number;
  conversion_rate: number;
  permissions?: string[];
  specialization_courses?: string[] | string;
  specialization_universities?: string[] | string;
  daily_lead_quota?: number;
  leads_assigned_today?: number;
  designation?: string;
  department?: string;
  employee_code?: string;
  alternate_phone?: string;
  work_location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  lead_id: string;
  student_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  parent_name?: string; // Father's / Mother's Name
  gender?: string;
  date_of_birth?: string;
  country: string;
  state?: string;
  city: string;
  address?: string;
  academic_qualification?: string;
  school_college?: string;
  passing_year?: string;
  percentage_10th?: number;
  percentage_12th?: number;
  graduation_percentage?: number;
  entrance_exam?: string;
  entrance_score?: string;
  preferred_course: string;
  preferred_university: string;
  second_university?: string;
  budget?: string;
  scholarship_required: number;
  lead_source: LeadSource;
  campaign?: string;
  ad_set?: string;
  ad?: string;
  facebook_lead_id?: string;
  lead_created_date: string;
  assigned_counselor_id?: string;
  assigned_counselor_name?: string;
  lead_status: LeadStatus;
  lead_temperature: LeadTemperature;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  last_contact_date?: string;
  next_follow_up_date?: string;
  remarks?: string;
  created_by?: string;
  updated_by?: string;
  is_converted_to_student: number;
  is_deleted: number;
  is_demo: number;
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  lead_name?: string;
  lead_phone?: string;
  preferred_course?: string;
  counselor_id?: string;
  counselor_name?: string;
  follow_up_date: string;
  follow_up_time: string;
  type: FollowUpType;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
  status: FollowUpStatus;
  completed_at?: string;
  created_at: string;
}

export interface Application {
  id: string;
  application_id: string;
  lead_id: string;
  student_id?: string;
  student_name: string;
  student_phone?: string;
  university_id?: string;
  university_name: string;
  course_id?: string;
  course_name: string;
  application_date: string;
  application_status: ApplicationStatus;
  application_fee: number;
  payment_status: 'Unpaid' | 'Paid' | 'Waived';
  application_number?: string;
  deadline?: string;
  counselor_id?: string;
  counselor_name?: string;
  remarks?: string;
  is_demo: number;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  lead_id: string;
  student_name: string;
  phone: string;
  whatsapp_number?: string;
  email: string;
  gender?: string;
  date_of_birth?: string;
  university: string;
  course: string;
  admission_date: string;
  application_id?: string;
  fee_paid: number;
  counselor_id?: string;
  counselor_name?: string;
  source: string;
  city: string;
  country: string;
  academic_details?: string;
  is_demo: number;
  created_at: string;
  updated_at: string;
}

export interface University {
  id: string;
  name: string;
  short_name?: string;
  campus?: string;
  city: string;
  state: string;
  country: string;
  university_type: string;
  accreditation?: string;
  ranking?: string;
  website?: string;
  contact?: string;
  description?: string;
  status?: string;
  is_active: number;
  is_demo?: number;
  courses_count?: number;
  applications_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: string;
  university_id?: string;
  university_name?: string;
  course_name: string;
  short_name?: string;
  course_level?: string; // 'UG' | 'PG' | 'Diploma' | 'PhD' | 'Other'
  degree_level?: string;
  stream?: string; // 'Engineering' | 'Management' | 'Commerce' | 'Computer Science' | 'Medical' | 'Law' | 'Arts' | 'Science' | 'Other'
  duration: string;
  eligibility?: string;
  entrance_requirement?: string;
  fees_range?: string;
  scholarship_info?: string;
  description?: string;
  status?: string;
  intake?: string;
  application_deadline?: string;
  is_active: number;
  is_demo?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UniversityCourse {
  id: string;
  university_id: string;
  course_id: string;
  tuition_fee: number;
  hostel_fee: number;
  other_fees: number;
  total_fee: number;
  duration: string;
  eligibility?: string;
  scholarship_available: number;
  scholarship_details?: string;
  application_fee: number;
  admission_deadline?: string;
  notes?: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
  // Joined fields
  university_name?: string;
  university_short_name?: string;
  university_city?: string;
  university_state?: string;
  university_country?: string;
  university_type?: string;
  university_ranking?: string;
  university_accreditation?: string;
  university_website?: string;
  course_name?: string;
  course_short_name?: string;
  course_level?: string;
  degree_level?: string;
  stream?: string;
}

export interface DocumentItem {
  id: string;
  lead_id: string;
  student_id?: string;
  application_id?: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  document_type: DocumentType;
  verification_status: DocumentStatus;
  verification_notes?: string;
  uploaded_by: string;
  upload_date: string;
  verified_by?: string;
  verified_at?: string;
  is_demo: number;
}

export interface Campaign {
  id: string;
  name: string;
  platform: 'Meta' | 'Google' | 'Instagram' | 'Website' | 'Offline' | 'Referral' | 'Other';
  university_focus?: string;
  course_focus?: string;
  target_city?: string;
  start_date: string;
  end_date?: string;
  budget: number;
  spend: number;
  leads_count: number;
  applications_count: number;
  admissions_count: number;
  cost_per_lead: number;
  cost_per_application: number;
  cost_per_admission: number;
  is_active: number;
  is_demo: number;
}

export interface GoogleSheetConnection {
  id: string;
  name: string;
  sheet_url: string;
  spreadsheet_id: string;
  gid: string;
  sheet_name?: string;
  campaign_tag?: string;
  target_city?: string;
  source_label?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  total_leads_imported: number;
  last_rows_count: number;
  last_synced_at?: string;
  last_sync_status?: 'SUCCESS' | 'WARN' | 'ERROR';
  last_sync_error?: string;
  is_demo: number;
  created_at: string;
  updated_at: string;
}

export interface MultiSheetSyncReport {
  success: boolean;
  totalSheets: number;
  totalRows: number;
  totalImported: number;
  totalDuplicates: number;
  totalErrors: number;
  sheetReports: Array<{
    id: string;
    name: string;
    status: 'SUCCESS' | 'WARN' | 'ERROR';
    totalRows: number;
    importedCount: number;
    duplicateCount: number;
    errorCount: number;
    errorMessage?: string;
    syncedAt?: string;
  }>;
  syncedAt: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  counselor_id?: string;
  title: string;
  message: string;
  type: 'NEW_LEAD' | 'FOLLOWUP_DUE' | 'FOLLOWUP_OVERDUE' | 'APPLICATION_DEADLINE' | 'DOCUMENT_PENDING' | 'PAYMENT_PENDING' | 'ADMISSION_CONFIRMED' | 'SYSTEM';
  entity_type?: string;
  entity_id?: string;
  is_read: number;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id?: string;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  created_at: string;
}

export interface LeadActivityItem {
  id: string;
  lead_id: string;
  activity_type: string;
  title: string;
  description: string;
  performed_by: string;
  created_at: string;
}

export interface DashboardKPIData {
  totalLeads: number;
  newLeadsToday: number;
  newLeadsThisWeek: number;
  newLeadsThisMonth: number;
  followupsToday: number;
  overdueFollowups: number;
  applicationsCount: number;
  admissionsCount: number;
  feePaidTotal: number;
  conversionRate: number;
  leadToContactRate: number;
  contactToCounselingRate: number;
  counselingToAppRate: number;
  appToAdmissionRate: number;
  funnelStages: { stage: string; count: number; value: number }[];
  leadsByDay: { date: string; leads: number }[];
  leadsBySource: { source: string; count: number }[];
  leadsByCity: { city: string; count: number }[];
  leadsByUniversity: { university: string; count: number }[];
  leadsByCourse: { course: string; count: number }[];
  counselorPerformance: {
    counselor_name: string;
    assigned: number;
    contacted: number;
    counseled: number;
    applications: number;
    admissions: number;
    conversion_rate: number;
  }[];
}

// ==========================================
// FEATURE PERMISSIONS CATALOG
// ==========================================
export interface FeaturePermission {
  id: string;
  name: string;
  category: 'Core' | 'Leads' | 'Admissions' | 'Academics' | 'Marketing' | 'Team & Operations' | 'Admin';
  description: string;
}

export const FEATURE_PERMISSIONS: FeaturePermission[] = [
  { id: 'dashboard', name: 'Dashboard Analytics', category: 'Core', description: 'View KPIs, conversion rates, and performance charts' },
  { id: 'leads_view', name: 'View Leads', category: 'Leads', description: 'Access leads directory and student contact cards' },
  { id: 'leads_create', name: 'Add & Import Leads', category: 'Leads', description: 'Create leads manually, upload CSV, or sync Google Sheets' },
  { id: 'leads_edit', name: 'Edit & Follow-up', category: 'Leads', description: 'Update status, schedule follow-ups, and log calls' },
  { id: 'leads_delete', name: 'Delete Leads', category: 'Leads', description: 'Remove or archive student inquiries' },
  { id: 'lead_distribution', name: 'Lead Distribution Engine', category: 'Leads', description: 'Configure course/university routing rules and batch distribute' },
  { id: 'pipeline', name: 'Admission Pipeline', category: 'Admissions', description: 'Manage Kanban stages from inquiry to enrolled' },
  { id: 'applications', name: 'Applications Management', category: 'Admissions', description: 'Submit and track university admissions' },
  { id: 'students', name: 'Enrolled Students', category: 'Admissions', description: 'Manage converted students and tuition fee records' },
  { id: 'universities', name: 'Universities & Courses', category: 'Academics', description: 'Browse partner universities, courses, and fee structures' },
  { id: 'counselors_manage', name: 'Counselors & Staff Logins', category: 'Team & Operations', description: 'Add/edit staff accounts, roles, and feature permissions' },
  { id: 'staff_info_view', name: 'Staff Information & Directory', category: 'Team & Operations', description: 'Access complete staff directory, designations, and academic focus' },
  { id: 'hr_management', name: 'HR & Staff Directory', category: 'Team & Operations', description: 'Employee records, daily attendance, leaves, and payroll' },
  { id: 'finance_management', name: 'Finance & Accounts', category: 'Team & Operations', description: 'Student fee invoicing, university commissions, and expenses' },
  { id: 'bulk_email', name: 'Bulk Email & Outreach', category: 'Marketing', description: 'Filter leads by course/university and send bulk personalized emails' },
  { id: 'email_templates', name: 'Course & University Templates', category: 'Marketing', description: 'Create and manage rich course & university targeted email templates' },
  { id: 'campaigns', name: 'Marketing Campaigns', category: 'Marketing', description: 'Track Meta ads, Google ads, and lead acquisition costs' },
  { id: 'reports', name: 'Reports & Export', category: 'Marketing', description: 'Export Excel reports, counselor KPIs, and ROI metrics' },
  { id: 'documents', name: 'Document Vault', category: 'Operations' as any, description: 'Upload, inspect, and verify student marksheets and passports' },
  { id: 'integrations', name: 'Integrations', category: 'Admin', description: 'Google Sheets live sync, Meta Ads webhook, WhatsApp API' },
  { id: 'settings', name: 'System Settings', category: 'Admin', description: 'Configure global CRM settings and view audit trails' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': FEATURE_PERMISSIONS.map(p => p.id),
  'Admin': [
    'dashboard', 'leads_view', 'leads_create', 'leads_edit', 'leads_delete', 'lead_distribution',
    'pipeline', 'applications', 'students', 'universities', 'counselors_manage', 'staff_info_view',
    'hr_management', 'finance_management', 'bulk_email', 'email_templates', 'campaigns', 'reports', 'documents',
    'integrations', 'settings'
  ],
  'Counselor': [
    'dashboard', 'leads_view', 'leads_create', 'leads_edit', 'pipeline',
    'applications', 'students', 'universities', 'staff_info_view', 'documents'
  ],
  'Telecaller': [
    'dashboard', 'leads_view', 'leads_create', 'leads_edit', 'staff_info_view', 'documents'
  ],
  'Marketing Manager': [
    'dashboard', 'leads_view', 'leads_create', 'bulk_email', 'email_templates', 'campaigns', 'reports', 'integrations', 'staff_info_view'
  ],
  'Management': [
    'dashboard', 'leads_view', 'pipeline', 'applications', 'students',
    'universities', 'reports', 'finance_management', 'hr_management', 'bulk_email', 'staff_info_view'
  ],
  'Accountant': [
    'dashboard', 'students', 'finance_management', 'hr_management', 'reports', 'staff_info_view'
  ],
  'HR Manager': [
    'dashboard', 'counselors_manage', 'hr_management', 'staff_info_view'
  ],
};

// ==========================================
// EMAIL TEMPLATES & BULK CAMPAIGN TYPES
// ==========================================
export interface EmailTemplate {
  id: string;
  name: string;
  channel: 'Email' | 'WhatsApp' | 'SMS';
  category: string;
  subject?: string;
  content: string;
  variables: string[] | string;
  target_courses?: string[] | string;
  target_universities?: string[] | string;
  description?: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export interface BulkEmailCampaign {
  id: string;
  name: string;
  template_id?: string;
  subject: string;
  content: string;
  filter_course?: string;
  filter_university?: string;
  filter_status?: string;
  filter_temperature?: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: 'QUEUED' | 'SENDING' | 'COMPLETED' | 'FAILED';
  channel?: 'Email' | 'WhatsApp';
  sent_by: string;
  created_at: string;
}

// ==========================================
// LEAD DISTRIBUTION ENGINE TYPES
// ==========================================
export interface LeadRoutingRule {
  id: string;
  name: string;
  course_keywords: string[];
  university_keywords: string[];
  target_cities: string[];
  lead_sources?: string[];
  counselor_id: string;
  counselor_name: string;
  priority: number;
  max_daily_leads: number;
  is_active: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// HR SOLUTION TYPES
// ==========================================
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
  linked_counselor_name?: string;
  linked_user_role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code?: string;
  department?: string;
  designation?: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'On Leave' | 'Holiday';
  check_in_time?: string;
  check_out_time?: string;
  work_mode: 'Office' | 'Remote' | 'Field Work';
  notes?: string;
  created_at?: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code?: string;
  department?: string;
  leave_type: 'Casual Leave' | 'Sick Leave' | 'Paid Leave' | 'Unpaid Leave';
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by?: string;
  approval_remarks?: string;
  applied_at: string;
  updated_at?: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code?: string;
  department?: string;
  designation?: string;
  bank_name?: string;
  account_number?: string;
  month_year: string;
  base_salary: number;
  incentives_bonus: number;
  deductions: number;
  net_salary: number;
  currency: string;
  payment_status: 'Pending' | 'Paid';
  payment_date?: string;
  payment_method?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// FINANCE MANAGEMENT TYPES
// ==========================================
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

export interface FinanceInvoiceItem {
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
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
  status: 'Draft' | 'Sent' | 'Partial' | 'Paid' | 'Overdue' | 'Cancelled';
  items: FinanceInvoiceItem[];
  notes?: string | null;
  student_id?: string | null;
  university_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FinanceOverviewData {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
  totalStudentFeeDue: number;
  totalUniCommissionDue: number;
  incomeBreakdown: { category: string; amount: number; count: number }[];
  expenseBreakdown: { category: string; amount: number; count: number }[];
  currency: string;
}

export interface UniversityCommissionSummary {
  university_id: string;
  university_name: string;
  total_enrolled_students: number;
  estimated_commission: number;
  invoiced_amount: number;
  received_amount: number;
  pending_amount: number;
  settlement_status: 'SETTLED' | 'PARTIAL' | 'PENDING';
}

