# Property legal risk score

The **property legal risk score** is an internal **0–100 index** where **higher values indicate greater platform‑assessed friction** (documents, checklist blocking, structured rule/fraud extracts, readiness gaps). It is **not legal advice**.

## Levels

| Range   | Level     |
|---------|-----------|
| 0–19    | low       |
| 20–39   | guarded   |
| 40–59   | elevated  |
| 60–79   | high      |
| 80–100  | critical  |

Scores **≥ 80** or evaluator‑determined blocking posture can hard‑gate publish together with checklist failures depending on enabled flags (`FEATURE_PROPERTY_LEGAL_RISK_SCORE_V1`).

## Influence on trust / ranking

The trust scoring service applies a bounded dampening when an index is supplied. Ranking uses deterministic multipliers gated by `FEATURE_LEGAL_TRUST_RANKING_V1`.
