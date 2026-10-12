import { db } from '../db/database.ts';

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  counselorId?: string;
  city?: string;
  university?: string;
  course?: string;
  campaign?: string;
  source?: string;
}

export function getDashboardKPIs(filters: FilterParams = {}) {
  const whereClauses: string[] = ['is_deleted = 0'];
  const params: any[] = [];

  if (filters.startDate) {
    whereClauses.push('date(created_at) >= date(?)');
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    whereClauses.push('date(created_at) <= date(?)');
    params.push(filters.endDate);
  }
  if (filters.counselorId) {
    whereClauses.push('assigned_counselor_id = ?');
    params.push(filters.counselorId);
  }
  if (filters.city) {
    whereClauses.push('city = ?');
    params.push(filters.city);
  }
  if (filters.university) {
    whereClauses.push('preferred_university = ?');
    params.push(filters.university);
  }
  if (filters.course) {
    whereClauses.push('preferred_course = ?');
    params.push(filters.course);
  }
  if (filters.source) {
    whereClauses.push('lead_source = ?');
    params.push(filters.source);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Total Leads
  const totalLeads = (db.prepare(`SELECT count(*) as count FROM leads ${whereSql}`).get(...params) as { count: number }).count;

  // New Leads Today
  const newLeadsToday = (db.prepare(`
    SELECT count(*) as count FROM leads 
    WHERE is_deleted = 0 AND date(created_at) = date('now')
    ${filters.counselorId ? 'AND assigned_counselor_id = ?' : ''}
  `).get(...(filters.counselorId ? [filters.counselorId] : [])) as { count: number }).count;

  // New Leads This Week
  const newLeadsThisWeek = (db.prepare(`
    SELECT count(*) as count FROM leads 
    WHERE is_deleted = 0 AND date(created_at) >= date('now', '-7 days')
    ${filters.counselorId ? 'AND assigned_counselor_id = ?' : ''}
  `).get(...(filters.counselorId ? [filters.counselorId] : [])) as { count: number }).count;

  // New Leads This Month
  const newLeadsThisMonth = (db.prepare(`
    SELECT count(*) as count FROM leads 
    WHERE is_deleted = 0 AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    ${filters.counselorId ? 'AND assigned_counselor_id = ?' : ''}
  `).get(...(filters.counselorId ? [filters.counselorId] : [])) as { count: number }).count;

  // Follow-ups today
  const followupsToday = (db.prepare(`
    SELECT count(*) as count FROM followups 
    WHERE date(follow_up_date) = date('now') AND status = 'Pending'
    ${filters.counselorId ? 'AND counselor_id = ?' : ''}
  `).get(...(filters.counselorId ? [filters.counselorId] : [])) as { count: number }).count;

  // Overdue follow-ups
  const overdueFollowups = (db.prepare(`
    SELECT count(*) as count FROM followups 
    WHERE date(follow_up_date) < date('now') AND status = 'Pending'
    ${filters.counselorId ? 'AND counselor_id = ?' : ''}
  `).get(...(filters.counselorId ? [filters.counselorId] : [])) as { count: number }).count;

  // Applications
  const applicationsCount = (db.prepare(`
    SELECT count(*) as count FROM applications
    ${filters.counselorId ? 'WHERE counselor_id = ?' : ''}
  `).get(...(filters.counselorId ? [filters.counselorId] : [])) as { count: number }).count;

  // Admissions
  const admissionsCount = (db.prepare(`
    SELECT count(*) as count FROM students
    ${filters.counselorId ? 'WHERE counselor_id = ?' : ''}
  `).get(...(filters.counselorId ? [filters.counselorId] : [])) as { count: number }).count;

  // Fee Paid Total
  const feePaidTotal = (db.prepare(`
    SELECT COALESCE(SUM(fee_paid), 0) as total FROM students
    ${filters.counselorId ? 'WHERE counselor_id = ?' : ''}
  `).get(...(filters.counselorId ? [filters.counselorId] : [])) as { total: number }).total;

  // Overall Conversion rate formula
  const conversionRate = totalLeads > 0 ? Number(((admissionsCount / totalLeads) * 100).toFixed(2)) : 0;

  // Lead Funnel counts
  const stageCounts = db.prepare(`
    SELECT lead_status, count(*) as count 
    FROM leads ${whereSql}
    GROUP BY lead_status
  `).all(...params) as { lead_status: string; count: number }[];

  const countMap: Record<string, number> = {};
  for (const s of stageCounts) {
    countMap[s.lead_status] = s.count;
  }

  const newCount = countMap['New Lead'] || 0;
  const contactedCount = (countMap['Contacted'] || 0) + (countMap['Not Reachable'] || 0);
  const counselingCount = (countMap['Counseling Scheduled'] || 0) + (countMap['Counseling Done'] || 0);
  const interestedCount = countMap['Interested'] || 0;
  const appStartedCount = countMap['Application Started'] || 0;
  const docsPendingCount = countMap['Documents Pending'] || 0;
  const appliedCount = countMap['Application Submitted'] || 0;
  const offerCount = countMap['Offer Received'] || 0;
  const feePendingCount = countMap['Fee Pending'] || 0;
  const feePaidCount = countMap['Fee Paid'] || 0;
  const confirmedCount = (countMap['Admission Confirmed'] || 0) + (countMap['Enrolled'] || 0);

  // Progressive funnel stages
  const funnelStages = [
    { stage: 'New Leads', count: totalLeads, value: totalLeads * 50000 },
    { stage: 'Contacted', count: totalLeads - newCount, value: (totalLeads - newCount) * 55000 },
    { stage: 'Counseling', count: counselingCount + interestedCount + appStartedCount + appliedCount + offerCount + feePaidCount + confirmedCount, value: 1200000 },
    { stage: 'Interested', count: interestedCount + appStartedCount + appliedCount + offerCount + feePaidCount + confirmedCount, value: 1800000 },
    { stage: 'Application Started', count: appStartedCount + appliedCount + offerCount + feePaidCount + confirmedCount, value: 2400000 },
    { stage: 'Applied', count: appliedCount + offerCount + feePaidCount + confirmedCount, value: 3100000 },
    { stage: 'Offer Received', count: offerCount + feePaidCount + confirmedCount, value: 3800000 },
    { stage: 'Fee Paid', count: feePaidCount + confirmedCount, value: 4500000 },
    { stage: 'Admission Confirmed', count: confirmedCount, value: 5000000 }
  ];

  // Stage conversion rates
  const contactedBase = totalLeads - newCount;
  const leadToContactRate = totalLeads > 0 ? Number(((contactedBase / totalLeads) * 100).toFixed(1)) : 0;
  const counseledBase = counselingCount + interestedCount + appStartedCount + appliedCount + offerCount + feePaidCount + confirmedCount;
  const contactToCounselingRate = contactedBase > 0 ? Number(((counseledBase / contactedBase) * 100).toFixed(1)) : 0;
  const appBase = applicationsCount;
  const counselingToAppRate = counseledBase > 0 ? Number(((appBase / counseledBase) * 100).toFixed(1)) : 0;
  const appToAdmissionRate = appBase > 0 ? Number(((admissionsCount / appBase) * 100).toFixed(1)) : 0;

  // Chart 1: Leads by day
  const leadsByDay = db.prepare(`
    SELECT strftime('%Y-%m-%d', created_at) as date, count(*) as leads
    FROM leads
    WHERE is_deleted = 0 AND date(created_at) >= date('now', '-14 days')
    GROUP BY date
    ORDER BY date ASC
  `).all() as { date: string; leads: number }[];

  // Chart 2: Leads by source
  const leadsBySource = db.prepare(`
    SELECT lead_source as source, count(*) as count
    FROM leads ${whereSql}
    GROUP BY lead_source
    ORDER BY count DESC
  `).all(...params) as { source: string; count: number }[];

  // Chart 3: Leads by city (Target cities Nepal & India)
  const leadsByCity = db.prepare(`
    SELECT city, count(*) as count
    FROM leads ${whereSql}
    GROUP BY city
    ORDER BY count DESC
    LIMIT 10
  `).all(...params) as { city: string; count: number }[];

  // Chart 4: Leads by university
  const leadsByUniversity = db.prepare(`
    SELECT preferred_university as university, count(*) as count
    FROM leads ${whereSql}
    GROUP BY preferred_university
    ORDER BY count DESC
    LIMIT 8
  `).all(...params) as { university: string; count: number }[];

  // Chart 5: Leads by course
  const leadsByCourse = db.prepare(`
    SELECT preferred_course as course, count(*) as count
    FROM leads ${whereSql}
    GROUP BY preferred_course
    ORDER BY count DESC
    LIMIT 8
  `).all(...params) as { course: string; count: number }[];

  // Counselor performance table
  const counselorPerformance = db.prepare(`
    SELECT 
      c.id,
      c.name as counselor_name,
      c.total_assigned_leads as assigned,
      c.current_active_leads as active,
      c.total_admissions as admissions,
      c.conversion_rate,
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.lead_status NOT IN ('New Lead')) as contacted,
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.lead_status IN ('Counseling Scheduled', 'Counseling Done', 'Interested', 'Application Started', 'Offer Received', 'Admission Confirmed')) as counseled,
      (SELECT count(*) FROM applications a WHERE a.counselor_id = c.id) as applications
    FROM counselors c
    WHERE c.is_active = 1
    ORDER BY c.total_admissions DESC, c.conversion_rate DESC
  `).all() as any[];

  return {
    totalLeads,
    newLeadsToday,
    newLeadsThisWeek,
    newLeadsThisMonth,
    followupsToday,
    overdueFollowups,
    applicationsCount,
    admissionsCount,
    feePaidTotal,
    conversionRate,
    leadToContactRate,
    contactToCounselingRate,
    counselingToAppRate,
    appToAdmissionRate,
    funnelStages,
    leadsByDay,
    leadsBySource,
    leadsByCity,
    leadsByUniversity,
    leadsByCourse,
    counselorPerformance
  };
}

export function getCampaignROIReport() {
  const campaigns = db.prepare(`
    SELECT 
      c.*,
      ROUND(c.spend * 1.0 / MAX(1, c.leads_count), 2) as calc_cpl,
      ROUND(c.spend * 1.0 / MAX(1, c.applications_count), 2) as calc_cpa,
      ROUND(c.spend * 1.0 / MAX(1, c.admissions_count), 2) as calc_cost_per_admission,
      ROUND((c.admissions_count * 1.0 / MAX(1, c.leads_count)) * 100, 2) as roi_conversion_rate
    FROM campaigns c
    ORDER BY c.spend DESC
  `).all();

  const totals = db.prepare(`
    SELECT 
      SUM(budget) as total_budget,
      SUM(spend) as total_spend,
      SUM(leads_count) as total_leads,
      SUM(applications_count) as total_applications,
      SUM(admissions_count) as total_admissions
    FROM campaigns
  `).get() as any;

  const totalSpend = totals.total_spend || 0;
  const totalLeads = totals.total_leads || 0;
  const totalApps = totals.total_applications || 0;
  const totalAdmissions = totals.total_admissions || 0;

  const overallCPL = totalLeads > 0 ? Number((totalSpend / totalLeads).toFixed(2)) : 0;
  const overallCPA = totalApps > 0 ? Number((totalSpend / totalApps).toFixed(2)) : 0;
  const overallCostPerAdmission = totalAdmissions > 0 ? Number((totalSpend / totalAdmissions).toFixed(2)) : 0;

  return {
    campaigns,
    summary: {
      totalBudget: totals.total_budget || 0,
      totalSpend,
      totalLeads,
      totalApplications: totalApps,
      totalAdmissions,
      overallCPL,
      overallCPA,
      overallCostPerAdmission
    }
  };
}
