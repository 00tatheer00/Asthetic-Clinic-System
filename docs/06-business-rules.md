# 06 — Business Rules

## Brimish Skin Care Clinic — POS, Orders, Inventory, Payments, Invoice Lifecycle & Data Retention

**Version:** 1.0.0-draft
**Date:** 2026-10-01

---

## 1. POS (Point of Sale) Business Rules

### 1.1 Sale Creation Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| POS-R01 | A sale must have at least one line item | Application validation + DB constraint |
| POS-R02 | Each line item must have quantity ≥ 1 | Application validation + DB constraint |
| POS-R03 | Product line items must reference an active, non-deleted product | FK constraint + application check |
| POS-R04 | Service line items must reference an active, non-deleted treatment | FK constraint + application check |
| POS-R05 | Product quantity must not exceed available stock (stock_quantity - reserved_quantity) | Application check within transaction |
| POS-R06 | Unit prices are captured at time of sale (denormalized) and are immutable | Schema design — sale_items stores unit_price |
| POS-R07 | A sale can optionally be linked to a patient; walk-in sales have no patient link | patient_id is nullable |
| POS-R08 | Each sale must have exactly one payment method | ENUM constraint |
| POS-R09 | Sale total = SUM(line_totals) - cart_discount + tax | Application calculation, verified server-side |
| POS-R10 | Duplicate submission protection via idempotency_key | UNIQUE constraint on idempotency_key |

### 1.2 Sale Completion Transaction

The following operations occur atomically within a single database transaction:

```
BEGIN TRANSACTION (SERIALIZABLE isolation for stock operations)
  1. Validate all product stock availability (SELECT ... FOR UPDATE on products)
  2. INSERT sale record
  3. INSERT sale_items records
  4. For each product item:
     a. UPDATE products SET stock_quantity = stock_quantity - item.quantity
     b. INSERT stock_movement (type: 'sale', quantity: -item.quantity)
  5. Generate invoice_number via generate_invoice_number()
  6. INSERT invoice record (denormalize clinic info from settings)
  7. INSERT invoice_line_items
  8. INSERT audit_log entry
  9. If patient linked and treatment sold:
     a. INSERT visit record
COMMIT
```

If any step fails, the entire transaction rolls back. No partial sales.

### 1.3 Sale Void Rules

| Rule | Detail |
|------|--------|
| Only Super Admin can void a completed sale | Role check enforced at API and RLS level |
| Void reason is required | Application validation |
| Voiding a sale does NOT automatically reverse stock | Stock adjustments must be done manually with a clear reference |
| Voiding creates a credit note (new invoice with negative amounts) | Credit note references original invoice |
| Voided sales remain in records permanently | Soft void with `voided_at` timestamp |
| A voided sale cannot be voided again | Application check |

### 1.4 Discount Rules

| Rule | Detail |
|------|--------|
| Discounts can be per-line-item or per-cart | Two levels of discount application |
| Per-item discount: % or fixed amount off the line total | Applied before cart discount |
| Cart discount: % or fixed amount off the subtotal | Applied after individual item discounts |
| Total discount cannot exceed the sale subtotal | Validation prevents negative totals |
| Discount authorization threshold: **DECISION REQUIRED (BD-06)** | If threshold exists, receptionist discounts above X% require admin PIN/approval |
| Discount details are recorded on the sale and line items | Full audit trail |

---

## 2. Order Lifecycle Rules

### 2.1 Order Status State Machine

```
                                    ┌──────────┐
                         ┌─────────▶│ cancelled │
                         │          └──────────┘
                         │               ▲
                         │               │ (at any stage before fulfillment)
                         │               │
┌──────────┐    ┌────────┴───┐    ┌──────┴──────┐    ┌─────────────────┐
│ received │───▶│ confirmed  │───▶│  preparing  │───▶│ ready / shipped │
└──────────┘    └────────────┘    └─────────────┘    └────────┬────────┘
                                                              │
                                                     ┌────────▼─────────┐
                                                     │ delivered /       │
                                                     │ picked_up        │
                                                     └────────┬─────────┘
                                                              │
                                                     ┌────────▼─────────┐
                                                     │   completed      │
                                                     └──────────────────┘
```

### 2.2 Valid Status Transitions

| From | Valid Next States |
|------|------------------|
| `received` | `confirmed`, `cancelled` |
| `confirmed` | `preparing`, `cancelled` |
| `preparing` | `ready` (pickup), `shipped` (delivery), `cancelled` |
| `ready` | `picked_up`, `cancelled` |
| `shipped` | `delivered` |
| `picked_up` | `completed` |
| `delivered` | `completed` |
| `completed` | (terminal state) |
| `cancelled` | (terminal state) |

### 2.3 Order Stock Rules

| Event | Stock Action |
|-------|-------------|
| Order placed (`received`) | **Reserve stock**: `reserved_quantity += item.quantity` for each product |
| Order cancelled (any pre-fulfillment stage) | **Release reservation**: `reserved_quantity -= item.quantity` |
| Order fulfilled (`ready` or `shipped`) | **Hard deduction**: `stock_quantity -= item.quantity`, `reserved_quantity -= item.quantity` |
| Order completed | No additional stock action |

```sql
-- Stock reservation on order placement
UPDATE products
SET reserved_quantity = reserved_quantity + @order_qty
WHERE id = @product_id
  AND (stock_quantity - reserved_quantity) >= @order_qty;
-- If UPDATE affects 0 rows → insufficient stock → reject order

-- Stock fulfillment
UPDATE products
SET stock_quantity = stock_quantity - @order_qty,
    reserved_quantity = reserved_quantity - @order_qty
WHERE id = @product_id;
```

### 2.4 Order Invoice Rules

| Rule | Detail |
|------|--------|
| Invoice is generated at fulfillment (status → `ready` or `shipped`) | Not at order placement |
| Invoice is linked to the order via `order_id` | 1:1 relationship |
| If order is cancelled before fulfillment, no invoice is generated | No financial record for cancelled orders |
| If order is cancelled after invoice generation, invoice must be voided | Admin action required |
| Payment status is `pending` until COD payment is collected | Staff updates payment status manually |

### 2.5 Order Payment (MVP: COD Only)

| Rule | Detail |
|------|--------|
| All online orders are Cash on Delivery for MVP | No online payment processing |
| Payment is collected at delivery/pickup | Staff marks invoice as `paid` when payment received |
| No refund processing in MVP | Cancelled orders before payment require no refund |
| Future: Digital payment integration (JazzCash, EasyPaisa) | Post-MVP enhancement |

---

## 3. Inventory Business Rules

### 3.1 Stock Quantity Model

```
Available Stock = stock_quantity - reserved_quantity

stock_quantity:    Physical stock count (decremented on sale/fulfillment)
reserved_quantity: Temporarily held for pending orders (incremented on order, decremented on fulfillment/cancellation)

Invariants:
  - stock_quantity >= 0 (always)
  - reserved_quantity >= 0 (always)
  - stock_quantity >= reserved_quantity (always, enforced by DB constraint)
  - available_stock >= 0 (derived, enforced by check before operations)
```

### 3.2 Stock Movement Rules

| Movement Type | When | Quantity | Reference |
|---------------|------|----------|-----------|
| `initial` | Product creation with initial stock | + (positive) | product_id |
| `purchase` | Receiving new stock | + (positive) | manual entry |
| `sale` | POS sale completion | - (negative) | sale_id |
| `adjustment` | Manual stock correction | + or - | reason text |
| `return` | Customer return (post-MVP) | + (positive) | sale_id |
| `reservation` | Online order placement | 0 (reserved_qty changes, not stock_qty) | order_id |
| `reservation_release` | Order cancellation | 0 (reserved_qty restored) | order_id |
| `reservation_fulfillment` | Order fulfillment | - (negative, stock_qty decremented) | order_id |
| `correction` | Inventory count discrepancy | + or - | reason text |

### 3.3 Stock Protection Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| INV-R01 | POS sale cannot complete if available stock < requested quantity | Transaction-level check with row locking |
| INV-R02 | Online order cannot be placed if available stock < requested quantity | Server-side check before order creation |
| INV-R03 | Stock deduction uses `SELECT ... FOR UPDATE` to prevent race conditions | Database row-level locking |
| INV-R04 | Each stock movement records `quantity_before` and `quantity_after` | Application ensures these match actual DB state |
| INV-R05 | No duplicate deductions: idempotency key on sales prevents double-processing | UNIQUE constraint |
| INV-R06 | Reserved stock for cancelled orders is always released | Cancellation handler includes reservation release |
| INV-R07 | Stock adjustments require a reason | Application validation (reason NOT NULL for manual movements) |
| INV-R08 | Only Super Admin can perform stock corrections | Role check |

### 3.4 Low-Stock Alert Rules

| Rule | Detail |
|------|--------|
| Each product has a configurable `low_stock_threshold` (default: 5) | Admin sets per product |
| Alert triggered when `stock_quantity <= low_stock_threshold` | Checked after each stock-affecting operation + daily cron |
| Alert sent as email to admin | Via Resend |
| Dashboard shows low-stock badge | Real-time display |
| Alert is informational only — does not block any operations | Products can still be sold even at 0 stock of services |
| Products at 0 available stock show "Out of Stock" on public site | `is_published` products with 0 available stock show badge |

### 3.5 Expiry Date Rules

| Rule | Detail |
|------|--------|
| Expiry date is optional per product | Not all products expire |
| No automatic action on expiry | Informational only — shown in inventory |
| Dashboard highlights expired or soon-to-expire products | Visual indicator (red for expired, yellow for < 30 days) |
| Expired products are not automatically hidden from public site | Admin manually unpublishes or adjusts |

---

## 4. Invoice Lifecycle Rules

### 4.1 Invoice Numbering

| Rule | Detail |
|------|--------|
| Format: `BSC-{YEAR}-{SEQUENTIAL}` | Example: BSC-2026-00001 |
| Sequential numbering per calendar year | Resets to 00001 each January 1 |
| Gap-free within a year | Atomic sequence generation function |
| Number is assigned at creation and never changes | Immutable |
| Year is based on Asia/Karachi timezone | Not UTC |

### 4.2 Invoice Immutability

| Rule | Detail |
|------|--------|
| Once created, an invoice cannot be modified | No `updated_at` column; no UPDATE operations |
| Line items cannot be added, removed, or modified | Immutable after creation |
| Clinic identity is denormalized at creation time | Even if clinic details change later, the invoice reflects details at issuance |
| Prices, quantities, and totals are snapshots | Reflect the actual transaction values |
| To correct an error, the invoice must be voided and a new one issued | Void + credit note pattern |

### 4.3 Invoice Generation Triggers

| Trigger | Invoice Type | Timing |
|---------|-------------|--------|
| POS sale completion | Sale invoice | Immediate (within same transaction) |
| Online order fulfillment | Order invoice | When status → `ready` or `shipped` |
| Manual invoice | N/A — not supported in MVP | Invoices are always auto-generated from sales/orders |

### 4.4 Invoice Content Structure

```
┌─────────────────────────────────────────────────────┐
│ BRIMISH SKIN CARE CLINIC                            │
│ [Clinic Address]                                     │
│ Ph: [Phone] | Email: [Email]                        │
│ NTN: [Number] | STRN: [Number]                      │
├─────────────────────────────────────────────────────┤
│ INVOICE                                              │
│ Invoice No: BSC-2026-00001                          │
│ Date: 01 Oct 2026, 14:30 PKT                       │
│ Customer: [Name]                                     │
│ Phone: [Phone]                                       │
├─────────────────────────────────────────────────────┤
│ # │ Item          │ Qty │ Price   │ Disc  │ Total  │
│ 1 │ Facial (Gold) │  1  │ 5,000  │  500  │ 4,500  │
│ 2 │ Sunscreen SPF │  2  │ 1,200  │    0  │ 2,400  │
├─────────────────────────────────────────────────────┤
│                         Subtotal:         6,900     │
│                         Discount:          -500     │
│                         GST (17%):        1,088     │
│                         ─────────────────────────── │
│                         TOTAL:       PKR 7,488      │
├─────────────────────────────────────────────────────┤
│ Payment: Cash                                        │
│ Status: Paid                                         │
├─────────────────────────────────────────────────────┤
│ Note: This invoice is inspired by FBR format for    │
│ reference purposes. This does not constitute        │
│ an FBR-registered fiscal document.                  │
└─────────────────────────────────────────────────────┘
```

### 4.5 Tax Handling

| Rule | Detail |
|------|--------|
| Tax rate is configurable in clinic settings | Default stored in `clinic_settings.default_tax_rate` |
| Tax is applied to the subtotal after discounts | (Subtotal - Discount) × Tax Rate |
| Tax label is configurable (e.g., "GST", "Sales Tax") | Stored in `clinic_settings.default_tax_label` |
| Tax can be set to 0% to effectively disable it | No tax line appears on invoice if rate is 0 |
| Tax calculation is done server-side | Client shows estimated amounts; server is authoritative |
| **No FBR integration**: The system does not submit to or integrate with FBR POS systems | Disclaimer on all invoices |

### 4.6 Print Layouts

| Layout | Width | Use Case |
|--------|-------|----------|
| Thermal receipt (58mm) | 32 characters per line | Small thermal printers |
| Thermal receipt (80mm) | 48 characters per line | Standard POS printers |
| A4 (210mm × 297mm) | Full page | Professional invoices, email attachments |

### 4.7 PDF Generation

| Rule | Detail |
|------|--------|
| PDFs are generated on-demand (not pre-stored) | Reduces storage costs |
| PDF uses the A4 layout template | Consistent with print layout |
| PDF can be generated server-side or client-side | Server-side preferred for consistency |
| PDF is offered for download and email attachment | Both options available |

---

## 5. Payment Rules

### 5.1 POS Payments

| Rule | Detail |
|------|--------|
| Payment is collected at time of sale | Sale = immediate payment |
| Single payment method per sale (MVP) | No split payments |
| Cash: system records amount tendered and calculates change | `amount_received` and `change_amount` fields |
| Card: no amount received/change calculation | Assumed exact payment |
| Bank transfer: no amount received/change calculation | Reference number can be added to notes |
| Payment status is `paid` immediately on POS sale | No pending payments for POS |

### 5.2 Order Payments

| Rule | Detail |
|------|--------|
| MVP: Cash on Delivery only | All online orders are COD |
| Payment status starts as `pending` | Updated when payment collected |
| Staff marks payment as `paid` when COD payment received | Manual update on invoice |
| No partial payments | Full payment only |
| No online payment processing in MVP | Post-MVP: JazzCash, EasyPaisa, card |

---

## 6. Patient History & Data Retention

### 6.1 Patient Record Composition

A patient's complete profile consists of:

```
Patient Profile
├── Personal Information
│   ├── Name, phone, email, gender, DOB, address
│   └── General notes
│
├── Visit History (chronological)
│   ├── Visit date
│   ├── Treatment performed
│   ├── Linked appointment
│   ├── Linked sale
│   └── Visit notes
│
├── Treatment History
│   ├── All treatments received (derived from visits)
│   ├── Treatment count
│   └── Date of each treatment
│
├── Appointment History
│   ├── All appointments (past + upcoming)
│   ├── Status of each
│   └── No-show count
│
├── Clinical Notes (Doctor Only)
│   ├── Chronological clinical records
│   ├── Diagnosis
│   ├── Prescription
│   └── Linked to visits/appointments
│
├── Purchase History
│   ├── All POS sales linked to patient
│   ├── Items purchased
│   └── Total spent
│
├── Invoices
│   ├── All invoices linked to patient
│   ├── Invoice details
│   └── Payment status
│
├── Before/After Photos
│   ├── Linked photo pairs
│   ├── Consent records
│   └── Public/private status
│
└── Follow-up Appointments
    ├── Scheduled follow-ups
    └── Overdue follow-ups
```

### 6.2 Computed Fields (Not Stored)

| Field | Computation |
|-------|-------------|
| Last visit date | `MAX(visits.visit_date) WHERE patient_id = X` |
| Total visits | `COUNT(visits) WHERE patient_id = X` |
| Total spent | `SUM(sales.total) WHERE patient_id = X AND voided_at IS NULL` |
| No-show count | `COUNT(appointments) WHERE patient_id = X AND status = 'no_show'` |
| Outstanding follow-ups | `COUNT(appointments) WHERE patient_id = X AND status IN ('pending','confirmed') AND type = 'follow_up'` |

### 6.3 Data Retention Policy

| Data Category | Retention Period | Justification |
|---------------|-----------------|---------------|
| Patient personal information | Indefinite (soft delete) | Medical records retention; can be anonymized on request |
| Clinical notes | Indefinite | Medical records; cannot be permanently deleted |
| Visit history | Indefinite | Part of medical record |
| Financial records (sales, invoices) | Minimum 6 years | Pakistan tax law guidance (Income Tax Ordinance 2001) |
| Appointment records | Indefinite (soft delete) | Operational history |
| Audit logs | Minimum 2 years | Security and compliance |
| Email logs | 1 year | Operational; auto-purge after 1 year |
| Contact form submissions | 6 months | Operational; auto-purge after 6 months |
| Review submissions | Indefinite (soft delete) | Content management |
| Before/After photos | Indefinite | Medical and marketing records; consent-dependent |
| Consent records | Indefinite | Legal requirement; cannot be deleted |

### 6.4 Data Deletion / Anonymization

| Scenario | Handling |
|----------|---------|
| Patient requests data deletion | Soft delete patient record; anonymize PII in linked records; retain financial records with anonymized customer info; retain clinical notes (legal requirement) |
| Staff account deactivation | Set `is_active = false`; retain all records; reassign no data |
| Product discontinuation | Soft delete; historical references in sales/orders remain intact |
| Treatment discontinuation | Soft delete; historical references remain; remove from public site |

### 6.5 Patient De-duplication

| Rule | Detail |
|------|--------|
| Phone number is the unique identifier for patients | UNIQUE constraint on `patients.phone` |
| When a booking or order comes in with a known phone, link to existing patient | Server-side lookup before creating new records |
| No automatic merging of patient records | Manual process if duplicates are found |
| Admin can merge two patient records (post-MVP) | Reassign all child records to the surviving patient |

---

## 7. Automation Events & Delivery Rules

### 7.1 Event Catalog

| Event | Trigger | Action | Recipient | Priority |
|-------|---------|--------|-----------|----------|
| `appointment.created` | New booking submitted | Send "booking received" email | Clinic admin | High |
| `appointment.confirmed` | Staff confirms appointment | Send confirmation email | Patient (if email) | High |
| `appointment.rescheduled` | Staff reschedules | Send reschedule notification | Patient (if email) | High |
| `appointment.cancelled` | Staff cancels | Send cancellation email | Patient (if email) | Medium |
| `appointment.reminder` | Cron (24h before) | Send reminder email | Patient (if email) | Medium |
| `appointment.completed` | Staff marks completed | Create/update visit record | System | High |
| `order.created` | Order placed | Send order confirmation | Customer (if email) + Clinic | High |
| `order.status_changed` | Status update | Send status update email | Customer (if email) | Medium |
| `order.cancelled` | Order cancelled | Release stock reservation + notify | Customer (if email) | High |
| `order.fulfilled` | Status → ready/shipped | Generate invoice + deduct stock | System | Critical |
| `invoice.created` | Invoice auto-generated | (Available for email send) | N/A — manual trigger | — |
| `invoice.emailed` | Staff clicks "send email" | Send invoice email with PDF | Patient/Customer | Medium |
| `stock.low` | Stock ≤ threshold | Send low-stock alert | Admin | Low |
| `stock.depleted` | Stock = 0 | Update product display on public site | System | Medium |
| `review.submitted` | Review submitted | Notify clinic of new review | Clinic admin | Low |
| `review.approved` | Review approved | Revalidate public reviews page | System | Low |

### 7.2 Email Delivery Rules

| Rule | Detail |
|------|--------|
| All emails are non-blocking | Email failure does not prevent the business operation |
| All email attempts are logged to `email_log` | Success, failure, and error details recorded |
| Critical emails (appointment confirmation, order confirmation) can be retried from dashboard | Staff can re-trigger sending |
| Reminder emails that fail are not retried | Best-effort delivery |
| Email is only sent if recipient has a valid email address | Skip silently if no email |
| Rate limiting: max 50 emails/hour to prevent abuse | Application-level throttle |
| Unsubscribe: Not applicable for transactional emails | These are transactional, not marketing |

### 7.3 Failure Handling

```
Email Send Attempt:
  ├── SUCCESS
  │   ├── Log to email_log (status: 'sent', resend_id: [id])
  │   └── Continue with business operation
  │
  ├── FAILURE (Resend API error)
  │   ├── Log to email_log (status: 'failed', error_message: [error])
  │   ├── Do NOT retry automatically (to prevent loops)
  │   ├── Staff can retry manually from dashboard
  │   └── Continue with business operation (non-blocking)
  │
  └── TIMEOUT
      ├── Log to email_log (status: 'failed', error_message: 'timeout')
      └── Same as FAILURE handling
```

### 7.4 Idempotency Rules

| Operation | Idempotency Mechanism |
|-----------|----------------------|
| POS sale creation | `idempotency_key` UNIQUE constraint on `sales` table |
| Order placement | Order number generated atomically; duplicate check on phone + items + timestamp window |
| Invoice generation | 1:1 constraint with sale/order; `sale_id` and `order_id` are UNIQUE on invoices |
| Stock deduction | Within transaction; atomic operation with row locking |
| Email sending | Check `email_log` for recent identical sends before triggering |

---

## 8. CSV Export Rules

| Module | Exportable Fields | Who Can Export |
|--------|-------------------|---------------|
| Patients | Name, phone, email, gender, DOB, address, created_at, last_visit | Super Admin |
| Appointments | Date, patient name, treatment, status, created_at | Super Admin, Receptionist (own operations) |
| Sales | Date, customer, items summary, subtotal, discount, tax, total, payment method | Super Admin |
| Invoices | Invoice number, date, customer, total, payment status | Super Admin |
| Inventory | Product name, SKU, category, stock, purchase price, sale price, expiry | Super Admin |
| Orders | Order number, date, customer, status, total, delivery method | Super Admin, Receptionist |
| Stock Movements | Date, product, type, quantity, reason, staff | Super Admin |

### Export Rules

| Rule | Detail |
|------|--------|
| CSV files are generated server-side | Prevents large data exposure to client |
| Exports respect permission boundaries | Receptionist exports exclude financial details |
| Large exports (> 10,000 rows) are paginated or streamed | Prevent timeout |
| Export includes a metadata header row | Date generated, user who generated, filters applied |
| Purchase prices are excluded from receptionist exports | Financial privacy |
| Clinical notes are never exported via CSV | Separate, restricted export if ever needed |
