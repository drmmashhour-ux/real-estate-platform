# LECIPM BNHub Platform — Development Roadmap

This roadmap translates the platform architecture into a step-by-step implementation plan. Use it to track progress and onboard developers.

**Related docs:** [Project Overview](docs/PROJECT-OVERVIEW.md) · [Architecture](docs/ARCHITECTURE-OVERVIEW.md) · [API](docs/API-DOCUMENTATION.md) · [AI Operator](docs/AI-OPERATOR.md)

---

## Phase 1 — Platform Foundation

**Goal:** Establish the monorepo, core services, database, auth, and configuration so all other phases can build on it.

| # | Task | Description |
|---|------|-------------|
| 1.1 | Project skeleton | Monorepo layout: `apps/`, `services/`, `modules/`, `packages/`, `infra/`, `docs/`. Root `package.json` workspaces, shared tooling (ESLint, Prettier, TypeScript). |
| 1.2 | Service scaffolding | Base structure for each service (e.g. auth, users, listings, search, bookings, payments, messaging, reviews): controllers, routes, models, services, validators, tests. |
| 1.3 | Database setup | PostgreSQL + Prisma. Schema in `apps/web-app/prisma`. Connection and migrations. Shared `packages/database` or documented DB ownership. |
| 1.4 | Authentication system | Register, login, logout, session (cookie or JWT). Password hashing, token refresh. Implement in `services/auth-service` and/or `apps/web-app` API routes. |
| 1.5 | User roles | Roles: guest, host, admin (and optionally broker, owner). Role checks in API and UI. Store role on user model. |
| 1.6 | Environment configuration | Centralized config: `packages/config` or `.env` schema. Database URL, API base path, logging level, security (JWT secret, session cookie). Document in README or `docs/`. |

**Deliverables:** Monorepo runs; auth works; roles enforced; database and env documented.

---

## Phase 2 — Listings System

**Goal:** Hosts can create, edit, and manage short-term rental listings with photos and moderation.

| # | Task | Description |
|---|------|-------------|
| 2.1 | BNHub listing models | Prisma models: `ShortTermListing`, `BnhubListingPhoto`, fields (title, description, address, city, nightPriceCents, amenities, houseRules, listingStatus, verificationStatus, etc.). |
| 2.2 | Listing creation wizard | Multi-step UI in `apps/web-app`: basics → location → photos → pricing → rules → review. Persist via `POST /api/bnhub/listings/create` or equivalent. |
| 2.3 | Listing photos | Upload or URL-based photos. Order and cover photo. `BnhubListingPhoto` model and `GET/POST /api/bnhub/listings/[id]/photos`. |
| 2.4 | Listing editing | Edit existing listing: `GET /api/bnhub/listings/[id]`, `PUT /api/bnhub/listings/[id]`. Form pre-filled; support partial updates. |
| 2.5 | Listing moderation | Status flow: DRAFT → SUBMITTED → moderation queue → PUBLISHED / REJECTED. Admin UI to approve/reject; optional verification steps (identity, address). |

**Deliverables:** Full CRUD for listings; wizard and edit UI; photo handling; moderation workflow.

---

## Phase 3 — Search System

**Goal:** Guests can discover listings by location and filters with a results page and optional map.

| # | Task | Description |
|---|------|-------------|
| 3.1 | Search API | `GET /api/bnhub/listings` or `GET /api/bnhub/search` (and/or `GET /api/search`) with query params: location, dates, guests, price range, property type, etc. |
| 3.2 | Location search | Filter by city, region, or coordinates. Index on `city`, `listingStatus`; optional geo for “near me”. |
| 3.3 | Filters | Query params: checkIn, checkOut, guests, minPrice, maxPrice, propertyType, roomType, amenities, instantBook. Apply in Prisma `where`. |
| 3.4 | Search results page | UI: search form + results list (cards with photo, title, price, rating). Pagination or infinite scroll. Link to listing detail. |
| 3.5 | Map integration | Optional: show results on a map (e.g. Mapbox, Google Maps). Use listing lat/lng; cluster or markers. |

**Deliverables:** Search API with filters; results page; optional map.

---

## Phase 4 — Booking System

**Goal:** Guests can reserve listings with availability checks and clear status flow; double bookings are prevented.

| # | Task | Description |
|---|------|-------------|
| 4.1 | Availability calendar | Model `AvailabilitySlot` (listingId, date, available, priceOverrideCents). API: `GET/POST/PUT /api/bnhub/availability`. Host and guest views. |
| 4.2 | Booking engine | Create booking: validate dates vs availability, calculate nights and total. `POST /api/bnhub/bookings`. Status: PENDING → AWAITING_HOST_APPROVAL → CONFIRMED (or DECLINED/CANCELLED). |
| 4.3 | Double booking protection | On booking creation and availability updates: ensure no overlapping confirmed bookings; block or reject conflicting requests. |
| 4.4 | Booking statuses | Full lifecycle: PENDING, AWAITING_HOST_APPROVAL, CONFIRMED, DECLINED, CANCELLED_BY_GUEST, CANCELLED_BY_HOST, COMPLETED, DISPUTED. Transitions and API (approve, decline, cancel). |
| 4.5 | Reservation storage | Persist `Booking` with guestId, listingId, checkIn, checkOut, nights, totalCents, status, and link to Payment when applicable. |

**Deliverables:** Availability API and UI; booking creation and status flows; no double bookings; storage and history.

---

## Phase 5 — Payments

**Goal:** Guests pay at checkout; hosts receive payouts; all transactions are logged.

| # | Task | Description |
|---|------|-------------|
| 5.1 | Payment processing | Integrate payment provider (e.g. Stripe). Create payment intent or charge on booking confirmation. `POST /api/bnhub/bookings/[id]/pay` (or checkout API). |
| 5.2 | Booking checkout | Checkout flow: review booking → enter payment method → confirm. Store `Payment` (bookingId, amount, status, providerRef). |
| 5.3 | Payout preparation | Compute host payout (total minus fees, refunds). Store in `Payment` or separate payout record. Optional: payout runs (batch) and payouts API for host dashboard. |
| 5.4 | Transaction logging | Log all payment and payout events (success, failure, refund). Audit trail for support and disputes. |

**Deliverables:** Checkout and payment capture; payout calculation and logging; transaction history.

---

## Phase 6 — Messaging

**Goal:** Guests and hosts can communicate in the context of a booking; notifications support awareness.

| # | Task | Description |
|---|------|-------------|
| 6.1 | Guest–host chat | Model `BookingMessage` (bookingId, senderId, body, createdAt). API: `GET/POST /api/bnhub/messages?bookingId=`. UI: conversation thread per booking. |
| 6.2 | Booking conversations | Restrict messaging to participants of the booking; list conversations for host and guest dashboards. |
| 6.3 | Notifications | Notify on new message, booking request, booking confirmed/cancelled, review received. In-app and/or email. Use `lib/bnhub/notifications` or a notifications service. |

**Deliverables:** Messaging API and UI; booking-scoped threads; basic notifications.

---

## Phase 7 — Reviews

**Goal:** Guests can leave reviews after stay; ratings are aggregated; moderation is available.

| # | Task | Description |
|---|------|-------------|
| 7.1 | Review submission | Model `Review` (bookingId, listingId, guestId, rating, text, createdAt). Only after COMPLETED booking; one review per booking. `POST /api/bnhub/reviews`. |
| 7.2 | Review moderation | Optional: moderate review text (profanity, policy). Admin queue or auto-flag; approve/hide. |
| 7.3 | Rating averages | Compute and display average rating per listing (and per host if multi-listing). Use in search ranking and listing detail. |

**Deliverables:** Submit and display reviews; average ratings; optional moderation.

---

## Phase 8 — Host Dashboard

**Goal:** Hosts manage listings, calendar, bookings, and see earnings in one place.

| # | Task | Description |
|---|------|-------------|
| 8.1 | Listing management | List host’s listings; create (wizard), edit, set status, manage photos. Links from dashboard to listing edit and wizard. |
| 8.2 | Calendar management | Availability calendar: open/block dates, set price overrides, min stay. Use availability API and UI in `apps/web-app` (e.g. host availability page). |
| 8.3 | Booking management | List incoming and past bookings; approve/decline pending; cancel with policy; view guest and payout. |
| 8.4 | Earnings overview | Summarize earnings: by period, by listing, pending vs paid. Use payment/payout data. |

**Deliverables:** Host dashboard with listings, calendar, bookings, and earnings.

---

## Phase 9 — Admin Dashboard

**Goal:** Admins moderate listings, monitor bookings, handle fraud flags, and manage users.

| # | Task | Description |
|---|------|-------------|
| 9.1 | Listing moderation | Queue of listings pending approval or flagged. Approve, reject, request changes. Optional: verification steps and logs. |
| 9.2 | Booking monitoring | View bookings; filter by status, date, listing, guest. Support for disputes and cancellations. |
| 9.3 | Fraud flags | Surface fraud alerts and risk scores. Review high-risk bookings or users; escalate or clear. Use AI Operator fraud agent and alerts. |
| 9.4 | User management | List users; view roles and activity; suspend or adjust roles. Optional: impersonation for support. |

**Deliverables:** Admin UI for moderation, bookings, fraud, and users.

---

## Phase 10 — AI Operator

**Goal:** AI-powered operations for listing quality, pricing, fraud, demand, and support—with human override.

| # | Task | Description |
|---|------|-------------|
| 10.1 | Listing analysis | Listing Moderation Agent: quality score, moderation suggestion, missing info, trust flags. API: `POST /api/ai-operator/listings/analyze`. Optional: scheduled scan of new listings. |
| 10.2 | Pricing recommendations | Pricing Agent: recommended nightly price, range, demand label. API: `POST /api/ai-operator/pricing/recommend`. Surface in host dashboard and optional periodic refresh. |
| 10.3 | Fraud detection | Fraud Risk Agent: risk score, level, recommended action, auto-flag. API: `POST /api/ai-operator/fraud/evaluate`. Alerts and review queue in admin. |
| 10.4 | Demand forecasting | Demand Forecast Agent: high/low demand periods, supply signals. API: `POST /api/ai-operator/demand/forecast`. Use in pricing and host insights. |
| 10.5 | Support triage | Support Triage Agent: classify ticket, urgency, suggested reply, escalation. API: `POST /api/ai-operator/support/triage`. Optional: integrate with support dashboard. |

**Deliverables:** AI Operator service and agents; APIs and dashboards (host + admin); decision log and human override. See [AI-OPERATOR.md](docs/AI-OPERATOR.md) and [AI-MANAGEMENT-LAYER.md](docs/AI-MANAGEMENT-LAYER.md).

---

## Summary

| Phase | Focus |
|-------|--------|
| 1 | Foundation (skeleton, services, DB, auth, roles, config) |
| 2 | Listings (models, wizard, photos, edit, moderation) |
| 3 | Search (API, location, filters, results, map) |
| 4 | Bookings (availability, engine, double-book protection, statuses) |
| 5 | Payments (checkout, payouts, logging) |
| 6 | Messaging (guest–host chat, booking threads, notifications) |
| 7 | Reviews (submit, moderate, averages) |
| 8 | Host dashboard (listings, calendar, bookings, earnings) |
| 9 | Admin dashboard (moderation, bookings, fraud, users) |
| 10 | AI Operator (listing analysis, pricing, fraud, demand, support triage) |

Follow phases in order where dependencies exist (e.g. Phase 4 depends on Phase 2 and 3). Within a phase, tasks can often be parallelized. Use this file as the single implementation plan from foundation to AI-powered marketplace.
