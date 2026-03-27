# LECIPM Platform — Development Sprint Plan

**16-sprint development plan for the first 16 weeks**

This document organizes [Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md) tasks into a structured sprint plan. Each sprint is one week; the plan covers 16 weeks and leads to Montreal pilot readiness. It aligns with the [Master Product Roadmap](LECIPM-MASTER-PRODUCT-ROADMAP.md) and [Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md). Use it to assign work, track progress, and run retrospectives.

---

## 1. Sprint planning philosophy

### Development strategy

| Principle | Application |
|-----------|-------------|
| **Build core infrastructure first** | Sprints 1–2 establish users, auth, and listings. No feature work depends on missing foundations. Database, API gateway, and config are in place before domain logic. |
| **Launch a minimal viable platform early** | By end of Sprint 6, the core loop is complete: sign up → list → search → book → pay → message → review. Web app supports guest and host flows. This is the MVP for internal/beta testing. |
| **Integrate trust and safety early** | Identity verification is in Sprint 1; incident reporting and fraud signals are in Sprint 7. Safety is not deferred; it is part of the first production-ready slice. |
| **Gradually introduce advanced features** | Broker CRM, deal marketplace, and AI run in Sprints 9–11 after the core is stable. Each sprint adds one major capability so that testing and integration stay manageable. |
| **Prioritize stability before scaling** | Sprints 14–15 focus on testing, hardening, and pilot preparation. No new major features in the last two sprints before launch; only fixes, performance, and ops readiness. |

### Sprint cadence and scope

- **Duration:** 1 week per sprint. Adjust to 2-week sprints if the team prefers; double the task load per sprint accordingly.
- **Goal per sprint:** One clear outcome (e.g. “Platform user foundation”) and a short list of deliverables. Tasks are drawn from the [Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md); task IDs are listed for traceability.
- **Dependencies:** Sprints are ordered so that dependencies are respected (e.g. booking before payment charge, listing before search index). Parallel work within a sprint is possible where tasks are independent.
- **Definition of done:** Task is complete when it is implemented, reviewed, merged, and covered by automated tests where applicable. No “partial” completion for critical path items.

---

## 2. Sprint 1 – Platform foundation

**Goal:** Create the platform user foundation: database, auth, and access control so that all other features can assume a logged-in user and roles.

**Duration:** Week 1.

**Tasks from Engineering Task Map:**

| Task ID | Task |
|---------|------|
| F-01 | Create user database schema |
| F-02 | Create user profile extensions |
| F-03 | Build user service API |
| F-04 | Build authentication service |
| F-05 | Implement token issuance and validation |
| F-06 | Implement account registration flow |
| F-07 | Implement login system |
| F-10 | Build role-based access control (RBAC) |
| F-11 | Create API gateway or BFF routing |
| F-12 | Implement request logging and correlation ID |
| F-13 | Create application configuration and secrets management |

**Deliverables:**

- Users table and migrations; user service with create/get/update.
- Signup and login endpoints; JWT (or opaque) token issue and validation.
- API gateway or BFF that routes requests and attaches user from token.
- RBAC middleware so that routes can require host, broker, or admin.
- Config and secrets for DB and environment; no secrets in code.

**Success criteria:**

- A developer can sign up (email, password), log in, and receive a token; token is validated on a protected route. Role-based denial returns 403.

**Deferred to Sprint 2:** Identity verification (F-08, F-09) is built in Sprint 2 so that Sprint 1 stays focused on auth and schema.

---

## 3. Sprint 2 – Listing system

**Goal:** Enable property listing creation: data model, CRUD APIs, image upload, validation, and moderation workflow so that hosts can create and submit listings.

**Duration:** Week 2.

**Tasks:**

| Task ID | Task |
|---------|------|
| F-08 | Create identity verification integration |
| F-09 | Build identity verification status API |
| L-01 | Create listing database model |
| L-02 | Create listing media storage model |
| L-03 | Build listing creation API |
| L-04 | Build listing update API |
| L-05 | Build listing get and list APIs |
| L-06 | Create property image upload system |
| L-07 | Implement listing validation and completeness check |
| L-08 | Implement listing moderation workflow |
| L-11 | Add marketplace-specific listing fields |
| L-12 | Add BNHub-specific listing fields and validation |

**Deliverables:**

- Listings and listing_media tables; BNHub and marketplace field support.
- POST/PATCH/GET listing APIs; ownership and role checks.
- Image upload to object storage; URL stored in DB; validation (type, size).
- Completeness check and moderation state machine (draft → pending_review → live | rejected).
- Identity verification integration and status API; host must be verified before listing can go live (enforced in API).

**Success criteria:**

- Host can complete verification (or mock), create a listing with photos, submit for review; admin or automated step can approve and listing becomes live. Listing appears in DB; not yet in search (Sprint 3).

---

## 4. Sprint 3 – Search and discovery

**Goal:** Allow users to discover listings via search API, filters, geo, and ranking. Listings are indexed when they go live.

**Duration:** Week 3.

**Tasks:**

| Task ID | Task |
|---------|------|
| L-09 | Build listing search index pipeline |
| L-10 | Implement listing soft delete and archive |
| S-01 | Create search index schema |
| S-02 | Build search index ingestion |
| S-03 | Create property search API |
| S-04 | Implement search filters |
| S-05 | Build geographic search |
| S-06 | Implement sorting and ranking |
| S-07 | Integrate availability into search (stub or simple join) |
| S-08 | Build listing detail API for discovery |

**Deliverables:**

- Search engine index with mapping for listings; ingestion on listing create/update/status change.
- GET /search/listings with q, location, dates, price, type, amenities, sort, pagination.
- Geo search (distance or bounds); only live listings returned.
- GET /listings/:id/detail with full listing and aggregate rating (placeholder if no reviews yet).
- Soft delete/archive so that archived listings are excluded from index.

**Success criteria:**

- Searching by city and filters returns relevant listing IDs; listing detail returns full record. Availability in search can be a stub (all available) until Sprint 4.

---

## 5. Sprint 4 – Booking engine

**Goal:** Enable BNHub booking: availability calendar, reservation creation with payment, cancellation, and confirmation so that guests can book and hosts see reservations.

**Duration:** Week 4.

**Tasks:**

| Task ID | Task |
|---------|------|
| B-01 | Create availability calendar database model |
| B-02 | Create availability calendar API |
| B-03 | Implement availability sync on booking |
| B-04 | Create booking database model |
| B-05 | Build availability check function |
| B-06 | Build booking price calculation service |
| B-07 | Build booking creation API (with payment) |
| B-08 | Implement reservation management API |
| B-09 | Implement guest checkout flow (backend) |
| B-10 | Create booking confirmation and receipt |
| B-11 | Implement min/max stay rules |
| B-12 | Build booking state machine |

**Deliverables:**

- Availability table and API (get, block); sync on confirm/cancel.
- Bookings table; availability check and price calculation services.
- POST /bookings with idempotency; integration with payment service to charge guest (payment service may be stubbed in Sprint 4 and implemented in Sprint 5; if so, booking creation succeeds after “payment success” callback or mock).
- GET /bookings for guest and host; PATCH cancel with policy and calendar release.
- Confirmation and receipt (email or in-app notification); state machine (confirmed → cancelled | completed).

**Success criteria:**

- Guest can request booking for available dates; system calculates price; after payment success (real or mock), booking is created and calendar blocked. Guest and host can see booking; guest can cancel and calendar is released.

**Note:** If payment provider is not integrated in Sprint 4, use a mock payment success so that booking and availability flows are testable; integrate real payment in Sprint 5.

---

## 6. Sprint 5 – Payment infrastructure

**Goal:** Enable secure financial transactions: guest charge, escrow/hold, host payout, refunds, and transaction history so that real money can flow for Montreal pilot.

**Duration:** Week 5.

**Tasks:**

| Task ID | Task |
|---------|------|
| P-01 | Integrate payment provider API |
| P-02 | Create payment and payout database models |
| P-03 | Implement guest charge flow |
| P-04 | Implement escrow/hold logic |
| P-05 | Create payout calculation job |
| P-06 | Implement payout execution |
| P-07 | Build payout method API |
| P-08 | Build refund processing |
| P-09 | Create transaction history API |
| P-10 | Implement platform fee and tax calculation |
| P-11 | Handle payment failures and retries |
| SEC-06 | Secure payment flows (idempotency, validate amount and booking) |

**Deliverables:**

- Stripe (or equivalent) integration: customer, payment method, payment intent, confirm. Charge at booking creation.
- Payments and payouts tables; fee and tax calculation; escrow/hold and release logic.
- Payout job: compute and create payouts after release date; execute transfer to host account. Payout method API for host to add bank or Connect account.
- Refund API; idempotent; updates booking and payment. GET /users/me/payments and /users/me/payouts.

**Success criteria:**

- Guest is charged in test mode when booking; host receives payout (test) after release date. Refund works for cancellation. No raw card data on platform.

---

## 7. Sprint 6 – Messaging and reviews

**Goal:** Enable communication and feedback: guest–host messaging, notifications, review submission, and reputation scoring so that post-booking communication and reviews work.

**Duration:** Week 6.

**Tasks:**

| Task ID | Task |
|---------|------|
| M-01 | Create conversation and message database models |
| M-02 | Build thread creation logic |
| M-03 | Build messaging API |
| M-05 | Create notification service |
| M-06 | Implement notification triggers |
| M-07 | Build notification preferences API |
| M-08 | Implement in-app notification list API |
| R-01 | Create review database schema |
| R-02 | Build review submission API |
| R-03 | Implement review moderation |
| R-04 | Calculate and store aggregate ratings |
| R-05 | Build review list API |
| R-06 | Implement review window logic |

**Deliverables:**

- Threads and messages; thread created when booking is confirmed. POST/GET messages; GET threads.
- Notification service: table, templates, email send; triggers on BookingConfirmed, NewMessage, etc. In-app notification list and preferences.
- Reviews table; submit after checkout within window; moderation queue; aggregate rating on listing and user; GET reviews for listing and profile.

**Success criteria:**

- After a booking, guest and host can message in the booking thread. When stay ends, both can submit a review; aggregates update and display on listing.

**Optional:** M-04 (real-time messaging) can be deferred to a later sprint; poll or refresh is acceptable for MVP.

---

## 8. Sprint 7 – Trust & Safety

**Goal:** Protect users and platform: identity verification gating, incident reporting, fraud signals, account/listing suspension, dispute workflow, and payout hold so that operations can handle reports and high-risk cases.

**Duration:** Week 7.

**Tasks:**

| Task ID | Task |
|---------|------|
| T-01 | Implement identity verification gating |
| T-02 | Create incident database model |
| T-03 | Build incident reporting API |
| T-04 | Build incident management API (admin) |
| T-05 | Create fraud detection signals (rules) |
| T-06 | Implement account suspension system |
| T-07 | Implement listing suspension |
| T-08 | Build dispute workflow and database |
| T-09 | Build dispute resolution API |
| T-10 | Implement payout hold for high-risk |
| AI-01 | Implement fraud detection rules engine (basic) |
| AI-02 | Create risk scoring pipeline (basic rules) |
| AI-07 | Expose AI outputs via API (admin) |
| AI-08 | Implement audit log for AI decisions |

**Deliverables:**

- Verification gating: listing cannot go live if user is not verified.
- Incidents table and POST /incidents (user); GET/PATCH /admin/incidents (admin).
- Fraud rules: duplicate listing, new user + high value, velocity. Risk score (rule-based) per user/booking; store and expose to admin.
- Account and listing suspension (fields and API); dispute table and resolve API; payout hold when risk is high.
- Audit log when AI or admin action affects user/payout.

**Success criteria:**

- User can report an incident; admin sees it and can resolve. High-risk booking or user can be held or suspended. Disputes can be resolved with refund or no refund.

---

## 9. Sprint 8 – Host and owner tools

**Goal:** Support professional users with host dashboard and owner portfolio: list listings, calendar, bookings, payouts, and basic performance so that hosts and owners can manage their side on web.

**Duration:** Week 8.

**Tasks:**

| Task ID | Task |
|---------|------|
| O-01 | Build portfolio list API |
| O-02 | Implement revenue analytics aggregation |
| O-03 | Create owner dashboard summary API |
| O-04 | Build payout history for owner |
| O-05 | Create maintenance tracking tables (optional) |
| MO-01 | Build responsive web app shell |
| MO-02 | Implement web login and registration screens |
| MO-04 | Build listing detail page (web) |
| MO-05 | Implement booking/checkout flow (web) |
| MO-06 | Build host dashboard (web) |
| MO-07 | Build “My trips” and messaging (web) |

**Deliverables:**

- Owner/portfolio APIs: list listings, revenue aggregation, dashboard summary, payout history.
- Web app: shell, auth pages, listing detail, checkout (calls booking + payment), host dashboard (listings, calendar, bookings, payouts, messages), guest “My trips” and messaging. Responsive layout.

**Success criteria:**

- Host can log in, see dashboard with listings and bookings, and manage calendar and payouts. Guest can search (from Sprint 3), view listing, book, pay, and see “My trips” and messages. End-to-end flow works on web.

**Note:** MO-03 (search interface) may be partially done in Sprint 3 or 4; ensure search UI is wired in this sprint if not already.

---

## 10. Sprint 9 – Broker CRM

**Goal:** Support real estate professionals: client management, lead tracking, broker dashboard, and listing management so that brokers can manage contacts, leads, and listings.

**Duration:** Week 9.

**Tasks:**

| Task ID | Task |
|---------|------|
| C-01 | Create client/contact database model |
| C-02 | Create lead database model |
| C-03 | Build client management API |
| C-04 | Build lead tracking API |
| C-05 | Build broker dashboard data API |
| C-06 | Implement broker listing association |
| C-07 | Create broker profile and verification |
| C-08 | Implement lead capture from listing form |

**Deliverables:**

- Contacts and leads tables; CRUD APIs for broker. Dashboard API (counts, recent listings, recent leads).
- Listing.broker_id; broker sees listings where they are the broker. Broker profile and verification (manual or integration).
- When a user submits “Contact” on a listing with a broker, create lead and notify broker.

**Success criteria:**

- Broker can add contacts, view leads from listing forms, and see their listings in one dashboard. Lead capture from listing form creates a lead linked to broker.

---

## 11. Sprint 10 – Deal marketplace

**Goal:** Enable investment opportunities: deal listing, search, expression of interest, and deal communication so that investors can discover deals and deal owners can receive interest.

**Duration:** Week 10.

**Tasks:**

| Task ID | Task |
|---------|------|
| D-01 | Create deal database model |
| D-02 | Build deal creation and update API |
| D-03 | Build deal search and list API |
| D-04 | Implement expression of interest |
| D-05 | Build deal communication (messaging) |
| D-06 | Implement deal analytics (views, interest count) |

**Deliverables:**

- Deals table; POST/PATCH/GET deals; GET /deals with filters and visibility. Deal interest table and POST /deals/:id/interest; notify deal owner.
- Thread for deal and interested user; deal owner can message. Analytics: view count and interest count for deal owner.

**Success criteria:**

- Broker or qualified user can create a deal; investors can browse and express interest; deal owner sees interest and can message.

---

## 12. Sprint 11 – AI Control Center

**Goal:** Improve platform intelligence: fraud detection engine, risk scoring, dynamic pricing recommendations, content moderation pipeline, and support triage so that safety and host tools are smarter.

**Duration:** Week 11.

**Tasks:**

| Task ID | Task |
|---------|------|
| AI-03 | Build dynamic pricing recommendation service |
| AI-04 | Implement demand forecasting job |
| AI-05 | Implement content moderation pipeline |
| AI-06 | Build support triage (classification) |

**Deliverables:**

- Pricing recommendation API: input listing and dates, output suggested nightly price; host dashboard can display (host applies manually).
- Demand forecast job: aggregate bookings/search by region and date; store or expose for pricing and analytics.
- Content moderation: on listing/review/message create, run rules or model; flag and queue for human review. Support triage: classify incoming ticket and route; optional suggested reply.

**Success criteria:**

- Host sees a pricing suggestion (or “coming soon”) in dashboard. Moderation queue receives flagged content. Support tickets get a suggested category and route.

---

## 13. Sprint 12 – Admin governance tools

**Goal:** Enable platform governance: moderation dashboard, incident management UI, financial monitoring, platform analytics, and audit so that ops and Trust & Safety can run the platform.

**Duration:** Week 12.

**Tasks:**

| Task ID | Task |
|---------|------|
| AD-01 | Create moderation queue API |
| AD-02 | Build incident management UI backend |
| AD-03 | Implement financial monitoring API |
| AD-04 | Create platform analytics API |
| AD-05 | Build user and listing admin APIs |
| AD-06 | Implement audit logging for admin actions |

**Deliverables:**

- GET /admin/moderation/* (listings, reviews, messages) with actions (approve, remove) and reason. Incident list and detail already in Sprint 7; add any filters or bulk actions needed.
- GET /admin/payments, /admin/payouts, /admin/payouts/holds. GET /admin/analytics/overview (users, listings, bookings, GMV, revenue).
- GET /admin/users/:id, PATCH suspend; GET /admin/listings/:id, PATCH suspend. All admin PATCH logged with admin_id, resource, action, reason.

**Success criteria:**

- Admin can open moderation queue, resolve incidents, view financial and platform metrics, and suspend users/listings with full audit trail.

---

## 14. Sprint 13 – Mobile app preparation

**Goal:** Prepare mobile deployment: mobile auth, property search, booking flow, and notifications on iOS and Android so that native apps can be used for Montreal pilot or shortly after.

**Duration:** Week 13.

**Tasks:**

| Task ID | Task |
|---------|------|
| MO-09 | Create iOS app project and auth |
| MO-10 | Build iOS search and booking flow |
| MO-11 | Create Android app project and auth |
| MO-12 | Build Android search and booking flow |
| MO-13 | Implement mobile push notifications |
| MO-14 | Secure storage for tokens and sensitive data |

**Deliverables:**

- iOS app: login/signup, token in keychain; search screen, listing detail, checkout (native or web view). Same APIs as web.
- Android app: same flows; token in Keystore; FCM for push.
- Backend: device registration and push send (FCM/APNs). Notifications trigger push for NewMessage, BookingConfirmed, etc.

**Success criteria:**

- User can log in on iOS and Android, search, view listing, and complete booking. Push notification received for new message or booking (when app is configured).

---

## 15. Sprint 14 – Testing and stability

**Goal:** Ensure platform stability: unit tests for critical paths, API integration tests, security and performance testing so that pilot launch is not blocked by quality issues.

**Duration:** Week 14.

**Tasks:**

| Task ID | Task |
|---------|------|
| TE-01 | Write unit tests for core services |
| TE-02 | Write API integration tests |
| TE-03 | Write payment integration tests (sandbox) |
| TE-04 | Conduct security testing |
| TE-05 | Run performance and load tests |
| TE-06 | Implement test data and fixtures |
| SEC-01 through SEC-08 | Review and harden (passwords, tokens, encryption, audit, rate limit, authorization) |

**Deliverables:**

- Unit tests: auth, listing validation, price calculation, availability check, booking state machine. Target coverage for payment and booking logic.
- Integration tests: full flow from signup to booking to payout (with sandbox payment). Security: dependency scan, auth and role checks, no secrets in logs.
- Load test: search and booking at target RPS; document p95 latency and error rate. Staging seed data and reset script.

**Success criteria:**

- Critical path has automated tests; security scan clean; load test meets or is close to targets. Known issues documented and triaged.

---

## 16. Sprint 15 – Montreal pilot preparation

**Goal:** Prepare for pilot launch: beta testing, host and broker onboarding flows, support setup, and launch checklist so that Montreal can open with confidence.

**Duration:** Week 15.

**Tasks:**

- Execute [Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md) readiness checklist (product, payment, Trust & Safety, support).
- Beta testing: invite 20–50 users (hosts and guests); run real bookings in Montreal; collect feedback and fix critical bugs.
- Host onboarding: ensure flow (signup → verify → create listing → review → go live) is smooth; help content and tooltips in place.
- Broker onboarding: ensure broker signup, verification, and listing creation work; document broker flow for partners.
- Customer support: ticketing system, SLAs, escalation paths, and runbooks. Support team trained on platform and Montreal-specific rules.
- Localization: French and English for key flows; CAD and Quebec tax/registration if required. Config and copy reviewed.

**Deliverables:**

- Readiness checklist signed off (or exceptions documented). Beta report with issues and fixes. Onboarding flows documented and tested. Support ready for launch week.

**Success criteria:**

- Platform meets [readiness criteria](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#3-platform-readiness-checklist); beta users completed full booking flow; support can handle first wave of tickets.

---

## 17. Sprint 16 – Pilot launch

**Goal:** Launch the platform in Montreal: production deployment, monitoring, and incident response so that the pilot is live and operations can respond to issues.

**Duration:** Week 16.

**Tasks:**

- **Platform deployment:** Deploy to production per [Deployment tasks](LECIPM-ENGINEERING-TASK-MAP.md#19-deployment-tasks). Run migrations; smoke test critical paths. Blue-green or rolling update; rollback plan ready.
- **Monitoring systems:** Dashboards for latency, error rate, bookings, payments. Alerts for errors and SLO breach. On-call or designated responder for launch week.
- **Incident response:** Runbook for payment outage, search down, or critical bug. Escalation to product and leadership. Post-incident review for any P0/P1.
- **Launch communication:** Internal go-live notice; optional user communication (email, in-app) for Montreal launch. Track launch metrics (signups, listings, first bookings).

**Deliverables:**

- Production live; Montreal (or Canada) region enabled. Monitoring and alerts active. Incident process documented and tested. Launch metrics baseline recorded.

**Success criteria:**

- Platform is live in Montreal; first real bookings can be made; monitoring and support are in place. [Launch day operations](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#12-launch-day-operations) followed.

---

## 18. Sprint metrics

Track these each sprint to assess velocity and quality.

| Metric | Definition | Target (example) |
|--------|------------|-------------------|
| **Task completion rate** | % of planned tasks (from this plan) completed and merged by end of sprint | ≥ 85% per sprint; 100% for critical path |
| **Bug resolution time** | Time from bug report to fix merged (for P0/P1: to deploy) | P0: < 4 h; P1: < 24 h; P2: within next sprint |
| **Platform stability** | Uptime and error rate for core APIs (search, booking, payment) in staging/prod | Uptime ≥ 99%; error rate < 0.5% |
| **Build and deploy** | CI green; deploy to staging at least once per sprint; production when planned | No red CI for main; deploy success |
| **Test coverage** | % of critical paths (auth, booking, payment) covered by automated tests | Increase each sprint; ≥ 80% for payment/booking by Sprint 14 |

**Review:** Sprint lead or tech lead reviews metrics at sprint review. Below-target metrics trigger root cause and plan (e.g. scope reduction, pairing, or spillover).

---

## 19. Sprint retrospective process

After each sprint, the team runs a short retrospective to improve process and outcomes.

**Steps:**

1. **Performance review:** Did we meet the sprint goal? Which tasks shipped, which slipped, and why? Metrics (completion rate, bugs, stability) reviewed.
2. **Issue analysis:** What blocked us? (e.g. dependency, unclear requirement, env issue.) What went well? Capture in a short list (keep/drop/try).
3. **Process improvement:** One or two concrete changes for the next sprint (e.g. “Daily standup at 9:30,” “PRs under 400 lines,” “Document API contract before coding”). Assign owner.
4. **Backlog and prioritization:** Move incomplete tasks to next sprint or backlog; adjust scope if needed so that next sprint goal is achievable.
5. **Documentation:** Retro notes stored (wiki or doc); visible to team and leadership. No blame; focus on system and process.

**Cadence:** 30–45 minutes at end of each sprint. Facilitator rotates. Action items from retro are reviewed at next sprint planning.

---

## 20. Long-term development continuation

Beyond the first 16 weeks, development continues along the [Master Product Roadmap](LECIPM-MASTER-PRODUCT-ROADMAP.md) and [Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md) waves.

**Priorities after pilot launch:**

- **Montreal 90-day cycle:** Use [First 90-day monitoring](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#13-first-90-day-monitoring-plan) to drive fixes, performance tuning, and small improvements. New features are minimal during this period unless critical for pilot success.
- **Expansion readiness:** When [expansion criteria](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#16-expansion-readiness-evaluation) are met, plan next city (e.g. Quebec City or Toronto). Sprints focus on localization, regional config, and scaling (search, payments, support) for a second market.
- **Wave 3–4 features:** Continue Broker CRM depth, Deal marketplace, Investment analytics, and AI (pricing, demand, moderation). Mobile feature parity and polish. Each feature is scheduled in 1–2 sprints with clear acceptance criteria.
- **New capabilities:** Travel ecosystem, channel manager, cleaning marketplace, and advanced analytics are scheduled when product and business prioritize them; each is broken into tasks and added to the task map and sprint plan.

**Sprint planning beyond Week 16:**

- Sprints remain 1 (or 2) weeks. Backlog is the [Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md) plus bugs and tech debt.
- Product and engineering agree on next sprint goal and task set; dependencies and capacity are respected. Retro outcomes feed into planning.
- Major milestones (e.g. “Second city live,” “Native app store release”) are mapped to sprint boundaries so that progress is measurable and predictable.

---

## Sprint–task reference

| Sprint | Focus | Key task IDs (from Engineering Task Map) |
|--------|--------|------------------------------------------|
| 1 | Platform foundation | F-01–F-07, F-10–F-13 |
| 2 | Listing system | F-08, F-09, L-01–L-08, L-11, L-12 |
| 3 | Search and discovery | L-09, L-10, S-01–S-08 |
| 4 | Booking engine | B-01–B-12 |
| 5 | Payment infrastructure | P-01–P-11, SEC-06 |
| 6 | Messaging and reviews | M-01–M-03, M-05–M-08, R-01–R-06 |
| 7 | Trust & Safety | T-01–T-10, AI-01, AI-02, AI-07, AI-08 |
| 8 | Host and owner tools | O-01–O-05, MO-01–MO-02, MO-04–MO-07 |
| 9 | Broker CRM | C-01–C-08 |
| 10 | Deal marketplace | D-01–D-06 |
| 11 | AI Control Center | AI-03–AI-06 |
| 12 | Admin governance | AD-01–AD-06 |
| 13 | Mobile app preparation | MO-09–MO-14 |
| 14 | Testing and stability | TE-01–TE-06, SEC-01–SEC-08 |
| 15 | Montreal pilot preparation | Playbook checklist, beta, onboarding, support |
| 16 | Pilot launch | Deploy, monitoring, incident response |

---

*This document is the Development Sprint Plan for the LECIPM platform. It references the [Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md), [Product Requirements Document](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md), [Master Product Roadmap](LECIPM-MASTER-PRODUCT-ROADMAP.md), and [Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md). Update the plan as scope or timeline changes.*
