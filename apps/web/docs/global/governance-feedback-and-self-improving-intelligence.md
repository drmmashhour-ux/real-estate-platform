# Governance outcome feedback & self-improving intelligence (v1)

## Purpose

Outcome feedback compares **predicted governance posture** (policy + unified governance + risk scores at decision time) against **later operational truth** (refunds, chargebacks, execution results, fraud findings, approvals). It produces **advisory labels and metrics** for operators and investors without changing live behavior.

## Deterministic governance stays authoritative

Runtime decisions continue to flow through `evaluateUnifiedGovernance`, controlled execution gates, and legal-risk evaluation. Feedback **does not** override, replace, or silently adjust those paths in v1.

## False positives and false negatives

The classifier assigns labels such as `GOOD_BLOCK`, `BAD_BLOCK`, `MISSED_RISK`, etc., and sets:

- **`falsePositive`**: predicted protection was overly conservative relative to downstream evidence (e.g., block with later cleared fraud / successful execution signals, per rules).
- **`falseNegative`**: governance under-reacted versus harm that later appeared (e.g., auto path with chargeback, missed risk with harmful events).

Exact rules live in `governance-feedback-classifier.service.ts` and are versioned in code review, not hidden in weights.

## Protected vs leaked revenue (estimates)

- **Protected revenue (estimate)** uses classifier outputs that credit averted harm (e.g., good blocks aligned with negative revenue events) combined with prediction’s `revenueImpactEstimate` where applicable.
- **Leaked revenue (estimate)** accumulates harmful monetary events on paths that should have been stricter.

These are **planning signals**, not GAAP accounting.

## Threshold recommendations are advisory only

`recommendGovernanceThresholdAdjustments` returns explicit `GovernanceThresholdRecommendation` rows. **v1 never mutates** autonomy or fraud threshold config automatically. Humans change config after review.

## ML training data export

`buildGovernanceTrainingRow` produces deterministic, PII-safe feature rows aligned to prediction + classified label. Training data is **derived for offline use**; it is not the live source of truth for execution.

## No automatic threshold mutation in v1

There is **no** job or API that applies recommendations to production thresholds. Persistence is an in-memory / future-DB adapter; orchestrator recording is wrapped so failures never break execution.

## Related code

- Types: `modules/autonomous-marketplace/feedback/governance-feedback.types.ts`
- Classifier: `governance-feedback-classifier.service.ts`
- Metrics: `governance-feedback-metrics.service.ts`
- Recommendations: `governance-threshold-recommendation.service.ts`
- Recording: `governance-feedback-recording.service.ts` (called from controlled execution orchestrator)
- Admin API: `app/api/admin/autonomy/governance-feedback/route.ts`
