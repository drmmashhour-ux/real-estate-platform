# LECIPM Safe Deployment System v1

Production target: **Vercel** + **Next.js** + **Prisma** + **Supabase** + **Stripe**.

## Pre-deploy gate

Run locally or in CI before merging to production:

```bash
pnpm --filter @lecipm/web run predeploy:check
```

Checks (see `apps/web/scripts/predeploy-check.ts`):

| Check | Notes |
|--------|--------|
| TypeScript | `pnpm run typecheck` (`tsc --noEmit` + higher heap). **Not skippable** on CI/Vercel (`CI` / `VERCEL`). |
| Prisma | `prisma validate` |
| Migrations | Optional: `LECIPM_ENFORCE_DB_MIGRATIONS=1` runs `prisma migrate status` (fails if pending) |
| API routes | Every `app/api/**/route.ts` must export at least one HTTP handler |
| Env | `DATABASE_URL` required |
| Stripe | **`STRIPE_SECRET_KEY`** + **`STRIPE_WEBHOOK_SECRET`** (`whsec_…`) — always validated (no bypass) |
| Build | `pnpm run build` — **Not skippable** on CI/Vercel. Local only: `LECIPM_SKIP_BUILD=1` (unsafe for prod) |
| Local only | `LECIPM_SKIP_TYPECHECK=1` — same rules as build skip |

## PR review assistant (risk heuristics)

Local / CI (requires git):

- Module: `apps/web/modules/pr-review/`
- HTTP (protected on deployed envs): `GET /api/dev/pr-review?base=origin/main&head=HEAD` with header `x-pr-review-secret: $PR_REVIEW_SECRET` when `PR_REVIEW_SECRET` is set.

Returns JSON: `riskLevel`, `criticalChanges`, `warnings`, `recommendation` (`SAFE` | `REVIEW_REQUIRED` | `BLOCK`), plus `summaryMarkdown`.

## Release readiness (remote)

- `GET /api/dev/release-readiness?origin=https://your-domain.com` — same auth as PR review; returns `go`, `blocked`, `reasons`, `checks`.
- Programmatic: `evaluateRemoteReleaseReadiness()` in `apps/web/modules/deployment/release-blocker.service.ts`.

**Never deploy** if predeploy fails.

## Health endpoints

| Route | Purpose |
|-------|---------|
| `GET /api/health` | Liveness + Stripe config snapshot; cheap probes |
| `GET /api/health?deep=1` | DB ping + Stripe — use post-deploy smoke tests |
| `GET /api/ready` | Full readiness (DB, i18n, market) |

## Post-deploy smoke tests

```bash
POSTDEPLOY_BASE_URL=https://your-domain.com pnpm --filter @lecipm/web run postdeploy:test
```

Probes include `/`, `/listings`, `/api/health?deep=1`, `/api/ready`, a protected broker route (401/403), a **safe** `POST /api/stripe/checkout` with an empty body (must not return 5xx), and Stripe readiness from `/api/health`. Set `POSTDEPLOY_TIMEOUT_MS` to tune fetch timeouts.

## Rollback (Vercel)

1. **Instant:** Vercel Dashboard → Project → Deployments → select previous **Production** deployment → **Promote to Production** (or **Rollback**).
2. **Flags:** Toggle risky behavior off in `apps/web/config/feature-flags.ts` (env-backed) — no redeploy required for many switches.
3. **Git:** Revert the merge commit on `main` and push; Vercel builds the previous code state.

## Feature flags

Risky areas (AI, pricing, new flows) must use **centralized flags** in `config/feature-flags.ts`. Prefer env vars so ops can disable without code.

Deployment-oriented aliases (see `deploymentSafetyFlags` in that file): `FEATURE_ENABLE_NEW_PRICING_ENGINE`, `FEATURE_ENABLE_AI_CONTRACTS_V2`, `FEATURE_ENABLE_AUTOPILOT_ACTIONS`, `FEATURE_ENABLE_EXPERIMENTAL_FEATURES` — these OR existing engine flags; set explicitly in Vercel during incidents for clarity.

## Rollback helpers (code)

- `getRollbackPlaybook()` — `apps/web/modules/deployment/rollback.service.ts` (Vercel steps + env keys to disable).

## Monitoring

- **Sentry:** `SENTRY_DSN` — configured in `sentry.server.config.ts` / `instrumentation*.ts`.
- **Alerts module:** `apps/web/modules/alerts/alert.service.ts` — optional `ALERT_WEBHOOK_URL` for POST JSON on warning/critical events.
- **Deployment log:** `apps/web/modules/deployment/deployment-log.service.ts` — call `logDeploymentEvent()` from CI after promote (optional).

## Release blockers

Block production promote if:

- `predeploy:check` fails
- `postdeploy:test` fails
- `/api/ready` returns non-200 on production URL
- Stripe webhook or payment smoke tests fail in staging

## Related

- [infrastructure/README.md](./infrastructure/README.md) — Supabase, env, Vercel, RLS, QA
- [release-checklist.md](./release-checklist.md)
