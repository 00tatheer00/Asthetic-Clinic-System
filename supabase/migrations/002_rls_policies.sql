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
