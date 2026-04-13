# Reputation system

Platform-wide **ongoing reputation** (distinct from BNHub booking `Review` rows and from `platform_trust_scores`). Stored in **`reputation_scores`** with supporting **`reputation_reviews`**, **`reputation_complaints`**, and optional **`reputation_response_metrics`**.

## Schema

| Model | Table | Notes |
|-------|--------|--------|
| `ReputationScore` | `reputation_scores` | Composite score + sub-scores + `ReputationLevel` |
| `ReputationReview` | `reputation_reviews` | **Not** the BNHub `Review` model; platform reviews with `ReviewStatus` |
| `ReputationComplaint` | `reputation_complaints` | Moderation queue with `ComplaintStatus` |
| `ReputationResponseMetric` | `reputation_response_metrics` | Cached response stats (synced from host metrics when recomputing) |

Enums: `ReputationEntityType`, `ReputationLevel`, `ReviewStatus`, `ComplaintStatus`.

## Scoring model (v1)

Weighted composite (0–100):

```
reputation_score =
  review_score × 0.30 +
  reliability_score × 0.25 +
  responsiveness_score × 0.20 +
  complaint_score × 0.15 +
  quality_score × 0.10
```

Then apply **fraud penalties** (see `lib/reputation/fraud-reputation-adjustment.ts`) and a small **trust alignment** nudge from `platform_trust_scores` when present.

**Levels:** 0–29 poor · 30–54 fair · 55–79 good · 80+ excellent

Sub-score implementations live in `lib/reputation/compute-*.ts`.

## Reviews

- **Published** platform reviews drive `review_score`.
- BNHub **`PropertyRatingAggregate`** is used as a fallback when no platform reviews exist yet (listing/host).
- **Eligibility** (see `create-review.ts`): completed stays for listing/host reviews; broker–client relationship for broker reviews; CRM **Lead** touch for seller reviews; host→guest completed stay for buyer reviews.
- Duplicate abuse: `@@unique([authorUserId, subjectEntityType, subjectEntityId])`.

## Complaints

- File via `POST /api/reputation/complaints`.
- **Open / under_review** apply modest penalties; **confirmed** applies stronger penalties; **dismissed** stops escalation.
- Reputation recomputes on create and on admin status change.

## Moderation

- **Reviews:** `POST /api/admin/reputation/reviews/[id]/moderate` (`pending` | `published` | `hidden` | `flagged`).
- **Complaints:** `POST /api/admin/reputation/complaints/[id]/review`.
- **Recompute:** `POST /api/admin/reputation/recompute/[entityType]/[entityId]`.

## Ranking integration

`getReputationSearchAdjustMapForListings` (`lib/bnhub/bnhubSearchRankSignals.ts`) applies a **signed, capped** adjustment on BNHub recommended/AI sort paths (alongside existing marketing/tier/trust boosts). Missing scores → **0** effect.

## Trust & fraud

- **Trust:** small blend from `PlatformTrustScore` — verification does not erase bad reputation.
- **Fraud:** `FraudPolicyScore` / open `FraudCase` / **confirmed_fraud** reduce reputation; **false_positive** fraud cases soften the penalty.

## Public API

- `GET /api/reputation/[entityType]/[entityId]` — score, breakdown, badges, recent published reviews.

## Limitations

- First-time entities may show **neutral** sub-scores until data exists.
- Broker/seller paths depend on CRM/lead data being present for eligibility.

Related: [trust-verification-system.md](./trust-verification-system.md), [fraud-detection-system.md](./fraud-detection-system.md).
