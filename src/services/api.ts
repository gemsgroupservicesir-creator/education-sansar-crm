const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const API_BASE = isFileProtocol 
  ? ((import.meta as any).env?.VITE_API_URL || 'https://education-sansar-crm.vercel.app/api')
  : '/api';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let userRole = '';
  let userId = '';
  try {
    const saved = localStorage.getItem('gems_user') || localStorage.getItem('sansar_user');
    if (saved) {
      const u = JSON.parse(saved);
      userRole = u.role || '';
      userId = u.id || '';
    }
  } catch (e) {}

  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(userRole ? { 'x-user-role': userRole } : {}),
      ...(userId ? { 'x-user-id': userId } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials: { email?: string; username?: string; password?: string; role?: string }) =>
    fetchJson<{ success: boolean; user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (data: { name: string; email: string; password: string; role?: string; phone?: string }) =>
    fetchJson<{ success: boolean; message: string; user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getUsers: () => fetchJson<any[]>('/auth/users'),
  createUser: (data: { name: string; email: string; password?: string; role?: string; phone?: string; designation?: string; department?: string; permissions?: string[] }) =>
    fetchJson<{ success: boolean; user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: any) =>
    fetchJson<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Leads
  getLeads: (params: Record<string, any>) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    return fetchJson<{ data: any[]; pagination: any }>(`/leads?${query.toString()}`);
  },
  getLead: (id: string) => fetchJson<any>(`/leads/${id}`),
  createLead: (data: any) =>
    fetchJson<any>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLead: (id: string, data: any) =>
    fetchJson<any>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteLead: (id: string, performedBy?: string) =>
    fetchJson<any>(`/leads/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ performedBy }),
    }),
  checkDuplicate: (data: any) =>
    fetchJson<any>('/leads/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reassignLead: (id: string, counselorId: string, performedBy?: string) =>
    fetchJson<any>(`/leads/${id}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ counselorId, performedBy }),
    }),
  addLeadActivity: (id: string, activity: any) =>
    fetchJson<any>(`/leads/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(activity),
    }),

  // Counselors
  getCounselors: () => fetchJson<any[]>('/counselors'),
  getCounselor: (id: string) => fetchJson<any>(`/counselors/${id}`),
  createCounselor: (data: any) =>
    fetchJson<any>('/counselors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCounselor: (id: string, data: any) =>
    fetchJson<any>(`/counselors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleCounselorActive: (id: string, performedBy?: string) =>
    fetchJson<any>(`/counselors/${id}/toggle-active`, {
      method: 'PUT',
      body: JSON.stringify({ performedBy }),
    }),
  deleteCounselor: (id: string, reassignToCounselorId?: string, performedBy?: string) =>
    fetchJson<any>(`/counselors/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reassignToCounselorId, performedBy }),
    }),
  resetCounselorPassword: (id: string, password: string, performedBy?: string) =>
    fetchJson<any>(`/counselors/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password, performedBy }),
    }),

  // Follow-ups
  getFollowups: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    return fetchJson<any[]>(`/followups?${query.toString()}`);
  },
  createFollowup: (data: any) =>
    fetchJson<any>('/followups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  completeFollowup: (id: string, outcomeNotes?: string, performedBy?: string) =>
    fetchJson<any>(`/followups/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ outcomeNotes, performedBy }),
    }),

  // Applications
  getApplications: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    return fetchJson<any[]>(`/applications?${query.toString()}`);
  },
  createApplication: (data: any) =>
    fetchJson<any>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateApplication: (id: string, data: any) =>
    fetchJson<any>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Students
  getStudents: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    return fetchJson<any[]>(`/students?${query.toString()}`);
  },
  getStudent: (id: string) => fetchJson<any>(`/students/${id}`),

  // Universities & Courses
  getUniversities: () => fetchJson<any[]>('/universities'),
  createUniversity: (data: any) =>
    fetchJson<any>('/universities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUniversity: (id: string, data: any) =>
    fetchJson<any>(`/universities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUniversity: (id: string) =>
    fetchJson<any>(`/universities/${id}`, {
      method: 'DELETE',
    }),
  fetchUniversityFromWebsite: (url: string) =>
    fetchJson<any>('/universities/fetch-from-website', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  importUniversityWithCourses: (data: { university: any; selectedCourses: any[] }) =>
    fetchJson<any>('/universities/import-with-courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getUniversityCoursesById: (id: string) => fetchJson<any[]>(`/universities/${id}/courses`),
  getCourses: (params?: { universityId?: string; stream?: string; courseLevel?: string; search?: string } | string) => {
    if (typeof params === 'string') {
      return fetchJson<any[]>(`/courses${params ? `?university_id=${params}` : ''}`);
    }
    const query = new URLSearchParams();
    if (params?.universityId) query.append('university_id', params.universityId);
    if (params?.stream) query.append('stream', params.stream);
    if (params?.courseLevel) query.append('course_level', params.courseLevel);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return fetchJson<any[]>(`/courses${qs ? `?${qs}` : ''}`);
  },
  createCourse: (data: any) =>
    fetchJson<any>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCourse: (id: string, data: any) =>
    fetchJson<any>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCourse: (id: string) =>
    fetchJson<any>(`/courses/${id}`, {
      method: 'DELETE',
    }),
  fetchCoursesFromWebsite: (data: { url: string; university_id?: string; university_name?: string }) =>
    fetchJson<any>('/courses/fetch-from-website', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  batchImportCourses: (data: { university_id?: string; university_name?: string; courses: any[] }) =>
    fetchJson<any>('/courses/batch-import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // University Courses & Fee Structures (Section 7)
  getUniversityCourses: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    const qs = query.toString();
    return fetchJson<any[]>(`/university-courses${qs ? `?${qs}` : ''}`);
  },
  getUniversityCourse: (id: string) => fetchJson<any>(`/university-courses/${id}`),
  compareUniversityCourses: (ids: string[]) =>
    fetchJson<any[]>(`/university-courses/compare?ids=${ids.join(',')}`),
  createUniversityCourse: (data: any) =>
    fetchJson<any>('/university-courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUniversityCourse: (id: string, data: any) =>
    fetchJson<any>(`/university-courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUniversityCourse: (id: string) =>
    fetchJson<any>(`/university-courses/${id}`, {
      method: 'DELETE',
    }),

  // Documents
  getDocuments: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    return fetchJson<any[]>(`/documents?${query.toString()}`);
  },
  uploadDocument: (data: any) =>
    fetchJson<any>('/documents/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  verifyDocument: (id: string, data: any) =>
    fetchJson<any>(`/documents/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Campaigns
  getCampaigns: () => fetchJson<any>('/campaigns'),
  createCampaign: (data: any) =>
    fetchJson<any>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Notifications
  getNotifications: (counselorId?: string) =>
    fetchJson<any[]>(`/notifications${counselorId ? `?counselorId=${counselorId}` : ''}`),
  markNotificationRead: (id: string) =>
    fetchJson<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    fetchJson<any>('/notifications/read-all', { method: 'PUT' }),

  // Integrations
  getIntegrations: () => fetchJson<any[]>('/integrations'),
  updateIntegration: (id: string, data: any) =>
    fetchJson<any>(`/integrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getIntegrationLogs: () => fetchJson<any[]>('/integrations/logs'),
  getMessageTemplates: () => fetchJson<any[]>('/integrations/templates'),
  testMetaWebhook: (sampleLead: any) =>
    fetchJson<any>('/integrations/meta/test-webhook', {
      method: 'POST',
      body: JSON.stringify(sampleLead),
    }),
  verifyMetaCredentials: (params: { pageAccessToken: string; pageId?: string }) =>
    fetchJson<any>('/integrations/meta/verify-credentials', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  sendWhatsApp: (data: any) =>
    fetchJson<any>('/integrations/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  testGoogleSheetsInbound: (row: any) =>
    fetchJson<any>('/integrations/google-sheets/test-inbound', {
      method: 'POST',
      body: JSON.stringify(row),
    }),
  testGoogleSheetsExport: (leadId?: string, performedBy?: string) =>
    fetchJson<any>('/integrations/google-sheets/test-export', {
      method: 'POST',
      body: JSON.stringify({ leadId, performedBy }),
    }),
  getGoogleSheetsScript: () =>
    fetchJson<{ script: string; webhookUrl: string; instructions: string }>(
      '/integrations/google-sheets/apps-script-code'
    ),
  getGoogleSheetsList: () =>
    fetchJson<{ sheets: any[]; summary: any }>('/integrations/google-sheets/list'),
  connectGoogleSheetLink: (
    sheetUrl: string,
    sheetName?: string,
    performedBy?: string,
    extraOptions?: { name?: string; campaignTag?: string; targetCity?: string; sourceLabel?: string }
  ) =>
    fetchJson<any>('/integrations/google-sheets/connect-link', {
      method: 'POST',
      body: JSON.stringify({ sheetUrl, sheetName, performedBy, ...extraOptions }),
    }),
  syncSingleGoogleSheet: (id: string, performedBy?: string) =>
    fetchJson<any>(`/integrations/google-sheets/${id}/sync`, {
      method: 'POST',
      body: JSON.stringify({ performedBy }),
    }),
  previewGoogleSheetById: (id: string) =>
    fetchJson<any>(`/integrations/google-sheets/${id}/preview`, {
      method: 'POST',
    }),
  updateGoogleSheetConnection: (id: string, data: any, performedBy?: string) =>
    fetchJson<any>(`/integrations/google-sheets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, performedBy }),
    }),
  deleteGoogleSheetConnection: (id: string, performedBy?: string) =>
    fetchJson<any>(`/integrations/google-sheets/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ performedBy }),
    }),
  syncAllGoogleSheets: (performedBy?: string) =>
    fetchJson<any>('/integrations/google-sheets/sync-all', {
      method: 'POST',
      body: JSON.stringify({ performedBy }),
    }),
  syncLiveGoogleSheet: (sheetUrl?: string, performedBy?: string) =>
    fetchJson<any>('/integrations/google-sheets/sync-live', {
      method: 'POST',
      body: JSON.stringify({ sheetUrl, performedBy }),
    }),
  disconnectGoogleSheet: (performedBy?: string) =>
    fetchJson<any>('/integrations/google-sheets/disconnect', {
      method: 'POST',
      body: JSON.stringify({ performedBy }),
    }),

  // Study in India Realtime Data Sync
  getStudyInIndiaSyncStatus: () => fetchJson<any>('/integrations/studyinindia/status'),
  syncStudyInIndia: (mode: 'quick' | 'full' = 'quick') =>
    fetchJson<any>('/integrations/studyinindia/sync', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),
  toggleStudyInIndiaAutoSync: (autoSyncEnabled: boolean, autoSyncIntervalMinutes?: number) =>
    fetchJson<any>('/integrations/studyinindia/toggle', {
      method: 'POST',
      body: JSON.stringify({ autoSyncEnabled, autoSyncIntervalMinutes }),
    }),

  // Settings & Audit
  getSettings: () => fetchJson<Record<string, string>>('/settings'),
  updateSettings: (data: any) =>
    fetchJson<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getAuditLogs: () => fetchJson<any[]>('/audit-logs'),

  // Search & Reports
  globalSearch: (q: string) => fetchJson<any>(`/search/global?q=${encodeURIComponent(q)}`),
  getDashboardKPIs: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    return fetchJson<any>(`/reports/dashboard-kpis?${query.toString()}`);
  },

  // CSV Import
  importLeads: (leads: any[], previewOnly: boolean = false, performedBy?: string) =>
    fetchJson<any>('/import/leads', {
      method: 'POST',
      body: JSON.stringify({ leads, previewOnly, performedBy }),
    }),

  // Lead Routing Rules & Distribution Engine
  getRoutingRules: (counselorId?: string) =>
    fetchJson<any[]>(`/lead-routing/rules${counselorId ? `?counselor_id=${encodeURIComponent(counselorId)}` : ''}`),
  getCounselorRules: (counselorId: string) => fetchJson<any[]>(`/counselors/${counselorId}/rules`),
  createCounselorRule: (counselorId: string, data: any) =>
    fetchJson<any>(`/counselors/${counselorId}/rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleCounselorRule: (ruleId: string, performedBy?: string) =>
    fetchJson<any>(`/counselors/rules/${ruleId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ performedBy }),
    }),
  deleteCounselorRule: (ruleId: string, performedBy?: string) =>
    fetchJson<any>(`/counselors/rules/${ruleId}?performedBy=${encodeURIComponent(performedBy || 'Admin')}`, {
      method: 'DELETE',
    }),
  createRoutingRule: (data: any) =>
    fetchJson<any>('/lead-routing/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRoutingRule: (id: string, data: any) =>
    fetchJson<any>(`/lead-routing/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRoutingRule: (id: string) =>
    fetchJson<any>(`/lead-routing/rules/${id}`, {
      method: 'DELETE',
    }),
  distributeUnassignedLeads: (performedBy?: string) =>
    fetchJson<any>('/lead-routing/distribute-unassigned', {
      method: 'POST',
      body: JSON.stringify({ performedBy }),
    }),
  simulateLeadRouting: (data: { preferred_course?: string; preferred_university?: string; city?: string; source?: string }) =>
    fetchJson<any>('/lead-routing/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // HR Solution
  getEmployees: () => fetchJson<any[]>('/hr/employees'),
  createEmployee: (data: any) =>
    fetchJson<any>('/hr/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEmployee: (id: string, data: any) =>
    fetchJson<any>(`/hr/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteEmployee: (id: string) =>
    fetchJson<any>(`/hr/employees/${id}`, {
      method: 'DELETE',
    }),
  getAttendance: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    return fetchJson<any[]>(`/hr/attendance?${query.toString()}`);
  },
  recordAttendance: (data: any) =>
    fetchJson<any>('/hr/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLeaves: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    return fetchJson<any[]>(`/hr/leaves?${query.toString()}`);
  },
  applyLeave: (data: any) =>
    fetchJson<any>('/hr/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLeaveStatus: (id: string, status: 'Approved' | 'Rejected', remarks?: string) =>
    fetchJson<any>(`/hr/leaves/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, remarks }),
    }),
  getPayroll: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    return fetchJson<any[]>(`/hr/payroll?${query.toString()}`);
  },
  generatePayroll: (monthYear: string) =>
    fetchJson<any>('/hr/payroll/generate', {
      method: 'POST',
      body: JSON.stringify({ monthYear }),
    }),
  payPayroll: (id: string, data: any) =>
    fetchJson<any>(`/hr/payroll/${id}/pay`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Finance Management
  getFinanceOverview: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    return fetchJson<any>(`/finance/overview?${query.toString()}`);
  },
  getFinanceTransactions: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    return fetchJson<any[]>(`/finance/transactions?${query.toString()}`);
  },
  createFinanceTransaction: (data: any) =>
    fetchJson<any>('/finance/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFinanceTransaction: (id: string, data: any) =>
    fetchJson<any>(`/finance/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFinanceTransaction: (id: string) =>
    fetchJson<any>(`/finance/transactions/${id}`, {
      method: 'DELETE',
    }),
  getFinanceInvoices: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    return fetchJson<any[]>(`/finance/invoices?${query.toString()}`);
  },
  createFinanceInvoice: (data: any) =>
    fetchJson<any>('/finance/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteFinanceInvoice: (id: string) =>
    fetchJson<any>(`/finance/invoices/${id}`, {
      method: 'DELETE',
    }),
  recordInvoicePayment: (invoiceId: string, data: { amount: number; paymentMethod?: string; referenceNumber?: string }) =>
    fetchJson<any>(`/finance/invoices/${invoiceId}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getUniversityCommissions: () =>
    fetchJson<any[]>('/finance/university-commissions'),

  // Email Templates & Bulk Outreach (Email & WhatsApp)
  getEmailTemplates: (params: { course?: string; university?: string; category?: string; channel?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.course) query.append('course', params.course);
    if (params.university) query.append('university', params.university);
    if (params.category) query.append('category', params.category);
    if (params.channel) query.append('channel', params.channel);
    const qs = query.toString();
    return fetchJson<any[]>(`/email/templates${qs ? `?${qs}` : ''}`);
  },
  createEmailTemplate: (data: any) =>
    fetchJson<any>('/email/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEmailTemplate: (id: string, data: any) =>
    fetchJson<any>(`/email/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteEmailTemplate: (id: string, performedBy?: string) =>
    fetchJson<any>(`/email/templates/${id}?performedBy=${encodeURIComponent(performedBy || 'Super Admin')}`, {
      method: 'DELETE',
    }),
  previewEmailTemplate: (data: { subject: string; content: string; sampleData?: any }) =>
    fetchJson<{ subject: string; content: string }>('/email/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTargetEmailCount: (filters: {
    channel?: 'Email' | 'WhatsApp';
    filter_course?: string;
    filter_university?: string;
    filter_status?: string;
    filter_temperature?: string;
    filter_city?: string;
    filter_counselor_id?: string;
  }) =>
    fetchJson<{ count: number; sample: any[] }>('/email/target-count', {
      method: 'POST',
      body: JSON.stringify(filters),
    }),
  sendBulkEmail: (data: any) =>
    fetchJson<any>('/email/send-bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getEmailCampaigns: () =>
    fetchJson<any[]>('/email/campaigns'),
  getEmailFilterOptions: (channel: 'Email' | 'WhatsApp' = 'Email') =>
    fetchJson<{
      courses: { name: string; count: number }[];
      universities: { name: string; count: number }[];
      statuses: { name: string; count: number }[];
      temperatures: { name: string; count: number }[];
      totalLeadsWithEmail: number;
      totalLeadsWithWhatsApp?: number;
      totalTargetLeads?: number;
    }>(`/email/filter-options?channel=${channel}`),

  // AI Sales Copilot & Auto-Outreach
  getAISettings: () => fetchJson<any>('/ai/settings'),
  updateAISettings: (data: any) =>
    fetchJson<any>('/ai/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  testGeminiConnection: (apiKey?: string) =>
    fetchJson<any>('/ai/test-connection', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    }),
  triggerAIOutreach: (leadId: string) =>
    fetchJson<any>('/ai/outreach/auto-send', {
      method: 'POST',
      body: JSON.stringify({ leadId }),
    }),
  generateAIPitch: (data: {
    leadId: string;
    channel?: string;
    objection?: string;
    tone?: string;
    customNotes?: string;
  }) =>
    fetchJson<any>('/ai/pitch/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAILeadScore: (leadId: string) =>
    fetchJson<any>(`/ai/lead-score/${leadId}`),
  chatAISalesAssistant: (message: string, leadContext?: any) =>
    fetchJson<any>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, leadContext }),
    }),
  getAIDashboard: () => fetchJson<any>('/ai/dashboard'),
};

