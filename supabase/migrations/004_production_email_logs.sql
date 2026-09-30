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
