require('dotenv').config();
const Database = require('better-sqlite3');
const { neon } = require('@neondatabase/serverless');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Stream and degree mapping helpers
function mapStream(disc) {
  if (!disc) return 'General Studies';
  const d = disc.toUpperCase();
  if (d.includes('ENGINEERING')) return 'Engineering & Technology';
  if (d.includes('MANAGEMENT') || d.includes('BUSINESS')) return 'Management & Business';
  if (d.includes('SCIENCE')) return 'Sciences & Mathematics';
  if (d.includes('MEDICAL') || d.includes('HEALTH') || d.includes('PHARMACY') || d.includes('DENTAL') || d.includes('NURSING')) return 'Medical & Allied Health';
  if (d.includes('LAW')) return 'Law & Legal Studies';
  if (d.includes('HUMANITIES') || d.includes('LANGUAGE') || d.includes('SOCIAL')) return 'Humanities & Social Sciences';
  if (d.includes('COMMERCE') || d.includes('FINANCE')) return 'Commerce & Finance';
  if (d.includes('AGRICULTURE')) return 'Agricultural Sciences';
  if (d.includes('ARTS') || d.includes('DESIGN')) return 'Arts & Design';
  return disc.trim();
}

function mapLevel(prog) {
  if (!prog) return { level: 'UG', degree: 'Undergraduate' };
  const p = prog.toLowerCase();
  if (p.includes('phd') || p.includes('doctoral')) return { level: 'PhD', degree: 'Doctorate' };
  if (p.includes('post graduate') || p.includes('pg') || p.includes('master')) return { level: 'PG', degree: 'Postgraduate' };
  if (p.includes('diploma') || p.includes('certificate')) return { level: 'Diploma', degree: 'Diploma' };
  return { level: 'UG', degree: 'Undergraduate' };
}

async function run() {
  console.log('1. Loading existing universities from SQLite & Neon...');
  const db = new Database('server/db/education_sansar.db');
  const sqliteUnis = db.prepare('SELECT id, name, short_name, city, state FROM universities').all();
  console.log(`Loaded ${sqliteUnis.length} universities from SQLite.`);

  const uniByCode = new Map();
  const uniByName = new Map();

  for (const u of sqliteUnis) {
    if (u.short_name) uniByCode.set(u.short_name.toLowerCase().trim(), u);
    uniByName.set(u.name.toLowerCase().trim(), u);
  }

  // Neon connection
  const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
  if (sql) {
    const neonUnis = await sql.query('SELECT id, name, short_name, city, state FROM universities');
    console.log(`Loaded ${neonUnis.length} universities from Neon.`);
    for (const u of neonUnis) {
      if (u.short_name) uniByCode.set(u.short_name.toLowerCase().trim(), u);
      uniByName.set(u.name.toLowerCase().trim(), u);
    }
  }

  console.log('\n2. Fetching courses from Study in India in batches of 5000...');
  const PAGE_SIZE = 5000;
  let page = 1;
  let totalCourses = 0;
  let allRawCourses = [];

  while (true) {
    const url = `https://www.studyinindia.gov.in/Courses/exploreallcoruses/?handler=CoursesListServerSide&Cpage=${page}&pageSize=${PAGE_SIZE}`;
    console.log(`Fetching Page ${page}...`);

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Page ${page} failed: ${res.status}`);
      break;
    }

    const json = await res.json();
    const items = json.aaData || [];
    totalCourses = json.iTotalRecords || totalCourses;

    if (items.length === 0) break;
    allRawCourses.push(...items);
    console.log(`  Fetched ${items.length} courses (Total accumulated: ${allRawCourses.length} / ${totalCourses}).`);

    if (allRawCourses.length >= totalCourses || items.length < PAGE_SIZE) {
      break;
    }
    page++;
  }

  console.log(`\nSuccessfully downloaded ${allRawCourses.length} course and fee records from Study in India!`);

  // Transform records
  console.log('3. Transforming and linking courses with universities...');
  const courseRecords = [];
  const feeRecords = [];
  const missingUniversities = [];
  const seenCourseIds = new Set();
  const seenMissingUniIds = new Set();

  for (const item of allRawCourses) {
    const q = (item.qualification || item.courseTitle || '').trim();
    if (!q) continue;

    const code = (item.instituteID || item.aisheCode || '').toLowerCase().trim();
    const instName = (item.instituteName || '').toLowerCase().trim();

    let matchedUni = uniByCode.get(code) || uniByName.get(instName);
    let uniId;
    let uniName;

    if (matchedUni) {
      uniId = matchedUni.id;
      uniName = matchedUni.name;
    } else {
      const rawCode = (item.instituteID || item.aisheCode || item.id).toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      uniId = `sii_${rawCode}`;
      uniName = (item.instituteName || 'Partner Institution').trim();

      const newUni = {
        id: uniId,
        name: uniName,
        short_name: item.aisheCode || item.instituteID || '',
        campus: item.location || item.stateName || 'Main Campus',
        city: item.location ? item.location.trim() : (item.stateName ? item.stateName.trim() : 'India'),
        state: item.stateName ? item.stateName.trim() : 'India',
        country: 'India',
        university_type: item.instituteType === 'Public' ? 'Government' : (item.instituteType || 'Private'),
        accreditation: item.nirfCategory ? `NIRF (${item.nirfCategory})` : 'UGC / AICTE Approved',
        ranking: item.nirF_Rank && item.nirF_Rank !== 'NA' && item.nirF_Rank !== '0' ? `NIRF Rank #${item.nirF_Rank}` : 'SII Empaneled',
        website: item.admURL ? (item.admURL.startsWith('http') ? item.admURL : 'https://' + item.admURL) : '',
        contact: item.hasScholarship ? 'Scholarship Available' : '',
        description: `Official Study in India (SII) empanelled institution. AISHE: ${item.aisheCode || item.instituteID || 'N/A'}.`,
        status: 'Active',
        is_active: 1,
        is_demo: 0
      };

      if (!seenMissingUniIds.has(uniId)) {
        seenMissingUniIds.add(uniId);
        missingUniversities.push(newUni);
      }
      uniByCode.set(code, newUni);
      uniByName.set(instName, newUni);
    }

    const courseId = `course_sii_${item.id}`;
    if (seenCourseIds.has(courseId)) continue;
    seenCourseIds.add(courseId);

    const ucId = `uc_sii_${item.id}`;
    const { level, degree } = mapLevel(item.programLevelD);
    const stream = mapStream(item.disciplineName);

    // Calculate duration in years
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

    // Master Course Record
    courseRecords.push({
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
      description: `Official Study in India course offering. Discipline: ${item.disciplineName || 'General'}. Mode: ${item.mode || 'Regular'}. Institute AISHE: ${item.aisheCode || item.instituteID || 'N/A'}.`,
      status: 'Active',
      intake: '2026-27',
      application_deadline: '2026-08-31',
      is_active: 1,
      is_demo: 0
    });

    // University Fee Structure Record
    feeRecords.push({
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
      remarks: `Study in India Academic Year 2026-27. Mode: ${item.mode || 'Offline'}.`,
      is_active: 1
    });
  }

  console.log(`Found ${missingUniversities.length} supplemental universities to register.`);
  console.log(`Prepared ${courseRecords.length} courses and ${feeRecords.length} fee structures.`);

  // --------------------------------------------------------------------------
  // A. SQLite Import
  // --------------------------------------------------------------------------
  console.log('\n4. Importing into local SQLite...');
  db.pragma('foreign_keys = OFF');

  // Insert supplemental universities if any
  if (missingUniversities.length > 0) {
    const insertUniStmt = db.prepare(`
      INSERT OR IGNORE INTO universities (
        id, name, short_name, campus, city, state, country, university_type,
        accreditation, ranking, website, contact, description, status, is_active, is_demo, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'))
    `);
    const uniTx = db.transaction(() => {
      for (const u of missingUniversities) {
        insertUniStmt.run(
          u.id, u.name, u.short_name, u.campus, u.city, u.state, u.country,
          u.university_type, u.accreditation, u.ranking, u.website, u.contact,
          u.description, u.status
        );
      }
    });
    uniTx();
    console.log(`  Added ${missingUniversities.length} supplemental universities to SQLite.`);
  }

  const insertCourseStmt = db.prepare(`
    INSERT INTO courses (
      id, university_id, university_name, course_name, short_name, course_level,
      degree_level, stream, duration, eligibility, entrance_requirement, fees_range,
      scholarship_info, description, status, intake, application_deadline, is_active, is_demo, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT (id) DO UPDATE SET
      university_name = excluded.university_name,
      course_name = excluded.course_name,
      stream = excluded.stream,
      duration = excluded.duration,
      fees_range = excluded.fees_range,
      scholarship_info = excluded.scholarship_info,
      updated_at = datetime('now')
  `);

  const insertFeeStmt = db.prepare(`
    INSERT INTO university_courses (
      id, university_id, course_id, tuition_fee_per_year, hostel_fee_per_year, one_time_fee,
      other_charges, total_first_year_fee, total_full_course_fee, currency,
      scholarship_available, scholarship_details, application_deadline,
      admission_process, eligibility_notes, remarks, is_active, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT (id) DO UPDATE SET
      tuition_fee_per_year = excluded.tuition_fee_per_year,
      total_full_course_fee = excluded.total_full_course_fee,
      currency = excluded.currency,
      scholarship_available = excluded.scholarship_available,
      scholarship_details = excluded.scholarship_details,
      updated_at = datetime('now')
  `);

  const runSqliteBatch = db.transaction(() => {
    for (const c of courseRecords) {
      insertCourseStmt.run(
        c.id, c.university_id, c.university_name, c.course_name, c.short_name,
        c.course_level, c.degree_level, c.stream, c.duration, c.eligibility,
        c.entrance_requirement, c.fees_range, c.scholarship_info, c.description,
        c.status, c.intake, c.application_deadline, c.is_active, c.is_demo
      );
    }
    for (const f of feeRecords) {
      insertFeeStmt.run(
        f.id, f.university_id, f.course_id, f.tuition_fee_per_year, f.hostel_fee_per_year,
        f.one_time_fee, f.other_charges, f.total_first_year_fee, f.total_full_course_fee,
        f.currency, f.scholarship_available, f.scholarship_details, f.application_deadline,
        f.admission_process, f.eligibility_notes, f.remarks, f.is_active
      );
    }
  });

  runSqliteBatch();
  db.pragma('foreign_keys = ON');

  const cCountSqlite = db.prepare('SELECT COUNT(*) as c FROM courses').get();
  const feeCountSqlite = db.prepare('SELECT COUNT(*) as c FROM university_courses').get();
  console.log(`SQLite courses count: ${cCountSqlite.c}`);
  console.log(`SQLite university_courses count: ${feeCountSqlite.c}`);
  db.close();

  // --------------------------------------------------------------------------
  // B. Neon PostgreSQL Import in Multi-Row Batches
  // --------------------------------------------------------------------------
  if (sql) {
    console.log('\n5. Importing courses and fees into Neon Cloud PostgreSQL...');

    // 5.0 Insert supplemental universities in Neon if any
    if (missingUniversities.length > 0) {
      for (const u of missingUniversities) {
        try {
          await sql.query(`
            INSERT INTO universities (
              id, name, short_name, campus, city, state, country, university_type,
              accreditation, ranking, website, contact, description, status, is_active, is_demo, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 1, 0, NOW())
            ON CONFLICT (name) DO NOTHING
          `, [
            u.id, u.name, u.short_name, u.campus, u.city, u.state, u.country,
            u.university_type, u.accreditation, u.ranking, u.website, u.contact,
            u.description, u.status
          ]);
        } catch (e) {}
      }
      console.log(`  Synced ${missingUniversities.length} supplemental universities to Neon.`);
    }

    const BATCH_SIZE = 100;

    // 5.1 Courses
    console.log(`  Importing ${courseRecords.length} courses into Neon in batches of ${BATCH_SIZE}...`);
    for (let i = 0; i < courseRecords.length; i += BATCH_SIZE) {
      const chunk = courseRecords.slice(i, i + BATCH_SIZE);
      const placeholders = [];
      const values = [];
      let pIdx = 1;

      for (const c of chunk) {
        placeholders.push(
          `($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, $${pIdx+8}, $${pIdx+9}, $${pIdx+10}, $${pIdx+11}, $${pIdx+12}, $${pIdx+13}, $${pIdx+14}, $${pIdx+15}, $${pIdx+16}, $${pIdx+17}, $${pIdx+18}, NOW())`
        );
        values.push(
          c.id, c.university_id, c.university_name, c.course_name, c.short_name,
          c.course_level, c.degree_level, c.stream, c.duration, c.eligibility,
          c.entrance_requirement, c.fees_range, c.scholarship_info, c.description,
          c.status, c.intake, c.application_deadline, c.is_active, c.is_demo
        );
        pIdx += 19;
      }

      const q = `
        INSERT INTO courses (
          id, university_id, university_name, course_name, short_name, course_level,
          degree_level, stream, duration, eligibility, entrance_requirement, fees_range,
          scholarship_info, description, status, intake, application_deadline, is_active, is_demo, updated_at
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          university_name = EXCLUDED.university_name,
          course_name = EXCLUDED.course_name,
          stream = EXCLUDED.stream,
          duration = EXCLUDED.duration,
          fees_range = EXCLUDED.fees_range,
          scholarship_info = EXCLUDED.scholarship_info,
          updated_at = NOW()
      `;

      try {
        await sql.query(q, values);
      } catch (err) {
        console.warn(`[Neon Courses Batch Error at ${i}]:`, err.message);
      }
      process.stdout.write(`    Courses: ${Math.min(i + BATCH_SIZE, courseRecords.length)} / ${courseRecords.length}...\r`);
    }
    console.log(`\n  All courses uploaded to Neon.`);

    // 5.2 University Courses (Fees)
    console.log(`  Importing ${feeRecords.length} fee structures into Neon in batches of ${BATCH_SIZE}...`);
    for (let i = 0; i < feeRecords.length; i += BATCH_SIZE) {
      const chunk = feeRecords.slice(i, i + BATCH_SIZE);
      const placeholders = [];
      const values = [];
      let pIdx = 1;

      for (const f of chunk) {
        placeholders.push(
          `($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, $${pIdx+8}, $${pIdx+9}, $${pIdx+10}, $${pIdx+11}, $${pIdx+12}, $${pIdx+13}, $${pIdx+14}, $${pIdx+15}, $${pIdx+16}, NOW())`
        );
        values.push(
          f.id, f.university_id, f.course_id, f.tuition_fee_per_year, f.hostel_fee_per_year,
          f.one_time_fee, f.other_charges, f.total_first_year_fee, f.total_full_course_fee,
          f.currency, f.scholarship_available, f.scholarship_details, f.application_deadline,
          f.admission_process, f.eligibility_notes, f.remarks, f.is_active
        );
        pIdx += 17;
      }

      const q = `
        INSERT INTO university_courses (
          id, university_id, course_id, tuition_fee_per_year, hostel_fee_per_year,
          one_time_fee, other_charges, total_first_year_fee, total_full_course_fee,
          currency, scholarship_available, scholarship_details, application_deadline,
          admission_process, eligibility_notes, remarks, is_active, updated_at
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          tuition_fee_per_year = EXCLUDED.tuition_fee_per_year,
          total_full_course_fee = EXCLUDED.total_full_course_fee,
          currency = EXCLUDED.currency,
          scholarship_available = EXCLUDED.scholarship_available,
          scholarship_details = EXCLUDED.scholarship_details,
          updated_at = NOW()
      `;

      try {
        await sql.query(q, values);
      } catch (err) {
        console.warn(`[Neon Fees Batch Error at ${i}]:`, err.message);
      }
      process.stdout.write(`    Fees: ${Math.min(i + BATCH_SIZE, feeRecords.length)} / ${feeRecords.length}...\r`);
    }
    console.log(`\n  All university fee structures uploaded to Neon.`);

    const cNeon = await sql.query('SELECT COUNT(*) as c FROM courses');
    const ucNeon = await sql.query('SELECT COUNT(*) as c FROM university_courses');
    console.log(`\nNeon Cloud Database Total Courses: ${cNeon[0].c}`);
    console.log(`Neon Cloud Database Total University Fees: ${ucNeon[0].c}`);
  }

  console.log('\n=== All Courses & University Fees Successfully Imported! ===');
}

run().catch(console.error);
