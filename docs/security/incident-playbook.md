# Security incident playbook

Short, actionable steps when automated signals or humans report a problem. Deep runbooks remain in [incident-response.md](./incident-response.md) (kill switches, rollback).

## Severity levels (suggested)

| Level | Examples | Response |
|-------|----------|----------|
| **S1** | Active data breach, mass account takeover, payment fraud | Page on-call; freeze sensitive features; preserve logs |
| **S2** | Spike in failed logins/webhooks; dependency critical CVE in prod | Same-day triage; patch or mitigate |
| **S3** | Single alert, low risk, dev-only | Track in backlog |

## Alert thresholds (indicators)

These are **heuristic** — tune for your traffic. The admin security page compares some counters (e.g. failed logins vs prior 24h).

| Signal | Threshold (starting point) | Action |
|--------|---------------------------|--------|
| Failed login spike | \> 25 in 24h **and** \> 3× prior 24h | Review IPs; enable stricter rate limits; consider WAF |
| Webhook failure spike | Sudden increase in `security_webhook_signature_invalid` or processing failures | Verify secrets; check Stripe Dashboard |
| Payment failure spike | Many `payment_failed` platform events | Stripe Dashboard + support |
| API 5xx spike | Error rate jump vs baseline | Logs → deploy rollback |
| Traffic spike | Bandwidth / request count anomaly in Vercel | Abuse or campaign; rule out DDoS |
| Rate limit spike | Many `security_rate_limit_exceeded` rows | Confirm legitimate traffic; adjust limits |

## Response steps (all levels)

1. **Confirm** — Is the alert real? Check GitHub Security, Snyk, Vercel logs, `/admin/security`.
2. **Contain** — Kill switches ([incident-response.md](./incident-response.md)), block IP at edge if available, rotate **suspected** secrets ([secret-rotation.md](./secret-rotation.md)).
3. **Eradicate** — Patch code or config; merge fix; redeploy.
4. **Recover** — Verify metrics normalized; notify stakeholders if user impact.
5. **Post-incident** — Short note in the weekly [review checklist](./review-checklist.md); optional blameless retro for S1/S2.

## Contacts

- Document internal Slack/email for **security** and **on-call** in your team wiki (not in this repo).

## References

- [alert-routing.md](./alert-routing.md)  
- [github-security.md](./github-security.md)  
- [vercel-alerting.md](./vercel-alerting.md)  
