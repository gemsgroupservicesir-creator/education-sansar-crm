const API_BASE = '/api';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let userRole = '';
  let userId = '';
  try {
    const saved = localStorage.getItem('sansar_user');
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
  getUsers: () => fetchJson<any[]>('/auth/users'),

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
};
