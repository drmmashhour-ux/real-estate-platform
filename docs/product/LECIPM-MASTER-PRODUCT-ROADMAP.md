# LECIPM Platform — Master Product Roadmap (Year 1)

**12-month product development roadmap for the LECIPM ecosystem**

This document defines the phased product roadmap for the first 12 months of platform development. It prioritizes a core marketplace foundation, trust and safety, BNHub launch features, broker and owner tools, AI capabilities, and platform optimization, aligned with the [Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md), [Global Expansion Blueprint](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md), and [AI Operating System](LECIPM-AI-OPERATING-SYSTEM.md). It is intended for product management, engineering, and leadership.

---

## 1. Product development philosophy

Development is guided by principles that deliver a working, safe platform in a realistic sequence.

| Principle | Application |
|-----------|-------------|
| **Build core marketplace first** | The first priority is a functional two-sided marketplace: users can list properties, search, book, pay, and complete a stay. Real estate sale/rent and Deal marketplace build on this foundation once the core loop works. |
| **Launch minimal viable platform** | The initial launch is a **minimal viable platform (MVP)**: enough to run a pilot (e.g. Montreal) with real listings and bookings, not every feature. Advanced tools (full CRM, advanced analytics, full AI-OS) are added after the core is stable. |
| **Ensure trust and safety early** | Identity verification, fraud basics, incident reporting, and moderation are built in parallel with or immediately after core flows. The platform does not scale without safety infrastructure ([Governance](LECIPM-GOVERNANCE-CONSTITUTION.md), [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md)). |
| **Test in a pilot city** | The first live environment is a single city (Montreal). Product is validated there before feature creep or multi-city rollout. [Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md) defines readiness and success criteria. |
| **Expand features gradually** | Features are added in phases. Each phase has a clear goal and outcome; the next phase starts when the previous one is sufficiently complete. Overlaps are planned (e.g. Trust & Safety starts while core stabilizes) but dependencies are respected. |

### Importance of iterative development

- **Risk reduction:** Delivering in phases allows early feedback and course correction. A big-bang release increases the chance of critical failures at launch.
- **Learning:** Real usage in Montreal informs priorities (e.g. which host tools matter most, where fraud appears). The roadmap is updated based on data, not only on pre-launch assumptions.
- **Resource efficiency:** Team focus stays narrow (core → safety → BNHub tools → professional tools → AI → optimization). Parallel work is limited to what the team can execute without quality loss.
- **Stakeholder alignment:** Milestones (prototype, alpha, beta, public launch) give clear checkpoints for investors, partners, and operations. Progress is measurable.

---

## 2. Phase 1 – Core platform foundation (Months 1–3)

**Goal:** Create a functional marketplace foundation that supports listing, search, booking, payment, messaging, and reviews.

### Core components

| Component | Scope | Outcome |
|-----------|--------|----------|
| **User account system** | Registration (email/password, optional social); profile (name, contact, role: guest/host/broker); account settings. | Users can create accounts and manage basic profile. |
| **Authentication and identity verification** | Login/logout; password reset; session management; optional 2FA. Identity verification (document + liveness) for hosts before listing go-live. | Secure access; hosts verified before they can list. |
| **Basic listing system** | Create/edit listing: property type, location, photos, description, capacity, amenities, house rules, base price. Listing states: draft, pending review, live, suspended. | Hosts can create and publish listings that meet minimum quality bar. |
| **Property search engine** | Search by location (city, map, or text), dates, guests, filters (price, type, amenities). Sort (relevance, price, rating). Results page and listing detail page. | Guests can find relevant listings and view details. |
| **Basic booking engine** | Check availability; select dates; see total price (nights, fees, taxes if applicable); reserve or book; confirmation and receipt. Cancellation flow per policy. | End-to-end booking from search to confirmation. |
| **Payment integration** | Guest: charge at booking (card); fee breakdown and receipt. Host: payout after stay (schedule, amount, fees). CAD; integration with one primary payment provider. Escrow/hold logic if required by product. | Payments and payouts work in production for Montreal. |
| **Messaging system** | Thread per booking (guest–host). Send/receive messages; basic notifications (email or in-app). No off-platform contact requirement for booking. | Guest and host can communicate about the stay. |
| **Review system** | After stay, guest and host can submit a review (rating + optional text). Reviews displayed on listing and profile. Moderation: basic rules (no profanity, no PII); queue for manual review if needed. | Reviews support trust and listing quality. |

### Deliverables

- Web application (responsive) supporting guest and host flows. Admin or internal tools for listing review and basic user management.
- Database and API design that support multi-tenant, multi-region later (e.g. Montreal-first config).
- Documentation for deployment, environment config, and critical flows.

### Success criteria

- A user can sign up as host, complete verification, create a listing, and have it go live after review.
- A user can sign up as guest, search Montreal listings, make a booking, pay, and receive confirmation.
- Host receives payout (net of fees) after stay completion. Messaging and reviews function end-to-end.
- No critical bugs in core flows; performance acceptable for pilot volume.

---

## 3. Phase 2 – Trust, safety, and platform stability (Months 3–6)

**Goal:** Ensure platform safety and operational stability so that the pilot can run without unacceptable risk. This phase runs in parallel with the tail of Phase 1 and the start of Phase 3.

### Core components

| Component | Scope | Outcome |
|-----------|--------|----------|
| **Trust & Safety system** | Central place for safety operations: queue of reported incidents and flagged content; user and listing context; ability to warn, restrict, suspend, or terminate. Aligns with [Governance](LECIPM-GOVERNANCE-CONSTITUTION.md) and [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md). | Trust & Safety can investigate and act on reports and flags. |
| **Fraud detection basics** | Rules and signals: duplicate listing detection, impossible or suspicious booking patterns, payment velocity, basic identity checks. Flag high-risk users or listings for review; optional payout hold for new or high-risk hosts. | Obvious fraud is caught and reviewed before harm. |
| **Incident reporting system** | In-app and/or support channel for users to report safety, policy, or payment issues. Triage by type and severity; route to Trust & Safety or support. Confirmation and status for reporter. | Users can report and get a response; incidents are tracked. |
| **Dispute resolution tools** | Structured dispute flow: submit dispute (booking, payment, conduct); attach evidence; assign to resolver; outcome (refund, no action, warning, etc.) and communication to both parties. Log for audit. | Disputes are handled consistently and documented. |
| **Platform moderation tools** | Moderation queue for listings, messages, and reviews. Actions: approve, request changes, remove, escalate. Reason codes and audit trail. Optional keyword or simple automated flags to prioritize. | Content that violates policy is found and acted on. |
| **Basic AI risk scoring** | Simple risk score for users or bookings (e.g. from rules: new account, first booking, high value). Score visible in admin; used to prioritize review or trigger hold. Not yet full [AI-OS](LECIPM-AI-OPERATING-SYSTEM.md); foundation for later engines. | High-risk activity is surfaced for human review. |

### Deliverables

- Trust & Safety dashboard and procedures. Training or playbook for moderators and responders.
- Incident and dispute workflows in product and support. Escalation paths documented.
- Fraud and risk rules in code or config; tuning based on pilot data.
- Stability work: error handling, logging, and basic monitoring so that outages are detected and debuggable.

### Success criteria

- Every report or flag is triaged and resolved (or explicitly deferred) within SLA. No critical safety incident left unhandled.
- Fraud and risk rules reduce obvious abuse; false positive rate acceptable (tuned over time).
- Platform uptime and error rates meet pilot targets (e.g. 99%+ uptime for core flows).

---

## 4. Phase 3 – BNHub launch features (Months 4–7)

**Goal:** Prepare BNHub for real-world usage in Montreal with host and booking management tools. Overlaps with Phase 2 (safety) and precedes Phase 4 (broker/owner tools).

### Core components

| Component | Scope | Outcome |
|-----------|--------|----------|
| **BNHub host dashboard** | Host view: my listings, bookings, messages, payouts, and account. Quick actions: accept/decline request (if applicable), message guest, update listing. Mobile-friendly or responsive. | Hosts can manage their BNHub activity in one place. |
| **Calendar availability system** | Per-listing calendar: set available dates, block dates, set min/max stay by date range if needed. Sync with bookings (instant book or request). Avoid double-booking. | Availability is accurate and controllable by host. |
| **Pricing tools** | Base price per night; optional cleaning fee; optional extra fees. Weekend or seasonal overrides if in scope. Clear display to guest at checkout. Optional: simple “suggested price” (manual or rule-based) for host. | Hosts can set and adjust pricing; guests see full price. |
| **Host payout tracking** | Payout history: by booking, date, amount, fees, status (pending, paid, failed). Next payout date and amount. Payout method management (bank account). | Hosts understand earnings and payout status. |
| **Booking management** | Host: see upcoming and past bookings; guest info; check-in/out; cancel with policy. Guest: see my trips; modify or cancel; contact host. Status flow: reserved → confirmed → completed (or cancelled). | Both sides can manage the full booking lifecycle. |
| **Listing quality review system** | Before go-live: completeness check (photos, description, pricing, rules); optional manual review queue. Post-launch: re-review on report or flag. Feedback to host (e.g. “Add more photos”) so they can improve. | Listings meet [quality standards](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#7-listing-quality-standards) before and after launch. |

### Deliverables

- Host dashboard (web) with calendar, pricing, payouts, and booking management. Guest “my trips” and booking detail.
- Listing review workflow integrated with Phase 1 listing system. Quality criteria and rejection reasons documented.
- Quebec/Montreal specifics: registration field if required; CAD and French/English; tax display or collection if applicable.

### Success criteria

- Hosts can run their BNHub side (availability, price, payouts, messages) without leaving the platform.
- Bookings stay in sync with availability; no double-bookings in normal use.
- Montreal launch [readiness](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#3-platform-readiness-checklist) for BNHub is achievable with this feature set.

---

## 5. Phase 4 – Broker and owner tools (Months 6–9)

**Goal:** Support real estate professionals and property owners with dedicated tools. Builds on core marketplace and BNHub; prepares for Deal marketplace and investment use cases.

### Core components

| Component | Scope | Outcome |
|-----------|--------|----------|
| **Broker CRM dashboard** | Broker view: my profile (verified license), my listings (sale, long-term, or BNHub), leads/inquiries, and tasks. Add listing (or refer host); see lead source and status. Basic pipeline or list view. Optional: simple contact/lead form. | Brokers can manage listings and leads in one place. |
| **Owner property dashboard** | Owner view (may overlap with host): my properties; each property’s listings (BNHub and/or long-term/sale if in scope); performance summary (bookings, revenue). Link to BNHub host dashboard per property. | Owners see portfolio and performance at a glance. |
| **Deal marketplace features** | Dedicated area for deals (e.g. investment opportunities, off-market). Create deal listing (description, price/terms, contact); browse and filter deals; express interest or contact. Basic only: no full auction or complex structures. | Investors and brokers can list and discover deals. |
| **Basic investment analytics** | For owners/investors: simple metrics per property or portfolio (e.g. occupancy rate, revenue over period, average rate). Export or dashboard view. No advanced forecasting yet. | Users see basic performance to inform decisions. |

### Deliverables

- Broker CRM: onboarding (license verification), dashboard, listing and lead management. Aligns with [Broker onboarding](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#5-broker-onboarding-program).
- Owner dashboard: property list, link to BNHub tools, basic performance metrics.
- Deal marketplace: listing type and discovery; interest/contact flow. Governance and moderation apply.
- Basic analytics: queries or pre-built views for revenue and occupancy; access control by role.

### Success criteria

- Brokers can join, get verified, and manage listings and leads. Owner dashboard is usable for multi-property hosts.
- Deal marketplace supports listing and discovery; no critical gaps for pilot use. Analytics give actionable basics.

---

## 6. Phase 5 – AI Control Center (Months 7–10)

**Goal:** Introduce the first AI/ML capabilities to improve automation, safety, and host tools. Implements a subset of [AI-OS](LECIPM-AI-OPERATING-SYSTEM.md); full AI-OS evolves beyond year one.

### Core components

| Component | Scope | Outcome |
|-----------|--------|----------|
| **Fraud detection engine** | Model(s) or rules that consume booking, user, and payment signals; output fraud score or flag. High score → review queue or payout hold. Reason codes for reviewers. Tune on pilot data. | Fraud detection is more accurate than rules-only; fewer false positives where possible. |
| **Dynamic pricing suggestions** | Per listing, suggest nightly price (or range) from comparables, seasonality, and demand signals. Display to host; host chooses. No auto-pricing in year one unless explicitly scoped. | Hosts get data-driven pricing guidance. |
| **Demand forecasting** | Internal forecast of demand by area and time window (e.g. next 30–90 days). Used for pricing suggestions and capacity planning. Simple model (e.g. historical + trend). | Product and ops have demand visibility; hosts benefit via pricing. |
| **Risk scoring** | User and listing risk scores (trust, safety, fraud) from multiple signals. Used for ranking, eligibility (e.g. instant book), and review prioritization. Replaces or augments Phase 2 basic scoring. | Consistent risk view across users and listings; [AI-OS](LECIPM-AI-OPERATING-SYSTEM.md) risk engine foundation. |
| **AI support triage** | Classify incoming support tickets (refund, technical, safety, etc.); suggest category and priority; route to correct queue. Optional: suggest reply or FAQ link. Human in the loop for resolution. | Support is faster and more consistent; [AI-OS](LECIPM-AI-OPERATING-SYSTEM.md) support automation foundation. |

### Deliverables

- Fraud model(s) and integration with Trust & Safety and payouts. Monitoring of precision/recall and business impact.
- Pricing suggestion API or in-dashboard widget; demand forecast available to internal dashboards or pricing logic.
- Risk scoring pipeline and integration with booking flow and admin. Explainability (reason codes) for reviewers.
- Support triage (classification and routing); integration with ticketing system. No full auto-resolution in year one.

### Success criteria

- Fraud and risk scoring improve over Phase 2 baselines; reviewer trust in scores is high. Support triage reduces time-to-category and improves routing.

---

## 7. Phase 6 – Platform optimization (Months 9–12)

**Goal:** Improve performance, discoverability, and operations so the platform is ready for expansion beyond Montreal.

### Core components

| Component | Scope | Outcome |
|-----------|--------|----------|
| **Search optimization** | Relevance tuning (e.g. ranking signals: quality, availability, price, reviews). Filters and facets refined from pilot feedback. Optional: search analytics (queries, no-result, click-through). | Search quality and conversion improve. |
| **Performance improvements** | Page load time, API latency, and error rate targets. Optimize queries, caching, and assets. Load testing at 2–3x pilot traffic. | Platform meets performance targets for next city launch. |
| **Analytics dashboards** | Internal dashboards: listings, bookings, revenue, users (guests, hosts, brokers), incidents, support volume. Segment by region (e.g. Montreal). Export or scheduled report if needed. | Leadership and ops have clear visibility into product and business metrics. |
| **Platform monitoring tools** | Uptime, error rate, latency by service or flow. Alerts for degradation or outage. On-call or runbook for common failures. | Incidents are detected and resolved quickly. |
| **Admin governance dashboard** | Single place for governance: moderation queue, incident queue, user/listings at risk, payout holds, key metrics. Role-based access. Supports [Governance](LECIPM-GOVERNANCE-CONSTITUTION.md) and [Montreal launch](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md) operations. | Admins and Trust & Safety can run day-to-day governance from one dashboard. |

### Deliverables

- Search and performance work prioritized from pilot data and expansion plan. Targets documented and met.
- Analytics and monitoring in place; reviewed regularly. Admin dashboard deployed and used by ops and Trust & Safety.
- Documentation and runbooks for expansion: what to configure per city (region, currency, language, compliance).

### Success criteria

- Search and performance meet expansion readiness bar. Analytics and monitoring support Montreal review and next-city planning. Admin dashboard is the primary tool for moderation and risk review.

---

## 8. Mobile application development

Mobile strategy is phased so that web is solid first, then native apps extend reach.

| Phase | Timeline | Scope | Outcome |
|-------|----------|--------|----------|
| **Phase 1: Responsive web** | Months 1–3 (with core foundation) | All core flows (search, book, host dashboard, messaging, reviews) work on mobile browsers. Responsive layout, touch-friendly, performance acceptable. | Pilot can run on mobile web; no native app required for launch. |
| **Phase 2: iOS app** | Months 5–8 | Native iOS app: signup, search, book, my trips, host dashboard, messages, notifications. App Store listing and review. | iOS users can use a dedicated app; better retention and push. |
| **Phase 3: Android app** | Months 7–10 | Native Android app: feature parity with iOS. Play Store listing and review. | Android users have parity; addressability for majority of mobile users. |

**Dependencies:** Core API and flows must be stable before native app build. Shared component or API layer reduces duplicate logic. Push notifications and deep linking are part of app scope. Testing (device matrix, OS versions) is planned in [§9 Testing](#9-testing-and-quality-assurance).

---

## 9. Testing and quality assurance

Testing is layered so that quality is built in and regressions are caught before release.

| Type | Scope | When |
|------|--------|------|
| **Unit testing** | Critical business logic (pricing, availability, fee calculation, booking state). High coverage for payments and booking engine. | Per sprint; gate for merge or release. |
| **Integration testing** | API and database: create listing, create booking, payment flow, payout flow. Key user journeys automated. | Per build or nightly; required before staging deploy. |
| **Security testing** | Auth, authorization, and sensitive data access. Dependency scanning. Optional: periodic penetration test or audit. | Before major milestones (alpha, beta, launch); recurring for critical changes. |
| **User testing** | Usability with real or recruited users: signup, search, book, host flow. Qualitative feedback; fix before launch. | Before beta and before public launch. |
| **Beta launch testing** | Limited public or invited beta in Montreal: real listings and bookings; monitor errors, support volume, and satisfaction. | After alpha; feeds into go/no-go for public launch ([Montreal Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md)). |

**Ownership:** Engineering owns unit and integration tests; QA or product coordinates user and beta testing. Security review may involve external party. Results feed into [launch readiness](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#3-platform-readiness-checklist).

---

## 10. Montreal pilot launch preparation

Product readiness for Montreal is defined so that launch is gated on measurable criteria. Full checklist is in [Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#3-platform-readiness-checklist); below is the product-focused subset.

| Criterion | Product contribution |
|-----------|----------------------|
| **Minimum listing supply** | Listing creation and review flow support onboarding 150–300+ listings. Performance and search work at that scale. |
| **Working booking system** | Search → book → pay → confirm → stay → review → payout is end-to-end stable. Cancellation and refund work per policy. No critical bugs in core path. |
| **Payment verification** | Guest charge and host payout in CAD verified in production (or production-like). Refund and fee logic correct. Escrow/hold logic if used is tested. |
| **Trust and safety readiness** | Identity verification, incident reporting, moderation queue, and dispute flow are live. Trust & Safety team can triage and act. Fraud/risk rules or models are active; high-risk handling is defined. |

**Timing:** These criteria are met by the end of Phase 3 and Phase 2 (safety), and no later than the planned Montreal public launch date. A formal go/no-go uses the full [playbook checklist](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#3-platform-readiness-checklist) and [expansion readiness](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#16-expansion-readiness-evaluation) criteria.

---

## 11. Key development milestones

Major milestones mark progress for stakeholders and align with [Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md) and [expansion](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md).

| Milestone | Timing | Definition |
|-----------|--------|------------|
| **Prototype completion** | Month 2 | Core flows (signup, listing, search, book, pay) work end-to-end in a single environment. No production data; used for demos and early feedback. |
| **Alpha release** | Month 4 | Feature-complete for Montreal pilot (Phases 1–2 and BNHub essentials from Phase 3). Internal or closed testers only. Critical bugs fixed; performance and security reviewed. |
| **Beta release** | Month 6–7 | Montreal beta: invited hosts and guests; real listings and bookings. Trust & Safety and support operational. Feedback and metrics drive fixes. Target: [readiness](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#3-platform-readiness-checklist) sign-off. |
| **Public launch** | Month 7–8 | Montreal public launch: platform open to all users in region. Marketing and support at launch capacity. [Launch day](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#12-launch-day-operations) and [90-day](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#13-first-90-day-monitoring-plan) plans active. |
| **Expansion readiness** | Month 11–12 | Montreal meets [expansion readiness](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#16-expansion-readiness-evaluation) criteria. Playbook updated; next city (e.g. Quebec City or Toronto) selected and planned. |

**Note:** Exact months depend on team size and scope; milestones are targets to be updated as the roadmap is refined.

---

## 12. Product metrics

Success is measured by product and business metrics that inform prioritization and expansion.

| Metric | Definition | Use |
|--------|------------|-----|
| **Active users** | Guests and hosts with at least one session (or one booking) in the period. | Growth and engagement; segment by role and region. |
| **Active listings** | Listings that are live and bookable. | Supply health; track by city and growth rate. |
| **Booking volume** | Number of completed (or confirmed) bookings per week/month. | Demand and traction; primary business metric for BNHub. |
| **User retention** | % of guests with 2+ bookings; % of hosts with listing still active after 90 days. | Product stickiness and quality. |
| **Platform reliability** | Uptime % and error rate for core flows (search, book, pay). | Operational health; gate for expansion. |

**Additional:** Conversion (search → book), time to first booking for new listings, support ticket volume, incident rate, NPS/CSAT. Dashboards and review cadence (e.g. weekly product, monthly leadership) are defined in [Montreal Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md#13-first-90-day-monitoring-plan) and operations.

---

## 13. Development team structure

Roles and responsibilities support the roadmap and [Governance](LECIPM-GOVERNANCE-CONSTITUTION.md).

| Role | Responsibility |
|------|-----------------|
| **Product management** | Roadmap and prioritization; requirements and acceptance criteria; stakeholder alignment; metrics and feedback. Ensures phases and milestones are clear and achievable. |
| **Engineering** | Design, implementation, and operation of platform (web, API, mobile, infra). Ownership of performance, security, and technical debt. Works in sync with product on scope and timeline. |
| **Design** | UX and UI for user-facing and admin flows. Consistency, accessibility, and usability. Supports product and engineering from discovery to release. |
| **Trust & Safety operations** | Day-to-day moderation, incident response, and enforcement. Uses admin and moderation tools; escalates to product/engineering for tool gaps. May be part-time or shared early; scales with launch. |
| **Customer support** | User-facing support (email, in-app, chat). Triage, resolution, and escalation. Provides feedback to product on pain points and feature requests. |

**Scaling:** In year one, roles may be combined (e.g. one product lead, one design lead, small engineering team). Trust & Safety and support may start as designated individuals with playbooks; structure formalizes as Montreal scales and expansion approaches.

---

## 14. Product risk management

Risks are identified and mitigated so that development stays on track and the platform remains safe and scalable.

| Risk | Mitigation |
|------|------------|
| **Technical complexity** | Phased scope; strong API and data model from Phase 1 so that later phases integrate cleanly. Spike or proof-of-concept for uncertain areas (e.g. payment provider, verification provider). Regular tech review. |
| **Security vulnerabilities** | Secure development practices; dependency and auth review; periodic security testing. Sensitive data (payment, identity) handled per policy and compliance. Incidents responded to per security runbook. |
| **Platform abuse** | Trust & Safety and fraud work from Phase 2; AI/risk in Phase 5. Moderation and enforcement keep pace with growth. [Governance](LECIPM-GOVERNANCE-CONSTITUTION.md) and [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md) define response. |
| **Scalability challenges** | Architecture supports multi-region and higher load ([platform architecture](LECIPM-PLATFORM-ARCHITECTURE.md)). Load and performance testing before Montreal launch and before expansion. Scaling plan for infra and critical paths. |

**Review:** Risks are revisited at milestone reviews and when scope or context changes. Mitigations are assigned to roles (e.g. engineering for scalability, Trust & Safety for abuse).

---

## 15. Long-term product vision

Beyond the first 12 months, LECIPM evolves into a full global ecosystem. The roadmap sets the base; later years add depth and breadth.

| Pillar | Year 1 foundation | Beyond year 1 |
|--------|-------------------|----------------|
| **Real estate** | Core listing and search; broker CRM and owner dashboard; basic deal listing. | Full marketplace (sale, long-term rental); advanced CRM; deal marketplace with structured deals and investor matching. |
| **Short-term accommodation** | BNHub live in Montreal with host tools, calendar, pricing, payouts. | Multi-city and multi-country BNHub; calendar sync, channel manager, full pricing tools; optional hotel/serviced apartment inventory. |
| **Property investment** | Deal marketplace basics; basic investment analytics (occupancy, revenue). | Full investment analytics (yield, forecasts, heat maps); portfolio tools; integration with Deal marketplace and funding flows. |
| **Analytics** | Internal dashboards; basic host/owner metrics. | Market intelligence, valuation tools, and investor-grade reports; [Monetization](LECIPM-MONETIZATION-ARCHITECTURE.md) and [AI-OS](LECIPM-AI-OPERATING-SYSTEM.md) analytics products. |
| **Travel services** | Not in year 1 scope. | Flights, car rental, experiences, travel insurance via partnerships; [expansion](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md) and [monetization](LECIPM-MONETIZATION-ARCHITECTURE.md) define scope. |

**Principles:** The first year proves the core marketplace and BNHub in one city; Trust & Safety and governance are non-negotiable from the start. Later years add cities, modules, and AI-OS depth while maintaining safety, compliance, and scalability ([Governance](LECIPM-GOVERNANCE-CONSTITUTION.md), [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md), [AI-OS](LECIPM-AI-OPERATING-SYSTEM.md), [long-term vision](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#16-long-term-global-vision)).

---

*This document is the Master Product Roadmap for the first 12 months of the LECIPM platform. It aligns with [LECIPM-MONTREAL-LAUNCH-PLAYBOOK](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md), [LECIPM-GLOBAL-EXPANSION-BLUEPRINT](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md), [LECIPM-AI-OPERATING-SYSTEM](LECIPM-AI-OPERATING-SYSTEM.md), [LECIPM-GOVERNANCE-CONSTITUTION](LECIPM-GOVERNANCE-CONSTITUTION.md), [BNHUB-BUSINESS-MODEL](BNHUB-BUSINESS-MODEL.md), and [PROJECT-OVERVIEW](PROJECT-OVERVIEW.md).*
