# Environment and secrets hardening

## Rules

1. **Server-only secrets** must never appear in `NEXT_PUBLIC_*` or client bundles. Includes: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `CRON_SECRET`, `OPENAI_API_KEY`, session signing secrets.
2. **Production vs Preview** — duplicate keys in Vercel; Preview uses Stripe **test** keys and a **non-production** database where possible ([../dev/vercel-env.md](../dev/vercel-env.md)).
3. **Never log secrets** — Stripe event bodies may contain PII; redact in structured logs.
4. **No hardcoded secrets in repo** — use `.env.example` with placeholders only.

## Audit commands (local)

```bash
# From repo root — search for risky patterns (review hits; some may be docs)
rg "sk_live_|sk_test_|whsec_|SUPABASE_SERVICE_ROLE" --glob '!*.md' apps/web
```

## Kill switches (production)

Set in Vercel **Production** only when needed:

| Variable | Effect |
|----------|--------|
| `PLATFORM_DISABLE_PUBLIC_SIGNUP=1` | `POST /api/auth/register` → 503 |
| `PLATFORM_DISABLE_PUBLIC_CONTACT_FORMS=1` | `POST /api/immo/contact` → 503 |
| `PLATFORM_DISABLE_AI_CONTENT_GENERATION=1` | Route handlers that check this (extend as needed) |
| `PLATFORM_DISABLE_SENSITIVE_AUTOMATIONS=1` | Cron/automation brakes (extend as needed) |
| `PLATFORM_MAINTENANCE_MESSAGE` | Optional message for 503 bodies |

## Related

- `apps/web/.env.example`, `apps/web/.env.production.example`  
- [../dev/vercel-env.md](../dev/vercel-env.md) — Vercel environment scopes.  
