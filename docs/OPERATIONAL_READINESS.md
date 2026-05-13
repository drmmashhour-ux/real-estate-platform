# Operational Readiness

Status: future-deployment preparation only. Nothing was deployed.

## Rollback strategy

- Keep production deployment disabled until readiness checks pass.
- Roll back by redeploying the last known-good Vercel build and restoring the previous env snapshot.
- Do not run destructive Prisma commands in rollback. Use `db:migrate:deploy` only from an approved release plan.
- Keep Stripe live mode disabled until payment runbooks and webhook verification pass.
- If Syria mode causes unexpected behavior, disable `ENABLE_SYRIA_MARKET`, manual booking overrides, and contact-first flags before redeploy.

## Incident checklist

- Confirm incident scope: preview, staging, production, Syria profile, BNHub, admin, or API-only.
- Capture `/api/health`, `/api/ready`, relevant request IDs, and structured log events.
- Check middleware fallback logs for `middleware_fallback`.
- Check DB status and Prisma error classification before restarting services.
- Disable risky launch flags before changing code.
- Preserve logs before cache clear or redeploy.

## Preview verification checklist

- `pnpm --filter @lecipm/web run test` passes for safety tests.
- `/api/health` and `/api/ready` return expected preview statuses.
- Demo mode write blocks are visible in logs.
- Compliance/investment routes fail closed when disabled.
- Arabic locale only renders when launch flags allow it.
- BNHub and Syria preview paths stay isolated from live payments.

## Runtime monitoring checklist

- Watch structured events: `middleware_fallback`, `api_listings_search_failed`, `api_listings_create_failed`, `api_fsbo_listing_upload_failed`, `resolve_launch_flags_db_fallback`.
- Monitor DB connection errors and retry summaries.
- Monitor slow API latency and critical counters.
- Alert on internal cron unauthorized spikes.
- Alert on raw card payload blocking events.

## Feature release checklist

- Confirm feature flag key exists in centralized config.
- Confirm DB override key maps to the launch flag when runtime-toggled.
- Add fail-closed behavior for compliance-sensitive features.
- Add a safe disabled state and observable degraded behavior.
- Add a lightweight test for the guard or route policy.

## Env verification checklist

- Required: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` for production readiness.
- Strict launch: set `FAIL_LAUNCH_ON_MISSING_ENV=1` or `STRICT_LAUNCH_ENV=1` only after preview validates env completeness.
- Confirm no live Stripe key is used in preview.
- Confirm optional env absence degrades safely and visibly.
- Confirm DB URL normalization does not expose credentials in logs.

## Deployment verification checklist

- No deployment from this hardening branch until review.
- Build and typecheck on branch before release candidate.
- Run Prisma validate/generate without connecting to production.
- Verify route manifest, locale flags, compliance guards, middleware behavior, and internal API protection.
- Verify rollback plan and env snapshot before any production promotion.
