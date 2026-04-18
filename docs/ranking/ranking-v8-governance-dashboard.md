# Ranking V8 governance dashboard (read-only)

## Purpose

The governance dashboard aggregates **read-only** signals for Ranking V8: validation scorecard, advisory rollout recommendation, readiness gates, comparison metrics (overlap, rank shift, churn proxies), coverage hints, rollback signals, and recent shadow snapshots. It does **not** change live ranking, toggle rollout flags, or write source-of-truth data.

## Enablement

- **Env:** `FEATURE_RANKING_V8_GOVERNANCE_DASHBOARD_V1=true`
- **Code flag:** `rankingV8ShadowFlags.rankingV8GovernanceDashboardV1`
- When **off:** the API returns **404** and the admin UI block is **hidden**.
- **UI:** `app/[locale]/[country]/admin/analytics/page.tsx` (Analytics hub) — rendered only when the flag is on.

## Data sources

| Source | Role |
|--------|------|
| `RankingShadowObservation` (Prisma) | Latest shadow evaluation payloads in the selected time window; drives comparison + scorecard inputs |
| `compareRankingV8LiveVsShadow` | Overlap, rank shift, stability hints |
| `buildRankingV8ValidationScorecard` | Category scores (0–5 each), total (max 25), decision |
| `deriveRolloutRecommendation` | Advisory recommendation + readiness gates + blocking reasons (non-executing) |
| Feature flags (`rankingV8ShadowFlags`) | Current phase labels (shadow vs Phase C influence) |

Missing or slow sources are listed under `meta.missingSources`; the payload still returns with safe defaults where possible.

## Reading the scorecard

- **Total score:** sum of five categories, each scored up to **5** (max **25**).
- **Categories:** Quality, Stability, User Impact, Safety, Coverage — see `ranking-v8-validation-scoring.service.ts` for thresholds.
- **Decision:** `not_ready` → `phase_c_only` → `strong` → `production_ready` mapping is analytical only.

## Recommendations (advisory)

| Value | Meaning |
|-------|---------|
| `stay_in_shadow` | Do not expand; stay on shadow evaluation |
| `phase_c_only` | Limited Phase C–style scope only (per internal gates) |
| `expand_phase_c` | Stronger signal to broaden Phase C (still advisory) |
| `candidate_for_primary` | Worth human review before any primary path |
| `rollback_recommended` | Rollback-style signals or scorecard warnings suggest pulling back |

These strings **do not** execute automation in this dashboard.

## Rollback signals

| Signal | Typical meaning |
|--------|-----------------|
| Severe overlap drop | Top-5 overlap very low vs shadow |
| Instability spike | Comparison instability hint or low stability score |
| Errors present | Elevated malformed shadow row rate in the observation |
| Negative user impact | Negative CTR/save/lead deltas when present |

## Limitations

- User-impact deltas are often **null** until wired to analytics — gates may show **N/A**.
- Geo/price diversity may be **null** if not inferred from payloads.
- History re-scores each stored snapshot; empty DB yields empty history.
- DB reads are **time-bounded** (~2.4s best-effort); timeouts appear in `missingSources`.

## Validation commands

From the repo root (or `apps/web` as appropriate for your package manager):

```bash
pnpm exec vitest run apps/web/modules/ranking/ranking-v8-governance.service.test.ts
pnpm exec vitest run apps/web/app/api/admin/ranking/v8/governance/route.test.ts
```

Optional typecheck (monorepo):

```bash
pnpm exec tsc -p apps/web --noEmit
```
