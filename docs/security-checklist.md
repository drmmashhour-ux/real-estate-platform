# Production security checklist

Use before major releases and after incidents.

## Identity & access

- [ ] Admin actions check **`isPlatformAdmin`** (or equivalent) on the **server** for every sensitive route.
- [ ] No reliance on client-only “role” or JWT claims without DB verification where stakes are high.
- [ ] Session invalidation / logout clears cookies per app policy.
- [ ] Password reset and 2FA flows rate-limited (`/api/auth/*`).

## Payments & webhooks

- [ ] `STRIPE_WEBHOOK_SECRET` set; webhook uses **`constructEvent`** only.
- [ ] No feature unlock from `success_url` alone — **webhook or server-confirmed state**.
- [ ] Identity webhook uses `whsec_*` secret; invalid signature → 400.

## Automation & internal APIs

- [ ] `BNHUB_GROWTH_CRON_SECRET` set in Vercel + Supabase Edge.
- [ ] Callers use **`x-bnhub-growth-secret`** (legacy **`x-cron-secret`** still supported with same value).

## Uploads

- [ ] FSBO (and other) uploads enforce **MIME allowlist** and **max size** (`lib/fsbo/media-config.ts`).
- [ ] Sensitive docs use **private** buckets + signed URLs where applicable.

## Headers & transport

- [ ] **HSTS** enabled in production builds (`apps/web/next.config.ts`).
- [ ] **CSP**: plan phased rollout if required (full CSP can break Next.js inline scripts).

## Dependencies & CI

- [ ] `pnpm audit` reviewed (CI runs informational high-severity audit).
- [ ] Workflow **`permissions: contents: read`** unless a job needs more.

## Supabase

- [ ] RLS policies reviewed in Supabase project for all tables touched by anon/authenticated clients.
- [ ] Service role keys not exposed to clients.

## Mobile

- [ ] Only **`EXPO_PUBLIC_*`** for non-secret config; tokens in **SecureStore**.
- [ ] Deep links do not bypass auth for privileged screens.
