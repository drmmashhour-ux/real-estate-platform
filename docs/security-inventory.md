# Security inventory — BNHub + LECIPM

High-level map of security-relevant surfaces. Use with `docs/security-checklist.md` and `docs/incident-response.md`.

## Entry points

| Surface | Location | Auth model | Notes |
|--------|----------|------------|--------|
| Main web app | `apps/web` (Next.js App Router) | Session cookies, Prisma `User` | Primary BNHub + LECIPM UI and `/api/*` |
| Admin app | `apps/admin` | Separate Next app; align with platform admin policy | Smaller surface; ensure parity with web admin APIs if duplicated |
| Mobile | `apps/mobile` (Expo) | Supabase client + `EXPO_PUBLIC_*`; API calls to `apps/web` | Tokens in **SecureStore** (`apps/mobile/src/lib/supabase.ts`) |
| Microservices | `services/*` | JWT / service-specific | Express (or similar); not all wired in production |
| Supabase Edge | `supabase/functions/*` | `BNHUB_GROWTH_CRON_SECRET` → internal Next routes | Calls `LECIPM_API_BASE_URL` + shared secret header |
| CI/CD | `.github/workflows/*` | `GITHUB_TOKEN`, optional Vercel secrets | `permissions: contents: read` on workflows |

## Privileged actions (non-exhaustive)

- **Platform admin**: `isPlatformAdmin` → Prisma `User.role === "ADMIN"` (`apps/web/lib/auth/is-platform-admin.ts`). Must never trust client-only flags.
- **Internal automation**: `verifyBnhubGrowthAutomationRequest` — `x-bnhub-growth-secret` or legacy `x-cron-secret`, **timing-safe** compare (`apps/web/lib/server/bnhub-growth-internal-auth.ts`).
- **Payments**: Stripe webhooks — `constructEvent` + `STRIPE_WEBHOOK_SECRET` / identity webhook secret (`apps/web/app/api/stripe/webhook/route.ts`, `.../webhooks/stripe/identity/route.ts`).
- **Uploads**: FSBO images — MIME allowlist, max size (`apps/web/lib/fsbo/media-config.ts`, `upload-fsbo-listing-image.ts`); service role **server-only**.

## Sensitive data

- **Database**: PostgreSQL + Prisma schema in `apps/web/prisma` (users, payments, trust, fraud, etc.).
- **Supabase Storage**: optional FSBO bucket; URLs when configured.
- **Secrets**: Stripe, Resend, DB URL, `SUPABASE_SERVICE_ROLE_KEY`, cron/automation secrets — **never** `NEXT_PUBLIC_*` except anon URL/key.

## Third-party integrations

- Stripe (payments, Identity webhooks)
- Supabase (auth client + optional storage/admin server client)
- Resend (email)
- Maps / analytics as configured per env

## Supabase RLS

**This repository does not ship SQL migrations under `supabase/migrations` for RLS.** Row Level Security and table policies are expected to be defined in the **Supabase project** (dashboard or linked migrations). Treat as **manual audit required**:

- Enable RLS on all user-owned and financial tables exposed to the anon/authenticated roles.
- Avoid broad `USING (true)` policies on sensitive tables.
- Service role bypasses RLS — use only in trusted server code (`apps/web` server routes, Edge functions with secrets).

Document your live policies in Supabase and mirror summaries here when stable.

## Current risks (rolling)

| Area | Risk | Typical mitigation |
|------|------|-------------------|
| In-memory rate limits | Lost on cold start / not shared across instances | Redis or edge rate limit at scale (`apps/web/lib/rate-limit.ts`) |
| Monorepo surface | Many routes; not all audited in one pass | Route reviews per domain; schema validation on inputs |
| Admin app | May lag web hardening | Reuse same API contracts; no duplicate secret stores |
| CSP | Not set globally (can break Next inline) | Phased CSP / nonces; document in checklist |
