# Brimish Skin Care Clinic — Disaster Recovery & Business Continuity Plan

**System**: Brimish Skin Care Clinic Production Management Platform  
**Target Environment**: Next.js 16 (Vercel) + Supabase PostgreSQL 15 + Resend  
**Version**: 1.0.0-production  
**Date**: October 2026  
**Auditor**: Senior DevOps Engineer & Cloud Systems Architect  

---

## 1. Disaster Recovery Objectives & SLAs

| Metric | Target SLA | Description |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | < 1 Hour (Pro Tier) / 24 Hours (Free) | Maximum permissible data loss interval in the event of hardware or cluster failure. |
| **Recovery Time Objective (RTO)** | < 30 Minutes | Maximum permissible downtime before services are restored to operational status. |
| **Deployment Rollback Time** | < 2 Minutes | Instantaneous rollback to previous stable deployment via Vercel Edge. |

---

## 2. Backup & Retention Strategy

### 2.1 Database Backups (Supabase Managed PostgreSQL)
- **Automated Physical WAL Backups**: Taken daily by Supabase's managed infrastructure and stored in geographically isolated multi-zone cloud storage.
- **Point-In-Time Recovery (PITR)**: Available on Supabase Pro/Team projects, allowing rollbacks to any second within the past 7 days.
- **Manual Snapshot Schedule**:
  - Prior to every production release, schema migration, or quarterly audit, execute a full SQL logical backup:
    ```bash
    # Run from administrative machine with Supabase CLI
    npx supabase db dump --project-ref <PROJECT_ID> -f "brimish_db_snapshot_$(date +%Y%m%d_%H%M%S).sql"
    ```
  - Store encrypted snapshots in an off-site S3 bucket or secure clinic hardware drive.

### 2.2 Storage & File Recovery
- All uploaded images (`treatment-images`, `product-images`, `clinic-assets`, `before-after-images`) are stored in Supabase Object Storage backed by AWS S3 multi-AZ replication.
- Periodic sync to secondary storage (optional quarterly backup):
  ```bash
  aws s3 sync s3://<SUPABASE_STORAGE_BUCKET> ./clinic_media_backup/
  ```

### 2.3 Environment Variable Recovery
- Full environment documentation is preserved in `docs/PRODUCTION-ENVIRONMENT.md`.
- In the event of a compromised Vercel project, secrets can be re-injected into a new Vercel instance in under 5 minutes.

---

## 3. Step-by-Step Restoration & Rollback Procedures

### 3.1 Vercel Application Rollback (Deployment Outage)
If a newly pushed release exhibits an unexpected runtime bug:
1. Log in to [vercel.com](https://vercel.com).
2. Navigate to **Brimish Skin Care** project > **Deployments**.
3. Locate the previous passing deployment.
4. Click the three dots `...` > **Promote to Production** (or **Instant Rollback**).
5. Vercel re-points the edge routing immediately (Zero downtime, ~30 seconds).

### 3.2 Supabase Database Restoration
If database corruption or accidental truncation occurs:
1. Open the Supabase Dashboard > **Database** > **Backups**.
2. Select the most recent clean daily backup (or select the specific PITR timestamp).
3. Click **Restore Backup**.
4. Allow Supabase ~10-15 minutes to provision and verify the restored database instance.
5. Execute smoke test:
   ```sql
   SELECT public.get_clinic_health_summary();
   ```

### 3.3 Complete Re-Deployment from Git Repository
If Vercel or Supabase project needs to be recreated from scratch:
1. Clone clean repository:
   ```bash
   git clone https://github.com/00tatheer00/Asthetic-Clinic-System.git
   cd Asthetic-Clinic-System
   ```
2. In the new Supabase SQL Editor, run `supabase/production_init.sql` (applies all tables, RLS, storage buckets, and atomic RPCs).
3. Re-create Doctor and Receptionist staff accounts and map UUIDs in `public.staff`.
4. Connect GitHub repo to Vercel and input the 7 environment variables from `docs/PRODUCTION-ENVIRONMENT.md`.

---

## 4. Business Continuity & Downtime Playbook

### 4.1 Internet Outage at Peshawar Clinic
- **Impact**: Front-desk cannot load dashboard or process online POS sales. Public website remains active globally on Vercel.
- **Staff Action**:
  1. Switch front-desk tablet/laptop to clinic 4G/5G mobile hotspot.
  2. If all cellular and broadband networks fail, front-desk staff utilize the **Physical Paper Receipt Book**:
     - Record patient name, phone number, treatment performed, retail product SKU, and amount paid.
  3. **Reconciliation Protocol**: Once internet connectivity restores, the receptionist enters offline paper receipts into `/dashboard/pos` with the payment method "cash" or "card" and notes referencing the manual receipt serial number.

### 4.2 Resend Transactional Email Outage
- **Impact**: Patients do not receive automated email confirmations.
- **Fail-Safe Behavior**:
  - The application wraps all email dispatches in non-blocking handlers; POS sales, online bookings, and visits continue to succeed without interruption.
  - Failures are recorded in `email_logs`.
- **Staff Action**: Front-desk staff call or WhatsApp patients directly using the phone number visible on the appointment queue.

### 4.3 Supabase Database Temporary Unavailability
- **Impact**: Dashboard is inaccessible; public catalog displays cached or fallback state.
- **Staff Action**: Immediate notification to Technical DevOps Lead. Check [status.supabase.com](https://status.supabase.com).

---

## 5. Emergency Contacts & Responsibility Matrix

| Role | Responsibility | Contact Channel |
| :--- | :--- | :--- |
| **Principal DevOps Lead** | Database restoration, Vercel deployments, DNS cutover | Phone / Emergency Email |
| **Medical Director / Doctor** | Authorize database rollbacks, review clinical data integrity | In-Clinic / Direct Line |
| **Clinic Reception Supervisor** | Manage offline paper receipt switchover and post-outage entry | Front Desk |
