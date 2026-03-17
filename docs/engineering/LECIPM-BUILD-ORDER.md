# LECIPM Platform — Build Order

**Strict implementation sequence for the LECIPM platform**

This document defines the **exact order** in which the LECIPM platform should be built. It ensures dependencies are respected, vertical slices become functional early, and the system can launch a pilot city (Montreal) as soon as possible. It is the single reference for engineers and AI coding tools to know what to build first, second, third, and so on. It aligns with the [System Map](LECIPM-SYSTEM-MAP.md), [Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md), [Development Sprint Plan](LECIPM-DEVELOPMENT-SPRINT-PLAN.md), [Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md), [API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [Frontend Architecture Blueprint](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md), and [Design-to-Code Implementation Guide](LECIPM-DESIGN-TO-CODE-IMPLEMENTATION-GUIDE.md).

---

## 1. Build strategy

### Build philosophy

| Principle | Application |
|-----------|-------------|
| **Build platform foundation first** | Infrastructure, environments, database, auth, and API gateway exist before any domain feature. No listing, booking, or payment work starts until users can register, log in, and be authorized by role. |
| **Create working vertical slices early** | Each phase delivers an end-to-end slice where possible: e.g. after Phase 5–6 a guest can search, book, and pay. Prefer “one flow working” over “all backends done, no frontend.” |
| **Prioritize booking and transaction flows** | BNHub booking and payment are the core revenue and trust loop. Availability, booking creation, payment capture, and confirmation are built before host dashboards, broker CRM, or deal marketplace. |
| **Integrate trust and safety early** | Identity verification, incident reporting, and basic moderation are part of the first production-ready slice. Fraud signals and payout holds are implemented before scaling supply. |
| **Add advanced analytics and AI later** | Investment analytics, deal marketplace, and AI Control Center depend on operational data (listings, bookings, payments). They are built after the core loop and host/owner tools exist. |
| **Ensure the system can launch a pilot city early** | The sequence is chosen so that after Phase 17 (testing) and Phase 18 (Montreal pilot prep), the platform can go live in one city with listings, bookings, payments, support, and admin oversight. |

### Dependency rules

- **Phase N** can start only when **Phase N−1** is complete for all blocking deliverables. Some phases have internal parallelism (e.g. backend and frontend for the same domain).
- **Frontend** for a given flow (e.g. booking checkout) is built in the same phase or the next phase after the **API** for that flow exists; no UI without a working API.
- **Tests** are written as features are built; Phase 17 consolidates and extends coverage rather than introducing testing from scratch.

### Outcome

A team or AI tool following this order will have a **stable dev environment** first, then **users and auth**, then **listings and search**, then **booking and payment**, then **messaging and reviews**, then **Trust & Safety**, then **host/broker/owner tools**, then **deals and analytics**, then **AI and admin**, then **mobile**, then **testing and pilot launch**, and finally **global scaling prep**. The platform becomes **functional for a pilot** (guest can book, host can list and get paid) before advanced modules are added.

---

## 2. Phase 1 — Infrastructure foundation

**Goal:** Create a stable development and deployment environment. Nothing in later phases should be blocked by missing infra, config, or pipelines.

### Tasks (in order)

1. **Cloud infrastructure setup** — Provision accounts and core resources: VPC, compute (e.g. ECS/EKS or app services), RDS (or managed Postgres), object storage bucket, optional Redis/cache. Use IaC (Terraform, CloudFormation, or provider-native) so environments are reproducible.
2. **Environment configuration** — Define dev, staging, production. Environment variables for DB URL, API base URL, feature flags. No secrets in code; use vault or managed secrets.
3. **Database initialization** — Create database instance; run migrations framework (e.g. Flyway, Prisma migrate, or Alembic). Initial migration: schema version table only, or minimal tables if needed for tooling. Full schema is added in Phase 2–3.
4. **Basic service scaffolding** — One or more service repos (or monorepo) with: API server skeleton, health check endpoint, request logging, correlation ID. Route `/health` returns 200. No business logic yet.
5. **Logging and monitoring setup** — Centralized logging (e.g. CloudWatch, Datadog, ELK); structured logs with level, message, correlation_id, timestamp. Basic metrics (request count, latency, error rate). Alerts on error spike or downtime.
6. **CI/CD pipeline setup** — Build on commit/PR: install deps, lint, run tests, build artifact. Deploy to dev on merge to main; optional manual or auto deploy to staging/production. Pipeline uses same config/secrets pattern as apps.

### Deliverables

- Repo(s) that build and deploy to dev.
- Database and storage reachable from services.
- Logs and metrics visible in one place.
- One successful deploy to dev and (if applicable) staging.

### Exit criterion

- A new developer can clone, configure env, and run the app locally; CI runs on every push; deploy to dev succeeds. No feature work in Phase 1 beyond what is needed for this.

---

## 3. Phase 2 — Core user system

**Goal:** Users can register, log in, and access the platform with a validated token and role. All later phases assume “current user” and “role” exist.

### Tasks (in order)

1. **User database model** — Implement `users` table per [Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md): id, email, password_hash, name, phone, locale, timezone, verification_status, suspended_at, created_at, updated_at, deleted_at. Add `user_roles` (user_id, role) and optional `user_profiles` for host/broker extensions. Run migration.
2. **Account registration** — POST /auth/register: validate email format and uniqueness, password policy; hash password (bcrypt/Argon2); create user and default role (guest); return user id and optionally trigger email verification. No token yet or return token per product choice.
3. **Login and logout** — POST /auth/login: validate credentials; on success issue token. POST /auth/logout: invalidate token or session. Rate limit login attempts per IP/email.
4. **Authentication tokens** — Issue JWT (or opaque token) with user id, roles, expiry. Validate on every request; attach user and roles to request context. Optional: refresh token flow; store refresh token if opaque.
5. **Role-based access control** — Middleware or decorator: require one or more roles per route (e.g. host for create listing, admin for admin routes). Return 403 when role missing. Central list of roles: guest, host, broker, investor, admin, support.
6. **Basic user profile** — GET /users/me, PATCH /users/me: read and update name, phone, locale, timezone. Require auth. No email change in this phase (or separate flow with verification).

### Deliverables

- Users and roles in DB; migrations applied.
- Auth API: register, login, logout; token issue and validation.
- Protected routes with RBAC; 401/403 returned correctly.
- Profile read/update API.

### Exit criterion

- A client can register, log in, receive a token, and call GET /users/me; a request without token or with wrong role is rejected. No listing or booking logic yet.

---

## 4. Phase 3 — Listing infrastructure

**Goal:** Hosts and brokers can create and manage property listings (marketplace and BNHub). Listings can be stored, updated, and moderated; images can be uploaded.

### Tasks (in order)

1. **Property/listing database models** — Implement `listings` table (id, user_id, broker_id optional, type, status, title, description, property_type, address, city, region, country, lat, lng, price_cents, currency, nightly_price_cents, cleaning_fee_cents, max_guests, bedrooms, beds, baths, check_in_time, check_out_time, house_rules, min_nights, max_nights, registration_number, reviewed_at, created_at, updated_at, deleted_at). Add `listing_media`, `listing_amenities`. Run migrations.
2. **Listing creation API** — POST /listings (or /properties, /bnhub/listings per API blueprint): validate body; create listing in draft or pending_review; require auth and host or broker role. Return listing id and status.
3. **Listing management** — GET /listings/:id, GET /listings (filter by user_id, status, type), PATCH /listings/:id. Ownership or broker link check; status transitions per moderation workflow.
4. **Image upload system** — POST /listings/:id/images (or /media/upload with listing context): validate file type and size; upload to object storage; insert listing_media; return url and id. Support order for display.
5. **Listing moderation tools** — Backend: state machine draft → pending_review → live | rejected. Admin or automated step sets status; rejection stores reason. When status becomes live, emit event or call search index (Phase 4). Optional: admin API to list pending and approve/reject.

### Deliverables

- Listings and related tables in DB; migrations applied.
- Create, read, update listing APIs; image upload; moderation state machine.
- Listings can be created by host/broker and moved to live after review.

### Exit criterion

- A host can create a listing (with at least one image), submit for review, and an admin (or automated rule) can set it to live. No search yet.

---

## 5. Phase 4 — Search and discovery

**Goal:** Users can find listings by keyword, location, filters, and (for BNHub) dates. Search is fast and uses an index, not full table scan.

### Tasks (in order)

1. **Search index setup** — Deploy search engine (Elasticsearch, OpenSearch, or equivalent). Define index mapping for listing documents: text (title, description), keyword (city, region, country, type), geo (lat/lng), numeric (price, nightly_price, rating), and availability if BNHub.
2. **Search index ingestion** — On listing created/updated/deleted or status change, upsert or delete document in search index. Use events or direct call from listing service; idempotent by listing_id. Backfill existing live listings.
3. **Search API** — GET /search/listings (or /search/properties, /search/bnhub per API blueprint): query params q, city, region, country, lat, lng, radius_km, check_in, check_out, guests, min_price, max_price, property_type, amenities, sort, page, limit. Return listing ids and total; optionally snippets. Only live listings.
4. **Filtering logic** — Apply filters in search query: date range (availability), price range, property type, amenities. For BNHub, filter by availability calendar (Phase 5) or availability data in index.
5. **Geographic search** — Geo-distance or bounding-box query; “near me” and map view. Return results with consistent sort and pagination.
6. **Search ranking** — Default sort: relevance (text score + recency). Optional: price_asc/price_desc, rating. Tie-break by id for stable pagination.
7. **Listing detail API for discovery** — GET /listings/:id (public for live): full listing, aggregate rating, review count. For BNHub, include availability summary (next 30 days) once availability exists (Phase 5).

### Deliverables

- Search index populated from listing events; search API returns relevant results with filters and geo.
- Listing detail API suitable for discovery and listing page.

### Exit criterion

- Client can search by keyword and location and get listing ids; can fetch full listing detail by id. No booking yet.

---

## 6. Phase 5 — BNHub booking engine

**Goal:** Guests can reserve stays. Availability is managed; booking lifecycle (reserve, confirm, cancel, complete) is implemented. Payment capture is in Phase 6.

### Tasks (in order)

1. **Availability calendar model** — Tables: listing_availability (listing_id, date, status [available, blocked, booked], booking_id optional). Unique (listing_id, date). Or equivalent slots model. Run migration.
2. **Availability calendar API** — GET /listings/:id/availability?start=&end=; POST/DELETE block (host). Availability sync when booking is confirmed/cancelled (below).
3. **Availability sync on booking** — When booking is confirmed: set dates to booked and set booking_id. When booking is cancelled: set dates back to available. Use transaction or outbox for consistency.
4. **Booking database model** — Table bookings: id, listing_id, guest_id, host_id, check_in, check_out, guests, status (reserved, confirmed, cancelled, completed), total_cents, currency, guest_fee_cents, host_fee_cents, host_payout_cents, idempotency_key, created_at, updated_at. Run migration.
5. **Availability check function** — Given listing_id, check_in, check_out, guests: check availability and min/max nights; return available boolean and message.
6. **Booking price calculation** — Service or function: listing_id, check_in, check_out, guests → nightly_total, cleaning_fee, platform_guest_fee, platform_host_fee, tax, total, host_payout. Use listing pricing and platform fee config.
7. **Reservation creation API** — POST /bookings: body listing_id, check_in, check_out, guests, idempotency_key. Validate availability; calculate price; create booking in status reserved. Do not charge yet (Phase 6). Optionally support “instant book” vs “request”: if instant, move to confirmed after payment in Phase 6.
8. **Booking confirmation logic** — When payment is captured (Phase 6): set booking to confirmed; block calendar; emit BookingConfirmed event. If payment fails: keep reserved or expire after TTL.
9. **Booking state machine** — Transitions: reserved → confirmed (after payment) | cancelled; confirmed → cancelled | completed (after check_out date). Completed enables review and payout. Implement GET /bookings, GET /bookings/:id, PATCH /bookings/:id/cancel with policy (refund in Phase 6).
10. **Min/max stay rules** — Enforce in availability check and booking creation; clear error if violated.

### Deliverables

- Availability calendar and APIs; booking table and lifecycle; price calculation; create and cancel booking APIs. Payment capture and confirmation in Phase 6.

### Exit criterion

- Guest can create a reservation (reserved); after Phase 6 guest can pay and booking becomes confirmed; host can see booking and availability is blocked. No payment capture in Phase 5.

---

## 7. Phase 6 — Payment infrastructure

**Goal:** Bookings can be paid for; funds are captured, held (escrow-style if required), and prepared for host payout. Refunds and transaction history exist.

### Tasks (in order)

1. **Payment provider integration** — Integrate Stripe (or equivalent): create customer, attach payment method, create payment intent, confirm. Use idempotency keys. Store customer_id and payment_method_id on user (tokenized). No raw card data.
2. **Payment and payout database models** — Tables: payments (id, booking_id, user_id, amount_cents, currency, status, provider_payment_id, fee_breakdown, created_at); payouts (id, user_id, amount_cents, currency, status, provider_payout_id, scheduled_at, paid_at, related_payment_ids). Run migrations.
3. **Payment authorization** — On booking create (or separate step): create payment intent for total; return client_secret for frontend. Frontend confirms (e.g. 3DS); webhook or callback: on success, update payment status and set booking to confirmed; block calendar; emit events.
4. **Escrow-style logic** — If product uses hold: do not transfer to host immediately; mark payment as held. Release when conditions met (e.g. X days after checkout, no dispute). Implement release condition check used by payout job.
5. **Host payout preparation** — Payout calculation: for each completed booking past release date, compute host payout (total minus platform fee, minus refunds). Create payout record in pending; queue for transfer (Phase 6 or later phase). Payout execution: call provider to transfer to host connected account; update status. Host must have connected account (Stripe Connect or bank).
6. **Payout method API** — Host adds payout method (connect account or bank). GET/PATCH /users/me/payout-methods or /payouts/accounts. Validate and store.
7. **Transaction history** — GET /users/me/payments (guest), GET /users/me/payouts (host). Filter by date, status; paginate.
8. **Refund processing** — Refund API: payment_id or booking_id, amount (full or partial), reason, idempotency_key. Call provider refund; update payment and booking; adjust host payout if applicable.
9. **Platform fee and tax** — Config for guest_fee and host_commission; tax by region if required. Store fee breakdown in payment for receipt and transparency.

### Deliverables

- Payment capture on booking; payment and payout tables; payout method and payout execution; refunds; transaction history API. Receipt or confirmation with breakdown.

### Exit criterion

- Guest can pay for a booking; booking becomes confirmed; host receives payout (after release policy); refund works. End-to-end booking + payment flow is complete.

---

## 8. Phase 7 — Messaging and reviews

**Goal:** Users can communicate (guest–host, broker–client) and submit reviews after stay. Notifications are sent for key events.

### Tasks (in order)

1. **Conversation and message models** — Tables: threads (id, type, booking_id optional), thread_participants (thread_id, user_id, role), messages (id, thread_id, sender_id, body, read_at, created_at). Run migrations.
2. **Thread creation** — Create thread when booking is confirmed (guest + host). Or on first message. One thread per booking for guest–host.
3. **Messaging API** — POST /threads/:id/messages; GET /threads (list for user); GET /threads/:id/messages (paginated). Mark read. Require participant.
4. **Notification service** — Table notifications (id, user_id, type, channel, payload, read_at, sent_at). Template mapping: event type → subject/body. Send email via provider (SendGrid, SES, etc.); optional in-app and push later.
5. **Notification triggers** — On BookingConfirmed, BookingCancelled, PayoutSent, NewMessage (optional): create notification and send email. Subscribe to events or call from booking/payment/messaging service.
6. **Notification preferences API** — GET/PATCH /users/me/notification-preferences. Respect when sending.
7. **In-app notification list** — GET /users/me/notifications; mark read.
8. **Review database schema** — Table reviews: id, booking_id, listing_id, reviewer_id, reviewee_id, role (guest_review, host_review), rating, comment, status, created_at. Unique (booking_id, role). Run migration.
9. **Review submission API** — POST /bookings/:id/reviews: validate one per booking per role; within time window after checkout. Store with status published or pending moderation.
10. **Review moderation** — Optional: queue for keyword or manual review; approve or remove. Update listing and user aggregates on publish.
11. **Rating aggregation** — On review published: update listing aggregate (avg rating, count) and user aggregate (as host/guest). Store in aggregates table or listing/user.
12. **Review list API** — GET /listings/:id/reviews; GET /users/:id/reviews (for profile).

### Deliverables

- Messaging APIs; notification service and triggers; review submit and list; rating aggregation. Users can message and review after stay.

### Exit criterion

- Guest and host can message in thread; both can leave review after checkout; listing shows aggregate rating. Key events trigger email notifications.

---

## 9. Phase 8 — Trust and safety

**Goal:** Platform can verify identity, accept incident reports, flag accounts, suspend users, and track fraud signals. Payout holds are possible.

### Tasks (in order)

1. **Identity verification integration** — Integrate provider (e.g. Stripe Identity, Onfido, Jumio): create applicant, redirect or SDK flow, webhook or poll for result. Store verification_status and provider id on user. GET /verifications/identity/status for frontend.
2. **Verification gating** — Before listing can go live, require user.verification_status = verified (or per policy). Return clear error and link to verification.
3. **Incident database and API** — Table incidents: id, reporter_id, reported_user_id, reported_listing_id, booking_id, type, description, status, priority, assignee_id, resolution_notes, created_at. POST /incidents (create); GET /incidents (list for reporter or admin); PATCH for status/assignee. Auth required.
4. **Evidence attachment** — Store evidence (file refs) with incident; API to upload and list. Used for disputes in same or later phase.
5. **Account flags** — Table or field: account_flags (user_id, flag_type, reason, created_by). Admin or automated process can add flag. Used for review queue and payout hold.
6. **Suspension system** — users.suspended_at, users.suspension_reason. Admin API to suspend/unsuspend. Auth and listing services deny access when suspended. Audit log for suspend/unsuspend.
7. **Fraud signal tracking** — Table or store: fraud_signals (entity_type, entity_id, score, flags, created_at). AI or rules can write signals; Trust & Safety and payout logic can read. Optional: hold payout when signal above threshold.
8. **Payout hold** — Admin or automated action: set payout status to on_hold, store reason. Release via admin or when condition cleared. Notification to host.

### Deliverables

- Identity verification flow and gating; incident reporting and management; account flags; suspension; fraud signal storage; payout hold. Admin can investigate and enforce.

### Exit criterion

- Host must be verified to publish listing; users can report incidents; admin can flag, suspend, and hold payout; fraud signals can be stored and used for holds.

---

## 10. Phase 9 — Host tools

**Goal:** Hosts can manage BNHub listings, calendar, bookings, and payouts via a dedicated dashboard (web). All APIs already exist; this phase is the host-facing UI and workflows.

### Tasks (in order)

1. **Host dashboard layout** — Dashboard layout component: sidebar nav (Dashboard, Listings, Calendar, Reservations, Payouts, Messages, Performance), top bar, main content. Role-gated; only host role sees it.
2. **Host dashboard home** — Page: KPI cards (listings count, upcoming reservations, earnings summary); recent activity; quick links to add listing, view requests, calendar.
3. **Listing management UI** — List host’s listings; create listing flow (multi-step or form): basics, location, photos, amenities, pricing, availability, rules, submit. Edit listing; unpublish or delete. Use listing and media APIs.
4. **Calendar management** — Calendar view for each listing; set available/blocked; bulk block range. Use availability APIs. Sync with bookings (read-only booked dates).
5. **Booking management** — List reservations (upcoming/past); filters. For request-to-book: approve/decline with message. View booking detail; link to message thread. Use booking and messaging APIs.
6. **Payout dashboard** — View payout method; list payouts (pending, paid, failed, on_hold); payout history; connect account if not connected. Use payouts and payout-account APIs.
7. **Host messaging** — Conversation list; open thread with guest; send message. Use messaging APIs. Optional: unread badge in nav.
8. **Performance analytics** — Simple view: bookings count, revenue over period, occupancy (if data available). Use analytics or booking aggregate APIs. Optional: charts in Phase 13.

### Deliverables

- Host dashboard (web) with list listings, create/edit listing, calendar, reservations, payouts, messages, and basic performance. Host can operate without using generic “profile” only.

### Exit criterion

- A host can log in, see dashboard, create and edit a listing, set availability, approve/decline requests, view payouts, and message guests. All via host dashboard UI.

---

## 11. Phase 10 — Broker CRM

**Goal:** Brokers can manage leads, clients, and listings in a dedicated CRM. APIs and data model for leads/clients are implemented; UI is broker dashboard.

### Tasks (in order)

1. **Leads and clients data model** — Tables: contacts (id, broker_id, name, email, phone, source, notes), leads (id, broker_id, contact_id, listing_id, name, email, phone, message, source, status). Run migrations. APIs: CRUD for contacts and leads; list with filters.
2. **Broker dashboard layout** — Sidebar: Dashboard, Leads, Clients, Listings, Tasks, Notes, Messages, Settings. Role-gated for broker.
3. **Broker dashboard home** — KPI cards (leads count, new this week); recent leads; quick add lead.
4. **Lead management** — Leads list or board (by status); create lead (from form or manual); update status; add note; link to contact and listing. Filter by source, status.
5. **Client management** — Contacts list; create/edit contact; view contact with linked leads and notes.
6. **Listing tracking** — List broker’s listings (listings where broker_id = current user); link to listing detail and leads. Use listing APIs.
7. **Tasks and notes** — Tasks: title, due date, related lead/contact, status. Notes: content, related lead/contact, created_at. APIs and UI for create/list/update. Optional: reminders.
8. **Broker messaging** — Reuse messaging; threads for broker–client. Inbox in broker nav.

### Deliverables

- Broker CRM (web): leads, clients, listings, tasks, notes, messaging. Brokers can capture and follow up leads.

### Exit criterion

- A broker can add a lead, convert to client, add notes and tasks, and manage their listings from the CRM.

---

## 12. Phase 11 — Owner dashboard

**Goal:** Property owners can see portfolio, revenue, maintenance, and performance in one place. Data is read from existing listing, booking, and payment data; optional maintenance and analytics APIs.

### Tasks (in order)

1. **Portfolio overview** — Page: list all properties (marketplace + BNHub) for current user; status, quick stats (bookings count, revenue if available). Use listing and booking aggregate APIs.
2. **Revenue tracking** — Revenue by period (day/month); by listing optional. Use payment/payout and booking data. Export or table. API: GET /owner/revenue or aggregate from existing APIs.
3. **Maintenance workflows** — Table maintenance_requests (id, listing_id, user_id, type, description, status, scheduled_at). API: create, list, update status. UI: list requests; create request; track status.
4. **Occupancy overview** — Occupancy by listing or portfolio (booked nights / available nights). Use booking and availability data. API and simple chart or table.
5. **Performance analytics** — Bookings count, revenue, occupancy; optional comparison to previous period. Use same data as above; can be extended in Phase 13.
6. **Payout and transaction history** — List payouts and transactions for owner (host) from Phase 6 APIs. Link from owner dashboard.
7. **Listing status management** — View and change listing status (draft, live, paused); link to edit listing (host flow or shared component).

### Deliverables

- Owner dashboard (web): portfolio, revenue, maintenance, occupancy, performance, payouts. Owner has one place to monitor all properties.

### Exit criterion

- An owner can see all their listings, revenue over time, maintenance requests, and payout history in the owner dashboard.

---

## 13. Phase 12 — Deal marketplace

**Goal:** Deals can be created, browsed, and communicated; documents can be attached. Investors and brokers use the same APIs and UI.

### Tasks (in order)

1. **Deal data model** — Tables: deals (id, owner_id, title, description, type, location, price_or_terms, visibility, status), deal_interests (id, deal_id, user_id, email, name, message). Run migrations. APIs: CRUD deals; create interest; list deals (public or filtered).
2. **Deal listing system** — Create deal (draft/published); update; delete or close. Visibility: public or invite_only. Require auth and broker or investor role for create.
3. **Deal browsing** — Search/filter deals; list and detail pages. Use search index or DB query. Public or authenticated per visibility.
4. **Deal communication** — Thread per deal (type = deal); participants = deal owner + interested users. Messaging API reuse. Or deal_messages table; API to post and list.
5. **Deal document management** — Upload documents to deal; list and download. Use media/upload API with deal context; store deal_documents (deal_id, file_id, name).
6. **Deal UI** — Deals discovery page; deal detail page; express interest form; deal owner view: list interests, messages, documents. Use deal and messaging APIs.

### Deliverables

- Deal marketplace backend and UI: create/browse deals, express interest, message, attach documents. Investors and brokers can use it.

### Exit criterion

- A broker or investor can create a deal, publish it; others can browse, express interest, and communicate; documents can be shared.

---

## 14. Phase 13 — Investment analytics

**Goal:** Market analytics, property valuation, portfolio performance, and forecasting are available to investors and owners. Data comes from listings, bookings, and optional external or batch jobs.

### Tasks (in order)

1. **Market analytics API** — Aggregate data by region (city/region): avg price, occupancy, booking count, listing count. Period (day/week/month). Store in market_data table or compute from warehouse. GET /analytics/market.
2. **Property valuation** — Internal or third-party valuation; store in property_valuations (listing_id, estimated_value_cents, type, computed_at). API: GET /analytics/valuation/:listingId. Used in owner and investor views.
3. **Portfolio performance metrics** — Revenue, occupancy, avg rate by user (owner) and period. GET /analytics/portfolio. Compute from bookings and payments.
4. **Forecasting tools** — Demand or price forecast by region; optional by listing. Store in demand_forecasts or similar. API: GET /analytics/forecasts. Can be stub or rule-based until AI Phase 14.
5. **Analytics UI** — Market overview dashboard; valuation on listing or portfolio; portfolio performance charts; forecast views. Use analytics APIs. Role-gated for investor and owner.

### Deliverables

- Analytics APIs (market, valuation, portfolio, forecasts); analytics UI for investors and owners. Data pipeline or batch jobs to populate aggregates if not real-time.

### Exit criterion

- Investors and owners can view market data, property valuation, portfolio performance, and forecasts in the app.

---

## 15. Phase 14 — AI Control Center

**Goal:** AI engines for fraud, risk, pricing, demand, and support triage are implemented or stubbed; outputs are stored and consumed by Trust & Safety and product. Admin can see queues and explanations.

### Tasks (in order)

1. **Fraud detection engine** — Inputs: listings, bookings, payments, user events. Outputs: fraud flags per user/booking/listing. Store in fraud_signals or risk_scores. Optional: rule-based first (e.g. velocity, duplicate); ML later. Consumed by: Trust & Safety, payout hold logic.
2. **Risk scoring** — Inputs: reviews, cancellations, disputes, verification. Output: risk score per user (host/guest). Store in risk_scores table. Used for instant-book eligibility, ranking, or alerts. API: GET /ai/riskScores/:userId (admin or self with limit).
3. **Pricing recommendations** — Inputs: listing, bookings, search, comparables. Output: recommended nightly price and range. Store in pricing_recommendations. API: GET /ai/pricingRecommendations/:listingId (host). Can be rule-based (e.g. median by area) until ML.
4. **Demand forecasting** — Inputs: bookings, search by region. Output: demand index or occupancy forecast by period. Store in demand_forecasts. Consumed by analytics and host dashboard. Batch job or on-demand.
5. **Support automation** — Triage: categorize incident or message; suggest priority or assignee. Optional: suggested reply. Input: incident/message; output: category, priority. Used by support console. Can be keyword-based first.
6. **Content moderation** — Optional: flag listing/review/message text for policy. Queue for human review. Integrate with moderation queue in admin. Auto-remove only when high confidence.
7. **AI operations console** — UI: fraud alerts list; risk score lookup; pricing recommendations list; moderation queue; demand forecast view. Admin and Trust & Safety use. Read from stored outputs and queues.
8. **Explanation and audit** — Log AI decisions (e.g. risk score, flag) with inputs and model version for audit. Stored in audit or AI-specific table. Visible in AI console for compliance.

### Deliverables

- Fraud, risk, pricing, demand, and optional support/moderation engines (or stubs); storage of outputs; APIs and AI ops console. Trust & Safety and product consume scores and queues.

### Exit criterion

- Fraud and risk signals can trigger holds or alerts; hosts can see pricing recommendations; admin can see AI queues and audit. No requirement for full ML in first release—rules and stubs are acceptable.

---

## 16. Phase 15 — Admin governance tools

**Goal:** Admins can moderate listings, manage users, view bookings and payments, handle incidents and disputes, hold payouts, and view audit logs. Support agents have scoped tools.

### Tasks (in order)

1. **Admin dashboard** — Layout: sidebar (Users, Listings, Bookings, Payments, Incidents, Disputes, Payout holds, Audit logs, Compliance, Feature flags). Role-gated: admin only. Home: KPI cards (counts) and recent activity.
2. **User management** — List users; search and filter by role, status; view user detail; suspend/unsuspend with reason. Use user and auth APIs; audit log for suspend.
3. **Listing moderation** — List listings by status (pending_review, reported); view detail; approve or reject with reason. Update listing status; emit event for search index. Optional: bulk actions.
4. **Booking and payment review** — List bookings and payments; filter; view detail. Read-only except for support refund path. Link to user and listing.
5. **Incident management** — List incidents; filter by status, type; assign; add notes; resolve with resolution_notes. Evidence view. Use incident APIs.
6. **Dispute management** — List disputes; assign; view evidence and thread; resolve (refund full/partial/none); execute refund via payment API. Audit log.
7. **Payout holds** — List held payouts; view reason; release or extend hold. Use payout APIs; audit log.
8. **Audit logs** — Query audit log by actor, resource, action, date range. Table or dedicated store. Export optional. Only admin/compliance.
9. **Feature flags** — Table or config: key, enabled, rollout_percent. API to read; admin UI to toggle. Used by frontend and backend for gradual rollout.
10. **Support console** — Inbox (threads type support); ticket detail; user and booking lookup; refund tool; escalate to admin. Support role has limited write; admin has full. Reuse messaging and user/booking APIs.

### Deliverables

- Admin console (web): users, listings, bookings, payments, incidents, disputes, payout holds, audit logs, feature flags. Support console for agents. All actions audited.

### Exit criterion

- Admin can moderate listings, suspend users, resolve incidents and disputes, hold/release payouts, and view audit logs. Support can handle tickets and process refunds within policy.

---

## 17. Phase 16 — Mobile application

**Goal:** Mobile (iOS and/or Android) delivers guest booking, host tools, and broker essentials. Same APIs as web; native or cross-platform (e.g. React Native); push notifications.

### Tasks (in order)

1. **Mobile app shell** — Project setup (React Native, Flutter, or native); navigation (bottom tab for guest: Home, Search, Trips, Messages, Profile). Auth state; token storage (secure).
2. **Mobile login** — Sign up and login screens; token storage; refresh; logout. Deep link for password reset. Same auth API.
3. **Search experience** — Search screen: location, dates, guests; results list and map toggle; filters in sheet; listing detail. Use search and listing APIs. Mobile-optimized layout.
4. **Booking flow** — Listing detail → date picker → guest count → price summary → checkout (guest details, payment). Use booking and payment APIs. Apple Pay / Google Pay if supported by provider. Confirmation screen and deep link to trip.
5. **Trips and messaging** — Trips list (upcoming/past); trip detail; message host (thread). Use booking and messaging APIs. Push for new message and booking updates.
6. **Push notifications** — Register device token with backend; send push on booking confirmed, message, payout (host). Use FCM/APNs. Deep link to relevant screen.
7. **Host mobile** — Host tab or section: dashboard summary; listing list; calendar (simplified); reservations list; approve/decline; payouts view; messages. Same APIs as host web.
8. **Broker mobile** — Leads list; clients list; messages; tasks. Same APIs as broker web. Optional: full CRM on tablet.
9. **Profile and settings** — Profile, verification status, payment methods, notification preferences, logout. Same APIs as web.

### Deliverables

- Mobile app(s) for guest and host (and optionally broker) with login, search, book, trips, messaging, push, and host/broker tools. Same backend; no duplicate business logic.

### Exit criterion

- A guest can search, book, pay, and message from the mobile app; a host can manage listings and reservations from the app. Push notifications work for key events.

---

## 18. Phase 17 — Testing and stability

**Goal:** System is validated and production-ready. Unit, integration, and E2E tests cover critical paths; security and load testing are done; UAT is completed.

### Tasks (in order)

1. **Unit tests** — Components (UI) and services (API handlers, business logic): happy path and error cases. Run in CI. Target: critical paths (auth, listing create, booking create, payment) have coverage.
2. **Integration tests** — API tests: register → login → create listing → search → create booking → pay → cancel/refund. Use test DB and mock payment provider. Run in CI.
3. **Security testing** — Auth: invalid token, expired token, wrong role. Authorization: access other user’s resources returns 403. No secrets in logs or client. Optional: automated scan (e.g. OWASP).
4. **Load testing** — Search, listing detail, and booking create under expected load. Identify bottlenecks; tune DB and cache. Set SLOs (latency, error rate).
5. **User acceptance testing** — Key flows with real users (internal or beta): sign up, list property, search, book, pay, message, review, host dashboard, admin moderation. Fix issues before launch.
6. **Stability hardening** — Error handling and retries; circuit breakers for external calls; graceful degradation. Logging and alerts for production. Runbooks for incidents.

### Deliverables

- Test suite (unit, integration, E2E) in CI; security and load test results; UAT sign-off; runbooks and monitoring ready.

### Exit criterion

- Critical paths pass automated tests; security and load tests show no blockers; UAT is complete; team can operate and respond to incidents.

---

## 19. Phase 18 — Montreal pilot launch

**Goal:** Platform is live in Montreal with initial supply, onboarding, marketing, and support. No new feature development; only launch activities and fixes.

### Tasks (in order)

1. **Initial listings** — Acquire or create initial BNHub and marketplace listings in Montreal. Quality check; ensure photos and descriptions are complete. Use listing and moderation flow.
2. **Host onboarding** — Onboard first hosts: verification, payout account connection, listing creation support. Document and train; support channel ready.
3. **Broker onboarding** — Onboard first brokers: CRM access, lead capture from marketplace, support. Same as above.
4. **Marketing preparation** — Landing page, SEO, and launch messaging for Montreal. Track signups and bookings from campaign. Use feature flags if needed for geo or cohort.
5. **Customer support readiness** — Support console and macros; help center or FAQ; escalation path to Trust & Safety and admin. Support team trained on refund and dispute policy.
6. **Trust and safety readiness** — Verification and incident flows tested; moderation queue staffed; payout hold and suspension process clear. No go-live without T&S ready.
7. **Admin oversight** — Admin team can monitor listings, bookings, payments, incidents, and audit logs. On-call or coverage for launch period.
8. **Payment readiness** — CAD and payment provider verified; tax if required; receipt and payout tested end-to-end in production-like env.
9. **Launch and monitor** — Go live; monitor errors, latency, and business metrics (listings, bookings, revenue). Fix critical issues immediately; backlog non-blocking items. Follow [Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md).

### Deliverables

- Live platform in Montreal; initial supply and demand; support and admin ready; launch metrics and monitoring in place.

### Exit criterion

- Platform is publicly available in Montreal; guests can book; hosts can list and get paid; support and Trust & Safety can handle issues; no critical outages.

---

## 20. Phase 19 — Global scaling preparation

**Goal:** Platform can expand to new regions. Localization, multi-currency, regional compliance, and infrastructure scaling are in place. No single-city assumptions remain in critical paths.

### Tasks (in order)

1. **Localization systems** — i18n for frontend (strings by locale); locale and language from user preference or region. Backend: date/number format by locale; optional translated content for listings. Document supported locales.
2. **Multi-currency** — Store amounts with currency code everywhere; display and charge in user’s or listing’s currency. Payment provider supports multiple currencies; convert or charge in local currency per region. Config per region for supported currencies.
3. **Regional compliance** — Config for tax rules, short-term rental regulations, and data residency by region. Legal pages and consent per jurisdiction. Moderation and support can filter by region.
4. **Regional payment methods** — Add payment methods per region (e.g. iDEAL, SEPA) via provider. Config-driven; no hard-coded method list.
5. **Infrastructure scaling** — Multi-region or multi-tenant readiness: DB read replicas; CDN and API in additional regions if needed; queues and workers scale with load. Document scaling runbook.
6. **AI and data per region** — Training or calibration data per region if AI models are region-specific; otherwise document that models are global. Compliance monitoring per region if required.

### Deliverables

- Localization, multi-currency, regional compliance config, regional payment methods, and scaling documentation. Platform is ready to add new cities/regions following [Global Expansion Blueprint](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md).

### Exit criterion

- A new region can be added by config (locale, currency, compliance, payment methods) without code change to core flows; infrastructure can scale with load.

---

## 21. Final build summary

### Build sequence (phases at a glance)

| Phase | Name | Outcome |
|-------|------|---------|
| 1 | Infrastructure foundation | Stable dev/deploy environment; DB, logging, CI/CD |
| 2 | Core user system | Users can register, login, and be authorized by role |
| 3 | Listing infrastructure | Hosts/brokers can create and manage listings; images; moderation |
| 4 | Search and discovery | Users can find listings by keyword, location, filters |
| 5 | BNHub booking engine | Guests can reserve; availability and booking lifecycle |
| 6 | Payment infrastructure | Bookings can be paid; payouts and refunds work |
| 7 | Messaging and reviews | Users can message and review; notifications sent |
| 8 | Trust and safety | Verification, incidents, flags, suspension, fraud signals, payout hold |
| 9 | Host tools | Host dashboard: listings, calendar, bookings, payouts |
| 10 | Broker CRM | Broker dashboard: leads, clients, listings, tasks, notes |
| 11 | Owner dashboard | Owner dashboard: portfolio, revenue, maintenance |
| 12 | Deal marketplace | Deals: create, browse, communicate, documents |
| 13 | Investment analytics | Market, valuation, portfolio, forecasts |
| 14 | AI Control Center | Fraud, risk, pricing, demand, support triage; AI ops console |
| 15 | Admin governance | Admin and support consoles; moderation, incidents, disputes, audit |
| 16 | Mobile application | iOS/Android: guest and host flows; push |
| 17 | Testing and stability | Unit, integration, E2E, security, load, UAT |
| 18 | Montreal pilot launch | Go live in Montreal; supply, support, T&S ready |
| 19 | Global scaling preparation | Localization, multi-currency, regional compliance, scaling |

### Why this order works

- **Dependencies are respected:** No listing without users; no search without listings; no booking without search and availability; no payment without booking; no host dashboard without booking and payment; no deals/analytics without core data; no AI without events and data; no admin without incidents and disputes; no mobile without APIs; no launch without testing.
- **Vertical slices early:** After Phase 6, the core loop (sign up → list → search → book → pay) is end-to-end. After Phase 9, hosts can operate fully. Pilot launch (Phase 18) is feasible after Phase 17.
- **Trust and safety early:** Verification and incidents are in Phase 8, before scaling supply. Fraud signals and holds protect the platform from day one of real usage.
- **Advanced features later:** Deal marketplace, investment analytics, and AI Control Center use data and flows that only exist after Phase 11. Building them earlier would duplicate or block.
- **Pilot-first:** The sequence prioritizes one city (Montreal) with full guest and host flows, support, and admin. Global scaling (Phase 19) follows pilot validation.

### How to use this document

- **Engineers:** Implement phases in order. Within a phase, complete backend APIs before frontend that depends on them; parallelize only where tasks are independent. Mark phase complete when exit criteria are met.
- **AI coding tools:** Use phase and task order as the instruction sequence. For each task, refer to [Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md) for IDs and [API](LECIPM-API-ARCHITECTURE-BLUEPRINT.md) / [Database](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md) / [Frontend](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md) for contracts and UI.
- **Project leads:** Track progress by phase; do not start Phase N until Phase N−1 is done. Use Phase 18 (Montreal) as the first major milestone; Phase 19 as the bridge to expansion.

This build order allows the LECIPM platform to become **functional for a pilot launch** as early as possible while **scaling safely** into a full ecosystem with Trust & Safety, multiple dashboards, deals, analytics, and AI.

---

*References: [LECIPM System Map](LECIPM-SYSTEM-MAP.md), [LECIPM Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md), [LECIPM Development Sprint Plan](LECIPM-DEVELOPMENT-SPRINT-PLAN.md), [LECIPM Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md), [LECIPM API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [LECIPM Frontend Architecture Blueprint](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md), [LECIPM Design-to-Code Implementation Guide](LECIPM-DESIGN-TO-CODE-IMPLEMENTATION-GUIDE.md), [LECIPM Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md), [LECIPM Global Expansion Blueprint](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md).*
