# Soins Hub — Care quality scoring (platform layer)

## What this score is

- A **transparent, auditable, numeric summary** of **platform-observable** service quality: responsiveness, communication, meal operations, alert handling, documentation, and **non-clinical** resident/family experience signals collected through LECIPM.
- It is designed for **hospitality-style** operations insight (clarity, timeliness, reliability) **adapted to senior living workflows** on the platform.

## What it is not

- **Not** a medical, clinical, or regulatory certification.
- **Not** proof of compliance with any health authority, standard, or license.
- **Not** a recommendation to choose or avoid a residence for health reasons.
- **Not** a substitute for inspections, accreditation, professional judgment, or resident-specific care planning.

All consumer-facing surfaces must ship the short disclaimer bundled in code (`SOINS_QUALITY_DISCLAIMER`).

## Categories (each 0–100, then weighted)

| Category                         | Meaning (observable proxy)                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Care responsiveness              | Speed of acknowledging operational alerts/tasks logged in-platform.                             |
| Family communication             | Reply rate within SLA for family/resident messaging channels monitored by LECIPM.                 |
| Meal reliability                 | Meal completion vs schedule and missed-meal incidents per resident-day proxy.                     |
| Alert handling                   | Policy-complete closures and median resolution duration for operational (non-clinical) alerts.  |
| Service completeness           | Ratio of documented completion for attributable scheduled service tasks (where tracked).       |
| Resident experience            | Structured satisfaction-style feedback averages with complaint-density dampening (platform-only). |
| Transparency & documentation | Timeliness of material transparency updates and operator profile completeness on LECIPM.      |

Weights are constants in `soins-quality-score.service.ts` (`SOINS_CATEGORY_WEIGHTS`), sum **1.0**.

## Signal sources (integration points)

Scores consume normalized **signals** (`SoinsQualitySignals`), which may eventually be populated from:

- Alert/task acknowledgment and resolution timestamps  
- Meal delivery vs schedule logs  
- Family messaging SLA metrics  
- Complaint tickets filed through permitted channels  
- Structured feedback surveys (non-diagnostic wording)  
- Operator profile completeness and published updates  

Until integrations are complete, **baseline signals** produce mid-tier scores; **partial** residence records blend baseline with `SeniorOperatorPerformance` and `SeniorResidence.rating` proxies.

## Badge tiers

| Tier       | Rule (current)                                                                 |
| ---------- | ------------------------------------------------------------------------------ |
| **ELITE**  | Overall ≥ `BADGE_ELITE_MIN_OVERALL` (88) **and** no critical operational flag. |
| **PREMIUM**| Overall ≥ `BADGE_PREMIUM_MIN_OVERALL` (73) **and** no critical operational flag. |
| **STANDARD**| Otherwise.                                                                    |

If `criticalUnresolvedOperationalIssues` is **true**, the badge is **forced to STANDARD** regardless of numeric score (auditability over marketing).

Badge labels must use **“platform operations”** language — see `badgeMarketingLabel()`.

## Explainability & audit

Each run returns:

- **categoryBreakdown[]** — score, weight, plain-language rationale.  
- **explainability[]** — coded lines (`RESP_FAST`, `MEALS_MISSED`, …) with positive/negative/neutral impact.  
- **strengths[] / weaknesses[]** — human-readable highlights from category thresholds.

Determinism: **same signals → same outputs** (weighted sums rounded to one decimal).

## APIs (module)

- `computeSoinsQualityScores(signals)` — pure aggregation.  
- `assignSoinsBadge(computed, signals)` — tier enforcement.  
- `buildSoinsQualityResult(signals)` — wraps both.  
- `getResidenceQualityBreakdown(residenceId)` — loads `SeniorResidence` (+ operator performance).  
- `getResidentServiceExperienceScore(residentAiProfileId)` — loads `SeniorAiProfile` + latest `SeniorMatchingResult`; blends residence proxies with profile confidence (**not** clinical).

## UI contracts

- **Listing card**: `overallScore`, `badgeLevel`, first strength headline, disclaimer.  
- **Residence detail**: full breakdown + explainability list.  
- **Admin review**: signals snapshot + freshness (`live` / `partial` / `baseline`).  
- **Family view**: emphasize operations & communication; omit internal IDs where possible.

## Transparency requirements

- Always show **what inputs were missing** (baseline vs partial vs live).  
- Never imply inspection by LECIPM clinicians unless a separate audited program exists.  
- Prefer **ranges and trends** over single-point boasting for marketing claims.
