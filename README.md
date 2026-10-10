# Brimish Skin Care & Aesthetic Clinic

A modern, full-stack clinic management platform and public medical aesthetics portal built for **Brimish Skin Care & Laser Clinic** (Peshawar, Pakistan).

Designed for Dr. Bilal Ahmad's aesthetic practice, featuring patient scheduling, clinic POS terminal with 80mm thermal receipt printing, real-time inventory management, and an e-commerce skincare storefront.

---

## 🚀 Key Features

### 🏥 Public Patient Portal
- **Cinematic Experience**: Luxury responsive design showcasing clinical procedures (HydraFacial MD, Laser Rejuvenation, Chemical Peels, Microneedling).
- **Online Appointment Booking**: Frictionless booking flow with doctor slot allocation, zero-advance policy, and email notifications.
- **Skincare Storefront**: Browse medical-grade skincare products with local currency pricing (`PKR`) and cash-on-delivery checkout.
- **Public Invoice Verification**: Instant cryptographic and QR code verification of clinic receipts via `/verify-invoice`.
- **SEO & Performance**: OpenGraph metadata, JSON-LD Schema (MedicalClinic & Physician), XML sitemap, and dynamic robots.txt.

### 💼 Clinical Dashboard & POS
- **Role-Based Access Control (RBAC)**: Distinct permissions for `doctor` (full administrative & clinical access) and `receptionist` (front-desk POS, bookings, patient registration).
- **POS Terminal**: Fast, zero-scroll point-of-sale interface with barcode/SKU search, discount calculations, multiple payment modes (Cash, Bank Transfer, POS Card), and instant stock sync.
- **80mm Thermal Receipts**: Direct browser printing for standard 80mm thermal POS printers with clinic logo, breakdown, and dynamic QR verification code.
- **Real-Time Inventory**: Automated stock deduction, reservation fulfillment, minimum stock threshold alerts, and custom category management.
- **Patient Electronic Records (EMR)**: Complete patient consultation history, treatment notes, and contact records.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions)
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **UI Components**: Radix UI / Shadcn primitives
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL 15, Row Level Security, Auth Sessions)
- **Media Storage**: [Cloudinary](https://cloudinary.com/) & Supabase Storage
- **Transactional Email**: [Resend API](https://resend.com/)
- **Charts & Reports**: Chart.js / React-ChartJS-2

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js 20+ (LTS recommended)
- npm or pnpm
- Supabase project credentials

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/00tatheer00/Asthetic-Clinic-System.git
cd Asthetic-Clinic-System/brimish-skincare
npm install
```

### 3. Environment Configuration

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env.local
```

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

RESEND_API_KEY="re_xxxxxxxxx"
RESEND_FROM_EMAIL="onboarding@resend.dev"
CLINIC_ADMIN_EMAIL="brimishclinic@gmail.com"

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 4. Database Setup

Apply the SQL migration files located in `supabase/migrations/` to your Supabase project in sequential order:
1. `001_initial_schema.sql`
2. `002_rls_policies.sql`
3. `003_storage_and_hardening.sql`
4. `004_production_email_logs.sql`
5. `005_performance_and_health_indexes.sql`
6. `006_intelligence_and_followups.sql`
7. `007_procedures_and_payments.sql`

### 5. Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the public site, or [http://localhost:3000/auth/login](http://localhost:3000/auth/login) for the clinic staff portal.

### 🔑 Clinic Staff & Admin Access

- **Portal URL**: `/auth/login` ([http://localhost:3000/auth/login](http://localhost:3000/auth/login))
- **Email**: `bilal@admin.com`
- **Role**: Super Admin / Medical Director (Full administrative and clinical privileges)

---

## 📦 Build & Production

```bash
# Type check
npx tsc --noEmit

# Production build
npm run build

# Start production server
npm run start
```

---

## 📄 License & Ownership

Proprietary software developed exclusively for **Brimish Skin Care Clinic**, Peshawar, Pakistan. All rights reserved.
