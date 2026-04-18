# Instant Value + Conversion Engine (V1)

## Purpose

Improve **perceived value**, **trust**, and **conversion** on public and broker-facing surfaces without changing Stripe, booking, ranking, or core lead processing. All enhancements are **UI and advisory-first** and can be toggled off via feature flags (default **off**).

## Supported surfaces

| Surface | Behavior |
|--------|-----------|
| Homepage | `ConversionHomeBoost` when `FEATURE_CONVERSION_UPGRADE_V1` — hero intent, optional instant-value insights when `FEATURE_INSTANT_VALUE_V1`. |
| Get leads | With `FEATURE_CONVERSION_UPGRADE_V1`: headline/subhead/trust/CTA from `buildInstantValueSummary`; **insight pills** also require `FEATURE_INSTANT_VALUE_V1`. `IntentSelector`, premium success, monitoring — same `POST /api/growth/early-leads` + UTM. |
| Listings browse | Compact “Recommended opportunities” callout when both conversion + instant-value flags are on; listing CTA monitoring. |
| Property detail | Server-built `buildPropertyConversionSurface` — headline, insights, real urgency lines, `TrustStrip`, dual mobile sticky CTA when conversion upgrade is on. |
| Broker preview | `BrokerLeadPreview` with optional `conversionBoost` — instant-value framing + trust lines + CTA monitoring. |

## Insight logic

- **`buildInstantValueSummary`** (`apps/web/modules/conversion/instant-value.service.ts`) is **deterministic** and uses only fields passed in `BuildInstantValueInput` (page, intent, optional listing/listings context, optional trust flags). It does **not** invent prices, demand scores, or inventory counts beyond what the caller supplies.
- **`buildPropertyConversionSurface`** (`property-conversion-surface.ts`) composes instant value with **`buildRealUrgencySignals`** when `FEATURE_REAL_URGENCY_V1` is on, using listing `updatedAt`, optional demand UI activity strings, and parsed view hints where formats match.

## Trust strip

- **`TrustStrip`** (`apps/web/components/shared/TrustStrip.tsx`) shows short, **supported** statements. Callers may pass `lines` from `InstantValueSummary.trustLines` (same source of truth as the instant-value service).

## Urgency rules (`real-urgency.service.ts`)

Allowed:

- Recently updated listing (real date window).
- High-intent / activity when the caller passes real flags or parsed view counts from known copy formats.
- Verified-inventory scope messaging when explicitly passed.

Disallowed:

- Fake countdowns, invented “only X left”, invented social proof.

## Feature flags

Set in environment (see `apps/web/.env.example`):

- `FEATURE_INSTANT_VALUE_V1` — richer instant-value copy blocks.
- `FEATURE_CONVERSION_UPGRADE_V1` — conversion UX layers (home, get-leads, listings strip, property/sticky, broker preview boost, monitoring hooks).
- `FEATURE_REAL_URGENCY_V1` — advisory urgency lines on property when combined with conversion upgrade.

Defined in `apps/web/config/feature-flags.ts` as `conversionEngineFlags`.

## Monitoring

`apps/web/modules/conversion/conversion-monitoring.service.ts` increments in-process counters and logs `[conversion]` events. It **never throws**. Use `getConversionMonitoringSnapshot()` for diagnostics and `resetConversionMonitoringForTests()` in tests.

## Safety guarantees

- **No fake data** — no fabricated urgency, scarcity, or metrics.
- **No business logic mutation** — no changes to Stripe webhooks, booking engines, ranking algorithms, or lead persistence; additive UI and copy only.
- **Graceful degradation** — services accept partial inputs and return safe defaults.
