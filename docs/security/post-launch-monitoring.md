# Post-launch security monitoring and alerting

Operational guide after go-live: **detect** abnormal activity, **notify** the team, **contain** abuse, **recover** normal operations.

## What is instrumented

| Signal | Source |
|--------|--------|
| Failed logins & attempts | `platform_events`: `auth_login_failure`, `auth_login_attempt` |
| Signup attempts & abuse | `auth_signup_attempt`, `security_repeated_signup_attempt` |
| Messaging spam | `security_repeated_messaging_abuse` (e.g. contact rate limits) |
| Webhooks / payments | `security_webhook_signature_invalid`, `payment_failed`, etc. |
| Rate limits (high-signal) | `security_rate_limit_exceeded` |
| Admin response actions | `security_ip_blocked`, `security_admin_action` (where persisted) |
| Automated alerts | `system_alerts` rows from cron monitor |

Central durable store: **`platform_events`** (searchable from **Admin → Security**). Stdout JSON lines (`lecipm_security`) complement this on Vercel; use a **log drain** for long-term search.

## Detection

1. **Dashboard** — `/admin/security` shows 24h aggregates, failed-login chart, top fingerprints, health snapshot, active IP blocks.
2. **Cron monitor** — `POST /api/cron/security-monitor` with `Authorization: Bearer $CRON_SECRET` (schedule every **15–60 minutes**). It compares rolling windows and may create **`SystemAlert`** rows and **auto-block** IPs after extreme failed-login bursts.
3. **External** — Vercel logs (5xx, traffic), Stripe Dashboard (payments, webhooks), GitHub Security (dependencies, CodeQL).

### Suggested alert routing

- Email/Slack from GitHub and Vercel ([alert-routing.md](./alert-routing.md)).
- Unresolved `SystemAlert` rows surface on the admin security page.

## Response (first hour)

1. **Confirm** — Is the spike real? Check top fingerprints, Stripe, recent deploys.
2. **Contain** — Use **Block IP** on `/admin/security` for abusive fingerprints; use **kill switches** for broad abuse (signup/contact) via Vercel env (see `apps/web/lib/security/kill-switches.ts` and [env-security.md](./env-security.md)).
3. **Sessions** — **Force logout** revokes all `Session` rows for a user (invalidates server-side session; client cookies may still exist until next request).
4. **Communicate** — If users are impacted, use `PLATFORM_MAINTENANCE_MESSAGE` and status page process per your comms policy.

## Recovery

1. Resolve false positives: **unblock** IP (delete via API or DB), **resolve** `SystemAlert` rows when triaged.
2. Re-enable features: unset or flip kill-switch env vars; redeploy.
3. Patch root cause (bug, misconfiguration, leaked secret) in a normal PR.
4. Record follow-ups in [review-checklist.md](./review-checklist.md).

## Automation (built-in)

- **Distributed rate limits** + optional **Redis** (`REDIS_URL`) for shared counters.
- **IP cooldown** after 429 on some routes when `RATE_LIMIT_IP_BLOCK=1`.
- **Admin / auto IP blocks** stored in **`security_ip_blocks`** (checked on auth and rate-limited public routes).
- **Security monitor cron** for threshold alerts and automatic blocks after sustained credential-stuffing-like patterns.

**Traffic / API 5xx spikes** — monitor in Vercel; optional: forward logs to Datadog/Axiom and alert on error rate.

## Related

- [incident-playbook.md](./incident-playbook.md) · [vercel-alerting.md](./vercel-alerting.md) · [security-logs pattern](../../apps/web/lib/security/security-logs.ts)
