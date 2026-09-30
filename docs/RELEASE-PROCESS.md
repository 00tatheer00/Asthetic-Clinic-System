# Brimish Skin Care Clinic — Production Release Process & Migration Safety Standards

**System**: Brimish Skin Care Clinic Production Platform  
**Target Environment**: Next.js 16 | Supabase PostgreSQL 15 | Vercel  
**Version**: 1.0.0-production  
**Date**: October 2026  
**Auditor**: Principal DevOps Lead & Database Architect  

---

## 1. Production Release Lifecycle

All future enhancements, bug fixes, or schema alterations must follow this systematic 7-stage release pipeline:

```
[ Feature / Bugfix Branch ]
            │
            ▼
[ Stage 1: Local Code Review & Type Checking ]
    ├── npx tsc --noEmit (0 TypeScript errors required)
    └── npm run lint
            │
            ▼
[ Stage 2: Database Migration Review (if SQL changes) ]
    ├── Backwards compatibility verification
    ├── Non-destructive schema evolution
    └── Safe fallback / rollback SQL prepared
            │
            ▼
[ Stage 3: Local Production Build Validation ]
    └── npm run build (Turbopack exit code 0)
            │
            ▼
[ Stage 4: Pull Request & Peer Sign-Off ]
    └── Merge to 'main' branch on GitHub
            │
            ▼
[ Stage 5: Apply Migrations to Live Supabase ]
    └── Run new numbered migration (e.g. 007_...) in Supabase SQL Editor
            │
            ▼
[ Stage 6: Automatic Vercel Edge Deployment ]
    └── Triggered by push to 'main'; deploys in ~20 seconds
            │
            ▼
[ Stage 7: Post-Deployment Smoke Verification ]
    ├── Public catalog & booking check
    ├── Staff dashboard & POS test
    └── Monitor error logs in Vercel Log Drains
```

---

## 2. Database Migration Safety Rules (Zero-Downtime Architecture)

To ensure clinical operations at Brimish Clinic are never interrupted during releases, all future database migrations must adhere to the following rules:

### Rule 1: Never Drop or Rename Existing Columns Directly
- Dropping or renaming a column while active server actions are running will cause immediate runtime query crashes.
- **Safe Expand/Contract Strategy**:
  1. **Phase 1 (Expand)**: Add the new column as `NULLABLE`.
  2. **Phase 2 (Dual-write)**: Update Next.js code to write to both columns and read from the new one. Deploy code.
  3. **Phase 3 (Backfill)**: Backfill historical rows from the old column to the new column.
  4. **Phase 4 (Contract)**: Remove old column references from code, deploy, and finally drop the old column in a subsequent release.

### Rule 2: Explicit Search Path on All Database Functions
- Any new stored procedure or trigger declared as `SECURITY DEFINER` must contain:
  ```sql
  SET search_path = public, pg_temp;
  ```
- This prevents schema injection vulnerabilities.

### Rule 3: Always Provide Forward & Rollback SQL
- Every migration must be named sequentially: `supabase/migrations/XXX_descriptive_name.sql`.
- Include matching rollback instructions in the migration header.

### Rule 4: Create Indexes Concurrently in High-Traffic Tables
- On high-volume tables (`appointments`, `invoices`, `inventory_movements`), add indexes without locking table writes:
  ```sql
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_name ON table_name (column_name);
  ```

### Rule 5: Never Rely on Manual Ad-Hoc Table Editor Changes
- Never modify production table columns directly via the Supabase UI table editor without committing an identical SQL migration file to Git. All infrastructure must remain reproducible from code.

---

## 3. Rollback Playbook

If a critical flaw is detected post-deployment:
1. **Application Code Rollback**:
   - In Vercel > Deployments > Click previous deployment > **Promote to Production**.
2. **Database Rollback**:
   - If a migration caused data anomalies, execute the corresponding rollback SQL script, or restore the pre-deployment logical snapshot taken prior to release.
3. **Post-Mortem**:
   - Document root cause in `docs/post-mortems/` and establish preventive automated regression tests.
