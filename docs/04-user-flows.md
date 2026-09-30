# 04 — User Flows & Journeys

## Brimish Skin Care Clinic — Major User Journeys & Workflows

**Version:** 1.0.0-draft
**Date:** 2026-10-01

---

## 1. Public User Journeys

### 1.1 Appointment Booking (Patient)

```
┌──────────────────────────────────────────────────────────────────────┐
│                     APPOINTMENT BOOKING FLOW                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Patient visits /book (or clicks "Book Appointment" CTA)          │
│     │                                                                │
│  2. Patient fills form:                                              │
│     ├── Full name (required)                                         │
│     ├── Phone number (required, Pakistani format validation)         │
│     ├── Email (optional — for confirmation emails)                   │
│     ├── Select treatment (dropdown from active treatments)           │
│     ├── Preferred date (date picker, respects operating hours)       │
│     ├── Preferred time (time picker or slot selection)               │
│     └── Optional message                                            │
│     │                                                                │
│  3. Client-side Zod validation                                       │
│     │                                                                │
│  4. Submit → Server Action / API Route                               │
│     ├── Server-side Zod validation                                   │
│     ├── Rate limiting check (by IP + phone)                          │
│     ├── Check for duplicate booking (same phone + date)              │
│     ├── Create appointment record (status: 'pending')                │
│     ├── If phone matches existing patient → link appointment         │
│     ├── Send "appointment received" email to clinic                  │
│     └── If patient email provided → send "booking received" ack     │
│     │                                                                │
│  5. Patient sees confirmation page:                                  │
│     ├── "Thank you! We'll confirm your appointment shortly."         │
│     ├── Booking reference number                                     │
│     └── Clinic contact info for questions                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Post-submission (Clinic side):**
```
  6. Receptionist sees new appointment in dashboard (status: pending)
     │
  7. Receptionist reviews and takes action:
     ├── CONFIRM → status: 'confirmed'
     │   └── Patient receives confirmation email with date/time
     ├── RESCHEDULE → status: 'rescheduled'
     │   ├── Select new date/time
     │   └── Patient receives reschedule notification email
     └── CANCEL → status: 'cancelled'
         └── Patient receives cancellation email (with reason)
     │
  8. 24h before appointment → Cron sends reminder email
     │
  9. On appointment day:
     ├── Patient arrives → Receptionist marks 'checked_in'
     ├── Treatment performed → Mark 'completed'
     │   ├── Create/update visit record in patient history
     │   ├── Link treatment to patient profile
     │   └── Optionally create POS sale for the service
     └── Patient doesn't arrive → Mark 'no_show'
         └── Record no-show in patient history
```

---

### 1.2 Product Ordering (Guest Customer)

```
┌──────────────────────────────────────────────────────────────────────┐
│                     PRODUCT ORDERING FLOW                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Customer browses /products                                       │
│     ├── Filter by category                                           │
│     └── View product details                                         │
│     │                                                                │
│  2. Customer adds products to cart                                   │
│     ├── Cart stored in localStorage (client-side state)              │
│     ├── Cart shows item count in header                              │
│     └── Cart validates stock availability (client-side, advisory)    │
│     │                                                                │
│  3. Customer navigates to /order/cart                                │
│     ├── View cart items with quantities                               │
│     ├── Adjust quantities or remove items                            │
│     └── See subtotal                                                 │
│     │                                                                │
│  4. Customer proceeds to /order/checkout                             │
│     ├── Fill checkout form:                                          │
│     │   ├── Full name (required)                                     │
│     │   ├── Phone number (required, Pakistani format)                │
│     │   ├── Email (optional — for order updates)                     │
│     │   ├── Delivery method: Pickup / Delivery                      │
│     │   └── If delivery: address fields                              │
│     │                                                                │
│  5. Submit Order → Server Action                                     │
│     ├── Server-side validation (Zod)                                 │
│     ├── Re-validate stock availability (authoritative check)         │
│     ├── If any item out of stock → return error with details         │
│     ├── BEGIN TRANSACTION                                            │
│     │   ├── Create order record (status: 'received')                 │
│     │   ├── Create order items                                       │
│     │   └── Reserve stock (soft reservation)                         │
│     ├── COMMIT                                                       │
│     ├── Send order confirmation email (if email provided)            │
│     └── Send new order notification to clinic                        │
│     │                                                                │
│  6. Customer sees /order/confirmation/[id]                           │
│     ├── Order summary                                                │
│     ├── Estimated timeline                                           │
│     └── Clinic contact info                                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Post-order (Clinic side):**
```
  7. Receptionist sees new order in dashboard (status: received)
     │
  8. Order lifecycle:
     received → confirmed → preparing → ready/shipped → delivered/picked_up → completed
     │
     ├── CONFIRMED: Receptionist acknowledges order
     │   └── Customer notified via email
     │
     ├── PREPARING: Items being prepared/packaged
     │   └── Customer notified
     │
     ├── READY (pickup) / SHIPPED (delivery):
     │   ├── Stock hard deduction (reservation → actual deduction)
     │   ├── Invoice generated
     │   └── Customer notified with pickup instructions or tracking
     │
     ├── DELIVERED / PICKED_UP: Customer received items
     │   └── Order completed
     │
     └── CANCELLED (at any stage before fulfillment):
         ├── Stock reservation released
         ├── No invoice generated (or void if already generated)
         └── Customer notified
```

---

### 1.3 Review Submission (Patient/Visitor)

```
  1. Visitor navigates to /reviews
  2. Clicks "Write a Review"
  3. Fills form:
     ├── Name (required)
     ├── Rating (1-5 stars, required)
     ├── Review text (required, min 20 chars)
     ├── Treatment received (optional dropdown)
     └── Honeypot field (hidden, anti-spam)
  4. Client-side validation
  5. Submit → Server Action
     ├── Server validation
     ├── Rate limiting (1 review per IP per 24h)
     ├── Honeypot check
     ├── Create review (status: 'pending')
     └── Notify clinic of new review
  6. Patient sees "Thank you! Your review will be published after moderation."
  7. Receptionist/Doctor reviews in dashboard → Approve / Reject
  8. Approved reviews appear on /reviews page (cache revalidated)
```

---

## 2. Dashboard User Journeys

### 2.1 POS Sale (Receptionist / Doctor)

```
┌──────────────────────────────────────────────────────────────────────┐
│                     POS SALE WORKFLOW                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Staff opens /dashboard/pos                                       │
│     │                                                                │
│  2. Select Customer:                                                 │
│     ├── Search existing patient by name/phone                        │
│     ├── Create new patient inline                                    │
│     └── Select "Walk-in Customer" (anonymous sale)                   │
│     │                                                                │
│  3. Build Cart:                                                      │
│     ├── Search/browse products                                       │
│     ├── Search/browse services (treatments)                          │
│     ├── Add items to cart with quantity                               │
│     ├── System shows real-time stock status                          │
│     ├── System prevents adding out-of-stock items                    │
│     └── Cart shows running subtotal                                  │
│     │                                                                │
│  4. Apply Discounts (optional):                                      │
│     ├── Per-item discount (% or fixed)                               │
│     ├── Cart-level discount (% or fixed)                             │
│     └── Permission check for discount threshold (see BD-06)          │
│     │                                                                │
│  5. Review Sale:                                                     │
│     ├── Cart summary with all items                                  │
│     ├── Subtotal, discounts, tax (if configured), total              │
│     └── Staff confirms amounts                                       │
│     │                                                                │
│  6. Payment:                                                         │
│     ├── Select payment method (Cash / Card / Bank Transfer)          │
│     ├── Enter amount received (for cash — calculate change)          │
│     └── Confirm payment                                              │
│     │                                                                │
│  7. Complete Sale → Server Action (TRANSACTION):                     │
│     ├── Validate all items still in stock (row-level lock)           │
│     ├── Create sale record                                           │
│     ├── Create sale line items                                       │
│     ├── Deduct stock atomically (product quantities)                 │
│     ├── Generate invoice (unique ID, immutable)                      │
│     ├── Create invoice line items                                    │
│     ├── Link sale + invoice to patient (if not walk-in)              │
│     ├── Create audit log entry                                       │
│     └── If treatment sale → create visit record                      │
│     │                                                                │
│  8. Post-Sale:                                                       │
│     ├── Display receipt / invoice                                    │
│     ├── Print thermal receipt                                        │
│     ├── Optionally email invoice to patient                          │
│     ├── Check if any product now below low-stock threshold           │
│     │   └── If yes → flag for alert                                  │
│     └── "New Sale" button to start fresh                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Error Scenarios:**
```
  E1. Item goes out of stock between cart build and sale completion:
      → Transaction fails → Display which items are unavailable
      → Staff removes/adjusts items → Retry

  E2. Network error during transaction:
      → Transaction rolls back → No stock deducted, no invoice created
      → Staff retries

  E3. Duplicate submission (double-click):
      → Idempotency key prevents duplicate sale creation
```

---

### 2.2 Patient Registration & Visit (Receptionist)

```
  1. New patient arrives at clinic
  2. Receptionist searches by phone number → Not found
  3. Receptionist creates new patient:
     ├── Full name (required)
     ├── Phone number (required, unique)
     ├── Email (optional)
     ├── Gender (optional)
     ├── Date of birth (optional)
     └── Address (optional)
  4. Patient record created → Navigate to patient profile
  5. If patient has appointment → Link walk-in to existing booking
  6. If no appointment → Create appointment from patient profile
  7. After treatment:
     ├── Doctor adds clinical notes (doctor only)
     ├── Staff creates POS sale for the treatment
     ├── Staff optionally uploads before/after photos
     ├── Staff optionally schedules follow-up appointment
     └── Visit record auto-created from completed appointment + sale
```

---

### 2.3 Returning Patient Visit

```
  1. Patient arrives (with or without appointment)
  2. Receptionist searches by name or phone → Found
  3. Opens patient profile → Sees complete history:
     ├── Last visit date
     ├── Previous treatments
     ├── Upcoming appointments
     ├── Clinical notes (doctor only)
     └── Any outstanding follow-ups
  4. If appointment exists → Mark as checked_in
  5. Treatment is performed
  6. Post-treatment flow (same as new patient step 7)
```

---

### 2.4 Inventory Management (Doctor)

```
  1. Doctor navigates to /dashboard/inventory

  ADDING NEW PRODUCT:
  ├── Create product with:
  │   ├── Name, description, category
  │   ├── SKU
  │   ├── Purchase price (cost)
  │   ├── Sale price
  │   ├── Initial stock quantity
  │   ├── Low-stock threshold
  │   ├── Expiry date (optional)
  │   ├── Product images
  │   └── Is published on website (toggle)
  └── Save → Product appears in inventory + optionally on public site

  STOCK ADJUSTMENT:
  ├── Select product
  ├── Choose adjustment type: Addition / Subtraction / Correction
  ├── Enter quantity
  ├── Enter reason (required)
  ├── Confirm → Stock updated
  └── Movement recorded in history with timestamp, user, reason

  RECEIVING STOCK:
  ├── Receptionist can record received shipment
  ├── Select products + quantities received
  ├── Add purchase price if different
  └── Stock increased → Movement logged

  LOW-STOCK ALERTS:
  ├── Daily cron checks all products
  ├── Products below threshold flagged
  ├── Alert email sent to admin
  └── Dashboard shows low-stock badge/notification
```

---

### 2.5 Online Order Fulfillment (Receptionist)

```
  1. New order notification appears in dashboard
  2. Receptionist opens /dashboard/orders
  3. Reviews order details:
     ├── Customer info (name, phone, email)
     ├── Order items + quantities
     ├── Delivery method (pickup/delivery)
     └── Delivery address (if applicable)
  4. Checks stock availability
  5. Confirms order → Status: confirmed → Customer notified
  6. Prepares order → Status: preparing
  7. Order ready:
     ├── FOR PICKUP: Status: ready → Customer notified to pick up
     ├── FOR DELIVERY: Status: shipped → Customer notified
     │
     ├── At this point:
     │   ├── Stock reservation converted to hard deduction
     │   └── Invoice auto-generated
  8. Customer receives items:
     ├── FOR PICKUP: Staff marks picked_up when customer arrives
     ├── FOR DELIVERY: Staff marks delivered
  9. Order status: completed
  10. Payment collected (COD) → Update payment status on invoice
```

---

### 2.6 Invoice Lifecycle

```
  CREATION:
  ├── Auto-generated on POS sale completion
  ├── Auto-generated on order fulfillment
  └── Each invoice gets unique sequential ID (e.g., BSC-2026-00001)

  VIEWING:
  ├── From invoice list (search, filter by date/status/customer)
  ├── From patient profile → Invoices tab
  ├── From sale record
  └── From order record

  ACTIONS:
  ├── View (A4 format in browser)
  ├── Print thermal receipt (58mm/80mm layout)
  ├── Print A4
  ├── Download PDF
  ├── Email to patient/customer
  └── Reprint (any time)

  VOID (Admin only):
  ├── Cannot edit or delete invoices (immutable)
  ├── Admin can void an invoice
  ├── Voided invoice remains in records with void reason
  ├── Creates a credit note referencing original invoice
  └── Stock may need manual adjustment (not auto-reversed)
```

---

### 2.7 Before/After Photo Management

```
  1. During or after patient visit:
     ├── Staff uploads "before" photo (if first visit for treatment)
     └── Staff uploads "after" photo (if treatment completed)

  2. Photos linked to:
     ├── Patient record
     ├── Treatment type
     └── Visit/appointment record

  3. Consent workflow:
     ├── Doctor records consent status:
     │   ├── consent_given: boolean
     │   ├── consent_date: timestamp
     │   └── consent_notes: text (e.g., "verbal consent recorded")
     └── Only doctor can update consent

  4. Publication:
     ├── Only doctor can set is_public = true
     ├── Requires consent_given = true
     ├── Published photos move to public storage bucket
     ├── Private photos remain in private bucket (signed URLs only)
     └── Public gallery page updated (ISR revalidation)

  5. Public display:
     ├── Grouped by treatment category
     ├── Interactive comparison slider
     └── No patient identifying information shown publicly
```

---

## 3. System Workflows (Automated)

### 3.1 Appointment Reminder Workflow

```
  TRIGGER: Daily cron at 08:00 PKT

  1. Query appointments WHERE:
     ├── status = 'confirmed'
     ├── scheduled_at BETWEEN now AND now + 24 hours
     └── reminder_sent = false
  2. For each qualifying appointment:
     ├── If patient email exists → Send reminder email
     ├── Mark reminder_sent = true
     └── Log email attempt (success/failure)
  3. Failed emails logged but do not retry automatically
```

### 3.2 Low-Stock Alert Workflow

```
  TRIGGER: Daily cron at 09:00 PKT

  1. Query products WHERE:
     ├── stock_quantity <= low_stock_threshold
     └── is_active = true
  2. If any products below threshold:
     ├── Compile low-stock report
     ├── Send summary email to admin
     └── Update dashboard notification count
  3. Alert is per-check, not per-product (one email with all low items)
```

### 3.3 Stale Appointment Cleanup

```
  TRIGGER: Daily cron at 00:00 PKT

  1. Query appointments WHERE:
     ├── status = 'pending'
     └── created_at < now - 48 hours
  2. Update status to 'expired'
  3. Log cleanup in audit trail
```

### 3.4 Cache Revalidation Triggers

| Event | Pages Revalidated |
|-------|-------------------|
| Treatment created/updated/deleted | `/treatments`, `/treatments/[slug]`, `/book` |
| Product created/updated/deleted | `/products`, `/products/[slug]` |
| Product stock changes significantly | `/products/[slug]` (if sold out) |
| Review approved/rejected | `/reviews` |
| Before/After published/unpublished | `/gallery` |
| Clinic settings updated | All public pages (layout data) |
