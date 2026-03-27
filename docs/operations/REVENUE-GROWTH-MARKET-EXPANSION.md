# Revenue, Growth, and Market Expansion Layer

This document describes the commercial platform layer that makes LECIPM measurable, monetizable, and ready for multi-market expansion.

## 1. Revenue Intelligence Layer

**Purpose:** Track, explain, and optimize all revenue sources with auditability.

**Components:**
- **RevenueLedgerEntry** – Every revenue or cost event: type (BOOKING_COMMISSION, SUBSCRIPTION, PROMOTION, REFERRAL_COST, REFUND, CHARGEBACK, INCENTIVE, PAYOUT), entityType/entityId, amountCents (positive = revenue, negative = cost), marketId, module, userId.
- **RevenueReport** – Stored aggregated reports (reportType, periodStart/End, marketId, data JSON).

**Integration:**
- **Bookings:** When Stripe confirms payment (`POST /api/stripe/webhook`, `checkout.session.completed` for bookings), platform payment, commissions, and revenue ledger are updated (no mock pay endpoint).
- **Subscriptions:** When an invoice is paid, call `recordSubscriptionRevenue` (or `recordRevenueEntry` type SUBSCRIPTION).
- **Promotions:** When a listing is promoted with cost, `promoteListing` records a PROMOTION revenue entry.
- **Referrals:** When referral rewards are paid, record REFERRAL_COST (negative).

**APIs:**
- `GET /api/admin/revenue?periodStart=&periodEnd=&marketId=&type=summary|ledger` – Summary or paginated ledger.
- `POST /api/admin/revenue/record` – Manually record an entry (admin).

**Admin UI:** `/admin/revenue` – Summary by type, recent ledger table.

---

## 2. Subscription and Billing Layer

**Purpose:** Paid platform features with plans, trials, invoices, and entitlements.

**Components:**
- **SubscriptionPlan** – name, slug, module (BROKER_CRM, HOST_PRO, OWNER_ANALYTICS, INVESTOR_ANALYTICS, ENTERPRISE), billingCycle (MONTHLY, YEARLY), amountCents, trialDays, features (JSON).
- **Subscription** – userId, planId, status (ACTIVE, TRIALING, PAST_DUE, CANCELED, EXPIRED), currentPeriodStart/End, cancelAtPeriodEnd.
- **Invoice** – subscriptionId, amountCents, status (DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE), dueDate, paidAt, invoiceNumber.
- **BillingEvent** – subscriptionId, userId, eventType, amountCents, metadata (audit trail).

**APIs:**
- `GET/POST /api/admin/subscriptions/plans` – List and create plans.
- `GET/POST /api/admin/subscriptions` – List subscriptions (filter by userId, status), create subscription (userId, planId, trialDays).

**Entitlements:** Use `hasEntitlement(userId, feature)` in dashboards and APIs to gate features (e.g. analytics, maxListings). Plan `features` JSON defines keys like `analytics: true` or `maxListings: 10`.

**Admin UI:** `/admin/subscriptions` – Plans grid, recent subscriptions table.

---

## 3. Promotion and Marketplace Monetization Layer

**Purpose:** Featured listings, sponsored placement, boosts with billing and transparency.

**Components:**
- **PromotionCampaign** – name, campaignType (FEATURED, SPONSORED, BOOST), marketId, budgetCents, startAt, endAt, status (DRAFT, ACTIVE, PAUSED, ENDED).
- **PromotedListing** – listingId, campaignId, startAt, endAt, placement (FEATURED, SPONSORED, BOOST), costCents, status.

**Search integration:** `searchListings` in `lib/bnhub/listings.ts` calls `getActivePromotedListingIds({ placement: "FEATURED" })` and reorders results so featured listing IDs appear first. Use `getListingPromotion(listingId)` to show "Sponsored" or "Featured" label in the UI.

**APIs:**
- `GET/POST /api/admin/promotions` – List and create campaigns.
- `POST /api/admin/promotions/promote` – Add listing to campaign (listingId, campaignId, startAt, endAt, placement, costCents).

**Admin UI:** `/admin/promotions` – Campaigns table with promotion counts and dates.

---

## 4. Growth and Acquisition Layer

**Purpose:** Referral campaigns, invite flows, onboarding, acquisition attribution.

**Components:**
- **GrowthCampaign** – name, campaignType (REFERRAL, INVITE, ACQUISITION), marketId, startAt, endAt, status, config (JSON).
- **AcquisitionSource** – userId, campaignId, source, medium, utmCampaign (attribution at signup).
- **OnboardingMilestone** – userId, milestoneKey (e.g. PROFILE_COMPLETE, FIRST_LISTING), completedAt, metadata.

**APIs:**
- `GET/POST /api/admin/growth/campaigns` – List and create growth campaigns.

**Usage:** Call `recordAcquisitionSource` when a user signs up (with UTM or referral code). Call `completeOnboardingMilestone` when user completes profile, first listing, etc.

**Admin UI:** `/admin/growth` – Growth campaigns table.

---

## 5. Localization and Multi-Market Expansion Layer

**Purpose:** Launch in multiple cities/regions/countries with currency, language, tax, and policy bindings.

**Components:**
- **MarketConfig** – code, name, country, currency, defaultLanguage, active. (BNHub lodging tax: platform-wide Québec GST/QST via `lib/tax/quebec-tax-engine.ts`, not per-market `taxRatePercent`.)
- **MarketTaxRule** – marketId, ruleType (VAT, GST, PLATFORM_FEE), ratePercent, effectiveFrom, effectiveTo.
- **MarketPolicyBinding** – marketId, policyRuleKey, overridePayload, active (bind or override policy rules per market).

**APIs:**
- `GET/POST /api/admin/markets` – List and upsert markets.

**Usage:** Use `getMarketByCode` / `resolveMarketFromLocation(city, country)` when recording revenue or applying policy. Use `getMarketTaxRules` and `getMarketPolicyBindings` in billing and policy engine for market-specific behavior.

**Admin UI:** `/admin/markets` – Market configuration table with tax/policy counts.

---

## 6. CRM and Lifecycle Automation Layer

**Purpose:** Lifecycle stages, activity tracking, reactivation hooks.

**Components:**
- **LifecycleState** – userId, stage (ONBOARDING, ACTIVE, AT_RISK, CHURNED, REACTIVATED), module, lastActivityAt, metadata.

**Usage:** Call `setLifecycleState` when stage changes; call `touchLifecycleActivity(userId, module)` on login, booking, listing create. Use `getUsersByLifecycleStage` for reactivation or nudge campaigns.

---

## 7. Executive Business Dashboard Layer

**Purpose:** GMV, net revenue, MRR/ARR, bookings, active hosts, refund/dispute rates for leadership.

**Components:**
- **ExecutiveMetricsSnapshot** – date, marketId (or __GLOBAL__), gmvCents, netRevenueCents, bookingsCount, activeHostsCount, activeBrokersCount, mrrCents, arrCents, refundRate, disputeRate, data (JSON).

**APIs:**
- `GET /api/admin/executive?action=snapshot|list&date=&marketId=&from=&to=` – Build snapshot on the fly or list stored snapshots.
- `POST /api/admin/executive` – Persist snapshot for date (and optional marketId).

**Admin UI:** `/admin/executive` – Today’s snapshot cards (GMV, net revenue, bookings, hosts, MRR, ARR, refund rate, dispute rate), table of recent stored snapshots.

---

## Cross-System Integration

| System           | Revenue | Subscriptions | Promotions | Growth | Markets | Lifecycle |
|-----------------|---------|---------------|------------|--------|---------|-----------|
| Bookings        | Ledger  | -             | -          | -      | marketId| touch     |
| Payments        | Ledger  | Billing events| -          | -      | -       | -         |
| Listings/Search | -       | Entitlements  | Featured   | -      | resolve | touch     |
| Policy engine   | -       | -             | -          | -      | Bindings| -         |
| Observability  | -       | -             | -          | -      | -       | -         |
| Admin           | Revenue UI | Subscriptions UI | Promo UI | Growth UI | Markets UI | -   |

---

## Security and Governance

- **Finance-sensitive:** Admin revenue and subscription APIs should be protected by role (e.g. finance, admin). Restrict who can record revenue or create plans.
- **Billing events:** All subscription and billing actions are logged in BillingEvent for traceability.
- **Promotion transparency:** Promoted content is identifiable via `getListingPromotion(listingId)` for clear labeling (e.g. "Sponsored").
- **Market config changes:** Consider audit log for market create/update/deactivate (e.g. via ControlActionAuditLog or dedicated log).

---

## Testing

- **lib/__tests__/revenue-intelligence.test.ts** – recordRevenueEntry, getRevenueSummary (mocked Prisma).
- **lib/__tests__/subscription-billing.test.ts** – getActiveSubscription, hasEntitlement (mocked Prisma).

Run: `npm run test -- --run` in `apps/web`.
