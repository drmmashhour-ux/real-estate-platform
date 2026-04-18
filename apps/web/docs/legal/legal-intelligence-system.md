# Legal Intelligence System (Phase 4)

## What it is

Legal Intelligence is a **deterministic, metadata-only** layer that surfaces operational patterns from listing documents, supporting uploads, and verification metadata. It supports internal review prioritization and policy hints — **not** automated legal conclusions.

## Supported signals

Signal codes include: duplicate upload patterns, overlapping identity verification paths, elevated resubmission volume, actor/workflow routing checks, rejection ratios, missing critical document clusters, cross-listing filename reuse, MIME/name anomalies, review aging, and short-interval upload bursts.

## What “fraud indicator” means operationally

“Fraud indicator” is **legacy wording in code paths** mapped to **risk-pattern labels** in UI copy. Indicators mean “pattern worth human review,” **never** “fraud proven.” Public and seller surfaces must avoid accusatory language.

## What the system does **not** do

- No black-box ML or opaque scoring.
- No auto-approve / auto-reject of listings, documents, or verification outcomes.
- No legal advice or guarantees about compliance.
- No assertion of fraud as fact — only structured, explainable flags.

## Prioritization logic

Review priority combines:

- Severity counts from advisory signals (when enabled).
- Missing critical requirements and rejection metadata (when present on queue items).
- Submission age and workflow sensitivity fields on queue rows.
- Enforcement / downstream blocking hints from listing state.

Outputs include human-readable reasons for each score band.

## Escalation recommendations

Escalation suggestions (`standard_review`, `priority_review`, `senior_review_recommended`, `manual_verification_recommended`) are **advisory**. They do not assign reviewers or change enforcement outcomes.

## Persistence / audit

Optional rows can be stored in `legal_intelligence_records` for audit trails (metadata JSON only — **no raw document contents**). Runtime evaluation primarily uses live queries through `buildLegalIntelligenceSnapshot`.

## Safe wording & reviewer guidance

- Prefer “pattern,” “operational signal,” “metadata reuse,” “review backlog.”
- Avoid “fraud,” “scammer,” or definitive misconduct labels in user-visible text.
- Internal admin views may reference structured signal codes but should still describe outcomes as review decisions, not findings of bad intent.

## Feature flags

- `FEATURE_LEGAL_INTELLIGENCE_V1` — core signals + admin APIs + policy enrichment.
- `FEATURE_LEGAL_REVIEW_PRIORITY_V1` — deterministic queue scoring surfaces.
- `FEATURE_LEGAL_ANOMALY_DETECTION_V1` — exposes anomaly-shaped aggregates in admin intelligence responses.

## Future extensions

- OCR-assisted validation behind explicit human review checkpoints.
- Human-in-the-loop verification pipelines with SLA tooling.
- Reviewer workload balancing based on queue depth (non-automated assignment).
- Jurisdiction-specific anomaly packs layered on top of the same deterministic framework.
