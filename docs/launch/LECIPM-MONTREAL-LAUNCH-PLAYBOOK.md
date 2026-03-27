# LECIPM Platform — Montreal Launch Playbook

**Operational launch guide for the first LECIPM pilot city**

This document is the complete operational guide for preparing, testing, and launching the LECIPM platform in Montreal as the first pilot city. It applies to the real estate marketplace, Broker CRM, BNHub short-term rentals, Owner dashboard, Trust & Safety, and supporting systems. It is intended for founders, product teams, and operations managers. It implements the [pilot city strategy](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#3-pilot-city-strategy) and [Phase 1](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#15-phased-expansion-roadmap) of the Global Expansion Blueprint and aligns with [BNHub business model](BNHUB-BUSINESS-MODEL.md), [Governance Constitution](LECIPM-GOVERNANCE-CONSTITUTION.md), and [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md).

---

## 1. Launch objectives

The Montreal launch has defined objectives that must be met before expansion to other cities.

| Objective | Success criteria |
|-----------|-------------------|
| **Validate platform functionality** | End-to-end flows (signup, listing, search, book, pay, stay, review, payout) complete without critical defects at launch volume. All core modules (BNHub, Owner dashboard, support, payments) operational. |
| **Onboard initial users** | Minimum viable supply (e.g. 150–300+ BNHub listings in Greater Montreal) and initial guest and broker users. Real estate marketplace listings and broker accounts if that module is in scope. |
| **Test Trust & Safety systems** | Identity verification, fraud checks, content moderation, and incident reporting run in production. No material safety or fraud incident unhandled; response times within SLA. |
| **Verify payment infrastructure** | Guest payments and host payouts process correctly in CAD. Escrow/release logic, refunds, and fee calculation verified. No unresolved payment failures at scale. |
| **Measure user demand** | Booking volume and search behavior demonstrate demand. Conversion and repeat booking metrics tracked. Feedback collected for product and positioning. |

**Overall success:** Montreal is considered launch-successful when these objectives are met and [expansion readiness criteria](#16-expansion-readiness-evaluation) are satisfied, enabling a go decision for Phase 2 (Canada national expansion).

---

## 2. Local market overview

### Montreal market context

| Dimension | Context |
|-----------|---------|
| **Real estate market activity** | Montreal has an active resale and rental market with multiple boroughs and suburbs. Brokers and agents are well established; condos and single-family homes are common listing types. Suitable for testing marketplace and Broker CRM. |
| **Tourism demand** | Montreal attracts leisure and business visitors; festivals, conferences, and universities drive demand. Inbound and domestic travel support short-term rental demand. |
| **Short-term rental demand** | Short-term rentals are present; local regulation (e.g. Quebec tourist accommodation registration) applies. Demand exists for verified, compliant supply. |
| **Property ownership landscape** | Mix of individual owners, small-scale investors, and property managers. Brokers often have relationships with owners; opportunity for broker-led and direct host acquisition. |
| **Digital adoption** | High internet and smartphone penetration; consumers are accustomed to online booking and digital real estate tools. French and English are both used; bilingual support is required. |

### Why Montreal is suitable as a pilot city

- **Regulatory familiarity:** Quebec/Canadian framework is relatively well defined; short-term rental registration and tax rules can be implemented and tested. [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md) and [compliance strategy](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#7-regulatory-compliance-strategy) can be validated.
- **Manageable scale:** Large enough to generate meaningful supply and demand; small enough to operate with a focused team and to contain risk.
- **Bilingual validation:** Launch in French and English supports future expansion in Quebec and other Canadian markets.
- **Existing broker network:** Opportunity to partner with brokers for supply and credibility ([BNHub](BNHUB-BUSINESS-MODEL.md), [expansion](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#6-real-estate-marketplace-expansion)).
- **Strategic fit:** Aligns with Phase 1 (Québec/Canada) in [BNHub target markets](BNHUB-BUSINESS-MODEL.md#5-target-markets-global-rollout) and [expansion roadmap](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#15-phased-expansion-roadmap).

---

## 3. Platform readiness checklist

Before launch, the following must be complete and signed off. No launch until all items are satisfied or explicitly deferred with a documented plan.

### 3.1 Product stability

- [ ] All critical user flows (guest and host signup, listing create/edit, search, book, pay, cancel, review, payout) tested and stable in staging and pre-production.
- [ ] Montreal (or Canada) enabled in product config (region, currency, language).
- [ ] Mobile apps (iOS, Android) and web build approved for Montreal launch; no known critical bugs.
- [ ] Performance and load tests completed for expected launch traffic; thresholds defined and monitored.

### 3.2 Payment system readiness

- [ ] Payment provider(s) configured for CAD; cards and accepted methods live for Montreal.
- [ ] Guest charge flow (authorization, capture, fee calculation) verified; receipts and breakdown correct.
- [ ] Host payout flow (schedule, amount, fees, currency) verified; test payouts successful.
- [ ] Refund flow tested (full/partial, policy-based); refunds appear correctly for guest and host.
- [ ] Escrow/hold and release logic (if applicable) tested and documented.

### 3.3 Identity verification system

- [ ] Identity verification (e.g. document + liveness) integrated and tested for hosts and, if required, guests.
- [ ] Verification status correctly displayed in product and in admin tools.
- [ ] Failure and retry paths handled; support knows how to assist users who fail verification.

### 3.4 Trust & Safety systems

- [ ] Fraud and risk scoring (or equivalent) operational per [AI-OS](LECIPM-AI-OPERATING-SYSTEM.md); high-risk flows (e.g. payout hold) tested.
- [ ] Content moderation (listings, messages, reviews) operational; queue and escalation paths defined.
- [ ] Incident reporting (in-app and/or support) live; triage and response procedures documented.
- [ ] Trust & Safety team (or designated responders) trained and available for launch window.

### 3.5 Customer support readiness

- [ ] Support channel(s) (e.g. email, in-app, chat) live and staffed for Montreal launch hours.
- [ ] Ticketing or case system configured; SLAs and escalation rules set.
- [ ] Help content (FAQs, policies) available in French and English for Montreal-relevant topics.
- [ ] Support team trained on platform flows, Montreal-specific regulation, and escalation.

### 3.6 Legal and compliance review

- [ ] Quebec/Canada terms, privacy policy, and key policies (cancellation, fees) reviewed and published.
- [ ] Short-term rental compliance (e.g. registration prompt, tax if applicable) implemented and verified.
- [ ] Consumer disclosure and cancellation rights aligned with local law per [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md).

**Sign-off:** Product, operations, legal/compliance, and launch lead confirm readiness. Exceptions and deferred items are documented with owner and timeline.

---

## 4. Initial supply acquisition

Initial listings are acquired from multiple sources to reach minimum viable supply quickly while maintaining quality.

### 4.1 Supply sources

| Source | Role | Onboarding method |
|-------|------|--------------------|
| **Property owners** | Individual hosts with one or a few properties. | Direct signup via web/app; outreach (email, social, events). Onboarding flow + verification; optional 1:1 or group onboarding call. |
| **Property managers** | Managers with portfolios of short-term or mixed-use properties. | Partnership agreement; bulk onboarding (CSV or API if available). Manager commits to listing standards and compliance; platform verifies sample and monitors. |
| **Brokers** | Licensed brokers with investor or owner clients who want to list. | Broker onboarding program (§5); brokers refer owners or list on behalf. Verification and listing standards apply. |
| **Serviced apartments** | Operators with furnished, short-term units. | Partnership agreement; inventory connected via manual listing or integration. Compliance and pricing verified. |
| **Boutique hotels** | Small hotels or B&Bs open to distribution. | Partnership agreement; listing and availability managed by property. Same trust and policy standards as other supply. |

### 4.2 Onboarding methods

- **Self-serve:** Owner or manager creates account, completes verification, adds listing(s) following guidelines. Support and help content available. Listing goes to review before going live.
- **Assisted:** For managers or partners with many units, dedicated onboarding support (e.g. walkthrough, bulk upload). Quality spot-checks before go-live.
- **Broker-led:** Broker onboarded first (§5); broker invites or refers owners; platform verifies owner and listing. Broker may receive referral or commission per agreement.

**Target:** Define minimum listing count for launch (e.g. 150–300 listings in Greater Montreal) and mix (neighborhoods, property types) so that guest search results are meaningful. Track progress weekly until launch.

---

## 5. Broker onboarding program

Brokers are a key supply and credibility channel for Montreal ([BNHub](BNHUB-BUSINESS-MODEL.md), [expansion](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#6-real-estate-marketplace-expansion)).

### 5.1 Broker outreach campaigns

- **Channels:** Email to licensed broker lists (where legally permissible), LinkedIn, events (e.g. real estate or property investor meetups), and referrals from early partners.
- **Message:** Value proposition: verified listings, CRM tools, lead flow, and differentiation vs. other platforms. Clear call-to-action (sign up, book demo, refer owners).
- **Segments:** Brokers with investor clients, brokers doing property management, and brokers focused on residential resale/rental. Tailor message by segment.

### 5.2 Training materials for brokers

- **Content:** Short guides or videos: (1) Platform overview and broker benefits. (2) How to sign up and get verified. (3) How to add or refer listings. (4) Listing quality and compliance requirements. (5) CRM and lead tools (if in scope). (6) Payouts and fees.
- **Format:** PDF, help center articles, and optional live or recorded webinar. French and English.
- **Access:** Shared at signup and via broker dashboard or email. Optional quiz or attestation to confirm understanding of policies.

### 5.3 Broker CRM onboarding

- **Steps:** Account creation → license verification → profile completion → (optional) listing or referral. Verification status and badge visible when complete.
- **CRM features:** If Broker CRM is live for Montreal, walk brokers through contacts, pipeline, and listing management. Ensure they can use the product to get value from day one.
- **Support:** Designated contact or channel for broker questions during pilot; feedback collected for product improvement.

### 5.4 Listing verification processes

- **Broker-referred listings:** Same verification as direct host: identity (and property/registration if required), listing accuracy, photo and description quality. Broker may vouch for owner; platform still verifies.
- **Broker-owned or -managed listings:** Broker verified; listings held to same quality and compliance standards. Verification status (broker + listing) visible to guests.

**Target:** Number of active brokers (e.g. 20–50) and broker-sourced or broker-referred listings by launch. Track in supply dashboard.

---

## 6. BNHub host onboarding

Hosts are recruited and onboarded so that listings are compliant and guest-ready.

### 6.1 Host education materials

- **Topics:** (1) How BNHub works (booking flow, fees, payouts). (2) Listing best practices (photos, description, pricing). (3) Montreal/Quebec rules (registration, tax, safety). (4) Guest communication and house rules. (5) Cancellation and refund policy. (6) How to get help.
- **Format:** Help center, email series, and optional live Q&A. French and English.
- **Timing:** Sent at signup and before first listing goes live; key points reinforced in dashboard or in-app tips.

### 6.2 Property listing guidelines

- **Required:** Accurate address; at least one clear exterior and interior photo; description that matches the property; correct room and guest capacity; house rules; pricing and fees visible.
- **Recommended:** Multiple photos, amenities list, check-in/check-out info, neighborhood description. Templates or examples provided.
- **Prohibited:** Misleading or fake photos, incorrect location, hidden fees, or content that violates [platform policies](PLATFORM-GOVERNANCE.md). Violations result in rejection or removal.

### 6.3 Safety requirements

- **Property:** Comply with applicable safety requirements (e.g. smoke detectors, safe egress). Disclose any known hazards. Listing may be rejected if safety requirements are not met or disclosed.
- **Registration:** Where Montreal/Quebec requires short-term rental registration, host must provide registration number or proof; platform may prompt and display. Non-compliant listings may be restricted until verified.

### 6.4 Pricing guidance

- **Transparency:** All mandatory fees (cleaning, service fee, taxes if collected by platform) shown clearly. No hidden charges.
- **Guidance:** Optional tools or tips (e.g. comparable listings, seasonal advice) to help hosts set competitive prices. No obligation to use platform-recommended price.
- **Currency:** Prices in CAD for Montreal; display and payment in CAD.

### 6.5 Host verification processes

- **Identity:** Host completes identity verification (document + liveness or equivalent) before listing is published. Failed verification blocks listing go-live; support assists with retry.
- **Property/registration:** Where required by local rule, host submits registration or proof of right to rent; platform verifies or flags for review. Status shown on listing (e.g. “Registration verified”).
- **Ongoing:** Re-verification or spot-checks may be required per [Trust & Safety](LECIPM-AI-OPERATING-SYSTEM.md) and [Governance](LECIPM-GOVERNANCE-CONSTITUTION.md). Compliant hosts remain in good standing.

---

## 7. Listing quality standards

Listings must meet defined quality standards before approval. This protects guests and platform trust ([Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md), [Governance](PLATFORM-GOVERNANCE.md)).

### 7.1 Requirements

| Requirement | Standard |
|-------------|----------|
| **High-quality property photos** | Clear, well-lit, accurate. Minimum number (e.g. 5); at least one exterior and one of each main room type. No stock or misleading images. |
| **Accurate property descriptions** | Description matches property (size, rooms, amenities). No false claims. Language clear and complete. |
| **Transparent pricing** | Base price and all mandatory fees (cleaning, service fee, taxes if applicable) displayed. No hidden fees in description or off-platform. |
| **Amenity disclosure** | Listed amenities are present and accurate. If something is missing (e.g. no AC), state clearly. |
| **Safety compliance** | Safety-related disclosures and, where required, registration or permit info provided. Property meets local safety expectations. |

### 7.2 Review before approval

- **Automated checks:** System checks for completeness (photos, description length, required fields), obvious policy violations (e.g. prohibited content), and duplicate or suspicious patterns. Failures block or queue for review.
- **Human review:** New listings (or a sample) may be reviewed by operations or Trust & Safety before go-live. Focus on accuracy, safety, and compliance. Approve, request changes, or reject with reason.
- **Ongoing:** Listings may be re-reviewed on report or by algorithm. [Content moderation](LECIPM-AI-OPERATING-SYSTEM.md) and [enforcement](LECIPM-GOVERNANCE-CONSTITUTION.md#5-enforcement-system) apply post-launch.

**Rejection:** Host is notified of rejection and reason; they may correct and resubmit. Repeated or serious violations may affect account standing.

---

## 8. Payment system testing

Payment flows are tested end-to-end before and during launch so that guests and hosts have a reliable experience.

### 8.1 Test bookings

- **Staging/test mode:** Use test cards and test accounts to run full booking flow: search → book → pay → (simulated) stay → release to host → payout. Verify amounts, fees, and currency (CAD).
- **Pre-launch live tests:** Small number of real bookings (e.g. internal or beta users) with real cards and payouts. Confirm charge, receipt, payout amount, and timing. Refund test on a subset.
- **Documentation:** Test cases and results logged; failures fixed and re-tested before launch.

### 8.2 Escrow handling verification

- **Logic:** If funds are held until check-in or stay completion, verify hold and release rules (date, trigger, amount). Confirm guest is charged and host is paid only when rules are met.
- **Edge cases:** Cancellation before check-in (guest refund, no host payout); cancellation after check-in; dispute scenario. Document expected behavior and verify.

### 8.3 Payout testing

- **Host payout:** Trigger payout for test host; verify amount (booking minus fees, taxes), currency (CAD), and bank credit (or test equivalent). Test different payout schedules if offered.
- **Timing:** Confirm payout timing (e.g. X days after stay end) and any hold for new or high-risk hosts per [AI-OS](LECIPM-AI-OPERATING-SYSTEM.md) or policy.

### 8.4 Refund handling tests

- **Full refund:** Guest cancels within policy; full refund issued; host payout adjusted (no payout for cancelled stay). Guest sees refund on statement; host sees correct balance.
- **Partial refund:** Test partial refund (e.g. early checkout, policy-based partial). Amounts and communications correct for both sides.
- **Dispute refund:** Simulated dispute leading to refund; both parties and support see correct status and amount.

### 8.5 Chargeback monitoring

- **Process:** Define how chargebacks are received (e.g. from payment provider), who responds, and what evidence is submitted. Test with provider if possible.
- **Launch:** Monitor chargeback rate from launch; spike or pattern triggers review with Trust & Safety and finance. [Monetization](LECIPM-MONETIZATION-ARCHITECTURE.md) and [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md) define handling.

---

## 9. Trust & Safety system testing

Safety systems are tested so that verification, fraud control, and incident handling work at launch.

### 9.1 Identity verification tests

- **Happy path:** Host (and guest if required) completes verification; status updates; listing or booking is allowed. Verify in multiple environments (web, app) and languages.
- **Failure path:** Invalid document or failed liveness; user sees clear message and retry option. Support can assist; no listing go-live until verified.
- **Edge cases:** Expired document, poor image quality, unsupported document type. Behavior and messaging documented and consistent.

### 9.2 Fraud detection monitoring

- **Signals:** Fraud/risk scoring (or equivalent) runs on signup, listing, and booking. High-risk cases are flagged; payouts may be held or account restricted per [AI-OS](LECIPM-AI-OPERATING-SYSTEM.md) and policy.
- **Test:** Create test scenarios that should trigger flags (e.g. duplicate listing, suspicious payment). Confirm flagging and that human review or automated action occurs as designed.
- **Launch:** Monitor fraud and risk metrics from day one; tune thresholds if false positives or misses are high.

### 9.3 Incident reporting system tests

- **User report:** Guest or host submits report (in-app or support); report is created and routed to correct queue. Reporter receives confirmation and, where appropriate, follow-up.
- **Triage:** Trust & Safety (or support) triages; severity and type correct; escalation path works. Test safety, payment, and content reports.
- **Resolution:** Simulated incident is resolved (e.g. warning, refund, listing removal); outcome documented. User notification and internal audit trail correct.

### 9.4 Review moderation system

- **Posting:** Reviews post only after stay is complete (or per policy). Content is checked for policy violations (e.g. harassment, prohibited content). Violations are removed or blocked; user notified if needed.
- **Moderation queue:** Flagged or reported reviews appear in queue; moderator can approve, edit, or remove. Decision and reason logged.
- **Launch:** Monitor review volume and moderation backlog; ensure SLAs are met.

---

## 10. Marketing launch strategy

Launch marketing drives initial supply and demand without over-committing budget before product-market fit is proven.

### 10.1 Digital marketing campaigns

- **Channels:** Paid search (e.g. “short-term rental Montreal”, “appartement courte durée”) and social (Facebook, Instagram) targeting Montreal and Quebec. Creative in French and English.
- **Goals:** Brand awareness and signups (guests and hosts). Track CPA and conversion to signup and first booking. Budget capped for pilot; scale only if metrics justify.
- **Landing:** Dedicated Montreal (or Canada) landing page with value proposition, trust signals (verification, safety), and clear CTA. SEO basics (title, description) for organic discovery.

### 10.2 Host acquisition campaigns

- **Message:** “List your property in Montreal—verified, compliant, and easy.” Emphasize registration support, tools, and earnings potential.
- **Tactics:** Direct outreach to property managers and owners (email, LinkedIn); local ads; referral (early hosts refer others). Incentive (e.g. reduced fee for first X bookings) if compliant and sustainable.
- **Metrics:** Cost per new host, time to first listing, time to first booking. Optimize creative and channel based on pilot data.

### 10.3 Broker partnerships

- **Outreach:** Brokers invited to join program (§5); value proposition (CRM, leads, verified supply). Partnership or referral agreement where applicable.
- **Co-marketing:** Optional co-branded or broker-specific landing page or promo for broker-referred listings. Track broker-sourced supply and bookings.

### 10.4 Referral incentives

- **Host referral:** Host refers another host; referrer receives credit or bonus when referee lists and completes first booking. Terms clear (e.g. no fake accounts, one reward per referee).
- **Guest referral:** Guest refers guest; both may receive discount or credit on next booking. Same terms and fraud guardrails.
- **Compliance:** Incentives comply with Quebec/Canadian law (e.g. no misleading claims, proper disclosure). Legal review if uncertain.

### 10.5 Local partnerships

- **Tourism and events:** Tourism Montreal or event organizers (festivals, conferences) for visibility or co-promotion. Content or listing bundles if relevant.
- **Property services:** Cleaning or maintenance partners for host supply; referral or commission per [Monetization](LECIPM-MONETIZATION-ARCHITECTURE.md). Introduced to hosts during onboarding or via dashboard.

---

## 11. Customer support preparation

Support is ready to handle questions and issues from launch day.

### 11.1 Support team setup

- **Staffing:** Dedicated or shared team with capacity for expected volume (guests, hosts, brokers). Bilingual (French and English) capability for Montreal.
- **Roles:** Triage, first-line resolution, escalation to Trust & Safety or payments. Clear ownership for each queue.
- **Tools:** Ticketing or case system; access to user and transaction context; knowledge base and scripts for common issues.

### 11.2 Ticketing system

- **Configuration:** Incoming channels (email, in-app, chat) create tickets; queue by type (guest, host, broker, payment, safety) and language. SLA and priority rules set.
- **Integration:** Link to user and booking so agents see full context. Escalation creates linked ticket or alert to Trust & Safety or specialist.

### 11.3 Support response procedures

- **Response time:** Target for first response (e.g. within 24 hours for non-urgent; within hours for payment or safety). Targets documented and monitored.
- **Resolution:** Standard replies and workflows for frequent issues (e.g. cancellation, refund, verification failure, payout timing). Complex or policy-sensitive cases escalated.
- **Language:** Reply in user’s language (French or English). Escalation path for other languages if needed.

### 11.4 Incident escalation protocols

- **Safety:** Any safety-related report is escalated immediately to Trust & Safety. No resolution without Trust & Safety approval for safety outcomes.
- **Payment:** Disputes, chargebacks, and payout errors escalated to payments or finance. Refund above threshold or policy exception requires approval per [Governance](LECIPM-GOVERNANCE-CONSTITUTION.md) and [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md).
- **Legal/compliance:** Regulatory or legal question escalated to legal/compliance. Support does not give legal advice; they acknowledge and escalate.
- **Documentation:** All escalations and outcomes logged. Post-incident review for serious cases to improve process and product.

---

## 12. Launch day operations

Launch day is executed in a controlled way with clear activation, monitoring, and response.

### 12.1 Platform activation

- **Go-live:** Montreal (or Canada) is enabled in production at agreed date/time. Listings are live for search; booking and payments are open. Announcement (email, in-app, social) goes out to early users and partners.
- **Feature flags:** Any launch-specific flags are set and verified. Rollback plan is defined (e.g. disable new bookings or region if critical issue).
- **Communication:** Internal team briefed on launch window; support and Trust & Safety on standby. Status page or internal channel for incidents.

### 12.2 Monitoring dashboards

- **Metrics:** Real-time or near-real-time view of: signups, listings, searches, bookings, payment success/failure, payout status, support ticket volume, and incident count. Dashboards prepared and accessible to launch lead and ops.
- **Alerts:** Alerts for critical failures (e.g. payment down, spike in errors, fraud spike). On-call or designated responder defined.
- **Review cadence:** Launch lead (or ops) reviews dashboard at defined intervals (e.g. hourly for first 24 hours, then daily for first week).

### 12.3 Support availability

- **Coverage:** Support available during launch window (e.g. extended hours or 24/7 for first 48–72 hours). Bilingual coverage for Montreal.
- **Volume:** Expect higher volume in first days; temporary capacity or overflow plan if needed. Priority to payment and safety issues.
- **Escalation:** Escalation path and on-call clearly known. Critical issues (e.g. payment outage, safety) raised immediately to launch lead and relevant owners.

### 12.4 Incident monitoring

- **Sources:** User reports, support tickets, Trust & Safety queue, system alerts, and fraud/risk signals. Single view or daily summary for launch lead.
- **Response:** Each incident triaged and assigned. Safety and payment first; then listing and user issues. Resolution and communication per [Governance](LECIPM-GOVERNANCE-CONSTITUTION.md) and support procedures.
- **Communication:** For major incidents (e.g. platform outage), internal and optionally user communication per incident plan. Post-mortem for significant failures.

---

## 13. First 90-day monitoring plan

The first 90 days after launch are monitored closely to validate objectives and guide adjustments.

### 13.1 Tracking

| Metric | Frequency | Owner | Action if off-track |
|--------|------------|--------|----------------------|
| **Active users** | Weekly (guests, hosts, brokers) | Ops / product | Investigate drop or stagnation; adjust acquisition or retention. |
| **Active listings** | Weekly | Ops | If below target, intensify supply acquisition or referral. |
| **Booking volume** | Weekly | Ops / product | If low, review demand (marketing, SEO, pricing) and supply quality. |
| **Incident reports** | Daily (first 2 weeks), then weekly | Trust & Safety / support | Spike or severity triggers root cause and process or product fix. |
| **Customer satisfaction** | Bi-weekly or monthly (NPS/CSAT) | Ops / product | Low scores trigger feedback review and improvement plan. |

### 13.2 Additional tracking

- **Payment:** Success rate, refund rate, chargeback count. Issues escalated to payments and product.
- **Trust & Safety:** Verification completion rate, fraud flags, content removals, account actions. Trends inform tuning and policy.
- **Support:** Ticket volume, first-response time, resolution time, escalation rate. Capacity and process adjusted as needed.

### 13.3 Review cadence

- **Weekly:** Launch or ops lead reviews metrics with product and support. Priorities set for next week (e.g. fix top bugs, improve onboarding).
- **Monthly:** Deeper review with leadership: progress vs. [launch objectives](#1-launch-objectives) and [expansion readiness](#16-expansion-readiness-evaluation). Go/no-go for next phase is not decided at 30 days but trends are noted.
- **Day 90:** Formal evaluation against [expansion readiness](#16-expansion-readiness-evaluation). Document lessons learned and playbook updates for next city.

---

## 14. Performance metrics

Success is measured by the following metrics. Targets are set before launch and reviewed at 30, 60, and 90 days.

| Metric | Definition | Target (example) |
|--------|------------|-------------------|
| **Listing growth** | Net active listings (live and bookable) in Greater Montreal | e.g. 200+ by day 90; growth rate positive after launch. |
| **Booking growth** | Number of completed (or confirmed) bookings per week/month | e.g. X bookings in first month; growth month-over-month. |
| **Revenue generation** | Platform revenue (guest fee + host commission or equivalent) in CAD | e.g. Revenue consistent with booking volume and fee structure; track unit economics. |
| **Platform reliability** | Uptime and error rates for core flows (search, book, pay) | e.g. 99.5%+ uptime; critical path error rate below X%. |
| **User retention** | Repeat bookers (guests) and repeat listers (hosts) within 90 days | e.g. X% of guests with 2+ bookings; X% of hosts with 2+ bookings or renewals. |

**Additional:** Conversion (search → book), time to first booking for new listings, support satisfaction, and incident rate. Targets may be adjusted after first 30 days based on pilot data; any change is documented.

---

## 15. Operational adjustments

Feedback and data from the pilot drive continuous improvement.

### 15.1 User feedback analysis

- **Collection:** In-app surveys, support feedback, and optional user interviews. Questions on ease of use, trust, pricing, and missing features.
- **Analysis:** Themes summarized (e.g. “verification is slow”, “pricing unclear”). Prioritized with product and ops. High-impact or quick wins addressed first.
- **Closing the loop:** Where possible, users are informed of changes (e.g. “We’ve improved verification speed”). Shows responsiveness and builds trust.

### 15.2 Bug fixes

- **Triage:** Bugs from support, monitoring, and internal use are triaged by severity. Critical (e.g. payment failure, safety) fixed immediately; others scheduled.
- **Release:** Fixes shipped in regular releases or hotfixes. Release notes and internal communication so support and ops are aware.
- **Verification:** Fix verified in staging and, for critical, in production. Regression checks where relevant.

### 15.3 Policy adjustments

- **Triggers:** User confusion, support volume, or incident patterns may indicate policy gaps. Legal/compliance and product review.
- **Process:** Policy changes follow [Governance Constitution](LECIPM-GOVERNANCE-CONSTITUTION.md) (review, approval, notification). Users notified of material changes per [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md).
- **Examples:** Clarify cancellation window, refund eligibility, or listing requirements based on Montreal experience. Document in playbook for future cities.

### 15.4 Feature improvements

- **Prioritization:** Product backlog is informed by Montreal metrics and feedback. Features that improve conversion, retention, or safety are prioritized.
- **Scope:** Pilot scope is kept manageable; large new features may be deferred until after expansion readiness. Small improvements (e.g. copy, UX) ship continuously.
- **Measurement:** Impact of changes measured (e.g. conversion before/after, support volume). Informs next priorities.

---

## 16. Expansion readiness evaluation

Before expanding beyond Montreal (e.g. to Quebec City, Toronto, or other Canadian cities), the following criteria should be satisfied. This implements [expansion roadmap](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#15-phased-expansion-roadmap) and [expansion metrics](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#13-expansion-metrics).

| Criterion | Definition | Pass threshold (example) |
|-----------|-------------|--------------------------|
| **Sufficient listings** | Active, bookable supply in Montreal | e.g. 200+ listings; stable or growing; quality standards met. |
| **Stable booking activity** | Sustained demand and conversion | e.g. X+ bookings per week for 4+ weeks; conversion and repeat rate acceptable. |
| **Low incident rates** | Safety, fraud, and policy incidents under control | e.g. Incidents per booking below X; no unresolved critical safety or fraud issues; Trust & Safety and support can handle volume. |
| **Strong user satisfaction** | Guests and hosts satisfied with platform | e.g. NPS or CSAT above target; support satisfaction acceptable; key complaints addressed. |

**Additional:**

- **Operational readiness:** Support, Trust & Safety, and payments can scale to another city (playbooks, tools, and capacity). No critical open bugs or compliance gaps.
- **Financial:** Unit economics in Montreal support replication (or path to profitability is clear). [Monetization](LECIPM-MONETIZATION-ARCHITECTURE.md) and spend are within plan.
- **Go decision:** Formal go/no-go review with leadership. If go, next city (e.g. Quebec City or Toronto) is selected per [market selection](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#2-market-selection-strategy) and launch plan is created using this playbook as template.

---

## 17. Montreal success case study

A successful Montreal launch is used to attract investors, partners, and new markets.

### 17.1 For investors

- **Proof of concept:** Montreal demonstrates that the platform works end-to-end in a real market: supply acquisition, demand, payments, Trust & Safety, and compliance.
- **Metrics:** Share (where appropriate) listing growth, booking volume, retention, and satisfaction. Show scalability of playbook and unit economics.
- **Narrative:** “First pilot city launched; expansion criteria met; playbook ready for Phase 2.” Supports funding or partnership discussions.

### 17.2 For partners

- **Credibility:** Property managers, brokers, and tourism partners see a live market with real listings and bookings. Case studies or testimonials (with permission) from Montreal hosts or brokers.
- **Reference:** Montreal is the reference implementation for onboarding, compliance, and support. New partners in other cities can be shown how it works in Montreal.
- **Evidence:** Data on host earnings, guest satisfaction, or broker lead volume (aggregated and anonymized as needed) to support partnership pitches.

### 17.3 For new markets

- **Playbook:** Montreal playbook (this document and its operational artifacts) is the template for Quebec City, Toronto, and other Phase 2 cities. Lessons learned are documented and reused.
- **Positioning:** “Launched in Montreal; expanding across Canada.” Signals execution capability and reduces perceived risk for new host and broker partners in the next city.
- **Regulatory:** Montreal/Quebec compliance (registration, tax, consumer protection) serves as a base for other Canadian jurisdictions; adjustments are documented for each new region.

**Materials:** Prepare a short case study (1–2 pages) and slide deck with key metrics and quotes after 90 days. Keep updated as Montreal matures. Use in investor updates, partner conversations, and expansion planning.

---

## 18. Long-term launch strategy

The Montreal launch is the foundation for expansion to other Canadian and international cities.

### 18.1 Foundation role

- **Template:** This playbook becomes the standard for city launches: readiness checklist, supply acquisition, broker and host onboarding, listing quality, payment and Trust & Safety testing, marketing, support, launch day, 90-day monitoring, metrics, adjustments, and expansion evaluation.
- **Iteration:** Each subsequent city (Quebec City, Toronto, Vancouver, etc.) uses the playbook and adds city-specific sections (e.g. local regulation, partners, marketing). Montreal learnings are baked into the template so that each launch is smoother.
- **Governance:** [Governance Constitution](LECIPM-GOVERNANCE-CONSTITUTION.md), [Legal Shield](LECIPM-LEGAL-SHIELD-FRAMEWORK.md), and [AI-OS](LECIPM-AI-OPERATING-SYSTEM.md) apply in Montreal and in every new city; no launch without compliance and Trust & Safety readiness.

### 18.2 Path to Canadian and international expansion

- **Phase 2 (Canada):** After [expansion readiness](#16-expansion-readiness-evaluation) is met, add cities per [Phase 2](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#15-phased-expansion-roadmap). Regional operations and partnerships scale; Montreal playbook is reused and refined.
- **Phase 3+ (US and international):** When entering the US or other countries, country-specific legal, tax, and product work is added; launch playbook structure (readiness, supply, onboarding, testing, launch, 90-day, metrics, expansion criteria) remains. Montreal (and later Canadian cities) remain proof points and operational references.
- **Global ecosystem:** As LECIPM becomes a multi-country platform, Montreal stays part of the network: supply and demand in Montreal benefit from cross-region visibility and travel; Montreal success continues to support brand and partner confidence globally ([long-term vision](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#16-long-term-global-vision)).

---

*This document is the Montreal Launch Playbook for the LECIPM platform. It implements the [pilot city strategy](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#3-pilot-city-strategy) and [Phase 1](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md#15-phased-expansion-roadmap) of the [Global Expansion Blueprint](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md) and aligns with [BNHUB-BUSINESS-MODEL](BNHUB-BUSINESS-MODEL.md), [LECIPM-GOVERNANCE-CONSTITUTION](LECIPM-GOVERNANCE-CONSTITUTION.md), [LECIPM-LEGAL-SHIELD-FRAMEWORK](LECIPM-LEGAL-SHIELD-FRAMEWORK.md), [LECIPM-AI-OPERATING-SYSTEM](LECIPM-AI-OPERATING-SYSTEM.md), and [PROJECT-OVERVIEW](PROJECT-OVERVIEW.md).*
