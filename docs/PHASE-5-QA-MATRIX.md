# Brimish Skin Care Clinic — Production QA Matrix & Verification Report

**Target Environment**: Next.js 16 (Turbopack) | Supabase PostgreSQL 15 | Resend | Vercel  
**Phase**: Phase 5 — Production Integration, Security Hardening & Real-Data QA  
**Date**: October 2026  
**Status**: Comprehensive Verification Completed  

---

## 1. Authentication & Access Control (RBAC) Matrix

| Test ID | Test Scenario | Actor / Role | Expected Result | Verification Status | Notes / Edge Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Doctor Login | `super_admin` | Authenticated; redirected to `/dashboard`; full operational access granted. | **PASS** | Session cookie created via Supabase Auth SSR. |
| **AUTH-02** | Receptionist Login | `receptionist` | Authenticated; redirected to `/dashboard`; clinical notes hidden; settings read-only. | **PASS** | Evaluated via `staff` profile role check. |
| **AUTH-03** | User Logout | Any authenticated | Supabase session cleared; auth cookies evicted; redirected to `/auth/login`. | **PASS** | Handled by `/auth/signout` route handler. |
| **AUTH-04** | Invalid Credentials | Unauthenticated | Error toast shown ("Invalid login credentials"); no internal error leaked. | **PASS** | Generic error message prevents user enumeration. |
| **AUTH-05** | Unauthorized Route Access | Anonymous | Direct navigation to `/dashboard/*` triggers redirect to `/auth/login?next=...` | **PASS** | Enforced by Next.js `proxy.ts` middleware. |
| **AUTH-06** | Receptionist Accessing Settings Edit | `receptionist` | Blocked at server action level with `Unauthorized: Only administrators can modify clinic settings`. | **PASS** | RLS policy + server action assertion check. |

---

## 2. Patient Management & Privacy Matrix

| Test ID | Test Scenario | Actor / Role | Expected Result | Verification Status | Notes / Edge Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PAT-01** | Create New Patient | Receptionist / Admin | Patient record created with MRN, name, phone, medical alerts; audit log generated. | **PASS** | Phone validated with standard format. |
| **PAT-02** | Duplicate Phone Check | Receptionist / Admin | Warns or prevents accidental duplicate creation based on matching phone number. | **PASS** | Phone indexed with unique check. |
| **PAT-03** | Edit Patient Information | Receptionist / Admin | Patient demographics updated; historical visits and invoices remain linked. | **PASS** | Referential integrity maintained. |
| **PAT-04** | View Patient Profile | Receptionist / Admin | Demographics, past visits, invoices, appointments displayed. | **PASS** | Query filtered by patient ID. |
| **PAT-05** | Clinical Notes Authorization | Receptionist | Receptionist views patient profile; clinical/treatment notes section is masked/hidden. | **PASS** | Doctor-only clinical fields restricted by role guard. |
| **PAT-06** | Clinical Notes Authorization | Doctor (`super_admin`) | Doctor views and updates confidential treatment notes and medical observations. | **PASS** | Full clinical view accessible. |

---

## 3. Appointment Lifecycle Matrix

| Test ID | Test Scenario | Actor / Role | Expected Result | Verification Status | Notes / Edge Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **APT-01** | Public Online Booking | Public Patient | Booking submitted with status `pending`; confirmation email dispatched. | **PASS** | Anonymous insertion permitted via public RLS. |
| **APT-02** | Dashboard Booking | Receptionist / Admin | Staff books appointment directly; status can be set to `confirmed` immediately. | **PASS** | Staff authenticated write. |
| **APT-03** | Confirm Appointment | Receptionist / Admin | Status changes to `confirmed`; confirmation email dispatched to patient. | **PASS** | Email sent with appointment details and instructions. |
| **APT-04** | Patient Check-In | Receptionist / Admin | Status moves to `checked_in`; arrival timestamp recorded; patient shows in waiting queue. | **PASS** | Queue list updates in real-time. |
| **APT-05** | Complete Appointment | Receptionist / Admin | Status moves to `completed`; linked to visit record or POS invoice if billing. | **PASS** | Status transition validated. |
| **APT-06** | Cancel Appointment | Patient / Staff | Status moves to `cancelled`; cancellation email dispatched; slot released. | **PASS** | Reason for cancellation recorded. |
| **APT-07** | Mark No-Show | Receptionist / Admin | Status moves to `no_show`; recorded in patient history for follow-up. | **PASS** | Flagged in patient profile. |
| **APT-08** | Reschedule Appointment | Receptionist / Admin | Date/time updated; patient notified via email; previous slot released. | **PASS** | Prevents double-booking same slot. |

---

## 4. Visit Management Matrix

| Test ID | Test Scenario | Actor / Role | Expected Result | Verification Status | Notes / Edge Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VIS-01** | Record Visit | Doctor | New visit record created linked to patient and appointment. | **PASS** | Timestamps and provider captured. |
| **VIS-02** | Select Treatment Performed | Doctor | Treatment added to visit record; duration and base pricing captured. | **PASS** | References active treatment catalog. |
| **VIS-03** | Record Clinical Notes | Doctor | Confidential clinical notes and observations saved. | **PASS** | Never exposed to public or non-doctor roles. |
| **VIS-04** | Record Consumables / Products Used | Doctor | Consumable product deducted from inventory; stock movement type `treatment_use`. | **PASS** | Stock deducted via `atomic_deduct_stock`. |
| **VIS-05** | Verify Patient History Update | Doctor / Staff | Completed visit appears chronologically in patient medical history timeline. | **PASS** | Sorted by `visited_at DESC`. |

---

## 5. Point of Sale (POS) Matrix

| Test ID | Test Scenario | Actor / Role | Expected Result | Verification Status | Notes / Edge Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POS-01** | Retail Product Sale | Receptionist / Admin | Cart contains products; total calculated; stock deducted; invoice generated. | **PASS** | Atomic stock deduction prevents negative stock. |
| **POS-02** | Treatment / Service Sale | Receptionist / Admin | Cart contains treatments; total calculated; invoice created; zero stock impact. | **PASS** | Service line items don't require inventory. |
| **POS-03** | Mixed Sale (Product + Service) | Receptionist / Admin | Both line items billed on single tax invoice; stock deducted ONLY for products. | **PASS** | Handled correctly by POS processor. |
| **POS-04** | Percentage & Flat Discounts | Receptionist / Admin | Server calculates discount; discount cannot exceed subtotal; grand total correct. | **PASS** | Server-side validation prevents negative totals. |
| **POS-05** | Tax Calculation | Receptionist / Admin | Tax calculated on taxable amount; rate adheres to `clinic_settings.default_tax_rate`. | **PASS** | Rounded to 2 decimal places. |
| **POS-06** | Multi-Payment Methods | Receptionist / Admin | Supports Cash, Card, Bank Transfer; payment records created; invoice marked paid. | **PASS** | Balance due matches zero on full payment. |
| **POS-07** | Double-Click Protection | Receptionist / Admin | Rapid multiple clicks on "Complete Sale" does NOT create duplicate invoices or sales. | **PASS** | Button disabled during in-flight submission. |

---

## 6. Website Orders & E-Commerce Matrix

| Test ID | Test Scenario | Actor / Role | Expected Result | Verification Status | Notes / Edge Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ORD-01** | Public Cart & Checkout | Public Customer | Order submitted; stock reserved (`atomic_reserve_stock`); order status `pending`. | **PASS** | Stock reserved so other buyers cannot take it. |
| **ORD-02** | Order Status: Pending → Confirmed | Receptionist / Admin | Staff reviews order and confirms; confirmation email sent to customer. | **PASS** | Handled via `updateOrderStatus`. |
| **ORD-03** | Order Status: Confirmed → Preparing | Staff | Status updated; order dispatched to dispensary/packaging. | **PASS** | Status transition valid. |
| **ORD-04** | Order Status: Preparing → Ready | Staff | Status updated; pickup notification or courier manifest created. | **PASS** | Customer notified if pickup order. |
| **ORD-05** | Order Status: Ready → Delivered | Staff | Status updated to `delivered`; reserved stock finalized; invoice created. | **PASS** | Fixed in Phase 5 transition map. |
| **ORD-06** | Order Cancellation | Staff / System | Order status `cancelled`; reserved stock returned to available inventory. | **PASS** | Stock balance restored atomically. |
| **ORD-07** | Race-Condition Overselling | Concurrent Users | 2 users buy last item simultaneously; first succeeds, second receives out-of-stock. | **PASS** | Protected by `atomic_reserve_stock` `FOR UPDATE`. |

---

## 7. Invoicing & Financial Integrity Matrix

| Test ID | Test Scenario | Actor / Role | Expected Result | Verification Status | Notes / Edge Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **INV-01** | View Invoice Details | Receptionist / Admin | Full line-item breakdown, subtotal, discount, tax, payment history displayed. | **PASS** | Professional layout with clinic branding. |
| **INV-02** | Thermal Receipt Print (80mm) | Receptionist | Clean 80mm roll print view without web browser headers/footers. | **PASS** | `@media print` CSS handles 80mm formatting. |
| **INV-03** | A4 Standard Invoice Print | Receptionist / Admin | Full-page A4 format with clinic letterhead, NTN, STRN, payment summary. | **PASS** | Optimized A4 print stylesheet. |
| **INV-04** | Email Invoice to Patient | Staff | Formatted HTML invoice dispatched via Resend; failure logged without corrupting bill. | **PASS** | `sendInvoiceEmailTemplate` integrated. |
| **INV-05** | Void Invoice | Admin (`super_admin`) | Invoice status set to `voided`; void reason recorded; audit log created. | **PASS** | Prevents alteration of historical numbers. |
| **INV-06** | Voided Invoice Audit Trail | Admin | Voided status clearly displayed with strikethrough/badge; financial reports adjust. | **PASS** | Preserves historical traceability. |

---

## 8. Inventory Consistency Matrix

| Test ID | Test Scenario | Actor / Role | Expected Result | Verification Status | Notes / Edge Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **INV-01** | Purchase / Restock | Staff | Stock added; average unit cost recorded; inventory movement created. | **PASS** | Movement type `purchase`. |
| **INV-02** | Manual Inventory Adjustment | Admin / Staff | Stock adjusted for damage/expiry; audit note logged; stock updated. | **PASS** | Movement type `adjustment`. |
| **INV-03** | Low Stock Alert | Dashboard | Products with stock <= `reorder_level` appear in Low Stock dashboard widget. | **PASS** | Visual warning badge displayed. |
| **INV-04** | Negative Stock Prevention | POS / Orders | Attempt to deduct stock below zero rejected with clear error. | **PASS** | Enforced by PostgreSQL constraint + check. |

---

## 9. Customer Reviews & Content Moderation Matrix

| Test ID | Test Scenario | Actor / Role | Expected Result | Verification Status | Notes / Edge Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REV-01** | Public Review Submission | Public Patient | Review submitted with status `pending`; NOT visible on public website yet. | **PASS** | Enforced by RLS (`is_approved = true`). |
| **REV-02** | Staff Moderation: Approve | Admin / Staff | Review approved; instantly appears in public reviews gallery. | **PASS** | Status updated to approved. |
| **REV-03** | Staff Moderation: Reject | Admin / Staff | Review rejected or archived; never displayed publicly. | **PASS** | Hidden from public queries. |

---

## 10. Before / After Gallery & Clinical Consent Matrix

| Test ID | Test Scenario | Actor / Role | Expected Result | Verification Status | Notes / Edge Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BA-01** | Upload Case Photos | Doctor / Admin | Before & After images uploaded to `before-after-images` bucket. | **PASS** | Validated for MIME, size, extension. |
| **BA-02** | Patient Consent Enforcement | System | Case cannot be set to `is_public: true` unless `consent_obtained: true`. | **PASS** | Enforced in server action validation. |
| **BA-03** | Public Gallery Visibility | Public Visitor | Only cases with `is_published: true` AND `consent_obtained: true` are visible. | **PASS** | Enforced by RLS policy on storage & table. |
| **BA-04** | Consent Revocation | Doctor / Admin | If patient revokes consent, case `consent_obtained` set to `false`; immediately hidden. | **PASS** | Public query returns 0 records. |
| **BA-05** | Interactive Slider | Public Visitor | Before/After image comparison slider slides smoothly without layout shifts. | **PASS** | Fully responsive touch/mouse controls. |

---

## 11. Responsive Viewport Verification Matrix

| Viewport | Target Device | Layout Behavior | Status |
| :--- | :--- | :--- | :--- |
| **360px** | Small Android (Galaxy S8) | Single-column stack, mobile sheet nav, cart accessible, font sizes legible. | **PASS** |
| **390px** | Standard iPhone (12/13/14) | Sticky mobile bottom bar, touch targets >= 44px, appointment picker wraps smoothly. | **PASS** |
| **430px** | Large iPhone (Pro Max) | Crisp responsive typography, optimal whitespace, checkout form stacks neatly. | **PASS** |
| **768px** | iPad Portrait / Small Tablets | 2-column product/treatment grid, collapsible sidebar navigation in dashboard. | **PASS** |
| **1024px** | iPad Landscape / Small Laptops | Full dashboard navigation visible, POS 2-column layout (cart + catalog). | **PASS** |
| **1280px** | Standard Desktop Display | Full 3-column product catalog, wide data tables with horizontal scroll if needed. | **PASS** |
| **1440px+** | High-DPI Desktop Monitor | Max container width constraint (`max-w-7xl`), centered alignment, zero pixelation. | **PASS** |

---

## 12. Accessibility (a11y) & SEO Verification

| Area | Requirement | Evaluation | Status |
| :--- | :--- | :--- | :--- |
| **Keyboard Nav** | All interactive elements navigable via Tab / Shift+Tab | Focus visible ring on buttons, inputs, links. | **PASS** |
| **Contrast Ratio**| WCAG 2.1 AA compliant color contrast (>= 4.5:1) | Slate/Gray on white, rose accents meet minimum ratios. | **PASS** |
| **Screen Readers**| Form inputs have associated `<label>` or `aria-label` | Radix UI primitives provide accessible ARIA attributes. | **PASS** |
| **Dialog Modals** | Focus trapped inside open dialogs; ESC key closes | Handled by Radix UI dialog primitive. | **PASS** |
| **Semantic HTML** | One `<h1>` per page, hierarchical `<h2>`/`<h3>` headings | Validated across public and dashboard pages. | **PASS** |
| **Search Engine** | Canonical tags, robots.txt, dynamic sitemap.xml, Schema.org | Implemented via `sitemap.ts`, `robots.ts`, layout metadata. | **PASS** |
