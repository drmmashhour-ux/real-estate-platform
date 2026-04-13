# A/B experiment system (LECIPM + BNHub)

## Schema

- **`Experiment`**: slug, status (`draft` | `running` | `paused` | `completed`), `targetSurface`, `primaryMetric`, `trafficSplitJson`, schedule (`startAt` / `endAt`), `winnerVariantKey`, `stoppedVariantKeys` (JSON array of variant keys removed from allocation), `archivedAt`.
- **`ExperimentVariant`**: `variantKey`, `name`, `configJson` (UI copy / flags).
- **`ExperimentAssignment`**: one row per `(experimentId, sessionId)` with optional `userId` for logged-in users.
- **`ExperimentEvent`**: `eventName`, `metadataJson`, ties to `experimentId` + `variantId` + `sessionId`.

Migrations live under `apps/web/prisma/migrations/`.

## Assignment logic

1. **Browser session id** is set in middleware (`lecipm_exp_session` cookie) and mirrored on the request as `x-lecipm-exp-session` so the first SSR paint matches the cookie (reduces flicker).
2. For each **running** experiment on a **target surface**, we look up an assignment by **`userId` first** (if present), else **`sessionId`**.
3. If none exists, we sample a **variant key** using normalized weights from `trafficSplitJson`, excluding **`stoppedVariantKeys`**, and insert **`ExperimentAssignment`** (unique on `experimentId` + `sessionId`).
4. UI reads **`configJson`** only on the server for that request — no client-side randomization.

## Supported surfaces (MVP)

| `targetSurface` | Where it is wired |
|-----------------|-------------------|
| `lecipm_home_hero` | Marketing home headline / subhead (`LecipmHomeLanding`) |
| `lecipm_home_search_cta` | Home search primary button + `cta_click` on submit (`HomePrimarySearch`) |
| `bnhub_listing_cta` | Listing hero primary CTA + mobile sticky bar |
| `bnhub_listing_trust_line` | Stripe trust line under hero CTAs |
| `bnhub_booking_reassurance` | “No charge…” copy + checkout reassurance + `booking_start` |

## Events

Standard names: `page_view`, `listing_view`, `cta_click`, `booking_start`, `booking_complete`, `contact_click`.

Client surfaces POST to **`/api/experiments/track`**; the handler checks that the row exists for `(experimentId, variantId)` and `(sessionId | userId)` before inserting **`ExperimentEvent`**.

## Results (MVP)

- **Assignments** per variant ≈ exposures.
- **Primary metric rate** = count of events where `eventName = primaryMetric` ÷ assignments.
- **Lift vs control** uses the variant with key **`control`** if present, otherwise the first key lexicographically.
- Labels: **`needs_more_data`**, **`early_signal`**, **`likely_winner`** — heuristic thresholds only; **not** a claim of statistical significance.

## Future statistical upgrades

- Bayesian or frequentist sequential tests; multiple-comparison control; CUPED / regression-adjusted variance; holdouts; and cross-device identity merging beyond `userId` + `sessionId`.

## Admin

- List: `/[locale]/[country]/admin/experiments`
- Detail: `/[locale]/[country]/admin/experiments/[id]`

Seed drafts: `prisma/seed-experiments.ts` (invoked from main `prisma/seed.ts`).
