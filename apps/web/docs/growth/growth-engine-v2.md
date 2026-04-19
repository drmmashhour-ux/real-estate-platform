# Growth Engine V2

Unified **read-only** operating snapshot for admins — combines platform traffic/listings stats, BNHub funnel telemetry, broker execution signals (via bridge), and lightweight CRM debt heuristics. **No mutations**, no outbound messaging, no payments changes.

## What it measures

| Channel | Sources |
|---------|---------|
| Traffic / platform | `getPlatformStats(30)` — visitors, listings, closed-booking signals |
| Conversion | Booking funnel rates + CRO hint from `analyzeBookingFunnel(14)` |
| Revenue | Closed transactions vs listing stock (advisory ratio, not accounting truth) |
| BNHub | Booking started vs completed, funnel bottleneck |
| Brokers | `buildGrowthBrokerBridgeSnapshot` when `FEATURE_BROKER_PERFORMANCE_V1` is on |
| Follow-up debt | Bounded sample of recent `Lead` pipeline strings — **heuristic contacted-share** |

## Outputs

- **Six health bands** (`strong` | `ok` | `watch` | `insufficient_data`) — rule-based from sparse/threshold checks.
- **Opportunities** — deterministic hypotheses with `sourceSignals[]` evidence strings only.
- **Risks** — conservative alerts (thin traffic, zero completions, sparse broker cohort, etc.).
- **Actions today / week** — merged, sorted by `priorityScore` (urgency/impact/confidence weights), **top 3** + **next 5**.

## What it does **not** do

- Does not send campaigns, emails, or DMs.
- Does not change Stripe, bookings, or lead ownership.
- Does not invent KPIs — if queries fail, notes are appended and bands may show `insufficient_data`.

## Feature flags

| Env | Meaning |
|-----|---------|
| `FEATURE_GROWTH_ENGINE_V2` | Enables `GET /api/admin/growth-engine-v2` |
| `FEATURE_GROWTH_ENGINE_V2_PANEL` | Renders `/[locale]/[country]/admin/growth-v2` UI (also requires API flag for data) |

Both default **off**.

## Monitoring

Prefix **`[growth:v2]`** — summaries built, opportunity/risk/action counts, sparse-data cases. Never throws from monitoring.

## Relation to Broker Performance Engine

Broker scores (when enabled) inform `brokerHealth` and opportunity/risk hypotheses. The bridge service only **reads** leaderboard aggregates — no circular dependency with Growth Engine orchestration.
