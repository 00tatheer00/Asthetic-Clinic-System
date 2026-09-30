# 01 — Product Requirements Document

## Brimish Skin Care Clinic — Integrated Website & Management Platform

**Version:** 1.0.0-draft
**Date:** 2026-10-01
**Status:** Awaiting Stakeholder Approval

---

## 1. Executive Summary

Brimish Skin Care Clinic is a small aesthetic/dermatology clinic in Peshawar, Pakistan, operated by a doctor (owner) and a receptionist. The platform combines a premium public-facing website with an internal clinic management dashboard. The public site targets non-technical patients who need simple appointment booking and product ordering. The internal dashboard supports daily clinic operations: patient management, POS, invoicing, inventory, and clinical records.

---

## 2. Stakeholder Roles

| Role | Person(s) | Primary Concerns |
|------|-----------|------------------|
| Clinic Owner / Doctor | 1 | Full control, clinical records, business reporting, content management |
| Receptionist | 1 | Daily operations — appointments, POS, patient intake, orders |
| Patients (Public) | Many | Book appointments, browse treatments, order products |
| Website Visitors | Many | Learn about clinic, read reviews, view before/after results |

---

## 3. Normalized Functional Requirements

### 3.1 Public Website

| ID | Requirement | Priority |
|----|-------------|----------|
| PW-01 | Home page with clinic branding, featured treatments, CTAs | MVP |
| PW-02 | About page with clinic story, doctor profile, credentials | MVP |
| PW-03 | Treatments listing page with categories | MVP |
| PW-04 | Treatment detail page with description, pricing, duration, CTA | MVP |
| PW-05 | Products listing page with categories, pricing | MVP |
| PW-06 | Product detail page with images, description, pricing, add-to-cart | MVP |
| PW-07 | Before/After gallery with interactive comparison slider | MVP |
| PW-08 | Reviews page showing approved patient reviews | MVP |
| PW-09 | Contact page with clinic info, map, contact form | MVP |
| PW-10 | Appointment booking form (no login required) | MVP |
| PW-11 | Product ordering with guest checkout | MVP |
| PW-12 | Review submission form with spam prevention | MVP |
| PW-13 | SEO optimization (meta tags, structured data, sitemap.xml) | MVP |
| PW-14 | Mobile-first responsive design | MVP |
| PW-15 | Pakistani locale: PKR currency, Asia/Karachi timezone | MVP |

### 3.2 Appointment Booking

| ID | Requirement | Priority |
|----|-------------|----------|
| AB-01 | Collect: name, Pakistani phone, treatment, preferred date/time, optional message | MVP |
| AB-02 | No mandatory login or registration | MVP |
| AB-03 | Booking confirmation screen/page after submission | MVP |
| AB-04 | Email notification to clinic on new booking | MVP |
| AB-05 | Receptionist can view, confirm, reschedule, or cancel appointments | MVP |
| AB-06 | Patient receives confirmation email when appointment is confirmed | MVP |
| AB-07 | Appointment reminder email (configurable timing, e.g., 24h before) | MVP |
| AB-08 | Link appointment to existing patient record if phone matches | MVP |
| AB-09 | Dashboard calendar view for appointments | MVP |

### 3.3 Patient Management

| ID | Requirement | Priority |
|----|-------------|----------|
| PM-01 | Patient registration with name, phone, email (optional), gender, date of birth (optional), address (optional) | MVP |
| PM-02 | Patient profile page showing complete history | MVP |
| PM-03 | Visit history log (date, treatment, provider, notes reference) | MVP |
| PM-04 | Previous treatments summary | MVP |
| PM-05 | Last visit date auto-calculated | MVP |
| PM-06 | Patient purchase history | MVP |
| PM-07 | Patient invoices | MVP |
| PM-08 | Before/After photos linked to patient with consent records | MVP |
| PM-09 | Follow-up appointment scheduling from patient profile | MVP |
| PM-10 | Patient search by name, phone number | MVP |
| PM-11 | Clinical notes (restricted to Doctor only) | MVP |

### 3.4 POS (Point of Sale)

| ID | Requirement | Priority |
|----|-------------|----------|
| POS-01 | Create walk-in sales for products and services | MVP |
| POS-02 | Unified shopping cart for products and services | MVP |
| POS-03 | Select existing patient or create walk-in customer | MVP |
| POS-04 | Apply percentage or fixed-amount discounts | MVP |
| POS-05 | Support multiple payment methods (cash, card, bank transfer) | MVP |
| POS-06 | Automatic invoice generation on sale completion | MVP |
| POS-07 | Print-friendly thermal receipt layout | MVP |
| POS-08 | Historical sales records with search and filtering | MVP |
| POS-09 | Atomic stock deduction on sale completion | MVP |
| POS-10 | Prevent overselling (stock validation before sale completion) | MVP |

### 3.5 Invoicing

| ID | Requirement | Priority |
|----|-------------|----------|
| INV-01 | Unique, immutable, sequential invoice identifiers | MVP |
| INV-02 | Clinic identity fields (name, address, NTN, STRN) | MVP |
| INV-03 | Pakistan/FBR-inspired invoice presentation (NOT claiming FBR compliance) | MVP |
| INV-04 | Thermal receipt print layout (58mm/80mm) | MVP |
| INV-05 | A4 print layout | MVP |
| INV-06 | PDF export | MVP |
| INV-07 | Email invoice delivery | MVP |
| INV-08 | Invoice history with search, filtering, reprinting | MVP |
| INV-09 | Invoice linked to sale/order and patient/customer | MVP |
| INV-10 | Line items with quantity, unit price, discount, total | MVP |
| INV-11 | Tax/GST fields (configurable, not auto-calculated from FBR) | MVP |

### 3.6 Inventory Management

| ID | Requirement | Priority |
|----|-------------|----------|
| INV-M-01 | Product CRUD (create, read, update, soft-delete) | MVP |
| INV-M-02 | Product categories | MVP |
| INV-M-03 | SKU per product | MVP |
| INV-M-04 | Purchase price and sale price | MVP |
| INV-M-05 | Stock quantity tracking | MVP |
| INV-M-06 | Manual stock adjustments with reason | MVP |
| INV-M-07 | Low-stock alert threshold per product | MVP |
| INV-M-08 | Expiry date tracking (optional per product) | MVP |
| INV-M-09 | Inventory movement history (audit trail) | MVP |
| INV-M-10 | Atomic stock deduction on POS sale completion | MVP |
| INV-M-11 | Reservation policy for online orders; deduction on fulfillment | MVP |
| INV-M-12 | Protection against overselling and duplicate deductions | MVP |

### 3.7 Website Orders

| ID | Requirement | Priority |
|----|-------------|----------|
| WO-01 | Guest checkout (name, phone, email optional) | MVP |
| WO-02 | Delivery or pickup selection | MVP |
| WO-03 | Delivery address collection (for delivery orders) | MVP |
| WO-04 | Order management dashboard | MVP |
| WO-05 | Order status tracking (received → confirmed → preparing → ready/shipped → delivered/picked-up → completed) | MVP |
| WO-06 | Stock reservation on order placement; deduction on fulfillment | MVP |
| WO-07 | Invoice generation at fulfillment event | MVP |
| WO-08 | Customer email notifications on status changes | MVP |
| WO-09 | Order cancellation handling with stock release | MVP |

### 3.8 Reviews

| ID | Requirement | Priority |
|----|-------------|----------|
| RV-01 | Public review submission form (name, rating, text, treatment reference optional) | MVP |
| RV-02 | Spam prevention (rate limiting, honeypot, optional CAPTCHA) | MVP |
| RV-03 | Moderation queue — all reviews require approval | MVP |
| RV-04 | Approve, reject, or delete reviews | MVP |
| RV-05 | Published reviews displayed on public site | MVP |

### 3.9 Before/After Gallery

| ID | Requirement | Priority |
|----|-------------|----------|
| BA-01 | Upload paired before/after images | MVP |
| BA-02 | Interactive draggable comparison slider on public site | MVP |
| BA-03 | Categorize by treatment type | MVP |
| BA-04 | Record explicit patient consent for publication | MVP |
| BA-05 | Public/private visibility toggle | MVP |
| BA-06 | Private images stored securely (not publicly accessible) | MVP |
| BA-07 | Link to patient record | MVP |

### 3.10 Automation & Notifications

| ID | Requirement | Priority |
|----|-------------|----------|
| AU-01 | Appointment received email (to clinic) | MVP |
| AU-02 | Appointment confirmed email (to patient) | MVP |
| AU-03 | Appointment reminder email (to patient, configurable timing) | MVP |
| AU-04 | Order status change emails (to customer) | MVP |
| AU-05 | Invoice email delivery (to patient/customer) | MVP |
| AU-06 | Low-stock alert notification (to admin) | MVP |
| AU-07 | Visit history auto-update on appointment completion | MVP |
| AU-08 | Audit logging for critical operations | MVP |
| AU-09 | CSV export for applicable data modules | MVP |
| AU-10 | Review request email after visit (post-MVP consideration) | Post-MVP |

### 3.11 CMS / Content Management

| ID | Requirement | Priority |
|----|-------------|----------|
| CM-01 | Manage treatments (CRUD) from dashboard | MVP |
| CM-02 | Manage products displayed on public site from dashboard | MVP |
| CM-03 | Manage before/after gallery from dashboard | MVP |
| CM-04 | Manage reviews (moderation) from dashboard | MVP |
| CM-05 | Clinic settings (name, address, phone, email, social links, tax IDs) | MVP |
| CM-06 | Operating hours management | MVP |

---

## 4. Missing Requirements Identified

| ID | Gap | Recommendation | Decision Required |
|----|-----|----------------|-------------------|
| GAP-01 | **No payment gateway specified** for online orders | Online orders likely need to support COD (Cash on Delivery) initially. Digital payment gateway (JazzCash, EasyPaisa, card) is a post-MVP enhancement. | ✅ Confirm COD-only for MVP |
| GAP-02 | **No delivery fee or shipping policy** defined | Need delivery radius, flat fee, or free delivery threshold. | ✅ Define delivery policy |
| GAP-03 | **No minimum order amount** specified | Decide if there's a minimum for delivery orders. | ✅ Define or skip |
| GAP-04 | **No product variant model** (sizes, quantities) | Skincare products may have variants (50ml, 100ml). Decide if needed for MVP. | ✅ Confirm single-variant MVP |
| GAP-05 | **No multi-language support** mentioned | Peshawar audience may benefit from Urdu. Consider post-MVP. | Deferred |
| GAP-06 | **No WhatsApp integration** | WhatsApp is dominant in Pakistan for business communication. Consider WhatsApp booking/notifications. | ✅ Post-MVP or parallel channel |
| GAP-07 | **No treatment pricing model clarity** | Are treatment prices fixed, variable (per session), or "starting from"? | ✅ Confirm pricing model |
| GAP-08 | **No cancellation/refund policy** for orders | Need policy for cancelled orders, especially after payment. | ✅ Define policy |
| GAP-09 | **No appointment no-show handling** | How to handle patients who don't show up? | ✅ Define workflow |
| GAP-10 | **No backup/restore procedure** defined | Supabase has built-in backups but need to define RPO/RTO. | Document assumptions |
| GAP-11 | **No analytics/reporting module** specified beyond CSV export | Doctor likely needs revenue reports, appointment stats, popular treatments. | ✅ Define basic reports for MVP |
| GAP-12 | **No file size/format limits** for image uploads | Need limits for before/after photos and product images. | Define technical limits |
| GAP-13 | **No concurrent user/session policy** | Can the doctor and receptionist be logged in simultaneously? (Yes, assumed) | Document assumption |
| GAP-14 | **No partial payment handling** | POS: can a sale have partial payment or split payment? | ✅ Confirm single-payment MVP |
| GAP-15 | **No credit/account balance** for patients | Some clinics allow patient credits or prepaid packages. | Deferred post-MVP |

---

## 5. Contradictions & Ambiguities Resolved

| # | Issue | Resolution |
|---|-------|------------|
| C-01 | "Simple product ordering without mandatory customer registration" vs. need for delivery address and email notifications | Guest checkout collects name, phone, and optionally email + delivery address. No account creation required. If email provided, notifications are sent. Phone is mandatory for order communication. |
| C-02 | "Invoice generation at the appropriate sale/fulfillment event" — which event for online orders? | **For POS:** Invoice generated immediately on sale completion. **For online orders:** Invoice generated at fulfillment (status = ready for pickup / shipped), not at order placement, because stock is only reserved at placement. |
| C-03 | "Reservation/fulfillment stock policy for online orders" vs. "atomic stock deduction for POS" | Two distinct stock operations: POS = immediate atomic deduction. Online orders = soft reservation on placement → hard deduction on fulfillment → release on cancellation. |
| C-04 | Products exist in both inventory (internal) and public website (catalog) | Single product entity with an `is_published` flag. Inventory fields (purchase price, stock) are internal-only. Public site shows sale price, description, images. |
| C-05 | Treatment in appointment booking — is this a free-text field or a selection? | Selection from active treatments managed in the CMS. Provides consistency and links bookings to treatment records. |

---

## 6. Documented Assumptions

| # | Assumption |
|---|-----------|
| A-01 | The clinic has 1 doctor and 1 receptionist. The system should support adding more staff in the future but MVP targets 2 users. |
| A-02 | Pakistani phone numbers follow the format: `03XX-XXXXXXX` (11 digits). Validation will enforce this. |
| A-03 | All monetary values are in PKR (Pakistani Rupees). No multi-currency support. |
| A-04 | All timestamps are stored in UTC and displayed in Asia/Karachi (PKT, UTC+5). |
| A-05 | The clinic operates within defined business hours. Appointment booking respects these hours. |
| A-06 | Email is the primary digital notification channel for MVP. SMS/WhatsApp is post-MVP. |
| A-07 | Online product orders are COD (Cash on Delivery) or pay-at-pickup for MVP. No online payment gateway. |
| A-08 | The doctor is the sole Super Admin. No other admin accounts for MVP. |
| A-09 | FBR-inspired invoice design is aesthetic only. No actual POS integration with FBR systems. This must be clearly documented in the UI and all materials. |
| A-10 | Image storage uses Supabase Storage with private buckets for clinical images and public buckets for website images. |
| A-11 | The system does not handle insurance claims or third-party billing. |
| A-12 | Product reviews are general clinic/treatment reviews, not per-product e-commerce reviews. |
| A-13 | Soft deletes are used for all business entities (products, patients, appointments) to preserve referential integrity and audit trails. |
| A-14 | CSV export is available for: patients, appointments, sales/invoices, inventory, orders. |
| A-15 | The platform targets modern browsers (Chrome, Safari, Firefox, Edge — last 2 versions). No IE11 support. |
| A-16 | Concurrent login by doctor and receptionist is fully supported. |

---

## 7. Critical Business Decisions Required

> [!IMPORTANT]
> The following decisions **block** detailed design and must be resolved before Phase 2.

| # | Decision | Options | Impact |
|---|----------|---------|--------|
| BD-01 | **Online order payment model** | (a) COD only (b) COD + pay-at-pickup (c) Include digital payment | Affects order flow, invoice timing, refund policy |
| BD-02 | **Delivery policy** | (a) Pickup only (b) Local delivery with flat fee (c) Free delivery above threshold | Affects order form, pricing, operations |
| BD-03 | **Treatment pricing display** | (a) Fixed price shown (b) "Starting from" price (c) "Contact for pricing" | Affects treatment detail page and booking form |
| BD-04 | **Appointment time slots** | (a) Free-form preferred time (b) Predefined slots based on operating hours | Affects booking UX and scheduling |
| BD-05 | **Tax/GST handling** | (a) Include configurable GST % on invoices (b) No tax line items (c) Manual tax entry per invoice | Affects invoice template and POS |
| BD-06 | **Discount authorization** | (a) Both doctor and receptionist can apply discounts (b) Only doctor can authorize discounts above a threshold | Affects POS permissions |
| BD-07 | **Product variants** | (a) Single variant per product for MVP (b) Size/quantity variants needed | Affects product schema and POS/cart |
| BD-08 | **Appointment no-show policy** | (a) Mark as no-show, no further action (b) Mark as no-show with notes, track count | Affects appointment workflow |
| BD-09 | **Basic reporting scope for MVP** | (a) Revenue summary only (b) Revenue + appointment stats + top treatments (c) Defer all reporting | Affects dashboard scope |

---

## 8. Non-Functional Requirements Summary

| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | Public page load (LCP) | < 2.5s |
| Performance | Dashboard page load | < 3s |
| Performance | API response time (p95) | < 500ms |
| Availability | Uptime target | 99.5% (Vercel + Supabase) |
| Security | Authentication | Supabase Auth (email + password) |
| Security | Authorization | RLS + server-side middleware checks |
| Security | Data encryption | TLS in transit, AES-256 at rest (Supabase default) |
| Security | Clinical data | Restricted to Doctor role only |
| Accessibility | WCAG compliance target | WCAG 2.1 Level AA (best effort) |
| Localization | Currency | PKR |
| Localization | Timezone | Asia/Karachi (UTC+5) |
| Localization | Language | English (Urdu post-MVP) |
| Data Retention | Patient records | Indefinite (soft delete) |
| Data Retention | Financial records | Minimum 6 years (Pakistan tax law guidance) |
| Data Retention | Audit logs | Minimum 2 years |
| Backup | RPO (Recovery Point Objective) | 24 hours (Supabase daily backups on Pro plan) |
| Backup | RTO (Recovery Time Objective) | < 4 hours |
| Browser Support | Target browsers | Chrome, Safari, Firefox, Edge (last 2 versions) |
| Mobile | Public site | Mobile-first, fully responsive |
| Mobile | Dashboard | Desktop-first, tablet-responsive, mobile-functional |
