# Ranking V8 validation scorecard

## Purpose

The validation scorecard is a **read-only, analytical** rollup of rollout readiness for Ranking V8 (shadow, comparison, optional Phase C influence). It does **not** change live ranking, flip feature flags, or auto-enable production rollout.

**Flags**

| Env | Code flag |
|-----|-----------|
| `FEATURE_RANKING_V8_VALIDATION_SCORING_V1` | `rankingV8ShadowFlags.rankingV8ValidationScoringV1` |
| `FEATURE_RANKING_V8_VALIDATION_SCORING_PERSISTENCE_V1` | `rankingV8ShadowFlags.rankingV8ValidationScoringPersistenceV1` |

When scoring is **off**, the shadow observer does not emit scorecard logs. When **on**, a scorecard is computed after each shadow evaluation cycle (same conditions as the shadow evaluator flag).

Persistence is **deferred** in-repo (log stub only); wire an external store if you need durable snapshots.

## Categories (5 × 5 = 25 points)

### Quality

Uses overlap rates (top-5 / top-10 agreement), average rank shift, and optional meaningful-improvement rate. Thresholds are defined in `ranking-v8-validation-scoring.constants.ts` and applied in `ranking-v8-validation-scoring.service.ts`.

### Stability

Uses repeat-query consistency, top-5 churn rate, and large rank-jump rate when provided. Missing series are scored conservatively (partial credit).

### User impact

CTR, save, contact, lead, booking **relative deltas** vs a baseline window. **Missing metrics are not guessed** — they receive partial neutral credit and a note on the scorecard.

### Safety

Shadow/async error rates, crash counts, malformed observation rate, and influence skip rate. Zero errors and bounded skips score best.

### Coverage

Boolean coverage of traffic tiers, inventory density, geography, and price diversity. Sparse coverage reduces the score.

## Decision mapping

| Total (0–25) | Decision |
|--------------|----------|
| 0–12 | `not_ready` |
| 13–18 | `phase_c_only` |
| 19–22 | `strong` |
| 23–25 | `production_ready` |

Decisions are **advisory** — operators apply rollout policy out of band.

## Rollback warning rules (observational)

Warnings are emitted (never auto-rollback) when signals include:

- Top-5 overlap below **0.50**
- Top-10 overlap below **0.65** (diagnostic)
- Average rank shift magnitude above **2.5**
- Top-5 churn above **0.25** or large jump rate at/above **0.12**
- Material negative CTR, save, conversion-proxy, or booking deltas
- Very low repeat consistency
- Non-zero ranking crashes or elevated shadow/async error or malformed rates
- Weak coverage with otherwise strong quality
- Most user-impact metrics unavailable (scores use partial neutral credit)

## Required real-world validation metrics

Pair scorecard reviews with:

- Experiment or cohort holdouts
- CTR / save / contact / lead / booking trends (same window as deltas fed into inputs)
- Error budgets for shadow and ranking APIs

## Data scale expectations

- Meaningful quality/stability metrics need sufficient query volume and comparable list lengths.
- Sparse inventory or cold listings may increase malformed or skip rates — interpret safety and coverage together.

## Stability testing expectations

- Replay fixed queries; stability inputs should come from offline aggregation, not a single request.
- Compare dense vs sparse markets explicitly in coverage flags when building inputs.

## Missing data

- `null` metrics are **not** fabricated. They reduce category scores via partial tiers or neutral user-impact credit.
- Use `buildRankingV8ValidationInputsFromComparison()` to map `RankingV8ComparisonResult` into quality fields; add analytics deltas separately when available.

## Weekly report example

```json
{
  "windowLabel": "2026-W14",
  "queriesAnalyzed": 1200,
  "listingsEvaluated": 4800,
  "top5Overlap": 0.78,
  "top10Overlap": 0.86,
  "avgRankShift": 1.1,
  "ctrDelta": 0.012,
  "saveDelta": null,
  "leadDelta": 0.004,
  "skipRate": 0.18,
  "errorRate": 0.001,
  "finalScore": 21.5,
  "decision": "strong",
  "categorySummary": "Q=4.5 S=4.2 U=3.8 F=4.6 C=4.4",
  "warningCount": 0
}
```

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/ranking/ranking-v8-validation-scoring.test.ts
cd apps/web && pnpm exec vitest run modules/ranking/
```

Prisma: **no new model** in this revision for scorecard persistence.

## API

- `buildRankingV8ValidationScorecard(input)` — pure; safe for tests.
- `buildRankingV8ValidationInputsFromComparison(comparison, options)` — bridge from live/shadow comparison.
- `buildRankingV8ValidationWeeklyReport(scorecard, input)` — reporting payload.
- `runRankingV8ValidationScoringIfEnabled(input)` — respects `FEATURE_RANKING_V8_VALIDATION_SCORING_V1` and logs once.

Log namespace: **`[ranking:v8:scorecard]`**.
