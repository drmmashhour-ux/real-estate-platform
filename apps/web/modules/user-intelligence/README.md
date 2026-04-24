# User intelligence (Wave 13)

**Purpose** — Durable, **auditable** user preference memory for LECIPM: housing and product-behavior signals only, integrated with Dream Home, listing recommendations, and Playbook context.

## Safety

- **No** storage of protected traits, nationality, ethnicity, religion, or inferred identity.
- **Explicit** user answers (e.g. Dream Home questionnaire) outrank weak **behavior-derived** hints in merge.
- **Explainable** categories in `UserPreferenceProfile` JSON; **editable** by replacing signals or calling rebuild from the app.
- `signalKey` values are validated (safe charset; blocked substrings for sensitive categories).

## Schema (Prisma)

- `UserPreferenceProfile` — 1:1 with `User`; holds merged category JSON and `confidenceScore`.
- `UserPreferenceSignal` — append-friendly rows (domain, type, key, value JSON, explicit vs behavior flags).
- `UserJourneyState` — optional funnel hints (`currentDomain`, `currentStage`, latest city / budget band).
- `UserPreferenceSnapshot` — point-in-time exports for audit / rollback; `activeSnapshotId` on profile is optional.

## Profile rebuild

`rebuildProfile` loads recent signals (skips very stale behavior rows), `mergeSignalsToProfile` (see `utils/user-preference-merge.ts`) fills category objects, and optional **session** payload can override in-memory merge for the current request.

## Journey

`updateJourneyState` / `getJourneyState` maintain lightweight stage and recency; `user-journey-score` gives deterministic `recency01` and `journeyIntentWeight` for gating nudges.

## Dream Home

- `/api/dream-home/profile` merges **stored** preferences, then current JSON **wins**; for logged-in users, questionnaire facts are **recorded** as signals and profile is rebuilt (non-blocking).

## Listings (personalized recommendations)

`recommendation-context.loader` embeds `wave13Housing` / `wave13Budget` in `memory.preferenceSummary`. The FSBO score adds a small **city match** nudge when a stored `location_city` field matches the listing city.

## Playbook

`RecommendationRequestContext` may include **`userId`**. `augmentRecommendationContext` prepends `mergePlaybookContextWithUserIntelligence`, which **merges** durable `pref_*` signals into `context.signals` (domain augment still runs after, **not** replaced).

## APIs

- `GET/POST /api/user-intelligence/profile` (auth)
- `GET/POST /api/user-intelligence/signals` (auth)
- `GET/POST /api/user-intelligence/journey` (auth)

All return `{ ok, ... }` without throwing from handlers for typical failures.

## Future

Hook explicit `listingSave`, `inquirySubmit` as `derivedFromBehavior` signals with `lastObservedAt` and confidence tuned per product.
