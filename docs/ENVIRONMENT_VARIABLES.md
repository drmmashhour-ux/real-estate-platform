# Environment Variables

All env vars for `apps/web`. Set in Vercel project settings or `.env` for local development.

## Database

| Variable | Required | When | Default | Description |
|---|---|---|---|---|
| `DATABASE_URL` | **Yes** (runtime) | Both | Placeholder at build (see note) | PostgreSQL connection string. Build-time placeholder (`postgresql://placeholder:...`) allows `prisma generate` in CI. Runtime guard in `lib/db/prisma.ts` throws if placeholder reaches PrismaClient. |
| `DIRECT_URL` | Optional | Runtime | — | Direct DB connection (bypasses pooler). Used by Prisma for migrations. |

## Auth (Supabase)

| Variable | Required | When | Default | Description |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Runtime | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Runtime | — | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Runtime | — | Supabase service role key (server-side only) |

## Payments (Stripe)

| Variable | Required | When | Default | Description |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | Optional | Runtime | — | Stripe secret key. Use `sk_test_` for preview. **Never** `sk_live_` without explicit approval. |
| `STRIPE_WEBHOOK_SECRET` | Optional | Runtime | — | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Runtime | — | Stripe publishable key (client-side) |

## Build / Infrastructure

| Variable | Required | When | Default | Description |
|---|---|---|---|---|
| `NODE_OPTIONS` | **Yes** (build) | Build | — | Set to `--max-old-space-size=16384` for large schema builds |
| `CI` | Auto | Build | — | Set automatically by CI environments |
| `VERCEL` | Auto | Build | — | Set automatically by Vercel |
| `VERCEL_ENV` | Auto | Both | — | `production`, `preview`, or `development` |
| `NEXT_DISABLE_WEBPACK_CACHE` | Optional | Build | — | Set to `1` to disable webpack persistent cache |
| `APP_NAME` | **Yes** | Both | `lecipm` | Platform identifier |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Both | — | Public-facing URL of the deployed app |

## Feature Flags

All feature flags default to their safe value. Set to `1`/`true` to enable or `0`/`false` to disable.

Defined in `src/lib/env/features.ts`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `FEATURE_HOMES` | Optional | `true` (ON) | Real estate marketplace hub |
| `FEATURE_BNHUB` | Optional | `true` (ON) | Short-term stays hub |
| `FEATURE_INVEST` | Optional | `false` (OFF) | Investor tools (beta) |
| `FEATURE_FORMS` | Optional | `false` (OFF) | Legal forms (beta) |
| `FEATURE_IMMOCONTACT` | Optional | `true` (ON) | Communication hub |
| `FEATURE_DR_BRAIN` | Optional | `false` (OFF) | Admin intelligence (internal) |
| `FEATURE_COMPLIANCE` | Optional | `true` (ON) | Compliance guardrails |
| `FEATURE_DESIGN_SYSTEM` | Optional | `false` (OFF) | Design system dev tools (internal) |

## Safety

| Variable | Required | Default | Description |
|---|---|---|---|
| `FEATURE_COMPLIANCE_HARD_LOCK` | Optional | `false` (OFF) | When ON, **all** regulated actions are blocked. Use during initial deployment before compliance review. |

## Notes

- `DATABASE_URL` has a build-time placeholder fallback in the `postinstall` script: `DATABASE_URL=${DATABASE_URL:-postgresql://placeholder:placeholder@localhost:5432/placeholder} prisma generate`. This only runs code generation — no database connection is made. The runtime guard in `lib/db/prisma.ts` prevents the placeholder from ever reaching PrismaClient.
- Feature flags use `envFlag()` which accepts `1`/`true` and `0`/`false` string values.
- `FEATURE_CORE` is hardcoded to `true` and cannot be disabled.
