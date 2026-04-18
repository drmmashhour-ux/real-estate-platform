# Conversion rollout checklist (Instant Value / Conversion V1)

Rollout-only guide — **does not change product behavior.** Use alongside `FEATURE_*` env flags.

## Required flags (full stack experience)

| Goal | Env | Notes |
|------|-----|-------|
| Base intake + trust upgrades | `FEATURE_CONVERSION_UPGRADE_V1=1` | Trust strip, conversion CTAs, `/get-leads` monitoring hooks |
| Insight tiles + richer copy blocks | `FEATURE_INSTANT_VALUE_V1=1` | Requires conversion upgrade — enables listing/property insight surfaces where coded |
| Advisory urgency lines (listing context) | `FEATURE_REAL_URGENCY_V1=1` | Uses **real** signals only (freshness, optional demand hints) — no fabricated scarcity |

**Full tier:** all three enabled.

## Pages / surfaces affected (non-exhaustive)

- `/get-leads` — hero, TrustStrip, optional insight list, lead form monitoring (`recordLeadFormStart` / `recordLeadSubmit`).
- Browse listings (`LecipmListingsExplorer`) — instant summary strip when **both** conversion + instant value are on; listing card CTAs when conversion upgrade on.
- Listing detail (`BuyerListingDetail` / property conversion surface) — instant value + optional urgency when flags + data allow.
- Broker lead preview (`BrokerLeadPreview`) — gated combination of conversion + instant value for some blocks.
- Marketing home (`LecipmHomeLanding`, etc.) — optional `ConversionHomeBoost` when conversion upgrade on.

## Manual QA

1. **Flags off** — `/get-leads` shows baseline hero and form; no `[conversion]` lead monitoring from upgrade path (legacy growth tracker may still run).
2. **`FEATURE_CONVERSION_UPGRADE_V1=1` only** — Trust strip + conversion headline present; **no** three-tile insight list under hero; form still usable; monitoring increments on focus/submit **in the browser tab** for this session.
3. **Conversion + instant value on** — insight tiles appear where `buildInstantValueSummary` returns insights; listings explorer top strip appears when **both** flags true.
4. **+ real urgency on** — property detail shows urgency lines **only** when parsing yields supported signals (`real-urgency.service`).

## Expected monitoring events (stdout / structured logs)

When enabled, callers emit `logInfo("[conversion]", { event: ... })`:

| Event key | Typical trigger |
|-----------|------------------|
| `lead_form_start` | First interaction on `/get-leads` (upgrade on) |
| `lead_submit` | Successful POST |
| `listing_cta_click` | Listings grid CTA paths |
| `property_cta_click` | Listing detail CTAs |
| `broker_preview_cta_click` | Broker preview surfaces |

Verify in server logs or enable **`NEXT_PUBLIC_CONVERSION_MONITORING_DEBUG=1`** on `/get-leads` for an in-browser HUD (development only).

## In-process monitoring caveats

- Counters are **not durable** — restart deploy clears them.
- Server-side `/api/admin/conversion-rollout` reflects **Node process** totals (often low); browser-only events appear in **that tab’s** HUD when debug is enabled.
- Do **not** use these counters for billing or SLA — advisory / QA only.

## Operational env (optional)

| Env | Purpose |
|-----|---------|
| `NEXT_PUBLIC_CONVERSION_MONITORING_DEBUG=1` | Floating debug panel on `/get-leads` — live tab counters + recent events |
| `NEXT_PUBLIC_CONVERSION_DEBUG_UI=1` | Small operator/dev flag strip + notes on `/get-leads` |
| `?conversion_debug=1` | Same as debug UI strip without redeploy (query param on `/get-leads`) |

## Rollback

Disable `FEATURE_CONVERSION_UPGRADE_V1` (and dependents) — UI reverts to baseline paths wired in components.
