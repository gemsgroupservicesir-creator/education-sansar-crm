const API_BASE = '/api';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
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
  login: (credentials: { email?: string; password?: string; role?: string }) =>
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
  getCourses: (universityId?: string) =>
    fetchJson<any[]>(`/courses${universityId ? `?university_id=${universityId}` : ''}`),
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
