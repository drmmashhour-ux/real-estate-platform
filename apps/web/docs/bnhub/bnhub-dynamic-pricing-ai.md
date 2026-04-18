# BNHub dynamic pricing AI (advisory)

**Advisory only.** Suggestions never auto-apply to `nightPriceCents`. Hosts change prices through existing listing editors.

## Feature flags

| Flag | Purpose |
|------|---------|
| `FEATURE_BNHUB_DYNAMIC_PRICING_V1` (`revenueV4Flags.bnhubDynamicPricingV1`) | Enables extended advisory output on `POST /api/bnhub/host/pricing/suggest` as `advisory`. |
| `FEATURE_BNHUB_DYNAMIC_PRICING_APPLY_V1` | Reserved for a future **explicit** apply flow with confirmation + audit — **default off**. |

Legacy engine optional: `FEATURE_BNHUB_PRICING_ENGINE_V1` still controls the older `suggestion` object from `modules/bnhub-pricing/pricing-engine.service.ts`.

## Signals

- **Market**: `generateSmartPrice` / peer averages, demand ratio, seasonality (existing `lib/bnhub/smart-pricing.ts`).
- **Comps**: city median from published peers (`bnhub-market-pricing.service.ts`).
- **Funnel**: optional `AiConversionSignal` aggregates per listing (views, starts, completions).
- **Quality**: `ListingQualityScore` when present.

## Guardrails (`config/bnhub-ranking-pricing.config.ts`)

- `maxIncreasePct` / `maxDecreasePct` cap suggested moves.
- Low traffic widens bands and lowers confidence.
- High views + zero starts → downward bias + copy to fix listing before raising price.
- High starts + low completion → “hold / fix friction” before aggressive price moves.

## Monitoring

Prefix: `[bnhub:pricing]` — ranking monitor module (safe logging).

## Host UI

`BnhubPricingAdvisoryCard` loads the suggest endpoint and shows range, demand, confidence. Empty when flags off or API forbids.

## Admin

See **Admin → BNHUB → pricing** for funnel rollups and historical dynamic pricing profiles; advisory overview can be extended with bulk `computeBnhubAdvisoryPricing` jobs if needed.
