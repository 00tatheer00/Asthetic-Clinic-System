# 07 — Security & QA Strategy

## Brimish Skin Care Clinic — Privacy, Security, Accessibility, Risks & Testing Strategy

**Version:** 1.0.0-draft
**Date:** 2026-10-01

---

## 1. Security Architecture

### 1.1 Defense in Depth

```
┌─────────────────────────────────────────────────┐
│ Layer 1: NETWORK (Vercel Edge + Cloudflare)     │
│   - DDoS protection                             │
│   - TLS 1.3 encryption in transit               │
│   - Rate limiting at edge                        │
├─────────────────────────────────────────────────┤
│ Layer 2: APPLICATION (Next.js Middleware)        │
│   - Route-level authentication check            │
│   - JWT token verification                       │
│   - Role-based route gating                      │
│   - CSRF protection (SameSite cookies)           │
├─────────────────────────────────────────────────┤
│ Layer 3: API (Server Actions / API Routes)       │
│   - Input validation (Zod)                       │
│   - Role-based permission checks                 │
│   - Rate limiting per endpoint                   │
│   - Request size limits                          │
├─────────────────────────────────────────────────┤
│ Layer 4: DATABASE (Supabase RLS)                 │
│   - Row Level Security on all tables             │
│   - Column-level data exposure control           │
│   - Function-level security (SECURITY DEFINER)   │
│   - No direct client DB access for mutations     │
├─────────────────────────────────────────────────┤
│ Layer 5: STORAGE (Supabase Storage)              │
│   - Private buckets for clinical images          │
│   - Signed URLs with expiration                  │
│   - Upload size/type restrictions                │
│   - Separate public and private buckets          │
└─────────────────────────────────────────────────┘
```

### 1.2 Authentication Security

| Control | Implementation |
|---------|---------------|
| Authentication method | Supabase Auth (email + password) |
| Password requirements | Minimum 8 characters (Supabase default) |
| Session management | JWT in httpOnly, Secure, SameSite=Lax cookie |
| Session expiration | Access token: 1 hour; Refresh token: 7 days |
| No public registration | Staff accounts created by Super Admin only |
| Account lockout | Supabase handles rate limiting on auth endpoints |
| Password reset | Supabase Auth magic link / email reset flow |
| MFA | Not required for MVP; recommended post-MVP |

### 1.3 Authorization Matrix Summary

| Resource | Anonymous | Receptionist | Super Admin |
|----------|-----------|--------------|-------------|
| Public website content | Read | Read | Read + Write |
| Patient data (non-clinical) | — | Read + Write | Read + Write |
| Clinical notes | — | — | Read + Write |
| Financial data (costs, margins) | — | — | Read + Write |
| POS operations | — | Create + Read | Full |
| Invoice void | — | — | Yes |
| Settings | — | Own profile | Full |
| Audit log | — | Read | Read |
| Staff management | — | — | Full |

### 1.4 Input Validation

| Layer | Tool | Rules |
|-------|------|-------|
| Client-side | Zod + React Hook Form | Immediate feedback; same schemas as server |
| Server-side | Zod | Authoritative validation; always runs regardless of client validation |
| Database | CHECK constraints, ENUMs, FK constraints | Last line of defense |

**Validation rules for common fields:**

| Field | Validation |
|-------|-----------|
| Pakistani phone number | Regex: `^03[0-9]{9}$` (11 digits starting with 03) |
| Email | Standard email format (Zod `z.string().email()`) |
| Monetary amounts | `z.number().nonnegative().multipleOf(0.01)` |
| Text inputs | Max length limits, XSS sanitization |
| File uploads | Max size: 5MB images, 10MB PDFs; allowed types: jpg, png, webp, pdf |
| Rating | `z.number().int().min(1).max(5)` |
| Dates | Valid date format, reasonable range (not in far past/future) |
| Slugs | `z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)` |

### 1.5 API Security

| Control | Implementation |
|---------|---------------|
| Rate limiting (public endpoints) | IP-based: 10 requests/minute for booking, 5/minute for orders, 1 review/24h |
| Rate limiting (auth endpoints) | Supabase built-in |
| Rate limiting (dashboard) | 100 requests/minute per user |
| CORS | Restrict to application domain only |
| Content Security Policy | Strict CSP headers via Next.js middleware |
| Cron job authentication | Secret-based (`CRON_SECRET` in header, verified in API route) |
| File upload validation | Server-side file type verification (not just extension), size limits |
| SQL injection | Prevented by Supabase client (parameterized queries) |
| XSS prevention | React's built-in escaping + sanitize user-generated content before rendering |

### 1.6 Data Protection

| Data Category | Classification | Protection |
|---------------|---------------|------------|
| Patient personal info (name, phone, email) | PII | Encrypted at rest (Supabase), access-controlled |
| Clinical notes | Sensitive/Medical | RLS restricted to Super Admin, encrypted at rest |
| Before/After photos (private) | Sensitive/Medical | Private storage bucket, signed URLs, consent-gated |
| Financial data (purchase prices, margins) | Confidential/Business | RLS restricted to Super Admin |
| Passwords | Secret | Hashed by Supabase Auth (bcrypt) |
| API keys / secrets | Secret | Environment variables only, never in client code |
| Audit logs | Internal | Append-only, not modifiable |
| Email addresses | PII | Collected optionally, used only for transactional emails |

### 1.7 Data Minimization

| Principle | Implementation |
|-----------|---------------|
| Collect only necessary data | Phone required, email optional, DOB optional, address optional |
| No mandatory customer accounts | Guest checkout for orders, no login for booking |
| IP addresses stored for rate limiting only | Purged per retention schedule |
| Before/After photos require explicit consent | No photos displayed publicly without consent |
| No tracking or analytics cookies | Only essential cookies (auth session) |
| No third-party analytics in MVP | Google Analytics deferred to post-MVP |

---

## 2. Privacy Considerations

### 2.1 Regulatory Context

| Area | Status |
|------|--------|
| Pakistan PECA (Prevention of Electronic Crimes Act) | Awareness only — no specific compliance certification |
| GDPR applicability | Not directly applicable (Pakistan-only operations), but best practices followed |
| Medical data protection | No specific Pakistan medical data law, but clinical notes treated as highly sensitive |
| Tax/Financial records | Income Tax Ordinance 2001 — retain financial records for 6 years |
| FBR POS compliance | **NOT CLAIMED** — invoice format is inspired only, with disclaimer |

### 2.2 Privacy Controls

| Control | Detail |
|---------|--------|
| Privacy Policy page | Required — available at `/privacy` |
| Terms of Service page | Required — available at `/terms` |
| Consent for B/A photo publication | Explicit consent recording with date and notes |
| Right to deletion | Soft delete with PII anonymization capability |
| Email opt-out | Transactional emails only; no marketing without consent |
| Data portability | CSV export capability for patient's own data (admin-facilitated) |
| Data breach response | Documented procedure (notify affected patients, secure accounts) |

### 2.3 Cookie Policy

| Cookie | Purpose | Type | Duration |
|--------|---------|------|----------|
| `sb-access-token` | Supabase Auth | Essential / httpOnly | 1 hour |
| `sb-refresh-token` | Supabase Auth | Essential / httpOnly | 7 days |
| No tracking cookies | — | — | — |
| No third-party cookies | — | — | — |

---

## 3. Accessibility Strategy

### 3.1 WCAG 2.1 Level AA Targets

| Criterion | Target | Implementation |
|-----------|--------|---------------|
| Color contrast | 4.5:1 for normal text, 3:1 for large text | Verified in design system |
| Keyboard navigation | All interactive elements accessible via keyboard | Tab order, focus indicators |
| Screen reader support | Semantic HTML, ARIA labels where needed | shadcn/ui provides accessible components |
| Focus management | Visible focus indicators, logical tab order | CSS `:focus-visible` styles |
| Form accessibility | Labels, error messages, required field indicators | React Hook Form + ARIA |
| Image alt text | All images have descriptive alt text | Enforced in CMS and templates |
| Responsive text | Scalable text, no fixed pixel font sizes | Tailwind responsive utilities |
| Motion | Respect `prefers-reduced-motion` | CSS media query |
| Touch targets | Minimum 44×44px touch targets on mobile | Tailwind sizing |
| Language | `lang="en"` on HTML element | Next.js layout |

### 3.2 Accessibility Testing

| Method | Tool | When |
|--------|------|------|
| Automated scanning | axe-core (via @axe-core/react in dev) | Development |
| Lighthouse audit | Chrome DevTools | Pre-deployment |
| Manual keyboard testing | Manual | Each major feature |
| Screen reader testing | NVDA or VoiceOver | Major pages |

---

## 4. Operational Risks

### 4.1 Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-01 | Supabase service outage | Low | High | Supabase has 99.9% SLA; implement graceful degradation; display "temporarily unavailable" message |
| R-02 | Vercel deployment failure | Low | Medium | Preview deployments for testing; rollback capability; no database migrations in deployment |
| R-03 | Email delivery failure | Medium | Medium | Non-blocking email sends; manual retry; email log for debugging |
| R-04 | Stock overselling (race condition) | Low | High | Row-level locking; transaction isolation; constraint checks |
| R-05 | Invoice numbering gap | Low | Medium | Atomic sequence generation; transaction-level generation |
| R-06 | Data loss from accidental deletion | Low | Critical | Soft deletes everywhere; Supabase daily backups; point-in-time recovery (Pro plan) |
| R-07 | Unauthorized access to clinical notes | Low | Critical | RLS + server-side checks + UI-level hiding; audit logging |
| R-08 | Before/After photo leaked without consent | Low | High | Private storage bucket; consent check before publication; audit trail |
| R-09 | Appointment spam/abuse | Medium | Low | Rate limiting; honeypot; IP tracking |
| R-10 | Order spam/abuse | Medium | Medium | Rate limiting; phone validation; manual confirmation step |
| R-11 | Large file upload abuse | Medium | Low | File size limits (5MB); type validation; Supabase Storage policies |
| R-12 | Admin account compromise | Low | Critical | Strong password; consider MFA post-MVP; audit logging |
| R-13 | Browser compatibility issues | Low | Low | Modern browser targeting; progressive enhancement |
| R-14 | Slow performance under load | Low | Medium | SSG/ISR for public pages; efficient queries; pagination |
| R-15 | Stale cache serving wrong prices/stock | Medium | Medium | ISR with appropriate intervals; on-demand revalidation |

### 4.2 Incident Response Plan

```
1. DETECT
   ├── Monitoring: Vercel Analytics, Supabase Dashboard
   ├── Error tracking: Console errors logged
   └── User reports via contact form or direct communication

2. ASSESS
   ├── Severity: Critical (data loss/breach) / High (feature down) / Medium / Low
   └── Scope: How many users affected?

3. RESPOND
   ├── Critical: Immediate action by admin
   ├── High: Fix within 4 hours during business hours
   ├── Medium: Fix within 24 hours
   └── Low: Fix in next development cycle

4. RECOVER
   ├── Database: Restore from Supabase backup if needed
   ├── Application: Rollback Vercel deployment
   └── Communications: Notify affected users if data involved

5. POST-MORTEM
   ├── Document what happened
   ├── Identify root cause
   └── Implement preventive measures
```

---

## 5. Testing Strategy

### 5.1 Testing Pyramid

```
         ┌────────────┐
         │   E2E      │  ← Few critical paths
         │   Tests    │     (Playwright)
         ├────────────┤
         │ Integration │  ← Module interactions
         │   Tests     │     (Vitest + Supabase)
         ├────────────┤
         │   Unit      │  ← Business logic, utils
         │   Tests     │     (Vitest)
         ├────────────┤
         │  Schema     │  ← Zod validations
         │  Tests      │     (Vitest)
         └────────────┘
```

### 5.2 Unit Tests (Vitest)

| Target | Test Cases |
|--------|-----------|
| Zod schemas | Valid/invalid inputs for all forms |
| Utility functions | Currency formatting, date formatting, slug generation |
| Invoice number generation | Sequence, year rollover, format |
| Stock calculations | Available stock, reservation math |
| Discount calculations | Percentage, fixed, combined, edge cases |
| Tax calculations | Various rates, rounding |
| Phone number validation | Valid/invalid Pakistani formats |
| Permission checks | Role-based access function results |
| Order status transitions | Valid/invalid transitions |

### 5.3 Integration Tests (Vitest + Supabase Local)

| Target | Test Cases |
|--------|-----------|
| POS sale transaction | Complete flow: cart → payment → stock deduction → invoice |
| POS sale with insufficient stock | Should fail gracefully, no partial deductions |
| POS duplicate prevention | Idempotency key prevents double sale |
| Order placement | Cart → checkout → stock reservation |
| Order cancellation | Stock reservation release |
| Order fulfillment | Stock deduction, invoice generation |
| Appointment CRUD | Create, confirm, reschedule, cancel, complete |
| Patient CRUD | Create, update, soft delete |
| Clinical notes access | Super Admin can access; receptionist cannot |
| Invoice immutability | Verify invoices cannot be updated |
| Invoice void | Credit note creation |
| Stock movement logging | Every operation creates movement record |
| RLS policies | Test each policy with different role contexts |

### 5.4 End-to-End Tests (Playwright)

| Flow | Priority | Test Cases |
|------|----------|-----------|
| **Appointment Booking** | P0 | Complete booking form → confirmation page → dashboard shows new booking |
| **POS Sale** | P0 | Select customer → add items → apply discount → pay → receipt generated |
| **Product Ordering** | P0 | Browse → add to cart → checkout → confirmation → dashboard shows order |
| **Patient Registration** | P0 | Create patient → view profile → edit details |
| **Login/Logout** | P0 | Login → access dashboard → logout → redirect to login |
| **Invoice Print** | P1 | Complete sale → view invoice → print thermal + A4 layouts |
| **Order Fulfillment** | P1 | Confirm order → prepare → fulfill → mark delivered |
| **Review Submission** | P1 | Submit review → moderation queue → approve → visible on public site |
| **Before/After Upload** | P2 | Upload pair → set consent → publish → visible in gallery |
| **Inventory Management** | P2 | Add product → adjust stock → verify movement history |
| **Role Restrictions** | P1 | Login as receptionist → verify restricted pages/actions are blocked |

### 5.5 Visual / Design Testing

| Method | Tool | Coverage |
|--------|------|----------|
| Responsive testing | Playwright viewport tests | Mobile (375px), Tablet (768px), Desktop (1280px) |
| Cross-browser | Playwright (Chromium, Firefox, WebKit) | All major browsers |
| Print layout testing | Manual | Thermal receipt, A4 invoice |
| Dark mode (if applicable) | Manual/automated | Consistent across components |

### 5.6 Performance Testing

| Target | Tool | Threshold |
|--------|------|-----------|
| Public pages LCP | Lighthouse CI | < 2.5s |
| Public pages FCP | Lighthouse CI | < 1.5s |
| Public pages CLS | Lighthouse CI | < 0.1 |
| Dashboard page load | Manual benchmark | < 3s |
| POS transaction time | Integration test timing | < 2s server-side |
| API response time (p95) | Manual benchmark | < 500ms |
| Build time | CI pipeline | < 5 minutes |

### 5.7 Security Testing

| Test | Method | Frequency |
|------|--------|-----------|
| RLS policy verification | Integration tests with different auth contexts | Every migration |
| Input validation bypass | Attempt invalid data via direct API calls | Per feature |
| Authentication bypass | Test protected routes without auth token | Per feature |
| Role escalation | Test receptionist accessing admin-only endpoints | Per feature |
| File upload abuse | Upload invalid files, oversized files, wrong types | Initial + regression |
| Rate limiting verification | Rapid requests to public endpoints | Initial setup |
| CSRF verification | Cross-origin request tests | Initial setup |

### 5.8 Testing Environment

| Environment | Purpose | Database |
|-------------|---------|----------|
| Local development | Developer testing | Supabase local (Docker) |
| Preview (Vercel) | PR review + QA | Supabase dev project |
| Staging | Pre-production testing | Supabase staging project (optional for 2-person team) |
| Production | Live | Supabase production project |

### 5.9 Test Data Strategy

| Approach | Detail |
|----------|--------|
| Seed data | `supabase/seed.sql` with realistic test data |
| Test fixtures | JSON fixtures for unit tests |
| Factory functions | Programmatic test data generation for integration tests |
| No production data in tests | Always use synthetic data |
| Test cleanup | Each integration test cleans up after itself |

---

## 6. Quality Assurance Checklist

### Pre-Release Checklist

- [ ] All P0 E2E tests pass
- [ ] All unit and integration tests pass
- [ ] Lighthouse scores: Performance > 90, Accessibility > 90, SEO > 90
- [ ] Mobile responsiveness verified on iPhone SE, iPhone 14, Galaxy S21
- [ ] Print layouts verified (thermal receipt + A4)
- [ ] All forms validate correctly (client + server)
- [ ] RLS policies verified for all tables
- [ ] Role restrictions verified (receptionist cannot access admin features)
- [ ] Rate limiting working on public endpoints
- [ ] Email delivery working for all templates
- [ ] Invoice numbering sequential and correct
- [ ] POS sale transaction atomicity verified
- [ ] Stock deduction accuracy verified
- [ ] Error handling covers all major failure modes
- [ ] No console errors in production build
- [ ] Environment variables properly configured
- [ ] Database migrations run cleanly
- [ ] Backup and recovery procedure tested
- [ ] Privacy policy and terms pages present
- [ ] FBR disclaimer present on invoices
- [ ] SEO meta tags and structured data verified
- [ ] Sitemap.xml generated correctly
