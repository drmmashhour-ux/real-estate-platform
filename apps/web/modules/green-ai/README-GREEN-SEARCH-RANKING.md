# LECIPM — Green search & green ranking

Internal **Québec-inspired** performance signals for discovery, filtering, and assistive ranking. This is not Rénoclimat, EnerGuide, or any official program output.

## Public vs broker / admin

| Surface | What users see | Notes |
|--------|----------------|--------|
| **Public** | `green` on browse responses: scores, model band, illustrative incentives **total**, short `rationale`, and a **disclaimer** | No internal pricing-boost or broker-only phrasing. |
| **Broker / admin** | Same plus `greenIntelligence` when `greenAudience: "internal"` in POST /api/buyer/browse | Includes `brokerCallouts`, `rankingBoostSuggestion`, and optional `rankingSignal` after a green `greenSortMode`. |

Always prefer wording such as: **“Québec-inspired green score”**, **“Upgrade potential”**, **“Potential incentive opportunity”** — never imply guaranteed savings, grants, or a government rating.

## Filter semantics (`greenFilters` on buyer browse / fsbo search)

- **`minimumQuebecScore` / `minimumGreenLabel`**: Require a stored or modeled current score/label. Listings with **no** green data **do not match** when these filters are set.
- **Upgrade / incentive filters**: If the signal is **missing** (e.g. no snapshot), the listing is **excluded** when that filter is **true**.
- **Component toggles** (efficient heating, insulation, windows, solar, green roof): if we cannot evaluate the flag (`null` / unknown), the listing is **excluded** when the toggle is on.
- All filtering is **deterministic**; inputs are not mutated in place in the service layer.

## Ranking modes (`greenSortMode` / `sortMode`)

| Mode | Use |
|------|-----|
| `green_best_now` | Emphasize higher **current** modeled performance. |
| `green_upgrade_potential` | Emphasize **score delta** / improvement band. |
| `green_incentive_opportunity` | Emphasize illustrative **incentive** totals and paths. |
| `standard_with_green_boost` | Blends a **base** relevance score with a **light** green nudge; default assistive behavior for public. |

`audience: "internal"` uses slightly stronger weighting in the same modes (see `green-ranking.service.ts`).

## Stays (BNHub) — `/api/listings/search`

- Accepts optional `greenFilters` and `sortMode` for **API compatibility**; **does not** attach per-listing `green` (stays do not carry FSBO metadata).
- When those fields are present, the response may include `greenSearch: { supported: false, reason: "..." }` so clients know to use **buyer browse** or **fsbo search** for LECIPM green.

## Snapshot dependencies

Decoration prefers, in order:

1. `lecipmGreenMetadataJson` — `quebecEsgSnapshot`, `grantsSnapshot`, `greenSearchSnapshot`, optional `recommendationsSnapshot`, `incentivesSnapshot`, `roiSnapshot`, `pricingBoostSnapshot`, `quebecEsgEconomicsSnapshot` (when present).
2. `lecipmGreenInternalScore` / `lecipmGreenAiLabel` on the listing row.
3. Optional **on-the-fly** `evaluateGreenEngine` / `runGreenAiAnalysis` when intake (or year-built-only fallback) is available.

**Never throw** in decoration — failures yield null-safe fields and a minimal rationale.

## Disclaimers

- Every public `green` block includes a **long-form disclaimer** (`GREEN_SEARCH_PUBLIC_DISCLAIMER`).
- UI that surfaces a score should show a short line such as: `GREEN_COPY.disclaimerShort` (see `green-discovery-copy.service.ts`).

## Related files

- Types: `green-search.types.ts`
- Decoration: `green-search-decoration.service.ts`
- Filters: `green-search-filter.service.ts`
- Ranking: `green-ranking.service.ts`
- Copy: `green-discovery-copy.service.ts`
- Tests: `tests/green-search-*.test.ts`
