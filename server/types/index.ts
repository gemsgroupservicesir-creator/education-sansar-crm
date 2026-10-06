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
  password_hash: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Counselor {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  specialization_country?: string;
  assigned_cities?: string; // JSON array of cities or comma-separated
  is_active: number;
  max_capacity: number;
  current_active_leads: number;
  total_assigned_leads: number;
  total_admissions: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  lead_id: string; // e.g. ES-2026-0001
  student_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  gender?: string;
  date_of_birth?: string;
  country: string; // Nepal, India, etc.
  state?: string;
  city: string;
  address?: string;
  academic_qualification?: string;
  percentage_10th?: number;
  percentage_12th?: number;
  graduation_percentage?: number;
  entrance_exam?: string;
  entrance_score?: string;
  preferred_course: string;
  preferred_university: string;
  second_university?: string;
  budget?: string;
  scholarship_required: number; // 0 or 1
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
  counselor_id?: string;
  follow_up_date: string; // YYYY-MM-DD
  follow_up_time: string; // HH:MM
  type: FollowUpType;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
  status: FollowUpStatus;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  application_id: string; // e.g. APP-2026-001
  lead_id: string;
  student_id?: string;
  student_name: string;
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
  student_id: string; // e.g. STU-2026-001
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
  campus?: string;
  city: string;
  state: string;
  country: string;
  university_type: 'Private' | 'Deemed' | 'State' | 'Central' | 'Autonomous';
  accreditation?: string;
  ranking?: string;
  website?: string;
  contact?: string;
  is_active: number;
  is_demo: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  university_id?: string;
  university_name: string;
  course_name: string;
  degree_level: 'Undergraduate' | 'Postgraduate' | 'Diploma' | 'Doctorate';
  duration: string; // e.g. "4 Years", "2 Years"
  eligibility?: string;
  fees_range?: string; // Clearly demo/indicative
  scholarship_info?: string;
  intake?: string; // "Fall 2026", "Spring 2027"
  application_deadline?: string;
  is_active: number;
  is_demo: number;
  created_at: string;
  updated_at: string;
}

export interface Document {
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
  created_at: string;
  updated_at: string;
}

export type DocumentItem = Document;

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
  created_at: string;
  updated_at: string;
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

export interface Notification {
  id: string;
  user_id?: string; // null for broadcast
  counselor_id?: string;
  title: string;
  message: string;
  type: 'NEW_LEAD' | 'FOLLOWUP_DUE' | 'FOLLOWUP_OVERDUE' | 'APPLICATION_DEADLINE' | 'DOCUMENT_PENDING' | 'PAYMENT_PENDING' | 'ADMISSION_CONFIRMED' | 'SYSTEM';
  entity_type?: string;
  entity_id?: string;
  is_read: number;
  created_at: string;
}

export interface AuditLog {
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

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: 
    | 'Phone Call'
    | 'WhatsApp'
    | 'SMS'
    | 'Email'
    | 'Meeting'
    | 'Note'
    | 'Status Change'
    | 'Counselor Assignment'
    | 'Document Upload'
    | 'Application Update'
    | 'Payment Update';
  title: string;
  description: string;
  performed_by: string;
  metadata?: string;
  created_at: string;
}
