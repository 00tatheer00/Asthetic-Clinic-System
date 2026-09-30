# Brimish Skin Care Clinic — Production Go-Live Checklist

**System**: Brimish Aesthetic Clinic Management & Public Web Platform  
**Target Architecture**: Next.js 16 (Vercel) + Supabase PostgreSQL 15 + Resend  
**Version**: 1.0.0-release  
**Date**: October 2026  
**Auditor**: Senior DevOps Engineer, Cloud Engineer, Database Administrator & Release Engineer  

---

## 1. Master Go-Live Gate Matrix

Every gate must be evaluated and verified prior to routing live patient traffic:

- [ ] **Production Supabase ready**
  - Managed Supabase Pro/Team project provisioned in low-latency region (`eu-central-1` Frankfurt or `ap-southeast-1` Singapore).
  - PostgreSQL 15 operational with connection pooling enabled (Transaction mode port 6543 / Session mode port 5432).

- [ ] **Migrations complete**
  - `supabase/migrations/001_initial_schema.sql` executed (all 22 core tables, enums, sequences, triggers).
  - `supabase/migrations/002_rls_policies.sql` executed (row-level security policies).
  - `supabase/migrations/003_storage_and_hardening.sql` executed (`search_path` locks, atomic inventory RPCs, storage buckets).
  - `supabase/migrations/004_production_email_logs.sql` executed (`email_logs` table, indexes, admin view policy).

- [ ] **RLS verified**
  - RLS active on all 22 operational tables (`clinic_settings`, `operating_hours`, `staff`, `patients`, `treatments`, `products`, `inventory_movements`, `appointments`, `visits`, `visit_treatments`, `visit_products_used`, `invoices`, `invoice_items`, `sales`, `sale_items`, `payments`, `orders`, `order_items`, `reviews`, `before_after_cases`, `audit_logs`, `email_logs`).
  - Anonymous queries verify public users can only SELECT active treatments, active products, approved reviews, and consented/published before-after cases.
  - Anonymous queries verify internal patient records, clinical notes, and invoices return 0 rows.

- [ ] **Storage configured**
  - Buckets verified: `treatment-images` (public, 5MB), `product-images` (public, 5MB), `before-after-images` (protected, 10MB), `clinic-assets` (public, 5MB).
  - Storage RLS verified: Public read forbidden for unconsented before/after photographs.
  - Allowed MIME types strictly restricted to `image/jpeg`, `image/png`, `image/webp`, and `image/svg+xml`.

- [ ] **Auth accounts created**
  - Super Admin / Doctor account created in Supabase Auth (`doctor@brimishskincare.com`) and UUID mapped into `public.staff` with `role: 'super_admin'`.
  - Receptionist account created in Supabase Auth (`reception@brimishskincare.com`) and UUID mapped into `public.staff` with `role: 'receptionist'`.
  - Individual passwords generated; no shared generic credentials.

- [ ] **Resend verified**
  - Domain `brimishskincare.com` added in Resend.
  - SPF record verified in registrar DNS: `v=spf1 include:amazonses.com ~all`.
  - DKIM records verified (3 CNAME/TXT records).
  - DMARC record verified: `v=DMARC1; p=none; sp=none; pct=100;`.
  - Sending status shows **Verified** (Green).

- [ ] **Environment variables configured**
  - `NEXT_PUBLIC_SUPABASE_URL`: Set in Vercel Production scope.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Set in Vercel Production scope.
  - `SUPABASE_SERVICE_ROLE_KEY`: Set in Vercel Production scope (Server-only / Secret).
  - `RESEND_API_KEY`: Set in Vercel Production scope (`re_...` - Server-only / Secret).
  - `RESEND_FROM_EMAIL`: Set to `Brimish Skin Care <notifications@brimishskincare.com>`.
  - `CRON_SECRET`: Set to cryptographically random 64-char string.
  - `NEXT_PUBLIC_SITE_URL`: Set to `https://brimishskincare.com`.

- [ ] **Vercel deployed**
  - Connected to GitHub repository `00tatheer00/Asthetic-Clinic-System`, branch `main`.
  - Build command: `next build` (passes with 0 errors).
  - Production deployment status: **Ready** (Green).

- [ ] **Domain connected**
  - Apex domain `brimishskincare.com` added to Vercel Domains.
  - Subdomain `www.brimishskincare.com` added with redirect to apex (or vice versa).
  - DNS A record `@` pointing to `76.76.21.21`.
  - DNS CNAME `www` pointing to `cname.vercel-dns.com`.

- [ ] **HTTPS verified**
  - Let's Encrypt / Vercel SSL certificate active.
  - Strict-Transport-Security (HSTS) header active with 2-year max-age.
  - HTTP automatically redirects to HTTPS with 308 permanent redirect.

- [ ] **Production smoke tests passed**
  - Public pages verified: `/`, `/about`, `/treatments`, `/products`, `/gallery`, `/reviews`, `/contact`, `/book`, `/order/cart`, `/order/checkout`.
  - Dashboard pages verified: `/dashboard`, `/dashboard/appointments`, `/dashboard/patients`, `/dashboard/pos`, `/dashboard/inventory`, `/dashboard/invoices`, `/dashboard/orders`, `/dashboard/settings`.

- [ ] **POS verified**
  - Retail product sale deducts stock atomically via `atomic_deduct_stock`.
  - Service sale creates invoice without inventory deduction.
  - Mixed sale (product + treatment) creates unified commercial tax invoice.
  - 80mm thermal and A4 print layout render without browser header artifacts.
  - Rapid double-click on checkout button is locked and ignored.

- [ ] **Inventory verified**
  - Restock purchase increments available stock.
  - Online order reserves stock atomically via `atomic_reserve_stock`.
  - Fulfilled order permanently decrements stock.
  - Cancelled order returns reserved stock to available inventory.
  - Negative inventory prevented by database checks.

- [ ] **Invoice verified**
  - Subtotal, discount, taxable amount, tax (GST), grand total, payment, and balance due calculated deterministically server-side.
  - Invoice numbering generated via atomic sequence (`INV-YYYYMM-XXXX`).
  - Invoice voiding preserves original record with void reason and audit log.

- [ ] **Appointment verified**
  - Patient books online; status is `pending`; confirmation email dispatched.
  - Receptionist confirms appointment; status is `confirmed`.
  - Patient arrives and is marked `checked_in`.
  - Doctor completes appointment and creates linked visit record.

- [ ] **Patient history verified**
  - Chronological timeline lists appointments, visits, treatments received, retail products purchased, and invoices.
  - Clinical notes masked for receptionist role; fully visible to doctor.

- [ ] **Email verified**
  - Resend transactional emails dispatched with plain-text fallback and clinic letterhead branding.
  - Dispatch outcomes recorded in `email_logs` table.
  - Temporary email outage does not abort or rollback financial sales.

- [ ] **Security verified**
  - `X-Frame-Options: SAMEORIGIN` blocks clickjacking.
  - `X-Content-Type-Options: nosniff` blocks MIME confusion attacks.
  - `SET search_path = public, pg_temp` blocks schema hijacking.
  - Zero private service keys exposed in client bundles or public repositories.

- [ ] **Backup/recovery documented**
  - Daily physical WAL database backups enabled in Supabase.
  - Manual SQL dump snapshot script documented.
  - Instant Vercel rollback procedure documented.
