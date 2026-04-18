# Platform hub journey + copilot (LECIPM)

## Purpose

Read-only **guided journeys** and **copilot suggestions** help users see:

- Where to start in a hub
- What is already reflected as done (from platform signals)
- What likely comes next
- What may be blocking progress

This layer **does not** auto-execute sensitive actions, **does not** auto-send messages, and **does not** change Stripe, bookings, or CRM data.

## Supported hubs

`buyer`, `seller`, `rent`, `landlord`, `bnhub_guest`, `bnhub_host`, `broker`, `investor`, `admin`

Definitions live in `apps/web/modules/journey/hub-journey-definitions.ts`.

## Step-by-step approach

1. Load ordered steps for the hub.
2. Merge **read-only context** from `buildHubJourneyContextFromDb` (safe partial data).
3. `buildHubJourneyPlan` assigns step status (`completed`, `in_progress`, `locked`, `blocked`) and progress percent.
4. `detectHubBlockers` adds human-readable blockers; the current step may flip to `blocked` when appropriate.
5. `buildHubCopilotState` returns 1–3 explainable suggestions (deterministic rules).

## Copilot behavior

- Suggestions are **short**, **specific**, and cite **basedOn** reason keys (e.g. `saved_listings`, `journey_plan`).
- Routes are **navigation hints** only; users must complete actions in existing flows.

## Blocker logic

`detectHubBlockers` returns concise strings (e.g. missing profile fields, unlocked-but-not-contacted leads). Never includes secrets.

## Feature flags

| Env | Meaning |
|-----|---------|
| `FEATURE_HUB_JOURNEY_V1=1` | Stepper + next-step cards + progress |
| `FEATURE_HUB_COPILOT_V1=1` | Copilot suggestion cards (journey can remain off) |

Defaults: **off**. See `apps/web/.env.example`.

In code: `engineFlags.hubJourneyV1`, `engineFlags.hubCopilotV1` in `apps/web/config/feature-flags.ts`.

## Safety guarantees

- Deterministic resolution from definitions + context (no LLM in v1).
- No mutation of user input objects in journey builders.
- API `GET /api/journey/[hub]` is read-only JSON.

## Monitoring

`hub-journey-monitoring.service.ts` tracks counters and logs `[journey]` lines; helpers never throw.

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/journey/__tests__
```

## API

`GET /api/journey/{hub}?locale=en&country=ca` returns `{ plan, copilot, flags }` when enabled.

## Where it appears in the app

Server-rendered **HubJourneyBanner** (stepper, next step, blockers, copilot when flags allow) is wired at the top of hub surfaces including: buyer, seller, rent (marketing entry), landlord, broker, investor dashboards; BNHub guest (`bnhub`, guest-hub); BNHub host dashboard; admin dashboard, admin growth-dashboard, and **Growth Machine** (`/dashboard/growth`, admins only for the operator journey). All respect `FEATURE_HUB_JOURNEY_V1` / `FEATURE_HUB_COPILOT_V1`; when both are off, banners render nothing.
