# LECIPM Engines v1 — Ranking, Core Autopilot, Growth

Production-safe foundations for search ranking, event-driven autopilot, and growth opportunity generation. Server-side only; no synthetic production data.

## 1. Summary of modules

| Area | Location |
|------|----------|
| Ranking (weights, signals, persistence) | `apps/web/src/modules/ranking/`, `apps/web/lib/ranking/` |
| Ranking v1 helpers (quality, price competitiveness, labels) | `apps/web/src/modules/ranking/v1/` |
| Core autopilot | `apps/web/src/modules/autopilot/` |
| Growth scans | `apps/web/src/modules/growth/` |
| Feature flags | `apps/web/config/feature-flags.ts` (`engineFlags`) |

## 2. Prisma

- **`ListingRankingScore`** — canonical per-listing scores (`listingType` + `listingId`).
- **`FsboListing` / `ShortTermListing`** — `rankingTotalScoreCache`, `rankingPerformanceBand`, `rankingCachedAt` for fast sorts.
- **`LecipmCoreAutopilotRun`**, **`LecipmCoreAutopilotAction`**, **`LecipmCoreAutopilotRuleLog`** — audit trail.
- **`GrowthOpportunityCandidate`**, **`SeoPageOpportunity`** — growth/SEO candidates (not auto-published).

**Migration (BNHub cache):** `apps/web/prisma/migrations/20260403100000_bnhub_short_term_ranking_cache/migration.sql`

## 3. API routes (internal cron)

All expect `Authorization: Bearer <CRON_SECRET>` (same as `POST /api/internal/payouts/run`).

| Route | Purpose |
|-------|---------|
| `POST /api/internal/ranking/recalculate` | Batch or per-city ranking recompute |
| `POST /api/internal/autopilot/run` | Single event payload or `{ "scan": "fsbo_sample", "limit": 40 }` |
| `POST /api/internal/growth/scan` | SEO + alert + campaign candidates |

## 4. Feature flags (`engineFlags`)

- `FEATURE_RANKING_V1`
- `FEATURE_LISTING_QUALITY_V1`
- `FEATURE_LISTING_AUTOPILOT_V1`
- `FEATURE_GROWTH_AUTOPILOT_V1`
- `FEATURE_SEO_CANDIDATE_GENERATION_V1`
- `FEATURE_REENGAGEMENT_CANDIDATES_V1`

`AI_RANKING_ENGINE_ENABLED` still enables ranking behavior when `FEATURE_RANKING_V1` is off (legacy).

## 5. Ranking score (high level)

Composite score is a **weighted sum of normalized 0–1 signals** (relevance, trust, quality, engagement, conversion, freshness, host, review, price competitiveness, availability), scaled to **0–100**. Weights come from **`RankingConfig`** per listing type, with defaults in `scoringEngine.ts`. Missing data degrades gracefully (neutral/fallback), never throws.

Browse API:

- **`sort=ranking`** uses persisted cache when `FEATURE_RANKING_V1` and cache &gt; 0; otherwise live scoring when the ranking engine is enabled.
- **`sort=newest`** sorts by `createdAt`.

## 6. Autopilot — queue vs execution

1. **Event** → `runLecipmCoreAutopilotEvent` → rules evaluated → **rule logs** + **actions** inserted.
2. **Approval**: `actionRequiresApproval` is `false` only for `mark_growth_candidate` and `mark_featured_candidate`.
3. **Safe auto-execute** (`SAFE_AUTOPILOT` + low-risk whitelist in `execution.policy.ts`): only those mark-* actions create **`GrowthOpportunityCandidate`** rows (deduped). No price changes, no content overwrite, no unpublish.

Global mode: `LECIPM_CORE_AUTOPILOT_MODE` + `FEATURE_LISTING_AUTOPILOT_V1`.

## 7. Growth opportunities

- **SEO:** `scanSeoPageOpportunitiesFromFsboInventory` — groups FSBO inventory by city / property type / deal type; minimum inventory threshold before upserting `SeoPageOpportunity`.
- **Alerts:** `scanReengagementAlertCandidates` — broker follow-up **candidates** only (no email sent).
- **Campaigns:** `scanFeaturedAndCampaignCandidates` — top `ListingRankingScore` rows → newsletter-style **candidates** (deduped).

## 8. Admin UI

- **`/admin/ranking`** — weights / legacy BNHub config.
- **`/admin/lecipm-engines`** — counts, flags, sample top ranked ids.

## 9. Manual QA checklist

- [ ] `pnpm exec prisma validate` (apps/web)
- [ ] `FEATURE_RANKING_V1=1` → browse `sort=ranking` returns ordered results
- [ ] After `POST /api/internal/ranking/recalculate`, BNHub + FSBO cache fields update
- [ ] `POST /api/internal/autopilot/run` with a test `eventType` creates run + actions
- [ ] Safe mark actions only create growth rows when `FEATURE_GROWTH_AUTOPILOT_V1=1`
- [ ] `POST /api/internal/growth/scan` returns summary JSON without 500

## 10. Known limitations / next steps

- **TODO v2:** personalization ranking, ML conversion, deeper fraud integration, revenue autopilot pricing models, human-reviewed SEO publish pipeline, experiments/A/B testing.
