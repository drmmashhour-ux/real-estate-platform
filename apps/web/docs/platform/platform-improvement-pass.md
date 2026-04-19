# Platform improvement — internal execution bridge

## Feature flag

| Variable | Purpose |
|----------|---------|
| `FEATURE_PLATFORM_IMPROVEMENT_REVIEW_V1` | Enables the admin UI, diagnostic bundle generation, execution state, and APIs. Off → page shows **“Platform improvement system is disabled (enable FEATURE_PLATFORM_IMPROVEMENT_REVIEW_V1)”** and APIs return **404**. |

Configured in `config/feature-flags.ts` as `platformImprovementFlags.platformImprovementReviewV1`.

Optional persistence override (same spirit as broker pipeline):

| Variable | Purpose |
|----------|---------|
| `PLATFORM_IMPROVEMENT_STATE_JSON_PATH` | Absolute or repo-relative JSON path for durability. Default: `apps/web/data/platform-improvement-state.json`. Legacy `platform-improvement-operator-state.json` v1 is **auto-migrated** on first load. |

## Who can access

- **Admin control** operators only (`requireAdminControlUserId`).
- Same guard on APIs (`requireAdminUser`).

## Route

- **`/admin/platform-improvement`** (plus locale/country prefixes if your app adds them).

## Primary Go fix → mapping (category → admin route)

Deterministic primary link only — secondary links still come from each priority’s `executionLinks` (see `primaryGoFixHref` in `modules/platform/platform-improvement-links.constants.ts`).

| Priority category | Primary route |
|-------------------|---------------|
| conversion | `/admin/growth-engine` |
| revenue | `/admin/growth` |
| trust | `/admin/bnhub` |
| ops | `/admin` |
| data | `/admin/dashboard` *(rollup spine — no `/admin/mission-control` route in app today)* |
| broker *(meta / acquisition hints)* | `/admin/brokers-acquisition` via supplementary links where surfaced |

This UI **never** calls Stripe, booking, ranking APIs, or mutates product core — it only tracks operator intent and links out to normal admin surfaces.

## Status meanings

| Status | Meaning |
|--------|---------|
| `new` | Surfaced by the diagnostic engine — not yet triaged. |
| `acknowledged` | Operator has seen it; intent to address. |
| `planned` | Scoped / scheduled internally (outside this UI). |
| `in_progress` | Active work in flight elsewhere. |
| `done` | Resolved for this cycle. |
| `dismissed` | Won’t pursue now (explicit). |

Linear path enforced: **new → acknowledged → planned → in_progress → done**. **Dismiss** allowed before terminal. **Reopen** from done/dismissed → acknowledged.

## Weekly vs daily workflow

### Daily (~10 min)

1. Open the page (bundle regenerates on load).
2. Scan **Follow-through** (counts + progress bar).
3. Use **Go fix →** + secondary links for the canonical admin surface (`/admin/growth`, `/admin/growth-engine`, `/admin/bnhub`, `/admin/brokers-acquisition`, `/admin`, `/admin/dashboard`, …).
4. Advance items with **Acknowledge → Plan → Start → Mark done** (or **Dismiss**) — stored with timestamps server-side.

### Weekly

1. Read **Top 3 this week** (`YYYY-Www` UTC label): max **three** priorities with **highest urgency × category × impact proxy**, **excluding done/dismissed**.
2. Align owner buckets (`growth | product | ops | revenue`) with your stand-up.
3. Optionally skim **Recent status changes** log at the bottom.

## What this system does

- Keeps diagnostics **read-only**; operators execute work **outside** this UI.
- Tracks **intent + timeline** (`PlatformPriorityRecord`), not tickets.
- Lightweight **cross-priority history** (bounded list).

## What **not** to do

- **No** Stripe, checkout, BNHub booking, ranking, lead unlock, or payment mutations from this surface.
- **No** auto-deploy or auto-flag changes — ever.
- **No** full PM feature creep — no assignees, comments, or SLA engines here.

## Persistence

Default file: **`data/platform-improvement-state.json`** (version `2`). Migrates legacy v1 JSON if present.

## Modules (quick map)

| Area | Module |
|------|--------|
| Types (`PlatformPriorityStatus`, `PlatformPriorityRecord`, bundle) | `modules/platform/platform-improvement.types.ts` |
| State + JSON persistence + follow-through + global history | `modules/platform/platform-improvement-state.service.ts` |
| Valid transitions + quick actions | `modules/platform/platform-improvement-operator-transitions.ts` |
| Weekly focus (`buildWeeklyFocusList`, max 3) | `modules/platform/platform-improvement-priority.service.ts` |
| UTC week label (`weekKey`) | `modules/platform/platform-improvement-weekly-focus.service.ts` |
| Thin history re-export | `modules/platform/platform-improvement-history.service.ts` |
| Panel UI | `components/platform/PlatformImprovementPanel.tsx` |
| Status buttons | `components/platform/PlatformImprovementExecutionActions.tsx` |

## APIs

| Method | Path | Body |
|--------|------|------|
| GET | `/api/platform/improvement-review` | — returns diagnostic bundle (`weekKey`, priorities; weekly focus computed only on HTML page unless you replicate `buildWeeklyFocusList` server-side elsewhere). |
| POST | `/api/platform/improvement-review/priority-status` | `{ priorityId, action }` **or** `{ priorityId, nextStatus }` — admin + flag required. |

## Tests

See `modules/platform/__tests__/platform-improvement*.test.ts` — transitions, weekly focus exclude rules, state persistence, panel empty states.
