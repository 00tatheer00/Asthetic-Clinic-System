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
