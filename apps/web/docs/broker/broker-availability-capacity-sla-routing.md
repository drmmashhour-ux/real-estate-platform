# Broker availability, capacity, and SLA routing (advisory)

Additive layers behind **separate env flags** (default off):

- `FEATURE_BROKER_AVAILABILITY_ROUTING_V1`
- `FEATURE_BROKER_CAPACITY_ROUTING_V1`
- `FEATURE_BROKER_SLA_ROUTING_V1`

## Signals

| Layer | Inputs | Effect |
|-------|--------|--------|
| **Availability** | Declared `acceptingNewLeads` from broker service profile when the profile batch is loaded; optional inactive-day hint on team views | Not accepting → soft deprioritization; unknown when profiles are not loaded (neutral, not “closed”) |
| **Capacity** | 30d-style active touch count, weak-signal overdue proxy from CRM summary text, recent internal assignment velocity, optional `maxActiveLeads` / preferred range | Bounded **capacityScore**; gentle penalties when hot — **no default hard exclusion** |
| **SLA** | `BrokerPerformanceSummary` breakdown (routing) or engine metrics (team view) | **good / moderate / poor / insufficient_data** — insufficient stays neutral |

## How routing changes

- A **single merged `routingAdjustment`** in roughly **−22 … +14** is applied to the existing Smart Routing + fairness score.
- Reasons are appended to the candidate row for auditability.
- **Manual assignment and overrides stay first-class** — nothing auto-sends leads externally.

## Sparse data

- No declared profile batch → availability **unknown**, capacity uses **neutral sparse mode** where enabled.
- Thin CRM sample → SLA **insufficient_data**, explicitly neutral.

## Manual control

Brokers/admins already use **service profile capacity** (`acceptingNewLeads`, optional ceilings). Turning flags on only **reads** those fields; it does not change persistence.

## Monitoring

Log prefixes: `[broker:availability]`, `[broker:capacity]`, `[broker:sla]` (merge lines reuse the availability family). See `broker-availability-monitoring.service.ts`.
