# Day 1 production monitoring playbook

Operational checklist for the first 24 hours after launch. Applies to Syria / Darlink (`apps/syria`) marketplace flows; keep LECIPM and other apps isolated — do not mix databases or audit trails.

---

## 1. Launch prerequisites

Before declaring “live”, confirm:

| Check | Notes |
| --- | --- |
| **payments:preflight passes** | Automated or manual preflight for SYBNB payment wiring completes without errors. |
| **DB connected** | Application health and DR.BRAIN DB ping succeed; no connection pool exhaustion. |
| **Build passes** | CI / deploy pipeline green; optional `DRBRAIN_INCLUDE_BUILD=true` if you embed build verification in DR.BRAIN. |
| **Webhook signature verified** | Payment provider webhooks reject invalid signatures; no silent acceptance. |
| **Escrow enabled** | Payout escrow behavior matches policy (held / eligible / blocked counts sane). |
| **Kill switches tested** | Payment and payout kill switches flip to safe state without errors (see §5). |

---

## 2. First 24 hours — metrics cadence

Review **every 15–30 minutes** (more often if traffic spikes):

- Payment attempts (hourly trend)
- Blocked payment attempts
- Webhook failures or retries
- Booking confirmations vs expectations
- Payout status counts (held / eligible / released / blocked)
- Fraud HIGH / BLOCK-class events (labels vary by implementation)
- Database errors (application logs + provider dashboards)
- API **5xx** rate and latency (p95/p99 where available)
- Latency spikes vs baseline

Syria admins can cross-check DR.BRAIN dashboards and SYBNB payment monitors (aggregates only — no secrets in screenshots).

---

## 3. Alert severity

### INFO

Minor anomaly or informational signal; **no immediate action** unless trend worsens. Log and continue monitoring.

### WARNING

Examples:

- Repeated blocked payment attempts from similar patterns
- Moderate API slowdown vs baseline
- Unusual booking pattern (volume or funnel shape)

**Action:** Increase observation frequency; prepare rollback / kill-switch posture; open or update DR.BRAIN tickets if persistence warrants tracking.

### CRITICAL

Examples:

- Database unavailable or failing critical queries
- Webhook signature verification failures spike
- Payment failure spike vs baseline
- Fraud BLOCK events spike
- Unexpected payout release attempts or escrow anomalies

**Action:** Follow §4 immediately.

---

## 4. Response actions (CRITICAL)

1. Turn on **payment kill switch**: `SYBNB_PAYMENTS_KILL_SWITCH=true`
2. Turn on **payout kill switch**: `SYBNB_PAYOUTS_KILL_SWITCH=true`
3. **Pause** affected host, listing, or booking flows if narrow blast radius — do not guess; use audit trails.
4. **Acknowledge** the corresponding DR.BRAIN ticket in the Syria admin dashboard (tracked in Syria audit events — not shared across apps).
5. **Document** incident timeline: time detected, actions taken, env flags changed, owners pinged.

Do **not** use investor demo mode (`DRBRAIN_INVESTOR_DEMO_MODE`) against production data — it is presentation-only.

---

## 5. Kill switch environment flags

Document for operators (values illustrative — confirm against your deployment templates):

```bash
# Block new payment intents / checkout surfaces (exact behavior depends on Syria middleware)
SYBNB_PAYMENTS_KILL_SWITCH=true

# Block or hold payout progression as implemented for SYBNB
SYBNB_PAYOUTS_KILL_SWITCH=true
```

After incident: revert only after root cause is understood and fixes are deployed.

---

## 6. Escalation

1. **Owner / admin** notified (on-call channel).
2. **Developer** pulls structured logs (no secret dumping — redact tokens).
3. **Payment provider** dashboard: disputes, webhook delivery, rate limits.
4. **Database provider** dashboard: CPU, connections, storage, failover events.

---

## 7. Do-not-do list

- Do **not** release payouts manually during an unresolved incident unless compliance explicitly requires it and authority is documented.
- Do **not** disable fraud checks to “restore revenue”.
- Do **not** bypass webhook signature verification.
- Do **not** point demos or load tests at **production** databases.
- Do **not** merge Syria audit data with LECIPM or HadiaLink datasets.

---

## 8. End-of-day review

Before closing Day 1:

- Total incidents by severity (INFO / WARNING / CRITICAL)
- DR.BRAIN tickets opened, acknowledged, resolved
- Blocked payments count and notable patterns
- Fraud attempts surfaced to admins
- Payout state distribution vs policy
- Recommended fixes or flags for Day 2

---

## Related

- Syria DR.BRAIN admin UI: `apps/syria` — tickets, investor demo mode (`DRBRAIN_INVESTOR_DEMO_MODE`), Day 1 checklist (browser-local unless persisted elsewhere).
- `packages/drbrain` — ticket deduplication and report emission logic.
