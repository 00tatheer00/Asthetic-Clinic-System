-- ============================================================
-- Migration 005: High-Performance Indexes & Database Health Checks
-- ============================================================

-- 1. High-Frequency Foreign Key & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients (phone);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients (mrn);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments (appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits (patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits (visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices (patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON invoices (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices (invoice_number);

CREATE INDEX IF NOT EXISTS idx_sales_patient_id ON sales (patient_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products (category, is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock_reorder ON products (stock_quantity, reorder_level) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_treatments_category_active ON treatments (category, is_active);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements (movement_type);

CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews (is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_before_after_gallery ON before_after_cases (is_published, consent_obtained) WHERE is_published = true AND consent_obtained = true;

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
    SELECT count(*) INTO v_total_patients FROM patients;
    SELECT count(*) INTO v_low_stock_count FROM products WHERE stock_quantity <= reorder_level AND is_active = true;
    SELECT count(*) INTO v_pending_orders FROM orders WHERE status = 'received';
    SELECT count(*) INTO v_today_appointments FROM appointments WHERE appointment_date = CURRENT_DATE AND status IN ('pending', 'confirmed');
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
