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

-- ============================================================
-- 2. SUPABASE STORAGE BUCKETS SETUP
-- ============================================================

-- Create storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('treatment-images', 'treatment-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
    ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
    ('before-after-images', 'before-after-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
    ('clinic-assets', 'clinic-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 3. STORAGE RLS POLICIES (storage.objects)
-- ============================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid duplication
DROP POLICY IF EXISTS "Public can view treatment images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view clinic assets" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload to public buckets" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update public buckets" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete from public buckets" ON storage.objects;
DROP POLICY IF EXISTS "Staff can manage before-after images" ON storage.objects;
DROP POLICY IF EXISTS "Public view before-after with verified consent" ON storage.objects;

-- Public can read treatment, product, and clinic assets
CREATE POLICY "Public can view treatment images"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'treatment-images');

CREATE POLICY "Public can view product images"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'product-images');

CREATE POLICY "Public can view clinic assets"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'clinic-assets');

-- Staff can upload to public media buckets
CREATE POLICY "Staff can upload to public buckets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id IN ('treatment-images', 'product-images', 'clinic-assets', 'before-after-images')
        AND get_user_role() IS NOT NULL
    );

CREATE POLICY "Staff can update public buckets"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id IN ('treatment-images', 'product-images', 'clinic-assets', 'before-after-images')
        AND get_user_role() IS NOT NULL
    )
    WITH CHECK (
        bucket_id IN ('treatment-images', 'product-images', 'clinic-assets', 'before-after-images')
        AND get_user_role() IS NOT NULL
    );

-- Only super admin can delete storage files
CREATE POLICY "Admin can delete from public buckets"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (is_super_admin());

-- Before-After Private Bucket Read Policy:
-- Authenticated staff can always read
-- Public can ONLY read if image URL is linked to an approved public case with verified consent
CREATE POLICY "Staff can read before-after images"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'before-after-images'
        AND get_user_role() IS NOT NULL
    );

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
