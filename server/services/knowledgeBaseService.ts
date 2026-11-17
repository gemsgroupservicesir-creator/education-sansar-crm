import { db } from '../db/database.ts';
import type { KnowledgeItem, KnowledgeCategory } from '../types/index.ts';

export interface KnowledgeSearchParams {
  query: string;
  course?: string;
  university?: string;
  limit?: number;
}

export interface MatchedKnowledgeResult {
  id: string;
  title: string;
  category: string;
  question: string;
  answer: string;
  qualifying_question?: string;
  nurturing_cta?: string;
  importance: number;
  relevanceScore: number;
  snippet: string;
}

/**
 * Get all knowledge base items with optional filtering
 */
export function getKnowledgeBase(filters?: {
  category?: string;
  search?: string;
  isActive?: number;
  limit?: number;
  offset?: number;
}): { items: KnowledgeItem[]; total: number } {
  try {
    // Check if table is empty, if so, seed default items
    const countCheck = db.prepare('SELECT count(*) as count FROM knowledge_base').get() as { count: number };
    if (!countCheck || countCheck.count === 0) {
      seedDefaultKnowledgeBase();
    }

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (filters?.category && filters.category !== 'All') {
      whereClauses.push('category = ?');
      params.push(filters.category);
    }

    if (filters?.isActive !== undefined && filters.isActive !== -1) {
      whereClauses.push('is_active = ?');
      params.push(filters.isActive);
    }

    if (filters?.search && filters.search.trim()) {
      const s = `%${filters.search.trim()}%`;
      whereClauses.push('(title LIKE ? OR question LIKE ? OR answer LIKE ? OR keywords LIKE ?)');
      params.push(s, s, s, s);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const total = (db.prepare(`SELECT count(*) as count FROM knowledge_base ${whereSql}`).get(...params) as { count: number }).count;

    const limit = filters?.limit ? Math.max(1, filters.limit) : 50;
    const offset = filters?.offset ? Math.max(0, filters.offset) : 0;

    const items = db.prepare(`
      SELECT * FROM knowledge_base
      ${whereSql}
      ORDER BY importance DESC, updated_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as KnowledgeItem[];

    // Parse JSON fields
    const parsed = items.map(item => ({
      ...item,
      alternate_questions: typeof item.alternate_questions === 'string' ? safeJsonParse(item.alternate_questions, []) : item.alternate_questions,
      keywords: typeof item.keywords === 'string' ? safeJsonParse(item.keywords, []) : item.keywords,
      target_courses: typeof item.target_courses === 'string' ? safeJsonParse(item.target_courses, []) : item.target_courses,
      target_universities: typeof item.target_universities === 'string' ? safeJsonParse(item.target_universities, []) : item.target_universities,
    }));

    return { items: parsed, total };
  } catch (err: any) {
    console.error('[KnowledgeBase] getKnowledgeBase error:', err);
    return { items: [], total: 0 };
  }
}

/**
 * Get single knowledge item
 */
export function getKnowledgeItem(id: string): KnowledgeItem | null {
  try {
    const item = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(id) as KnowledgeItem | undefined;
    if (!item) return null;
    return {
      ...item,
      alternate_questions: typeof item.alternate_questions === 'string' ? safeJsonParse(item.alternate_questions, []) : item.alternate_questions,
      keywords: typeof item.keywords === 'string' ? safeJsonParse(item.keywords, []) : item.keywords,
      target_courses: typeof item.target_courses === 'string' ? safeJsonParse(item.target_courses, []) : item.target_courses,
      target_universities: typeof item.target_universities === 'string' ? safeJsonParse(item.target_universities, []) : item.target_universities,
    };
  } catch {
    return null;
  }
}

/**
 * Create a new knowledge item
 */
export function createKnowledgeItem(data: {
  title: string;
  category: KnowledgeCategory;
  question: string;
  alternate_questions?: string[] | string;
  answer: string;
  keywords?: string[] | string;
  target_courses?: string[] | string;
  target_universities?: string[] | string;
  qualifying_question?: string;
  nurturing_cta?: string;
  importance?: number;
  is_active?: number;
  source_type?: 'Manual' | 'Trained Document' | 'Pre-seeded';
  created_by?: string;
}): KnowledgeItem {
  const id = 'KB-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const altQuestionsJson = Array.isArray(data.alternate_questions) 
    ? JSON.stringify(data.alternate_questions) 
    : typeof data.alternate_questions === 'string' && data.alternate_questions.trim()
      ? JSON.stringify(data.alternate_questions.split('\n').map(s => s.trim()).filter(Boolean))
      : '[]';

  const keywordsJson = Array.isArray(data.keywords)
    ? JSON.stringify(data.keywords)
    : typeof data.keywords === 'string' && data.keywords.trim()
      ? JSON.stringify(data.keywords.split(',').map(s => s.trim().toLowerCase()).filter(Boolean))
      : '[]';

  const coursesJson = Array.isArray(data.target_courses)
    ? JSON.stringify(data.target_courses)
    : typeof data.target_courses === 'string' && data.target_courses.trim()
      ? JSON.stringify(data.target_courses.split(',').map(s => s.trim()).filter(Boolean))
      : '[]';

  const unisJson = Array.isArray(data.target_universities)
    ? JSON.stringify(data.target_universities)
    : typeof data.target_universities === 'string' && data.target_universities.trim()
      ? JSON.stringify(data.target_universities.split(',').map(s => s.trim()).filter(Boolean))
      : '[]';

  db.prepare(`
    INSERT INTO knowledge_base (
      id, title, category, question, alternate_questions, answer,
      keywords, target_courses, target_universities, qualifying_question,
      nurturing_cta, importance, is_active, times_used, source_type,
      created_by, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
  `).run(
    id,
    data.title.trim(),
    data.category || 'General FAQ',
    data.question.trim(),
    altQuestionsJson,
    data.answer.trim(),
    keywordsJson,
    coursesJson,
    unisJson,
    data.qualifying_question?.trim() || null,
    data.nurturing_cta?.trim() || null,
    data.importance !== undefined ? data.importance : 5,
    data.is_active !== undefined ? data.is_active : 1,
    data.source_type || 'Manual',
    data.created_by || 'Super Admin',
    now,
    now
  );

  return getKnowledgeItem(id)!;
}

/**
 * Update an existing knowledge item
 */
export function updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): KnowledgeItem {
  const existing = getKnowledgeItem(id);
  if (!existing) throw new Error(`Knowledge item ${id} not found`);

  const now = new Date().toISOString();

  let altQuestionsJson = typeof existing.alternate_questions === 'string' 
    ? existing.alternate_questions 
    : JSON.stringify(existing.alternate_questions || []);
  if (updates.alternate_questions !== undefined) {
    altQuestionsJson = Array.isArray(updates.alternate_questions)
      ? JSON.stringify(updates.alternate_questions)
      : typeof updates.alternate_questions === 'string'
        ? JSON.stringify(updates.alternate_questions.split('\n').map(s => s.trim()).filter(Boolean))
        : '[]';
  }

  let keywordsJson = typeof existing.keywords === 'string'
    ? existing.keywords
    : JSON.stringify(existing.keywords || []);
  if (updates.keywords !== undefined) {
    keywordsJson = Array.isArray(updates.keywords)
      ? JSON.stringify(updates.keywords)
      : typeof updates.keywords === 'string'
        ? JSON.stringify(updates.keywords.split(',').map(s => s.trim().toLowerCase()).filter(Boolean))
        : '[]';
  }

  let coursesJson = typeof existing.target_courses === 'string'
    ? existing.target_courses
    : JSON.stringify(existing.target_courses || []);
  if (updates.target_courses !== undefined) {
    coursesJson = Array.isArray(updates.target_courses)
      ? JSON.stringify(updates.target_courses)
      : typeof updates.target_courses === 'string'
        ? JSON.stringify(updates.target_courses.split(',').map(s => s.trim()).filter(Boolean))
        : '[]';
  }

  let unisJson = typeof existing.target_universities === 'string'
    ? existing.target_universities
    : JSON.stringify(existing.target_universities || []);
  if (updates.target_universities !== undefined) {
    unisJson = Array.isArray(updates.target_universities)
      ? JSON.stringify(updates.target_universities)
      : typeof updates.target_universities === 'string'
        ? JSON.stringify(updates.target_universities.split(',').map(s => s.trim()).filter(Boolean))
        : '[]';
  }

  db.prepare(`
    UPDATE knowledge_base SET
      title = ?,
      category = ?,
      question = ?,
      alternate_questions = ?,
      answer = ?,
      keywords = ?,
      target_courses = ?,
      target_universities = ?,
      qualifying_question = ?,
      nurturing_cta = ?,
      importance = ?,
      is_active = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    updates.title !== undefined ? updates.title.trim() : existing.title,
    updates.category !== undefined ? updates.category : existing.category,
    updates.question !== undefined ? updates.question.trim() : existing.question,
    altQuestionsJson,
    updates.answer !== undefined ? updates.answer.trim() : existing.answer,
    keywordsJson,
    coursesJson,
    unisJson,
    updates.qualifying_question !== undefined ? updates.qualifying_question?.trim() || null : existing.qualifying_question,
    updates.nurturing_cta !== undefined ? updates.nurturing_cta?.trim() || null : existing.nurturing_cta,
    updates.importance !== undefined ? updates.importance : existing.importance,
    updates.is_active !== undefined ? updates.is_active : existing.is_active,
    now,
    id
  );

  return getKnowledgeItem(id)!;
}

/**
 * Delete knowledge item
 */
export function deleteKnowledgeItem(id: string): boolean {
  const result = db.prepare('DELETE FROM knowledge_base WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Multi-stage search in knowledge base with relevance scoring
 */
export function searchKnowledgeBase(params: KnowledgeSearchParams): MatchedKnowledgeResult[] {
  const { query, course, university, limit = 5 } = params;
  if (!query || !query.trim()) return [];

  const rawQuery = query.toLowerCase().trim();
  const cleanTokens = rawQuery
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 2 && !STOP_WORDS.has(token));

  const items = db.prepare(`
    SELECT * FROM knowledge_base
    WHERE is_active = 1
    ORDER BY importance DESC
  `).all() as any[];

  if (items.length === 0) {
    seedDefaultKnowledgeBase();
    return searchKnowledgeBase(params);
  }

  const scoredResults: MatchedKnowledgeResult[] = [];

  for (const item of items) {
    let score = 0;
    const itemQuestion = (item.question || '').toLowerCase();
    const itemTitle = (item.title || '').toLowerCase();
    const itemAnswer = (item.answer || '').toLowerCase();
    const itemCategory = (item.category || '').toLowerCase();

    const altQuestions: string[] = safeJsonParse(item.alternate_questions, []).map((q: string) => q.toLowerCase());
    const keywords: string[] = safeJsonParse(item.keywords, []).map((k: string) => k.toLowerCase());
    const targetCourses: string[] = safeJsonParse(item.target_courses, []).map((c: string) => c.toLowerCase());
    const targetUnis: string[] = safeJsonParse(item.target_universities, []).map((u: string) => u.toLowerCase());

    // 1. Exact string match
    if (itemQuestion.includes(rawQuery) || rawQuery.includes(itemQuestion)) {
      score += 120;
    }

    // 2. Alternate questions match
    for (const altQ of altQuestions) {
      if (altQ.includes(rawQuery) || rawQuery.includes(altQ)) {
        score += 100;
        break;
      }
    }

    // 3. Title match
    if (itemTitle.includes(rawQuery) || rawQuery.includes(itemTitle)) {
      score += 60;
    }

    // 4. Token matching
    for (const token of cleanTokens) {
      if (itemQuestion.includes(token)) score += 25;
      if (itemTitle.includes(token)) score += 20;
      if (keywords.some(k => k.includes(token) || token.includes(k))) score += 30;
      if (targetCourses.some(c => c.includes(token) || token.includes(c))) score += 35;
      if (targetUnis.some(u => u.includes(token) || token.includes(u))) score += 35;
      if (itemAnswer.includes(token)) score += 10;
      if (itemCategory.includes(token)) score += 15;
    }

    // 5. Course / University boost if explicitly provided
    if (course) {
      const cLower = course.toLowerCase();
      if (targetCourses.some(c => c.includes(cLower) || cLower.includes(c)) || itemAnswer.includes(cLower)) {
        score += 40;
      }
    }

    if (university) {
      const uLower = university.toLowerCase();
      if (targetUnis.some(u => u.includes(uLower) || uLower.includes(u)) || itemAnswer.includes(uLower)) {
        score += 40;
      }
    }

    // 6. Importance boost (1-10)
    score += (item.importance || 5) * 2;

    if (score >= 25) {
      scoredResults.push({
        id: item.id,
        title: item.title,
        category: item.category,
        question: item.question,
        answer: item.answer,
        qualifying_question: item.qualifying_question,
        nurturing_cta: item.nurturing_cta,
        importance: item.importance,
        relevanceScore: score,
        snippet: item.answer.length > 200 ? item.answer.substring(0, 200) + '...' : item.answer
      });
    }
  }

  // Sort by highest score
  scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topResults = scoredResults.slice(0, limit);

  // Increment usage count for top results asynchronously
  try {
    for (const res of topResults) {
      db.prepare('UPDATE knowledge_base SET times_used = times_used + 1 WHERE id = ?').run(res.id);
    }
  } catch {}

  return topResults;
}

/**
 * Intelligent Document / Text Parser: Extract Q&As from raw text
 */
export async function trainFromRawText(params: {
  title: string;
  category: KnowledgeCategory;
  rawText: string;
  createdBy?: string;
}): Promise<KnowledgeItem[]> {
  const { title, category, rawText, createdBy } = params;
  if (!rawText || rawText.trim().length < 20) {
    throw new Error('Please provide at least 20 characters of text to extract knowledge');
  }

  const generatedItems: KnowledgeItem[] = [];

  // Split paragraphs / numbered bullet points
  const blocks = rawText
    .split(/\n{2,}|\r\n{2,}|\n(?=[0-9]+\.|\*|-|•|Q:)/)
    .map(b => b.trim())
    .filter(b => b.length >= 25);

  if (blocks.length === 0) {
    blocks.push(rawText.trim());
  }

  for (let i = 0; i < Math.min(blocks.length, 8); i++) {
    const block = blocks[i];
    let q = '';
    let a = block;

    // Detect if block has a question format (e.g. "Q: ... A: ..." or line ending with "?")
    const questionMatch = block.match(/^(?:Q\d*[:.-]?\s*|Question[:.-]?\s*)?([^\n?]+[?])\s*(.*)$/is);
    if (questionMatch && questionMatch[1]) {
      q = questionMatch[1].trim();
      a = questionMatch[2]?.trim() || block;
    } else {
      // Derive title/question from first sentence or title
      const lines = block.split('\n').filter(Boolean);
      if (lines.length > 1) {
        q = lines[0].replace(/^[0-9*•-]+\.?\s*/, '').trim();
        a = lines.slice(1).join('\n').trim();
      } else {
        q = `What are the details regarding ${title} (Part ${i + 1})?`;
        a = block;
      }
    }

    if (q.length < 5) q = `Information on ${title}`;

    const keywords = [
      ...title.toLowerCase().split(/\s+/),
      ...q.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w))
    ].slice(0, 10);

    const item = createKnowledgeItem({
      title: `${title} - Section ${i + 1}`,
      category,
      question: q,
      answer: a,
      keywords: Array.from(new Set(keywords)),
      qualifying_question: 'Would you like more details on fee structure, admission criteria, or direct counseling?',
      nurturing_cta: 'Chat directly with your assigned Gems Group Services admission counselor for customized seat booking.',
      importance: 7,
      source_type: 'Trained Document',
      created_by: createdBy || 'Super Admin'
    });

    generatedItems.push(item);
  }

  return generatedItems;
}

/**
 * Seed high-converting, authentic Gems Group Services Admissions Q&A Knowledge Base
 */
export function seedDefaultKnowledgeBase(): void {
  const existingCount = (db.prepare('SELECT count(*) as count FROM knowledge_base').get() as any)?.count || 0;
  if (existingCount > 0) return;

  const defaultKnowledge: Array<Parameters<typeof createKnowledgeItem>[0]> = [
    {
      title: 'MBBS in Bangladesh Eligibility & Fee Structure 2026',
      category: 'Course Admissions',
      question: 'Can Nepali students study MBBS in Bangladesh and what are the fees and eligibility?',
      alternate_questions: [
        'What is the fee for MBBS in Bangladesh for Nepali students?',
        'Bangladesh MBBS eligibility criteria for Nepal',
        'Top medical colleges in Bangladesh for MBBS',
        'Kumudini Medical College fees and admission'
      ],
      answer: 'Yes! Bangladesh is one of the premier destinations for Nepali MBBS students due to high BMDC/NMC/MEC pass rates and clinical exposure. Key details:\n• Total Package: 35,000 USD to 45,000 USD for the entire 5-year MBBS including hostel.\n• Eligibility: Minimum GPA 7.0 combined in SSC/10th and HSC/12th, with minimum GPA 3.5 in Biology (minimum 60% in Bio).\n• Recognition: Degree recognized by Nepal Medical Council (NMC), Medical Education Commission (MEC), WHO, and ECFMG.\n• Top Colleges: Kumudini Women\'s Medical College, Dhaka National Medical College, Anwer Khan Modern, Bangladesh Medical College.',
      keywords: ['mbbs', 'bangladesh', 'medical', 'dhaka', 'kumudini', 'nmc', 'gpa', 'biology', 'doctor', 'mec'],
      target_courses: ['MBBS', 'BDS'],
      target_universities: ['Kumudini Women Medical College', 'Dhaka National Medical College', 'Anwer Khan Modern Medical College'],
      qualifying_question: 'What is your GPA or percentage in +2 Science (Physics, Chemistry, and Biology)?',
      nurturing_cta: 'Connect directly with our Bangladesh MBBS specialist counselor for free DGHS equivalence calculation & seat reservation.',
      importance: 10,
      source_type: 'Pre-seeded'
    },
    {
      title: 'B.Tech Computer Science & AI Admissions in India (SRM & Chandigarh University)',
      category: 'Course Admissions',
      question: 'How can Nepali students get admission in B.Tech Computer Science in SRM, VIT, or Chandigarh University?',
      alternate_questions: [
        'B.Tech CSE admission in India without entrance',
        'SRM University B.Tech fees for Nepali students',
        'Chandigarh University scholarship for Nepal',
        'Best engineering college in India for Nepali students'
      ],
      answer: 'Nepali students can apply for direct merit admissions and international quota seats at premier Indian institutions like SRM University, Chandigarh University, and VIT:\n• Courses Offered: B.Tech in CSE, AI & Machine Learning, Data Science, Cyber Security, and Cloud Computing.\n• Fee Range: 1.5 Lakh to 3.5 Lakh INR per year depending on university & specialization.\n• Scholarships: Up to 50% tuition scholarship based on +2 marks (Grade 12 aggregate).\n• Eligibility: 60%+ aggregate in Physics, Chemistry, and Mathematics (PCM).\n• Campus Facilities: World-class laboratories, high-speed WiFi, dedicated international student hostels, and multi-cuisine mess serving Nepali meals.',
      keywords: ['b.tech', 'cse', 'computer science', 'engineering', 'srm', 'chandigarh university', 'vit', 'india', 'ai', 'scholarship'],
      target_courses: ['B.Tech', 'B.Tech CSE', 'B.Tech AI & ML', 'Computer Engineering'],
      target_universities: ['SRM Institute of Science and Technology', 'Chandigarh University', 'Sharda University'],
      qualifying_question: 'What was your PCM (Physics, Chemistry, Math) percentage or expected grade in +2?',
      nurturing_cta: 'Our engineering admission desk can verify your +2 marks right now to lock in up to 50% tuition scholarship.',
      importance: 9,
      source_type: 'Pre-seeded'
    },
    {
      title: 'Scholarship Opportunities for Nepali & International Students',
      category: 'Fee & Scholarships',
      question: 'What scholarships are available for Nepali students studying in India?',
      alternate_questions: [
        'How to get 100% or 50% scholarship in Indian universities?',
        'Study in India scholarship criteria',
        'Gems Group Services admission scholarship discount'
      ],
      answer: 'Gems Group Services partners directly with top Indian universities to offer significant merit-based and early-bird scholarship concessions for Nepali applicants:\n• Merit Scholarships: 25% to 50% waiver on tuition fees based on 10th and 12th marks.\n• Girl Child / Women in STEM Scholarships: Additional 10% to 15% concession.\n• Early Admission Concession: Application fee waivers and locked tuition fee bands when applying before deadlines.\n• Study in India (SII) Portal Scholarships: Assistance with SII registration for partner university quota grants.',
      keywords: ['scholarship', 'discount', 'concession', 'waiver', 'free', 'merit', 'study in india', 'sii', 'fee'],
      target_courses: ['B.Tech', 'BBA', 'BCA', 'MBA', 'B.Sc Nursing', 'B.Pharm'],
      target_universities: ['Chandigarh University', 'Sharda University', 'SRM University', 'Lovely Professional University'],
      qualifying_question: 'What is your target budget per year including hostel and tuition?',
      nurturing_cta: 'Send your marksheet to our counselor on WhatsApp for instant scholarship pre-approval within 2 hours.',
      importance: 9,
      source_type: 'Pre-seeded'
    },
    {
      title: 'MBBS in Nepal vs Bangladesh Comparison & CEE Requirements',
      category: 'Eligibility & Deadlines',
      question: 'Do I need CEE/MEC exam for MBBS in Bangladesh or India?',
      alternate_questions: [
        'Is CEE compulsory for studying MBBS abroad?',
        'CEE entrance requirements for Nepal Medical Council eligibility',
        'Can I go to Bangladesh without CEE score?'
      ],
      answer: 'Important Regulatory Update from Medical Education Commission (MEC) & Nepal Medical Council (NMC):\n• CEE Examination: To obtain an Eligibility Certificate (NOC) from Nepal Government to study MBBS abroad, candidates must appear in and pass the MEC CEE entrance exam.\n• If you qualified CEE in Nepal: You are directly eligible to secure seats in Bangladesh and India with full NOC sanction.\n• NEET Score: Indian medical colleges also require a valid NEET qualification.\n• If you haven\'t given CEE: You can register for the upcoming CEE intake or explore alternative healthcare courses like B.Pharm, B.Sc Biotech, or Healthcare Management.',
      keywords: ['cee', 'mec', 'nmc', 'mbbs', 'nepal', 'bangladesh', 'entrance', 'exam', 'neet', 'noc'],
      target_courses: ['MBBS', 'BDS', 'B.Pharm', 'B.Sc Nursing'],
      target_universities: ['Kathmandu University', 'Tribhuvan University', 'Kumudini Medical College'],
      qualifying_question: 'Did you appear in the latest MEC CEE exam or are you preparing for the next session?',
      nurturing_cta: 'Talk with our medical counseling director to assess your score and match available government-approved medical seats.',
      importance: 8,
      source_type: 'Pre-seeded'
    },
    {
      title: 'Document Checklist for University Admissions in India & Bangladesh',
      category: 'Visa & Documentation',
      question: 'What documents are required to apply for Indian and Bangladesh universities?',
      alternate_questions: [
        'Document list for college admission in India from Nepal',
        'Is passport compulsory for Nepali student in India?',
        'Bangladesh student visa documents'
      ],
      answer: 'Standard document checklist for Nepali students:\n1. Academic Credentials: Grade 10 (SEE) Marksheet & Character Certificate, Grade 12 (+2) Transcript, Provisional, and Migration Certificate.\n2. Identification: Citizenship Certificate (Nagrikta) OR valid Passport (Passport required for Bangladesh, Citizenship or Passport valid for India).\n3. Photographs: 8 to 10 passport-sized color photos with white background.\n4. Entrance Scorecard: CEE / NEET / IOE / JEE scorecard (if applicable).\n5. Medical Fitness Certificate (for Bangladesh and health science courses).\n6. Ministry of Education (MOE) NOC: Our office assists you in getting your official NOC from Sanothimi, Bhaktapur seamlessly.',
      keywords: ['documents', 'passport', 'citizenship', 'nagrikta', 'see', 'marksheet', 'transcript', 'noc', 'visa'],
      target_courses: ['All Courses'],
      target_universities: ['All Partner Universities'],
      qualifying_question: 'Do you have your +2 transcript and citizenship/passport handy in digital format?',
      nurturing_cta: 'You can upload your documents safely in your CRM portal or send directly to your counselor for quick verification.',
      importance: 8,
      source_type: 'Pre-seeded'
    },
    {
      title: 'MBA & Post-Graduate Management in Top Indian Cities',
      category: 'Course Admissions',
      question: 'Which colleges are best for Nepali students pursuing MBA in Bangalore or Delhi?',
      alternate_questions: [
        'MBA admission in India fees and placements',
        'Bangalore MBA colleges for Nepali students',
        'Direct MBA admission without CAT or MAT'
      ],
      answer: 'Bangalore, Pune, and Delhi-NCR are the premier hubs for Nepali MBA aspirants with direct access to corporate internships and placements:\n• Top Specializations: Business Analytics, Financial Tech, Digital Marketing, Supply Chain, and HR.\n• Average Fee: 3.5 Lakh to 7.5 Lakh INR for the full 2-year program including industrial trips.\n• Eligibility: Bachelor\'s degree in any discipline (BBA, BBS, B.Com, B.Tech) with minimum 50% aggregate.\n• Placements: High placement record with international and Indian MNCs (TCS, Deloitte, Amazon, Infosys).',
      keywords: ['mba', 'management', 'bangalore', 'bba', 'pgdm', 'placements', 'delhi', 'pune', 'business'],
      target_courses: ['MBA', 'PGDM', 'BBA'],
      target_universities: ['Chandigarh University', 'Sharda University', 'Acharya Institute of Management'],
      qualifying_question: 'What was your undergraduate degree (BBA/BBS/B.Tech) and your graduation percentage?',
      nurturing_cta: 'Schedule a free profile review call with our senior MBA career counselor to shortlist top corporate-linked campuses.',
      importance: 7,
      source_type: 'Pre-seeded'
    },
    {
      title: 'Hostel Facilities, Food & Student Safety for Nepali Students',
      category: 'General FAQ',
      question: 'Are there good hostel facilities and Nepali food available in partner colleges?',
      alternate_questions: [
        'Is Nepali food available in hostel mess in India?',
        'Safety for female students in campus hostels',
        'Hostel room options AC and Non-AC'
      ],
      answer: 'Yes! Student safety, hygiene, and dietary comfort are top priorities at all partner university campuses:\n• Dedicated Hostels: Separate, fully secured hostels for male and female students with biometric entry, 24/7 CCTV surveillance, and resident wardens.\n• Food & Mess: Four meals daily (breakfast, lunch, evening snacks, dinner). Most partner campuses in Punjab, Delhi, and Bangalore feature Nepali cooks and dishes (Dal-Bhat-Tarkari, chicken/veg curry).\n• Room Amenities: Options include 2-seater, 3-seater, AC, and Non-AC rooms with attached bathrooms, study tables, and geysers.\n• Medical Assistance: On-campus hospitals and clinics providing round-the-clock emergency medical care.',
      keywords: ['hostel', 'food', 'mess', 'nepali food', 'safety', 'girls hostel', 'ac', 'security', 'accommodation'],
      target_courses: ['All Courses'],
      target_universities: ['All Partner Universities'],
      qualifying_question: 'Do you prefer AC or Non-AC hostel accommodation, or 2-seater vs 3-seater sharing?',
      nurturing_cta: 'Our counselor can share campus hostel walkthrough videos and meal menu photos with you right away.',
      importance: 7,
      source_type: 'Pre-seeded'
    },
    {
      title: 'Application Deadlines & Fall 2026 Intake Timeline',
      category: 'Eligibility & Deadlines',
      question: 'When is the last date to apply for 2026 admission intake in India and Bangladesh?',
      alternate_questions: [
        'Admission deadlines for 2026 intake',
        'When do classes start in India colleges for Nepali students?',
        'Early seat booking process'
      ],
      answer: 'Key Timeline for 2026 Academic Admissions:\n• Early Bird Seat Booking & Scholarships: Open now through May 2026 (highest scholarship brackets available).\n• Regular Application Window: June to July 2026.\n• Bangladesh DGHS Equivalence & MBBS Deadlines: Usually closes by August/September 2026.\n• Session Commencement: Most Indian universities commence classes in August-September 2026.\n• Advice: Popular specializations like B.Tech CSE, AI, and top MBBS colleges fill seats fast. Early provisional seat booking with 10th/12th admit card is strongly recommended to guarantee your seat.',
      keywords: ['deadline', 'intake', '2026', 'last date', 'application deadline', 'seat booking', 'commencement'],
      target_courses: ['All Courses'],
      target_universities: ['All Partner Universities'],
      qualifying_question: 'Are you planning to enroll immediately in the upcoming 2026 intake?',
      nurturing_cta: 'Lock your seat before early-bird scholarship quota closes — click to chat with your counselor on WhatsApp.',
      importance: 8,
      source_type: 'Pre-seeded'
    }
  ];

  for (const item of defaultKnowledge) {
    createKnowledgeItem(item);
  }
}

function safeJsonParse(val: any, fallback: any): any {
  if (Array.isArray(val)) return val;
  if (!val || typeof val !== 'string') return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'did', 'do',
  'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having',
  'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it',
  'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself'
]);
