-- ============================================================
-- Brimish Skin Care Clinic — Migration 007
-- Patient Procedures (Multi-Session Plans) & Payments
-- ============================================================

-- Ensure payment_method enum exists safely
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('cash', 'card', 'bank_transfer');
    END IF;
END $$;

-- 1. Receipt Sequence Table & Generator
CREATE TABLE IF NOT EXISTS payment_receipt_sequences (
    year            INTEGER NOT NULL,
    last_number     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (year)
);

CREATE OR REPLACE FUNCTION generate_procedure_receipt_number()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    next_num INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Karachi');
    INSERT INTO payment_receipt_sequences (year, last_number)
    VALUES (current_year, 1)
    ON CONFLICT (year) DO UPDATE
    SET last_number = payment_receipt_sequences.last_number + 1
    RETURNING last_number INTO next_num;
    RETURN 'BSC-PAY-' || current_year || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- 2. Patient Procedures (Multi-Session Treatment Plans / Packages)
CREATE TABLE IF NOT EXISTS patient_procedures (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    treatment_id            UUID REFERENCES treatments(id) ON DELETE SET NULL,
    plan_name               TEXT NOT NULL,
    total_sessions          INTEGER NOT NULL DEFAULT 1 CHECK (total_sessions >= 1),
    completed_sessions      INTEGER NOT NULL DEFAULT 0 CHECK (completed_sessions >= 0),
    status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    total_cost              NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
    paid_amount             NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    balance_amount          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_status          TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
    interval_days           INTEGER DEFAULT 30,
    next_session_due_date   DATE,
    doctor_id               UUID REFERENCES staff(id) ON DELETE SET NULL,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID REFERENCES staff(id) ON DELETE SET NULL,
    deleted_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_patient_procedures_patient ON patient_procedures(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patient_procedures_status ON patient_procedures(status);
CREATE INDEX IF NOT EXISTS idx_patient_procedures_due ON patient_procedures(next_session_due_date);
CREATE INDEX IF NOT EXISTS idx_patient_procedures_created ON patient_procedures(created_at DESC);

-- 3. Procedure Sessions (Individual Session Logs with Clinical Parameters)
CREATE TABLE IF NOT EXISTS procedure_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    procedure_id            UUID NOT NULL REFERENCES patient_procedures(id) ON DELETE CASCADE,
    patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    session_number          INTEGER NOT NULL CHECK (session_number >= 1),
    session_date            TIMESTAMPTZ NOT NULL DEFAULT now(),
    status                  TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    doctor_id               UUID REFERENCES staff(id) ON DELETE SET NULL,
    treatment_area          TEXT,
    settings_used           TEXT,
    observations_notes      TEXT,
    aftercare_instructions  TEXT,
    next_recommended_date   DATE,
    appointment_id          UUID REFERENCES appointments(id) ON DELETE SET NULL,
    visit_id                UUID REFERENCES visits(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID REFERENCES staff(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_procedure_sessions_proc ON procedure_sessions(procedure_id);
CREATE INDEX IF NOT EXISTS idx_procedure_sessions_patient ON procedure_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_procedure_sessions_date ON procedure_sessions(session_date DESC);

-- 4. Procedure Payments (Ledger & Receipts)
CREATE TABLE IF NOT EXISTS procedure_payments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    procedure_id            UUID NOT NULL REFERENCES patient_procedures(id) ON DELETE CASCADE,
    patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    session_id              UUID REFERENCES procedure_sessions(id) ON DELETE SET NULL,
    receipt_number          TEXT NOT NULL UNIQUE,
    amount                  NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method          payment_method NOT NULL DEFAULT 'cash',
    payment_date            TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_by             UUID REFERENCES staff(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_procedure_payments_proc ON procedure_payments(procedure_id);
CREATE INDEX IF NOT EXISTS idx_procedure_payments_patient ON procedure_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_procedure_payments_date ON procedure_payments(payment_date DESC);

-- 5. Row Level Security Policies
ALTER TABLE payment_receipt_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_payments ENABLE ROW LEVEL SECURITY;

-- Receipt sequences policy
DROP POLICY IF EXISTS "Staff can manage payment receipt sequences" ON payment_receipt_sequences;
CREATE POLICY "Staff can manage payment receipt sequences"
    ON payment_receipt_sequences FOR ALL
    TO authenticated
    USING (get_user_role() IS NOT NULL)
    WITH CHECK (get_user_role() IS NOT NULL);

-- Patient Procedures Policies
DROP POLICY IF EXISTS "Staff can view patient procedures" ON patient_procedures;
CREATE POLICY "Staff can view patient procedures"
    ON patient_procedures FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Staff can create patient procedures" ON patient_procedures;
CREATE POLICY "Staff can create patient procedures"
    ON patient_procedures FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can update patient procedures" ON patient_procedures;
CREATE POLICY "Staff can update patient procedures"
    ON patient_procedures FOR UPDATE
    TO authenticated
    USING (get_user_role() IS NOT NULL)
    WITH CHECK (get_user_role() IS NOT NULL);

-- Procedure Sessions Policies
DROP POLICY IF EXISTS "Staff can view procedure sessions" ON procedure_sessions;
CREATE POLICY "Staff can view procedure sessions"
    ON procedure_sessions FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can create procedure sessions" ON procedure_sessions;
CREATE POLICY "Staff can create procedure sessions"
    ON procedure_sessions FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can update procedure sessions" ON procedure_sessions;
CREATE POLICY "Staff can update procedure sessions"
    ON procedure_sessions FOR UPDATE
    TO authenticated
    USING (get_user_role() IS NOT NULL)
    WITH CHECK (get_user_role() IS NOT NULL);

-- Procedure Payments Policies
DROP POLICY IF EXISTS "Staff can view procedure payments" ON procedure_payments;
CREATE POLICY "Staff can view procedure payments"
    ON procedure_payments FOR SELECT
    TO authenticated
    USING (get_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can create procedure payments" ON procedure_payments;
CREATE POLICY "Staff can create procedure payments"
    ON procedure_payments FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can update procedure payments" ON procedure_payments;
CREATE POLICY "Staff can update procedure payments"
    ON procedure_payments FOR UPDATE
    TO authenticated
    USING (get_user_role() IS NOT NULL)
    WITH CHECK (get_user_role() IS NOT NULL);

-- 6. Grant Permissions & Reload Schema Cache
GRANT ALL ON payment_receipt_sequences TO authenticated, service_role;
GRANT ALL ON patient_procedures TO authenticated, service_role;
GRANT ALL ON procedure_sessions TO authenticated, service_role;
GRANT ALL ON procedure_payments TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_procedure_receipt_number() TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
