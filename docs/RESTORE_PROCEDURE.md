# Database restore procedure

**Never restore directly into production without a verified dry run on staging.** Use this checklist to recover from backup safely.

## 1. Preconditions

- Identify the **backup artifact** (SQL dump or provider snapshot).
- Confirm **who approved** the restore and **why** (incident, bad migration, bad data).
- **Freeze writes** to production if you are not doing a full cutover (coordinate with the team).

## 2. Restore to staging first (required)

1. **Provision or reset** a **staging** database (empty or disposable).
2. **Apply schema** to match production (same migration history):

   ```bash
   cd apps/web
   npx prisma migrate deploy
   ```

3. **Restore data** depending on artifact type:

   - **Plain SQL dump** (`*.sql` from `backup:db`):

     ```bash
     psql "$DATABASE_URL_STAGING" -f /path/to/db-backup-....sql
     ```

     Or pipe: `psql "$DATABASE_URL_STAGING" < backup.sql`

   - **Provider snapshot / PITR:** Use the provider’s **restore to new instance** flow, then point staging `DATABASE_URL` at the new instance.

4. **Run migrations** (if needed) after restore — only if the dump predates a migration; prefer restoring **after** migrations are aligned.

## 3. Environment precautions

- Use **staging-only** credentials (`DATABASE_URL`, `STRIPE_*`, `CRON_SECRET`, etc.).
- **Do not** point staging tools at production payment or email APIs without explicit approval.
- Rotate any secrets that were pasted into a shell history or shared channel.

## 4. Data verification checklist (staging)

After restore, verify **non-destructive** checks:

- [ ] App boots: `GET /api/health` and `GET /api/ready` return **200** with DB connected on ready.
- [ ] **Tenant isolation:** spot-check a few tenants — users only see their workspace data.
- [ ] **Finance:** invoice/payment counts and totals match expectations for a known date range (use internal reports or scripts).
- [ ] **Auth:** login works for a test user; session cookies behave as expected.
- [ ] **Documents / uploads:** metadata exists; blob storage may need separate restore if blobs are external.

**If anything fails:** do not promote to production.

## 5. Production restore (only after staging sign-off)

1. **Maintenance window** (if required).
2. **Snapshot current state** (provider snapshot + optional logical dump) so you can roll forward again.
3. Repeat **restore steps** against the **production** database URL (or new instance + DNS cutover).
4. **Redeploy** the same app version that matches the schema, or run `prisma migrate deploy` as per your release process.
5. **Smoke test** critical flows (login, tenant switch, one finance read, one document read).

## 6. Code rollback vs database rollback

- **Code rollback** (previous deployment): reverses **application** behavior; does **not** undo data changes.
- **Database rollback** (restore from backup): reverts **data** to a point in time; may **lose** newer legitimate data.

Use **restore** when data is corrupted or wrong; use **code rollback** when the bug is only in the app layer.

## 7. Post-restore

- Document incident in [INCIDENT_PLAYBOOKS.md](./INCIDENT_PLAYBOOKS.md) (root cause, timeline, follow-ups).
- Re-enable normal backups and monitoring.
