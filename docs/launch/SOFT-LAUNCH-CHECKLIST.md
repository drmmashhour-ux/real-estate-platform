# Soft-launch checklist

1. **Env**: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`; optional strict mode `STRICT_LAUNCH_ENV=1` or `FAIL_LAUNCH_ON_MISSING_ENV=1` (see `lib/env/production.ts`).
2. **Migrate**: `cd apps/web && pnpm exec prisma migrate deploy` (or `migrate dev` locally).
3. **Health**: `GET /api/health` (liveness), `GET /api/ready` (DB + i18n bundles + market).
4. **Locales**: EN/FR/AR switcher + RTL smoke on Arabic.
5. **Syria**: Market settings + contact-first copy; no instant-payment claims in UI.
6. **Bookings**: AWAITING_HOST_APPROVAL + manual payment counters on `/admin/launch-ops`.
7. **AI**: Autopilot approvals queue; `ENABLE_AI_CONTENT_PUBLISH` for generated content publish.
8. **Rollback**: Feature flags, market disable, autopilot kill switches (`operational-controls` / env as applicable).
