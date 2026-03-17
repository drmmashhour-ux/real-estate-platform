# LECIPM Super Platform Map

**Global real estate and accommodation ecosystem — architectural blueprint**

Structured map of how the entire LECIPM platform is organized: layers, users, applications, marketplaces, services, AI, data, infrastructure, and governance.

---

## 1. Platform layer overview

The LECIPM ecosystem is organized into **six major layers**. Each layer has a clear purpose and interacts with adjacent layers through well-defined interfaces.

| Layer | Purpose |
|-------|---------|
| **User Layer** | People and roles that interact with the platform (guests, hosts, owners, brokers, investors, travelers, administrators). Defines *who* the platform serves. |
| **Application Layer** | Front-facing apps (web, iOS, Android, admin, broker dashboard, owner dashboard, host dashboard). Defines *where* users interact. |
| **Platform Services Layer** | Backend services that power all marketplaces: identity, search, listings, booking, payment, messaging, notifications, reviews, trust, disputes. Defines *how* core capabilities are delivered. |
| **AI Intelligence Layer** | Systems that monitor, score, recommend, and moderate: fraud, risk, pricing, demand, content, analytics, support. Defines *how* the platform learns and protects itself. |
| **Data Layer** | Core data domains (users, listings, bookings, payments, reviews, deals, trust, incidents, messages). Defines *what* is stored and how it flows. |
| **Infrastructure Layer** | Cloud hosting, databases, storage, CDN, load balancing, monitoring. Defines *where* the platform runs and how it scales. |

**Flow:** Users use Applications, which call Platform Services. Platform Services read and write the Data Layer and are monitored and augmented by the AI Intelligence Layer. All of this runs on the Infrastructure Layer. Governance systems (compliance, Trust & Safety, finance, moderation) operate across Application and Platform Services layers and use AI and Data.

---

## 2. User layer

### Main platform users

| User type | Description | Primary interaction |
|-----------|-------------|---------------------|
| **Guests** | Travelers who book short-term stays (BNHub) or browse/buy/rent (marketplace) | Search, book, pay, message hosts, leave reviews, request support. |
| **Hosts** | Owners or managers who list properties on BNHub | Create listings, manage calendar and pricing, receive bookings and payouts, message guests, handle incidents. |
| **Property owners** | Individuals or entities who own properties (sale, long-term or short-term) | List on marketplace and/or BNHub; view performance in Owner dashboard; manage offers and payouts. |
| **Brokers** | Licensed real estate professionals | Use Broker CRM: manage clients, leads, listings; communicate; access deal marketplace and listing tools. |
| **Investors** | Participants seeking investment opportunities | Browse deal marketplace, view investment analytics, connect with brokers; may also be hosts or owners. |
| **Travelers** | General term for people seeking accommodation or experiences | Same as guests in BNHub context; may also use marketplace for long-term or purchase. |
| **Platform administrators** | Internal ops, compliance, and support | Use Admin platform: moderation, compliance, incidents, disputes, financial reporting, system config. |

**Interaction pattern:** Each user type authenticates once (User Layer + Authentication). Applications (Application Layer) present role-appropriate UIs and call Platform Services (Platform Services Layer). Trust & Safety and AI apply verification and risk rules across all user actions.

---

## 3. Application layer

### Front-facing applications

| Application | Users | Role | Backend connection |
|-------------|--------|------|---------------------|
| **Web Platform** | Guests, travelers, some owners and brokers | Public site: search listings (marketplace + BNHub), book, pay, account, support | API Gateway → Platform Services (Search, Listing, Booking, Payment, User, Messaging, etc.). |
| **iOS App** | Guests, hosts, owners, brokers | Same as web for consumers and pros; native experience, push notifications | Same API Gateway; push via APNs. |
| **Android App** | Same as iOS | Same as iOS | Same API Gateway; push via FCM. |
| **Admin Platform** | Platform administrators | Moderation, compliance, incidents, disputes, financial reports, config | API Gateway (admin scope) → Trust & Safety, Dispute, Payment, User, Listing; read-only analytics. |
| **Broker Dashboard** | Brokers | CRM: clients, leads, listings, messages, deal marketplace access | API Gateway (broker scope) → User, Listing, Messaging, Notification, Deal marketplace. |
| **Owner Dashboard** | Property owners | Unified view: marketplace + BNHub listings, bookings, payouts, performance | API Gateway (owner/host scope) → Listing, Booking, Payment, Analytics; aggregates across marketplaces. |
| **Host Dashboard** | Hosts (BNHub) | BNHub-specific: calendar, pricing, bookings, payouts, cleaning, incidents | API Gateway (host scope) → BNHub services, Booking, Payment, Messaging, Trust & Safety. |

**Connection pattern:** All applications are **thin clients**. They do not hold business logic; they call **backend APIs** (via a single API Gateway or BFF per client type). Authentication is centralized; tokens are sent with every request. Real-time needs (e.g. messaging) use WebSockets or push, still backed by Platform Services.

---

## 4. Marketplace systems

### Main marketplace engines

| Marketplace | Role | Primary users | Key capabilities |
|-------------|------|----------------|------------------|
| **Real Estate Marketplace** | Sale and long-term rental of properties | Guests, buyers, renters, owners, brokers | Property listings, search, offers, long-term booking or purchase flow, connection to Broker CRM. |
| **BNHub Short-Term Rentals** | Short-term accommodation booking | Guests, travelers, hosts, property managers | Accommodation listings, nightly pricing, availability calendar, booking engine, escrow payments, reviews, host tools. |
| **Deal Marketplace** | Off-market deals, partnerships, investment opportunities | Brokers, investors, qualified buyers | Deal creation, visibility rules, expressions of interest, connection to Investment analytics and Broker CRM. |
| **Property Investment Marketplace** | Investment-focused listings and analytics | Investors, brokers, owners | Performance data (yield, occupancy, ROI), deal flow, integration with BNHub and marketplace data. |

**Interaction:** All marketplaces use the **same core platform services** (User, Auth, Listing, Search, Booking where applicable, Payment, Messaging, Review, Trust & Safety). Each marketplace adds **domain-specific logic** (e.g. BNHub: availability, nightly pricing; Deal marketplace: visibility and offers). Data is stored in the shared **Data Layer** with clear ownership (e.g. listing type = marketplace vs BNHub vs deal).

---

## 5. Core platform services

### Backend services that support all marketplaces

| Service | Responsibility | Used by |
|---------|----------------|---------|
| **User service** | User CRUD, profile, roles (guest, host, broker, investor, admin) | All apps and marketplaces |
| **Authentication service** | Login, signup, tokens, sessions, MFA | All apps |
| **Search service** | Index and query listings (marketplace + BNHub); filters, geo, availability | Web, iOS, Android, dashboards |
| **Listing service** | Create, read, update listings; media, rules, status; marketplace vs BNHub variants | All marketplaces, Owner/Host/Broker dashboards |
| **Booking service** | Reserve, confirm, cancel, complete; availability checks | BNHub, marketplace (if long-term booking) |
| **Payment service** | Capture, hold (escrow), release, refund; multi-currency, tax | BNHub, marketplace, all payouts |
| **Messaging service** | Threads and messages (guest–host, broker–client, support) | Web, mobile, Broker/Host dashboards |
| **Notification service** | Templates and delivery (email, SMS, push, in-app) | All modules |
| **Review system** | Create review, aggregate ratings, integrity checks | BNHub, marketplace; Trust & Safety |
| **Trust & Safety service** | Verification, incidents, suspensions, terminations | All marketplaces, Admin |
| **Dispute management service** | Open case, evidence, resolution, refund or release | BNHub, marketplace; Payment |

**Support model:** These services are **shared**. No marketplace implements its own user store or payment engine; each calls the same User, Payment, and Trust & Safety services. This keeps behavior consistent, reduces duplication, and lets AI and governance apply once across the whole platform.

---

## 6. AI intelligence layer

### Systems that monitor and optimize the ecosystem

| System | Purpose | Data consumed | Outputs |
|--------|---------|----------------|---------|
| **Fraud detection engine** | Detect fake listings, stolen payment, synthetic identities, suspicious bookings | Listings, Bookings, Payments, User, events | Flags, blocks, alerts to Trust & Safety |
| **Risk scoring engine** | Score hosts and guests (reviews, cancellations, disputes, verification) | Reviews, Bookings, Disputes, Identity | Risk score per user/role; used for eligibility and ranking |
| **Dynamic pricing engine** | Recommend nightly or sale price from demand and comparables | Listings, Bookings, Search | Price suggestions for hosts/owners |
| **Demand forecasting engine** | Predict occupancy and demand by region/segment | Bookings, Search, Listings | Forecasts for capacity and pricing |
| **Content moderation AI** | Detect policy violations in listing text, reviews, messages | Listings, Reviews, Messaging | Queue for human review; auto-remove when confident |
| **Platform analytics AI** | Anomalies, trends, cohort behavior | All event and transactional data | Dashboards, alerts, product insights |
| **Customer support AI** | Triage, routing, suggested responses, escalation | Incidents, Messaging, Disputes | Faster resolution, deflection where safe |

**Monitoring and optimization:** AI systems **consume** platform data (events + batch from Data Layer). They **output** scores, recommendations, and moderation decisions that Platform Services and Governance use. They do not replace human judgment for high-stakes decisions (e.g. account termination, large refunds) but reduce load and improve consistency.

**Full blueprint:** The complete design for this layer—mission, architecture, engines, fraud/trust/pricing/moderation/support/compliance, human-in-the-loop, rollout—is in [LECIPM-AI-OPERATING-SYSTEM.md](LECIPM-AI-OPERATING-SYSTEM.md) (AI-OS).

---

## 7. Data layer

### Core data domains

| Domain | Contents | Primary writers | Primary readers |
|--------|----------|-----------------|------------------|
| **Users** | Identity, profile, roles, verification status | User service, Auth, Identity verification | All services |
| **Listings** | Property data, type, location, attributes, media, rules, status | Listing service, BNHub listing service | Search, Booking, all marketplaces |
| **Bookings** | Reservation, dates, status, guest, listing | Booking service | Payment, Review, Trust & Safety, Analytics |
| **Payments** | Charges, holds, refunds, payouts, status | Payment service | Booking, Dispute, Trust & Safety, Finance |
| **Reviews** | Rating, comment, link to booking and listing | Review system | Listing, Trust & Safety, Search ranking |
| **Deals** | Deal marketplace opportunities, parties, status | Deal marketplace service | Brokers, Investors, Analytics |
| **Investment portfolios** | Aggregated or derived investment views | Investment analytics / ETL | Investors, Brokers |
| **Trust scores** | Per-user risk/reputation score and components | AI Risk scoring + Trust & Safety | Trust & Safety, Booking, Listing visibility |
| **Incidents** | Safety and policy reports, status, resolution | Trust & Safety, users | Trust & Safety, Admin, AI |
| **Messages** | Threads and message content | Messaging service | All messaging UIs, Support AI |
| **Notifications** | Delivery records and preferences | Notification service | All apps (inbox); delivery channels |

**Data flow:** Users and applications trigger **writes** through Platform Services into the **transactional store**. **Events** (e.g. BookingConfirmed, PaymentReleased) are published for **Search index**, **Analytics warehouse**, and **AI**. **Reads** go through the same services; Search serves queries from its index; Analytics and AI read from warehouse and events. Data flows **one way** for analytics (no app writes to the warehouse directly).

---

## 8. Infrastructure layer

### Cloud infrastructure that supports global scalability

| Component | Role |
|-----------|------|
| **Application servers** | Run API Gateway and stateless app services; scale horizontally; multi-AZ. |
| **Databases** | Transactional DB (e.g. PostgreSQL) for source of truth; read replicas for read-heavy workloads. |
| **File storage** | Object store for images and documents; versioned and backed up. |
| **Content delivery network (CDN)** | Cache static assets and images at the edge; lower latency worldwide. |
| **Load balancers** | Distribute traffic to app and API tier; health checks; TLS termination. |
| **Monitoring systems** | Metrics, logs, traces, alerts; dashboards for ops and product; incident response. |

**Global scalability:** Apps and APIs can be **deployed per region** (e.g. NA, EU, APAC) with traffic routed by geo or user preference. **Data residency** is supported where required (regional DB or replicas). **CDN and load balancing** ensure requests are served from the nearest healthy node. **Horizontal scaling** of stateless services and **read replicas** for DB allow the platform to grow with load.

---

## 9. Platform governance systems

### Internal governance layer

| System | Purpose | How it protects the platform |
|--------|---------|------------------------------|
| **Compliance monitoring** | Track regulatory requirements per region (registration, tax, content) | Flags gaps; tasks for compliance team; reduces legal and regulatory risk. |
| **Trust & Safety operations** | Run verification, incident review, dispute resolution, enforcement | Enforces policies; suspends/terminates bad actors; protects users and brand. |
| **Financial oversight** | Revenue, payouts, refunds, disputes by period and region | Ensures correct settlement; detects anomalies; supports audit and tax. |
| **Moderation systems** | Review reported content (listings, reviews, messages); remove or warn | Keeps content policy-compliant; reduces harm and liability. |
| **Platform administration tools** | Config, feature flags, user/listing overrides, system health | Enables safe operation and rollback; restricts access by role. |

Governance **consumes** Data Layer and AI outputs (risk, fraud, moderation) and **acts** through Platform Services (e.g. suspend account, reverse payout) and Admin applications. It operates **across** all marketplaces so that one set of rules and tools protects the entire ecosystem.

---

## 10. Global platform expansion

### How the platform supports global rollout

| Capability | Design |
|------------|--------|
| **Multi-language support** | UI and key content localized per locale; user or session locale; translation pipeline for listings and support. |
| **Multi-currency support** | Display and charge in local currency; host payout in chosen currency; FX and fees transparent; reporting in base currency. |
| **Regional compliance modules** | Config or code per region: registration fields, tax rules, dispute timelines, required disclosures; no single global “hardcode”. |
| **Local tax systems** | Tax engine or partner (e.g. Stripe Tax, Avalara) per jurisdiction; collect and remit per local law; line items at checkout. |
| **Regional hosting infrastructure** | Deploy app and API in multiple regions; DB or replicas per region where data residency is required; DNS and LB for routing. |

Expansion is **additive**: new regions get language, currency, compliance module, and optionally regional hosting without redesigning the core layers.

---

## 11. Final platform blueprint

### Structural diagram of the LECIPM ecosystem

The following is a **text blueprint** of how all layers interact. It can be turned into a visual diagram (e.g. Mermaid or draw.io) for presentations.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER LAYER                                         │
│  Guests · Hosts · Property Owners · Brokers · Investors · Travelers · Admins  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                      │
│  Web Platform │ iOS App │ Android App │ Admin │ Broker Dashboard             │
│  Owner Dashboard │ Host Dashboard                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                          HTTPS / API Gateway / BFF
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PLATFORM SERVICES LAYER                                  │
│  User · Auth · Search · Listing · Booking · Payment · Messaging · Notification│
│  Review · Trust & Safety · Dispute Management                                 │
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  MARKETPLACES    │  │  AI INTELLIGENCE │  │  GOVERNANCE      │
│  · Real Estate   │  │  · Fraud         │  │  · Compliance    │
│  · BNHub         │  │  · Risk scoring  │  │  · Trust & Safety│
│  · Deal          │  │  · Pricing       │  │  · Financial     │
│  · Investment    │  │  · Moderation    │  │  · Moderation     │
└────────┬────────┘  │  · Support AI    │  │  · Admin tools   │
         │            └────────┬────────┘  └────────┬─────────┘
         │                     │                    │
         │                     │                    │
         └─────────────────────┼────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                           │
│  Users · Listings · Bookings · Payments · Reviews · Deals · Trust scores      │
│  Incidents · Disputes · Messages · Notifications                              │
│  (Transactional DB │ Search Index │ Analytics Warehouse)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                                     │
│  App servers · Databases · File storage · CDN · Load balancers · Monitoring  │
│  (Multi-region · Horizontal scaling · Failover)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Flow summary

1. **Users** (guests, hosts, owners, brokers, investors, travelers, admins) interact only with the **Application Layer** (web, iOS, Android, admin, broker, owner, host dashboards).

2. **Applications** are thin clients: they call the **Platform Services Layer** via API Gateway. They do not implement business logic or talk to the database directly.

3. **Platform Services** implement all core capabilities (identity, search, listings, booking, payment, messaging, notifications, reviews, trust, disputes). They are used by **all marketplaces** (Real Estate, BNHub, Deal, Investment).

4. **Marketplaces** are domain engines that use Platform Services and add domain logic (e.g. BNHub availability and nightly pricing). They read and write the **Data Layer**.

5. **AI Intelligence Layer** consumes events and data from the platform; it outputs fraud flags, risk scores, pricing suggestions, moderation decisions, and support triage. Platform Services and **Governance** use these outputs to enforce policy and protect the platform.

6. **Data Layer** is the single source of truth (transactional DB), plus search index and analytics warehouse. Data flows into it from Platform Services and marketplaces; it flows out to Search, Analytics, and AI.

7. **Infrastructure Layer** hosts all of the above: application servers, databases, file storage, CDN, load balancers, monitoring. It is designed for **horizontal scaling** and **regional deployment** so the platform can operate globally.

8. **Governance** (compliance, Trust & Safety ops, financial oversight, moderation, admin tools) sits across Applications and Platform Services and uses AI and Data to monitor and enforce rules everywhere.

This blueprint is scalable for global operations: add regions, languages, currencies, and compliance modules without changing the layer structure; scale each layer independently (more app instances, more DB replicas, more AI workers) as load grows.

---

*This document is the LECIPM Super Platform Map. It aligns with [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md), [PLATFORM-MISSION](PLATFORM-MISSION.md), and [BNHUB-ARCHITECTURE](BNHUB-ARCHITECTURE.md).*
