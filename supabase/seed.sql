-- ============================================================
-- Brimish Skin Care Clinic — Seed Data
-- Run after migrations and after creating the admin auth user
-- ============================================================

-- Insert clinic settings
INSERT INTO clinic_settings (
    clinic_name,
    clinic_address,
    clinic_city,
    clinic_phone,
    clinic_email,
    default_tax_rate,
    default_tax_label,
    currency_code,
    timezone
) VALUES (
    'Brimish Skin Care',
    'Peshawar, Khyber Pakhtunkhwa, Pakistan',
    'Peshawar',
    '0091XXXXXXX',
    'info@brimishskincare.com',
    0,
    'GST',
    'PKR',
    'Asia/Karachi'
);

-- Insert operating hours (Mon-Sat 10am-7pm, Sun closed)
INSERT INTO operating_hours (day_of_week, open_time, close_time, is_closed) VALUES
    (0, NULL, NULL, true),          -- Sunday: Closed
    (1, '10:00', '19:00', false),   -- Monday
    (2, '10:00', '19:00', false),   -- Tuesday
    (3, '10:00', '19:00', false),   -- Wednesday
    (4, '10:00', '19:00', false),   -- Thursday
    (5, '10:00', '19:00', false),   -- Friday
    (6, '10:00', '17:00', false);   -- Saturday (shorter hours)

-- Sample treatment categories
INSERT INTO treatment_categories (name, slug, description, sort_order) VALUES
    ('Facial Treatments', 'facial-treatments', 'Professional facial treatments for all skin types', 1),
    ('Skin Rejuvenation', 'skin-rejuvenation', 'Advanced skin rejuvenation and anti-aging procedures', 2),
    ('Acne Treatment', 'acne-treatment', 'Targeted acne treatment and scar reduction', 3),
    ('Body Treatments', 'body-treatments', 'Full body skincare and treatment services', 4);

-- Sample treatments
INSERT INTO treatments (name, slug, category_id, short_description, description, price, price_label, duration_minutes, is_active, is_featured, sort_order) VALUES
    (
        'HydraFacial',
        'hydrafacial',
        (SELECT id FROM treatment_categories WHERE slug = 'facial-treatments'),
        'Deep cleansing and hydrating facial treatment for radiant skin.',
        'Our signature HydraFacial uses patented technology to cleanse, extract, and hydrate your skin. This non-invasive treatment delivers instant results with no downtime. Suitable for all skin types.',
        5000,
        'Per session',
        60,
        true,
        true,
        1
    ),
    (
        'Chemical Peel',
        'chemical-peel',
        (SELECT id FROM treatment_categories WHERE slug = 'skin-rejuvenation'),
        'Professional chemical peel for improved skin texture and tone.',
        'Our customized chemical peels target fine lines, uneven skin tone, acne scars, and sun damage. We offer light, medium, and deep peels tailored to your skin type and concerns.',
        3500,
        'Starting from',
        45,
        true,
        true,
        2
    ),
    (
        'Acne Clear Program',
        'acne-clear-program',
        (SELECT id FROM treatment_categories WHERE slug = 'acne-treatment'),
        'Comprehensive acne treatment program with visible results.',
        'Our multi-step acne treatment program combines professional treatments with a personalized home care routine. Includes deep cleansing, extraction, LED therapy, and customized product recommendations.',
        8000,
        'Per program',
        90,
        true,
        false,
        3
    ),
    (
        'Microneedling',
        'microneedling',
        (SELECT id FROM treatment_categories WHERE slug = 'skin-rejuvenation'),
        'Collagen-boosting microneedling for smoother, younger-looking skin.',
        'Microneedling creates controlled micro-injuries to stimulate your skin''s natural healing process. This treatment improves fine lines, acne scars, pore size, and overall skin texture.',
        6000,
        'Per session',
        60,
        true,
        true,
        4
    );

-- Sample product categories
INSERT INTO product_categories (name, slug, description, sort_order) VALUES
    ('Cleansers', 'cleansers', 'Gentle cleansing products for daily use', 1),
    ('Moisturizers', 'moisturizers', 'Hydrating moisturizers for all skin types', 2),
    ('Sunscreen', 'sunscreen', 'Sun protection products with broad-spectrum coverage', 3),
    ('Serums', 'serums', 'Concentrated treatment serums', 4);

-- Sample products
INSERT INTO products (name, slug, sku, category_id, short_description, description, purchase_price, sale_price, stock_quantity, low_stock_threshold, is_published, is_active, sort_order) VALUES
    (
        'Gentle Foam Cleanser',
        'gentle-foam-cleanser',
        'BSC-CLN-001',
        (SELECT id FROM product_categories WHERE slug = 'cleansers'),
        'Mild foaming cleanser for sensitive skin',
        'A gentle, pH-balanced foaming cleanser that removes dirt and makeup without stripping your skin. Suitable for sensitive and acne-prone skin.',
        400,
        850,
        25,
        5,
        true,
        true,
        1
    ),
    (
        'Ultra Hydrating Moisturizer',
        'ultra-hydrating-moisturizer',
        'BSC-MST-001',
        (SELECT id FROM product_categories WHERE slug = 'moisturizers'),
        'Deeply hydrating moisturizer with hyaluronic acid',
        'A lightweight, non-comedogenic moisturizer infused with hyaluronic acid and ceramides. Provides 24-hour hydration without clogging pores.',
        600,
        1200,
        18,
        5,
        true,
        true,
        2
    ),
    (
        'SPF 50+ Sunscreen',
        'spf-50-sunscreen',
        'BSC-SUN-001',
        (SELECT id FROM product_categories WHERE slug = 'sunscreen'),
        'Broad-spectrum SPF 50+ sunscreen, lightweight finish',
        'A dermatologist-recommended broad-spectrum sunscreen with SPF 50+ protection. Lightweight, non-greasy formula that absorbs quickly. Ideal for daily use under makeup.',
        500,
        1100,
        30,
        8,
        true,
        true,
        3
    ),
    (
        'Vitamin C Brightening Serum',
        'vitamin-c-brightening-serum',
        'BSC-SRM-001',
        (SELECT id FROM product_categories WHERE slug = 'serums'),
        'Potent vitamin C serum for brighter, even-toned skin',
        'A concentrated 15% L-ascorbic acid serum that brightens skin, fades dark spots, and provides antioxidant protection. Use morning and evening for best results.',
        800,
        1800,
        12,
        3,
        true,
        true,
        4
    );

-- Create initial stock movements for products
INSERT INTO stock_movements (product_id, movement_type, quantity, quantity_before, quantity_after, reason)
SELECT id, 'initial', stock_quantity, 0, stock_quantity, 'Initial stock setup'
FROM products;
