# Vercel alerting and logging

Operational guide for **runtime visibility** on Vercel-hosted Next.js (`apps/web`).

## Runtime logs

- **Path:** Vercel **Project → Logs** (or **Deployments → deployment → Functions**).
- **What you see:** Request paths, status codes, function duration, cold starts, `console` output (including structured JSON lines such as `lecipm_security` from `logSecurityEvent`).
- **Retention:** Time-bounded on hobby/pro plans; use a **log drain** for long-term audit (see [vercel-logs.md](../dev/vercel-logs.md) if referenced in-repo).

## Activity / audit

- **Team audit log:** Vercel **Team → Settings → Audit Log** — membership, project settings, env var changes (scope depends on plan).
- **GitHub:** Treat production deploys and env changes as part of change control; correlate with Git commits.

## Anomaly and failure alerts

Configure in **Team → Settings → Notifications**:

- Failed production deployments.
- Usage spikes (bandwidth, function invocations) if available on your plan.
- Billing alerts (unexpected charge growth can indicate abuse).

**Runtime “anomaly detection”** is not a full IDS — pair Vercel alerts with application metrics (failed logins, webhooks) on `/admin/security` and external APM if connected.

## Route-specific monitoring

- Use **Vercel Speed Insights / Web Analytics** for front-end performance (not security-specific).
- For API abuse, rely on **rate limit logs** (`rate_limit_exceeded`), **admin security** aggregates, and WAF / edge rules if you add them in front of Vercel.

## After each deploy — quick check

1. Open the latest **production deployment** — confirm **Ready** and no build errors.
2. Spot-check critical routes: health/ready, login, Stripe webhook path (with test events in staging).
3. **Logs:** filter `500` and `lecipm_security` in the last 15 minutes.

## Which errors should trigger investigation

| Signal | Action |
|--------|--------|
| Sudden spike in **5xx** on `/api/*` | Check deployment, database, upstream APIs; roll back if needed ([vercel-rollback.md](../dev/vercel-rollback.md)). |
| Repeated **`webhook_signature_invalid`** / Stripe 400 | Verify `STRIPE_WEBHOOK_SECRET` matches Dashboard / `stripe listen`. |
| Spike in **`auth_login_failure`** | Possible credential stuffing — consider temporary IP blocks, CAPTCHA, or WAF. |
| **Edge / function timeout** bursts | Investigate slow DB or external calls. |

## Searching logs quickly

- Filter by **status code** (e.g. `500`, `429`).
- Search for **`lecipm_security`** JSON lines for structured security events.
- Search by **route** or **deployment ID** when correlating with a release.

## Dashboard text (optional)

Set **`SECURITY_LAST_SCAN_SUMMARY`** in Vercel env to show a short note on `/admin/security` (e.g. last Snyk/ZAP run date).
