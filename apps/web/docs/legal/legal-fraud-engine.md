# Legal fraud / anomaly engine (operational indicators)

## Indicator-based model

`FEATURE_LEGAL_FRAUD_ENGINE_V1` exposes `/api/admin/legal/fraud`, which maps existing **Legal Intelligence** signal types into normalized **operational indicators**:

- Severity from the upstream signal (info / warning / critical).
- Labels and explanations use verification / anomaly language — never “fraud proven” or accusatory conclusions.
- Each indicator suggests a **review posture**: `standard_review`, `priority_review`, `manual_verification_recommended`, `senior_review_recommended`.

## Safe wording rules

- Prefer “indicator”, “pattern”, “verification”, “review”, “may warrant”.
- Avoid definitive guilt language or legal conclusions.

## Review posture meanings

| Posture | Intended use |
| --- | --- |
| `standard_review` | Normal queue handling. |
| `priority_review` | Elevated attention or throughput risk. |
| `manual_verification_recommended` | Operator should confirm identity or document authenticity. |
| `senior_review_recommended` | Cross-entity or sensitive inconsistency surfaces. |

## What is not claimed

The engine does **not** adjudicate fraud, authenticate documents, or replace legal counsel. It surfaces deterministic operational hints for reviewers only.
