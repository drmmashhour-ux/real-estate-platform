# Lead distribution AI + marketplace routing

Recommendation-first broker matching for CRM leads. Built on **Smart Routing V1** (`modules/broker/routing`) with **transparent fairness adjustments** (`modules/broker/distribution`). No black-box model and no silent external messaging.

## What it does

- Ranks brokers using **documented weights**: region fit, intent fit, performance summary, response speed, availability/load (from existing `computeRoutingBreakdown`).
- Applies **deterministic fairness**: de-prioritizes brokers with high **recent internal assignment velocity** (timeline events) and high **30d active lead touch volume**; down-weights **discipline / follow-up strain** from performance `weakSignals` (not a hard block).
- Returns **top 3** candidates by default with **reasons, strengths, and risk notes**.
- **Admin assign** sets `introducedByBrokerId` and appends a **timeline event** with `recommendedBrokerId`, `actualBrokerId`, and optional `overrideNote` for audit.

## What it does not do

- No automatic **email/SMS**; no lead **message** mutation.
- No new **payment/commission** rules in this module (assign still runs the existing `assertBrokerCanReceiveNewLead` gate from billing).
- **No auto internal assignment** in the default product path: `FEATURE_BROKER_LEAD_DISTRIBUTION_AUTO_INTERNAL_V1` is reserved; use **Smart Routing V2** + policy for any future gated auto-path, not this panel.
- No **fabricated** expertise: only CRM + profile fields already used by Smart Routing V1 and performance summaries.

## Sparse data

- Lead city/region / `leadType` missing → `insufficient` or `low` lead-level confidence in `buildLeadLevelRoutingSignals` and explicit `sparseDataNotes`.
- Broker performance may be thin; `weakSignals` are treated as **advisory risks**, not punishment.
- If a broker’s score falls below fairness thresholds, they can be **suppressed from the top-3 list** with an explainable reason (not removed from the system).

## Feature flags

| Variable | Effect |
|----------|--------|
| `FEATURE_BROKER_LEAD_DISTRIBUTION_V1` | Engine + `POST .../distribution/assign` |
| `FEATURE_BROKER_LEAD_DISTRIBUTION_PANEL_V1` | `GET .../distribution` + `BrokerLeadRoutingPanel` on admin lead view |
| `FEATURE_BROKER_LEAD_DISTRIBUTION_AUTO_INTERNAL_V1` | Reserved; default off (no behavior in this pass) |
| `FEATURE_BROKER_ROUTING_V1` | **Required** — distribution composes `buildLeadRoutingSummary` |

## APIs

- `GET /api/admin/leads/[leadId]/distribution` — full `BrokerLeadRoutingDecision` JSON.
- `POST /api/admin/leads/[leadId]/distribution/assign` — body `{ brokerId, overrideNote?, recommendedBrokerId? }`.

## Monitoring

In-process counters and logs: `[broker:distribution]` via `broker-lead-distribution-monitoring.service.ts` (never throws).

## Marketplace extension (no money in V1)

`BrokerLeadRoutingSignals` and the decision payload are shaped to add **specialization, zones, and premium placement** later; keep money, lead unlock fees, and placement pricing in **separate** modules when you add them.
