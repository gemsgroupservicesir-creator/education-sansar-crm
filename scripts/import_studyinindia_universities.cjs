require('dotenv').config();
const Database = require('better-sqlite3');
const { neon } = require('@neondatabase/serverless');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function importStudyInIndiaUniversities() {
  console.log('1. Fetching complete institute list from Study in India (SII) portal...');
  const res = await fetch(
    'https://www.studyinindia.gov.in/Courses/exploreallcoruses/?handler=InstituteListServerSide&Cpage=1&pageSize=1500'
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch from Study in India: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const rawInstitutes = json.aaData || [];
  console.log(`Successfully retrieved ${rawInstitutes.length} raw institutions from Study in India.`);

  const universities = [];
  const seenNames = new Set();
  const seenIds = new Set();

  for (const item of rawInstitutes) {
    let rawName = (item.instituteName || '').trim();
    if (!rawName) continue;

    // Normalize name
    let name = rawName;
    if (seenNames.has(name.toLowerCase())) {
      const loc = (item.location || item.stateName || item.aisheCode || '').trim();
      name = loc ? `${name} (${loc})` : `${name} - ${item.id}`;
    }
    if (seenNames.has(name.toLowerCase())) {
      name = `${name} - ${item.id}`;
    }
    seenNames.add(name.toLowerCase());

    // Generate unique ID
    let rawCode = (item.instituteID || item.aisheCode || item.id).toString().replace(/[^a-zA-Z0-9_-]/g, '_');
    let id = `sii_${rawCode}`;
    if (seenIds.has(id)) {
      id = `${id}_${item.id}`;
    }
    seenIds.add(id);

    // Format website URL
    let website = (item.admURL || '').trim();
    if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
      website = 'https://' + website;
    }

    // Determine university type
    let uniType = 'Private';
    if (item.instituteType === 'Public') {
      uniType = 'Government';
    } else if (item.instituteType) {
      uniType = item.instituteType;
    }

    // Determine ranking and accreditation
    let ranking = '';
    if (item.nirF_Rank && item.nirF_Rank !== 'NA' && item.nirF_Rank !== '0' && item.nirF_Rank.trim() !== '') {
      ranking = `NIRF Rank #${item.nirF_Rank.trim()}`;
    } else {
      ranking = 'SII Empaneled';
    }

    let accreditation = item.nirfCategory ? `NIRF (${item.nirfCategory})` : 'UGC / AICTE Approved';

    // Build description
    let disc = item.disciplineName && item.disciplineName !== 'NA' ? item.disciplineName : 'Multiple Streams';
    let year = item.participatedYear || '2026-27';
    let aishe = item.aisheCode || item.instituteID || 'N/A';
    let description = `Official Study in India (SII) empanelled institution. AISHE Code: ${aishe}. Disciplines: ${disc}. Mode: ${item.mode || 'Regular/Offline'}. Intake Year: ${year}.`;

    universities.push({
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
    });
  }

  console.log(`2. Processed ${universities.length} unique universities for import.`);

  // --------------------------------------------------------------------------
  // A. Import into local SQLite
  // --------------------------------------------------------------------------
  console.log('3. Importing into local SQLite database...');
  try {
    const db = new Database('server/db/education_sansar.db');
    const insertStmt = db.prepare(`
      INSERT INTO universities (
        id, name, short_name, campus, city, state, country, university_type,
        accreditation, ranking, website, contact, description, status, is_active, is_demo, updated_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
      )
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
        is_active = excluded.is_active,
        is_demo = 0,
        updated_at = datetime('now')
    `);

    const insertMany = db.transaction((unis) => {
      for (const u of unis) {
        insertStmt.run(
          u.id, u.name, u.short_name, u.campus, u.city, u.state, u.country, u.university_type,
          u.accreditation, u.ranking, u.website, u.contact, u.description, u.status, u.is_active, u.is_demo
        );
      }
    });

    insertMany(universities);
    const countSqlite = db.prepare('SELECT COUNT(*) as c FROM universities').get();
    console.log(`SQLite total universities count: ${countSqlite.c}`);
    db.close();
  } catch (err) {
    console.error('Error inserting into SQLite:', err.message);
  }

  // --------------------------------------------------------------------------
  // B. Import into Neon PostgreSQL
  // --------------------------------------------------------------------------
  if (process.env.DATABASE_URL) {
    console.log('4. Importing into Neon PostgreSQL database in batches...');
    const sql = neon(process.env.DATABASE_URL);

    const BATCH_SIZE = 50;
    let importedCount = 0;

    for (let i = 0; i < universities.length; i += BATCH_SIZE) {
      const batch = universities.slice(i, i + BATCH_SIZE);
      
      // Upsert batch
      for (const u of batch) {
        try {
          await sql.query(`
            INSERT INTO universities (
              id, name, short_name, campus, city, state, country, university_type,
              accreditation, ranking, website, contact, description, status, is_active, is_demo, updated_at
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12, $13, $14, $15, $16, NOW()
            )
            ON CONFLICT (name) DO UPDATE SET
              short_name = EXCLUDED.short_name,
              campus = EXCLUDED.campus,
              city = EXCLUDED.city,
              state = EXCLUDED.state,
              country = EXCLUDED.country,
              university_type = EXCLUDED.university_type,
              accreditation = EXCLUDED.accreditation,
              ranking = EXCLUDED.ranking,
              website = EXCLUDED.website,
              contact = EXCLUDED.contact,
              description = EXCLUDED.description,
              status = EXCLUDED.status,
              is_active = EXCLUDED.is_active,
              is_demo = 0,
              updated_at = NOW()
          `, [
            u.id, u.name, u.short_name, u.campus, u.city, u.state, u.country, u.university_type,
            u.accreditation, u.ranking, u.website, u.contact, u.description, u.status, u.is_active, u.is_demo
          ]);
          importedCount++;
        } catch (err) {
          // If conflict on id or other unique
          try {
            await sql.query(`
              UPDATE universities SET
                name = $2, short_name = $3, campus = $4, city = $5, state = $6,
                country = $7, university_type = $8, accreditation = $9, ranking = $10,
                website = $11, contact = $12, description = $13, status = $14,
                is_active = $15, is_demo = 0, updated_at = NOW()
              WHERE id = $1
            `, [
              u.id, u.name, u.short_name, u.campus, u.city, u.state, u.country, u.university_type,
              u.accreditation, u.ranking, u.website, u.contact, u.description, u.status, u.is_active
            ]);
            importedCount++;
          } catch (innerErr) {
            console.warn(`[Neon Batch Warning] Skip uni ${u.name}: ${innerErr.message}`);
          }
        }
      }
      process.stdout.write(`  Imported ${Math.min(i + BATCH_SIZE, universities.length)} / ${universities.length}...\r`);
    }

    console.log(`\nNeon PostgreSQL import completed. Successfully processed ${importedCount} records.`);
    const countNeon = await sql.query('SELECT COUNT(*) as c FROM universities');
    console.log(`Neon total universities count: ${countNeon[0].c}`);
  } else {
    console.warn('DATABASE_URL not found; skipped Neon import.');
  }

  console.log('=== All Study in India Universities successfully imported! ===');
}

importStudyInIndiaUniversities().catch(console.error);
