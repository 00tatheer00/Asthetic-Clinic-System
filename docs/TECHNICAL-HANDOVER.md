# Brimish Skin Care Clinic — Technical Handover Document

**Project**: Brimish Skin Care Clinic Platform  
**Target Environment**: Next.js 16 (App Router / Turbopack) | Supabase PostgreSQL 15 | Resend | Vercel  
**Repository**: `https://github.com/00tatheer00/Asthetic-Clinic-System.git`  
**Version**: 1.0.0-production  
**Date**: October 2026  
**Author**: Principal Software Architect & Technical Lead  

---

## 1. Project Directory Structure

```
brimish-skincare/
├── src/
│   ├── actions/                  # Next.js Server Actions (Transactions & RBAC Guards)
│   │   ├── appointments.ts       # Public & internal booking actions
│   │   ├── clinic.ts             # Visits, treatments, consumables deduction
│   │   ├── content.ts            # Content management (reviews, before/after)
│   │   ├── intelligence.ts       # Fast search, follow-ups, daily closings
│   │   ├── orders.ts             # E-commerce orders & inventory reservation
│   │   ├── patients.ts           # Patient records & clinical notes
│   │   ├── pos.ts                # POS terminal billing & atomic stock deduction
│   │   └── storage.ts            # Validated image uploads to Supabase buckets
│   ├── app/                      # Next.js 16 App Router Routes
│   │   ├── (dashboard)/          # Authenticated Staff Dashboard
│   │   │   └── dashboard/        # Appointments, Patients, POS, Invoices, Orders, Reports
│   │   ├── (public)/             # Public Patient Website
│   │   │   ├── about/            # Clinic story & medical credentials
│   │   │   ├── book/             # Patient appointment booking form
│   │   │   ├── contact/          # Physical address, hours, Google Maps
│   │   │   ├── gallery/          # Consented Before/After case showcase
│   │   │   ├── order/            # Cart & checkout workflow
│   │   │   ├── products/         # Skincare retail catalog
│   │   │   ├── reviews/          # Patient testimonials & submission form
│   │   │   └── treatments/       # Aesthetic clinical procedures catalog
│   │   ├── auth/                 # Login & SSR callback routes
│   │   ├── robots.ts             # SEO robots.txt generator
│   │   └── sitemap.ts            # Dynamic XML sitemap generator
│   ├── components/               # UI components (shadcn/ui & custom blocks)
│   ├── lib/                      # Core business utilities & libraries
│   │   ├── constants/            # Clinic business constants & operational hours
│   │   ├── email/                # 9 Resend transactional templates & logger
│   │   ├── supabase/             # Supabase clients (SSR, client, admin)
│   │   ├── types/                # TypeScript domain types & state machines
│   │   ├── utils/                # Currency (PKR), Asia/Karachi dates, CSV exports
│   │   ├── validations/          # Zod validation schemas
│   │   └── logger.ts             # Structured security-sanitizing production logger
│   └── stores/                   # Client state (Zustand cart-store)
├── supabase/
│   ├── migrations/               # Sequential SQL migrations (001 through 006)
│   ├── production_init.sql       # Single-click master database initialization script
│   └── seed.sql                  # Seed data for initial categories & treatments
└── docs/                         # Comprehensive engineering & operations documentation
```

---

## 2. Local Development Setup

### 2.1 Prerequisites
- Node.js 20.x or 22.x LTS
- Git

### 2.2 Setup Commands
```bash
# 1. Clone repository
git clone https://github.com/00tatheer00/Asthetic-Clinic-System.git
cd Asthetic-Clinic-System

# 2. Install dependencies
npm install

# 3. Configure local environment
cp .env.example .env.local
# (Edit .env.local with development Supabase credentials)

# 4. Start local development server
npm run dev
# Server boots at http://localhost:3000
```

---

## 3. Database Architecture & Migrations

All database structures are version-controlled in `supabase/migrations/`:
1. `001_initial_schema.sql`: Base tables, enums, triggers, and sequences.
2. `002_rls_policies.sql`: Row Level Security policies for all tables.
3. `003_storage_and_hardening.sql`: Locked function search paths, storage buckets, atomic concurrency RPCs.
4. `004_production_email_logs.sql`: `email_logs` telemetry table.
5. `005_performance_and_health_indexes.sql`: B-Tree indexes for foreign keys & filters, diagnostic health check.
6. `006_intelligence_and_followups.sql`: `patient_follow_ups` and `daily_closings` tables.

*Master Initialization*: Use `supabase/production_init.sql` to execute all 6 migrations in a single operation.

---

## 4. Production Deployment & Cloud Services

### 4.1 Vercel Configuration
- Framework: Next.js (App Router / Turbopack)
- Root Directory: `./`
- Build Command: `next build`
- Node Version: 20.x or 22.x

### 4.2 Environment Variables Required in Vercel
See full specifications in `docs/PRODUCTION-ENVIRONMENT.md`:
- `NEXT_PUBLIC_SUPABASE_URL` (Public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Public)
- `SUPABASE_SERVICE_ROLE_KEY` (Server-Only Secret)
- `RESEND_API_KEY` (Server-Only Secret)
- `RESEND_FROM_EMAIL` (Server-Only)
- `CRON_SECRET` (Server-Only Secret)
- `NEXT_PUBLIC_SITE_URL` (Public)

---

## 5. SEO & Search Engine Handover

1. **Robots & Sitemap**:
   - Dynamic robots available at `https://brimishskincare.com/robots.txt`.
   - Dynamic XML sitemap available at `https://brimishskincare.com/sitemap.xml`.
2. **Schema.org Structured Data**:
   - Homepage embeds `MedicalClinic` JSON-LD with coordinates for Peshawar, Pakistan.
3. **Google Search Console**:
   - Add property `https://brimishskincare.com`.
   - Submit sitemap URL: `https://brimishskincare.com/sitemap.xml`.

---

## 6. Troubleshooting & Common Operational Errors

| Symptom | Root Cause | Resolution |
| :--- | :--- | :--- |
| **"Unauthorized: Staff profile not found"** | Auth user exists in Supabase Auth but was not inserted into `public.staff`. | Run SQL insert into `public.staff` with matching `id` UUID. |
| **"Out of stock" during POS sale** | Physical stock in `products` is 0 or less than quantity. | Restock product via `/dashboard/inventory` before finalizing sale. |
| **Emails not received by patients** | Resend API key missing or domain DNS not yet verified. | Check `email_logs` table for error reason. Verify TXT/DKIM records in domain registrar. |
| **Before/After photo not visible on public gallery** | Either `consent_obtained` or `is_published` is `false`. | Ensure case has both consent checked and published enabled. |
