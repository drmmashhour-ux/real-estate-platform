# Incident response — LECIPM (high level)

## Severity

1. **SEV1** — payments down, data breach suspected, total outage  
2. **SEV2** — partial outage, elevated errors, webhook failures  
3. **SEV3** — single feature degraded  

## Immediate actions (SEV1/2)

1. **Page / status** — communicate internally; use Vercel / Stripe / Supabase status pages.  
2. **Stabilize** — consider Vercel rollback ([rollback.md](./rollback.md)).  
3. **Payments** — verify Stripe Dashboard webhooks + `/api/stripe/webhook` logs; **do not** disable signature verification.  
4. **Secrets** — if leaked, rotate `STRIPE_*`, `SUPABASE_SERVICE_ROLE_KEY`, DB credentials in order of exposure.  

## Evidence

- Vercel function logs  
- Sentry (`SENTRY_DSN`)  
- Structured logs (`logInfo` / `logError` with redaction)  
- `PlatformEvent` / audit tables where enabled  

## Post-incident

- Root cause note (internal)  
- Track follow-ups: code fix, monitoring alert, runbook update  

## Contacts

- Configure `ALERT_WEBHOOK_URL` for `alert.service` fan-out (Slack/PagerDuty-compatible JSON).
