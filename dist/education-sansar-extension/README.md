# Education Sansar CRM - WhatsApp Web Copilot (Karya AI Style)

> **Supercharge WhatsApp Web with AI Admission Counseling, Live Lead Qualification, and 1-Click Knowledge Base Answers!**

---

## 🚀 Overview

The **Education Sansar CRM WhatsApp Web Copilot** is a Chrome Extension (Manifest V3) modeled after **Karya AI**, **Cooby**, and **Eazybe**. It embeds directly inside [web.whatsapp.com](https://web.whatsapp.com) to give education counselors an intelligent AI copilot while chatting with prospective students.

### ✨ Key Features

1. **Direct DOM WhatsApp Web Embed**:
   - Injects a sleek floating launcher and collapsible right-hand drawer right inside `https://web.whatsapp.com` using isolated Shadow DOM (zero CSS collisions with WhatsApp).
2. **Automatic Student Chat Detection**:
   - Detects the active WhatsApp conversation, extracts student name and phone number, and retrieves their profile from Education Sansar CRM in real time.
3. **AI Qualification Score & Dossier**:
   - Displays real-time qualification score (e.g. `85%`), target course (MBBS, B.Tech, MBA), preferred country/university, budget, and academic marks.
4. **Knowledge Base 1-Click Message Inserter**:
   - Instant search across all CRM Knowledge Base admission packages, fee structures, eligibility criteria, and document checklists.
   - Click **"💬 Insert into WhatsApp"** to automatically insert verified answers straight into WhatsApp Web's message input box!
5. **AI Counselor Reply Generator**:
   - Reads the student's question and drafts a helpful, professional counseling reply trained directly on your CRM knowledge base.
   - Review, edit, and insert into WhatsApp with one click.
6. **1-Click "Promote to Leads Tab"**:
   - Moves qualified WhatsApp inquiries into the CRM **Leads** tab with counselor assignment and verified attributes.
7. **Quick Lead Capture**:
   - Add new student contacts to the CRM without switching browser tabs.

---

## 📦 How to Install in Google Chrome (30 Seconds)

1. **Download the Extension**:
   - Download `education-sansar-extension.zip` from the CRM WhatsApp Web tab (`/whatsapp-web`) or unzip this directory:
     ```bash
     unzip education-sansar-extension.zip -d education-sansar-extension
     ```
2. **Open Extensions Page**:
   - In Google Chrome or Microsoft Edge, go to:
     `chrome://extensions`
3. **Enable Developer Mode**:
   - Toggle the switch labeled **Developer mode** in the top-right corner.
4. **Load Unpacked**:
   - Click the **"Load unpacked"** button in the top-left corner.
   - Select the `education-sansar-extension` folder.
5. **Open WhatsApp Web**:
   - Navigate to [https://web.whatsapp.com](https://web.whatsapp.com).
   - You will immediately see the green **⚡ CRM Copilot** launcher button on the right side of WhatsApp Web!

---

## ⚙️ Configuration

Click the extension icon in Chrome's toolbar to open the settings popup:
- **CRM API Endpoint**: `https://education-sansar-crm.vercel.app` (or `http://localhost:3000` for local dev)
- **Counselor Name**: Your counselor name (e.g., `Prakash Yadav`)
- **Counselor ID**: Your CRM ID (e.g., `c-prakash`)

---

## 🔒 Privacy & Permissions

- Uses Manifest V3 standards.
- Scoped permissions: `storage` and `activeTab`.
- Host permissions limited strictly to `https://web.whatsapp.com/*` and your CRM domain.
- Zero tracking or third-party ad networks. All data communicates directly with your Education Sansar CRM instance.
