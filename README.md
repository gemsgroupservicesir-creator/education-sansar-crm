# Education Sansar CRM 🎓
### Full-Stack Student Recruitment & Admission Management System

**Education Sansar** is a specialized Education Counselling and University Admission Consultancy headquartered at:
> **Office Address:** Sector 94, Noida, Uttar Pradesh 201313  
> **Target Markets:** Nepal (Kathmandu, Birgunj, Janakpur, Biratnagar, Butwal, Bhairahawa, Lahan, Rajbiraj) & India (Delhi, Noida, Bangalore, Chennai, Mumbai, Pune).

---

## 🌟 Executive Summary & Architectural Overview

Education Sansar CRM is an enterprise-grade, high-performance web CRM designed specifically for international and domestic education student recruitment workflows. It eliminates lead loss, prevents duplicate registrations across platforms, automates counselor workload balancing, and tracks prospective students from their initial Meta Lead Ad click all the way through counseling, university application, offer letter issuance, fee payment, and confirmed enrollment.

### Key Highlights
- **100% Original UI & Implementation:** Custom blue corporate identity (`#1E3A8A`, `#2563EB`, `#0284C7`), responsive layouts, intuitive workflows, zero third-party proprietary dependencies.
- **Relational Integrity with SQLite (WAL Mode):** Full ACID-compliant relational schema with 24 normalized tables, foreign key constraints, and performance indexes.
- **Multi-Channel Lead Ingestion:** Inbound pipelines for Meta Lead Ads (Facebook & Instagram), website inquiries, phone walk-ins, and bulk CSV imports.
- **Intelligent Duplicate Prevention (Section 8):** Multi-point matching on sanitized Phone, WhatsApp number, Email, and Meta Lead ID with interactive "View Lead", "Merge Lead", or "Create Anyway" choices.
- **Automatic Counselor Assignment Engine:** Configurable Round Robin fair-share rotation, geographic city-matching (e.g. Birgunj desk vs. Delhi desk), course specialization, and manual routing.
- **14-Stage Admission Pipeline Kanban:** Drag-and-drop or one-click stage progression tracking from *New Lead* to *Admission Confirmed*.
- **Comprehensive Management Intelligence:** Real-time calculation of **CPL** (Cost Per Lead = Ad Spend / Leads) and **CPA** (Cost Per Admission = Ad Spend / Admissions), conversion rates, and counselor performance velocity.
- **Safety First for Integrations:** Default `NOT CONNECTED` states for Meta and WhatsApp until live credentials are configured, backed by built-in interactive test simulators.

---

## 🏗️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS v3, React Router v6, Lucide Icons, Recharts |
| **Backend** | Node.js, Express, TypeScript (`tsx`), CORS, Dotenv |
| **Database** | SQLite3 via `better-sqlite3` with Write-Ahead Logging (`WAL`), Foreign Keys enabled |
| **Integrations** | Meta Graph API (Lead Ads Webhooks), WhatsApp Cloud API, CSV Parser |

---

## 📊 Complete Database Schema (24 Relational Tables)

All tables are created in `server/db/schema.ts` and stored in `server/db/education_sansar.db`:

1. `users` — System accounts across 6 RBAC roles.
2. `counselors` — Counselors with active assignment status, city specialization, capacity limit, and active lead count.
3. `leads` — Complete 360° prospective student record.
4. `lead_duplicates` — Log of detected duplicate contact attempts.
5. `lead_activities` — Immutable chronological timeline of every note, status change, call, and document upload.
6. `followups` — Scheduled follow-up tasks with due timestamps, reminders, and outcome notes.
7. `applications` — Multi-university applications linked to leads and students.
8. `students` — Admitted and enrolled student repository with full historical linkage.
9. `universities` — Partner universities, accreditation, location, contact officers.
10. `courses` — Degree programs, eligibility criteria, annual tuition fees.
11. `student_documents` — Uploaded educational transcripts, citizenship/passports, and verification status.
12. `campaigns` — Marketing campaigns (Meta, Google, Offline, School Seminars) with budget and spend.
13. `notifications` — In-app alerts for assigned leads, due follow-ups, and offer letters.
14. `integrations` — Status and encrypted credentials for external providers (Meta, WhatsApp, SMS).
15. `integration_logs` — Inbound/outbound webhook payloads and HTTP response logs.
16. `message_templates` — Approved WhatsApp and SMS notification templates.
17. `whatsapp_queue` — Queue for asynchronous template dispatch.
18. `settings` — Key-value operational parameters (office address, assignment mode, SLA hours).
19. `audit_logs` — Security and administrative compliance log.
20. `lead_notes` — Internal counselor collaboration notes.
21. `lead_tags` — Dynamic segmenting tags (e.g. `NEET Aspirant`, `Urgent`, `Scholarship`).
22. `lead_tag_mappings` — Many-to-many relationship between leads and tags.
23. `counselor_assignment_history` — Complete audit trail of lead ownership transfers.
24. `fee_payments` — University tuition and consultancy fee payment records.

---

## 🚀 Getting Started & Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
```bash
# Clone and enter directory
cd education-sansar-crm

# Install dependencies
npm install
```

### 3. Seed Demo Database
Populates 6 realistic counselors, 35+ leads across Nepal & India, 10 partner universities, 20 courses, follow-ups, applications, admitted students, campaigns, and templates:
```bash
npm run seed
```

### 4. Running the Application

#### Option A: Production Fullstack Server (Unified Port 5001)
Builds the React client and serves both API and UI from a single unified server:
```bash
npm run build:client
npm run start
```
Open your browser at: **`http://localhost:5001`**

#### Option B: Concurrent Development Mode
Runs Express server on port `5001` and Vite Hot Module Reloading (HMR) dev server on port `5173`:
```bash
npm run dev
```
Open your browser at: **`http://localhost:5173`**

---

## 👥 Role-Based Access Control (RBAC) & Demo Switcher

The CRM features a zero-friction **Active Role Switcher** in the top navigation header to test permissions as different staff members without logging in and out:

| Role | Default Access | Sample Person |
|---|---|---|
| **Super Admin** | Full root access, System Settings, Audit Trail, Integrations, Counselor Toggles, Exports | Suman Sharma |
| **Admin** | Operations, Lead Reassignment, University Approvals, Counselor Performance, Reports | Sita Thapa |
| **Counselor** | Personal "My Leads" workbench, Call Logs, WhatsApp outreach, Applications, Student conversion | Ramesh Gupta |
| **Telecaller** | First contact intake, Qualification, Setting initial follow-ups, Reassigning to counselor | Anjali Khadka |
| **Marketing Manager** | Campaigns management, Meta Lead Forms, CPL/CPA marketing ROI analysis | Rajesh Mahato |
| **Management** | Read-only executive reports, conversion funnels, cross-market yield metrics | Birendra Jha |

---

## 📱 Integrated Modules & Workflows

### 1. Lead Intake & 4-Point Duplicate Detection
- Inbound leads pass through `checkDuplicate(phone, whatsapp, email, fb_lead_id)`.
- If matched, an interactive **Duplicate Resolution Modal** allows the counselor or telecaller to inspect the existing student, merge new notes, or proceed.

### 2. Automated Lead Distribution Engine
- **Round Robin:** Fair-share rotation across all active counselors (`is_active = 1`).
- **City Specialization:** Nepal leads (Kathmandu, Birgunj, Janakpur, Biratnagar, Butwal, Bhairahawa) routed to Nepal specialist counselors; Indian inquiries routed to India counselors.
- **Auto 24-hr Follow-up SLA:** New leads automatically schedule an initial contact task.

### 3. Personal Counselor Workbench ("My Leads")
- Filter leads by Urgency, Follow-up Today, Overdue, and Pipeline Stage.
- One-click modals to record call notes, schedule follow-ups, and trigger WhatsApp messages.

### 4. 14-Stage Admission Pipeline Kanban
Visual board with stages:
1. *New Lead*
2. *Contacted*
3. *Counseling Scheduled*
4. *Counseling Done*
5. *Course Finalized*
6. *Documents Requested*
7. *Documents Received*
8. *Application Submitted*
9. *Application Under Review*
10. *Offer Letter Received*
11. *Conditional Offer*
12. *Fee Paid*
13. *Admission Confirmed*
14. *Enrolled Student*

### 5. Multi-Application & Enrolled Student Preservation
- Students can apply to multiple universities (e.g. VIT Vellore, SRM, Sharda) simultaneously.
- When marked as *Admission Confirmed*, the lead converts into an **Enrolled Student** while preserving 100% of historical calls, counseling notes, and documents.

### 6. External Integrations & Webhook Simulators
- **Meta Lead Ads:** Live webhook endpoint at `/api/integrations/meta/webhook` with verify token `education_sansar_meta_verify_2026`.
- **Interactive Simulator:** Test button in the Integrations panel generates simulated Facebook/Instagram leads, runs duplicate checking, and routes them in real-time.
- **WhatsApp Cloud API:** Official message template manager and interactive test dispatcher.

### 7. Executive Reports & CSV Export
- Instant CSV export for **Leads**, **Applications**, and **Students**.
- Visual funnel drop-off analysis from initial inquiry to enrollment.
- Full marketing CAC, CPL, and CPA performance breakdown.

---

## 🔒 Security & Privacy
- Zero technical stack traces exposed in API responses or UI alerts.
- Immutable audit log records every status change, counselor reassignment, and configuration update.
- External API tokens are masked and stored securely in environment variables.

---

## 🏢 Corporate Headquarters
**Education Sansar**  
Sector 94, Noida, Uttar Pradesh 201313  
Admissions Desk: `admissions@educationsansar.com` | `+91 120 4567890`  
*Guiding students across Nepal and India toward world-class higher education.*
