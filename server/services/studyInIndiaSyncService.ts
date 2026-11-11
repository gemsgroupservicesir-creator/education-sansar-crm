import { db, logAudit } from '../db/database.ts';
import { 
  sql, 
  isNeonEnabled, 
  persistUniversityToNeon, 
  persistCourseToNeon, 
  persistUniversityCourseToNeon 
} from '../db/neon.ts';

// Ignore TLS warnings for government portal certificates if needed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export interface SyncStats {
  universitiesAdded: number;
  universitiesUpdated: number;
  coursesAdded: number;
  coursesUpdated: number;
  totalInstitutesOnPortal: number;
  totalCoursesOnPortal: number;
  durationMs: number;
  mode: 'quick' | 'full';
  triggeredBy: string;
}

export interface SyncStatus {
  id: string;
  name: string;
  is_enabled: boolean;
  status: 'CONNECTED' | 'SYNCING' | 'ERROR' | 'IDLE';
  is_syncing: boolean;
  last_sync_at: string | null;
  auto_sync_interval_minutes: number;
  auto_sync_enabled: boolean;
  last_stats: SyncStats | null;
  db_counts: {
    universities: number;
    courses: number;
    university_courses: number;
  };
  portal_counts: {
    institutes: number;
    courses: number;
  };
}

let isSyncing = false;
let currentSyncStartedAt: number | null = null;
let lastKnownPortalInstitutes = 1273;
let lastKnownPortalCourses = 25080;

// Stream and degree mapping helpers
function mapStream(disc?: string): string {
  if (!disc) return 'General';
  const d = disc.toUpperCase();
  if (d.includes('ENGINEERING')) return 'Engineering & Technology';
  if (d.includes('MANAGEMENT') || d.includes('BUSINESS')) return 'Management & Business';
  if (d.includes('SCIENCE')) return 'Sciences & Mathematics';
  if (d.includes('MEDICAL') || d.includes('HEALTH') || d.includes('PHARMACY') || d.includes('DENTAL') || d.includes('NURSING')) return 'Medical & Health Sciences';
  if (d.includes('LAW')) return 'Law & Legal Studies';
  if (d.includes('HUMANITIES') || d.includes('LANGUAGE') || d.includes('SOCIAL')) return 'Humanities & Social Sciences';
  if (d.includes('COMMERCE') || d.includes('FINANCE')) return 'Commerce & Finance';
  if (d.includes('AGRICULTURE')) return 'Agricultural Sciences';
  if (d.includes('ARTS') || d.includes('DESIGN')) return 'Arts & Design';
  return disc.trim();
}

function mapLevel(prog?: string): { level: string; degree: string } {
  if (!prog) return { level: 'UG', degree: 'Undergraduate' };
  const p = prog.toLowerCase();
  if (p.includes('phd') || p.includes('doctoral')) return { level: 'PhD', degree: 'Doctorate' };
  if (p.includes('post graduate') || p.includes('pg') || p.includes('master')) return { level: 'PG', degree: 'Postgraduate' };
  if (p.includes('diploma') || p.includes('certificate')) return { level: 'Diploma', degree: 'Diploma' };
  return { level: 'UG', degree: 'Undergraduate' };
}

/**
 * Initialize or ensure Study in India integration record in database
 */
export function ensureStudyInIndiaIntegrationRecord(): void {
  try {
    const existing = db.prepare("SELECT * FROM integrations WHERE id = 'int-studyinindia'").get();
    if (!existing) {
      db.prepare(`
        INSERT INTO integrations (id, name, is_enabled, status, config, last_sync_at, created_at, updated_at)
        VALUES ('int-studyinindia', 'Study in India Portal', 1, 'CONNECTED', ?, datetime('now'), datetime('now'), datetime('now'))
      `).run(JSON.stringify({
        portalUrl: 'https://www.studyinindia.gov.in',
        autoSyncIntervalMinutes: 60,
        autoSyncEnabled: true,
        lastSyncStats: {
          universitiesAdded: 0,
          universitiesUpdated: 0,
          coursesAdded: 0,
          coursesUpdated: 0,
          totalInstitutesOnPortal: 1273,
          totalCoursesOnPortal: 25080,
          durationMs: 0,
          mode: 'quick',
          triggeredBy: 'System Init'
        }
      }));
    }
  } catch (err: any) {
    console.warn('[Study in India] Init integration record warning:', err.message);
  }
}

/**
 * Get current sync status & metrics
 */
export async function getStudyInIndiaSyncStatus(): Promise<SyncStatus> {
  ensureStudyInIndiaIntegrationRecord();

  let isEnabled = true;
  let status: 'CONNECTED' | 'SYNCING' | 'ERROR' | 'IDLE' = isSyncing ? 'SYNCING' : 'CONNECTED';
  let lastSyncAt: string | null = null;
  let autoSyncInterval = 60;
  let autoSyncEnabled = true;
  let lastStats: SyncStats | null = null;

  try {
    const row = db.prepare("SELECT * FROM integrations WHERE id = 'int-studyinindia'").get() as any;
    if (row) {
      isEnabled = Boolean(row.is_enabled);
      lastSyncAt = row.last_sync_at;
      if (row.config) {
        try {
          const cfg = JSON.parse(row.config);
          autoSyncInterval = cfg.autoSyncIntervalMinutes || 60;
          autoSyncEnabled = cfg.autoSyncEnabled !== undefined ? cfg.autoSyncEnabled : true;
          lastStats = cfg.lastSyncStats || null;
        } catch {}
      }
    }
  } catch {}

  // Fetch local counts
  let uniCount = 0;
  let courseCount = 0;
  let ucCount = 0;
  try {
    uniCount = (db.prepare('SELECT COUNT(*) as c FROM universities').get() as any)?.c || 0;
    courseCount = (db.prepare('SELECT COUNT(*) as c FROM courses').get() as any)?.c || 0;
    ucCount = (db.prepare('SELECT COUNT(*) as c FROM university_courses').get() as any)?.c || 0;
  } catch {}

  return {
    id: 'int-studyinindia',
    name: 'Study in India Portal',
    is_enabled: isEnabled,
    status: isSyncing ? 'SYNCING' : status,
    is_syncing: isSyncing,
    last_sync_at: lastSyncAt,
    auto_sync_interval_minutes: autoSyncInterval,
    auto_sync_enabled: autoSyncEnabled,
    last_stats: lastStats,
    db_counts: {
      universities: uniCount,
      courses: courseCount,
      university_courses: ucCount
    },
    portal_counts: {
      institutes: lastKnownPortalInstitutes,
      courses: lastKnownPortalCourses
    }
  };
}

/**
 * Update integration settings (auto-sync toggle, interval)
 */
export function updateStudyInIndiaSyncConfig(updates: {
  autoSyncEnabled?: boolean;
  autoSyncIntervalMinutes?: number;
}): void {
  ensureStudyInIndiaIntegrationRecord();
  try {
    const row = db.prepare("SELECT config FROM integrations WHERE id = 'int-studyinindia'").get() as any;
    let cfg: any = {};
    if (row?.config) {
      try { cfg = JSON.parse(row.config); } catch {}
    }
    if (updates.autoSyncEnabled !== undefined) {
      cfg.autoSyncEnabled = updates.autoSyncEnabled;
    }
    if (updates.autoSyncIntervalMinutes !== undefined) {
      cfg.autoSyncIntervalMinutes = updates.autoSyncIntervalMinutes;
    }

    db.prepare(`
      UPDATE integrations
      SET config = ?, is_enabled = ?, updated_at = datetime('now')
      WHERE id = 'int-studyinindia'
    `).run(JSON.stringify(cfg), cfg.autoSyncEnabled ? 1 : 0);
  } catch (err: any) {
    console.error('[Study in India] Config update failed:', err.message);
  }
}

/**
 * Core Realtime Sync Function
 * Syncs universities and courses from the official Study in India portal into SQLite and Neon PostgreSQL
 */
export async function syncStudyInIndiaData(options: {
  mode?: 'quick' | 'full';
  triggeredBy?: string;
} = {}): Promise<{
  success: boolean;
  stats: SyncStats;
  message: string;
}> {
  const mode = options.mode || 'quick';
  const triggeredBy = options.triggeredBy || 'Manual Web UI';

  if (isSyncing) {
    const elapsedSec = currentSyncStartedAt ? Math.round((Date.now() - currentSyncStartedAt) / 1000) : 0;
    return {
      success: false,
      stats: {
        universitiesAdded: 0,
        universitiesUpdated: 0,
        coursesAdded: 0,
        coursesUpdated: 0,
        totalInstitutesOnPortal: lastKnownPortalInstitutes,
        totalCoursesOnPortal: lastKnownPortalCourses,
        durationMs: 0,
        mode,
        triggeredBy
      },
      message: `A Study in India sync is already in progress (${elapsedSec}s elapsed). Please wait.`
    };
  }

  isSyncing = true;
  currentSyncStartedAt = Date.now();
  const startTime = Date.now();

  let universitiesAdded = 0;
  let universitiesUpdated = 0;
  let coursesAdded = 0;
  let coursesUpdated = 0;

  try {
    console.log(`[Study in India Sync] Starting ${mode.toUpperCase()} sync (Triggered by: ${triggeredBy})...`);

    // ------------------------------------------------------------------------
    // Step 1: Fetch and Sync Institutes
    // ------------------------------------------------------------------------
    const instUrl = 'https://www.studyinindia.gov.in/Courses/exploreallcoruses/?handler=InstituteListServerSide&Cpage=1&pageSize=1500';
    const instRes = await fetch(instUrl, { headers: { 'User-Agent': 'EducationSansarCRM/1.0' } });
    if (!instRes.ok) {
      throw new Error(`Failed to fetch institutes: HTTP ${instRes.status} ${instRes.statusText}`);
    }

    const instJson = await instRes.json();
    const rawInstitutes = instJson.aaData || [];
    lastKnownPortalInstitutes = instJson.iTotalRecords || rawInstitutes.length;
    console.log(`[Study in India Sync] Retrieved ${rawInstitutes.length} institutes from portal (Total: ${lastKnownPortalInstitutes}).`);

    // Existing universities in SQLite
    const existingUnis = db.prepare('SELECT id, name, short_name FROM universities').all() as any[];
    const uniById = new Map<string, any>();
    const uniByCode = new Map<string, any>();
    const uniByName = new Map<string, any>();

    for (const u of existingUnis) {
      uniById.set(u.id, u);
      if (u.short_name) uniByCode.set(u.short_name.toLowerCase().trim(), u);
      uniByName.set(u.name.toLowerCase().trim(), u);
    }

    const seenNames = new Set<string>();
    for (const u of existingUnis) {
      if (u.name) seenNames.add(u.name.toLowerCase().trim());
    }

    const upsertUniStmt = db.prepare(`
      INSERT INTO universities (
        id, name, short_name, campus, city, state, country, university_type,
        accreditation, ranking, website, contact, description, status, is_active, is_demo, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        short_name = excluded.short_name,
        campus = excluded.campus,
        city = excluded.city,
        state = excluded.state,
        country = excluded.country,
        university_type = excluded.university_type,
        accreditation = excluded.accreditation,
        ranking = excluded.ranking,
        website = excluded.website,
        contact = excluded.contact,
        description = excluded.description,
        status = excluded.status,
        is_active = 1,
        updated_at = datetime('now')
    `);

    const newUnisToPersistNeon: any[] = [];

    const syncUniTx = db.transaction(() => {
      for (const item of rawInstitutes) {
        let rawName = (item.instituteName || '').trim();
        if (!rawName) continue;

        let rawCode = (item.instituteID || item.aisheCode || item.id).toString().replace(/[^a-zA-Z0-9_-]/g, '_');
        let id = `sii_${rawCode}`;

        // Ensure name is unique to satisfy UNIQUE(name) constraint in universities table
        let name = rawName;
        const existingThisUni = uniById.get(id);
        if (existingThisUni) {
          name = existingThisUni.name;
        } else {
          if (seenNames.has(name.toLowerCase())) {
            const loc = (item.location || item.stateName || item.aisheCode || '').trim();
            name = loc ? `${name} (${loc})` : `${name} - ${item.id}`;
          }
          if (seenNames.has(name.toLowerCase())) {
            name = `${name} - ${item.id}`;
          }
          seenNames.add(name.toLowerCase());
        }

        let website = (item.admURL || '').trim();
        if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
          website = 'https://' + website;
        }

        let uniType = 'Private';
        if (item.instituteType === 'Public') uniType = 'Government';
        else if (item.instituteType) uniType = item.instituteType;

        let ranking = '';
        if (item.nirF_Rank && item.nirF_Rank !== 'NA' && item.nirF_Rank !== '0' && item.nirF_Rank.trim() !== '') {
          ranking = `NIRF Rank #${item.nirF_Rank.trim()}`;
        } else {
          ranking = 'SII Empaneled';
        }

        let accreditation = item.nirfCategory ? `NIRF (${item.nirfCategory})` : 'UGC / AICTE Approved';
        let disc = item.disciplineName && item.disciplineName !== 'NA' ? item.disciplineName : 'Multiple Streams';
        let aishe = item.aisheCode || item.instituteID || 'N/A';
        let description = `Official Study in India (SII) empanelled institution. AISHE Code: ${aishe}. Disciplines: ${disc}. Mode: ${item.mode || 'Regular/Offline'}. Intake Year: ${item.participatedYear || '2026-27'}.`;

        const uniRecord = {
          id,
          name,
          short_name: item.aisheCode || item.instituteID || '',
          campus: item.location || item.stateName || 'Main Campus',
          city: item.location ? item.location.trim() : (item.stateName ? item.stateName.trim() : 'India'),
          state: item.stateName ? item.stateName.trim() : 'India',
          country: 'India',
          university_type: uniType,
          accreditation,
          ranking,
          website,
          contact: item.hasScholarship ? 'Scholarships / Fee Concessions Available' : '',
          description,
          status: 'Active',
          is_active: 1,
          is_demo: 0
        };

        const existing = uniById.get(id);
        if (!existing) {
          universitiesAdded++;
          newUnisToPersistNeon.push(uniRecord);
        } else {
          universitiesUpdated++;
        }

        upsertUniStmt.run(
          uniRecord.id, uniRecord.name, uniRecord.short_name, uniRecord.campus, uniRecord.city,
          uniRecord.state, uniRecord.country, uniRecord.university_type, uniRecord.accreditation,
          uniRecord.ranking, uniRecord.website, uniRecord.contact, uniRecord.description, uniRecord.status
        );

        uniById.set(id, uniRecord);
        if (uniRecord.short_name) uniByCode.set(uniRecord.short_name.toLowerCase().trim(), uniRecord);
        uniByName.set(uniRecord.name.toLowerCase().trim(), uniRecord);
      }
    });

    syncUniTx();
    console.log(`[Study in India Sync] Universities synced: ${universitiesAdded} added, ${universitiesUpdated} updated.`);

    // Persist new universities to Neon asynchronously
    if (isNeonEnabled() && newUnisToPersistNeon.length > 0) {
      Promise.all(newUnisToPersistNeon.slice(0, 50).map(u => persistUniversityToNeon(u))).catch(() => {});
    }

    // ------------------------------------------------------------------------
    // Step 2: Fetch and Sync Courses & Fee Structures
    // ------------------------------------------------------------------------
    const existingCourseIds = new Set<string>();
    const courseRows = db.prepare("SELECT id FROM courses WHERE id LIKE 'course_sii_%'").all() as any[];
    for (const r of courseRows) {
      existingCourseIds.add(r.id);
    }

    const pageSize = mode === 'quick' ? 3000 : 5000;
    const maxPages = mode === 'quick' ? 2 : 10;
    let page = 1;
    let allRawCourses: any[] = [];

    while (page <= maxPages) {
      const courseUrl = `https://www.studyinindia.gov.in/Courses/exploreallcoruses/?handler=CoursesListServerSide&Cpage=${page}&pageSize=${pageSize}`;
      console.log(`[Study in India Sync] Fetching course batch page ${page}...`);

      const cRes = await fetch(courseUrl, { headers: { 'User-Agent': 'EducationSansarCRM/1.0' } });
      if (!cRes.ok) break;

      const cJson = await cRes.json();
      const items = cJson.aaData || [];
      lastKnownPortalCourses = cJson.iTotalRecords || lastKnownPortalCourses;

      if (items.length === 0) break;
      allRawCourses.push(...items);

      if (allRawCourses.length >= lastKnownPortalCourses || items.length < pageSize) {
        break;
      }
      page++;
    }

    console.log(`[Study in India Sync] Processing ${allRawCourses.length} downloaded courses...`);

    const upsertCourseStmt = db.prepare(`
      INSERT INTO courses (
        id, university_id, university_name, course_name, short_name, course_level,
        degree_level, stream, duration, eligibility, entrance_requirement, fees_range,
        scholarship_info, intake, application_deadline, description, status, is_active, is_demo, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        university_id = excluded.university_id,
        university_name = excluded.university_name,
        course_name = excluded.course_name,
        short_name = excluded.short_name,
        course_level = excluded.course_level,
        degree_level = excluded.degree_level,
        stream = excluded.stream,
        duration = excluded.duration,
        eligibility = excluded.eligibility,
        entrance_requirement = excluded.entrance_requirement,
        fees_range = excluded.fees_range,
        scholarship_info = excluded.scholarship_info,
        intake = excluded.intake,
        application_deadline = excluded.application_deadline,
        description = excluded.description,
        status = excluded.status,
        is_active = 1,
        updated_at = datetime('now')
    `);

    const upsertFeeStmt = db.prepare(`
      INSERT INTO university_courses (
        id, university_id, course_id, tuition_fee_per_year, hostel_fee_per_year,
        one_time_fee, other_charges, total_first_year_fee, total_full_course_fee,
        currency, scholarship_available, scholarship_details, application_deadline,
        admission_process, eligibility_notes, remarks, is_active, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        tuition_fee_per_year = excluded.tuition_fee_per_year,
        total_first_year_fee = excluded.total_first_year_fee,
        total_full_course_fee = excluded.total_full_course_fee,
        currency = excluded.currency,
        scholarship_available = excluded.scholarship_available,
        scholarship_details = excluded.scholarship_details,
        admission_process = excluded.admission_process,
        eligibility_notes = excluded.eligibility_notes,
        remarks = excluded.remarks,
        is_active = 1,
        updated_at = datetime('now')
    `);

    const newCoursesToPersistNeon: any[] = [];
    const newFeesToPersistNeon: any[] = [];

    const syncCoursesTx = db.transaction(() => {
      for (const item of allRawCourses) {
        const q = (item.qualification || item.courseTitle || '').trim();
        if (!q) continue;

        const code = (item.instituteID || item.aisheCode || '').toLowerCase().trim();
        const instName = (item.instituteName || '').toLowerCase().trim();

        const matchedUni = uniByCode.get(code) || uniByName.get(instName);
        let uniId = matchedUni?.id;
        let uniName = matchedUni?.name || (item.instituteName || 'Partner Institution').trim();

        if (!uniId) {
          const rawCode = (item.instituteID || item.aisheCode || item.id).toString().replace(/[^a-zA-Z0-9_-]/g, '_');
          uniId = `sii_${rawCode}`;
        }

        const courseId = `course_sii_${item.id}`;
        const ucId = `uc_sii_${item.id}`;
        const { level, degree } = mapLevel(item.programLevelD);
        const stream = mapStream(item.disciplineName);

        // Duration calculation
        let durationYears = 4;
        if (item.noofSemesters) {
          const match = item.noofSemesters.match(/(\d+)\s*Year/i);
          if (match) durationYears = parseInt(match[1]);
          else if (item.noofSemesters.toLowerCase().includes('semester')) {
            const sMatch = item.noofSemesters.match(/(\d+)/);
            if (sMatch) durationYears = Math.max(1, Math.round(parseInt(sMatch[1]) / 2));
          }
        } else if (item.courseDurations) {
          durationYears = Math.max(1, Math.round(parseInt(item.courseDurations) / 12));
        }

        const totalCost = Number(item.totalCost) || 0;
        const currency = item.currency || 'USD';
        const tuitionPerYear = Math.round(totalCost / Math.max(1, durationYears));

        const formattedFee = totalCost > 0
          ? `${currency} ${totalCost.toLocaleString()} (${currency} ${tuitionPerYear.toLocaleString()}/yr)`
          : 'Consult University';

        const scholarshipInfo = item.hasScholarship
          ? 'Study in India (SII) Scholarship / Fee Waiver Applicable'
          : 'Standard International Student Fee';

        const durationStr = item.noofSemesters || `${durationYears} Years`;
        const eligibilityStr = item.admissionProcess && item.admissionProcess.trim()
          ? item.admissionProcess.trim()
          : '10+2 / Higher Secondary / Bachelor degree as per institute eligibility';

        const isNew = !existingCourseIds.has(courseId);
        if (isNew) {
          coursesAdded++;
          existingCourseIds.add(courseId);
        } else {
          coursesUpdated++;
        }

        const courseRecord = {
          id: courseId,
          university_id: uniId,
          university_name: uniName,
          course_name: q,
          short_name: item.disciplineName || '',
          course_level: level,
          degree_level: degree,
          stream,
          duration: durationStr,
          eligibility: eligibilityStr,
          entrance_requirement: item.hasScholarship ? 'SII Merit Scholarship Evaluation' : 'Direct Counseling / Merit',
          fees_range: formattedFee,
          scholarship_info: scholarshipInfo,
          intake: '2026-27',
          application_deadline: '2026-08-31',
          description: `Official Study in India course offering. Discipline: ${item.disciplineName || 'General'}. Mode: ${item.mode || 'Regular'}. Institute AISHE: ${item.aisheCode || item.instituteID || 'N/A'}.`,
          status: 'Active'
        };

        const feeRecord = {
          id: ucId,
          university_id: uniId,
          course_id: courseId,
          tuition_fee_per_year: tuitionPerYear,
          hostel_fee_per_year: 0,
          one_time_fee: 0,
          other_charges: 0,
          total_first_year_fee: tuitionPerYear,
          total_full_course_fee: totalCost,
          currency,
          scholarship_available: item.hasScholarship ? 1 : 0,
          scholarship_details: scholarshipInfo,
          application_deadline: '2026-08-31',
          admission_process: item.admissionProcess && item.admissionProcess.trim() ? item.admissionProcess.trim() : 'Direct Merit / SII Allotment',
          eligibility_notes: eligibilityStr,
          remarks: `Study in India Academic Year 2026-27. Mode: ${item.mode || 'Offline'}.`
        };

        upsertCourseStmt.run(
          courseRecord.id, courseRecord.university_id, courseRecord.university_name,
          courseRecord.course_name, courseRecord.short_name, courseRecord.course_level,
          courseRecord.degree_level, courseRecord.stream, courseRecord.duration,
          courseRecord.eligibility, courseRecord.entrance_requirement, courseRecord.fees_range,
          courseRecord.scholarship_info, courseRecord.intake, courseRecord.application_deadline,
          courseRecord.description, courseRecord.status
        );

        upsertFeeStmt.run(
          feeRecord.id, feeRecord.university_id, feeRecord.course_id,
          feeRecord.tuition_fee_per_year, feeRecord.hostel_fee_per_year, feeRecord.one_time_fee,
          feeRecord.other_charges, feeRecord.total_first_year_fee, feeRecord.total_full_course_fee,
          feeRecord.currency, feeRecord.scholarship_available, feeRecord.scholarship_details,
          feeRecord.application_deadline, feeRecord.admission_process, feeRecord.eligibility_notes,
          feeRecord.remarks
        );

        if (isNew && newCoursesToPersistNeon.length < 50) {
          newCoursesToPersistNeon.push(courseRecord);
          newFeesToPersistNeon.push(feeRecord);
        }
      }
    });

    syncCoursesTx();
    console.log(`[Study in India Sync] Courses synced: ${coursesAdded} added, ${coursesUpdated} updated.`);

    // Persist new courses & fees to Neon asynchronously
    if (isNeonEnabled() && newCoursesToPersistNeon.length > 0) {
      Promise.all(newCoursesToPersistNeon.map(c => persistCourseToNeon(c))).catch(() => {});
      Promise.all(newFeesToPersistNeon.map(f => persistUniversityCourseToNeon(f))).catch(() => {});
    }

    const durationMs = Date.now() - startTime;
    const stats: SyncStats = {
      universitiesAdded,
      universitiesUpdated,
      coursesAdded,
      coursesUpdated,
      totalInstitutesOnPortal: lastKnownPortalInstitutes,
      totalCoursesOnPortal: lastKnownPortalCourses,
      durationMs,
      mode,
      triggeredBy
    };

    // Update integration row in database
    ensureStudyInIndiaIntegrationRecord();
    const configRow = db.prepare("SELECT config FROM integrations WHERE id = 'int-studyinindia'").get() as any;
    let cfg: any = {};
    if (configRow?.config) {
      try { cfg = JSON.parse(configRow.config); } catch {}
    }
    cfg.lastSyncStats = stats;

    db.prepare(`
      UPDATE integrations
      SET status = 'CONNECTED',
          last_sync_at = datetime('now'),
          config = ?,
          updated_at = datetime('now')
      WHERE id = 'int-studyinindia'
    `).run(JSON.stringify(cfg));

    logAudit({
      userName: 'System',
      action: 'INTEGRATION_SYNC',
      entity: 'Study in India Portal',
      entityId: 'int-studyinindia',
      newValue: `Realtime Sync (${mode}): ${universitiesAdded} unis added, ${coursesAdded} courses added, ${coursesUpdated} courses updated in ${Math.round(durationMs / 1000)}s`
    });

    return {
      success: true,
      stats,
      message: `Study in India Realtime Sync completed successfully! ${universitiesAdded} new universities and ${coursesAdded} new courses imported.`
    };
  } catch (err: any) {
    console.error('[Study in India Sync Error]:', err.message);
    try {
      db.prepare(`
        UPDATE integrations
        SET status = 'ERROR', updated_at = datetime('now')
        WHERE id = 'int-studyinindia'
      `).run();
    } catch {}

    throw err;
  } finally {
    isSyncing = false;
    currentSyncStartedAt = null;
  }
}

/**
 * Start background timer for automatic periodic sync
 */
let bgIntervalHandle: any = null;

export function startStudyInIndiaBackgroundSync(intervalMinutes = 60): void {
  if (bgIntervalHandle) {
    clearInterval(bgIntervalHandle);
  }

  console.log(`[Study in India] Background sync scheduler active (Interval: ${intervalMinutes} mins).`);
  
  bgIntervalHandle = setInterval(async () => {
    try {
      const status = await getStudyInIndiaSyncStatus();
      if (status.auto_sync_enabled) {
        console.log('[Study in India] Triggering scheduled background sync...');
        await syncStudyInIndiaData({ mode: 'quick', triggeredBy: 'Scheduled Background Cron' });
      }
    } catch (err: any) {
      console.warn('[Study in India] Scheduled sync error:', err.message);
    }
  }, intervalMinutes * 60 * 1000);
}
