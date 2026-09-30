# Brimish Skin Care Clinic — Administrator Operations Manual

**Role Target**: Clinic Owner, Medical Director & System Administrator  
**Access Level**: Super Admin (`super_admin`)  
**Version**: 1.0.0-production  
**Date**: October 2026  

---

## 1. Product & Inventory Management

### 1.1 Adding a New Skincare Product
1. Go to **Dashboard** > **Inventory** (`/dashboard/inventory`).
2. Click **Add Product**.
3. Complete the required fields:
   - **Product Name**: Official commercial brand name (e.g., *Niacinamide 10% + Zinc Serum*).
   - **SKU**: Unique alphanumeric SKU code (e.g., `SKU-SER-003`).
   - **Category**: Select category (Serums, Cleansers, Sun Protection, Moisturizers).
   - **Cost Price (Purchase)**: What the clinic paid to acquire the unit.
   - **Retail Price (Sale)**: The price charged to retail patients.
   - **Initial Stock**: Physical units in stock.
   - **Reorder Threshold**: Count at which the dashboard generates a "Low Stock" warning (recommended: 5 units).
4. Click **Save Product**.

### 1.2 Restocking Existing Products
1. In the **Inventory** list, click **Restock** on the target product.
2. Enter the number of new units received.
3. System automatically creates an audit record in `inventory_movements` with movement type `purchase`.

### 1.3 Inventory Adjustments (Damaged / Expired Goods)
1. In the **Inventory** list, click **Adjust**.
2. Select the reason code (Damaged, Expired, Inventory Count Correction).
3. Enter the adjustment quantity and explanatory notes.
4. The system updates stock and preserves an immutable audit trail.

---

## 2. Clinical Treatments Management

### 2.1 Adding or Editing Procedures
1. Go to **Dashboard** > **Content** > **Treatments** (`/dashboard/content/treatments`).
2. Click **Add Treatment**.
3. Enter:
   - **Name**: Procedure title (e.g., *Carbon Laser Peel*).
   - **Category**: Facial, Laser, Chemical Peels, Rejuvenation.
   - **Duration**: Expected time in minutes (e.g., 45).
   - **Base Price**: Price in PKR.
   - **Description**: Patient-friendly summary of procedure benefits and aftercare.
4. Click **Save Treatment**. It immediately reflects in the booking form and POS.

---

## 3. Financial Adjustments: Invoice Voiding & Refunds

> **Auditing Rule**: Never delete an invoice from the database. All historical invoices must remain traceable.

### 3.1 Voiding an Erroneous Invoice
1. Go to **Invoices** (`/dashboard/invoices`).
2. Click the target invoice to view details.
3. Click **Void Invoice** (visible only to `super_admin`).
4. Enter the required **Void Reason** (e.g., "Cashier entered wrong customer name" or "Transaction duplicated").
5. Click **Confirm Void**.
6. The system sets `status = 'voided'`, strikes through the receipt, and logs the void in `audit_log`.

---

## 4. Patient Consent & Before/After Photography

### 4.1 Consent Safeguards
- Under medical ethics, patient before-and-after photographs may **NEVER** be publicly displayed without explicit signed consent.
- In `/dashboard/gallery`:
  - `is_published`: Controls whether the case is visible to the public.
  - `consent_obtained`: Must be checked before `is_published` can be enabled.

### 4.2 Handling Consent Revocation
If a patient requests their photos be removed from the public website:
1. Open `/dashboard/gallery`.
2. Locate the case and click **Edit**.
3. Uncheck **Consent Obtained** and **Published**.
4. Click **Update Case**.
5. The public gallery immediately stops rendering the image.

---

## 5. Staff Account Administration

### 5.1 Adding a New Receptionist
1. Open your Supabase Dashboard > **Authentication** > **Users**.
2. Click **Add User** > **Create User**.
3. Enter their clinic email (e.g., `reception2@brimishskincare.com`) and secure temporary password.
4. Check **Auto Confirm Email: Yes**.
5. Copy the generated User UID (UUID).
6. In Supabase SQL Editor, run:
   ```sql
   INSERT INTO public.staff (auth_user_id, name, email, role, is_active)
   VALUES ('<COPIED_UID>', 'Staff Member Name', 'reception2@brimishskincare.com', 'receptionist', true);
   ```

### 5.2 Deactivating Staff Access
If a receptionist leaves the clinic:
1. In Supabase SQL Editor, set `is_active = false`:
   ```sql
   UPDATE public.staff SET is_active = false WHERE email = 'former_staff@brimishskincare.com';
   ```
2. In Supabase Auth > Users, select user > **Disable User**.
3. All active session cookies will be revoked at the next request.
