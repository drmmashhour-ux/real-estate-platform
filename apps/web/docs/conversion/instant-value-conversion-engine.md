# Instant Value + Conversion Engine (V1)

Canonical copy also lives at `docs/conversion/instant-value-conversion-engine.md` (repo root).

## Purpose

Improve **perceived value**, **trust**, and **conversion** on public and broker-facing surfaces without changing Stripe, booking, ranking, or core lead processing. All enhancements are **UI and advisory-first** and can be toggled off via feature flags (default **off**).

## Supported surfaces

| Surface | Behavior |
|--------|-----------|
| Homepage | `ConversionHomeBoost` when `FEATURE_CONVERSION_UPGRADE_V1` — hero intent, optional instant-value insights when `FEATURE_INSTANT_VALUE_V1`. |
| Get leads | With `FEATURE_CONVERSION_UPGRADE_V1`: headline, subhead, trust strip, CTA from `buildInstantValueSummary`; **insight pills** require `FEATURE_INSTANT_VALUE_V1` as well. `IntentSelector`, premium success, `recordLeadFormStart` / `recordLeadSubmit`. Same `POST /api/growth/early-leads` + UTM. |
| Listings browse | “Recommended opportunities” callout when **both** conversion + instant-value flags; listing CTA monitoring. |
| Property detail | `buildPropertyConversionSurface` — value block, real urgency when `FEATURE_REAL_URGENCY_V1`, mobile sticky CTAs. |
| Broker preview | `BrokerLeadPreview` + `conversionBoost` when conversion upgrade. |

## Validation

From `apps/web`:

```bash
pnpm exec vitest run modules/conversion/__tests__/
```

See root doc for insight logic, trust strip, urgency rules, flags, monitoring, and safety guarantees.
