# Database backup strategy

This document defines how the **LECIPM / real-estate-platform** stack protects data for production and how it complements provider-managed backups.

## Primary database

The web app (`apps/web`) uses **PostgreSQL** via Prisma (`DATABASE_URL`). Your host may be:

- **Supabase** — managed Postgres with point-in-time recovery (PITR) and automated backups (plan-dependent).
- **AWS RDS / Aurora**, **Google Cloud SQL**, **Neon**, **PlanetScale** (MySQL), etc. — follow the provider’s backup and PITR docs if the project uses a different engine.

**Action:** In the provider console, confirm **automated backups are enabled**, note retention (e.g. 7–35 days), and that **encryption at rest** is on (default on most managed services).

## Backup schedule (recommended)

| Level | Frequency | Purpose |
|--------|-----------|---------|
| **Full logical backup** | **Daily** (off-peak hours) | Portable SQL dump for restore, DR, and staging clones. |
| **Incremental / PITR** | **Continuous or hourly** (if supported) | Managed Postgres often exposes **PITR** or WAL shipping — use for near–zero RPO vs. daily dumps alone. |

If the provider only supports **daily snapshots** (no PITR), treat the daily full dump as the main recovery path for logical consistency.

## Retention (example policy)

| Tier | Retention | Notes |
|------|-----------|--------|
| Daily dumps | **7 days** minimum | Hot recovery window. |
| Weekly | **14–30 days** | Roll back after bad deploy or data bug. |
| Monthly (optional) | **90 days–1 year** | Compliance / long-term archive (if required). |

**Rule:** Align retention with **legal / compliance** requirements and **RPO/RTO** targets.

## Storage location

- Prefer **object storage** (S3, GCS, Azure Blob) in the **same region** as the production DB, with **versioning** and **lifecycle rules** to expire old objects.
- **Never** commit backups to git. Restrict bucket access with IAM; no public ACLs.

## Encryption

- **At rest:** Enable storage encryption (S3 SSE, bucket default encryption, managed DB encryption).
- **In transit:** TLS for `DATABASE_URL` and for `pg_dump` when the client connects over TLS.
- **Secrets:** Store `DATABASE_URL` in a secrets manager; do not log connection strings.

## Application-level backup script

For **self-managed** Postgres or extra dumps alongside the provider:

- Script: `apps/web/scripts/backup-db.ts` (also runnable from repo root via `scripts/backup-db.ts`).
- Requires **`pg_dump`** on the runner (PostgreSQL client tools).
- Output: timestamped `.sql` under `BACKUP_DIR` (default `./backups` relative to `cwd` when run from `apps/web`).

```bash
npm run backup:db --workspace=apps/web
# or from repo root:
npm run backup:db
```

**Cron:** Schedule the same command on a secure host or CI job with secrets injected; never commit credentials.

## Hourly incremental (optional)

- **Managed Postgres:** Prefer **PITR** / **WAL archiving** from the provider instead of rolling your own hourly `pg_dump` unless you have a specific need.
- **Self-managed:** Use **WAL archiving** + **base backups** (e.g. `pg_basebackup`) or provider-specific tooling; document the procedure in your runbooks.

## Verification

- [ ] Automated backups enabled in the cloud console.
- [ ] `npm run backup:db` succeeds in a staging-like environment.
- [ ] Restore drill documented in [RESTORE_PROCEDURE.md](./RESTORE_PROCEDURE.md).
