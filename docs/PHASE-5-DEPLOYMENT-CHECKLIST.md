# Brimish Skin Care Clinic — Production Deployment Checklist

**Project**: Brimish Skin Care Clinic Management & Public Web Platform  
**Target Architecture**: Next.js 16 (Vercel) + Supabase PostgreSQL (Managed Supabase) + Resend  
**Phase**: Phase 5 — Production Integration, Security Hardening & Real-Data QA  
**Date**: October 2026  

---

## 1. Pre-Deployment Repository & Git Preparation

- [ ] **Working Tree Clean**: Ensure all local changes, security patches, and migrations are committed.
- [ ] **Secrets Verification**: Scan commit history to ensure no `.env`, `.env.local`, service role keys, or Resend API tokens were ever committed (`git status`, `.gitignore` check).
- [ ] **GitHub Repository**: Push repository to the designated clinic or organization GitHub account:
  ```bash
  git remote -v
  git push origin main
  ```
- [ ] **Branch Protection**: Enable GitHub Branch Protection on `main` requiring pull request reviews and passing CI checks.

---

## 2. Supabase Production Project Setup

- [ ] **Create Production Organization & Project**:
  - Region: Frankfurt (`eu-central-1`) or Singapore (`ap-southeast-1`) for low latency to Pakistan (or closest available AWS region).
  - Database Password: Generate strong 32+ character random password and store securely in a password manager.
- [ ] **Execute Database Migrations in Exact Order**:
  Run migrations in the Supabase SQL Editor or via Supabase CLI (`supabase db push`):
  1. `supabase/migrations/001_initial_schema.sql` (Creates base schema, tables, enums, triggers, and sequences).
  2. `supabase/migrations/002_rls_policies.sql` (Enables Row Level Security and creates role-based policies).
  3. `supabase/migrations/003_storage_and_hardening.sql` (Applies `search_path` fixes, sets up storage buckets, and registers atomic concurrency RPCs).
- [ ] **Verify Storage Buckets**:
  Confirm the following buckets appear in the Supabase Dashboard Storage tab:
  - `treatment-images` (Public: Yes, 5MB limit, image MIME types only)
  - `product-images` (Public: Yes, 5MB limit, image MIME types only)
  - `before-after-images` (Public: Protected via RLS, 10MB limit, image MIME types only)
  - `clinic-assets` (Public: Yes, 5MB limit, image MIME types only)
- [ ] **Create Clinic Staff Accounts**:
  In Supabase Dashboard > Authentication > Users:
  1. Create Doctor / Owner User (`super_admin`):
     - Email: `doctor@brimishskincare.com`
     - Auto-confirm user: Yes
  2. Insert corresponding record into `public.staff`:
     ```sql
     INSERT INTO public.staff (auth_user_id, name, email, role, is_active)
     VALUES ('<SUPABASE_AUTH_USER_UUID>', 'Dr. [Doctor Name]', 'doctor@brimishskincare.com', 'super_admin', true);
     ```
  3. Create Receptionist User (`receptionist`):
     - Email: `reception@brimishskincare.com`
     - Auto-confirm user: Yes
  4. Insert corresponding record into `public.staff`:
     ```sql
     INSERT INTO public.staff (auth_user_id, name, email, role, is_active)
     VALUES ('<SUPABASE_AUTH_USER_UUID>', 'Clinic Reception Desk', 'reception@brimishskincare.com', 'receptionist', true);
     ```

---

## 3. Resend Email Domain & API Key Configuration

- [ ] **Add Custom Domain in Resend**:
  - Add `brimishskincare.com` to Resend dashboard.
- [ ] **Configure DNS Records with Domain Registrar**:
  - Add SPF (TXT record).
  - Add DKIM (TXT/CNAME records provided by Resend).
  - Add DMARC (TXT record `v=DMARC1; p=none; ...`).
  - Wait for Resend domain verification to show `Verified` (Green).
- [ ] **Generate Production API Key**:
  - Restrict key permissions to "Sending only" with domain restriction to `brimishskincare.com`.

---

## 4. Vercel Project Configuration

- [ ] **Import GitHub Project into Vercel**:
  - Framework Preset: `Next.js`
  - Root Directory: `brimish-skincare`
  - Build Command: `next build`
  - Output Directory: `.next`
  - Install Command: `npm install`
- [ ] **Inject Production Environment Variables in Vercel Project Settings**:
  | Variable Key | Scope | Value Source |
  | :--- | :--- | :--- |
  | `NEXT_PUBLIC_SUPABASE_URL` | Production | Supabase Project Settings > API > Project URL |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | Supabase Project Settings > API > Project API Keys (`anon` / `public`) |
  | `SUPABASE_SERVICE_ROLE_KEY` | Production | Supabase Project Settings > API > Project API Keys (`service_role` - Secret!) |
  | `RESEND_API_KEY` | Production | Resend Dashboard API Keys |
  | `RESEND_FROM_EMAIL` | Production | `Brimish Skin Care <notifications@brimishskincare.com>` |
  | `CRON_SECRET` | Production | Cryptographically random 64-char hex string |
  | `NEXT_PUBLIC_SITE_URL` | Production | `https://brimishskincare.com` |
- [ ] **Configure Custom Domain in Vercel**:
  - Add `brimishskincare.com` and `www.brimishskincare.com`.
  - Configure DNS A records (`76.76.21.21`) or CNAME to `cname.vercel-dns.com`.
  - Verify SSL certificate issued by Let's Encrypt / Vercel.

---

## 5. Post-Deployment Smoke Tests

Once deployed on the production URL:

- [ ] **Public Website Load**: Verify homepage, treatments catalog, product shop, and about pages load instantly with SSL.
- [ ] **Robots & Sitemap**: Test `https://brimishskincare.com/robots.txt` and `https://brimishskincare.com/sitemap.xml`.
- [ ] **Staff Login**: Log in as `super_admin` at `https://brimishskincare.com/auth/login`. Verify dashboard metrics load.
- [ ] **Receptionist Login**: Log in as `receptionist`. Verify restricted access:
  - Settings page does not allow updates.
  - Clinical notes on patient records are hidden.
- [ ] **Online Booking Test**: Book test appointment on public booking form. Verify record appears in dashboard appointments.
- [ ] **POS Test Sale**: Ring up test product sale, complete payment, and check receipt print modal.
- [ ] **Audit Log Verification**: Check `audit_logs` table to confirm login and mutation events were properly recorded.

---

## 6. Rollback & Disaster Recovery Considerations

- **Immediate Deployment Rollback**:
  - In Vercel Deployments tab: Click previous passing deployment > **Instant Rollback**.
- **Database Backup**:
  - Supabase automatically takes daily physical WAL backups.
  - Prior to high-impact production releases, execute a manual snapshot:
    `supabase db dump -f backup_$(date +%Y%m%d).sql`
- **Zero-Downtime Migration Policy**:
  - All migrations must be backwards-compatible with active client code. Never drop columns or tables in the same release as code dependencies.
