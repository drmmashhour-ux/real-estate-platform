# Staging environment

Use a dedicated staging deployment that mirrors production configuration but uses separate database, Stripe test keys, and email sink.

## Checklist

- Point `DATABASE_URL` at a staging Postgres instance; run migrations from CI or a protected job.
- Set `NEXT_PUBLIC_DEMO_MODE` and related demo flags per `config/feature-flags.ts` and platform docs.
- Restrict admin and internal routes (`/admin`, `/internal/training`) to allowlisted IPs or SSO where applicable.
- Enable structured logging (`lib/logging`) and error reporting for staging only or for all non-prod.

## Secrets

Never reuse production API keys. Use Stripe test mode, Resend sandbox or suppressed recipients, and a distinct Supabase project if applicable.
