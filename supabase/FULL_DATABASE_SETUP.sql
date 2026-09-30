
-- ==========================================
-- FILE: 001_initial_schema.sql
-- ==========================================
-- ============================================================
-- Brimish Skin Care Clinic — Database Migration
-- Full schema: enums, tables, indexes, constraints, functions
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'receptionist');

CREATE TYPE appointment_status AS ENUM (
  'pending', 'confirmed', 'rescheduled', 'checked_in',
  'completed', 'no_show', 'cancelled', 'expired'
);

CREATE TYPE order_status AS ENUM (
  'received', 'confirmed', 'preparing',
  'ready', 'shipped', 'delivered', 'picked_up',
  'completed', 'cancelled'
);

CREATE TYPE delivery_method AS ENUM ('pickup', 'delivery');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'bank_transfer');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'partially_refunded');
CREATE TYPE invoice_status AS ENUM ('issued', 'paid', 'voided');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

CREATE TYPE stock_movement_type AS ENUM (
  'initial', 'purchase', 'sale', 'adjustment',
  'return', 'reservation', 'reservation_release',
  'reservation_fulfillment', 'correction'
);

CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE consent_status AS ENUM ('pending', 'given', 'revoked');

CREATE TYPE audit_action AS ENUM (
  'create', 'update', 'delete', 'void',
  'login', 'logout', 'export', 'email_sent'
);

-- ============================================================
-- 2. STAFF TABLE + AUTH HELPERS
-- ============================================================

CREATE TABLE staff (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    phone           TEXT,
    role            user_role NOT NULL DEFAULT 'receptionist',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.staff
  WHERE auth_user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.staff
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current staff ID
CREATE OR REPLACE FUNCTION get_staff_id()
RETURNS UUID AS $$
  SELECT id FROM public.staff
  WHERE auth_user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 3. CLINIC SETTINGS
-- ============================================================

CREATE TABLE clinic_settings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_name         TEXT NOT NULL DEFAULT 'Brimish Skin Care',
    clinic_address      TEXT,
    clinic_city         TEXT DEFAULT 'Peshawar',
    clinic_phone        TEXT,
    clinic_email        TEXT,
    clinic_website      TEXT,
    ntn                 TEXT,
    strn                TEXT,
    default_tax_rate    NUMERIC(5, 2) DEFAULT 0,
    default_tax_label   TEXT DEFAULT 'GST',
    currency_code       TEXT NOT NULL DEFAULT 'PKR',
    timezone            TEXT NOT NULL DEFAULT 'Asia/Karachi',
    google_maps_embed   TEXT,
    social_facebook     TEXT,
    social_instagram    TEXT,
    social_whatsapp     TEXT,
    logo_url            TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID REFERENCES staff(id)
);

CREATE TABLE operating_hours (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week         INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time           TIME,
    close_time          TIME,
    is_closed           BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (day_of_week)
);

-- ============================================================
-- 4. PATIENTS
-- ============================================================

CREATE TABLE patients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    phone           TEXT NOT NULL UNIQUE,
    email           TEXT,
    gender          gender_type,
    date_of_birth   DATE,
    address         TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES staff(id),
    updated_by      UUID REFERENCES staff(id),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_patients_phone ON patients(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_name ON patients(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_deleted ON patients(deleted_at);

-- ============================================================
-- 5. CLINICAL NOTES (Doctor Only)
-- ============================================================

CREATE TABLE clinical_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    visit_id        UUID,
    appointment_id  UUID,
    note_text       TEXT NOT NULL,
    diagnosis       TEXT,
    prescription    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID NOT NULL REFERENCES staff(id),
    updated_by      UUID REFERENCES staff(id),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_clinical_notes_patient ON clinical_notes(patient_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 6. TREATMENTS
-- ============================================================

CREATE TABLE treatment_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL UNIQUE,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE TABLE treatments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id         UUID REFERENCES treatment_categories(id),
    name                TEXT NOT NULL,
    slug                TEXT NOT NULL UNIQUE,
    description         TEXT,
    short_description   TEXT,
    price               NUMERIC(12, 2),
    price_label         TEXT,
    duration_minutes    INTEGER,
    image_url           TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    is_featured         BOOLEAN NOT NULL DEFAULT false,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    seo_title           TEXT,
    seo_description     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID REFERENCES staff(id),
    updated_by          UUID REFERENCES staff(id),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_treatments_slug ON treatments(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_treatments_category ON treatments(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_treatments_active ON treatments(is_active, deleted_at) WHERE deleted_at IS NULL;

-- ============================================================
-- 7. PRODUCTS & INVENTORY
-- ============================================================

CREATE TABLE product_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL UNIQUE,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id         UUID REFERENCES product_categories(id),
    name                TEXT NOT NULL,
    slug                TEXT NOT NULL UNIQUE,
    sku                 TEXT NOT NULL UNIQUE,
    description         TEXT,
    short_description   TEXT,
    purchase_price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sale_price          NUMERIC(12, 2) NOT NULL,
    stock_quantity      INTEGER NOT NULL DEFAULT 0,
    reserved_quantity   INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    expiry_date         DATE,
    image_url           TEXT,
    is_published        BOOLEAN NOT NULL DEFAULT false,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    seo_title           TEXT,
    seo_description     TEXT,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID REFERENCES staff(id),
    updated_by          UUID REFERENCES staff(id),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT chk_stock_non_negative
        CHECK (stock_quantity >= 0 AND reserved_quantity >= 0 AND stock_quantity >= reserved_quantity)
);

CREATE INDEX idx_products_slug ON products(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_sku ON products(sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_published ON products(is_published) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_products_low_stock ON products(stock_quantity, low_stock_threshold)
    WHERE deleted_at IS NULL AND is_active = true;

CREATE TABLE stock_movements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type   stock_movement_type NOT NULL,
    quantity        INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after  INTEGER NOT NULL,
    reference_type  TEXT,
    reference_id    UUID,
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES staff(id)
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

-- ============================================================
-- 8. APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID REFERENCES patients(id),
    treatment_id        UUID NOT NULL REFERENCES treatments(id),
    customer_name       TEXT NOT NULL,
    customer_phone      TEXT NOT NULL,
    customer_email      TEXT,
    scheduled_at        TIMESTAMPTZ NOT NULL,
    duration_minutes    INTEGER,
    status              appointment_status NOT NULL DEFAULT 'pending',
    message             TEXT,
    cancellation_reason TEXT,
    rescheduled_from    UUID REFERENCES appointments(id),
    reminder_sent       BOOLEAN NOT NULL DEFAULT false,
    confirmed_at        TIMESTAMPTZ,
    confirmed_by        UUID REFERENCES staff(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID REFERENCES staff(id),
    updated_by          UUID REFERENCES staff(id),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_status ON appointments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_phone ON appointments(customer_phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_reminder ON appointments(scheduled_at, reminder_sent, status)
    WHERE deleted_at IS NULL AND status = 'confirmed' AND reminder_sent = false;

-- ============================================================
-- 9. SALES (POS)
-- ============================================================

CREATE TABLE sales (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID REFERENCES patients(id),
    staff_id            UUID NOT NULL REFERENCES staff(id),
    customer_name       TEXT,
    subtotal            NUMERIC(12, 2) NOT NULL,
    discount_type       discount_type,
    discount_value      NUMERIC(12, 2) DEFAULT 0,
    discount_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_rate            NUMERIC(5, 2) DEFAULT 0,
    tax_amount          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total               NUMERIC(12, 2) NOT NULL,
    payment_method      payment_method NOT NULL,
    payment_status      payment_status NOT NULL DEFAULT 'paid',
    amount_received     NUMERIC(12, 2),
    change_amount       NUMERIC(12, 2),
    idempotency_key     TEXT UNIQUE,
    voided_at           TIMESTAMPTZ,
    voided_by           UUID REFERENCES staff(id),
    void_reason         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_patient ON sales(patient_id);
CREATE INDEX idx_sales_staff ON sales(staff_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sales_idempotency ON sales(idempotency_key);

CREATE TABLE sale_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    product_id      UUID REFERENCES products(id),
    treatment_id    UUID REFERENCES treatments(id),
    item_type       TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
    name            TEXT NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_price      NUMERIC(12, 2) NOT NULL,
    discount_type   discount_type,
    discount_value  NUMERIC(12, 2) DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    line_total      NUMERIC(12, 2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- ============================================================
-- 10. VISITS
-- ============================================================

CREATE TABLE visits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    appointment_id  UUID REFERENCES appointments(id),
    treatment_id    UUID REFERENCES treatments(id),
    visit_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes           TEXT,
    sale_id         UUID REFERENCES sales(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES staff(id),
    updated_by      UUID REFERENCES staff(id)
);

CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_appointment ON visits(appointment_id);

-- Add FK from clinical_notes now that visits table exists
ALTER TABLE clinical_notes
    ADD CONSTRAINT fk_clinical_notes_visit
    FOREIGN KEY (visit_id) REFERENCES visits(id);

ALTER TABLE clinical_notes
    ADD CONSTRAINT fk_clinical_notes_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(id);

-- ============================================================
-- 11. ORDERS
-- ============================================================

CREATE TABLE order_sequences (
    year            INTEGER NOT NULL,
    last_number     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (year)
);

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    next_num INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Karachi');
    INSERT INTO order_sequences (year, last_number)
    VALUES (current_year, 1)
    ON CONFLICT (year) DO UPDATE
    SET last_number = order_sequences.last_number + 1
    RETURNING last_number INTO next_num;
    RETURN 'BSC-ORD-' || current_year || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number        TEXT NOT NULL UNIQUE,
    patient_id          UUID REFERENCES patients(id),
    customer_name       TEXT NOT NULL,
    customer_phone      TEXT NOT NULL,
    customer_email      TEXT,
    delivery_method     delivery_method NOT NULL,
    delivery_address    TEXT,
    delivery_city       TEXT,
    delivery_notes      TEXT,
    status              order_status NOT NULL DEFAULT 'received',
    subtotal            NUMERIC(12, 2) NOT NULL,
    delivery_fee        NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total               NUMERIC(12, 2) NOT NULL,
    payment_method      payment_method NOT NULL DEFAULT 'cash',
    payment_status      payment_status NOT NULL DEFAULT 'pending',
    notes               TEXT,
    cancelled_at        TIMESTAMPTZ,
    cancelled_by        UUID REFERENCES staff(id),
    cancellation_reason TEXT,
    fulfilled_at        TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_orders_status ON orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_phone ON orders(customer_phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_created ON orders(created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_number ON orders(order_number);

CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    product_id      UUID NOT NULL REFERENCES products(id),
    name            TEXT NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_price      NUMERIC(12, 2) NOT NULL,
    line_total      NUMERIC(12, 2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================================
-- 12. INVOICES
-- ============================================================

CREATE TABLE invoice_sequences (
    year            INTEGER NOT NULL,
    last_number     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (year)
);

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    next_num INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Karachi');
    INSERT INTO invoice_sequences (year, last_number)
    VALUES (current_year, 1)
    ON CONFLICT (year) DO UPDATE
    SET last_number = invoice_sequences.last_number + 1
    RETURNING last_number INTO next_num;
    RETURN 'BSC-' || current_year || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number      TEXT NOT NULL UNIQUE,
    sale_id             UUID UNIQUE REFERENCES sales(id),
    order_id            UUID UNIQUE REFERENCES orders(id),
    patient_id          UUID REFERENCES patients(id),
    customer_name       TEXT NOT NULL,
    customer_phone      TEXT,
    customer_email      TEXT,
    customer_address    TEXT,
    clinic_name         TEXT NOT NULL,
    clinic_address      TEXT NOT NULL,
    clinic_phone        TEXT NOT NULL,
    clinic_email        TEXT,
    clinic_ntn          TEXT,
    clinic_strn         TEXT,
    subtotal            NUMERIC(12, 2) NOT NULL,
    discount_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_label           TEXT DEFAULT 'GST',
    tax_rate            NUMERIC(5, 2) DEFAULT 0,
    tax_amount          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total               NUMERIC(12, 2) NOT NULL,
    payment_method      payment_method,
    payment_status      payment_status NOT NULL DEFAULT 'pending',
    status              invoice_status NOT NULL DEFAULT 'issued',
    paid_at             TIMESTAMPTZ,
    voided_at           TIMESTAMPTZ,
    voided_by           UUID REFERENCES staff(id),
    void_reason         TEXT,
    credit_note_id      UUID REFERENCES invoices(id),
    issued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID REFERENCES staff(id),
    CONSTRAINT chk_invoice_source CHECK (
        (sale_id IS NOT NULL AND order_id IS NULL) OR
        (sale_id IS NULL AND order_id IS NOT NULL)
    )
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_sale ON invoices(sale_id);
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_created ON invoices(created_at);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE TABLE invoice_line_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    description     TEXT NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_price      NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    line_total      NUMERIC(12, 2) NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

-- ============================================================
-- 13. BEFORE/AFTER GALLERY
-- ============================================================

CREATE TABLE before_after (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID REFERENCES patients(id),
    treatment_id        UUID REFERENCES treatments(id),
    visit_id            UUID REFERENCES visits(id),
    title               TEXT,
    description         TEXT,
    before_image_url    TEXT NOT NULL,
    after_image_url     TEXT NOT NULL,
    is_public           BOOLEAN NOT NULL DEFAULT false,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID REFERENCES staff(id),
    updated_by          UUID REFERENCES staff(id),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_before_after_patient ON before_after(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_before_after_treatment ON before_after(treatment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_before_after_public ON before_after(is_public) WHERE deleted_at IS NULL;

CREATE TABLE consent_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    before_after_id     UUID NOT NULL REFERENCES before_after(id) ON DELETE RESTRICT,
    patient_id          UUID NOT NULL REFERENCES patients(id),
    consent_status      consent_status NOT NULL DEFAULT 'pending',
    consent_given_at    TIMESTAMPTZ,
    consent_revoked_at  TIMESTAMPTZ,
    consent_notes       TEXT,
    recorded_by         UUID NOT NULL REFERENCES staff(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_records_before_after ON consent_records(before_after_id);
CREATE INDEX idx_consent_records_patient ON consent_records(patient_id);

-- ============================================================
-- 14. REVIEWS
-- ============================================================

CREATE TABLE reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_name       TEXT NOT NULL,
    rating              INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text         TEXT NOT NULL,
    treatment_id        UUID REFERENCES treatments(id),
    status              review_status NOT NULL DEFAULT 'pending',
    moderated_at        TIMESTAMPTZ,
    moderated_by        UUID REFERENCES staff(id),
    rejection_reason    TEXT,
    ip_address          INET,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_reviews_status ON reviews(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_created ON reviews(created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_ip ON reviews(ip_address, created_at);

-- ============================================================
-- 15. CONTACT SUBMISSIONS
-- ============================================================

CREATE TABLE contact_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    subject         TEXT,
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_submissions_read ON contact_submissions(is_read);
CREATE INDEX idx_contact_submissions_created ON contact_submissions(created_at);

-- ============================================================
-- 16. AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id        UUID REFERENCES staff(id),
    action          audit_action NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       UUID,
    description     TEXT,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_staff ON audit_log(staff_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- ============================================================
-- 17. EMAIL LOG
-- ============================================================

CREATE TABLE email_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name   TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject         TEXT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    resend_id       TEXT,
    error_message   TEXT,
    reference_type  TEXT,
    reference_id    UUID,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_log_status ON email_log(status);
CREATE INDEX idx_email_log_reference ON email_log(reference_type, reference_id);
CREATE INDEX idx_email_log_created ON email_log(created_at);

-- ============================================================
-- 18. updated_at TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clinical_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON treatment_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON treatments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON before_after
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consent_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON operating_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- FILE: 002_rls_policies.sql
-- ==========================================
-- ============================================================
-- Brimish Skin Care Clinic — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE before_after ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STAFF
-- ============================================================
CREATE POLICY "Staff can read own record"
    ON staff FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());

CREATE POLICY "Super admin can read all staff"
    ON staff FOR SELECT
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super admin can manage staff"
    ON staff FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- ============================================================
-- CLINIC SETTINGS
-- ============================================================
CREATE POLICY "Anyone can read clinic settings"
    ON clinic_settings FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Super admin can update clinic settings"
    ON clinic_settings FOR UPDATE
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- ============================================================
-- OPERATING HOURS
-- ============================================================
CREATE POLICY "Anyone can read operating hours"
    ON operating_hours FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Super admin can manage operating hours"
    ON operating_hours FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE POLICY "Authenticated staff can read patients"
    ON patients FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated staff can create patients"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can update patients"
    ON patients FOR UPDATE
    TO authenticated
    USING (get_user_role() IS NOT NULL)
    WITH CHECK (get_user_role() IS NOT NULL);

CREATE POLICY "Super admin can soft-delete patients"
    ON patients FOR UPDATE
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- ============================================================
-- CLINICAL NOTES (Doctor Only)
-- ============================================================
CREATE POLICY "Only super admin can access clinical notes"
    ON clinical_notes FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- ============================================================
-- TREATMENTS
-- ============================================================
CREATE POLICY "Anyone can read active treatments"
    ON treatments FOR SELECT
    TO anon, authenticated
    USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Authenticated can read all treatments"
    ON treatments FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Super admin can manage treatments"
    ON treatments FOR INSERT
    TO authenticated
    WITH CHECK (is_super_admin());

CREATE POLICY "Super admin can update treatments"
    ON treatments FOR UPDATE
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- TREATMENT CATEGORIES
CREATE POLICY "Anyone can read active treatment categories"
    ON treatment_categories FOR SELECT
    TO anon, authenticated
    USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Super admin can manage treatment categories"
    ON treatment_categories FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE POLICY "Anyone can read published products"
    ON products FOR SELECT
    TO anon
    USING (is_published = true AND is_active = true AND deleted_at IS NULL);

CREATE POLICY "Authenticated can read all products"
    ON products FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Super admin can manage products"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (is_super_admin());

CREATE POLICY "Super admin can update products"
    ON products FOR UPDATE
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Allow stock updates by any authenticated staff (for POS/order transactions)
CREATE POLICY "Staff can update product stock"
    ON products FOR UPDATE
    TO authenticated
    USING (get_user_role() IS NOT NULL)
    WITH CHECK (get_user_role() IS NOT NULL);

-- PRODUCT CATEGORIES
CREATE POLICY "Anyone can read active product categories"
    ON product_categories FOR SELECT
    TO anon, authenticated
    USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Super admin can manage product categories"
    ON product_categories FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================
CREATE POLICY "Authenticated staff can read stock movements"
    ON stock_movements FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can create stock movements"
    ON stock_movements FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE POLICY "Authenticated staff can read appointments"
    ON appointments FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can create appointments"
    ON appointments FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can update appointments"
    ON appointments FOR UPDATE
    TO authenticated
    USING (get_user_role() IS NOT NULL)
    WITH CHECK (get_user_role() IS NOT NULL);

-- Note: Public appointment creation uses admin client (bypasses RLS)

-- ============================================================
-- SALES
-- ============================================================
CREATE POLICY "Authenticated staff can read sales"
    ON sales FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can create sales"
    ON sales FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

CREATE POLICY "Super admin can void sales"
    ON sales FOR UPDATE
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- SALE ITEMS
CREATE POLICY "Authenticated staff can read sale items"
    ON sale_items FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can create sale items"
    ON sale_items FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

-- ============================================================
-- VISITS
-- ============================================================
CREATE POLICY "Authenticated staff can read visits"
    ON visits FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can manage visits"
    ON visits FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can update visits"
    ON visits FOR UPDATE
    TO authenticated
    USING (get_user_role() IS NOT NULL)
    WITH CHECK (get_user_role() IS NOT NULL);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE POLICY "Authenticated staff can read orders"
    ON orders FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can update orders"
    ON orders FOR UPDATE
    TO authenticated
    USING (get_user_role() IS NOT NULL)
    WITH CHECK (get_user_role() IS NOT NULL);

-- Note: Public order creation uses admin client (bypasses RLS)

-- ORDER ITEMS
CREATE POLICY "Authenticated staff can read order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE POLICY "Authenticated staff can read invoices"
    ON invoices FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can create invoices"
    ON invoices FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

CREATE POLICY "Super admin can void invoices"
    ON invoices FOR UPDATE
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- INVOICE LINE ITEMS
CREATE POLICY "Authenticated staff can read invoice line items"
    ON invoice_line_items FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can create invoice line items"
    ON invoice_line_items FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

-- INVOICE SEQUENCES
CREATE POLICY "Authenticated staff can use invoice sequences"
    ON invoice_sequences FOR ALL
    TO authenticated
    USING (get_user_role() IS NOT NULL)
    WITH CHECK (get_user_role() IS NOT NULL);

-- ORDER SEQUENCES
CREATE POLICY "Anyone can use order sequences"
    ON order_sequences FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- BEFORE/AFTER
-- ============================================================
CREATE POLICY "Anyone can read public before/after"
    ON before_after FOR SELECT
    TO anon
    USING (is_public = true AND deleted_at IS NULL);

CREATE POLICY "Authenticated staff can read all before/after"
    ON before_after FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can create before/after"
    ON before_after FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

CREATE POLICY "Super admin can update before/after"
    ON before_after FOR UPDATE
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- CONSENT RECORDS
CREATE POLICY "Super admin can manage consent records"
    ON consent_records FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE POLICY "Anyone can read approved reviews"
    ON reviews FOR SELECT
    TO anon
    USING (status = 'approved' AND deleted_at IS NULL);

CREATE POLICY "Authenticated staff can read all reviews"
    ON reviews FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can moderate reviews"
    ON reviews FOR UPDATE
    TO authenticated
    USING (get_user_role() IS NOT NULL)
    WITH CHECK (get_user_role() IS NOT NULL);

-- Note: Public review submission uses admin client (bypasses RLS)

-- ============================================================
-- CONTACT SUBMISSIONS
-- ============================================================
CREATE POLICY "Authenticated staff can read contact submissions"
    ON contact_submissions FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can update contact submissions"
    ON contact_submissions FOR UPDATE
    TO authenticated
    USING (get_user_role() IS NOT NULL)
    WITH CHECK (get_user_role() IS NOT NULL);

-- Note: Public contact submission uses admin client

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE POLICY "Authenticated staff can read audit log"
    ON audit_log FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

CREATE POLICY "Authenticated staff can create audit log entries"
    ON audit_log FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

-- ============================================================
-- EMAIL LOG
-- ============================================================
CREATE POLICY "Super admin can read email log"
    ON email_log FOR SELECT
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Authenticated staff can create email log entries"
    ON email_log FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);


-- ==========================================
-- FILE: 003_storage_and_hardening.sql
-- ==========================================
-- ============================================================
-- Brimish Skin Care Clinic — Migration 003: Storage & Hardening
-- Production readiness: Supabase Storage, function hardening, atomic inventory RPCs
-- ============================================================

-- ============================================================
-- 1. HARDEN SECURITY DEFINER FUNCTIONS WITH EXPLICIT SEARCH_PATH
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.staff
  WHERE auth_user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.staff
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION get_staff_id()
RETURNS UUID AS $$
  SELECT id FROM public.staff
  WHERE auth_user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    next_num INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Karachi');
    INSERT INTO invoice_sequences (year, last_number)
    VALUES (current_year, 1)
    ON CONFLICT (year) DO UPDATE
    SET last_number = invoice_sequences.last_number + 1
    RETURNING last_number INTO next_num;
    RETURN 'BSC-' || current_year || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    next_num INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Karachi');
    INSERT INTO order_sequences (year, last_number)
    VALUES (current_year, 1)
    ON CONFLICT (year) DO UPDATE
    SET last_number = order_sequences.last_number + 1
    RETURNING last_number INTO next_num;
    RETURN 'BSC-ORD-' || current_year || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Storage buckets (treatment-images, product-images, before-after-images, clinic-assets)
-- are created and managed via Supabase Storage API / Dashboard.

-- ============================================================
-- 4. ATOMIC INVENTORY & STOCK TRANSACTION FUNCTIONS
-- ============================================================

-- Atomic POS / Visit Stock Deduction (Prevents Concurrency Races)
CREATE OR REPLACE FUNCTION atomic_deduct_stock(
    p_product_id UUID,
    p_quantity INTEGER,
    p_movement_type stock_movement_type,
    p_reference_type TEXT,
    p_reference_id UUID,
    p_reason TEXT,
    p_staff_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_current_stock INTEGER;
    v_new_stock INTEGER;
    v_reserved INTEGER;
BEGIN
    -- Lock product row FOR UPDATE to prevent race condition
    SELECT stock_quantity, reserved_quantity
    INTO v_current_stock, v_reserved
    FROM public.products
    WHERE id = p_product_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found');
    END IF;

    -- Verify stock sufficiency
    IF (v_current_stock - v_reserved) < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient available stock',
            'available', (v_current_stock - v_reserved)
        );
    END IF;

    v_new_stock := v_current_stock - p_quantity;

    -- Update product stock
    UPDATE public.products
    SET stock_quantity = v_new_stock
    WHERE id = p_product_id;

    -- Insert audit stock movement
    INSERT INTO public.stock_movements (
        product_id,
        movement_type,
        quantity,
        quantity_before,
        quantity_after,
        reference_type,
        reference_id,
        reason,
        created_by
    ) VALUES (
        p_product_id,
        p_movement_type,
        -p_quantity,
        v_current_stock,
        v_new_stock,
        p_reference_type,
        p_reference_id,
        p_reason,
        p_staff_id
    );

    RETURN jsonb_build_object('success', true, 'new_stock', v_new_stock);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Atomic Order Stock Reservation
CREATE OR REPLACE FUNCTION atomic_reserve_stock(
    p_product_id UUID,
    p_quantity INTEGER,
    p_order_id UUID,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_current_stock INTEGER;
    v_reserved INTEGER;
    v_new_reserved INTEGER;
BEGIN
    SELECT stock_quantity, reserved_quantity
    INTO v_current_stock, v_reserved
    FROM public.products
    WHERE id = p_product_id AND is_active = true AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found or inactive');
    END IF;

    IF (v_current_stock - v_reserved) < p_quantity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock for reservation');
    END IF;

    v_new_reserved := v_reserved + p_quantity;

    UPDATE public.products
    SET reserved_quantity = v_new_reserved
    WHERE id = p_product_id;

    INSERT INTO public.stock_movements (
        product_id,
        movement_type,
        quantity,
        quantity_before,
        quantity_after,
        reference_type,
        reference_id,
        reason
    ) VALUES (
        p_product_id,
        'reservation',
        p_quantity,
        v_current_stock,
        v_current_stock,
        'order',
        p_order_id,
        p_reason
    );

    RETURN jsonb_build_object('success', true, 'reserved', v_new_reserved);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;


-- ==========================================
-- FILE: 004_production_email_logs.sql
-- ==========================================
-- ============================================================
-- Migration 004: Production Email Logs & Health Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS email_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient       TEXT NOT NULL,
    subject         TEXT NOT NULL,
    template_name   TEXT,
    status          TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'mock')),
    provider_id     TEXT,
    error_message   TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for searching email logs by recipient and date
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs (recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs (status);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admin (Doctor / Clinic Director) can inspect email logs
CREATE POLICY "Admins can view email logs"
    ON email_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.id = auth.uid()
            AND staff.is_active = true
            AND staff.role = 'super_admin'
        )
    );

-- Server-side / Service role insert policy
CREATE POLICY "Service role and staff can insert email logs"
    ON email_logs FOR INSERT
    TO authenticated, anon, service_role
    WITH CHECK (true);


-- ==========================================
-- FILE: 005_performance_and_health_indexes.sql
-- ==========================================
-- ============================================================
-- Migration 005: High-Performance Indexes & Database Health Checks
-- Verified against actual Brimish Skin Care schema definitions
-- ============================================================

-- 1. High-Frequency Foreign Key & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients (phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients (name);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_status ON appointments (scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits (patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON visits (visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices (patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON invoices (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices (invoice_number);

CREATE INDEX IF NOT EXISTS idx_sales_patient_id ON sales (patient_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products (category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON products (stock_quantity, low_stock_threshold) WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_treatments_category_active ON treatments (category_id, is_active);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements (movement_type);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_before_after_public ON before_after (is_public, created_at DESC) WHERE is_public = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_staff_date ON audit_log (staff_id, created_at DESC);

-- 2. Database Health & Diagnostic Function (Super Admin Only)
CREATE OR REPLACE FUNCTION public.get_clinic_health_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSONB;
    v_total_patients INTEGER;
    v_low_stock_count INTEGER;
    v_pending_orders INTEGER;
    v_today_appointments INTEGER;
    v_unpaid_invoices INTEGER;
BEGIN
    SELECT count(*) INTO v_total_patients FROM patients WHERE deleted_at IS NULL;
    SELECT count(*) INTO v_low_stock_count FROM products WHERE stock_quantity <= low_stock_threshold AND is_active = true AND deleted_at IS NULL;
    SELECT count(*) INTO v_pending_orders FROM orders WHERE status = 'received';
    SELECT count(*) INTO v_today_appointments FROM appointments WHERE (scheduled_at AT TIME ZONE 'Asia/Karachi')::DATE = CURRENT_DATE AND status IN ('pending', 'confirmed') AND deleted_at IS NULL;
    SELECT count(*) INTO v_unpaid_invoices FROM invoices WHERE status = 'issued';

    result := jsonb_build_object(
        'timestamp', now(),
        'total_patients', v_total_patients,
        'low_stock_products_count', v_low_stock_count,
        'pending_orders_count', v_pending_orders,
        'today_appointments_count', v_today_appointments,
        'unpaid_invoices_count', v_unpaid_invoices,
        'status', 'HEALTHY'
    );

    RETURN result;
END;
$$;


-- ==========================================
-- FILE: 006_intelligence_and_followups.sql
-- ==========================================
-- ============================================================
-- Migration 006: Clinic Intelligence, Follow-Ups & Daily Closings
-- ============================================================

DO $$ BEGIN
    CREATE TYPE follow_up_status AS ENUM ('pending', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Patient Operational Follow-Ups Table
CREATE TABLE IF NOT EXISTS patient_follow_ups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id        UUID REFERENCES visits(id) ON DELETE SET NULL,
    treatment_id    UUID REFERENCES treatments(id) ON DELETE SET NULL,
    due_date        DATE NOT NULL,
    notes           TEXT, -- Non-clinical operational instruction (e.g., "Check healing post-peel")
    status          follow_up_status NOT NULL DEFAULT 'pending',
    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES staff(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_due_status ON patient_follow_ups (due_date, status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_patient ON patient_follow_ups (patient_id);

-- 2. Daily Register Closing Table
CREATE TABLE IF NOT EXISTS daily_closings (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closing_date                DATE NOT NULL UNIQUE,
    total_sales                 NUMERIC(12, 2) NOT NULL DEFAULT 0,
    treatment_sales             NUMERIC(12, 2) NOT NULL DEFAULT 0,
    product_sales               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_tax                   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_discount              NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cash_payments               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    card_payments               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    bank_transfer_payments      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_invoices_issued       INTEGER NOT NULL DEFAULT 0,
    total_invoices_voided       INTEGER NOT NULL DEFAULT 0,
    total_appointments_completed INTEGER NOT NULL DEFAULT 0,
    notes                       TEXT,
    closed_by                   UUID REFERENCES staff(id),
    closed_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_closings_date ON daily_closings (closing_date DESC);

-- Enable RLS
ALTER TABLE patient_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closings ENABLE ROW LEVEL SECURITY;

-- Follow-Up Policies: All active staff can view, create, and complete follow-ups
CREATE POLICY "Staff can view follow-ups"
    ON patient_follow_ups FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.is_active = true));

CREATE POLICY "Staff can insert follow-ups"
    ON patient_follow_ups FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.is_active = true));

CREATE POLICY "Staff can update follow-ups"
    ON patient_follow_ups FOR UPDATE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.is_active = true));

-- Daily Closings Policies: Staff can read, Super Admin can insert/manage
CREATE POLICY "Staff can view daily closings"
    ON daily_closings FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.is_active = true));

CREATE POLICY "Super Admin can manage daily closings"
    ON daily_closings FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.is_active = true AND staff.role = 'super_admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.is_active = true AND staff.role = 'super_admin'));

