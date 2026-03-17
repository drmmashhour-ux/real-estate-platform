# LECIPM Platform Modules Registry

A registry of every major platform module with purpose, location, main APIs, and dependencies. Use this for navigation and to enforce boundaries when adding features.

---

## Auth

| Field | Description |
|-------|-------------|
| **Purpose** | Authentication, session management, identity verification, demo/support sessions. |
| **Service location** | `services/auth-service/`, `apps/web-app` (session, middleware, demo login). |
| **Main APIs** | `POST /api/auth/demo-session`, `GET /api/auth/demo-users`, login/signup flows; auth-service endpoints per its README. |
| **Dependencies** | users, database; used by all apps and API routes. |

---

## Users

| Field | Description |
|-------|-------------|
| **Purpose** | User profiles, roles (guest, host, broker, admin), preferences, verification state. |
| **Service location** | `apps/web-app` (Prisma User model, profile routes), `services/user-service/`. |
| **Main APIs** | User CRUD, profile get/update, role checks; admin user lookup. |
| **Dependencies** | auth, database; feeds listings, bookings, messages, reviews, disputes. |

---

## Listings

| Field | Description |
|-------|-------------|
| **Purpose** | Property listings (sale, long-term rental, short-term rental, investment), availability, pricing. |
| **Service location** | `apps/web-app` (BNHub listings, marketplace), `services/listing-service/`. |
| **Main APIs** | `GET/POST /api/bnhub/listings`, `GET /api/bnhub/listings/[id]`, create/edit/availability; marketplace listing APIs. |
| **Dependencies** | users, search, payments (pricing), compliance, enforcement (listing freeze). |

---

## Search

| Field | Description |
|-------|-------------|
| **Purpose** | Listing search, filters, ranking, discovery. |
| **Service location** | `apps/web-app` (search routes), `services/search-service/`. |
| **Main APIs** | Search endpoints, filters by market/type/dates; ranking API. |
| **Dependencies** | listings, operational controls (e.g. hide suspended listings). |

---

## Bookings

| Field | Description |
|-------|-------------|
| **Purpose** | Reservation lifecycle: create, pay, modify, cancel; availability checks. |
| **Service location** | `apps/web-app` (BNHub booking routes), `services/booking-service/`. |
| **Main APIs** | `GET/POST /api/bnhub/bookings`, `GET /api/bnhub/bookings/[id]`, pay, availability. |
| **Dependencies** | auth, users, listings, payments, policy acceptance (terms), abuse prevention (restrict banned/suspended), operational controls (booking freeze). |

---

## Payments

| Field | Description |
|-------|-------------|
| **Purpose** | Payment intents, charges, refunds, payouts, payment method management. |
| **Service location** | `apps/web-app` (payment routes), `services/payment-service/`. |
| **Main APIs** | Payment create/capture, refund, payout initiation; webhooks. |
| **Dependencies** | users, bookings, revenue systems; financial defense (risk flags, payout hold). |

---

## Messaging

| Field | Description |
|-------|-------------|
| **Purpose** | In-platform messaging between guests, hosts, support; thread management. |
| **Service location** | `apps/web-app`, `services/messaging-service/`. |
| **Main APIs** | List threads, get/send messages; moderation hooks. |
| **Dependencies** | users, bookings/listings (context); trust & safety, abuse (abusive messaging). |

---

## Reviews

| Field | Description |
|-------|-------------|
| **Purpose** | Guest/host reviews, ratings, moderation. |
| **Service location** | `apps/web-app`, `services/review-service/`. |
| **Main APIs** | Submit review, list reviews for listing/user; moderation. |
| **Dependencies** | users, bookings, listings; trust & safety. |

---

## Trust & Safety

| Field | Description |
|-------|-------------|
| **Purpose** | Incidents, moderation queues, risk signals, content takedown, escalation. |
| **Service location** | `apps/web-app` (admin moderation, incidents), `services/trust-safety/`. |
| **Main APIs** | Incidents, moderation approve/reject, fraud alerts, risk APIs; dispute linkage. |
| **Dependencies** | users, listings, bookings, messages, reviews; abuse prevention, enforcement, evidence. |

---

## Disputes

| Field | Description |
|-------|-------------|
| **Purpose** | Dispute creation, messages, resolution, evidence attachment. |
| **Service location** | `apps/web-app` (BNHub disputes, admin). |
| **Main APIs** | `GET/POST /api/bnhub/disputes`, `GET/POST /api/bnhub/disputes/[id]/messages`; admin dispute actions. |
| **Dependencies** | users, bookings, payments; evidence preservation, enforcement, legal event log. |

---

## Subscriptions

| Field | Description |
|-------|-------------|
| **Purpose** | Subscription plans, billing, entitlements (e.g. for hosts/brokers). |
| **Service location** | `apps/web-app` (billing, subscription routes), admin subscriptions. |
| **Main APIs** | Plan list, subscribe, cancel; admin subscription management. |
| **Dependencies** | users, payments; compliance, policy acceptance. |

---

## Promotions

| Field | Description |
|-------|-------------|
| **Purpose** | Promo codes, campaigns, discounts; abuse detection. |
| **Service location** | `apps/web-app` (promotions API), admin promotions. |
| **Main APIs** | Apply promo, list campaigns; admin create/promote; promotion abuse signals. |
| **Dependencies** | users, bookings, revenue; abuse prevention. |

---

## Analytics

| Field | Description |
|-------|-------------|
| **Purpose** | Product analytics, business metrics, reporting, dashboards. |
| **Service location** | `apps/web-app` (analytics routes, executive dashboard), `services/analytics-service/`. |
| **Main APIs** | Metrics, reports, dashboard data; defense analytics. |
| **Dependencies** | users, listings, bookings, payments, disputes, enforcement, compliance. |

---

## AI Systems

| Field | Description |
|-------|-------------|
| **Purpose** | Pricing, recommendations, fraud scoring, moderation, support classification, demand/ranking. |
| **Service location** | `apps/web-app` (AI routes, AI Control Center), `services/ai-control-center/`. |
| **Main APIs** | `/api/ai/pricing/[listingId]`, `/api/ai/recommendations/[listingId]`, `/api/ai/support/classify`, admin AI decisions/alerts/models. |
| **Dependencies** | listings, bookings, users, trust & safety, fraud; policy engine, observability. |

---

## Admin Tools

| Field | Description |
|-------|-------------|
| **Purpose** | Internal admin: users, controls, health, policies, disputes, fraud, promotions, revenue, subscriptions, defense, AI, audit. |
| **Service location** | `apps/web-app/app/admin/`, `apps/web-app/app/api/admin/`. |
| **Main APIs** | All `/api/admin/*` routes; defense, compliance, enforcement, crisis, approvals. |
| **Dependencies** | All modules; internal access defense (privileged actions, approvals). |

---

## Growth Systems

| Field | Description |
|-------|-------------|
| **Purpose** | Supply growth, campaigns, referrals, market expansion, revenue recording. |
| **Service location** | `apps/web-app` (supply-growth, referral, growth campaigns), admin growth. |
| **Main APIs** | Referral use, supply-growth endpoints; admin campaigns; referral abuse signals. |
| **Dependencies** | users, listings, bookings, promotions; abuse prevention, revenue. |

---

## Cross-cutting / platform layers

| Layer | Purpose | Location |
|-------|---------|----------|
| **Operational controls** | Booking/payout/listing freezes, feature flags, regional controls. | `apps/web-app/lib/operational-controls.ts`, admin controls API. |
| **Observability** | Health, metrics, alerts, platform health dashboard. | `apps/web-app` health APIs, admin health. |
| **Policy engine** | Rules evaluation, decisions, overrides. | `apps/web-app` policies API, admin policies. |
| **Revenue & growth** | Revenue events, market expansion, recording. | `apps/web-app` revenue API, REVENUE-GROWTH-MARKET-EXPANSION. |
| **Platform Defense** | Legal, evidence, abuse, internal access, crisis, compliance, financial defense, enforcement, analytics. | `apps/web-app/lib/defense/`, `apps/web-app/app/api/admin/defense/`, `apps/web-app/app/api/defense/`. |

---

## Dependency summary

- **Auth** and **users** are foundational; most modules depend on them.
- **Listings** and **bookings** are core to marketplace and BNHub; **payments** and **search** depend on them.
- **Trust & safety**, **disputes**, **enforcement**, and **evidence** depend on users, bookings, and payments.
- **Admin** and **AI** consume or control most other modules.
- **Defense** layers (legal, abuse, compliance, financial, crisis, enforcement) integrate with auth, users, bookings, payouts, disputes, and admin.

Use this registry when adding a new feature to decide which module it belongs to and which dependencies to honor.
