# Brimish Skin Care Clinic — Real Clinic Data Configuration Checklist

This checklist defines every real-world business, legal, medical, and operational data item required to populate the Brimish Skin Care Clinic production platform prior to patient launch.

> **CRITICAL RULE**: Do not invent fake clinic licenses, real doctor credentials, tax numbers, or phone numbers. If values are pending clinic administration sign-off, leave defaults configurable in `clinic_settings` or Supabase dashboard.

---

## 1. Clinic Identity & Location

| Field Name | Database Column / Env | Production Requirement | Example / Format | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **Clinic Name** | `clinic_settings.clinic_name` | Official registered legal clinic trade name | `Brimish Skin Care Clinic` | Configured |
| **Clinic Logo** | `clinic_settings.logo_url` | High-res vector SVG or PNG uploaded to `clinic-assets` bucket | `https://.../clinic-assets/logo.png` | Default SVG / Needs Real File |
| **Physical Address** | `clinic_settings.clinic_address` | Full physical street address, building, floor | `Suite 204, Executive Heights, University Road, Peshawar` | Pending Owner Input |
| **City & Province** | `clinic_settings.clinic_city` | City & Province | `Peshawar, Khyber Pakhtunkhwa` | Default: Peshawar |
| **Country** | `clinic_settings.currency_code` | PK / PKR | `Pakistan / PKR` | Configured |
| **Primary Phone** | `clinic_settings.clinic_phone` | Landline or official mobile with country code | `+92-91-XXXXXXX` / `+92-300-XXXXXXX` | Pending Owner Input |
| **WhatsApp Number** | `clinic_settings.social_whatsapp` | Active clinic WhatsApp Business number | `+92300XXXXXXX` (no dashes for wa.me links) | Pending Owner Input |
| **Official Email** | `clinic_settings.clinic_email` | Dedicated domain email address | `info@brimishskincare.com` | Configured |
| **Google Maps Embed** | `clinic_settings.google_maps_embed`| Google Maps iframe embed URL for Contact page | `https://www.google.com/maps/embed?...` | Placeholder / Needs Exact Lat-Long |

---

## 2. Medical & Clinical Personnel

| Personnel / Role | Database Table | Required Information | Current Status |
| :--- | :--- | :--- | :--- |
| **Super Admin / Medical Director** | `staff` (`role: 'super_admin'`) | Full Name, Medical Degree (e.g. MBBS, FCPS Dermatology), PMDC/PMC Registration #, Specializations, Bio, Email | Needs Doctor Real Data |
| **Receptionist / Front Desk Staff**| `staff` (`role: 'receptionist'`) | Full Name, Staff Email, Phone, Access credentials | Needs Front Desk Email |

---

## 3. Tax, Fiscal & Legal Attributes

> Note: All receipts/invoices are formatted as standard Pakistan Commercial Tax Invoices. Do NOT claim certified FBR e-fiscalization unless an integrated FBR POS sandbox/production API is connected.

| Field | Column in `clinic_settings` | Description | Current Default |
| :--- | :--- | :--- | :--- |
| **National Tax Number (NTN)** | `ntn` | 7-digit NTN assigned by FBR to clinic entity | Empty (`NULL`) |
| **Sales Tax Reg Number (STRN)** | `strn` | KP Revenue Authority (KPRA) or FBR STRN | Empty (`NULL`) |
| **Default Tax Rate (%)** | `default_tax_rate` | Standard provincial service sales tax or federal GST rate (e.g., 5% or 15%) | `0.00` |
| **Tax Display Label** | `default_tax_label` | Printed label on receipts | `GST` / `KPRA Sales Tax` |

---

## 4. Operating Hours & Appointment Slots

Located in `operating_hours` table (day 0 = Sunday, 6 = Saturday):

| Day of Week | `is_closed` | `open_time` | `close_time` | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Monday** | `false` | `10:00:00` | `19:00:00` | Standard Weekday |
| **Tuesday** | `false` | `10:00:00` | `19:00:00` | Standard Weekday |
| **Wednesday** | `false` | `10:00:00` | `19:00:00` | Standard Weekday |
| **Thursday** | `false` | `10:00:00` | `19:00:00` | Standard Weekday |
| **Friday** | `false` | `14:30:00` | `20:00:00` | Post-Jummah Clinic Hours |
| **Saturday** | `false` | `10:00:00` | `19:00:00` | Weekend Peak Hours |
| **Sunday** | `true` | `NULL` | `NULL` | Clinic Off-Day |

---

## 5. Clinical Treatments Catalog

Each active treatment requires entry into the `treatments` table:

| Treatment Name | Category | Duration (min) | Price (PKR) | Requires Consent? | Image Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HydraFacial Deluxe** | Facial | 45 | Verify with clinic | Yes | `treatment-images/hydrafacial.webp` |
| **Carbon Laser Peel** | Laser | 30 | Verify with clinic | Yes | `treatment-images/carbon-laser.webp` |
| **Microneedling (Dermapen)** | Rejuvenation | 60 | Verify with clinic | Yes | `treatment-images/microneedling.webp` |
| **PRP Facial Treatment** | Aesthetic | 60 | Verify with clinic | Yes | `treatment-images/prp.webp` |
| **Chemical Peel (Salicylic/Glycolic)**| Peels | 30 | Verify with clinic | Yes | `treatment-images/peel.webp` |
| **Laser Hair Reduction** | Laser | 45 | Verify with clinic | Yes | `treatment-images/laser-hair.webp` |

---

## 6. Retail & Post-Procedure Products

Each SKU requires entry into the `products` table and an initial stock movement:

| Product SKU | Product Title | Category | Retail Price (PKR) | Opening Stock | Low Stock Alert Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SKU-SER-001` | Niacinamide 10% + Zinc Serum 30ml | Serums | Set price | Count units | 5 |
| `SKU-SER-002` | Vitamin C 20% Brightening Serum | Serums | Set price | Count units | 5 |
| `SKU-SUN-001` | Mineral SPF 50+ Invisible Sunscreen | Sun Protection| Set price | Count units | 10 |
| `SKU-CLN-001` | Gentle Foaming Cleanser 150ml | Cleansers | Set price | Count units | 8 |
| `SKU-CRM-001` | Ceramide Barrier Repair Cream | Moisturizers | Set price | Count units | 6 |

---

## 7. Social Media & External Channels

Configurable in `clinic_settings` and displayed across public website footer:

- **Instagram**: `https://instagram.com/brimishskincare`
- **Facebook**: `https://facebook.com/brimishskincare`
- **TikTok**: `https://tiktok.com/@brimishskincare`
- **YouTube**: (Optional clinic channel)

---

## 8. Configuration Update Protocol

To update clinic settings securely without modifying SQL directly:
1. Log in to the Clinic Dashboard as `super_admin`.
2. Navigate to **Settings** (`/dashboard/settings`).
3. Click **Edit Settings** (or update via Supabase Table Editor if admin UI is read-only).
4. Save changes.
5. All changes automatically reflect across:
   - Invoice headers & footers
   - Appointment confirmation emails
   - Order confirmation emails
   - Public website footer & contact page
