# Phase 5 — Full Codebase Audit & Production Readiness Assessment

**Project**: Brimish Skin Care Clinic Platform  
**Target Environment**: Vercel (Next.js 16) + Supabase (PostgreSQL 15+, Auth, Storage) + Resend (Transactional Email)  
**Date**: October 2026  
**Auditor**: Senior Production, Security, and Database Engineering Team  
**Audit Status**: Complete — Fixes Planned

---

## 1. Executive Summary

The Brimish Skin Care Clinic platform has achieved full feature implementation across 28 validated Next.js 16 App Router routes, covering public clinic presentation, patient booking, retail e-commerce, clinic POS, patient history, clinical visits, invoicing, review moderation, and business analytics.

While the application compiles cleanly (`next build` succeeds with 0 TypeScript errors), this Phase 5 audit identifies **operational, security, and transaction-integrity gaps** that must be resolved prior to production launch on real clinic hardware and real patient data.

---

## 2. Current Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│ FRONTEND / EDGE LAYER (Vercel)                                         │
│ - Next.js 16.3.8 (Turbopack, React 19, TypeScript strict mode)         │
│ - Tailwind CSS v4 + shadcn/ui components                               │
│ - Middleware: Session token refresh & RBAC route protection (/dashboard)│
│ - Server Actions: Form mutations & transactional business workflows    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS / JWT
┌────────────────────────────────────▼───────────────────────────────────┐
│ DATABASE & AUTH LAYER (Supabase)                                       │
│ - PostgreSQL 15+ with 26 tables, 13 custom enum types                  │
│ - Row-Level Security (RLS) on all 26 tables                            │
│ - Supabase Auth: Email/password for Staff (super_admin & receptionist) │
│ - Sequential invoice & order generation via PostgreSQL atomic counters │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS
┌────────────────────────────────────▼───────────────────────────────────┐
│ EXTERNAL SERVICES                                                      │
│ - Resend API: Transactional emails (appointments, orders, low-stock)   │
│ - Supabase Storage: Media assets & clinical photography                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Production Readiness Evaluation

| Dimension | Status | Notes |
|---|---|---|
| **Route Architecture** | ✅ PASS | 28 static & dynamic routes validated |
| **Type Safety** | ✅ PASS | TypeScript strict mode passes with 0 errors |
| **RBAC Enforcement** | ⚠️ CONDITIONAL | Middleware blocks `/dashboard/*` for non-staff; clinical notes gated to `super_admin`. However, public pages use `createAdminClient` unnecessarily. |
| **RLS Policies** | ⚠️ CONDITIONAL | 26 tables have RLS; `storage.objects` has no policies yet; `SECURITY DEFINER` functions missing `search_path`. |
| **Storage Infrastructure**| ❌ BLOCKED | No storage buckets defined in migrations; images currently use raw external URLs; no upload validation. |
| **Concurrency / Inventory** | ⚠️ CONDITIONAL | Order reservation math is solid, but POS stock deduction is read-then-write (susceptible to race conditions). |
| **State Transitions** | ❌ BLOCKED | `VALID_ORDER_TRANSITIONS['ready']` lacks `'delivered'` causing delivery orders to fail transition. |
| **Email Infrastructure** | ⚠️ CONDITIONAL | Resend integrated with non-blocking error handling, but missing plain-text fallbacks and invoice template abstraction. |
| **Security Headers** | ❌ BLOCKED | `next.config.ts` lacks HTTP security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy). |

---

## 4. Security Risks & Vulnerabilities

### Risk S-01: Public Read Pages Using Service Role Key (`createAdminClient`)
- **Location**: `src/app/(public)/treatments/page.tsx`, `products/page.tsx`, `reviews/page.tsx`, `book/page.tsx`.
- **Severity**: **MEDIUM**
- **Impact**: Bypasses Row Level Security for public reads. If a query inadvertently omits `is_published = true` or `deleted_at IS NULL`, unreleased or deleted data would be displayed to public visitors. Furthermore, it forces `SUPABASE_SERVICE_ROLE_KEY` to be evaluated during SSR.
- **Remedy**: Switch public read pages to use the standard anonymous `createClient()` from `@/lib/supabase/server`. RLS policies already exist for anonymous readers on these tables.

### Risk S-02: `SECURITY DEFINER` Functions Missing Explicit `search_path`
- **Location**: `supabase/migrations/001_initial_schema.sql` (`get_user_role()`, `is_super_admin()`, `get_staff_id()`).
- **Severity**: **MEDIUM**
- **Impact**: According to PostgreSQL and Supabase security guidelines, `SECURITY DEFINER` functions without `SET search_path = public` can be vulnerable to search-path hijacking attacks.
- **Remedy**: Re-declare these functions with `SET search_path = public`.

### Risk S-03: Missing Supabase Storage Policies & Patient Photo Exposure
- **Location**: Supabase Storage (`before-after-images`, `treatment-images`, `product-images`).
- **Severity**: **HIGH**
- **Impact**: Currently, image URLs are entered as plain text strings. Without an isolated, private storage bucket with signed URLs or consent-based RLS on `storage.objects`, patient medical photography could be exposed publicly if someone guesses the URL or if consent is revoked.
- **Remedy**: Create a dedicated storage migration (`003_storage_and_hardening.sql`) configuring `treatment-images`, `product-images`, and `before-after-images` buckets with proper access policies. Provide an upload action with strict MIME type (`image/jpeg`, `image/png`, `image/webp`) and size limits (max 5MB).

### Risk S-04: Missing HTTP Security Headers
- **Location**: `next.config.ts`.
- **Severity**: **LOW-MEDIUM**
- **Impact**: Missing `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, and `Referrer-Policy`.
- **Remedy**: Add strict security headers to `next.config.ts`.

---

## 5. Database & Transaction Integrity Risks

### Risk D-01: Order Status Transition Bug (`ready` -> `delivered`)
- **Location**: `src/lib/types/index.ts` line 570.
- **Issue**: `VALID_ORDER_TRANSITIONS['ready']` is defined as `['picked_up', 'cancelled']`. For home delivery orders, the action calls `handleStatusChange(order.id, 'delivered')`. Because `'delivered'` is missing from `ready` transitions, the server action rejects the transition with an error.
- **Remedy**: Update `VALID_ORDER_TRANSITIONS` so `ready` allows `['picked_up', 'delivered', 'shipped', 'cancelled']`.

### Risk D-02: Concurrency Race Condition in POS Stock Deductions
- **Location**: `src/actions/pos.ts` lines 169-175.
- **Issue**: Stock deduction queries `stock_quantity`, computes `newStock = stock_quantity - item.quantity` in Node.js, and then sends `UPDATE products SET stock_quantity = newStock`. If two sales for the same product occur at the same millisecond, one sale's deduction will overwrite the other, resulting in inventory discrepancy.
- **Remedy**: Create an atomic PostgreSQL stored function `deduct_product_stock` that executes:
  ```sql
  UPDATE products
  SET stock_quantity = stock_quantity - p_qty
  WHERE id = p_product_id AND stock_quantity >= p_qty
  RETURNING stock_quantity;
  ```

### Risk D-03: Multiple Independent Database Writes in POS Without Rollback
- **Location**: `src/actions/pos.ts`.
- **Issue**: POS checkout creates a sale, inserts sale items, deducts product stock, logs stock movements, creates an invoice, and creates invoice line items in sequential asynchronous Supabase calls. If the network drops halfway, orphan records can occur.
- **Remedy**: Ensure error handling cleans up or rolls back partial transactions, or wrap core POS creation in a database function.

---

## 6. Deployment Blockers

1. **Placeholder Environment Variables**: `.env.local` contains dummy values (`https://placeholder.supabase.co`). Real production deployment requires a provisioned Supabase project and active Resend API key.
2. **Missing Storage Buckets**: Supabase Storage buckets must exist before file uploads can function.
3. **Resend Domain Verification**: `noreply@brimishskincare.com` requires verified SPF, DKIM, and DMARC DNS records in Resend to send real emails without being quarantined.
4. **Initial Staff Seed**: The first `super_admin` auth account must be created in Supabase Auth and linked to `public.staff` before any staff member can log into `/dashboard`.

---

## 7. Required Production Environment Variables

| Variable Name | Exposure | Required For |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | Connecting to Supabase project API gateway |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client + Server) | Client-side & anonymous RLS queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only (Secret) | Admin mutations (public guest booking, orders, reviews) |
| `RESEND_API_KEY` | Server-Only (Secret) | Transactional email delivery |
| `RESEND_FROM_EMAIL` | Server-Only (Config) | Verified sender address (e.g. `Brimish Clinic <noreply@brimishskincare.com>`) |
| `CLINIC_ADMIN_EMAIL` | Server-Only (Config) | Notification recipient for booking requests & low-stock alerts |
| `NEXT_PUBLIC_SITE_URL` | Public (Client + Server) | Canonical URL generation, emails, and OpenGraph |
| `CRON_SECRET` | Server-Only (Secret) | Protecting recurring cron endpoints from unauthorized triggers |

---

## 8. Recommended Phase 5 Action Plan

1. **Step 2**: Create `docs/PRODUCTION-ENVIRONMENT.md` documenting environment configuration in full detail.
2. **Step 3 & 4**: Create `supabase/migrations/003_storage_and_hardening.sql`:
   - Harden `SECURITY DEFINER` functions with `search_path = public`.
   - Create storage buckets: `treatments`, `products`, `before-after`, `clinic-assets`.
   - Add RLS policies for storage objects.
   - Add atomic `deduct_product_stock` and `release_reserved_stock` functions.
3. **Step 5**: Implement server upload validation action (`uploadClinicMedia`) validating MIME types, extensions, and file sizes.
4. **Step 6**: Refine email templates with plain-text alternatives, dynamic sender configuration, and failure resilience.
5. **Step 7 & 8**: Fix `VALID_ORDER_TRANSITIONS` and POS atomic stock deductions.
6. **Step 9**: Audit invoice calculations, rounding, and formatting.
7. **Step 10**: Document real clinic data configuration checklist.
8. **Step 11-16**: Execute QA matrix (auth, POS, orders, visits, responsive, SEO, a11y, logging).
9. **Step 17-19**: Static analysis, build validation, deployment checklist, and final completion report.
