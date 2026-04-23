# LECIPM — Launch KPIs Dashboard Spec

**Purpose:** One definition table so **Growth, Product, and Founder** measure the same thing.  
**Implementation:** Any BI tool (Metabase, Hex, Looker, Grafana + events DB, or internal admin page).  
**Principle:** Prefer **server-side or analytics events** over pageviews alone.

---

## Core funnel

| Metric name | Formula | Source | Owner | Review cadence |
|-------------|---------|--------|-------|----------------|
| **Sessions** | Count of session start events (or GA4 sessions if unified) | Analytics (`session_start` event or GA4) | Growth | Daily |
| **Unique visitors** | Distinct `anonymous_id` or `client_id` per day | Analytics | Growth | Daily |
| **Signups completed** | Count of `auth_register_success` or user rows created with `created_at` in window | DB `User` + server logs | Growth | Daily |
| **Signup rate** | Signups ÷ sessions (or ÷ unique visitors—**pick one** and lock) | Derived | Growth | Weekly |
| **Activation rate** | Users who completed **segment activation action** (see playbook) ÷ signups in cohort | Events + DB flags | Product | Weekly |

---

## Discovery → intent

| Metric name | Formula | Source | Owner | Review cadence |
|-------------|---------|--------|-------|----------------|
| **Search-to-detail CTR** | `listing_detail_view` ÷ `search_results_view` (same session window optional) | Client/server events | Product | Weekly |
| **Detail-to-contact CTR** | `contact_cta_submit` ÷ `listing_detail_view` | Events | Product | Weekly |
| **BNHub search-to-detail CTR** | `stay_detail_view` ÷ `bnhub_search_results` | Events | Product | Weekly |
| **Saved listings / searches** | Count `listing_saved`, `search_saved` | Events | Growth | Weekly |

---

## Monetization (hub-attributed)

| Metric name | Formula | Source | Owner | Review cadence |
|-------------|---------|--------|-------|----------------|
| **Lead purchase count** | Count paid `lead_unlock` (or CRM unlock) events / payments | `PlatformPayment` `payment_type=lead_unlock` + Stripe | Finance/Ops | Daily |
| **Booking count** | Confirmed bookings (status filter defined in code) | `Booking` table / events | Ops | Daily |
| **Revenue by hub** | Sum `platform_fee` or hub bucket per internal revenue mapping | `PlatformPayment` + mapping rules | Finance | Weekly |
| **Gross checkout volume** | Sum `amount_cents` where status=paid (document gross vs net in footnote) | `PlatformPayment` | Finance | Weekly |

---

## Engagement & retention

| Metric name | Formula | Source | Owner | Review cadence |
|-------------|---------|--------|-------|----------------|
| **Daily active users (DAU)** | Distinct users with **any** meaningful event or session per UTC day | Events | Growth | Daily |
| **Weekly active users (WAU)** | Distinct users in rolling 7d | Events | Growth | Weekly |
| **D1 / D7 / D30 retention** | % cohort returning on day N (session or activation-based—**define**) | Cohort query | Product | Weekly |
| **Notification open rate** | Opens ÷ delivered (per provider: Expo/Resend/Twilio logs) | Notification provider + events | Eng | Weekly |
| **Email CTR** | Clicks ÷ delivered | ESP | Growth | Weekly |

---

## Operations & trust

| Metric name | Formula | Source | Owner | Review cadence |
|-------------|---------|--------|-------|----------------|
| **Admin alerts count** | Count `RISK_ALERT`, abuse, or ops queue items opened | `PlatformEvent` / internal alerts | Ops | Daily |
| **Webhook success rate** | `stripe_webhook_processed` success ÷ received | Stripe dashboard + logs | Eng | Daily |
| **P95 API latency** (critical routes) | p95 from APM | APM | Eng | Daily |
| **Error rate** | 5xx ÷ requests for API | APM / logs | Eng | Daily |

---

## Investor readiness strip

| Metric name | Formula | Source | Owner | Review cadence |
|-------------|---------|--------|-------|----------------|
| **North-star weekly** | Choose **one**: paid events, WAU, or activation—state explicitly | Derived | Founder | Weekly |
| **Paying accounts** | Distinct users with ≥1 paid event in period | Payments | Finance | Monthly |
| **Cohort activation table** | By week of signup | Warehouse | Founder | Monthly |

---

## Event naming convention (suggested)

`[domain].[object].[verb]` — e.g. `marketplace.listing.view`, `bnhub.stay.contact`, `crm.lead.unlock_success`.

Document allowed properties: `hub`, `listing_id`, `utm_*`, `role`.

---

## Dashboard layout (recommended tabs)

1. **Executive:** DAU/WAU, revenue by hub, webhook health, error rate.  
2. **Acquisition:** Sessions → signup → activation funnel + UTM breakdown.  
3. **Product:** CTRs, saved items, booking funnel.  
4. **Reliability:** Latency, incidents, admin alerts.

---

## Definitions to fix on day 1

- **Session** timeout (30 min vs GA default).  
- **Activation** per segment (see `first-100-users-playbook.md`).  
- **Revenue:** gross vs platform share—**never mix without labeling**.
