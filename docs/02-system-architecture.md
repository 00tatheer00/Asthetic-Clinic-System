# 02 — System Architecture

## Brimish Skin Care Clinic — Technical Architecture Document

**Version:** 1.0.0-draft
**Date:** 2026-10-01

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL EDGE NETWORK                       │
│  ┌───────────────────────┐    ┌───────────────────────────────┐  │
│  │   Public Website       │    │   Clinic Dashboard            │  │
│  │   (SSR/SSG + ISR)      │    │   (SSR + Client Components)   │  │
│  │   /                    │    │   /dashboard/*                │  │
│  │   /about               │    │   Protected by Auth Middleware│  │
│  │   /treatments/*        │    │                               │  │
│  │   /products/*          │    │                               │  │
│  │   /gallery             │    │                               │  │
│  │   /reviews             │    │                               │  │
│  │   /contact             │    │                               │  │
│  │   /book                │    │                               │  │
│  │   /order/*             │    │                               │  │
│  └───────────┬───────────┘    └──────────────┬────────────────┘  │
│              │                                │                   │
│  ┌───────────┴────────────────────────────────┴────────────────┐ │
│  │              Next.js App Router (TypeScript)                 │ │
│  │         API Routes: /api/*  |  Server Actions               │ │
│  │         Middleware: Auth + Role checks                       │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                   ┌──────────┴──────────┐
                   │                     │
          ┌────────▼────────┐   ┌────────▼────────┐
          │   SUPABASE       │   │   RESEND         │
          │                  │   │   Email API       │
          │  ┌────────────┐  │   └─────────────────┘
          │  │ PostgreSQL  │  │
          │  │ + RLS       │  │
          │  ├────────────┤  │
          │  │ Auth        │  │
          │  ├────────────┤  │
          │  │ Storage     │  │
          │  │ (Buckets)   │  │
          │  ├────────────┤  │
          │  │ Edge Funcs  │  │
          │  │ (Cron jobs) │  │
          │  └────────────┘  │
          └──────────────────┘
```

---

## 2. Technology Stack Decisions

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14+ (App Router) | Server components, streaming, ISR, API routes, middleware — all-in-one |
| **Language** | TypeScript (strict mode) | Type safety, better DX, fewer runtime errors |
| **Styling** | Tailwind CSS | Utility-first, rapid prototyping, consistent design system |
| **UI Components** | shadcn/ui | Accessible, composable, Tailwind-native components |
| **Database** | Supabase PostgreSQL | Managed PostgreSQL with RLS, real-time, and auth built-in |
| **Authentication** | Supabase Auth | Email/password auth, JWT tokens, session management |
| **File Storage** | Supabase Storage | Private + public buckets, signed URLs, image transformations |
| **Validation** | Zod | Schema validation, TypeScript integration, shared client/server schemas |
| **Forms** | React Hook Form + Zod resolver | Performant forms with schema validation |
| **Email** | Resend | Transactional email with React Email templates |
| **Deployment** | Vercel | Edge network, preview deployments, serverless functions |
| **PDF Generation** | @react-pdf/renderer or jsPDF | Client-side or server-side PDF generation for invoices |
| **Cron/Scheduled Jobs** | Vercel Cron or Supabase Edge Functions | Appointment reminders, low-stock checks |

---

## 3. Application Structure

```
brimish-skincare/
├── src/
│   ├── app/
│   │   ├── (public)/                # Public website routes (layout with public nav/footer)
│   │   │   ├── page.tsx             # Home
│   │   │   ├── about/
│   │   │   ├── treatments/
│   │   │   │   ├── page.tsx         # Treatments list
│   │   │   │   └── [slug]/
│   │   │   ├── products/
│   │   │   │   ├── page.tsx         # Products list
│   │   │   │   └── [slug]/
│   │   │   ├── gallery/
│   │   │   ├── reviews/
│   │   │   ├── contact/
│   │   │   ├── book/                # Appointment booking
│   │   │   └── order/               # Product ordering / cart / checkout
│   │   │       ├── cart/
│   │   │       └── checkout/
│   │   ├── (dashboard)/             # Protected dashboard routes
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx         # Dashboard home / overview
│   │   │   │   ├── appointments/
│   │   │   │   ├── patients/
│   │   │   │   │   └── [id]/
│   │   │   │   ├── pos/
│   │   │   │   ├── invoices/
│   │   │   │   │   └── [id]/
│   │   │   │   ├── inventory/
│   │   │   │   ├── orders/
│   │   │   │   │   └── [id]/
│   │   │   │   ├── reviews/
│   │   │   │   ├── gallery/
│   │   │   │   ├── treatments/
│   │   │   │   ├── products/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   ├── api/                     # API routes
│   │   │   ├── appointments/
│   │   │   ├── orders/
│   │   │   ├── pos/
│   │   │   ├── invoices/
│   │   │   ├── reviews/
│   │   │   ├── webhooks/
│   │   │   └── cron/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── callback/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── public/                  # Public site components
│   │   ├── dashboard/               # Dashboard components
│   │   └── shared/                  # Shared components (invoice templates, etc.)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser client
│   │   │   ├── server.ts            # Server client
│   │   │   ├── admin.ts             # Service role client (server only)
│   │   │   └── middleware.ts        # Auth middleware helpers
│   │   ├── validations/             # Zod schemas
│   │   ├── utils/                   # Utility functions
│   │   ├── email/                   # Resend email helpers + templates
│   │   ├── constants/               # App constants
│   │   └── types/                   # TypeScript types & interfaces
│   ├── hooks/                       # Custom React hooks
│   └── stores/                      # Client-side state (cart, etc.)
├── supabase/
│   ├── migrations/                  # SQL migration files
│   ├── seed.sql                     # Seed data
│   └── config.toml                  # Supabase local config
├── public/                          # Static assets
├── docs/                            # Project documentation
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

---

## 4. Rendering Strategy

| Route | Strategy | Rationale |
|-------|----------|-----------|
| Home page | SSG + ISR (revalidate: 3600) | Mostly static, revalidate hourly |
| About | SSG | Fully static content |
| Treatments list | SSG + ISR (revalidate: 3600) | CMS-managed, changes infrequently |
| Treatment detail | SSG + ISR | Per-slug, dynamic paths |
| Products list | SSG + ISR (revalidate: 1800) | Stock-dependent, revalidate more often |
| Product detail | SSG + ISR | Per-slug |
| Gallery | SSG + ISR (revalidate: 3600) | Changes infrequently |
| Reviews | SSG + ISR (revalidate: 1800) | New reviews added periodically |
| Contact | SSG | Static |
| Booking form | SSR | Needs live treatment list for form |
| Cart/Checkout | Client-side | Dynamic, interactive |
| Dashboard (all) | SSR | Real-time data, role-gated |

---

## 5. Authentication & Authorization Architecture

### 5.1 Authentication Flow

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│  Login   │───▶│ Supabase Auth│───▶│ JWT Token    │
│  Page    │    │ (email/pass) │    │ (httpOnly    │
│          │    │              │    │  cookie)     │
└──────────┘    └──────────────┘    └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │  Middleware   │
                                    │  - Verify JWT│
                                    │  - Check role│
                                    │  - Route gate│
                                    └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │  Dashboard   │
                                    │  (role-based │
                                    │   content)   │
                                    └──────────────┘
```

### 5.2 Authorization Layers

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Middleware** | Next.js middleware | Route-level protection; redirect unauthenticated users |
| **Server Components** | Supabase server client | Role check before rendering; filter data by permissions |
| **API Routes / Server Actions** | Supabase server client + role verification | Validate role before mutations |
| **Database (RLS)** | Supabase Row Level Security | Last line of defense; enforce data access at the DB level |

### 5.3 Role Storage

User roles are stored in a `staff` table (not in Supabase Auth metadata alone) for queryability and flexibility:

```
staff
├── id (UUID, PK)
├── auth_user_id (UUID, FK → auth.users)
├── name
├── email
├── role (ENUM: 'super_admin', 'receptionist')
├── is_active (boolean)
├── created_at
└── updated_at
```

RLS policies reference a helper function `get_user_role()` that queries this table.

---

## 6. Supabase Storage Architecture

| Bucket | Access | Content | Policy |
|--------|--------|---------|--------|
| `public-images` | Public | Product images, treatment images, published before/after photos, clinic branding | Anyone can read; authenticated staff can upload/delete |
| `private-images` | Private | Unpublished before/after photos, clinical photos | Signed URLs only; doctor + receptionist can upload; only doctor can view clinical images |
| `invoices` | Private | Generated PDF invoices | Signed URLs; staff can generate; email delivery uses signed URLs with expiration |

---

## 7. Email Architecture (Resend)

### 7.1 Email Templates

All emails use React Email templates for consistent branding:

| Template | Trigger | Recipient |
|----------|---------|-----------|
| `appointment-received` | New booking submitted | Clinic (admin email) |
| `appointment-confirmed` | Receptionist confirms booking | Patient (email from booking) |
| `appointment-reminder` | Cron job (24h before appointment) | Patient |
| `order-confirmation` | Order placed | Customer |
| `order-status-update` | Order status changes | Customer |
| `invoice-email` | Invoice generated + send triggered | Patient/Customer |
| `low-stock-alert` | Stock falls below threshold | Admin |
| `review-request` | Post-visit (post-MVP) | Patient |

### 7.2 Email Failure Handling

- All email sends are wrapped in try/catch with structured logging
- Failed emails are logged to an `email_log` table with status and error
- Critical emails (appointment confirmation, invoice) can be retried manually from dashboard
- Non-critical emails (reminders, review requests) fail silently with logging
- No email failure should block the primary business operation (e.g., a failed invoice email should not prevent sale completion)

---

## 8. Cron Jobs / Scheduled Tasks

| Job | Schedule | Action |
|-----|----------|--------|
| Appointment reminders | Daily at 08:00 PKT | Send reminders for appointments in next 24h |
| Low-stock check | Daily at 09:00 PKT | Check inventory, send alerts for items below threshold |
| Expired appointment cleanup | Daily at 00:00 PKT | Mark unconfirmed appointments older than 48h as expired |
| ISR cache revalidation | On-demand | Triggered by CMS content updates via revalidatePath/revalidateTag |

**Implementation:** Vercel Cron (via `vercel.json` cron configuration) calling API routes, or Supabase Edge Functions with pg_cron.

---

## 9. Data Flow Patterns

### 9.1 Public Form Submissions (Booking, Orders, Reviews)

```
Client Form → Zod Validation (client) → API Route/Server Action
    → Zod Validation (server) → Rate Limiting Check
    → Supabase Insert (service role for public submissions)
    → Trigger Email Notification
    → Return Success/Error Response
```

### 9.2 Dashboard Operations (POS, Patient CRUD)

```
Dashboard Form → Zod Validation (client) → Server Action
    → Auth Check (middleware already passed)
    → Role Permission Check
    → Zod Validation (server)
    → Supabase Transaction (authenticated client with RLS)
    → Audit Log Entry
    → Trigger Side Effects (email, stock update)
    → Revalidate Cache (if affects public site)
    → Return Success/Error Response
```

### 9.3 POS Sale Transaction

```
Cart Finalization → Server Action
    → Auth + Role Check
    → Validate All Items In Stock
    → BEGIN TRANSACTION
        → Create Sale Record
        → Create Sale Items
        → Deduct Stock (atomic, with row locking)
        → Create Invoice
        → Create Invoice Line Items
        → Update Patient Purchase History
        → Create Audit Log Entry
    → COMMIT
    → Generate Receipt
    → Optional: Send Invoice Email
    → Revalidate Product Cache (if stock affects public display)
```

---

## 10. Error Handling Strategy

| Layer | Strategy |
|-------|----------|
| Client Forms | Zod validation errors displayed inline; toast notifications for server errors |
| API Routes | Structured error responses: `{ error: string, code: string, details?: any }` |
| Server Actions | Try/catch with typed error returns; never expose internal errors to client |
| Database | Constraint violations caught and translated to user-friendly messages |
| External Services | Resend failures logged, non-blocking; Supabase connection failures trigger error boundary |
| Global | Next.js `error.tsx` boundaries per route segment; `not-found.tsx` for 404s |

---

## 11. Performance Considerations

| Concern | Mitigation |
|---------|-----------|
| Image loading | Supabase Storage image transformations for responsive sizes; Next.js `<Image>` with lazy loading |
| Public page speed | SSG/ISR for all public pages; minimal client-side JS |
| Dashboard responsiveness | Server components for data fetching; client components only for interactivity |
| Database queries | Indexed columns for search/filter; pagination with cursor or offset; no N+1 queries |
| Bundle size | Dynamic imports for heavy components (PDF generator, comparison slider); tree-shaking |
| Cart state | Client-side state (zustand or context) with localStorage persistence; no server round-trips for cart updates |

---

## 12. Environment Configuration

| Variable | Usage | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public, RLS-protected) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, bypasses RLS) | Yes |
| `RESEND_API_KEY` | Resend API key for email | Yes |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL | Yes |
| `CLINIC_ADMIN_EMAIL` | Email for admin notifications | Yes |
| `CRON_SECRET` | Secret to authenticate cron job API calls | Yes |
