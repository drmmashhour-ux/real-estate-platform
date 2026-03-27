# Incident playbooks

## Severity levels

- **SEV1** — Data loss risk, auth bypass, payment processing down: page on-call immediately.
- **SEV2** — Major feature degraded, no data loss: respond within business hours SLA.
- **SEV3** — Minor bug or non-critical background job failure: track in backlog.

## Common scenarios

- **Database connection exhaustion:** Scale connections, add pooling, identify slow queries.
- **Stripe webhook failures:** Replay from Stripe dashboard after fixing handler; verify idempotency keys.
- **Demo bleed into prod:** Disable demo flags, audit writes by tenant id.

Update this file when new failure modes appear.
