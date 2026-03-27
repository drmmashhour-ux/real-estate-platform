# LECIPM Platform Architecture

**Property marketplace and real-estate intelligence platform**

This document describes the architecture of the LECIPM platform so that developers, investors, and future contributors can understand how the system works and how its main parts interact.

---

## 1. Platform Overview

LECIPM is a **property marketplace and real-estate intelligence platform** that supports:

- **Property sales** — Listings, offers, negotiation, and transaction workflows for buying and selling.
- **Long-term rentals** — Rental listings and lease-related flows (structure in place for expansion).
- **Short-term rentals (BNHub)** — Full vacation-rental marketplace: listings, availability, bookings, reviews, host/guest protection.
- **Real-estate transactions** — Offers, counter-offers, messaging, deposits, documents, and closing steps.
- **Investor analytics** — Valuations (sale, long-term rent, short-term revenue), investment scores, and market intelligence.

The platform combines:

| Pillar | Role |
|--------|------|
| **Marketplace tools** | Listings, search, booking, transactions, reviews, messaging. |
| **Verification systems** | Property digital identity, cadastre, ownership/broker verification, geo-validation. |
| **AI intelligence** | Fraud scoring, valuation (AVM), pricing and demand insights, support triage. |
| **Fraud protection** | Anti-fraud engine, listing freeze, investigation workflow, enforcement. |
| **Transaction workflows** | Offers, negotiation, escrow, contracts, and closing for sales and rentals. |

Together, these support a trusted marketplace, defensible transactions, and long-term property data value.

---

## 2. Core Platform Modules

### User System

- **Users** are the central actors: guests, hosts, buyers, sellers, brokers, and admins.
- **Roles** (e.g. USER, LICENSED_PROFESSIONAL, OWNER_HOST, INVESTOR) and **account status** (ACTIVE, RESTRICTED, SUSPENDED, BANNED) control what a user can do.
- **Identity verification** (government ID, selfie) and **broker verification** (license, brokerage) gate listing and transaction capabilities where required.
- Authentication, sessions, and role-based access are applied across all modules.

### Property Identity System

- Every real property is represented by a **permanent digital identity** (`PropertyIdentity`).
- Identity is keyed by **property UID** (deterministic from cadastre, address, municipality, province) and stores cadastre number, normalized address, coordinates, property type, and verification score.
- Listings (sale, long-term, short-term) and transactions are linked to this identity so the platform can track one property across time, prevent duplicate listings, and power analytics.

### Property Verification Engine

- Verifies that a **listing is legitimately offered** by the owner or an authorized broker.
- Combines **cadastre check**, **land-register (or equivalent) document** upload, **identity verification** of the lister, **broker license and authorization** when applicable, and **property geo-validation**.
- Outcomes: VERIFIED (enables Verified Property badge), REJECTED, or PENDING_DOCUMENTS (admin can request more documents).
- All verification steps and decisions are logged for audit and compliance.

### Listings System

- **Short-term (BNHub)** listings: title, description, photos, amenities, pricing, availability, house rules, check-in/out. Support draft, published, unlisted, suspended, and under-investigation states.
- **Sale and long-term rental** listing structures exist or are planned; they link to PropertyIdentity and follow the same verification and fraud rules where applicable.
- Listings can be linked to a property identity, go through verification, and receive fraud scoring before or after publication.

### Search and Discovery

- Search uses listing data, location (city, region), filters (price, dates, amenities, property type), and ranking (verification, reviews, quality).
- **Search ranking** can weight verification status, review score, and other configurable factors so verified, high-quality listings are prioritized.

### Booking System

- **BNHub**: Guests request or instant-book; hosts approve when required; payment is collected by the platform; booking moves to confirmed, then completed (or cancelled/disputed).
- **Availability** is managed per listing (calendar/slots). Minimum/maximum stay and pricing (including cleaning and fees) are enforced.
- Bookings are blocked for listings that are under investigation, frozen, or whose owner is restricted/suspended/banned.

### Transaction Engine

- For **sales (and rent-to-own / structured deals)**:
  - **Offers** and **counter-offers** with price and conditions.
  - **Negotiation messaging** between buyer, seller, and broker.
  - **Deposit escrow**, **digital contracts**, and **closing workflow** (steps such as inspection, financing, legal review, final payment, ownership transfer).
- Transactions are tied to a property identity and optionally to a listing. Status flows (e.g. offer_submitted → negotiation → offer_accepted → deposit_received → completed) are tracked and auditable.

### Payment and Escrow System

- **Guest pays the platform**; the platform holds funds and releases **host payout** after a **protection window** (e.g. 24–48 hours after check-in) unless a dispute or fraud hold applies.
- **Payment states** include PENDING, COMPLETED, FAILED, REFUNDED. **Payout holds** can be applied for escrow window, dispute, fraud investigation, or safety complaint.
- Refunds (full or partial) are tied to dispute resolutions and logged. Relocation support can be offered when policy allows.

### Review System

- Guests can leave **reviews** (overall, cleanliness, communication, location, value) and optional comments after a completed stay.
- Reviews support trust and discovery. **Review abuse** (retaliation, coercion, fake reviews) is handled under the Trust & Safety Engine; reviews can be flagged and moderated.

### Messaging System

- **Booking messages** between guest and host (and **transaction messages** between buyer, seller, broker) are stored and can be used as evidence in disputes or safety cases.
- **Message abuse** reporting and moderation are part of trust and safety; abusive or policy-violating messages can be linked to incidents and enforcement.

### Admin Control Center

- Central place for **operational controls**: feature flags, kill switches, payout holds, listing freezes, booking restrictions, regional locks.
- **Verification queue**, **fraud queue**, **dispute queue**, **trust & safety incidents**, **transaction oversight**, and **audit logs**.
- All sensitive and enforcement actions are logged with reason codes, timestamps, and actor for compliance and appeals.

---

## 3. BNHub Short-Term Rental Marketplace

BNHub is the **short-term rental (vacation rental) module** of LECIPM.

### Features

- **Listing creation** — Hosts create listings with description, photos, amenities, pricing, availability, house rules, and check-in instructions. Listings can be linked to a property identity and submitted for verification.
- **Availability calendar** — Per-listing availability and minimum/maximum stay; integration points for sync and blocking.
- **Booking engine** — Request-to-book or instant book; host approval when required; payment collection; confirmation and status lifecycle (pending, confirmed, completed, cancelled, disputed).
- **Guest reviews** — Post-stay ratings and comments to build trust and improve search.
- **Host dashboard** — Listings, bookings, earnings, messages, and performance indicators.
- **Pricing recommendations** — AI-driven or rule-based suggestions for nightly rate, seasonal adjustments, and minimum stay (when enabled).

### Protection Mechanisms

- **Guests**: Payments held by the platform; payout released only after the protection window (and no open dispute/fraud hold). Dispute flow (report issue, evidence, host response, resolution) with possible full/partial refund or relocation. Clear cancellation and refund rules.
- **Hosts**: Verification and Verified Property badge; fraud protection (investigation before permanent harm); payout hold and dispute resolution with reason codes and evidence; appeals for suspensions or holds where policy allows.
- **Platform**: Escrow-style flow, fraud scoring and freeze, trust & safety incidents, and enforcement (warnings, listing freeze, suspension, ban) with audit trails.

---

## 4. Property Verification System

Property verification ensures that **listings correspond to real, legitimately offered properties** and that **listers are authorized** (owner or licensed/authorized broker).

### Verification Components

- **Cadastre number** — Checked against official or platform-registered data to bind the listing to a specific property.
- **Land register (or equivalent) extract** — Uploaded by the lister; reviewed to confirm ownership or authorization.
- **Identity verification** — Government ID and selfie for the lister; required when the lister claims to be the owner.
- **Broker license verification** — When the lister is a broker: license number, brokerage, and authorization (e.g. mandate) are verified.
- **Property geo-validation** — Address and location are validated (e.g. against cadastre or geo services) so the listing matches the property’s place.

### Verified Property Badge

- Listings that complete the full verification flow (cadastre, identity or broker, and location) and meet platform rules receive a **Verified Property** badge.
- The badge is shown in search and listing detail to signal higher trust and is used in ranking and fraud logic.

---

## 5. Property Digital Identity

Every property has a **permanent digital identity** (`PropertyIdentity`) that persists across listings, transactions, and time.

### What It Links

- **Cadastre number** (when available).
- **Canonical address** (official and normalized).
- **Coordinates** (latitude/longitude).
- **Municipality, province, country** for market and geo logic.
- **Ownership verification** — Current and historical owners from land register or admin review (`PropertyIdentityOwner`).
- **Property history** — Events such as identity creation, listing link/reject, verification completed, fraud flag, ownership change (`PropertyIdentityEvent`).

### Purpose

- **Prevent duplicate listings** — Same cadastre or same UID cannot be used to create a second, conflicting identity; duplicate attempts are flagged.
- **Track property lifecycle** — All listing attempts, transactions, valuations, fraud signals, and safety incidents are tied to one identity, enabling history, analytics, and fraud detection.

---

## 6. Anti-Fraud Engine

The anti-fraud engine **detects and responds to fraudulent or high-risk listing and user behavior**.

### Fraud Signals

- **Duplicate cadastre numbers** — Same property offered under different identities or by unrelated users.
- **Fake or manipulated ownership documents** — Land register or authorization docs that do not match or are altered.
- **Suspicious listing behavior** — E.g. unrealistic pricing, stolen or mismatched photos, inconsistent address/cadastre.
- **Broker abuse** — Unlicensed activity, fake authorization, or patterns of rejected or flagged listings linked to the same broker.

### How It Works

- **Fraud scoring** — Listings (and optionally users/properties) receive a **fraud risk score** (e.g. 0–100) and risk level (low/medium/high) based on signals and rules.
- **Automatic actions** — When the score exceeds a threshold (e.g. 70), the listing can be moved to **under investigation** and **removed from public search**; **new bookings** are blocked and **host payouts** for that listing can be **held**.
- **Investigation workflow** — Admins review cadastre, documents, identity, broker license, and history; then **restore**, **reject**, **request more documents**, or **suspend/ban** the user. All actions use **reason codes** and **audit logs**.

---

## 7. Trust and Safety Engine

The trust and safety system handles **safety incidents, abuse, and policy violations** beyond pure listing fraud.

### What It Handles

- **Unsafe properties** — Dangerous conditions, severe misrepresentation, habitability issues.
- **Harassment** — Harassment between users (guest/host or others).
- **Abusive behavior** — Threats, intimidation, discriminatory conduct.
- **Illegal activity** — Reports of illegal use or conduct tied to a listing or user.
- **Guest or host misconduct** — Repeated violations, nuisance (e.g. unauthorized parties), or serious service failures.

### Reporting and Workflows

- **Incident categories** — e.g. unsafe_property, harassment, abusive_behavior, illegal_activity, unauthorized_party, message_abuse, review_abuse, discrimination_report.
- **Severity and urgency** — From low to emergency; high-severity cases are prioritized and can trigger immediate payout hold or listing freeze.
- **Evidence** — Photos, screenshots, messages, documents; stored securely with restricted access and audit logging.
- **Enforcement actions** — Warning, listing warning, booking restriction, payout hold, listing freeze, account suspension, permanent listing removal, permanent account ban, additional verification, or manual review. Each action has **reason code**, **notes**, **case reference**, and **timestamp**.

### Appeals

- Users can **appeal** certain decisions (e.g. listing or account suspension, payout hold). Appeals are reviewed by admins; outcomes are recorded and linked to the original incident and action.

---

## 8. Dispute Resolution System

The platform resolves **guest–host disputes** (especially for short-term rentals) when the stay does not match the listing or platform standards.

### Example Cases

- Property **not as described**.
- **Cleanliness** problems.
- **Missing amenities** that were promised.
- **Misleading photos** or listing information.
- **Unsafe conditions** or **host unresponsive** in critical situations.

### Workflow

1. **Guest reports** an issue from the trip/booking page within the allowed window (e.g. 24 hours after check-in), with category, description, and evidence.
2. **Platform collects** evidence and links the case to the booking and listing.
3. **Host response** is requested within a deadline (e.g. 48 hours); response is recorded.
4. **Investigation** — Support/trust & safety review listing, guest evidence, host response, and history.
5. **Resolution** — Decision is issued and recorded (e.g. no action, partial refund, full refund, relocation, listing suspension, host suspension). Refunds and payout releases are applied accordingly.

### Refund and Relocation

- **Full refund** — When the property is fake, uninhabitable, or the stay cannot be honored; guest funds are protected and host payout is not released or is reversed as needed.
- **Partial refund** — When the issue is material but the stay continued (e.g. missing amenities, cleanliness).
- **Relocation** — When policy allows, the platform may help the guest find alternative accommodation.

All outcomes are tied to the dispute case, logged, and visible in admin dashboards for audit. See **Trust & Safety Governance** for full policy detail.

---

## 9. Real Estate Transaction Engine

The transaction engine supports **structured sale (and related) deals** with full workflow and auditability.

### Features

- **Offer submission** — Buyer submits an offer (price, conditions, expiration).
- **Counter-offers** — Seller (or broker) can counter with a new price or terms.
- **Negotiation messaging** — In-platform messages between buyer, seller, and broker, stored for record.
- **Deposit escrow** — Deposit amounts and payment status (e.g. pending, paid, refunded) are tracked.
- **Digital contracts** — Document types (e.g. purchase agreement, broker agreement) with uploads and signature state (signed by buyer/seller/broker).
- **Closing workflow** — Steps such as inspection, financing approval, legal review, final payment, ownership transfer; each step has status and optional completion metadata.

Transactions are linked to a **property identity** and optionally to a listing. Status progresses through defined states (e.g. offer_submitted → negotiation → offer_accepted → deposit_received → contract_signed → completed or cancelled). All actions and documents are logged for compliance and dispute resolution.

---

## 10. AI Marketplace Operator

AI supports **operational efficiency and consistency** while keeping humans in the loop for high-stakes decisions.

### Where AI Assists

- **Listing analysis** — Quality, completeness, and consistency of listing content and photos.
- **Fraud detection** — Risk scoring, duplicate detection, and anomaly signals for review.
- **Pricing suggestions** — Nightly rate, seasonal adjustments, and minimum stay for short-term listings; demand-based hints where data exists.
- **Support triage** — Classification and prioritization of disputes and trust & safety incidents (e.g. category, severity).
- **Demand forecasting** — Indicators for occupancy and demand by market or listing (when data and models are available).

### Human Oversight

- **Enforcement and refunds** — Final decisions on account suspension, listing removal, payout hold, and refund amounts remain with human reviewers; AI may recommend actions but does not auto-apply high-risk enforcement.
- **Evidence and appeals** — Human review is required for sensitive evidence and appeal outcomes.

---

## 11. AI Property Valuation System

The **AVM (Automated Valuation Model)** and related logic provide **property-level estimates** for sale, rent, and investment.

### What Is Estimated

- **Property sale value** — Estimated market value (point estimate and optional range).
- **Monthly rent potential** — Long-term rental estimate.
- **Short-term rental revenue** — Nightly rate and annual revenue potential for BNHub-style use.
- **Investment attractiveness** — Scores or indicators (e.g. gross yield, risk level) for investor analytics.

### Confidence and Ranges

- Each valuation has a **confidence score** (e.g. 0–100) and **confidence label** (e.g. low, medium, high) based on data quality and comparables.
- **Value ranges** (min/max) can be provided where the model supports it. Valuations are stored with **valuation type** (sale, long_term_rental, short_term_rental, investment), **timestamp**, and optional **listing id** for traceability.

Valuations feed the **Global Property Data Graph**, investor tools, and listing/pricing guidance.

---

## 12. Global Property Data Graph

The **Global Property Data Graph** is a **unified property intelligence layer** that connects all key entities and events around a property.

### What It Connects

- **Properties** (via PropertyIdentity)
- **Owners** (current and historical)
- **Brokers** (verified brokers and their transactions)
- **Listings** (sale, long-term, short-term over time)
- **Bookings** (BNHub)
- **Transactions** (offers, deals, closing)
- **Valuations** (sale, rent, STR revenue, investment)
- **Fraud events** (scores, alerts, identity risk)
- **Safety incidents** (trust & safety)
- **Markets** (city/municipality/province/country nodes)

Relationships are derived from **foreign keys** in the relational database plus **semantic edges** (e.g. IN_MARKET, SIMILAR_TO, SAME_MARKET) stored in a graph-edge table.

### Purpose

- **Track property lifecycle** — One identity, full history of listings, transactions, valuations, fraud, and safety.
- **Improve analytics** — Comparable properties, market aggregates, and investor scoring.
- **Detect fraud patterns** — Same cadastre, same broker, or same user across multiple properties or incidents.

The graph is assembled **on read** from existing tables plus optional semantic edges; it is **graph-ready** for future migration to a dedicated graph DB if needed. See **Property Data Graph** documentation for APIs, storage strategy, and update pipeline.

---

## 13. Admin and Compliance Tools

Admins have dedicated tools to **manage verification, fraud, disputes, transactions, and trust & safety** with full traceability.

### What Admins Manage

- **Property verification** — Review documents, cadastre, identity, and broker authorization; approve, reject, or request more documents; all decisions logged.
- **Fraud investigations** — Review frozen or high-risk listings; restore, reject, request documents, or apply user suspension/ban; enforce reason codes and notes.
- **Dispute cases** — View evidence, host/guest responses, and resolution history; resolve with outcome and refund; escalate to trust & safety when needed.
- **Transactions** — Oversee offers, counter-offers, deposits, and closing steps; freeze or intervene when required by policy.
- **Trust and safety incidents** — Incident queue, severity filters, evidence, enforcement actions (warn, freeze listing, hold payout, suspend user, ban); appeals review.

### Logging and Audit

- **All sensitive and enforcement actions** are logged with **reason code**, **timestamp**, **actor**, and **case reference**.
- **Evidence** is stored securely with **restricted access** and **audit logging** for access and changes.
- Admin dashboards and APIs support **audit trails** for compliance and legal defensibility.

---

## 14. Security and Governance

Platform governance is designed to protect users, data, and the integrity of the marketplace.

### Requirements

- **Role-based access control** — Users, hosts, brokers, support, and admins have distinct permissions; admin and support actions are restricted and logged.
- **Secure document storage** — Verification documents, contracts, and evidence are stored in a secure, access-controlled environment; access and significant actions are logged.
- **Audit logging** — Verification decisions, fraud actions, dispute resolutions, enforcement actions, payout holds, and admin operations are recorded with actor, time, and reason.
- **Evidence storage** — Trust & safety and dispute evidence is retained according to retention and legal-hold policy; chain of custody and access are auditable.
- **Admin action tracking** — All admin actions that affect listings, users, payouts, or safety are traceable to an authenticated admin and a reason code.

Governance details (e.g. fraud response, dispute resolution, appeals, evidence handling, AI role) are set out in the **Trust & Safety Governance** document.

---

## 15. Future Platform Capabilities

The architecture is intended to support expansion in these directions:

- **Market intelligence dashboards** — Aggregated metrics by market (city, region): active listings, average prices, occupancy, demand trends, fraud and dispute rates.
- **Investor analytics tools** — Portfolio views, valuation history, comparable set, yield and risk indicators, and opportunity scoring powered by the property graph and valuations.
- **AI demand forecasting** — Improved occupancy and demand models by region and property type; integration with pricing and inventory decisions.
- **Global property analytics** — Cross-market comparisons, trend reports, and benchmarking while respecting data residency and privacy.
- **Broker performance scoring** — Broker activity, transaction outcomes, and compliance signals to support broker verification and quality.

The **Global Property Data Graph**, **verification**, **fraud**, and **trust & safety** layers provide the foundation for these extensions without redesigning core flows.

---

## 16. Final Vision

LECIPM is designed to become:

1. **A trusted global property marketplace** — Where sale, long-term, and short-term rental listings are verified, fraud is detected and mitigated, and guests and hosts are protected by clear rules, escrow, and dispute resolution.
2. **A real-estate transaction platform** — Where offers, negotiation, deposits, contracts, and closing are supported in one place with full auditability and compliance.
3. **A property intelligence network** — Where every property has a permanent identity, full lifecycle history, and connections to owners, brokers, listings, transactions, valuations, fraud, and safety — enabling better valuations, investor tools, and market insight.

The architecture is built to support **scalability** (modular services, clear APIs, graph-ready data model), **trust** (verification, fraud protection, trust & safety, disputes, and governance), **compliance** (audit logs, reason codes, evidence handling, role-based access), and **long-term data value** (property identity, graph, valuations, and analytics). As new markets and product lines are added, the same pillars — identity, verification, fraud, safety, transactions, and intelligence — apply consistently across the platform.

---

*For implementation details, see the codebase (e.g. `lib/trust-safety`, `lib/property-graph`, `lib/verification`, dispute and transaction services) and the supporting docs: **Trust & Safety Governance**, **Property Data Graph**.*
