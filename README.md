# 🎫 TicketScan

<div align="center">

![TicketScan Banner](https://img.shields.io/badge/TicketScan-AI%20Document%20Intelligence-f59e0b?style=for-the-badge&logo=ticketmaster&logoColor=black)

**Next-Generation Multi-Modal Travel Document Intelligence & Forensic Tamper Detection System**

[![Next.js](https://img.shields.io/badge/Next.js-16%20(App%20Router)-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![AI Vision](https://img.shields.io/badge/AI%20Vision-Claude%20%7C%20GPT--4o%20%7C%20Gemini-orange?style=flat-square&logo=openai)](https://anthropic.com/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)](https://github.com/Desterhub/TicketScan)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)](LICENSE)

[Live Demo](https://ticketscan-xndj.onrender.com) · [Key Features](#-core-capabilities) · [System Architecture](#-system-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-endpoints)

</div>

---

## 📌 Executive Summary

**TicketScan** is a production-grade, enterprise-ready web application engineered to ingest, extract, parse, and verify multi-modal travel documents (Flight e-tickets, High-Speed Rail confirmations, and Intercity Bus vouchers) in PDF and image formats. 

Beyond standard OCR extraction, TicketScan implements an **algorithmic and computer-vision forensic pipeline** designed to detect digital tampering, text manipulations, unauthorized date modifications, and font splice anomalies commonly found in fraudulent expense reports and visa claims.

---

## ✨ Core Capabilities

### 🧠 1. Multi-Modal AI Extraction Engine
- **Cross-Carrier Ingestion**: Ingests boarding passes and tickets from major international airlines (IATA format), Indian Railways (IRCTC PNRs), European rail (SNCF, Deutsche Bahn), Amtrak, and intercity coach operators (FlixBus, Megabus, RedBus).
- **Hybrid Intelligent Fallback**: Uses LLM Vision models (**Anthropic Claude 3.5 Sonnet**, **OpenAI GPT-4o**, or **Google Gemini 1.5 Pro**) with an automated, offline heuristic pattern fallback ensuring **zero-downtime** processing.
- **Structured Schema Serialization**: Extracts 18+ high-fidelity normalized data points:
  - Transport Category (`flight`, `train`, `bus`)
  - Universal PNR / Reservation Reference
  - Carrier & Flight / Train / Bus Number
  - Boarding Point & Destination (with IATA / Station resolution)
  - ISO-8601 Departure & Arrival Timestamps
  - Seat Class, Coach, Berth / Gate Allocation
  - Passenger Manifest (Names, Ages, Seat Numbers)
  - Fare Breakdown, Taxes, and Booking Status (`Confirmed`, `RAC`, `Waitlisted`, `Cancelled`)

### 🔍 2. Forensic Digital Tamper Detection
- **Error Level Analysis (ELA)**: Recompresses images at specific quantization matrices using `Sharp` to detect high-frequency compression variances indicative of image resaving, spliced text, or edited digits.
- **PDF Revision & Incremental Save Auditing**: Inspects raw PDF bytecode for multiple cross-reference table (`xref`) updates, trailing modification flags, or suspicious editing software metadata (e.g., Photoshop, Canva, PDFescape).
- **Metadata Consistency Verification**: Cross-references internal PDF Creation Dates with Operating System modification timestamps to flag temporal discrepancies.
- **Font & Typeface Anomaly Scrutiny**: Flags mixed embedded and non-embedded fonts within uniform document tables.

### 🎨 3. Skewed Aviation & Boarding Pass UI System
- **Physical Ticket-Stub Design Language**: Bespoke boarding-pass aesthetics featuring notched perforations, custom monospace flight telemetry stamps, dynamic status badges, and expandable forensic telemetry drawers.
- **Cinematic Portal Splash Transition**: 13-second high-definition atmospheric intro sequence with seamless camera crossfade through an illuminated gateway landing directly into the scanner console.
- **Zero-Friction Mobile Responsiveness**: Precision layouts engineered with CSS Grid and Tailwind utilities, tested for ultra-wide displays down to 360px mobile viewports.
- **Credential Autofill Traps**: Custom security attributes eliminating unsolicited browser and password manager auto-fills.

### 🛡️ 4. Enterprise Security & Administration
- **Row-Level Security (RLS)**: Enforced via PostgreSQL policies in Supabase; regular travelers have strict compartmentalization, viewing only their own vault records.
- **Audited Admin Master Console**: High-privilege command center featuring live metrics, system tamper distributions, user management, and instant multi-format reports (**Excel / CSV**).
- **Rate-Limited Authentication**: Dual bcrypt hashing, stateless HttpOnly JWT cookies, and rate-limiting (5 failed attempts per 15 minutes) with security audit logging.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Interface (Next.js 16)"]
        A[Portal Splash / Login] --> B[Passenger Console]
        A --> C[Forensic Admin Console]
        B --> D[Multi-File Dropzone]
    end

    subgraph Gateway ["Next.js Serverless Gateway"]
        D --> E[/api/upload & Storage Vault]
        E --> F[/api/extract]
        E --> G[/api/tamper-check]
    end

    subgraph Intelligence ["Forensics & AI Pipeline"]
        F --> H{Live AI Provider Available?}
        H -- Yes --> I[Claude 3.5 / GPT-4o / Gemini Vision]
        H -- No --> J[Offline Heuristic Regex Extractor]
        G --> K[Sharp Error Level Analysis]
        G --> L[PDF Bytecode & EXIF Parser]
    end

    subgraph Persistence ["Data & Security Layer"]
        I & J --> M[(Supabase PostgreSQL)]
        K & L --> M
        E --> N[Private Supabase Bucket: tickets_vault]
        M --> O[PostgreSQL Row-Level Security]
    end

    Client -.->|Stateless JWT Cookie| Gateway
```

---

## 💻 Tech Stack & Engineering Choices

| Layer | Technologies | Rationale |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.4** (Turbopack, App Router) | Sub-second cold starts, Partial Prerendering (PPR), and React Server Components. |
| **Language** | **TypeScript 5** | Strict end-to-end type safety across extraction payloads, database schemas, and API contracts. |
| **Styling** | **Tailwind CSS + Vanilla CSS** | Custom design tokens, glassmorphic filters, and print-ready stylesheets. |
| **Animation** | **Framer Motion 12** | Physics-based interactive gestures, layout transitions, and cinematic splash choreography. |
| **Database** | **Supabase (PostgreSQL 15)** | ACID-compliant relation modeling, automated indexes, and bulletproof Row-Level Security. |
| **Storage** | **Supabase Storage** | Encrypted multi-tenant file storage with private bucket isolation (`tickets_vault`). |
| **Image Processing**| **Sharp (libvips)** | Ultra-fast native C++ image manipulation for ELA recompression and luminance difference maps. |
| **PDF Parsing** | **pdf-parse** | Low-overhead streaming PDF text extraction and document catalog inspection. |
| **Auth & Sessions**| **Jose (JWT) + Bcryptjs** | Cryptographically signed, stateless, tamper-proof session tokens stored in HttpOnly cookies. |

---

## 📂 Project Structure

```
TicketScan/
├── public/
│   ├── videos/              # Native 1080p/720p intro cinematic sequences
│   └── fonts/               # Tailored typography assets
├── scripts/
│   └── seed-admin.mjs       # Automated idempotent admin bootstrapping script
├── supabase/
│   └── migrations/          # Declarative PostgreSQL DDL, triggers & RLS policies
├── src/
│   ├── app/                 # Next.js App Router endpoints & layouts
│   │   ├── (auth)/login     # Gate sign-in & registration portal
│   │   ├── admin/           # Administrative master telemetry & users directory
│   │   ├── dashboard/       # Passenger travel repository & scan dashboard
│   │   ├── upload/          # Multi-file drag-and-drop ingest workstation
│   │   ├── tickets/[id]/    # In-depth forensic report & boarding pass view
│   │   └── api/             # RESTful API micro-services (auth, extract, export)
│   ├── components/          # Reusable, atomic UI components
│   │   ├── auth/            # Anti-autofill login & signup ticket cards
│   │   ├── intro/           # Cinematic Framer Motion portal splash screen
│   │   ├── ticket-card/     # Boarding pass component with die-cut notches
│   │   └── ui/              # Buttons, inputs, modals, alerts, and badges
│   ├── lib/                 # Core domain logic & utilities
│   │   ├── ai-extraction.ts # LLM vision prompts, response parsers & fallback regex
│   │   ├── tamper-detection.ts # Forensic ELA calculations & PDF metadata audits
│   │   ├── auth.ts          # Password hashing, salt rounds & audit logging
│   │   ├── session.ts       # Stateless JWT cookie sign/verify logic
│   │   ├── rate-limit.ts    # In-memory & DB-backed attempt throttling
│   │   ├── db.ts            # Supabase client factory with URL sanitizer
│   │   └── local-store.ts   # Zero-config fallback storage for local evaluation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.18.0` or higher (Node 20+ recommended)
- **npm** or **pnpm**
- A **Supabase** account ([supabase.com](https://supabase.com))

### 1. Clone the Repository
```bash
git clone https://github.com/Desterhub/TicketScan.git
cd TicketScan
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your configuration:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

# Optional: Live AI Vision Key (Leave empty to use built-in heuristic fallback)
ANTHROPIC_API_KEY=your-anthropic-key
# OPENAI_API_KEY=your-openai-key
# GEMINI_API_KEY=your-gemini-key

# Auth Session Secret (Generate 32+ characters)
SESSION_SECRET=ticketscan_super_secure_jwt_session_secret_key_32chars_min
```

### 4. Initialize Database Schema
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Copy the contents of [`supabase/migrations/20261021000000_initial_schema.sql`](supabase/migrations/20261021000000_initial_schema.sql).
3. Paste and click **Run**.

### 5. Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Default Credentials

The initial database migration provisions an active administrative account:

| Role | Username / Identifier | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `tirth` | `010205` | Full master dashboard, user directory, export capabilities |
| **New Passengers** | *Self-Register* | *Chosen at signup* | Personal ticket vault & scanning workspace |

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Register passenger (enforces mandatory email for alerts) | No |
| `POST` | `/api/auth/login` | Sign in with passenger name / identifier & password | No |
| `POST` | `/api/auth/admin-login` | Dedicated high-security admin authentication | No |
| `POST` | `/api/upload` | Multipart file upload to storage vault | Yes |
| `POST` | `/api/extract` | Triggers multi-modal AI extraction pipeline | Yes |
| `POST` | `/api/tamper-check` | Executes forensic ELA and PDF anomaly analysis | Yes |
| `GET`  | `/api/tickets` | Query paginated list of user/admin tickets | Yes |
| `GET`  | `/api/tickets/[id]` | Fetch single ticket details and forensic breakdown | Yes |
| `GET`  | `/api/admin/export` | Download complete audit report in CSV / Excel format | Admin |
| `GET`  | `/api/admin/stats` | Telemetry metrics: tamper counts, carrier distributions | Admin |

---

## 🚢 Production Deployment

TicketScan is engineered for seamless deployment on **Render**, **Vercel**, or **AWS**:

### Deploying to Render
1. Create a **New Web Service** connected to your GitHub repository.
2. Configure runtime parameters:
   - **Environment**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `npm run start`
3. Add Environment Variables from your `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`).
4. Click **Deploy Web Service**.

---

## 📄 License
Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  <sub>Engineered by <strong>Tirth</strong> · Built with Next.js, TypeScript & Supabase</sub>
</div>
