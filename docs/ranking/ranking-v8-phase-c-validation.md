# Ranking V8 Phase C — validation & rollout

Phase C adds **optional, bounded reordering** after the live BNHub sort when `FEATURE_RANKING_V8_INFLUENCE_V1` is on. Live score computation (`computeListingRank`, experiments, cross-domain adjustments) is **unchanged**; influence only permutes the already-sorted result slice (top zone, adjacent swaps, swap budget).

## Required sample sizes (minimums for meaningful reads)

| Signal | Minimum |
|--------|---------|
| Result set length (live) | ≥ 10 listings (gate) |
| Compared intersection (live vs shadow) | ≥ 8 (gate) |
| Shadow diff rows evaluated | Same cap as shadow evaluator (40) |

Below these thresholds, influence is skipped and live order is preserved.

## Evaluation windows

- **Staging:** 1–2 weeks with evaluator + influence on, persistence optional — review `[ranking:v8:influence]` and `[ranking:v8:comparison]` logs daily.
- **Internal traffic:** Narrow cohort (admin/staff IPs or feature cohort) 1+ week.
- **Production slice:** Single region or `%` of ranking-engine traffic with strict dashboards.
- **Expansion:** Only if overlap/stability metrics stay within targets (below).

## Top-5 / top-10 overlap targets (shadow vs live order)

These are **diagnostic**, not SLOs in code:

- **Healthy shadow alignment:** top-10 overlap often ≥ 4 when result sets are large (≥ 10 compared items).
- **Investigate** if top-5 overlap stays &lt; 2 for sustained periods while influence is on — may indicate blend drift or inventory skew.

## Max acceptable skip / fallback rates

- **Influence skipped** (`skippedReason` in logs): acceptable at high volume if dominated by `small_result_set` or `evaluator_disabled`.
- **Fallback after exception** (warn log): should stay **&lt; 0.1%** of ranked searches — investigate spikes.
- **Monitor-only path** (`monitorOnly: true`): acceptable during volatile inventory; if &gt; 30% of influenced calls, revisit stability thresholds.

## Downstream metrics to compare (before vs after slice)

Track on the **same** cohort and time window:

- **CTR** — listing card / search result clicks.
- **Saves / watchlist** adds from search.
- **Contact** or **lead** submits from listing surfaces fed by this ranked API.
- **Booking conversion** (BNHub) where ranked search is in the path.

Compare against a **holdout** or pre-period; avoid same-day noise (weekly aggregates).

## Rollout steps

1. **Staging** — enable `FEATURE_RANKING_V8_SHADOW_EVALUATOR_V1` + `FEATURE_RANKING_V8_INFLUENCE_V1`; leave persistence off unless debugging.
2. **Internal traffic** — same flags; monitor logs and optional `RankingShadowObservation` rows.
3. **Small production slice** — enable influence for a fraction of sessions (future: cohort flag) or single tenant; watch exception rate.
4. **Monitored expansion** — widen slice only if downstream metrics neutral or positive and no safety regressions.

Rollback: set `FEATURE_RANKING_V8_INFLUENCE_V1=0` (unset/false). Live sort and shadow-only observation behave as before Phase C.

---

## Stability testing plan

### Repeated query replay

- Fix search params + seed; run ranked search N times; with influence off, order should match baseline; with influence on, order may vary only within bounded swap rules — assert id multiset unchanged.

### Sparse vs dense inventory

- **Sparse:** &lt; 10 results — expect skip (`small_result_set`).
- **Dense:** 40+ results — only top 20 positions eligible; no removals/injections.

### Cold listings

- Listings with missing bundle fields should yield malformed shadow rows — high malformed rate triggers **skip** (`high_malformed_diff_rate`).

### Tie-heavy rankings

- Equal `rankingScore` sorts stable by JS sort; influence uses shadow scores — adjacent swaps still bounded.

### Missing-field robustness

- Rows with `shadowScore` / `delta` null increase malformed ratio — expect gate to skip influence.

### Load / repeated shadow runs

- Phase C runs shadow diff **inline** in the request when influence + evaluator are on — watch p95 latency; consider lowering `maxListings` cap only after measurement (not changed in Phase C by default).

### Persistence growth watchpoints

- With `FEATURE_RANKING_V8_SHADOW_PERSISTENCE_V1`, payloads now may include `influence` metadata — monitor DB row size and prune/archive per ops policy.

---

## Validation commands (local)

```bash
cd apps/web && pnpm exec vitest run modules/ranking/
```

Prisma: **no schema change** for Phase C influence. Run `pnpm prisma validate` only if you touch `schema.prisma`.

Full-app typecheck may be heavy; run `pnpm run typecheck` in `apps/web` when feasible.

---

## Explicit note

**Live ranking math and sort comparator are not replaced.** Phase C only reorders an in-memory copy of the ranked list subject to gates and swap limits. Source systems remain authoritative for scores stored elsewhere.
