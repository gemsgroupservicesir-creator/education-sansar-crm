import { db, logAudit, logLeadActivity, createNotification } from '../db/database.ts';
import { isNeonEnabled, persistLeadToNeon } from '../db/neon.ts';
import type { Lead, Counselor } from '../types/index.ts';

export interface LeadRoutingRule {
  id: string;
  name: string;
  course_keywords: string[];
  university_keywords: string[];
  target_cities: string[];
  counselor_id: string;
  counselor_name: string;
  priority: number;
  max_daily_leads: number;
  is_active: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export function parseKeywords(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(k => String(k).trim()).filter(Boolean);
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(k => String(k).trim()).filter(Boolean);
    } catch {
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

/**
 * Get all configured Lead Routing Rules
 */
export function getRoutingRules(): LeadRoutingRule[] {
  try {
    const rows = db.prepare(`
      SELECT r.*, c.name as current_counselor_name, c.is_active as counselor_active, c.email as counselor_email
      FROM lead_routing_rules r
      LEFT JOIN counselors c ON r.counselor_id = c.id
      ORDER BY r.priority DESC, r.created_at ASC
    `).all() as any[];

    return rows.map(r => ({
      ...r,
      counselor_name: r.current_counselor_name || r.counselor_name || 'Counselor',
      course_keywords: parseKeywords(r.course_keywords),
      university_keywords: parseKeywords(r.university_keywords),
      target_cities: parseKeywords(r.target_cities),
    }));
  } catch (err: any) {
    console.warn('[Routing Rules] Query failed:', err.message);
    return [];
  }
}

/**
 * Create a new lead distribution rule
 */
export function createRoutingRule(data: Partial<LeadRoutingRule>, performedBy: string = 'Super Admin'): LeadRoutingRule {
  const id = 'RULE-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  
  // Look up counselor name if not provided
  let counselorName = data.counselor_name || '';
  if (data.counselor_id && !counselorName) {
    const c = db.prepare("SELECT name FROM counselors WHERE id = ?").get(data.counselor_id) as any;
    if (c) counselorName = c.name;
  }

  const courseKw = JSON.stringify(parseKeywords(data.course_keywords));
  const uniKw = JSON.stringify(parseKeywords(data.university_keywords));
  const cities = JSON.stringify(parseKeywords(data.target_cities));

  db.prepare(`
    INSERT INTO lead_routing_rules (
      id, name, course_keywords, university_keywords, target_cities,
      counselor_id, counselor_name, priority, max_daily_leads, is_active, description
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name || 'Custom Routing Rule',
    courseKw,
    uniKw,
    cities,
    data.counselor_id,
    counselorName,
    data.priority !== undefined ? Number(data.priority) : 1,
    data.max_daily_leads !== undefined ? Number(data.max_daily_leads) : 20,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
    data.description || null
  );

  logAudit({
    userName: performedBy,
    action: 'CREATE_LEAD_ROUTING_RULE',
    entity: 'lead_routing_rule',
    entityId: id,
    newValue: { name: data.name, counselor_name: counselorName, priority: data.priority }
  });

  return {
    id,
    name: data.name || 'Custom Routing Rule',
    course_keywords: parseKeywords(data.course_keywords),
    university_keywords: parseKeywords(data.university_keywords),
    target_cities: parseKeywords(data.target_cities),
    counselor_id: data.counselor_id!,
    counselor_name: counselorName,
    priority: data.priority || 1,
    max_daily_leads: data.max_daily_leads || 20,
    is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
    description: data.description
  };
}

/**
 * Update an existing routing rule
 */
export function updateRoutingRule(id: string, data: Partial<LeadRoutingRule>, performedBy: string = 'Super Admin'): boolean {
  const existing = db.prepare("SELECT * FROM lead_routing_rules WHERE id = ?").get(id) as any;
  if (!existing) return false;

  let counselorName = existing.counselor_name;
  if (data.counselor_id && data.counselor_id !== existing.counselor_id) {
    const c = db.prepare("SELECT name FROM counselors WHERE id = ?").get(data.counselor_id) as any;
    if (c) counselorName = c.name;
  }

  const courseKw = data.course_keywords !== undefined ? JSON.stringify(parseKeywords(data.course_keywords)) : existing.course_keywords;
  const uniKw = data.university_keywords !== undefined ? JSON.stringify(parseKeywords(data.university_keywords)) : existing.university_keywords;
  const cities = data.target_cities !== undefined ? JSON.stringify(parseKeywords(data.target_cities)) : existing.target_cities;

  db.prepare(`
    UPDATE lead_routing_rules
    SET name = ?,
        course_keywords = ?,
        university_keywords = ?,
        target_cities = ?,
        counselor_id = ?,
        counselor_name = ?,
        priority = ?,
        max_daily_leads = ?,
        is_active = ?,
        description = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.name !== undefined ? data.name : existing.name,
    courseKw,
    uniKw,
    cities,
    data.counselor_id !== undefined ? data.counselor_id : existing.counselor_id,
    counselorName,
    data.priority !== undefined ? Number(data.priority) : existing.priority,
    data.max_daily_leads !== undefined ? Number(data.max_daily_leads) : existing.max_daily_leads,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : existing.is_active,
    data.description !== undefined ? data.description : existing.description,
    id
  );

  logAudit({
    userName: performedBy,
    action: 'UPDATE_LEAD_ROUTING_RULE',
    entity: 'lead_routing_rule',
    entityId: id,
    oldValue: existing,
    newValue: data
  });

  return true;
}

/**
 * Delete a routing rule
 */
export function deleteRoutingRule(id: string, performedBy: string = 'Super Admin'): boolean {
  const rule = db.prepare("SELECT * FROM lead_routing_rules WHERE id = ?").get(id);
  if (!rule) return false;

  db.prepare("DELETE FROM lead_routing_rules WHERE id = ?").run(id);

  logAudit({
    userName: performedBy,
    action: 'DELETE_LEAD_ROUTING_RULE',
    entity: 'lead_routing_rule',
    entityId: id,
    oldValue: rule
  });

  return true;
}

/**
 * Reset daily lead counter if day has changed
 */
function checkAndResetDailyQuotas(counselors: any[]) {
  const today = new Date().toISOString().split('T')[0];
  for (const c of counselors) {
    if (c.last_assigned_date !== today) {
      db.prepare(`
        UPDATE counselors
        SET leads_assigned_today = 0, last_assigned_date = ?
        WHERE id = ?
      `).run(today, c.id);
      c.leads_assigned_today = 0;
      c.last_assigned_date = today;
    }
  }
}

/**
 * Match a text field against an array of keywords
 */
function matchesKeywords(text?: string | null, keywords?: string[]): boolean {
  if (!keywords || keywords.length === 0) return true; // Empty means no filter for this dimension
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase().trim()));
}

/**
 * Automated Lead Distribution Core Engine
 * Routes student leads based on Course keywords, University keywords, City, Priority, and Counselor Capacity.
 */
export function distributeLead(lead: {
  city?: string | null;
  preferred_university?: string | null;
  preferred_course?: string | null;
  country?: string | null;
}): { counselorId: string; counselorName: string; method: string; matchedRule?: string; reasons: string[] } | null {
  
  // 1. Fetch all active counselors with available capacity
  const activeCounselors = db.prepare(`
    SELECT * FROM counselors
    WHERE is_active = 1 AND current_active_leads < max_capacity
    ORDER BY current_active_leads ASC
  `).all() as any[];

  if (activeCounselors.length === 0) {
    // If all are at max capacity, fallback to any active counselor with lowest load
    const fallbackCounselors = db.prepare(`
      SELECT * FROM counselors WHERE is_active = 1 ORDER BY current_active_leads ASC LIMIT 1
    `).all() as any[];
    if (fallbackCounselors.length === 0) return null;
    const fallback = fallbackCounselors[0];
    return {
      counselorId: fallback.id,
      counselorName: fallback.name,
      method: 'Fallback (Capacity Exceeded)',
      reasons: ['All counselors at capacity, routed to lowest load active counselor']
    };
  }

  checkAndResetDailyQuotas(activeCounselors);

  const counselorMap = new Map<string, any>();
  for (const c of activeCounselors) counselorMap.set(c.id, c);

  // 2. Evaluate Lead Routing Rules in order of Priority DESC
  const rules = getRoutingRules().filter(r => r.is_active === 1);

  for (const rule of rules) {
    const counselor = counselorMap.get(rule.counselor_id);
    if (!counselor) continue; // Counselor inactive or over capacity

    // Check daily quota
    const dailyQuota = rule.max_daily_leads || counselor.daily_lead_quota || 25;
    if ((counselor.leads_assigned_today || 0) >= dailyQuota) {
      continue; // Counselor hit daily limit for this rule
    }

    const hasCourseFilter = rule.course_keywords && rule.course_keywords.length > 0;
    const hasUniFilter = rule.university_keywords && rule.university_keywords.length > 0;
    const hasCityFilter = rule.target_cities && rule.target_cities.length > 0;

    // Skip if rule has no criteria
    if (!hasCourseFilter && !hasUniFilter && !hasCityFilter) continue;

    const courseMatches = matchesKeywords(lead.preferred_course, rule.course_keywords);
    const uniMatches = matchesKeywords(lead.preferred_university, rule.university_keywords);
    const cityMatches = matchesKeywords(lead.city, rule.target_cities);

    // Rule criteria evaluation:
    // If both course and university are defined on the rule, BOTH must match for a high-precision match.
    // Otherwise, each defined filter must match.
    let isMatch = false;
    const matchReasons: string[] = [];

    if (hasCourseFilter && hasUniFilter) {
      if (courseMatches && uniMatches) {
        isMatch = !hasCityFilter || cityMatches;
        if (isMatch) {
          matchReasons.push(`Matched Course [${lead.preferred_course}]`);
          matchReasons.push(`Matched University [${lead.preferred_university}]`);
          if (hasCityFilter && cityMatches) matchReasons.push(`Matched City [${lead.city}]`);
        }
      }
    } else if (hasCourseFilter && courseMatches) {
      isMatch = !hasCityFilter || cityMatches;
      if (isMatch) {
        matchReasons.push(`Matched Course [${lead.preferred_course}]`);
        if (hasCityFilter && cityMatches) matchReasons.push(`Matched City [${lead.city}]`);
      }
    } else if (hasUniFilter && uniMatches) {
      isMatch = !hasCityFilter || cityMatches;
      if (isMatch) {
        matchReasons.push(`Matched University [${lead.preferred_university}]`);
        if (hasCityFilter && cityMatches) matchReasons.push(`Matched City [${lead.city}]`);
      }
    } else if (hasCityFilter && cityMatches && !hasCourseFilter && !hasUniFilter) {
      isMatch = true;
      matchReasons.push(`Matched City [${lead.city}]`);
    }

    if (isMatch) {
      return {
        counselorId: counselor.id,
        counselorName: counselor.name,
        method: `Automated Rule (${rule.name})`,
        matchedRule: rule.name,
        reasons: matchReasons
      };
    }
  }

  // 3. Direct Counselor Specialization Check (Stored on counselor profile)
  for (const c of activeCounselors) {
    const specCourses = parseKeywords(c.specialization_courses);
    const specUnis = parseKeywords(c.specialization_universities);
    const courseMatches = matchesKeywords(lead.preferred_course, specCourses);
    const uniMatches = matchesKeywords(lead.preferred_university, specUnis);

    if (specCourses.length > 0 && courseMatches) {
      return {
        counselorId: c.id,
        counselorName: c.name,
        method: 'Counselor Course Specialization',
        reasons: [`Counselor specializes in ${lead.preferred_course}`]
      };
    }

    if (specUnis.length > 0 && uniMatches) {
      return {
        counselorId: c.id,
        counselorName: c.name,
        method: 'Counselor University Specialization',
        reasons: [`Counselor specializes in ${lead.preferred_university}`]
      };
    }
  }

  // 4. Smart Round Robin & Capacity Balanced Fallback
  // Pick active counselor with lowest active lead load percentage
  activeCounselors.sort((a, b) => {
    const ratioA = (a.current_active_leads || 0) / (a.max_capacity || 100);
    const ratioB = (b.current_active_leads || 0) / (b.max_capacity || 100);
    if (ratioA !== ratioB) return ratioA - ratioB;
    return (a.total_assigned_leads || 0) - (b.total_assigned_leads || 0);
  });

  const selected = activeCounselors[0];
  return {
    counselorId: selected.id,
    counselorName: selected.name,
    method: 'Capacity-Balanced Round Robin',
    reasons: [`Selected counselor with lowest workload ratio (${selected.current_active_leads}/${selected.max_capacity})`]
  };
}

/**
 * Batch distribute all unassigned student leads
 */
export async function distributeUnassignedLeads(performedBy: string = 'Super Admin'): Promise<{
  totalProcessed: number;
  totalAssigned: number;
  details: any[];
}> {
  const unassigned = db.prepare(`
    SELECT * FROM leads 
    WHERE is_deleted = 0 AND (assigned_counselor_id IS NULL OR assigned_counselor_id = '')
    ORDER BY created_at ASC
  `).all() as Lead[];

  let totalAssigned = 0;
  const details: any[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (const lead of unassigned) {
    const route = distributeLead({
      city: lead.city,
      preferred_course: lead.preferred_course,
      preferred_university: lead.preferred_university,
      country: lead.country
    });

    if (route) {
      // Update Lead
      db.prepare(`
        UPDATE leads 
        SET assigned_counselor_id = ?,
            assigned_counselor_name = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(route.counselorId, route.counselorName, lead.id);

      // Update Counselor Workload Counters
      db.prepare(`
        UPDATE counselors 
        SET current_active_leads = current_active_leads + 1,
            total_assigned_leads = total_assigned_leads + 1,
            leads_assigned_today = leads_assigned_today + 1,
            last_assigned_date = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(today, route.counselorId);

      // Record Assignment Log
      const assignId = 'ASGN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      db.prepare(`
        INSERT INTO lead_assignments (id, lead_id, previous_counselor_id, previous_counselor_name, new_counselor_id, new_counselor_name, assignment_method, assigned_by)
        VALUES (?, ?, NULL, NULL, ?, ?, ?, ?)
      `).run(assignId, lead.id, route.counselorId, route.counselorName, route.method, performedBy);

      // Activity timeline
      logLeadActivity({
        leadId: lead.id,
        activityType: 'COUNSELOR_ASSIGNED',
        title: 'Assigned via Lead Distribution Engine',
        description: `Assigned to ${route.counselorName} via ${route.method}. Reason: ${route.reasons.join(', ')}`,
        performedBy
      });

      // Counselor notification
      createNotification({
        counselorId: route.counselorId,
        title: 'New Student Lead Assigned',
        message: `${lead.student_name} interested in ${lead.preferred_course} at ${lead.preferred_university} was assigned to you via ${route.method}.`,
        type: 'LEAD_ASSIGNED',
        entityType: 'lead',
        entityId: lead.id
      });

      // Sync to Neon if enabled
      if (isNeonEnabled()) {
        const updatedLead = db.prepare("SELECT * FROM leads WHERE id = ?").get(lead.id);
        if (updatedLead) {
          persistLeadToNeon(updatedLead).catch(() => {});
        }
      }

      totalAssigned++;
      details.push({
        leadId: lead.id,
        leadNumber: lead.lead_id,
        studentName: lead.student_name,
        preferredCourse: lead.preferred_course,
        preferredUniversity: lead.preferred_university,
        assignedTo: route.counselorName,
        method: route.method,
        matchedRule: route.matchedRule
      });
    }
  }

  logAudit({
    userName: performedBy,
    action: 'BATCH_LEAD_DISTRIBUTION',
    entity: 'lead_distribution_engine',
    newValue: { totalProcessed: unassigned.length, totalAssigned }
  });

  return {
    totalProcessed: unassigned.length,
    totalAssigned,
    details
  };
}

/**
 * Simulate lead routing without saving to database
 */
export function simulateLeadRouting(params: {
  preferred_course?: string;
  preferred_university?: string;
  city?: string;
}) {
  const result = distributeLead(params);
  if (!result) {
    return {
      success: false,
      message: 'No eligible active counselors found to take this lead.'
    };
  }

  return {
    success: true,
    counselorId: result.counselorId,
    counselorName: result.counselorName,
    method: result.method,
    matchedRule: result.matchedRule,
    reasons: result.reasons
  };
}
