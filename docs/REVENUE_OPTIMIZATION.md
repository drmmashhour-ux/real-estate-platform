# Revenue optimization system

End-state for mortgage funnel monetization: lead value, AI-style tiering, credit costs, premium routing, analytics, and ops hooks.

## Data model (`Lead`)

| Field | Purpose |
| ----- | ------- |
| `estimatedValue` | CAD estimate (purchase price or derived). |
| `conversionProbability` | Heuristic 0–1 from tier. |
| `valueSource` | How value/tier was derived (e.g. `mortgage_form+ai_rule`). **Traffic UTM stays on `source`.** |
| `revenueTier` | `HIGH` / `MEDIUM` / `LOW`. |
| `mortgageCreditCost` | Credits deducted on assign/claim (`HIGH=3`, `MEDIUM=1`, `LOW=0`). |
| `dynamicLeadPriceCents` | Internal list price from tier × region demand. |
| `serviceCommissionRate` | Platform % at close (`0.30` for mortgage; override per lead for other services). |
| `mortgageAssignedAt` / `mortgageSlaReminderAt` | SLA automation. |
| `revenueAbVariant` | Mortgage CTA A/B (`A`/`B`). |
| `purchaseRegion` | City/region for pricing + reports. |

`MortgageExpert`: optional flags `revenuePremiumListing`, `revenueFeaturedExpert`, `revenuePremiumPlacement` for future billing / admin toggles.

## Scoring

- **`lib/ai/lead-score.ts`**: `scoreLeadRevenueTier()` from budget, price, location, urgency → `HIGH` / `MEDIUM` / `LOW`.
- **`lib/revenue/dynamic-pricing.ts`**: `computeDynamicLeadPriceCents()`.

## Routing & credits

- **HIGH**: auto-assign only to **`premium`** subscription experts; else marketplace. Claim requires **premium** + enough credits (`mortgageCreditCost` default from tier).
- **MEDIUM / LOW**: existing pool; credits per tier.
- **Performance**: `lib/mortgage/distribution-score.ts` adjusts routing score from ratings, deals, reviews.

## Commission

- **`POST .../close-deal`**: uses `lead.serviceCommissionRate` when set, else expert `commissionRate` (default 30%).

## Admin

- **`/admin/revenue-optimization`**: conversion, $/lead, tiers, A/B counts, top regions, top experts (30d).

## Cron (set `CRON_SECRET`)

| Route | Purpose |
| ----- | ------- |
| `POST /api/cron/mortgage-lead-contact-sla` | Assigned `new` leads, no contact 24h+ → expert notification + admin email. |
| `POST /api/cron/mortgage-expert-retention` | In-app performance digest for active experts (schedule weekly). |
| Existing `mortgage-expert-daily` | Daily caps reset. |

## Validation checklist

1. Submit `/mortgage` form → row has `revenueTier`, `mortgageCreditCost`, `dynamicLeadPriceCents`, `serviceCommissionRate`.
2. HIGH lead → only premium auto-assigned; marketplace shows “Premium only”; non-premium claim → 403.
3. Claim lead → expert credits decrease by `mortgageCreditCost`.
4. Close deal → commission uses `serviceCommissionRate` on lead when present.
5. Admin dashboard shows aggregates.

## Final report template

| Area | Status |
| ---- | ------ |
| Lead scoring | OK if tiers + fields persist on create |
| Pricing system | OK if `dynamicLeadPriceCents` + region multipliers set |
| Upsell system | OK if Premium banner + billing add-ons + claim gate |
| Analytics | OK if `/admin/revenue-optimization` loads |

**Verdict:** **REVENUE OPTIMIZED** when all four are OK in staging/production after migration.
