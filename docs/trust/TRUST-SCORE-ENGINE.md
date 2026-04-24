# LECIPM Operational Trust Score Engine

## Purpose

The operational trust score is an **explainable, auditable composite** for marketplace entities. It supports internal prioritization, ranking *signals*, trust badges, operational coaching, and risk-aware automation — **without implying legal fault or moral judgment**.

Outputs are **operational by default**, not punitive. High-impact uses (for example, major visibility suppression) require explicit policy review and human gates.

## Model (v1)

- **Baseline**: neutral midpoint (50/100).
- **Inputs**: normalized factor signals roughly in \([-1, 1]\) mapped from platform data (disputes, dispute prediction snapshots, verification gates, booking hygiene, documents, licence checks, etc.).
- **Composition**: each factor contributes `normalized × inputScale × groupWeight(targetType, factorGroup)`, clamped per factor, summed, then clamped to \([0,100]\).
- **Weights**: `TRUST_WEIGHT_PROFILE_VERSION` + per–target-type group multipliers in `trust-score-weights.service.ts` (bump the version string when economics change).

## Target types

| Target      | Notes                                                        |
| ----------- | ------------------------------------------------------------ |
| `BROKER`    | Broker user id; licence / verification / workload proxies. |
| `LISTING`   | FSBO listing id; merges numeric listing trust + documents. |
| `DEAL`      | Residential deal id; documents + prediction + disputes.    |
| `BOOKING`   | BNHub booking id; confirmation + issues + prediction.      |
| `TERRITORY` | Summary stub until richer rollups land.                    |

## Bands

| Band               | Approx. score |
| ------------------ | ------------- |
| `HIGH_TRUST`       | ≥ 85          |
| `GOOD`             | 70–84         |
| `WATCH`            | 55–69         |
| `ELEVATED_RISK`    | 40–54         |
| `CRITICAL_REVIEW`  | < 40          |

Bands drive **copy** and **review suggestions**, not automatic sanctions.

## Factor groups

1. Compliance & documentation  
2. Responsiveness & reliability  
3. Booking / no-show behavior  
4. Dispute & friction history (includes dispute prediction features)  
5. Listing / deal quality signals  
6. Insurance / coverage proxies (licence checks, compliance gates)

## Explainability

Every run exposes:

- Top positive contributors (numeric contribution + weight)  
- Top negative contributors  
- Why the band was assigned (plain-language, advisory)  
- Improvement ideas (non-punitive operational nudges)  
- Optional decline note when a prior snapshot exists  

## Ranking safety

`trust-score-ranking.service.ts` emits **bounded** lifts for sort / prominence / queue priority. Trust must remain **one signal among many** (relevance, freshness, fees, legal constraints).  
`policyGateMajorSuppression` clamps negative listing-sort influence when targets hit critical bands — **full suppression still requires product policy**, not this engine alone.

## Persistence & alerts

Snapshots live in `lecipm_operational_trust_snapshots`; optional alerts in `lecipm_operational_trust_alerts` for sharp drops, critical band entry, repeated negative drivers, and strong improvements.

## APIs

- Admin UI: `/dashboard/admin/trust-score`  
- Admin JSON: `/api/admin/trust-score/dashboard`, `/api/admin/trust-score/target/[targetType]/[targetId]`, POST `/api/admin/trust-score/compute`  
- Broker self: `/api/broker/trust-score`  
- Broker deal: `/api/broker/residential/deals/[id]/trust-score`  
- Mobile admin: `/api/mobile/admin/trust-score/*`

## Risk integrations

`trust-score-risk-bridge.ts` exposes a **low-weight feature** so dispute prediction, prevention flows, and AI CEO risk overlays can ingest operational trust as **one contextual input**, never the sole gate.

## Limitations

- Territory aggregation is intentionally thin in v1.  
- Some proxies depend on sparse telemetry (for example host response samples).  
- Listing dispute prediction requires entity-aligned IDs; mismatches reduce signal quality and add “thin data” notes.  
- This engine does **not** replace regulatory, legal, or brokerage compliance processes.
