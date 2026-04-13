# Fraud detection system (rule-based policy engine)

This document describes the **incremental, deterministic** fraud layer in `apps/web`: signal events, rolling policy scores, optional fraud cases for review, and admin controls. It is **not** the same as the legacy ML `FraudScore` model used elsewhere in the schema; rule-based aggregates live in **`FraudPolicyScore`** (`@@map("fraud_policy_scores")`).

## Entity types (`FraudEntityType`)

| Value | Meaning |
|--------|---------|
| `user` | Platform user; `entityId` is `User.id` **or** `ip:<fingerprint>` when no user exists yet |
| `listing` | Listing / property listing id |
| `booking` | Booking id |
| `payment` | Payment-related id (e.g. Stripe PaymentIntent id or internal payment id) |
| `message` | Messaging thread or message id (when wired) |

## Data model (summary)

- **`FraudSignalEvent`** — Append-only signals with `signalType`, `riskPoints`, optional `metadataJson`.
- **`FraudPolicyScore`** — One row per `(entityType, entityId)`; recomputed from signals in a rolling window.
- **`FraudCase`** — Opened automatically when risk reaches **high** or **critical** (see thresholds below); admin triage.
- **`FraudDecision`** — Admin outcomes (`confirmed_fraud`, `false_positive`, etc.) for feedback and audit.

## Rule categories and point weights

Weights are defined in `apps/web/lib/fraud/rules.ts` (`POINTS`). Examples:

| Signal (concept) | Approx. role |
|------------------|----------------|
| Failed login burst | Repeated failed authentication |
| Rapid signup same IP | Velocity / multi-account from one network |
| Messaging / contact spam | Guest form or contact abuse |
| Listing price “bait” | Suspiciously low nightly price |
| Listing volume spam | Many listings per owner per day |
| Duplicate image hash | Cross-listing image reuse |
| Booking velocity (guest) | Too many bookings per guest per day |
| Booking new-account rush | New account + risky booking pattern |
| Payment failed | Stripe failure path |
| Stripe Radar elevated | Radar / outcome metadata when present |

Constants such as `BAIT_NIGHT_PRICE_CENTS`, `MAX_LISTINGS_PER_OWNER_PER_DAY`, and `MAX_BOOKINGS_PER_GUEST_PER_DAY` are tunable per market.

## Scoring window

- **`SIGNAL_WINDOW_MS`** — Default **30 days**. `updateFraudScoreForEntity` sums `riskPoints` for events in this window and upserts **`FraudPolicyScore`**.

## Risk levels and recommended actions

Implemented in `lib/fraud/recommend-action.ts`:

**Risk level** (from total score):

| Score range | `FraudRiskLevel` |
|-------------|------------------|
| &lt; 30 | `low` |
| 30–54 | `medium` |
| 55–79 | `high` |
| ≥ 80 | `critical` |

**Recommended action** (from score):

| Score range | `FraudActionType` |
|-------------|-------------------|
| &lt; 22 | `allow` |
| 22–44 | `monitor` |
| 45–69 | `review` |
| 70–87 | `challenge` |
| ≥ 88 | `block` |

These are **recommendations**; enforcement is layered (monitoring, review queue, optional admin suspend/hold — see below).

## When a fraud case opens

- **`OPEN_CASE_MIN_LEVEL`** is **`high`**. When recomputed `riskLevel` is `high` or `critical`, `openFraudCaseIfNeeded` creates a **`FraudCase`** if none is already `open` / `under_review` for that entity.
- **`critical`** risk also emits a **`FRAUD_CASE_CRITICAL`** system alert (see `lib/observability`).

## Action engine (behavior)

| Tier | Intended behavior |
|------|---------------------|
| Low | Allow; optional passive monitoring |
| Medium | Allow; stronger logging / monitoring |
| High | Queue for human review; optional extra checks; tighter rate limits where hooks exist |
| Critical | Urgent case + alert; admin can suspend user or hold listing — **reversible** |

Automatic **booking cancellation** is intentionally **not** implemented in v1; ops rely on cases + admin actions.

## Sensitive flow integrations

Non-invasive hooks (typically `import().then().catch()` so core paths stay stable) include:

- Auth: failed login, signup (`app/api/auth/*`).
- BNHub: listing create, booking completion (`lib/bnhub/*`).
- Stripe: `payment_intent.payment_failed` and Radar-style fields when available (`app/api/stripe/webhook/route.ts`).
- Contact / messaging: abuse paths (`app/api/immo/contact/route.ts`).

**Principle:** Do not hard-block low-risk traffic; escalate via score + cases first.

## Stripe / Radar

- **Payment failures** always contribute a signal when the webhook fires.
- **Radar** — When `payment_intent` or related objects expose `outcome`, `radar_options`, or risk fields, `compute-payment-risk` can record `stripe_radar_elevated` (implementation is defensive if fields are missing).

## Bot, rate limits, and Vercel

- **App-level:** Existing rate limiting (`lib/rate-limit-distributed.ts`, route-specific limits) should remain the first line of defense; fraud scoring **adds** visibility and case queueing.
- **Vercel:** Use [vercel-alerting.md](./vercel-alerting.md) for platform notifications; WAF / bot management / IP rules are configured in the Vercel project — document **there** which routes are protected. Fraud docs do not replace WAF; they complement it.

## Admin review flow

- **List:** `/[locale]/[country]/admin/fraud` — open cases, recent signals, policy score distribution, filters.
- **Detail:** `/[locale]/[country]/admin/fraud/[caseId]` — entity context, signals, timeline, recommended action, decisions.
- **API:** `POST` `app/api/admin/fraud/cases/[caseId]/route.ts` — status updates, `suspend_user`, `hold_listing` (and related reversible actions in `lib/fraud/admin-case-actions.ts`).

**IP-only user entities** (`entityId` starting with `ip:`) cannot be “suspended” as a user row; use IP block / security tooling instead.

## Feedback loop

- **`FraudDecision`** rows store admin outcomes (`false_positive`, `confirmed_fraud`, etc.).
- Rule **weights** in `POINTS` are the tuning knob; future work can load multipliers from DB or experiments — **no ML** in this phase.

## Alerting helpers

- `lib/fraud/alerting.ts` — `alertFraudSpike` wraps `createSystemAlert` with `FRAUD_*` types for spikes (signup, logins, bookings, payments). Wire thresholds to cron or log drains as needed.

## Known limitations

- Scores are **sum of points** in a window — correlated events can double-count until weights are tuned.
- **Serverless:** Without a single Redis instance, rate limits and counts may be per-instance.
- **Stripe:** Radar fields vary by API version and object expansion; payment risk may be partial until checkout stores full PI ids consistently.

## Future: adaptive / ML extension

1. Persist **admin labels** from `FraudDecision` as training features.
2. Add a **calibrated model** (separate from `FraudScore` ML table) that outputs probability + explanation.
3. **Shadow mode:** log model score next to policy score before any auto-block.

## Related docs

- [alert-routing.md](./alert-routing.md) — Where operational alerts go.
- [route-security-checklist.md](./route-security-checklist.md) — API auth and rate limits.
- [README.md](./README.md) — Security doc index.
