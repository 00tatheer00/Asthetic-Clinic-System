-- ============================================================
-- Brimish Skin Care Clinic — Migration 008
-- Advance GST & Tax Fields for Products & POS Sales
-- ============================================================

-- 1. Add GST / Tax configuration columns to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_type TEXT NOT NULL DEFAULT 'percentage' CHECK (tax_type IN ('percentage', 'flat')),
ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS flat_tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- 2. Add tax tracking columns to sale_items
ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) DEFAULT 0;

-- 3. Add tax columns to invoice_line_items
ALTER TABLE invoice_line_items
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) DEFAULT 0;

-- 4. Create index for fast filtering
CREATE INDEX IF NOT EXISTS idx_products_is_taxable ON products(is_taxable) WHERE deleted_at IS NULL;
