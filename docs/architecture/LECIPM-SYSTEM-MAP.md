# LECIPM System Map

**Master platform map and operating model for the LECIPM ecosystem**

This document is the **single unified map** of the entire LECIPM platform. It explains how users, applications, modules, backend services, APIs, data, AI, Trust & Safety, governance, monetization, and infrastructure fit together. It is the reference for founders, engineers, product teams, investors, and operations to understand and operate the whole system at a glance. It ties together the strategic and technical blueprints (business model, legal shield, governance, expansion, roadmap, PRD, engineering tasks, database, API, frontend, design system, design-to-code guide) into one coherent architecture map and operating model.

---

## 1. System map purpose

### What the LECIPM System Map is

The **LECIPM System Map** is the master document that describes the full platform as one integrated system. It is not a replacement for detailed blueprints (database, API, frontend, design system, etc.); it is the **overview** that shows how every part connects: who uses what, which applications call which services, how data flows, how AI and Trust & Safety sit across the stack, and how the platform is built and launched in phases.

### Why it exists

- **Single source of truth for “how it all works”** — New stakeholders can read one document to understand the ecosystem instead of piecing together many docs.
- **Alignment** — Ensures vision, product, engineering, and operations share the same mental model of the platform.
- **Onboarding** — Gives founders, engineers, designers, and investors a clear entry point before diving into domain-specific blueprints.
- **Decision context** — When prioritizing features, scaling, or launching in a new city, the map shows which systems are involved and how they depend on each other.

### What the map provides in one view

| Dimension | What the map covers |
|-----------|---------------------|
| **Users** | All user types (guests, hosts, owners, brokers, investors, admins, support, Trust & Safety, compliance) and what they use. |
| **Applications** | Every frontend surface: public site, marketplace, authenticated app, BNHub, host/owner/broker dashboards, admin/support/AI consoles, iOS/Android. |
| **Modules** | Business modules: real estate marketplace, BNHub, broker CRM, owner dashboard, deal marketplace, investment analytics, Trust & Safety, AI Control Center. |
| **Backend services** | Core and domain services: user, auth, verification, listing, search, booking, payment, payout, messaging, notification, review, Trust & Safety, dispute, analytics, admin. |
| **APIs** | How frontends and mobile talk to the backend; how services talk to each other; webhooks and events; integrations (payment, identity, email, storage, analytics, AI). |
| **Databases** | Transactional DB, search index, analytics warehouse, cache, file storage, logs/audit; what each holds and why. |
| **AI systems** | Fraud, risk, pricing, demand, moderation, support triage, compliance; inputs, outputs, and who consumes them. |
| **Trust and safety** | Verification, incidents, disputes, holds, suspensions, moderation, audit; how they protect listings, bookings, payments, and users. |
| **Governance** | Policy, compliance, enforcement, dispute resolution, financial and AI oversight, audit and reporting. |
| **Monetization** | Revenue streams by module: commissions, subscriptions, promotions, deals, analytics, partners. |
| **Infrastructure** | Hosting, APIs, DBs, CDN, storage, queues, monitoring, CI/CD, environments. |

### How this map helps each audience

| Audience | How the map helps |
|----------|-------------------|
| **Founders** | Align vision: see the full ecosystem, user types, modules, and how revenue and trust flow; use it for strategy and storytelling. |
| **Engineers** | Build correctly: see which services own which data, how APIs and events connect modules, and where to implement features without duplicating logic. |
| **Product teams** | Prioritize: see which modules and applications serve which users; plan features and roadmaps against the same map. |
| **Investors** | Understand the ecosystem: one document that explains scope, modules, data, AI, and monetization without reading every blueprint. |
| **Operations teams** | Manage the platform: see support, Trust & Safety, admin, and compliance in context; understand which systems handle incidents, disputes, and payouts. |

---

## 2. Platform mission and scope

### Mission

LECIPM is a **trusted digital ecosystem** that connects people, properties, and capital around real estate, accommodation, and investment. The platform’s mission is to provide a **single, trustworthy environment** where:

- **Travelers and renters** find and book stays or properties with clear pricing and safety.
- **Hosts and property owners** list, manage, and earn from their assets with transparent payouts and tools.
- **Brokers** manage clients, leads, and listings and participate in the deal marketplace.
- **Investors** discover deals, access analytics, and engage with professionals.
- **The platform** enforces verification, safety, and fairness through Trust & Safety and AI, and operates under clear governance and legal frameworks.

### Who the platform connects

| Participant | Role in the ecosystem |
|-------------|------------------------|
| **Property owners** | Own assets; list on marketplace (sale/long-term) and/or BNHub (short-term); use Owner dashboard for performance and payouts. |
| **Hosts** | List and manage BNHub stays; set availability and pricing; receive bookings and payouts; communicate with guests. |
| **Brokers** | Licensed professionals; manage clients and leads in CRM; list properties; connect buyers and investors to deals. |
| **Investors** | Browse deal marketplace; use investment analytics; express interest and communicate with brokers and deal owners. |
| **Travelers / guests** | Search and book BNHub stays or engage with marketplace; pay, message, and review; need support and dispute paths when needed. |
| **Service providers** | Cleaning, maintenance, or other partners integrated with BNHub or marketplace (current or future). |
| **Internal platform teams** | Admin, support, Trust & Safety, compliance; operate moderation, incidents, disputes, payouts, and policy. |

### Scope of the ecosystem

| Domain | What the platform covers |
|--------|--------------------------|
| **Real estate** | Listings for sale and long-term rent; search; leads and broker follow-up; offers and deal flow. |
| **Short-term accommodation** | BNHub: listings, calendar, booking, payment, reviews, host tools, payouts. |
| **Investment intelligence** | Deal marketplace, investment analytics, valuations, forecasts, portfolio views. |
| **Operational dashboards** | Host, owner, broker dashboards; admin and support consoles; AI operations console. |
| **Safety and compliance** | Identity and listing verification; incidents; disputes; payout holds; suspensions; moderation; audit. |
| **AI-powered optimization** | Fraud detection; risk scoring; pricing recommendations; demand forecasting; content moderation; support triage; compliance monitoring. |

---

## 3. User ecosystem map

| User type | Goal | Part of platform used | Main actions | Applications / dashboards |
|-----------|------|-------------------------|--------------|----------------------------|
| **Guest** | Find and book stays; manage trips; message hosts; leave reviews. | BNHub search, listing detail, checkout, trips, messages, profile, reviews. | Search, book, pay, cancel, message, review. | Public site, authenticated web app, iOS, Android. |
| **Host** | Manage BNHub listings; get bookings and payouts; communicate with guests. | Listings, calendar, requests, reservations, payouts, performance, messages, incidents. | Create/edit listing, set availability/pricing, approve/decline, view payouts. | Authenticated app (host dashboard), iOS, Android. |
| **Property owner** | View all properties (marketplace + BNHub); revenue and performance; maintenance. | Portfolio, revenue, maintenance, analytics, payout history, listing status. | View reports, create maintenance request, manage listing status. | Owner dashboard (web). |
| **Broker** | Manage leads and clients; manage listings; tasks and notes; communicate. | Leads, clients, listings, tasks, notes, messages, deal marketplace access. | Add lead, update status, add note, contact client, manage listings. | Broker CRM dashboard (web), mobile. |
| **Investor** | Discover deals; view analytics; track portfolio; communicate. | Deals discovery, deal detail, analytics, portfolio, watchlist. | Browse deals, express interest, view forecasts. | Authenticated app (deals/analytics). |
| **Admin** | Moderation; user/listings/bookings management; payments; incidents; disputes; audit; compliance; feature flags. | Users, listings, bookings, payments, incidents, disputes, payout holds, audit logs, compliance, flags. | Suspend user, remove listing, hold payout, resolve incident, view audit. | Admin governance console (separate app/subdomain). |
| **Support agent** | Handle tickets; look up user/booking; process refunds; escalate. | Inbox, tickets, user/booking lookup, refund tools, macros. | Reply, resolve, refund, escalate. | Support operations console. |
| **Trust & Safety team** | Investigate incidents; manage disputes; enforce policy; review moderation queue. | Incidents, disputes, evidence, suspensions, moderation queue, risk flags. | Assign, investigate, resolve, suspend, remove content. | Admin console; Trust & Safety tools. |
| **Compliance team** | Ensure regulatory and policy compliance; review reports; oversee financial and AI operations. | Compliance dashboard, audit logs, reports, policy config. | Review, report, configure policy. | Admin console; compliance views. |

---

## 4. Application layer map

| Application | What it does | Primary users |
|-------------|--------------|---------------|
| **Public marketing website** | Homepage, about, features, pricing, contact, help, trust & safety, legal, investor/partnership. | Everyone (unauthenticated). |
| **Public marketplace browsing site** | Search properties, BNHub stays, deals; view listing/deal detail; no login required for browse. | Everyone. |
| **Authenticated platform web app** | Post-login: marketplace, BNHub, profile, settings, messages, bookings, saved; role-based: host dashboard, owner dashboard, broker CRM, deals/analytics. | Guest, host, owner, broker, investor. |
| **BNHub guest experience** | Search → listing → checkout → confirmation → trips → review; messaging with host. | Guest. |
| **Host dashboard** | Listings, calendar, pricing, requests, reservations, payouts, performance, messages, incidents. | Host. |
| **Owner dashboard** | Portfolio, revenue, maintenance, analytics, payout history, listing status. | Property owner. |
| **Broker CRM dashboard** | Leads, clients, listings, tasks, notes, messages, settings. | Broker. |
| **Investor / deal experience** | Deals discovery, deal detail, portfolio, analytics, watchlist, express interest. | Investor. |
| **Admin governance console** | Users, listings, bookings, payments, incidents, disputes, payout holds, audit logs, compliance, feature flags. | Admin. |
| **Support operations console** | Inbox, ticket detail, user/booking lookup, refund/dispute tools, escalation, macros. | Support agent. |
| **AI operations console** | Fraud alerts, moderation queue, risk scores, pricing recommendations, demand forecasts, support triage, explanation/audit. | Admin; Trust & Safety; product/ops. |
| **iOS mobile app** | Guest booking, host tools, broker essentials, messages, account; same flows as web via API. | Guest, host, broker. |
| **Android mobile app** | Same as iOS; same API and design system. | Guest, host, broker. |

All applications are **thin clients**: they call backend APIs (via API gateway or BFF); business logic and data live in the backend. Authentication is centralized; tokens are sent with each request.

---

## 5. Marketplace module map

| Module | Core purpose | Primary users | Depends on | Data it creates/consumes | Revenue role |
|--------|--------------|---------------|------------|---------------------------|--------------|
| **Real estate marketplace** | Property listings (sale, long-term rent); search; leads; broker follow-up. | Guests, buyers, renters, owners, brokers. | User, Auth, Listing, Search, Payment, Trust, Messaging, Notification. | Listings, leads, offers, views. | Commissions; premium listing; broker subscriptions. |
| **BNHub short-term rentals** | Short-term accommodation; booking; host/guest flows; payouts. | Guests, hosts. | User, Auth, Listing, Search, Booking, Payment, Payout, Messaging, Notification, Review, Trust & Safety. | Listings, bookings, payments, payouts, reviews, availability. | Booking commissions; host subscriptions. |
| **Broker CRM** | Client/lead/listings management; tasks; notes; communication. | Brokers. | User, Auth, Listing, Messaging, Notification. | Leads, clients, listings, tasks, notes. | Broker subscriptions. |
| **Owner dashboard** | Unified view: marketplace + BNHub listings; revenue; maintenance; analytics. | Property owners. | User, Auth, Listing, Booking, Payment, Analytics. | Listings, bookings, payouts, revenue, maintenance. | Owner analytics subscriptions; ties to BNHub/marketplace revenue. |
| **Deal marketplace** | Off-market deals; partnerships; expressions of interest. | Brokers, investors. | User, Auth, Listing, Analytics, Trust, Messaging. | Deals, interests, documents, messages. | Deal-related fees; partner commissions. |
| **Investment analytics** | Yield, ROI, market insights; valuations; forecasts. | Investors, owners, brokers. | User, Auth, Listing, Booking (read), Analytics. | Market data, valuations, portfolio metrics. | Analytics subscriptions; premium data. |
| **Trust & Safety system** | Verification; incidents; disputes; enforcement; moderation. | All users (reporting); Admin, Support, T&S. | User, Auth, Identity, Listing, Booking, Payment, Messaging, AI. | Incidents, disputes, flags, suspensions, audit. | Enables trust; reduces fraud cost; supports compliance. |
| **AI Control Center** | Fraud, risk, pricing, moderation, support triage, compliance monitoring. | Platform (internal); host/owner (recommendations). | All modules (read); events and transactional data. | Risk scores, fraud flags, pricing recs, moderation queue, forecasts. | Improves conversion and safety; supports premium features. |

---

## 6. Core service architecture map

| Service | Main responsibility | Main upstream inputs | Main downstream consumers | Key events / outputs |
|---------|---------------------|----------------------|----------------------------|----------------------|
| **User service** | User CRUD, profile, roles (guest, host, broker, investor, admin). | Auth (after login); profile updates from apps. | All modules; Listing, Booking, Payment, Messaging, Trust & Safety. | UserCreated, ProfileUpdated. |
| **Authentication service** | Login, signup, tokens, sessions, password reset, MFA. | Credentials from apps. | All apps; gateway validates token. | SessionCreated, SessionRevoked. |
| **Identity verification service** | KYC flows; verification status per user. | Document uploads; provider webhooks. | Trust & Safety; Listing (host verification); Booking policies. | VerificationCompleted, VerificationFailed. |
| **Listing service** | Canonical listing (property type, location, attributes, media, rules); marketplace and BNHub variants. | Create/update from host, owner, broker. | Search (index); Booking; Payment; Review. | ListingCreated, ListingUpdated, ListingApproved. |
| **Search service** | Index listings; full-text and filters; geo, price, availability. | Listing events; availability updates. | All apps (search results). | Search index updated. |
| **Booking service** | Reserve, confirm, cancel, complete; availability checks. | Create/update from apps; Payment (confirm). | Payment, Availability, Messaging, Notification, Review. | BookingCreated, BookingConfirmed, BookingCancelled, BookingCompleted. |
| **Payment service** | Charge capture, escrow hold, release, refunds; multi-currency, tax. | Booking (capture); Refund/Dispute (refund). | Payout, Dispute, Notification. | PaymentCaptured, PaymentRefunded. |
| **Payout service** | Host payouts; connect accounts; schedule; hold/release. | Payment (release); Admin (hold). | Notification; Reporting. | PayoutScheduled, PayoutPaid, PayoutHeld. |
| **Messaging service** | Threads and messages (guest–host, broker–client, support). | Send message from apps. | Notification (new message); Support (tickets). | MessageSent. |
| **Notification service** | Templates and delivery (email, SMS, push, in-app). | Events from Booking, Payment, Messaging, Trust & Safety, etc. | Users (inbox; email/push). | NotificationDelivered (internal). |
| **Review service** | Create review; aggregate ratings; one review per stay per side. | Post-stay from guest/host. | Listing (aggregates); Trust & Safety (reputation). | ReviewSubmitted. |
| **Trust & Safety service** | Incidents, evidence, suspensions, moderation workflow. | Reports from users; AI flags. | Admin; Dispute; Payment (hold). | IncidentCreated, IncidentResolved, UserSuspended. |
| **Dispute management service** | Open case; evidence; resolution (refund/partial/release). | Claim from guest/host. | Payment (refund); Notification; Trust & Safety. | DisputeCreated, DisputeResolved. |
| **Analytics service** | Aggregates for dashboards; market data; valuations; portfolio metrics. | Read from Listings, Bookings, Payments; warehouse ETL. | Owner dashboard; Investor; Admin; AI. | Reports; metrics. |
| **Admin operations service** | User/listings/bookings/payments read and actions; audit logs; feature flags. | Admin console actions. | User, Listing, Payment, Payout, Trust & Safety. | AdminAction (audit). |

---

## 7. BNHub operational flow map

| Step | What happens | Systems involved |
|------|----------------|------------------|
| **1. Host creates listing** | Host fills listing form (title, location, photos, amenities, rules, nightly price, cleaning fee, max guests). | Host dashboard → Listing service; Identity (host verification if required); media storage. |
| **2. Listing verification** | Optional platform review; compliance and fraud checks. | Trust & Safety; AI (risk/moderation); Listing status updated. |
| **3. Availability and pricing setup** | Host sets available dates and blocks; pricing and min/max nights. | Availability service; Listing service; Search index updated. |
| **4. Guest search** | Guest enters location, dates, guests; applies filters. | Search service (with availability); Listing service (detail). |
| **5. Booking request / instant book** | Guest submits booking; instant book confirms immediately or host approves/declines. | Booking service; Availability (hold dates); Payment (create intent or hold). |
| **6. Payment authorization** | Guest pays; payment captured or held in escrow. | Payment service; payment provider (e.g. Stripe); idempotency. |
| **7. Reservation confirmation** | Booking status → confirmed; dates blocked; notifications sent. | Booking service; Availability; Notification; Messaging (optional welcome). |
| **8. Check-in / stay / support** | Guest and host can message; incident can be reported. | Messaging service; Trust & Safety (incident); Notification. |
| **9. Checkout** | Stay ends; booking status → completed. | Booking service; Availability (release for future); Review eligibility. |
| **10. Review flow** | Guest and host can leave review (one per side per booking). | Review service; Listing aggregates updated. |
| **11. Payout release** | After policy (e.g. after check-in or X days), host payout released. | Payout service; Payment (release); Notification. |
| **12. Refund or dispute if needed** | Guest or host opens dispute; evidence; resolution (refund full/partial/none). | Dispute service; Payment (refund); Trust & Safety; Notification. |

---

## 8. Real estate marketplace flow map

| Step | What happens | Tools and services |
|------|----------------|------------------|
| **1. Broker or owner creates listing** | Listing for sale or long-term rent; price, location, media, contact. | Listing service; optional Broker CRM (if broker); media storage. |
| **2. Listing review** | Optional moderation; compliance. | Trust & Safety; Listing status. |
| **3. Property search** | User searches by location, type, price, bedrooms. | Search service; Listing service. |
| **4. Lead capture** | User submits inquiry or contact form; lead created. | Messaging or lead API; Broker CRM (if broker linked). |
| **5. Broker follow-up** | Broker sees lead in CRM; tasks and notes; contact client. | Broker CRM; Messaging; Notification. |
| **6. Deal qualification** | Broker or investor creates deal; visibility and terms. | Deal marketplace service; Listing; Messaging. |
| **7. Investor interest or offer** | Investor expresses interest; optional offer flow. | Deal marketplace; Messaging; optional Payment (deposit). |
| **8. Analytics support** | Valuations, market data, portfolio views for investors and owners. | Analytics service; Listing, Booking (read); AI (valuations, forecasts). |

---

## 9. Data flow map

| Data domain | Created by | Consumed by | Operational vs analytical | Feeds AI / dashboards |
|-------------|------------|-------------|----------------------------|------------------------|
| **Users** | User service; Auth (on signup). | All modules; Admin. | Operational (transactional DB). | Analytics; AI (risk, fraud). |
| **Identities and verification** | Identity verification service; provider. | Trust & Safety; Listing; Booking policies. | Operational. | Risk scoring; eligibility. |
| **Listings** | Listing service (marketplace, BNHub, deal). | Search, Booking, Payment, Review, Analytics. | Operational; Search index. | Pricing recs; moderation; demand. |
| **Bookings** | Booking service. | Payment, Availability, Review, Messaging, Analytics. | Operational. | Demand; risk; fraud. |
| **Payments** | Payment service. | Payout, Dispute, Notification, Analytics. | Operational. | Fraud; analytics. |
| **Payouts** | Payout service. | Notification; Admin; Reporting. | Operational. | Analytics; compliance. |
| **Reviews** | Review service. | Listing aggregates; Trust & Safety. | Operational. | Risk; moderation; analytics. |
| **Messages** | Messaging service. | Notification; Support; Analytics. | Operational. | Moderation; support triage. |
| **Incidents** | Trust & Safety (reports). | Admin; Dispute; AI. | Operational. | Triage; risk. |
| **Disputes** | Dispute service. | Payment; Trust & Safety; Notification. | Operational. | Risk; analytics. |
| **Deals** | Deal marketplace service. | Messaging; Analytics. | Operational. | Analytics. |
| **Analytics** | Analytics service; ETL from operational DB. | Dashboards; Admin; AI (batch). | Analytical (warehouse). | Forecasts; reporting. |
| **AI scores and recommendations** | AI engines. | Trust & Safety; Listing (pricing); Admin (queues). | Operational (stored); analytical (training). | Enforcement; product features. |

**Flow summary:** Operational systems create and update data in the **transactional database** and publish **events**. The **search index** is updated from listing and availability data. The **analytics warehouse** is fed by ETL or events for reporting and AI training. **AI engines** consume events and batch data and write scores and recommendations back to operational stores or APIs.

---

## 10. API and integration map

### Frontend and mobile to backend

- **Single API gateway** (or BFF per client): all web and mobile traffic hits the gateway; it routes by path to backend services, validates auth, and applies rate limiting.
- **REST APIs** per domain: auth, users, verifications, properties, search, bnhub/listings, bookings, calendar, payments, payouts, conversations, reviews, CRM, owner, deals, analytics, incidents, disputes, AI, notifications, admin, media, reports. See [API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md).
- **Authentication:** Bearer token (JWT or opaque) in header; refresh flow; gateway forwards identity to services.
- **Mobile:** Same REST APIs; token in header; push registration for notifications; deep links to resources.

### Internal service APIs

- **Synchronous:** Services call each other via REST or gRPC for request–response (e.g. Booking calls Payment to capture; Listing calls Search to update index).
- **Asynchronous:** Domain events (e.g. BookingConfirmed, PaymentCaptured) published to **event bus** (Kafka, SQS, or equivalent); consumers (Notification, AI, Analytics) subscribe and process.

### Admin and partner APIs

- **Admin APIs:** Scoped to admin/support roles; same gateway with role check; audit logging for sensitive actions.
- **Partner APIs / webhooks:** Outgoing webhooks for partners (e.g. booking created); incoming webhooks from payment or identity providers; signature verification.

### External integrations

| Integration | Purpose | Direction |
|-------------|---------|------------|
| **Payment provider** (e.g. Stripe) | Charges, payouts, refunds; Connect for host payouts. | Out: create payment/payout; In: webhooks (payment_intent.succeeded, etc.). |
| **Identity verification provider** | KYC; document checks. | Out: create applicant; In: redirect or webhook (verification result). |
| **Email / SMS providers** | Transactional and marketing messages. | Out: send; delivery status optional. |
| **Storage provider** | Listing photos; documents; evidence. | Out: upload; signed URLs for read. |
| **Analytics / warehouse** | ETL or event stream for reporting. | Out: events or batch export. |
| **AI services** | Risk score, pricing rec, moderation; can be internal or external. | In/Out: API or event-driven. |

---

## 11. Database and storage map

| Layer | Contains | Why it exists |
|-------|----------|----------------|
| **Transactional database** | Users, listings, bookings, payments, payouts, reviews, messages, incidents, disputes, deals, notifications, audit logs. | Source of truth for all operational data; ACID; supports APIs and services. See [Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md). |
| **Search index** | Listings (marketplace + BNHub) with full-text and filters; availability and geo. | Fast search and discovery; not full table scan on primary DB. |
| **Analytics warehouse** | Historical and aggregated data from ETL or events; reporting and AI training. | Heavy analytical queries; no impact on transactional DB. |
| **Cache** | Session; hot data (e.g. listing detail); rate limits. | Reduce latency and load on DB and services. |
| **File and media storage** | Listing photos; verification documents; dispute evidence; exports. | Scalable blob storage; CDN for delivery. |
| **Logs and audit storage** | Application logs; audit trail of admin and sensitive actions. | Debugging; compliance; security review. |
| **AI feature / prediction store** | Risk scores; pricing recommendations; moderation decisions; model metadata. | Stored outputs for enforcement and product; optional training artifacts. |

---

## 12. AI operating system map

| Engine | Inputs | Outputs | Actions it can trigger | Consumers |
|--------|--------|---------|------------------------|------------|
| **Fraud detection** | Listings, bookings, payments, user behavior, events. | Fraud flags; risk signals. | Block listing/booking; alert Trust & Safety; hold payout. | Trust & Safety; Admin; Payment. |
| **Trust and risk scoring** | Reviews, cancellations, disputes, verification, history. | Host/guest risk score. | Eligibility (e.g. instant book); ranking; alert. | Booking; Listing; Trust & Safety. |
| **Dynamic pricing** | Listings, bookings, search, seasonality, comparables. | Recommended nightly/sale price; range. | Host/owner can apply to listing. | Listing; Host/Owner dashboard. |
| **Demand forecasting** | Bookings, search, listings by region. | Occupancy and demand by period/region. | Capacity and pricing insight. | Analytics; Host/Owner; AI ops. |
| **Content moderation** | Listing text, reviews, messages. | Policy violation flags; queue. | Auto-remove when confident; else human queue. | Trust & Safety; Admin. |
| **Support triage** | Incidents, messages, disputes. | Priority; category; suggested routing. | Faster assignment; deflection. | Support console; Trust & Safety. |
| **Anomaly detection** | Auth, bookings, payments, user actions. | Anomaly alerts. | Investigate; block if critical. | Trust & Safety; Admin. |
| **Recommendation engine** | User behavior; listings; bookings. | “Similar listings”; “You might like”. | Personalization in search and emails. | Search; Notification; product. |
| **Compliance monitoring** | Transactions; policies; audit logs. | Compliance alerts; reports. | Escalate; report. | Compliance; Admin. |

AI systems **consume** platform data (events + batch) and **produce** scores, recommendations, and queues. High-stakes decisions (e.g. account termination, large refunds) remain human-in-the-loop; AI supports consistency and scale.

---

## 13. Trust & Safety control map

| Control | What it does | Interacts with |
|---------|--------------|----------------|
| **Identity verification** | KYC for guests/hosts/brokers; status stored; used for eligibility. | Listings (host verified); Booking; Trust & Safety. |
| **Listing verification** | Compliance and fraud check; optional manual review; status (draft, live, suspended). | Listing; Search; Booking. |
| **Risk flags** | Internal or AI-generated flags on user/listing/booking. | Admin; Payout (hold); Booking (block). |
| **Fraud signals** | AI or rules; fake listing, stolen payment, synthetic identity. | Trust & Safety; Payment; Admin. |
| **Incident reporting** | User or host reports; evidence; case workflow. | Trust & Safety service; Admin; optional Dispute. |
| **Disputes** | Refund or conduct dispute; evidence; resolution (refund full/partial/none). | Payment; Trust & Safety; Notification. |
| **Payout holds** | Admin or automated hold; reason and release process. | Payout service; Notification; Admin. |
| **Suspensions** | User or listing suspended; reason stored; access blocked. | User; Auth; Listing; all apps. |
| **Moderation queues** | Content (listing, review, message) for human review. | Trust & Safety; Admin; AI (submit). |
| **Audit trails** | Log of admin and sensitive actions. | Admin; Compliance; Security. |

Trust & Safety sits **across** bookings, listings, messaging, and payments: verification and risk affect who can list and book; incidents and disputes affect payments and payouts; AI feeds flags and queues; governance sets policy and authority.

---

## 14. Governance and legal map

| Element | Role |
|---------|------|
| **Policy management** | Define and update terms, listing policies, cancellation, fees, community standards. |
| **Legal compliance** | Regulatory and jurisdictional compliance; data protection; tax. |
| **Rule enforcement** | Trust & Safety and Admin enforce policy; suspensions, removals, payout holds. |
| **Moderation authority** | Who can approve/remove content; escalation to human review. |
| **Suspension authority** | Who can suspend user or listing; process and appeal. |
| **Dispute resolution authority** | Who can resolve disputes and authorize refunds; binding or advisory. |
| **Financial oversight** | Payout rules; hold/release; reconciliation; reporting. |
| **AI oversight** | Use of AI in risk, fraud, moderation; human-in-the-loop for high-stakes; explainability and audit. |
| **Audit and reporting** | Audit logs; compliance reports; transparency metrics. |

Governance **sits above** operations: it defines the rules that Trust & Safety, Admin, and AI enforce. Legal Shield and Governance Constitution documents define platform role, liability, and governance structure. See [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md) and [Governance Constitution](LECIPM-GOVERNANCE-CONSTITUTION.md).

---

## 15. Monetization map

| Revenue stream | Module(s) | How it works |
|----------------|-----------|--------------|
| **Real estate commissions** | Marketplace | Fee on sale or long-term rental transaction; broker or platform. |
| **BNHub booking commissions** | BNHub | Guest service fee and/or host commission per booking. |
| **Host subscriptions** | BNHub | Optional subscription for hosts (e.g. lower commission, tools). |
| **Broker CRM subscriptions** | Broker CRM | Subscription for access to CRM and listing tools. |
| **Owner analytics subscriptions** | Owner dashboard; Analytics | Premium analytics and reports for owners. |
| **Premium listing promotion** | Marketplace; BNHub | Paid visibility or featured placement. |
| **Deal marketplace revenues** | Deal marketplace | Fee on deal flow or expression of interest; partner share. |
| **Service partner commissions** | BNHub; Marketplace | Commission from cleaning, maintenance, or other partners. |
| **Analytics products** | Investment analytics | Paid data or reports for investors and professionals. |
| **Future travel ecosystem** | Roadmap | Ancillary travel or experience revenue. |

See [Monetization Architecture](LECIPM-MONETIZATION-ARCHITECTURE.md) for philosophy, allocation, and pricing.

---

## 16. Infrastructure map

| Element | Role |
|---------|------|
| **Frontend hosting** | Static and/or SSR for web apps; CDN for assets. |
| **API hosting** | API gateway and backend services; auto-scaling; regions per growth. |
| **Service hosting** | Core and domain services run in containers or serverless; discovery and load balancing. |
| **Databases** | Primary and replicas for transactional DB; managed service; backups. |
| **CDN** | Static assets and media; edge caching; DDoS mitigation. |
| **Object storage** | Photos, documents, exports; versioning and lifecycle. |
| **Background workers** | Event consumers; batch jobs; scheduled tasks. |
| **Queues / event bus** | Reliable event delivery between services; at-least-once; idempotent handlers. |
| **Monitoring** | Metrics, logs, traces; dashboards and alerts. |
| **Alerting** | Incidents, latency, errors, business metrics. |
| **CI/CD pipeline** | Build, test, deploy; staging and production; feature flags. |
| **Environments** | Development, staging, production; optional per-region staging. |

Infrastructure supports **performance** (scale, caching, CDN), **security** (secrets, network, encryption), **scalability** (horizontal scaling, queues), **resilience** (replicas, circuit breakers, retries), and **global growth** (regions, localization).

---

## 17. Security map

| Area | Measures |
|------|----------|
| **Authentication** | Centralized auth; strong passwords; MFA optional/required for sensitive roles; session and token lifecycle. |
| **Authorization** | Role and resource-based; per-endpoint checks; admin and support scoped. |
| **Token handling** | Access + refresh; short-lived access; secure storage (memory or httpOnly cookie); no token in logs or client storage beyond need. |
| **Data encryption** | TLS in transit; encryption at rest for DB and sensitive storage; PII and payment data protected. |
| **Payment security** | PCI compliance via provider; no raw card data in our systems; idempotency for charges and refunds. |
| **Secrets management** | API keys and DB credentials in vault or managed secrets; rotation. |
| **Audit logging** | Admin and sensitive actions logged with actor, resource, timestamp; retention for compliance. |
| **Access control** | Least privilege for services and humans; separate admin app/subdomain; support scope limited. |
| **Rate limiting** | Per IP and per user at gateway; stricter on auth and sensitive endpoints. |
| **Abuse prevention** | Fraud and risk signals; verification; payout holds; blocking and suspension. |

Security applies across **frontend** (no sensitive data in client; secure token use), **backend** (authZ, encryption, audit), **data** (encryption, access control), and **operations** (secrets, access, monitoring).

---

## 18. Role-to-system access map

| Role | Allowed applications | Allowed modules | Restricted actions | Approval / escalation |
|------|----------------------|-----------------|--------------------|------------------------|
| **Guest** | Public site; authenticated app (trips, saved, profile). | BNHub (book, message, review); Marketplace (browse, inquire). | Cannot access host/owner/broker/admin. | Support for help; dispute for refund. |
| **Host** | Authenticated app; host dashboard; mobile. | BNHub (listings, calendar, bookings, payouts, messages); profile; verification. | Cannot access other hosts’ data; admin. | Trust & Safety for incidents; support for payout issues. |
| **Owner** | Authenticated app; owner dashboard. | Portfolio, revenue, maintenance, analytics, payouts; marketplace + BNHub listings. | Cannot access other owners; admin. | Support; compliance for reporting. |
| **Broker** | Authenticated app; broker CRM; mobile. | CRM (leads, clients, listings, tasks, notes); deal marketplace; messages. | Cannot access other brokers’ CRM; admin. | Admin for verification escalation. |
| **Investor** | Authenticated app. | Deals, analytics, portfolio, watchlist. | Cannot access admin or others’ private data. | Broker/deal owner for interest. |
| **Admin** | Admin console only. | Users, listings, bookings, payments, incidents, disputes, payout holds, audit, compliance, flags. | Sensitive actions (suspend, hold payout) require reason and audit. | Compliance for policy; legal for high-risk. |
| **Support agent** | Support console. | Inbox, tickets, user/booking lookup, refund tools, macros. | Cannot suspend or change financial rules without escalation. | Escalate to Admin/Trust & Safety. |
| **Trust & Safety analyst** | Admin console; T&S tools. | Incidents, disputes, moderation queue, evidence, suspensions. | Must follow policy; high-stakes (e.g. termination) may need approval. | Compliance; legal for appeals. |
| **Compliance operator** | Admin; compliance views. | Audit, reports, policy config. | Read and report; config change may need approval. | Legal; external auditors. |

---

## 19. Phase-based build map

| Phase | Focus | Why this order |
|-------|--------|----------------|
| **Phase 1: Core accounts, listings, search** | User, Auth, Identity; Listing (marketplace + BNHub); Search index; public and authenticated browse. | Foundation for all modules; no booking or payment without users and listings. |
| **Phase 2: Bookings, payments, messaging** | Booking engine; Payment (capture, hold, release); Payout; Messaging; Notification. | BNHub and marketplace need transaction and communication; revenue and trust depend on it. |
| **Phase 3: Trust and safety, disputes, payouts** | Verification; Incidents; Disputes; Payout holds; Moderation; Audit. | Required before scale; protects guests, hosts, and platform. |
| **Phase 4: Host, owner, and broker dashboards** | Host dashboard; Owner dashboard; Broker CRM. | Operational tools for supply side; retention and efficiency. |
| **Phase 5: Deal marketplace and analytics** | Deals; Investment analytics; Valuations; Forecasts. | Expands value for brokers and investors; builds on existing listing and user data. |
| **Phase 6: AI Control Center** | Fraud; Risk; Pricing; Moderation; Support triage; Compliance monitoring; AI ops console. | Optimizes and protects at scale; consumes data from earlier phases. |
| **Phase 7: Mobile and global scaling** | iOS/Android apps; localization; multi-currency; regional compliance; infrastructure scaling. | Distribution and growth; mobile uses same APIs; scaling follows demand. |

This order is **realistic**: each phase delivers usable value and builds on the previous; dependencies (e.g. booking needs listing and payment) are respected. See [Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md) and [Development Sprint Plan](LECIPM-DEVELOPMENT-SPRINT-PLAN.md).

---

## 20. Montreal launch map

For the Montreal pilot, the following parts of the system are **required**:

| Area | What’s required |
|------|------------------|
| **Listing supply** | Marketplace and BNHub listing creation and search; verification and moderation for quality. |
| **Broker onboarding** | Broker CRM access; lead capture from marketplace; messaging. |
| **BNHub host onboarding** | Host signup; listing creation; calendar and pricing; payout account connection. |
| **Guest booking flow** | Search → listing → checkout → payment → confirmation → trips → review; messaging with host. |
| **Support readiness** | Support console; user/booking lookup; refund and dispute tools; macros; escalation to Trust & Safety. |
| **Trust and safety readiness** | Identity verification; incident reporting; dispute flow; payout holds; moderation queue; admin oversight. |
| **Admin oversight** | Admin console for users, listings, bookings, payments, incidents, disputes; audit logs. |
| **Payment readiness** | Guest payment capture; host payouts; refunds; multi-currency (CAD); tax if required. |

The system map supports a **controlled launch**: Montreal uses the same applications and services as the full platform, but supply, demand, and operations are scoped to one city. Rollout playbook: [Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md). After validation, the same system scales to more cities with localization and regional compliance.

---

## 21. Global expansion map

| Dimension | Universal (same everywhere) | Localized per region |
|-----------|-----------------------------|------------------------|
| **Product and modules** | Same modules: marketplace, BNHub, CRM, owner, deals, analytics, Trust & Safety, AI. | Content, legal, and fees per jurisdiction. |
| **Applications** | Same app set: web, iOS, Android, admin, support. | Language, currency, and compliance per market. |
| **Services and APIs** | Same service architecture and API contract. | Config: currency, tax, payment methods, verification provider. |
| **Localization** | Single codebase; locale and currency from config. | Language strings; date/number format; legal pages. |
| **Multi-currency** | Amounts in cents with currency code; display and pay in local currency. | Supported currencies per region. |
| **Regional compliance** | Governance and policy framework global. | Local regulations (short-term rental, data, tax); regional moderation and support. |
| **Regional payment methods** | Same payment service. | Local methods (e.g. iDEAL, SEPA) and providers. |
| **Infrastructure scaling** | Same architecture. | Regions and CDN edges; data residency where required. |
| **AI adaptation** | Same engines. | Training or calibration on regional data; local rules where needed. |

See [Global Expansion Blueprint](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md) for market selection, pilot strategy, and phased rollout.

---

## 22. Visual diagram narrative

A single **master platform diagram** can be read in this sequence:

1. **Users** — Guests, hosts, owners, brokers, investors, admins, support, Trust & Safety, compliance (top of diagram).
2. **Applications** — Public site, marketplace app, authenticated app, host/owner/broker dashboards, admin/support/AI consoles, iOS/Android (below users; each user type points to the apps they use).
3. **Platform modules** — Real estate marketplace, BNHub, broker CRM, owner dashboard, deal marketplace, investment analytics, Trust & Safety, AI Control Center (layer below apps; modules group capabilities).
4. **Core services** — User, Auth, Identity, Listing, Search, Booking, Payment, Payout, Messaging, Notification, Review, Trust & Safety, Dispute, Analytics, Admin (below modules; each module draws on one or more services).
5. **APIs and events** — Horizontal band: “API Gateway” between apps and services; “Event bus” between services and AI/Notification/Analytics (arrows: apps → API → services; services → events → consumers).
6. **Data layer** — Transactional DB, Search index, Analytics warehouse, Cache, File storage, Audit (below services; services read/write DB and index; warehouse fed by ETL/events).
7. **AI-OS** — Fraud, Risk, Pricing, Demand, Moderation, Support triage, Compliance (side or below data; consumes events and data; writes scores and queues back to services or stores).
8. **Trust & Safety and governance** — Verification, incidents, disputes, holds, suspensions, moderation, audit, policy (overlay or side; touches User, Listing, Booking, Payment, Payout, Admin).
9. **Infrastructure** — Hosting, DB, CDN, storage, queues, monitoring, CI/CD (bottom; everything runs on this).

**How to draw it:** One page with clear swim lanes or layers. Use one color for “user-facing,” one for “platform services,” one for “data,” one for “AI and trust.” Arrows: who uses what, which service calls which, which system writes/reads which data. A second page can zoom into BNHub flow or data flow. Narrative text (this section) explains the flow so the diagram stays readable.

---

## 23. Executive summary map

### For founders

LECIPM is **one ecosystem** that connects travelers, hosts, property owners, brokers, and investors through a **single identity, trust, and payment layer**. The platform has **eight business modules** (real estate marketplace, BNHub, broker CRM, owner dashboard, deal marketplace, investment analytics, Trust & Safety, AI Control Center) and **one set of core services** (user, auth, listing, search, booking, payment, messaging, review, trust, dispute, analytics, admin). **Revenue** comes from commissions, subscriptions, and premium features across these modules. **Trust** is enforced by verification, incidents, disputes, and AI-driven risk and fraud controls, under a clear **governance and legal** framework. The system is built in **phases** (core → transactions → trust → dashboards → deals/analytics → AI → mobile/global) and launches in **Montreal** first with the same architecture, then expands globally with localization and regional compliance. This map is the single place to see how vision, product, and operations align.

### For lead engineers

The **system map** is the high-level reference; detailed specs live in the **Database**, **API**, **Frontend**, **Design System**, and **Design-to-Code** blueprints. **Applications** are thin clients; all logic and data live in **backend services** and **data stores**. Services communicate via **REST/API** and **events**; the **event bus** feeds Notification, AI, and Analytics. **Data** flows: operational systems write to the **transactional DB** and **search index**; **analytics warehouse** is fed by ETL or events; **AI** reads events and batch data and writes scores and recommendations. **Trust & Safety** and **Admin** use the same services with elevated permissions and audit. **Build order** follows the phase map (core → booking/payment → trust → dashboards → deals/AI → mobile/scale). Use this map to onboard, plan cross-service work, and ensure no duplicate logic across modules.

### For investors

LECIPM is a **full-stack real estate and accommodation platform** with **multiple revenue streams**: booking commissions (BNHub), marketplace commissions, broker and owner subscriptions, deal marketplace fees, and analytics. The **user base** is multi-sided: guests, hosts, owners, brokers, investors. The **technology** is modular: shared core services (user, auth, payment, trust) support all modules, so unit economics and trust are consistent. **AI** is built in for fraud, risk, pricing, and moderation, improving safety and conversion. **Governance and legal** (Legal Shield, Governance Constitution) define platform responsibility and enforcement. The **roadmap** is phased and pilot-first (Montreal), then geographic and product expansion. This map shows **scope, integration, and scalability** in one view.

### For product lead

**Users** are mapped to **applications** and **modules**: guests use BNHub and marketplace browse; hosts use host dashboard; owners use owner dashboard; brokers use CRM; investors use deals and analytics; admins and support use their consoles. **Prioritization** follows the **phase-based build map** and the **Engineering Task Map**; the **PRD** and **Master Product Roadmap** define features and journeys. **Data and APIs** are defined in the Database and API blueprints; **screens and flows** in the Frontend and Design System blueprints. **Trust and transparency** (pricing, verification, disputes, refunds) are product requirements and are reflected in the Trust & Safety and governance layers on this map. Use this map to align roadmaps with system capabilities and to communicate scope to stakeholders.

---

This document is the **LECIPM System Map**: one master platform map and operating model that ties together users, applications, modules, services, APIs, data, AI, Trust & Safety, governance, monetization, infrastructure, security, roles, build phases, Montreal launch, and global expansion. It is the single reference for understanding how the whole system works and how to operate and extend it.

---

*Related documents: [Platform Architecture](LECIPM-PLATFORM-ARCHITECTURE.md), [Super Platform Map](LECIPM-SUPER-PLATFORM-MAP.md), [Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md), [API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [Frontend Architecture Blueprint](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md), [Design System Blueprint](LECIPM-DESIGN-SYSTEM-BLUEPRINT.md), [Design-to-Code Implementation Guide](LECIPM-DESIGN-TO-CODE-IMPLEMENTATION-GUIDE.md), [PRD](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md), [Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md), [Development Sprint Plan](LECIPM-DEVELOPMENT-SPRINT-PLAN.md), [Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md), [Global Expansion Blueprint](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md), [Governance Constitution](LECIPM-GOVERNANCE-CONSTITUTION.md), [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md), [Monetization Architecture](LECIPM-MONETIZATION-ARCHITECTURE.md), [AI Operating System](LECIPM-AI-OPERATING-SYSTEM.md).*
