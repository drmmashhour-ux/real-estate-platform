# Revenue Predictor (LECIPM)

## Purpose

The **Revenue Predictor** ties **sales performance signals** (calls, training, objections, close quality) to **pipeline dollars** and produces **operational, probabilistic** revenue ranges for:

- Individual salespeople
- Teams
- Rolled-up pipeline (from stored snapshots)

It is **not** a GAAP revenue guarantee, not a board forecast, and **avoids false precision** by using **wide bands** (conservative / base / upside) and **LOW / MEDIUM / HIGH** confidence labels.

## Inputs

| Source | What is used |
|--------|----------------|
| **AI Sales Manager** profile | Calls, wins/losses, training average, control/closing scores, trend, objection patterns |
| **Revenue snapshot** (per user) | `pipelineValueCents`, `averageDealValueCents`, `openDeals`, `conversionByStage`, optional hub/region/dealType, seasonality & demand |
| **Team training** (indirect) | Feeds AI Sales profile when sessions are logged |
| **Call replay** (indirect) | Weak-moment flags in profile affect scores → influence model |

CRM fields are **browser-persisted** in v1 (`localStorage`); wire to your acquisition/CRM API for production.

## Formulas (v1 — transparent)

1. **Historical win rate** from `closesWon / (closesWon + closesLost)` (default when sparse).
2. **Score modifier** — small influence from call quality, control, closing, training, objection success (see `SCORE_INFLUENCE_WEIGHTS` in `revenue-predictor.config.ts`).
3. **Stage blend** — if stage counts exist, compute a weighted **effective stage close weight** using `STAGE_CLOSE_WEIGHT` per `PipelineStage`.
4. **Blend** `historical`, `stage`, and `score` into **weighted close probability** (capped).
5. **Context** — optional `seasonalityFactor` × `currentDemandSignal` (bounded).
6. **Base expected revenue (cents)** ≈ `pipelineValueCents × weightedCloseProbability` (or deal-size fallback if pipeline empty but deal + open counts exist).
7. **Ranges** — `conservative = base × 0.82`, `upside = base × 1.14` (`RANGE_SPREAD`).

## Coaching uplift

`buildCoachingUpliftForecast` estimates a **band** of % lift if closing and objection metrics move toward internal “comfort” levels. Capped by `COACHING_UPLIFT.maxUpliftPct`. Narrative is always **qualitative with a range**, not a point promise.

## Lost opportunity

`estimateOpportunityLoss` attributes **heuristic leakage** to weak close, objection, control, and follow-up trend, plus **per-stage stall risk** using `STAGE_STALL_RISK`. Use for **where to coach**, not for booking journal entries.

## Explainability

`buildSalespersonExplainability` returns:

- `factorsIncreasing` / `factorsReducing`
- `stageConcentrationRisks` (e.g. top-heavy in `NEW_LEAD`)
- `confidenceLabel` with a **short rationale string**

## Alerts

`evaluateRevenuePredictorAlerts` uses **deduped, rule-based** checks: forecast drop vs last snapshot, early-stage concentration, high coaching upside, rep below threshold, team week-over-week shift. **Managers** choose follow-up.

## Admin workflow

1. **Revenue predictor** page: org + team + per-rep table, loss, coaching rank, pipeline explainability.
2. **AI Sales Manager** user page: per-rep **Revenue predictor** panel; save **pipeline / avg deal** snapshot.
3. **Admin Super Dashboard** (and mobile): `revenuePredictor` block for org-level **base / range / leak / upside** snapshot.

## Mobile API

- `GET /api/mobile/admin/revenue-predictor/summary`
- `GET /api/mobile/admin/revenue-predictor/team/[id]`
- `GET /api/mobile/admin/revenue-predictor/user/[id]`

(Admin JWT required — see existing mobile auth pattern.)

## Governance

- **Human managers** own decisions; the model is a **co-pilot**.
- Reported **cents** are **model outputs**; label them that way in any customer-facing copy.
