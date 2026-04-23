# Soins Hub revenue model

This document describes how **Soins Hub** recurring revenue is modeled in code (`apps/web/modules/soins-revenue/`), how family and monitoring add-ons are priced, how billing rules (proration, overdue, suspension) behave, and which report shapes feed **admin dashboards**, **transactions views**, **daily email reports**, and **mobile admin summaries**.

## Pricing components

Monthly resident quote:

```text
monthlyTotal =
  baseResidencePrice
  + residenceTierUplift (optional)
  + careLevelPrice
  + foodPlanPrice
  + specialDietSurcharge (optional)
  + selectedServicesPrice (array of line items)
  + familyAccessAddons (catalog)
  + monitoringAddons (catalog)
```

Implementation: `calculateMonthlyResidentialTotal()` in `soins-pricing-engine.service.ts`.

### Residence and care tiers

- **Residence tier** (`SoinsResidenceTier`): optional uplift for facility/program band — `INDEPENDENT`, `ASSISTED`, `MEDICAL`. Maps to `RESIDENCE_TIER_MONTHLY` in the pricing engine.
- **Care tier** (`SoinsCareTier`): clinical package uplift — `INDEPENDENT`, `ASSISTED`, `MEMORY_CARE`, `SKILLED`.

Independent / assisted / medical appear in both dimensions; operators can use **residence tier** for bed/program and **care tier** for services, or only one axis depending on catalog.

### Food model

Food tier (`SoinsFoodTier`):

| Tier      | Meaning        |
| --------- | -------------- |
| `NONE`    | No meals       |
| `ONE_MEAL`| One meal / day |
| `FULL`    | Full meal plan |

Optional **`specialDietSurcharge`** (monthly) adds a `SPECIAL_DIET` line in the breakdown.

### Family access monetization

Catalog: `FAMILY_ADDON_LIST_PRICES` in `soins-revenue-catalog.ts`.

| Key                      | Purpose                      |
| ------------------------ | ---------------------------- |
| `CAMERA_ACCESS`          | Camera / live view           |
| `ADVANCED_ALERTS`        | Richer alerting              |
| `FAMILY_PREMIUM_DASHBOARD` | Aggregated family UI     |
| `MULTI_FAMILY_MEMBER_SLOT` | Extra household seats    |
| `ARCHIVED_CHAT_HISTORY`  | Long-term chat / history     |

Helpers: `calculateFamilyAddonMonthlyTotal()`, `priceMultiMemberSlots()` in `soins-family-subscription.service.ts`.

### Premium monitoring

Catalog: `MONITORING_ADDON_LIST_PRICES` — e.g. standard ops monitoring, AI summary, escalation playbook.

## Recurring revenue logic

- **Quote vs ledger**: The pricing engine produces a **monthly breakdown** for quotes and invoices. **Recognized revenue** for reporting should come from **`RevenueLedgerEntry`** rows (amounts actually billed or allocated), not from recomputing the formula unless doing a forecast.
- **MRR (approximate)** in `buildSoinsRevenueSummary()` sums ledger lines whose `category` is one of: `RESIDENCE_SUBSCRIPTION`, `FAMILY_ADDON`, `MONITORING`, `SERVICE_FEE`. Tune this list if your finance definition differs.
- **Daily revenue (approx.)**: Total in-window revenue divided by period length in days — useful for admin charts and daily email snapshots.

## Billing rules

Configured via `BillingRulesConfig` (`DEFAULT_BILLING_RULES`):

| Rule                     | Default | Role                                      |
| ------------------------ | ------- | ----------------------------------------- |
| `graceDays`              | 5       | Days after due still treated as grace     |
| `suspendAfterOverdueDays`| 21      | Recommend suspension after this lateness  |
| `remindBeforeDueDays`    | 3       | “Payment due soon” notification window   |

Functions:

- **`proratePartialMonth`**: Calendar-day inclusive proration inside `[periodStart, periodEnd]`. If `serviceStart` is after `periodEnd`, fraction is `0`.
- **`classifyOverdueStatus`**: If `paidDate` is set, status is **`CURRENT`** (payment recorded). Otherwise late days map to `GRACE` / `OVERDUE` / `SUSPENDED` per rules. Preserves `CANCELLED` / `SUSPENDED` terminal states from input when appropriate.
- **`billingNotificationTriggers`**: Emits triggers such as `PAYMENT_DUE_SOON`, `OVERDUE`, `SERVICE_SUSPENDED`, `ADD_ON_CHANGED` for orchestration / email / push.
- **`shouldSuspendService`**: Boolean policy check from days past due.

## Platform revenue (ledger categories)

Track platform earnings with `RevenueLedgerEntry.category`:

- `RESIDENCE_SUBSCRIPTION` — bed / recurring residence SaaS
- `LISTING_FEE` — listing / placement fees
- `SERVICE_FEE` — platform or operator service fees
- `FAMILY_ADDON` — family SaaS add-ons (`serviceType` can hold the addon key)
- `MONITORING` — monitoring packages
- `ONBOARDING_SETUP` — setup / onboarding

**Overdue exposure (reporting convention):** ledger lines with `serviceType === "OVERDUE_BALANCE"` roll into **`overdueTotal`** in `buildSoinsRevenueSummary()`. Emit these from collections / AR logic when integrating with persistence.

## Reporting metrics

| Function                             | Output |
| ------------------------------------ | ------ |
| `buildSoinsRevenueSummary`           | MRR-ish total, daily revenue approx, by residence, by category, family add-on rollup, overdue total, period bounds |
| `buildResidenceRevenueBreakdown`     | Per-residence subscription/listing, service fees, family share, monitoring share, `mrrContribution` |
| `buildFamilySubscriptionRevenueSummary` | Total family addon revenue, **byAddon** split when `serviceType` matches addon key |

## Admin visibility (Part 7)

These VMs are intentionally JSON-serializable for:

- **Admin revenue dashboard**: `SoinsRevenueSummaryVm` + charts from `revenueByResidence` / `revenueByCategory`.
- **Transactions page**: Raw or filtered `RevenueLedgerEntry[]` (not duplicated here — wire from DB).
- **Daily report email**: `mrr`, `dailyRevenueApprox`, `overdueTotal`, period strings.
- **Mobile admin summary**: Same summary object; trim fields in the API layer if needed.

## Files

| File | Role |
| ---- | ---- |
| `soins-revenue.types.ts` | Types for pricing, ledger, VMs |
| `soins-revenue-catalog.ts` | Default list prices for family + monitoring |
| `soins-pricing-engine.service.ts` | Monthly quote breakdown |
| `soins-family-subscription.service.ts` | Family addon totals / multi-seat |
| `soins-billing-rules.service.ts` | Proration, overdue, triggers, suspension |
| `soins-revenue-report.service.ts` | Summary and breakdown builders |
