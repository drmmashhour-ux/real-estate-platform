# Deployment and rollback

This document describes a **controlled** deploy flow for `apps/web` (Next.js + Prisma).

## 1. Build

```bash
cd apps/web
npm ci
npm run build
```

Fix any **TypeScript** or **lint** errors before merging to the release branch.

## 2. Database migrations

Apply migrations **before** or **as part of** the deploy (same order every time):

```bash
cd apps/web
npx prisma migrate deploy
```

- **Never** use `prisma migrate dev` in production.
- **Backup** before destructive migrations (see [BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md)).

## 3. Seed (optional)

Seeding is **not** automatic in production unless explicitly enabled:

```bash
npx prisma db seed
```

Use only in **controlled** environments (staging or first-time bootstrap).

## 4. Environment verification

- [ ] `NEXT_PUBLIC_ENV=production` (or staging).
- [ ] `DATABASE_URL` points to the intended database.
- [ ] Secrets present (auth, Stripe, cron, storage).

## 5. Start / platform deploy

- **Vercel / similar:** deploy the built artifact; ensure **build command** and **output** match the repo.
- **Node:** `npm run start` after `next build`.

## 6. Post-deploy checks

1. `GET /api/health` — **200**, `status: ok`.
2. `GET /api/ready` — **200**, DB `connected` (or **503** if DB down — investigate).
3. Smoke test **login** and one **tenant-scoped** read.

---

## Rollback strategy

### Application rollback

- **Revert** the deployment to the **previous Git commit / image** that was known good.
- Redeploy; **no DB change** unless the bad release ran migrations.

### Database rollback

- **Code rollback ≠ DB rollback.** Migrations may have applied forward-only changes.
- If data is wrong **after** a bad migration, options are:
  1. **Forward fix** — new migration + data repair script.
  2. **Restore from backup** — follow [RESTORE_PROCEDURE.md](./RESTORE_PROCEDURE.md).

### When to restore vs rollback

| Situation | Action |
|-----------|--------|
| Bug in **application code** only | Roll back **deployment**. |
| Bad **data** or failed migration | **Restore** DB or run fix scripts; coordinate with ops. |

---

## Related

- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- [POST_LAUNCH_MONITORING.md](./POST_LAUNCH_MONITORING.md)
