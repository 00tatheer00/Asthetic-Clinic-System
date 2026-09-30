-- ============================================================
-- Brimish Skin Care Clinic — Database Migration
-- Full schema: enums, tables, indexes, constraints, functions
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'receptionist');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'pending', 'confirmed', 'rescheduled', 'checked_in',
    'completed', 'no_show', 'cancelled', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'received', 'confirmed', 'preparing',
    'ready', 'shipped', 'delivered', 'picked_up',
    'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_method AS ENUM ('pickup', 'delivery');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'card', 'bank_transfer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'partially_refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('issued', 'paid', 'voided');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE stock_movement_type AS ENUM (
    'initial', 'purchase', 'sale', 'adjustment',
    'return', 'reservation', 'reservation_release',
    'reservation_fulfillment', 'correction'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE consent_status AS ENUM ('pending', 'given', 'revoked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'create', 'update', 'delete', 'void',
    'login', 'logout', 'export', 'email_sent'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

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
