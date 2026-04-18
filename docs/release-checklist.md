# LECIPM Production Launch — release blocking checklist

**Rule:** Do not ship if any required item fails. Mark each `[ ]` → `[x]` with owner + date.

## Automated gates (run before tagging)

- [ ] `pnpm --filter @lecipm/web run validate:lecipm-system` — LECIPM Full System Validation v1 (tunnels + `tests/reports/final-report.json`)
- [ ] `pnpm --filter @lecipm/web run simulate:users` — Real User Simulation v1 (friction / drop-offs + `tests/reports/ux-simulation-report.json`; heuristic, not a substitute for user research)
- [ ] `pnpm --filter @lecipm/web run predeploy:check` — full gate (TS, Prisma, API route exports, env, Stripe) — see [deployment.md](./deployment.md)
- [ ] `pnpm --filter @lecipm/web run ci:integrity` (or full `ci:all` on release branch)
- [ ] `pnpm --filter @lecipm/web run ci:lint`
- [ ] `pnpm --filter @lecipm/web run ci:typecheck` (may require `NODE_OPTIONS=--max-old-space-size=8192`)
- [ ] `pnpm --filter @lecipm/web run ci:build`

## Security & configuration

- [ ] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` set on Vercel (live keys for production); **never** `NEXT_PUBLIC_*` for secrets
- [ ] Stripe webhook endpoint in Dashboard points to `/api/stripe/webhook` and signing secret matches `STRIPE_WEBHOOK_SECRET`
- [ ] `SENTRY_DSN` set for production (error tracking; optional but recommended)
- [ ] Supabase: confirm backup / PITR per project policy; app uses Prisma (RLS templates in `apps/web/sql/supabase/rls-template.sql` if exposing PostgREST)

## Functional QA (staging)

- [ ] **Booking flow (BNHub):** search → book → Stripe Checkout → **confirmed only after webhook** (not success URL alone)
- [ ] **Payment:** test card succeeds; webhook received; no double-charge on replay (idempotency inbox)
- [ ] **ROI tool:** `/api/roi/*` or UI loads; rate limit does not block normal use
- [ ] **Pricing:** calculator / subscription paths behave; no client-trusted amounts for bookings
- [ ] **Broker flow:** login, CRM or dashboard critical path
- [ ] **Host flow:** listing / dashboard smoke
- [ ] **Admin access:** admin routes reject non-admin; audit logs visible where expected
- [ ] **Mobile app:** broker or guest critical path (session / API)

## Observability

- [ ] Security / auth events appear in logs (`lecipm_security` JSON lines)
- [ ] Stripe webhook logs show `event received` + no signature errors
- [ ] Sentry receives a test error in staging (optional)

## Docs

- [rollback.md](./rollback.md) — Vercel / git / flags  
- [incident-response.md](./incident-response.md) — severity & rotation  
- [rls-policies.md](./rls-policies.md) — Supabase RLS expectations  
- [deployment.md](./deployment.md) — predeploy / postdeploy  

## Rollback

- [ ] Previous Vercel deployment known-good; database migrations are backward-compatible or rollback plan documented

---

**Sign-off**

| Role | Name | Date |
|------|------|------|
| Owner | | |
