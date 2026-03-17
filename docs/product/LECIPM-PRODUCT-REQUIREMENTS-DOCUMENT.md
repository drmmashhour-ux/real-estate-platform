# LECIPM Platform — Product Requirements Document (PRD)

**Complete product specification for the LECIPM ecosystem**

This document defines platform features, user workflows, and system behavior so that engineering teams can build the product. It aligns with the [Super Platform Master Blueprint](LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT.md), [Platform Architecture](LECIPM-PLATFORM-ARCHITECTURE.md), [Master Product Roadmap](LECIPM-MASTER-PRODUCT-ROADMAP.md), and [Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md). Product management owns this PRD; engineering implements to these requirements unless explicitly agreed otherwise.

---

## 1. Product overview

### 1.1 Purpose

LECIPM is a **global real estate and accommodation ecosystem** that provides:

- **Real estate marketplace** — Property listings for sale and long-term rental; search, offers, broker integration.
- **BNHub short-term rentals** — Short-term accommodation listings, booking engine, host and guest flows, pricing, and payouts.
- **Broker CRM** — Client, lead, and listing management for licensed brokers; connection to marketplace and BNHub.
- **Owner dashboard** — Unified view of properties, listings, bookings, payouts, and performance for owners.
- **Deal marketplace** — Investment opportunities and off-market deals; expressions of interest; connection to brokers and investors.
- **Investment analytics** — Yield, occupancy, ROI, and market insights derived from platform data.
- **Trust & Safety system** — Identity and listing verification, incident reporting, fraud monitoring, disputes, and enforcement.
- **AI Control Center (AI-OS)** — Fraud detection, risk scoring, dynamic pricing, demand forecasting, content moderation, and support automation.
- **Mobile applications** — Web (responsive), iOS, and Android clients for all user types.

### 1.2 How the ecosystem connects participants

| Participant | Capabilities on the platform |
|-------------|------------------------------|
| **Property owners** | List properties (sale, long-term, short-term); manage availability and pricing; view performance and payouts; optionally use broker or property manager. |
| **Brokers** | Manage clients and leads; create or refer listings; communicate with clients; access deal marketplace and analytics; verified professional status. |
| **Investors** | Browse deal marketplace; view investment analytics; express interest in deals; connect with brokers. |
| **Travelers (guests)** | Search and book short-term stays (BNHub); message hosts; leave reviews; access support. |
| **Service providers** | Offer cleaning, maintenance, inspection, or insurance through the platform; receive bookings and payments per marketplace rules. |

All participants use a **single identity** (one account, multiple roles). The platform enforces **one trust layer** (verification, risk, moderation) across all modules. Data flows across modules to support search, analytics, and safety.

**Reference:** [PROJECT-OVERVIEW](PROJECT-OVERVIEW.md), [LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT](LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT.md).

---

## 2. Target users

### 2.1 User types and needs

| User type | Definition | Primary needs |
|-----------|------------|----------------|
| **Guests** | Users who search for and book short-term stays (BNHub) or browse/buy/rent in the marketplace. | Find relevant listings; see accurate photos, pricing, and availability; book and pay securely; message host; get support; leave and read reviews. |
| **Hosts** | Users who list and manage short-term rental properties on BNHub. | Create and update listings; set availability and pricing; receive bookings and payouts; message guests; handle incidents; view performance. |
| **Property owners** | Individuals or entities who own properties (sale, long-term or short-term). May overlap with hosts. | List on marketplace and/or BNHub; see unified performance and revenue; manage payouts; optionally use broker or manager. |
| **Brokers** | Licensed real estate professionals. | Manage clients and leads; create or refer listings; communicate with clients; access deal flow and analytics; maintain verified status. |
| **Investors** | Users seeking investment opportunities (deals, yield, portfolio). | Discover deals; view analytics and performance data; express interest; connect with brokers or deal owners. |
| **Platform administrators** | Internal staff (ops, Trust & Safety, support, finance). | Moderate content; handle incidents and disputes; monitor fraud and risk; view financial and platform metrics; configure policies. |

### 2.2 Role model

- A **user** (one account) can have one or more **roles**: guest, host, broker, investor. Admin is a separate privileged role.
- Role affects **visibility** (e.g. broker dashboard only for brokers) and **authorization** (e.g. only hosts can create BNHub listings). Role is assigned at signup or via application/verification (e.g. broker after license check).
- **Guests** need no special verification to search and book; identity verification may be required for high-value or first booking per policy.
- **Hosts** must complete identity verification before a listing can go live. Listing may require additional verification (e.g. property/registration) per region.

**Reference:** [PLATFORM_ROLES](PLATFORM_ROLES.md), [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md).

---

## 3. User journeys

### 3.1 Guest booking a BNHub stay

1. **Discover:** Guest opens web or app → enters location (city/address) and dates, optional guests → sees search results (listings with photo, price, rating, availability).
2. **Detail:** Guest clicks a listing → sees full detail (photos, description, amenities, house rules, calendar, reviews) and total price for selected dates.
3. **Reserve:** Guest clicks “Reserve” or “Book” → if not logged in, signs up or logs in → selects payment method → sees final breakdown (nights, cleaning fee, service fee, taxes) → confirms.
4. **Payment:** System charges guest; creates booking; blocks calendar; sends confirmation (email + in-app). Guest sees “My trips” with booking details.
5. **Pre-stay:** Guest and host can message in booking thread. Guest can view check-in info and cancel per policy.
6. **Stay:** Guest checks in (offline or via app); stays; checks out.
7. **Post-stay:** After checkout, guest can leave a review (rating + text). Once both parties have reviewed (or window closes), reviews are published. Host payout is released per schedule.
8. **Support:** At any step guest can contact support or report an issue; incident is triaged and handled per Trust & Safety procedures.

**System behavior:** Search uses Listing + Availability + Pricing; Booking service creates reservation and calls Payment; Payment captures and optionally holds in escrow; Notification sends confirmations; Review service opens review window after stay end; Payout service releases host payout per policy.

### 3.2 Host listing a property

1. **Sign up / log in:** User creates account or logs in. If listing for the first time, selects “List your property” or equivalent.
2. **Verification:** Platform prompts for identity verification (document + liveness). Host completes flow; status becomes “Verified” or “Pending.” Listing cannot go live until verified (per policy).
3. **Create listing:** Host enters property type, location (address, map pin), photos (minimum number and quality rules), description, capacity (guests, beds, rooms), amenities, house rules. For BNHub: nightly price, cleaning fee, check-in/out times. For marketplace: price (sale or monthly rent), listing type.
4. **Availability (BNHub):** Host sets calendar (available by default or block dates); min/max stay if supported. Calendar syncs with bookings.
5. **Submit:** Host submits listing. System runs completeness and policy checks; listing enters state “Pending review” or “Draft” (if incomplete).
6. **Review:** Automated or human review checks accuracy, policy, and quality. If approved, listing goes “Live.” If rejected, host sees reason and can edit and resubmit.
7. **Live:** Listing appears in search (subject to region and filters). Host can edit (except critical fields that may require re-review), update calendar and price, and respond to bookings and messages.
8. **Ongoing:** Host receives bookings and payouts; can view performance in dashboard. Compliance (e.g. registration, tax) reminders or blocks per region.

**System behavior:** User service stores profile; Identity verification service updates status; Listing service stores listing and triggers Search index update; Availability service (BNHub) stores calendar; Moderation or Listing service performs review and sets state; Booking and Payment drive payout flow.

### 3.3 Broker managing listings

1. **Onboard:** Broker signs up; completes broker profile (name, firm, license number, region). Platform verifies license (manual or integration); broker status becomes “Verified broker.”
2. **Dashboard:** Broker sees CRM dashboard: clients/contacts, leads, listings (own or referred), messages, tasks.
3. **Add listing:** Broker creates listing (marketplace or BNHub) on behalf of owner or adds owner as referral. Listing is linked to broker; owner may need to verify. Listing goes through same review as direct host.
4. **Leads:** Inquiries or form submissions from marketplace or BNHub appear as leads. Broker assigns to client or contact; updates status.
5. **Communication:** Broker messages clients or guests via platform messaging. Notifications for new messages.
6. **Deal marketplace:** Broker can create or view deals; express interest or connect investors. Deal flow visible in CRM if configured.
7. **Analytics:** Broker sees performance of own listings (views, leads, bookings if BNHub). Optional: market or comparative analytics per subscription.

**System behavior:** User service stores broker profile; Identity/Trust & Safety verifies license; Listing service associates listing with broker; Messaging and Notification support communication; Deal marketplace service stores deals and interest; Analytics reads from Listings, Bookings, Search (aggregated).

### 3.4 Investor browsing opportunities

1. **Access:** Investor logs in; navigates to Deal marketplace or Investment analytics (per role and subscription).
2. **Deal marketplace:** Browses deals (filters: region, type, price range). Views deal detail (description, terms, contact). Expresses interest (form or message); deal owner or broker is notified.
3. **Analytics:** Views market insights (e.g. yield by region, occupancy trends), property-level or portfolio performance if they have linked properties, and optional valuation or comparables. Export or API per subscription.
4. **Follow-up:** Communication with broker or deal owner via messaging or contact flow. Platform does not execute investments; it connects parties and surfaces data.

**System behavior:** Deal marketplace service returns deals with visibility rules; Investment analytics service aggregates from Listings, Bookings, Payments (read-only); Messaging supports communication; Access control by role and subscription.

### 3.5 Admin handling incidents

1. **Queue:** Admin opens Trust & Safety or moderation dashboard; sees queues: incidents, reported content, disputes, high-risk users/listings.
2. **Triage:** Clicks an incident; sees context (reporter, reported user/listing, booking, messages, evidence). Assigns to self or team; sets priority.
3. **Investigate:** Reviews evidence (messages, listing snapshot, payment, verification status). May request more info from user or escalate to legal.
4. **Action:** Chooses action: no action, warning, remove content, suspend listing, suspend account, terminate account, refer to authorities. Documents reason code and notes. System applies action (e.g. suspend listing via Listing service, notify user via Notification).
5. **Dispute:** If incident is a dispute, follows dispute flow: evidence, resolution (refund full/partial, no refund, release payout). Payment service executes refund or release. Both parties notified.
6. **Close:** Incident marked resolved; audit trail stored. Reporter and affected user can be notified of outcome per policy.

**System behavior:** Trust & Safety service stores incidents and actions; Dispute service integrates with Payment for refunds/releases; Listing and User services apply suspension/termination; Notification sends outcomes; Audit log records all actions.

---

## 4. Real estate marketplace features

### 4.1 Property listings

- **Listing types:** Sale, long-term rental. Optional: investment (e.g. yield-focused). Each type has required fields (price, address, type, media).
- **Required fields:** Title, property type, location (address, city, region, country), at least one photo, description, price (sale price or monthly rent), lister (owner or broker). Optional: beds, baths, sq ft, year built, features.
- **Media:** Minimum number of photos (e.g. 5); at least one exterior. Format and size limits. No misleading or stock images per policy.
- **Status:** Draft, Pending review, Live, Suspended, Archived. Only Live appears in search. Status changes via host/owner action or admin/Trust & Safety.
- **Ownership:** Listing is linked to user (owner) and optionally to broker. Right-to-list is attested by lister; verification (e.g. cadastral) may be required per region.

**Acceptance criteria:** Lister can create and edit listing; listing passes validation and review; Live listings appear in marketplace search; admin can suspend or archive with reason.

### 4.2 Search and filters

- **Query:** Text search (title, description, address); location (city, region, map bounds); listing type (sale, rent); price range; beds/baths; features/amenities. Results ranked by relevance, then sort options (price, date, rating if reviews exist).
- **Results:** Paginated list of listing cards (photo, title, price, location, optional broker badge). Click through to listing detail.
- **Map view:** Optional map with pins for results; filter and sort apply. Map and list stay in sync.
- **Performance:** Search responds within defined latency (e.g. p95 < 2s). Uses Search service/index; no full table scan on primary DB.

### 4.3 Property detail page

- **Content:** All listing fields; photo gallery; map; broker or owner contact (message or lead form); “Request tour” or “Contact” CTA. For long-term: application or inquiry flow if supported.
- **Offers (sale):** If offer management is supported: “Make offer” → offer amount, terms, expiry; lister sees offer and can accept, reject, or counter. Notification to both parties.
- **Trust signals:** Verification badge (broker/owner), review aggregate if from BNHub cross-list, optional “Verified listing” if applicable.

### 4.4 Broker contact tools

- **Lead form:** Guest/buyer submits name, email, phone, message. Stored as lead; linked to listing and broker. Broker notified; lead appears in CRM.
- **Messaging:** Broker and guest can message in thread linked to listing or lead. Thread list in Broker dashboard.

### 4.5 Offer management

- **Create offer:** Buyer submits offer (amount, closing date, contingencies if supported). Offer state: Pending, Accepted, Rejected, Countered, Expired.
- **Counter-offer:** Lister responds with counter terms; buyer can accept, reject, or counter again. Expiry per offer.
- **Acceptance:** When offer is accepted, status updates; both parties notified. Optional: deposit via Payment service (escrow) per product and region.
- **Audit:** All offer and counter steps logged with timestamp and party.

**Reference:** [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md), [LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT](LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT.md).

---

## 5. BNHub features

### 5.1 Host listing creation

- **BNHub-specific fields:** Property type (apartment, house, etc.), nightly base price, cleaning fee, extra guest fee (if any), max guests, bedrooms, beds, baths, check-in/out times, house rules (text or structured). Optional: registration number (short-term rental), safety amenities (smoke detector, first aid).
- **Photos and description:** Same quality and minimums as marketplace; description must match property. No hidden fees in description; all fees in structured fields.
- **Pricing display:** Guest sees nightly rate + cleaning fee + service fee + taxes (if collected) before booking. Total calculated for selected dates and guests.
- **Submission:** Same flow as §3.2: verification required, then create listing, then review, then go live.

### 5.2 Calendar availability

- **Per listing:** Calendar of available and blocked dates. Default: all dates available or configurable default (e.g. 3 months ahead).
- **Host actions:** Block dates; set min stay and max stay (global or by date range). Calendar updates immediately; search and booking use latest availability.
- **Sync:** When a booking is confirmed, those dates are blocked. When a booking is cancelled, dates are released per policy. No double-booking: booking creation is conditional on availability check.
- **Display:** Guest sees calendar on listing detail with available dates and price per night (if variable). Host sees calendar in dashboard with blocks and bookings.

### 5.3 Booking engine

- **Inputs:** Listing ID, check-in date, check-out date, number of guests. Optional: extra services (cleaning add-on, etc.).
- **Validation:** Dates are available; check-in >= today; check-out > check-in; guests <= max guests; min/max stay satisfied. If not valid, return clear error.
- **Pricing:** Total = (nightly rate × nights) + cleaning fee + extra guest fees + platform guest fee + taxes. Display breakdown before payment.
- **Reservation flow:** Guest confirms → Payment service charges card → On success, Booking service creates booking (status Confirmed), blocks calendar, sends confirmation. On payment failure, no booking created; guest can retry.
- **Booking states:** Reserved (if request flow), Confirmed, Checked-in (optional), Completed, Cancelled. State transitions and who can trigger them are defined (e.g. guest cancels before check-in per policy).
- **Idempotency:** Same idempotency key prevents duplicate bookings if client retries.

### 5.4 Pricing system

- **Base price:** Per night, in listing currency. Host can set one price or overrides by date range (e.g. weekend, season).
- **Fees:** Cleaning fee (per stay); extra guest fee (per guest per night above a threshold if configured). Stored with listing; displayed to guest.
- **Platform fee:** Guest service fee (e.g. % of subtotal) and host commission (e.g. % of booking value). Configurable by region; applied at booking time.
- **Tax:** If platform collects tax (e.g. occupancy tax), calculated per jurisdiction and shown in breakdown. Host payout may be net of host commission and tax.
- **Currency:** Listing has currency (e.g. CAD); guest is charged in that currency (or converted per payment provider). Payout to host in listing currency or configured payout currency.

### 5.5 Guest checkout process

- **Pre-checkout:** Guest sees listing, dates, total price, and policy (cancellation, house rules). Must be logged in to proceed.
- **Payment method:** Add card (or select saved); card is charged at confirmation. Optional: save card for future use (tokenized; no raw card on platform).
- **Confirmation:** Success page and email with booking ID, dates, address, host contact (message), and cancellation link. Receipt with itemized total.
- **Cancellation:** Guest can cancel from “My trips” or link in email. Refund per cancellation policy (full, partial, none by date). Payment service issues refund; calendar released; both parties notified.

### 5.6 Review system (BNHub)

- **Eligibility:** After checkout date (stay end), guest and host can each submit one review. Window (e.g. 14 days) after checkout. No edit after submit (or only within short window per policy).
- **Content:** Rating (e.g. 1–5 overall and optional dimensions) and optional text. No PII, profanity, or policy-violating content; moderation applies.
- **Display:** Reviews appear on listing (aggregate rating and list) and on user profile (for host/guest). Sort by date. One review per stay per side.
- **Integrity:** No review trading or coercion per policy. Detection (e.g. duplicate IP, patterns) can flag for moderation. Reviews are immutable once published (except removal by moderation).

**Reference:** [BNHUB-BUSINESS-MODEL](BNHUB-BUSINESS-MODEL.md), [LECIPM-MONTREAL-LAUNCH-PLAYBOOK](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md).

---

## 6. Broker CRM features

### 6.1 Client management

- **Entities:** Contacts (name, email, phone, source, notes). Optional: company, segment (buyer, seller, investor). Linked to broker (owner).
- **CRUD:** Broker can add, edit, archive contacts. Import (CSV) if supported. No duplicate constraint by email across brokers (same email can be contact of multiple brokers).
- **Views:** List and search; optional pipeline or tags. Contact detail page with activity (leads, messages, listings).

### 6.2 Listing management

- **Broker listings:** Listings created by broker or referred to broker. View: all my listings; status (draft, live, etc.); quick link to edit on marketplace or BNHub.
- **Create:** Broker creates listing (marketplace or BNHub) with self as broker; owner may be required to verify. Same listing fields and review as non-broker.
- **Referral:** Broker invites owner to list; owner signs up and claims listing. Listing linked to broker for attribution and reporting.

### 6.3 Lead tracking

- **Source:** Lead from marketplace (inquiry, lead form) or BNHub (contact request) or manual entry. Fields: name, email, phone, message, listing ID, source, date.
- **Assignment:** Lead is linked to broker (or team). Broker assigns to contact or creates new contact. Status: New, Contacted, Qualified, Lost, Won (or equivalent).
- **Notifications:** Broker notified of new lead (email or in-app). Optional: daily digest.

### 6.4 Communication tools

- **Messaging:** Threads with contacts or guests; linked to listing or lead. Send/receive messages; history visible in CRM. Same Messaging service as rest of platform.
- **Templates:** Optional saved replies for common questions. No automated outreach without user action (comply with anti-spam).
- **Notifications:** In-app and email for new message, lead, or listing update. Preferences in account settings.

**Reference:** [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md), [LECIPM-MASTER-PRODUCT-ROADMAP](LECIPM-MASTER-PRODUCT-ROADMAP.md).

---

## 7. Owner dashboard features

### 7.1 Property performance analytics

- **Scope:** Properties owned or managed by the user (linked to their account). Each property can have marketplace and/or BNHub listings.
- **Metrics:** For BNHub: occupancy rate, revenue (by period), average nightly rate, number of bookings. For marketplace: views, leads, offers (if applicable). Period selector (week, month, quarter, year).
- **Comparison:** Optional: compare to market average or similar listings (region, type) if data available. Display as chart or table.

### 7.2 Revenue tracking

- **BNHub payouts:** List of payouts (date, amount, status, related bookings). Upcoming payout (next date, estimated amount). Payout method (bank account) management.
- **Marketplace:** If applicable, sale or rental income tracked per listing; status of payments (deposit, closing) per offer flow.
- **Export:** Optional CSV or report for accounting (payout history, booking list).

### 7.3 Portfolio overview

- **Summary:** List of properties; per property: listings (marketplace + BNHub), status, key metric (e.g. revenue or occupancy). Drill into property → listing(s) → bookings or offers.
- **Unified view:** Single dashboard for owners with both marketplace and BNHub; no need to switch products.

### 7.4 Maintenance tracking

- **Optional:** Track maintenance requests or tasks per property (e.g. cleaning, repair). Status and assignee; link to booking if post-checkout cleaning. May integrate with service marketplace or external tool. If not in MVP, document as future feature.

**Reference:** [LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT](LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT.md).

---

## 8. Deal marketplace features

### 8.1 Investment opportunities

- **Deal entity:** Title, description, type (e.g. off-market, partnership, development), location, price/terms, contact (broker or deal owner), visibility (public, invite-only). Optional: attachments, timeline.
- **Creation:** Broker or qualified user creates deal; fills required fields. Deal enters draft or pending review; when approved, visible per visibility rules.
- **Listing:** Deal appears in Deal marketplace search and filters (region, type, price). Detail page shows full info and “Express interest” or “Contact” CTA.

### 8.2 Deal analytics

- **For deal owner:** Views, expressions of interest, contact clicks (if tracked). Optional: benchmark or performance vs similar deals.
- **For platform:** Aggregate metrics (deals by region, type; conversion) for admin or reporting. No PII in analytics.

### 8.3 Investor communication tools

- **Express interest:** Investor submits form (name, email, message) or sends message. Deal owner or broker notified; thread created in Messaging. Investor sees confirmation.
- **Contact:** Same as lead flow: message thread linked to deal. Broker or deal owner responds via platform. Optional: calendar link for call.

**Reference:** [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md).

---

## 9. Investment analytics

### 9.1 Market insights

- **Content:** Aggregate data by region and segment: average yield, occupancy trend, price trend, supply/demand indicators. Sourced from platform listings and bookings (aggregated, no PII). Optional: third-party data.
- **Access:** Available to users with Investment analytics subscription or role. Display as dashboards, charts, or reports. Export (CSV, PDF) per plan.
- **Update:** Data refreshed on schedule (e.g. daily or weekly); timestamp shown. No real-time streaming required for v1.

### 9.2 Property valuation models

- **Input:** Address or listing ID. **Output:** Estimated value or range (sale or rental yield) based on comparables and/or models. Clearly labeled as estimate, not appraisal.
- **Use case:** Owner or investor views estimate for a property. Optional: use in listing or deal. Accuracy disclaimer required.
- **Data:** Uses platform and optionally external data; model version and date displayed.

### 9.3 Portfolio performance tracking

- **Scope:** User’s linked properties (same as Owner dashboard). Metrics: occupancy, revenue, yield, ROI (if cost data entered). Comparison to market or benchmark if available.
- **Views:** Table and charts by property and over time. Drill-down to listing and booking level for own data only.
- **Access control:** Users see only their portfolio; no access to other users’ raw data. Aggregated market data is anonymized.

**Reference:** [LECIPM-MASTER-PRODUCT-ROADMAP](LECIPM-MASTER-PRODUCT-ROADMAP.md), [LECIPM-MONETIZATION-ARCHITECTURE](LECIPM-MONETIZATION-ARCHITECTURE.md).

---

## 10. Trust & Safety features

### 10.1 Identity verification

- **Flow:** User is prompted to submit ID document (e.g. passport, driver’s license) and optionally liveness (selfie). Third-party provider (e.g. Onfido, Jumio) performs check. Result: Verified, Failed, Pending.
- **Storage:** Verification result and status stored; no raw document stored on platform (provider holds per their policy). Status displayed to user and to admin; optional “Verified” badge on profile.
- **Gating:** Host cannot publish BNHub listing until verified. Broker cannot get “Verified broker” until license and identity verified. Optional: guest verification for first booking or high-value booking per policy.
- **Retry:** On failure, user sees reason (e.g. “Document unclear”); can retry. Support can assist; no override of failed verification without re-run.

### 10.2 Listing verification

- **Completeness:** System checks required fields (photos, description, price, etc.). Incomplete listings cannot go live; host sees checklist.
- **Policy:** Automated or manual check for prohibited content (discrimination, illegal, misleading). Violations block or queue for review.
- **Property/registration:** In regions that require short-term rental registration, host must enter registration number or upload proof. Optional: validate against registry if API available. Non-compliant listings can be restricted until verified.
- **Post-live:** Listings can be re-reviewed on report or flag. Duplicate listing detection (same address, similar photos) flags for merge or removal.

### 10.3 Incident reporting

- **Entry points:** In-app “Report” on listing, message, user profile, or booking; support form or email. Reporter selects type (safety, fraud, policy, other) and adds description. Optional: attach screenshots.
- **Creation:** Incident record created with reporter, reported entity (user/listing/booking), type, description, status (Open, In progress, Resolved). Linked to thread if support replies.
- **Triage:** Trust & Safety or support assigns priority and owner. Safety and fraud are high priority. SLA targets (e.g. first response in 24h, resolution by severity) per operations playbook.
- **Reporter communication:** Confirmation of report; status update when resolved; outcome summary where appropriate (without disclosing confidential detail).

### 10.4 Fraud monitoring

- **Signals:** Duplicate listing, impossible booking pattern, payment velocity, failed verification, chargeback history. Rules and/or AI score produce risk flag or score.
- **Actions:** High-risk booking can trigger payout hold; high-risk user can be restricted (e.g. cannot book or list until review). Admin sees risk score and signals; can override with reason.
- **No automatic termination:** Account termination requires human review per [Governance](LECIPM-GOVERNANCE-CONSTITUTION.md) and [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md). Fraud system recommends; human decides.

**Reference:** [LECIPM-AI-OPERATING-SYSTEM](LECIPM-AI-OPERATING-SYSTEM.md), [LECIPM-GOVERNANCE-CONSTITUTION](LECIPM-GOVERNANCE-CONSTITUTION.md), [LECIPM-LEGAL-SHIELD-FRAMEWORK](LECIPM-LEGAL-SHIELD-FRAMEWORK.md).

---

## 11. AI Control Center features

### 11.1 Fraud detection

- **Inputs:** Listing, booking, payment, user, and event data. **Output:** Fraud score or binary flag; reason codes (e.g. duplicate_listing, velocity).
- **Integration:** Score available to Trust & Safety dashboard and to booking/payout flow. High score can trigger hold or queue. Model version and date stored with score.
- **Feedback:** Outcomes (e.g. confirmed fraud, false positive) fed back for model improvement. No PII in training data beyond what policy allows.

### 11.2 Risk scoring

- **User risk:** Aggregate of reviews, cancellations, disputes, verification, fraud signals. Output: score (e.g. 0–100) and optional components. Used for ranking, instant-book eligibility, payout timing.
- **Listing risk:** Accuracy, policy compliance, incident history. Used for search ranking and suppression.
- **Display:** Score visible in admin; optional “risk tier” or badge in product (e.g. “High reliability host”). Explainability: reason codes for score where feasible.

### 11.3 Dynamic pricing

- **Inputs:** Listing, location, dates, demand signals, comparables. **Output:** Suggested nightly price or range. Display to host in dashboard; host chooses. No auto-pricing without explicit host consent in product.
- **Update:** Suggestions can refresh (e.g. daily or on demand). Host can dismiss or apply; apply updates listing price.

### 11.4 Demand forecasting

- **Inputs:** Historical bookings, search, listings by region and segment. **Output:** Forecast of demand or occupancy by period (e.g. next 30–90 days). Used internally for pricing suggestions and capacity planning; optional display to host or investor in analytics.

### 11.5 Support automation

- **Triage:** Incoming support ticket or message is classified (refund, technical, safety, etc.) and routed to correct queue. Optional: suggested category and FAQ link for agent.
- **Suggested response:** Optional: suggest reply or template based on ticket content. Agent sends or edits; no auto-send without agent action.
- **Human in the loop:** All resolutions and escalations are human-driven. AI assists speed and consistency; does not replace support for high-stakes outcomes.

**Reference:** [LECIPM-AI-OPERATING-SYSTEM](LECIPM-AI-OPERATING-SYSTEM.md), [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md).

---

## 12. Payment system

### 12.1 Booking payments

- **Guest charge:** At booking confirmation, charge total amount (nights + fees + taxes) to guest’s card. Use payment provider (e.g. Stripe); tokenize card; no raw card on platform. Authorization and capture in one step or two-step per provider.
- **Receipt:** Itemized receipt (listing, dates, nightly, cleaning, service fee, tax, total). Email and in-app. Receipt available in “My trips” or account.
- **Failure:** On decline, show clear error; allow retry or different card. No booking created until payment succeeds. Optional: save failed attempt for support.

### 12.2 Escrow system

- **Hold:** If product uses escrow, guest payment is held (not released to host) until release conditions: e.g. check-in passed, dispute window passed, no chargeback. Provider’s hold or split capability used.
- **Release:** Automatically per schedule (e.g. X days after checkout) or after dispute resolution. Host payout is created for released amount minus host commission and deductions.
- **Cancellation:** If guest cancels, refund per policy; no payout to host for cancelled nights. If host cancels, full refund to guest and optional penalty to host per policy.

### 12.3 Host payouts

- **Calculation:** Payout = booking value minus platform commission and any deductions (e.g. refund, penalty). Per-booking or batched per schedule.
- **Schedule:** Configurable (e.g. 24–48 hours after checkout, or weekly). First payout may be delayed for new hosts (e.g. after first stay completed). High-risk can be held per Trust & Safety.
- **Method:** Host adds bank account (or payout method); validated per provider. Payout in listing currency or host preference. Payout status: Pending, Paid, Failed. Failed triggers notification and retry or manual fix.
- **Statement:** Host sees payout history and upcoming in dashboard; optional export.

### 12.4 Refund processing

- **Trigger:** Guest cancellation (per policy), host cancellation, or dispute resolution (full/partial refund). Refund is initiated by Payment service via provider.
- **Amount:** Full or partial; reason code stored. Guest sees refund on statement per provider timing. Host payout is reduced or reversed for refunded amount.
- **Idempotency:** Same refund request (idempotency key) does not double-refund. Support or dispute can trigger refund with audit trail.

**Reference:** [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md), [LECIPM-MONETIZATION-ARCHITECTURE](LECIPM-MONETIZATION-ARCHITECTURE.md), [LECIPM-LEGAL-SHIELD-FRAMEWORK](LECIPM-LEGAL-SHIELD-FRAMEWORK.md).

---

## 13. Messaging and notifications

### 13.1 Guest–host messaging

- **Thread:** One thread per booking. Only guest and host (and support if added) can participate. Created when booking is confirmed or when first message is sent.
- **Content:** Text messages; optional file attachment (images) per policy. No executable files. Moderation applies; prohibited content is blocked or flagged.
- **Delivery:** Messages stored and delivered in-app; optional email digest or real-time email. Read status optional. Push notification for new message if user has app and permissions.
- **Retention:** Messages retained per data retention policy; available for dispute and Trust & Safety. User can view history in thread.

### 13.2 Broker communication

- **Threads:** Broker–client or broker–guest threads; can be linked to listing or lead. Same Messaging service; same features (text, attach, delivery). Broker sees thread list in CRM.
- **Notifications:** Broker notified of new message (in-app, email). Client/guest notified when broker replies.

### 13.3 System notifications

- **Channels:** Email, in-app, push (iOS/Android). User preferences per channel and type (e.g. marketing off, booking alerts on).
- **Triggers:** Booking confirmed, booking cancelled, payout sent, message received, review received, incident update, policy change. Template per event and locale.
- **In-app:** Notification center (bell or menu) with list of recent notifications; mark as read; link to relevant page (booking, thread, etc.).
- **Push:** Title and body; deep link to app screen. Opt-in per device; respect Do Not Disturb. No sensitive data in push body.

**Reference:** [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md).

---

## 14. Admin dashboard

### 14.1 Moderation dashboard

- **Queues:** Listings pending review, reported listings, reported messages, reported reviews. Filter by status, date, type. Sort by priority or date.
- **Detail:** Click item → see full content, reporter, reported user, context (booking, listing). Actions: Approve, Request changes, Remove, Escalate. Reason code required for remove or escalate. Audit log stores action and actor.
- **Bulk:** Optional bulk approve or reject for clear cases. No bulk terminate user without individual review.

### 14.2 Incident management

- **List:** All incidents; filter by type, status, priority, assignee. SLA indicators (e.g. overdue).
- **Detail:** Full incident context (reporter, reported, description, evidence, messages). Assign, add note, change status. Link to user and listing admin views.
- **Resolution:** Select outcome (no action, warning, content removal, suspension, termination, referral). Notify reporter and affected user per policy. Close incident with summary.

### 14.3 Financial monitoring

- **Transactions:** List of payments and payouts; filter by date, user, status. Search by booking or user ID. Export for reconciliation.
- **Holds:** List of payouts on hold (fraud, dispute, new host). Review and release or escalate. Reason and audit trail.
- **Chargebacks:** List of chargebacks; status and representment. Alert on spike by user or globally.

### 14.4 Platform analytics

- **Metrics:** Active users, active listings, bookings per period, GMV, revenue (fees), incident count, support ticket volume. Dashboard with charts; period selector. Segment by region if multi-region.
- **Access:** Read-only for most roles; only designated roles can access financial and PII. Export for leadership or finance per access control.

**Reference:** [LECIPM-GOVERNANCE-CONSTITUTION](LECIPM-GOVERNANCE-CONSTITUTION.md), [LECIPM-MONTREAL-LAUNCH-PLAYBOOK](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md).

---

## 15. Mobile app features

### 15.1 Scope

- **Web:** Responsive web app supports all user types (guest, host, broker, owner, investor). Feature parity with core flows: search, book, list, manage bookings, dashboard, messages, account.
- **iOS and Android:** Native apps with same core flows. Prioritize: search and discovery, booking, my trips, host dashboard (listings, calendar, bookings, payouts), messaging, notifications, account and settings.
- **API:** All clients use same backend APIs (via API Gateway). No business logic in client; only presentation and client-side validation. Versioning for backward compatibility.

### 15.2 Search and booking

- **Search:** Location and date picker; filters (price, type, guests); results list and map. Listing detail with photo gallery, description, reviews, book CTA. Checkout: dates, guests, payment, confirm. Same flow as web with native UX.
- **Performance:** Search and listing load within target latency (e.g. p95 < 2s). Images optimized (e.g. CDN, responsive sizes). Offline: optional cache of “My trips” and messages for viewing; no offline book.

### 15.3 Host management tools

- **Dashboard:** My listings, calendar (view and edit), bookings (upcoming and past), payouts, messages. Quick actions: message guest, update price, block dates.
- **Notifications:** Push for new booking, new message, payout sent, review received. Deep link to relevant screen.

### 15.4 Notifications

- **Push:** Booking and message notifications; optional marketing if user opted in. Payload: title, body, deep link, optional image. Handle tap to open correct screen.
- **In-app:** Notification center with list; mark read; clear. Same events as web.

### 15.5 Secure messaging

- **Thread list and thread view:** Same as web; messages load and send via API. Optional: local cache for offline read. Attach image from device; upload via API. No plaintext secrets in app storage; use secure storage for tokens.

**Reference:** [LECIPM-MASTER-PRODUCT-ROADMAP](LECIPM-MASTER-PRODUCT-ROADMAP.md), [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md).

---

## 16. Security requirements

### 16.1 Authentication

- **Credentials:** Email + password; password policy (min length, complexity). Optional: social login (Google, Apple). No storage of plaintext passwords; only hashed.
- **Sessions:** Token (JWT or opaque) after login; expiry and refresh. Revocation on logout or password change. Optional: 2FA (TOTP or SMS); required for admin or high-risk actions if configured.
- **Rate limiting:** Login and signup rate limited to prevent brute force and abuse. Account lockout after N failures (configurable).

### 16.2 Authorization

- **Role-based:** Endpoints check user role (guest, host, broker, investor, admin). User can access only resources they own or are permitted (e.g. host sees own listings; admin sees all with audit).
- **Resource-level:** e.g. Host can edit only own listing; guest can cancel only own booking. Enforced in API and service layer.
- **Admin:** Admin role restricted to designated accounts; all admin actions logged with user ID and timestamp.

### 16.3 Data protection

- **Encryption:** TLS for all client–server and service–service traffic. Encryption at rest for database and object storage (e.g. AES-256). Keys managed via secure vault or cloud KMS.
- **PII:** Minimize collection; restrict access to PII to roles that need it. No PII in logs or analytics in identifiable form. Retention per privacy policy and law.
- **Payments:** No raw card data on platform; use payment provider tokenization. PCI scope limited to provider integration; no card storage.

### 16.4 Secure payments

- **Provider:** Use PCI-compliant provider (e.g. Stripe). All card data goes to provider (elements or redirect); platform receives only token or provider ID.
- **Payout details:** Bank account or payout details encrypted at rest; access only for payout processing. No display of full account number in UI after save.

**Reference:** [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md), [LECIPM-LEGAL-SHIELD-FRAMEWORK](LECIPM-LEGAL-SHIELD-FRAMEWORK.md).

---

## 17. Performance requirements

### 17.1 Scalability

- **Horizontal:** Application and API scale horizontally (add instances behind load balancer). Stateless services; session in token or external store. Database: read replicas for read-heavy paths (search, listing detail); primary for writes.
- **Search:** Search index scales independently (e.g. Elasticsearch cluster). Index updates asynchronous from transactional DB or events. No search load on primary DB.
- **Target:** Support 10x pilot load without architectural change. Design for multi-region (data and deploy) in roadmap.

### 17.2 Response time

- **API:** p95 latency for critical paths: search < 2s, listing detail < 500ms, booking create < 3s (including payment). Non-critical paths < 5s p95. Define per endpoint in API spec.
- **Web/mobile:** First contentful paint and time to interactive within targets (e.g. < 3s on 4G). Images and assets optimized (lazy load, CDN, formats).

### 17.3 Availability

- **Target:** 99.5% uptime for core flows (search, book, pay, login) in any 30-day period. Exclude planned maintenance with notice. Define core flows explicitly.
- **Degradation:** Graceful degradation (e.g. search falls back to simplified or cached result if index slow). Payment and booking must not silently fail; retry and clear error messaging.
- **Monitoring:** Uptime checks, error rate, latency per endpoint. Alerts for breach of SLO; on-call and runbook for critical failures.

**Reference:** [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md), [LECIPM-MONTREAL-LAUNCH-PLAYBOOK](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md).

---

## 18. Metrics and KPIs

### 18.1 Product success metrics

| Metric | Definition | Use |
|--------|------------|-----|
| **Active users** | Unique users with at least one session (or one booking) in period. Segment: guests, hosts, brokers. | Growth and engagement. |
| **Active listings** | Listings in Live state, at least one view or booking in period (optional). By marketplace vs BNHub, by region. | Supply health. |
| **Booking volume** | Number of confirmed bookings per period (e.g. week, month). By region, by listing. | Demand and traction. |
| **User retention** | % of guests with 2+ bookings in 90 days; % of hosts with listing still active after 90 days. | Stickiness and quality. |
| **Platform reliability** | Uptime % and error rate for core APIs; search and booking success rate. | Operational health. |

### 18.2 Additional metrics

- **Conversion:** Search → listing view → booking (funnel); conversion rate by step. **Support:** Ticket volume, first response time, resolution time. **Trust & Safety:** Incident count, resolution time, fraud rate (e.g. chargebacks per booking).
- **Business:** GMV, revenue (fees), payout volume. By region and by product (BNHub vs marketplace).
- **Instrumentation:** Events for key actions (search, view_listing, start_checkout, complete_booking, etc.) for analytics and product decisions. No PII in event payloads beyond IDs; join in secure warehouse only.

**Reference:** [LECIPM-MONTREAL-LAUNCH-PLAYBOOK](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md), [LECIPM-GLOBAL-EXPANSION-BLUEPRINT](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md), [LECIPM-GOVERNANCE-CONSTITUTION](LECIPM-GOVERNANCE-CONSTITUTION.md).

---

## 19. Future features

### 19.1 Travel services

- **Scope:** Flights, car rental, experiences, travel insurance via partnerships. Referral or co-booking flow from BNHub (e.g. “Add flight” at checkout or post-booking). Revenue: referral fee or rev share.
- **Requirements:** Partner APIs or deep links; attribution and tracking; disclosure (e.g. “Paid partnership”). No booking execution on platform for third-party travel; redirect or embed per partner terms.
- **Priority:** After BNHub and marketplace are stable; documented in [Monetization](LECIPM-MONETIZATION-ARCHITECTURE.md) and [Expansion](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md).

### 19.2 Advanced analytics

- **Scope:** Deeper market reports, predictive yield, portfolio optimization, custom reports, API for institutional clients. Paid tiers per [Monetization](LECIPM-MONETIZATION-ARCHITECTURE.md).
- **Requirements:** More data pipelines, model training, and access control for sensitive aggregates. Compliance with data use and privacy.

### 19.3 AI automation improvements

- **Scope:** Richer fraud and risk models; auto-pricing with explicit host consent; automated moderation for clear violations; more support deflection (e.g. chatbot for FAQ). Human-in-the-loop retained for high-stakes decisions per [AI-OS](LECIPM-AI-OPERATING-SYSTEM.md).
- **Requirements:** More training data, model versioning, A/B testing framework, and explainability for fairness and audit.

### 19.4 Other expansion features

- **Channel manager:** Sync availability and price with external distribution channels (other OTAs). API and two-way sync; conflict resolution (e.g. double-book prevention).
- **Cleaning and maintenance marketplace:** Book cleaning or maintenance from platform; track jobs and pay providers. Commission per [Monetization](LECIPM-MONETIZATION-ARCHITECTURE.md).
- **Multi-currency and multi-region:** Full support for more currencies and regions; local payment methods; regional compliance modules. Per [Global Expansion](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md) and [Localization](LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT.md).

**Reference:** [LECIPM-MASTER-PRODUCT-ROADMAP](LECIPM-MASTER-PRODUCT-ROADMAP.md), [LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT](LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT.md).

---

## Document references

| Topic | Document |
|-------|----------|
| Vision, ecosystem, architecture | [LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT](LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT.md), [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md) |
| Roadmap and phases | [LECIPM-MASTER-PRODUCT-ROADMAP](LECIPM-MASTER-PRODUCT-ROADMAP.md), [LECIPM-MONTREAL-LAUNCH-PLAYBOOK](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md) |
| Trust, safety, legal, governance | [LECIPM-AI-OPERATING-SYSTEM](LECIPM-AI-OPERATING-SYSTEM.md), [LECIPM-GOVERNANCE-CONSTITUTION](LECIPM-GOVERNANCE-CONSTITUTION.md), [LECIPM-LEGAL-SHIELD-FRAMEWORK](LECIPM-LEGAL-SHIELD-FRAMEWORK.md) |
| Business model, expansion | [LECIPM-MONETIZATION-ARCHITECTURE](LECIPM-MONETIZATION-ARCHITECTURE.md), [LECIPM-GLOBAL-EXPANSION-BLUEPRINT](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md), [BNHUB-BUSINESS-MODEL](BNHUB-BUSINESS-MODEL.md) |
| Roles, mission | [PLATFORM_ROLES](PLATFORM_ROLES.md), [PLATFORM-MISSION](PLATFORM-MISSION.md), [PROJECT-OVERVIEW](PROJECT-OVERVIEW.md) |

---

*This document is the Product Requirements Document for the LECIPM platform. Engineering should implement to these requirements; changes to scope or behavior require product approval and PRD update.*
