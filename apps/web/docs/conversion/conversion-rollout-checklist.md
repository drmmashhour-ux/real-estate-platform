# Conversion engine rollout checklist (instant value + conversion upgrade)

Use this before promoting conversion flags in production-like environments. This document governs **rollout safety and observability** only — it does not change product logic.

> **Related:** Legacy filename `rollout-checklist.md` points here; prefer this file for the full QA + monitoring matrix.

## Required environment flags

### Full experience (conversion upgrade + instant value tiles + advisory urgency where wired)

| Variable | Typical value | Notes |
|----------|-----------------|-------|
| `FEATURE_CONVERSION_UPGRADE_V1` | `1` | Enables upgraded trust copy, CTAs, and monitoring hooks on gated surfaces. |
| `FEATURE_INSTANT_VALUE_V1` | `1` | Enables insight tiles / richer summaries where each surface checks **both** flags. |
| `FEATURE_REAL_URGENCY_V1` | `1` | Enables **advisory** demand/recency lines on property (via `buildRealUrgencySignals`) — no countdowns. |

### Rollout gating (recommended during pilots)

| Variable | Purpose |
|----------|---------|
| `CONVERSION_ROLLOUT_MODE` | `off` \| `internal` \| `partial` \| `full` — who receives effective conversion flags. |
| `CONVERSION_ROLLOUT_PARTIAL_PATHS` | Comma-separated prefixes after locale stripping, e.g. `/get-leads,/listings`. |
| `FEATURE_CONVERSION_KILL_SWITCH` | `1` / `true` — immediate off (server). Pair with `NEXT_PUBLIC_FEATURE_CONVERSION_KILL_SWITCH` for client bundles built for production. |

### Observability (non-production or controlled QA)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CONVERSION_MONITORING_DEBUG` | `1` — floating in-tab counter HUD on surfaces that mount `ConversionMonitoringLivePanel` (e.g. `/get-leads` when wired). |
| `NEXT_PUBLIC_CONVERSION_DEBUG_UI` | `1` — or URL `?conversion_debug=1` on `/get-leads` — shows internal flag/tier strip (admin QA). |

## Effective experience tiers (deployment flags)

From **raw** `FEATURE_*` values (admin **Conversion rollout** page):

1. **Base conversion only** — `FEATURE_CONVERSION_UPGRADE_V1` off.
2. **Conversion upgrade (no IV row)** — upgrade on, `FEATURE_INSTANT_VALUE_V1` off: trust strip + headline + intake; **no** three-card insight row.
3. **Conversion + instant value** — upgrade + instant value on, `FEATURE_REAL_URGENCY_V1` off: insight tiles where the surface enables them.
4. **Conversion + instant value + real urgency** — all three on: property advisory lines when `buildPropertyConversionSurface` / real-urgency wiring applies.

Path-level **effective** flags (kill switch, `internal`/`partial` mode) may differ — use dev **Conversion flags** panel (`?debug=1` or non-production) for route-specific effective flags.

## Pages / surfaces affected

| Surface | Upgrade | Instant value tiles | Real urgency |
|---------|---------|---------------------|----------------|
| Marketing home (`ConversionHomeBoost`) | Upgrade | Both required for tiles | N/A |
| `/get-leads` | Upgrade | Both for hero insight list | N/A |
| Listings explorer top block | Both | Both required | — |
| Property detail (`buildPropertyConversionSurface`) | Upgrade | Summary always when upgrade on | `FEATURE_REAL_URGENCY_V1` |
| Broker lead preview | Both for combined CTA path | See `BrokerLeadPreview` | — |

## Manual QA checklist

1. **Kill switch** — Set `FEATURE_CONVERSION_KILL_SWITCH=1`; confirm conversion UI hidden and APIs that gate on flags return disabled as designed.
2. **`internal` mode** — Anonymous user: no upgrade; logged-in ADMIN/ACCOUNTANT: upgrade where path allows.
3. **`partial` mode** — Only allowlisted paths show upgrade; verify normalized path (`/en/ca/get-leads` → `/get-leads`).
4. **`/get-leads`** — Upgrade on, IV **off**: hero + trust strip + primary CTA; **no** empty insight card row; form still works; `recordConversionSurfaceView("get-leads")` once per load (logs).
5. **`/get-leads`** — Both upgrade + IV on: up to three insight cards under hero when insights exist.
6. **Lead funnel** — First focus on name/contact records **one** `lead_form_start` per tab session; successful POST increments `lead_submit` (see monitoring).
7. **Listings** — Instant summary block appears only when **both** upgrade + IV on.
8. **Property** — With urgency flag on, lines are advisory (recency/views), not fabricated scarcity.

## Expected monitoring events (in-process)

Counters live in **`conversion-monitoring.service`** (browser bundle for visitor actions). **Not durable** — reset on refresh in many cases; server admin APIs aggregate **per Node process** only.

| Event helper | When |
|--------------|------|
| `recordLeadFormStart` | `/get-leads` step 2 first focus (deduped per tab/session key). |
| `recordLeadSubmit` | Successful `POST /api/growth/early-leads`. |
| `recordListingCtaClick` | Listings grid opportunity CTA (requires `surface` + `listingId`). |
| `recordPropertyCtaClick` | Listing detail contact CTA (requires `surface` + `listingId`). |
| `recordBrokerPreviewCtaClick` | Broker preview unlock/start path (requires `surface`). |
| `recordConversionSurfaceView` | Surface impression (e.g. `get-leads`). |

Structured logs: `[conversion]` — pair with admin **Conversion monitoring** or **Conversion rollout** pages for smoke checks.

Verification helper map: `modules/conversion/conversion-monitoring-verify.ts` (`CONVERSION_EVENT_VERIFICATION_MAP`).

## Caveats (in-process monitoring)

- Counts **do not survive** deploy/restart and are **not shared** across horizontally scaled instances.
- Browser dedupe (`sessionStorage`) means server-side snapshots **do not** include visitor-only events.
- Use for rollout sanity and regression detection — **not** billing, SLA, or compliance metrics.

## Safe enable sequence (summary)

1. Confirm kill switches **off** in target environment.
2. `CONVERSION_ROLLOUT_MODE=internal` — verify with privileged account on `/get-leads`, listings, one property.
3. `partial` + narrow allowlist (e.g. `/get-leads` only).
4. Enable `FEATURE_INSTANT_VALUE_V1`, then `FEATURE_REAL_URGENCY_V1`, validating each step.
5. On incident: **`FEATURE_CONVERSION_KILL_SWITCH=1`** first, then investigate.
