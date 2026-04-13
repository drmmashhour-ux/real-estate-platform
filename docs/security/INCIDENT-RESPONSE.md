# Security incident response

Combines **platform security** steps with **deployment** rollback. **Alert thresholds & escalation:** [incident-playbook.md](./incident-playbook.md). Deployment specifics: [../dev/incident-response.md](../dev/incident-response.md), [../dev/vercel-rollback.md](../dev/vercel-rollback.md).

## Triage (first 5 minutes)

1. **Confirm impact** — Which users, data, or payments are affected?
2. **Logs** — Vercel runtime logs for production deployment; filter 5xx and `lecipm_security` JSON lines.
3. **Scope** — Data breach vs outage vs abuse vs misconfiguration.

## Immediate containment

1. **Rollback** production if a bad deploy is suspected ([../dev/vercel-rollback.md](../dev/vercel-rollback.md)).
2. **Kill switches** — Set in Vercel Production ([env-security.md](./env-security.md)):
   - Disable signup and/or public contact forms during abuse waves.
   - Disable sensitive automations if cron-driven damage is possible.
3. **Rotate secrets** if leakage is suspected (Stripe, DB password, `CRON_SECRET`).

## Recovery

1. Validate `/api/health` and `/api/ready` on production.
2. Run [post-deploy checklist](../dev/post-deploy-checklist.md).
3. Hotfix on `hotfix/*` → Preview QA → merge `main`.

## Who checks what

| Role | Action |
|------|--------|
| **On-call engineer** | Logs, rollback, kill switches |
| **Owner / product** | External comms, regulatory if PII/financial |
| **Stripe** | Dispute/refund flows if payment anomaly |

## Related

- [release-security-checklist.md](./release-security-checklist.md)  
