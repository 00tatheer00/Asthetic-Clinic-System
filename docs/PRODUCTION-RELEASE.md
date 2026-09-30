# Brimish Skin Care Clinic — Production Release & Deployment Guide

**Version**: 1.0.0-production  
**Date**: October 2026  
**Target Environment**: Next.js 16 (Vercel) + Supabase PostgreSQL (Managed Supabase) + Resend  
**Repository**: `https://github.com/00tatheer00/Asthetic-Clinic-System.git`  

---

## 1. Release Architecture & Readiness Overview

The Brimish Skin Care Clinic application is an enterprise-grade aesthetic clinic management and public patient booking platform designed for clinics in Pakistan.

```
[ Patient / Staff Browser ]
           │
           ▼
[ Vercel Edge & Serverless (Next.js 16 App Router) ]
    ├── Public Pages & Static Generation
    ├── Dynamic Route Handlers (Auth & Cron)
    └── Server Actions (Transactions & RBAC Guards)
           │
     ┌─────┴────────────────────────┐
     ▼                              ▼
[ Supabase PostgreSQL 15 ]    [ Resend Email API ]
  ├── Hardened RLS Policies     ├── DKIM/SPF Signed
  ├── Atomic RPCs (Stock/POS)   ├── 9 Branded Templates
  ├── Storage (4 Buckets)       └── Fault-Tolerant Delivery
  └── Audit Logging Triggers
```

---

## 2. Pre-Deployment Git & Repository Setup

1. **Verify Git Working Tree**:
   ```bash
   git status
   ```
2. **Confirm No Sensitive Secrets Committed**:
   Ensure `.env`, `.env.local`, and private keys are excluded via `.gitignore`.
3. **Push All Production Changes to GitHub**:
   ```bash
   git remote add origin https://github.com/00tatheer00/Asthetic-Clinic-System.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. Supabase Production Project Configuration

Execute these 12 steps on the live Supabase project before traffic is routed:

1. **Create Project**:
   - Organization: Clinic Production
   - Region: Frankfurt (`eu-central-1`) or Singapore (`ap-southeast-1`)
   - Pricing Tier: Pro or Team (recommended for daily automated backups and point-in-time recovery)
2. **Apply Migrations in Sequential Order**:
   In the Supabase SQL Editor or via Supabase CLI (`supabase db push`):
   - `supabase/migrations/001_initial_schema.sql` (Creates base tables, enums, triggers, and sequences)
   - `supabase/migrations/002_rls_policies.sql` (Enables Row Level Security on all operational tables)
   - `supabase/migrations/003_storage_and_hardening.sql` (Locks `search_path`, provisions storage buckets, and creates atomic concurrency RPCs)
3. **Verify Row Level Security (RLS)**:
   Ensure all tables show **RLS Enabled** (Green checkmark in Table Editor).
4. **Confirm Storage Buckets**:
   In Storage tab, confirm the following 4 buckets exist:
   - `treatment-images` (Public: Yes, 5MB limit, image MIME types only)
   - `product-images` (Public: Yes, 5MB limit, image MIME types only)
   - `before-after-images` (Public: No, protected via RLS policies, 10MB limit)
   - `clinic-assets` (Public: Yes, 5MB limit, image MIME types + SVG)
5. **Create Staff Accounts in Supabase Auth**:
   In Supabase Auth > Users:
   - Create Doctor user: `doctor@brimishskincare.com` (Auto-confirm email: Yes)
   - Create Receptionist user: `reception@brimishskincare.com` (Auto-confirm email: Yes)
6. **Link Auth Users to Staff Table**:
   ```sql
   INSERT INTO public.staff (id, email, full_name, role, is_active)
   VALUES
     ('<DOCTOR_AUTH_USER_UUID>', 'doctor@brimishskincare.com', 'Dr. [Doctor Name]', 'super_admin', true),
     ('<RECEPTION_AUTH_USER_UUID>', 'reception@brimishskincare.com', 'Front Desk Reception', 'receptionist', true);
   ```
7. **Configure Real Clinic Settings**:
   Execute update on `clinic_settings`:
   ```sql
   UPDATE public.clinic_settings
   SET
     clinic_name = 'Brimish Skin Care Clinic',
     clinic_address = 'Suite 204, Executive Heights, University Road, Peshawar',
     clinic_city = 'Peshawar',
     clinic_phone = '+92-91-XXXXXXX',
     clinic_email = 'info@brimishskincare.com',
     clinic_website = 'https://brimishskincare.com',
     default_tax_rate = 0.00,
     default_tax_label = 'GST',
     currency_code = 'PKR',
     timezone = 'Asia/Karachi'
   WHERE id = (SELECT id FROM public.clinic_settings LIMIT 1);
   ```
8. **Verify Database Indexes**:
   Confirm indexes on `patients(phone)`, `appointments(appointment_date, status)`, `invoices(created_at, status)`, and `orders(status)`.
9. **Configure Database Backups**:
   Verify daily automated backups are active in Supabase Project Settings > Database > Backups.

---

## 4. Resend Production Email Configuration

1. **Add Domain**:
   Add `brimishskincare.com` in Resend Dashboard > Domains.
2. **Configure DNS Records with Domain Registrar**:
   - **SPF**: TXT record with value provided by Resend.
   - **DKIM**: TXT/CNAME records provided by Resend.
   - **DMARC**: TXT record `v=DMARC1; p=none; sp=none; pct=100;`.
3. **Verify Status**:
   Ensure Resend indicates domain is `Verified` (Green).
4. **Create Production API Key**:
   - Name: `Brimish Clinic Production Vercel`
   - Permission: Sending access only, restricted to `brimishskincare.com`.

---

## 5. Vercel Deployment Configuration

1. **Import Git Repository**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Connect repository: `00tatheer00/Asthetic-Clinic-System`
   - Framework Preset: `Next.js`
   - Root Directory: `./` (or `brimish-skincare` if deploying from parent workspace)
   - Build Command: `next build`
   - Output Directory: `.next`
   - Node.js Version: 20.x or 22.x
2. **Configure Environment Variables in Vercel Project Settings**:

| Variable Name | Environment | Value Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production | Live Supabase Project URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Production | Live Supabase Anonymous Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Live Supabase Service Role Key (Keep Secret!) |
| `RESEND_API_KEY` | Production | Live Resend API Key (`re_...`) |
| `RESEND_FROM_EMAIL` | Production | `Brimish Skin Care <notifications@brimishskincare.com>` |
| `CRON_SECRET` | Production | 64-character random hex string |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://brimishskincare.com` |

3. **Deploy**:
   Click **Deploy**. Build should complete with 30 routes prerendered/configured in ~30 seconds.

---

## 6. Domain, DNS & SSL Configuration

1. **Vercel Domains**:
   - Add `brimishskincare.com`
   - Add `www.brimishskincare.com` (redirects to apex `brimishskincare.com` or vice versa)
2. **DNS Records at Registrar (e.g. Cloudflare / Namecheap / GoDaddy)**:
   - A Record: `@` pointing to `76.76.21.21` (Vercel IP)
   - CNAME Record: `www` pointing to `cname.vercel-dns.com`
3. **SSL Certificate**:
   - Vercel automatically provisions and renews a Let's Encrypt Wildcard SSL certificate within minutes of DNS propagation.

---

## 7. Post-Launch Smoke Test Checklist

Once live on `https://brimishskincare.com`:

- [ ] **Public Homepage**: Verify fast loading, clean typography, hero CTA buttons work.
- [ ] **Treatment Catalog**: View treatments, filter by category.
- [ ] **Online Booking**: Submit test appointment, verify redirect to confirmation, and verify status is `pending`.
- [ ] **Doctor Login**: Log in as `super_admin`, view dashboard metrics, access patient records and clinical notes.
- [ ] **Receptionist Login**: Log in as `receptionist`, verify clinical notes and settings edits are blocked.
- [ ] **POS Sale**: Process test sale, verify receipt preview, verify stock deduction.
- [ ] **Product Checkout**: Add item to cart, complete checkout, verify order status and inventory reservation.
- [ ] **Before/After Gallery**: Verify public gallery only displays consented cases.
- [ ] **Robots & Sitemap**: Test `https://brimishskincare.com/robots.txt` and `https://brimishskincare.com/sitemap.xml`.
- [ ] **Audit Trail**: Confirm test actions created entries in `audit_logs`.

---

## 8. Rollback & Emergency Procedures

- **Immediate Deployment Rollback**:
  - In Vercel > Deployments: Locate previous successful build > Click `...` > **Promote to Production** (Instant, zero-downtime rollback).
- **Database Point-In-Time Restore**:
  - In Supabase > Database > Backups: Restore from snapshot if data integrity issue arises.
- **Incident Escalation**:
  - Technical Lead / DevOps: Notify development team immediately upon any Sev-1 incident (data breach, billing anomaly, or downtime).
