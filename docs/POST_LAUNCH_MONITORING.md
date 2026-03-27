# Post-launch monitoring (first 24–72 hours)

After production cutover, treat the first **24–72 hours** as **active monitoring** — not a normal steady state.

## Focus areas

1. **Logs** — Watch for spikes in `error` and `security` JSON lines; correlate with deploy times.
2. **Error rates** — 5xx rate and latency per route (especially `/api/auth`, `/api/finance`, `/api/tenants`).
3. **Onboarding** — Signup, login, email verification, first tenant/workspace setup.
4. **Tenant isolation** — Spot-check that users only see their tenant’s data.
5. **Finance** — Webhook success, duplicate charges absent, invoices/payments consistent.

## Health checks

- Poll `/api/health` every minute (liveness).
- Poll `/api/ready` every 1–5 minutes (DB readiness).

## Rollback readiness

- Keep **one-click rollback** to the previous deployment available.
- **Do not** restore the database unless data is wrong — prefer **code rollback** for app bugs ([DEPLOYMENT.md](./DEPLOYMENT.md)).

## Incident response

If something breaks:

1. Follow [INCIDENT_PLAYBOOKS.md](./INCIDENT_PLAYBOOKS.md).
2. Document timeline and root cause for postmortem.
