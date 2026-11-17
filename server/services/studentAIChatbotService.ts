import { db, logLeadActivity, createNotification } from '../db/database.ts';
import { searchKnowledgeBase } from './knowledgeBaseService.ts';
import { callGeminiApi } from './aiSalesService.ts';
import { distributeLead } from './leadDistributionEngine.ts';
import type { Lead, Counselor, StudentAIChatResponse } from '../types/index.ts';

export interface StudentChatParams {
  message: string;
  leadId?: string;
  phone?: string;
  studentName?: string;
  chatHistory?: Array<{ sender: 'student' | 'ai'; message: string }>;
  source?: string;
}

/**
 * Main AI Agent Chatbot with Knowledge Base Retrieval & Lead Qualification / Nurturing
 */
export async function chatWithStudent(params: StudentChatParams): Promise<StudentAIChatResponse> {
  const { message, leadId, phone, studentName, chatHistory = [], source = 'Website Chat' } = params;

  if (!message || !message.trim()) {
    throw new Error('Student message is required');
  }

  const cleanMessage = message.trim();
  const cleanPhone = phone?.trim() || '';

  // 1. Extract Lead Qualification Data from message and conversation context
  const extracted = extractQualificationData(cleanMessage, chatHistory);

  // 2. Match or Resolve Lead
  let lead: any = null;
  if (leadId) {
    lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  } else if (cleanPhone) {
    const rawDigits = cleanPhone.replace(/[^0-9]/g, '');
    const searchSuffix = rawDigits.length >= 8 ? rawDigits.slice(-8) : rawDigits;
    lead = db.prepare(`
      SELECT * FROM leads 
      WHERE replace(replace(replace(phone, ' ', ''), '-', ''), '+', '') LIKE ?
         OR replace(replace(replace(whatsapp_number, ' ', ''), '-', ''), '+', '') LIKE ?
      ORDER BY created_at DESC LIMIT 1
    `).get(`%${searchSuffix}%`, `%${searchSuffix}%`);
  }

  // If no lead found and phone is present, auto-create a lead for tracking
  if (!lead && cleanPhone) {
    const newLeadId = 'lead-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const assignedC = distributeLead({
      preferred_course: extracted.data?.course || 'Undecided',
      preferred_university: extracted.data?.university || extracted.data?.country || 'Not Specified',
      city: 'Kathmandu',
      source
    });
    const now = new Date().toISOString();
    const sName = extracted.studentName || studentName?.trim() || 'WhatsApp Student';
    const names = sName.split(' ');
    const fName = names[0] || 'Student';
    const lName = names.slice(1).join(' ') || 'Inquiry';

    db.prepare(`
      INSERT INTO leads (
        id, lead_id, student_name, first_name, last_name, phone, whatsapp_number,
        email, country, city, preferred_course, preferred_university, lead_source,
        assigned_counselor_id, assigned_counselor_name, lead_status, lead_temperature,
        qualification_score, qualification_status, qualification_summary, qualification_details,
        ai_chat_summary, ai_chat_count, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Nepal', 'Kathmandu', ?, ?, ?, ?, ?, 'New Lead', 'WARM', 20, 'In Progress', 'Inquired via AI Chatbot', '{}', ?, 1, ?, ?)
    `).run(
      newLeadId,
      'ES-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      sName,
      fName,
      lName,
      cleanPhone,
      cleanPhone,
      `student.${Date.now()}@inquiry.education-sansar.com`,
      extracted.data?.course || 'Undecided',
      extracted.data?.university || extracted.data?.country || 'Not Specified',
      source,
      assignedC?.counselorId || null,
      assignedC?.counselorName || null,
      cleanMessage.slice(0, 150),
      now,
      now
    );

    lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(newLeadId);
  }

  // 3. Resolve Assigned Counselor Profile & WhatsApp Chat Link
  let counselor: any = null;
  if (lead?.assigned_counselor_id) {
    counselor = db.prepare('SELECT * FROM counselors WHERE id = ?').get(lead.assigned_counselor_id);
  }
  if (!counselor) {
    counselor = db.prepare('SELECT * FROM counselors WHERE is_active = 1 ORDER BY current_active_leads ASC LIMIT 1').get();
  }

  const counselorPhone = counselor?.whatsapp_number || counselor?.phone || '+977 9801234567';
  const cleanCounselorDigits = counselorPhone.replace(/[^0-9]/g, '');
  const counselorWaUrl = `https://wa.me/${cleanCounselorDigits}`;

  // Parse existing qualification data
  let existingDetails: any = {};
  try {
    existingDetails = typeof lead?.qualification_details === 'string'
      ? JSON.parse(lead.qualification_details || '{}')
      : (lead?.qualification_details || {});
  } catch {}

  const mergedDetails = { ...existingDetails, ...extracted.data };

  // Calculate Qualification Score (0-100)
  const qualificationScore = calculateQualificationScore(mergedDetails, cleanMessage);
  let qualificationStatus: 'Unqualified' | 'In Progress' | 'Qualified' | 'High Intent' = 'Unqualified';
  if (qualificationScore >= 75) {
    qualificationStatus = 'High Intent';
  } else if (qualificationScore >= 50) {
    qualificationStatus = 'Qualified';
  } else if (qualificationScore >= 25) {
    qualificationStatus = 'In Progress';
  }

  // Generate concise qualification summary
  const summaryParts: string[] = [];
  if (mergedDetails.course) summaryParts.push(`Course: ${mergedDetails.course}`);
  if (mergedDetails.marks) summaryParts.push(`Marks: ${mergedDetails.marks}`);
  if (mergedDetails.university || mergedDetails.country) summaryParts.push(`Target: ${mergedDetails.university || mergedDetails.country}`);
  if (mergedDetails.budget) summaryParts.push(`Budget: ${mergedDetails.budget}`);
  if (mergedDetails.intake) summaryParts.push(`Intake: ${mergedDetails.intake}`);
  if (mergedDetails.entranceExam) summaryParts.push(`Exam: ${mergedDetails.entranceExam}`);
  const qualificationSummary = summaryParts.length > 0 ? summaryParts.join(' | ') : 'Exploring study opportunities';

  // 4. Retrieve Relevant Knowledge from Knowledge Base
  const matchedKnowledge = searchKnowledgeBase({
    query: cleanMessage,
    course: mergedDetails.course || lead?.preferred_course,
    university: mergedDetails.university || lead?.preferred_university,
    limit: 4
  });

  // Top knowledge item
  const topMatch = matchedKnowledge.length > 0 ? matchedKnowledge[0] : null;

  // 5. Generate AI Counseling Response (Gemini API with Fallback)
  let botReply = '';
  let mode: 'Gemini Generative' | 'Admission Sales Engine' = 'Admission Sales Engine';

  // Construct context from knowledge base
  const kbContextText = matchedKnowledge.map((k, idx) => `
[Knowledge Item ${idx + 1}]
Title: ${k.title}
Category: ${k.category}
Question: ${k.question}
Verified Counseling Answer:
${k.answer}
Suggested Follow-up Qualifying Prompt: ${k.qualifying_question || 'None'}
Nurturing CTA: ${k.nurturing_cta || 'Connect with counselor'}
`).join('\n---\n');

  const counselorIntroText = counselor 
    ? `Assigned Counselor: ${counselor.name} (${counselor.designation || 'Senior Admission Counselor'}, WhatsApp: ${counselorPhone}, Direct link: ${counselorWaUrl})`
    : 'Gems Group Services Admissions Desk (WhatsApp: +977 9801234567)';

  const systemInstruction = `You are the empathetic, expert Senior AI Admissions Counselor at Gems Group Services (GGS), Nepal & India's leading admission consultancy.
Your mission is twofold:
1. Answer the student's question accurately, clearly, and enthusiastically using ONLY the provided verified Knowledge Base context.
2. Qualify and nurture the student so they take the next step towards booking a seat or connecting with their assigned counselor.

Grounding Rules:
- Strictly adhere to verified fees, colleges, and eligibility in the Knowledge Base. Never invent medical/engineering fees or criteria.
- Keep responses friendly, encouraging, well-formatted with bullet points, and concise (under 180 words).
- Address common student concerns (fees, safety, scholarships, mess/food for Nepali students) warmly.

Lead Qualification & Nurturing Rule:
- After answering the student's inquiry, naturally ask 1 smart follow-up qualifying question (e.g. asking for their +2/12th marks or GPA, their preferred annual budget, or whether they want Fall 2026 intake).
- If the student shows high interest, asks about seat reservation, or gives their marks, proactively introduce their assigned counselor: ${counselor?.name || 'our senior counselor'} and provide their direct WhatsApp link: ${counselorWaUrl}.`;

  const conversationHistoryText = chatHistory.slice(-4).map(h => `${h.sender === 'student' ? 'Student' : 'AI Counselor'}: ${h.message}`).join('\n');

  const prompt = `
STUDENT PROFILE:
Name: ${lead?.student_name || studentName || 'Prospective Student'}
Phone: ${cleanPhone || 'WhatsApp'}
Current Qualification Level: ${qualificationStatus} (Score: ${qualificationScore}/100)
Extracted Profile Info: ${qualificationSummary}
${counselorIntroText}

RECENT CONVERSATION HISTORY:
${conversationHistoryText || 'No previous messages'}

VERIFIED KNOWLEDGE BASE CONTEXT:
${kbContextText || 'General Gems Group Services university and medical admissions counseling guidelines.'}

CURRENT STUDENT INQUIRY:
"${cleanMessage}"

Generate your helpful, knowledgeable counseling response now. Remember to ground your answer in the knowledge base, naturally include 1 qualifying follow-up question, and include the counselor's contact when ready.`;

  try {
    const geminiResult = await callGeminiApi(prompt, systemInstruction);
    if (geminiResult && geminiResult.trim().length >= 30) {
      botReply = geminiResult.trim();
      mode = 'Gemini Generative';
    }
  } catch (err: any) {
    console.warn('[StudentAI] Gemini call failed, using intelligent rule-based fallback:', err.message);
  }

  // Rule-based Fallback if Gemini is unavailable
  if (!botReply) {
    if (topMatch) {
      let replyParts: string[] = [];
      replyParts.push(topMatch.answer);

      // Add qualifying follow-up
      if (topMatch.qualifying_question) {
        replyParts.push(`\n\n📌 Quick Question to Guide You: ${topMatch.qualifying_question}`);
      } else {
        replyParts.push('\n\n📌 May I know your +2/12th GPA or percentage so I can check your exact scholarship eligibility?');
      }

      // Add nurturing CTA with counselor
      if (qualificationScore >= 50 && counselor) {
        replyParts.push(`\n\n💬 Direct Counselor Support: Our ${counselor.designation || 'Senior Admission Counselor'} ${counselor.name} is available right now to assist you with free seat booking & document verification. You can chat directly on WhatsApp: ${counselorWaUrl}`);
      } else if (topMatch.nurturing_cta) {
        replyParts.push(`\n\n✨ Next Step: ${topMatch.nurturing_cta}`);
      }

      botReply = replyParts.join('');
    } else {
      botReply = `Hello! Thank you for reaching out to Gems Group Services Admissions. We specialize in top-ranked MBBS, Engineering, Management, and IT admissions across premier institutions in India and Bangladesh with scholarships up to 50%!\n\nCould you please share which course you are interested in (e.g. B.Tech, MBBS, MBA, BCA) and your approximate GPA or marks in +2/12th?\n\nYou can also connect directly with your dedicated admission counselor ${counselor?.name || 'at Gems Group'} on WhatsApp at ${counselorWaUrl} for personalized guidance!`;
    }
  }

  // 6. Update Lead in CRM if lead exists
  // 6. Update Lead Record & Audit Trail in Database
  if (lead) {
    try {
      const isNowHot = qualificationScore >= 75 || lead.lead_temperature === 'HOT';
      const newTemperature = isNowHot ? 'HOT' : qualificationScore >= 50 ? 'WARM' : (lead.lead_temperature || 'WARM');

      // Promote to 'Qualified' status in the Leads Tab when qualification criteria is met
      let updatedStatus = lead.lead_status;
      if (qualificationScore >= 50 || qualificationStatus === 'Qualified' || qualificationStatus === 'High Intent') {
        if (lead.lead_status === 'New Lead' || lead.lead_status === 'Inquiry' || !lead.lead_status) {
          updatedStatus = 'Qualified';
        }
      }

      // Resolved student name from extracted context or input
      let resolvedName = lead.student_name;
      if (!resolvedName || resolvedName === 'WhatsApp Student' || resolvedName === 'Student') {
        if (extracted.studentName) {
          resolvedName = extracted.studentName;
        } else if (studentName && studentName !== 'WhatsApp Student') {
          resolvedName = studentName;
        }
      }

      const nameParts = resolvedName.split(' ');
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || 'Inquiry';

      // Parse 12th percentage number if available
      let parsedPercentage: number | null = null;
      if (mergedDetails.marks) {
        const mMatch = mergedDetails.marks.match(/(\d{2}(?:\.\d+)?)\s*%/);
        if (mMatch) parsedPercentage = parseFloat(mMatch[1]);
      }

      // Update lead with complete captured qualification profile
      db.prepare(`
        UPDATE leads SET
          student_name = ?,
          first_name = ?,
          last_name = ?,
          lead_status = ?,
          lead_temperature = ?,
          qualification_score = ?,
          qualification_status = ?,
          qualification_summary = ?,
          qualification_details = ?,
          ai_chat_summary = ?,
          ai_chat_count = COALESCE(ai_chat_count, 0) + 1,
          preferred_course = CASE WHEN preferred_course = 'Undecided' AND ? IS NOT NULL THEN ? ELSE COALESCE(?, preferred_course) END,
          preferred_university = CASE WHEN preferred_university = 'Not Specified' AND ? IS NOT NULL THEN ? ELSE COALESCE(?, preferred_university) END,
          budget = COALESCE(?, budget),
          percentage_12th = COALESCE(?, percentage_12th),
          academic_qualification = COALESCE(?, academic_qualification),
          entrance_exam = COALESCE(?, entrance_exam),
          last_contact_date = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        resolvedName,
        firstName,
        lastName,
        updatedStatus,
        newTemperature,
        qualificationScore,
        qualificationStatus,
        qualificationSummary,
        JSON.stringify(mergedDetails),
        `Student: "${cleanMessage.slice(0, 100)}..." -> AI qualified (${qualificationStatus})`,
        mergedDetails.course || null,
        mergedDetails.course || null,
        mergedDetails.course || null,
        mergedDetails.university || mergedDetails.country || null,
        mergedDetails.university || mergedDetails.country || null,
        mergedDetails.university || mergedDetails.country || null,
        mergedDetails.budget || null,
        parsedPercentage,
        mergedDetails.marks || null,
        mergedDetails.entranceExam || null,
        lead.id
      );

      // Log Lead Activity
      logLeadActivity({
        leadId: lead.id,
        activityType: 'Lead Qualified',
        title: `🎯 Student Lead Qualified by AI (${qualificationScore}%)`,
        description: `Student chatted with AI Counselor and qualified with score ${qualificationScore}% (${qualificationStatus}). Captured Details:\n• Course: ${mergedDetails.course || 'Undecided'}\n• Country/University: ${mergedDetails.university || mergedDetails.country || 'N/A'}\n• Marks/GPA: ${mergedDetails.marks || 'N/A'}\n• Budget: ${mergedDetails.budget || 'N/A'}\n• Intake: ${mergedDetails.intake || 'N/A'}\nStatus updated to ${updatedStatus} in Leads tab.`,
        performedBy: 'GGS AI Counselor'
      });

      // Record in messages log
      const msgId = 'AI-MSG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      db.prepare(`
        INSERT INTO messages (id, lead_id, channel, recipient, sender, content, status, sent_at)
        VALUES (?, ?, 'WhatsApp', ?, 'GGS AI Counselor', ?, 'Sent', datetime('now'))
      `).run(
        msgId,
        lead.id,
        lead.student_name || cleanPhone || 'Student',
        botReply
      );

      // 7. If Lead Reached Qualified / High Intent, Trigger Counselor Alert
      if (qualificationScore >= 50 && lead.assigned_counselor_id) {
        createNotification({
          userId: counselor?.user_id,
          counselorId: lead.assigned_counselor_id,
          title: `🎯 Qualified Lead Added to Leads Tab: ${resolvedName}`,
          message: `${resolvedName} (${cleanPhone}) has reached ${qualificationScore}% qualification score via AI Chatbot (${qualificationSummary}) and moved to your Leads tab for closing.`,
          type: 'LEAD_QUALIFIED',
          entityType: 'lead',
          entityId: lead.id
        });
      }
    } catch (e: any) {
      console.warn('[StudentAI] CRM update warning:', e.message);
    }
  }

  return {
    success: true,
    reply: botReply,
    matchedKnowledge: matchedKnowledge.map(k => ({
      id: k.id,
      title: k.title,
      category: k.category,
      snippet: k.snippet,
      relevanceScore: k.relevanceScore
    })),
    qualification: {
      score: qualificationScore,
      status: qualificationStatus,
      summary: qualificationSummary,
      extractedData: mergedDetails,
      suggestedFollowupQuestion: topMatch?.qualifying_question || 'What is your +2 percentage or GPA?',
      isQualified: qualificationScore >= 50
    },
    counselor: counselor ? {
      id: counselor.id,
      name: counselor.name,
      phone: counselorPhone,
      email: counselor.email,
      waChatUrl: counselorWaUrl
    } : undefined,
    lead: lead ? {
      id: lead.id,
      lead_id: lead.lead_id,
      student_name: lead.student_name,
      phone: lead.phone,
      preferred_course: mergedDetails.course || lead.preferred_course,
      preferred_university: mergedDetails.university || lead.preferred_university,
      lead_temperature: qualificationScore >= 75 ? 'HOT' : lead.lead_temperature
    } : undefined,
    mode
  };
}

/**
 * Heuristic Extractor: Extract course, marks, budget, intake, and entrance exam mentions
 */
function extractQualificationData(message: string, history: Array<{ sender: string; message: string }> = []): { data: any; studentName?: string } {
  const fullText = (history.map(h => h.message).join(' ') + ' ' + message).toLowerCase();
  const data: any = {};
  let studentName: string | undefined;

  // 0. Student Name Extraction (e.g. "I am Rohan Karki", "My name is Priya Sharma")
  const nameMatch = message.match(/(?:i\s*am|my\s*name\s*is|this\s*is|myself)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch && nameMatch[1]) {
    const rawName = nameMatch[1].trim();
    if (!/interested|looking|student|inquiring|calling|from|want|seeking/i.test(rawName)) {
      studentName = rawName;
    }
  }

  // 1. Course Extraction
  if (/b\.?\s?tech|engineering|cse|computer science|ai\s?\&?\s?ml|mechanical|civil/i.test(fullText)) {
    data.course = 'B.Tech Computer Science / Engineering';
  } else if (/mbbs|doctor|medical\s?college|bds/i.test(fullText)) {
    data.course = 'MBBS / Medical';
  } else if (/mba|pgdm|management|master of business/i.test(fullText)) {
    data.course = 'MBA / Management';
  } else if (/bba|bachelor of business/i.test(fullText)) {
    data.course = 'BBA';
  } else if (/bca|computer applications|it degree/i.test(fullText)) {
    data.course = 'BCA';
  } else if (/nursing|b\.?\s?sc\s?nursing/i.test(fullText)) {
    data.course = 'B.Sc Nursing';
  } else if (/b\.?\s?pharm|pharmacy/i.test(fullText)) {
    data.course = 'B.Pharm';
  }

  // 2. Marks / Percentage / GPA Extraction
  const gpaMatch = fullText.match(/\b(?:gpa\s*[:=-]?\s*([234]\.\d{1,2})|([234]\.\d{1,2})\s*gpa)\b/i);
  if (gpaMatch) {
    data.marks = `GPA ${gpaMatch[1] || gpaMatch[2]}`;
  } else {
    const pctMatch = fullText.match(/\b([5-9][0-9](?:\.\d+)?)\s*(?:%|percent|percentage)\b/i);
    if (pctMatch) {
      data.marks = `${pctMatch[1]}%`;
    } else if (/\b(?:first division|distinction|first class)\b/i.test(fullText)) {
      data.marks = 'First Division (60%+)';
    }
  }

  // 3. Target University or Country
  if (/bangladesh|dhaka/i.test(fullText)) {
    data.country = 'Bangladesh';
  } else if (/india|delhi|bangalore|punjab|chennai/i.test(fullText)) {
    data.country = 'India';
  }

  if (/srm\b/i.test(fullText)) {
    data.university = 'SRM Institute of Science and Technology';
  } else if (/chandigarh\s?university|cu\b/i.test(fullText)) {
    data.university = 'Chandigarh University';
  } else if (/sharda\b/i.test(fullText)) {
    data.university = 'Sharda University';
  } else if (/vit\b|vellore/i.test(fullText)) {
    data.university = 'VIT Vellore';
  } else if (/kumudini/i.test(fullText)) {
    data.university = "Kumudini Women's Medical College";
  } else if (/dhaka national/i.test(fullText)) {
    data.university = 'Dhaka National Medical College';
  }

  // 4. Budget Extraction
  const budgetMatch = fullText.match(/\b(\d{1,2}(?:\s?-\s?\d{1,2})?)\s*(?:lakh|lakhs|lacs|l)\b/i);
  if (budgetMatch) {
    data.budget = `${budgetMatch[1]} Lakhs`;
  } else if (/\b(?:3[0-9]|4[0-9]|50)\s*(?:k|\,000)?\s*(?:usd|\$)\b/i.test(fullText)) {
    data.budget = '35k - 45k USD (MBBS Full Package)';
  } else if (/scholarship|low fee|affordable|cheap/i.test(fullText)) {
    data.budget = 'Seeking Max Merit Scholarship';
  }

  // 5. Intake Timeline
  if (/2026|fall\s?2026|this year|immediately|august/i.test(fullText)) {
    data.intake = 'Fall 2026';
  } else if (/2027|next year/i.test(fullText)) {
    data.intake = '2027';
  }

  // 6. Entrance Exam
  if (/\bneet\b/i.test(fullText)) {
    data.entranceExam = 'NEET';
  } else if (/\bcee\b/i.test(fullText)) {
    data.entranceExam = 'CEE (Nepal MEC)';
  } else if (/\bioe\b/i.test(fullText)) {
    data.entranceExam = 'IOE Entrance';
  } else if (/\bjee\b/i.test(fullText)) {
    data.entranceExam = 'JEE Main';
  }

  return { data, studentName };
}

/**
 * Score computation algorithm
 */
function calculateQualificationScore(details: any, latestMessage: string): number {
  let score = 15; // Base engagement

  if (details.course) score += 20;
  if (details.marks) score += 25;
  if (details.university || details.country) score += 15;
  if (details.budget) score += 15;
  if (details.intake) score += 10;
  if (details.entranceExam) score += 10;

  // Direct intent keywords
  if (/admission|fees?|apply|seat|booking|scholarship|enroll|register/i.test(latestMessage)) {
    score += 10;
  }

  return Math.min(100, Math.max(15, score));
}
