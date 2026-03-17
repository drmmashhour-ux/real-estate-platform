# LECIPM Platform Operating Manual

**Day-to-day operations guide for founders, operations, trust & safety, support, growth, and compliance**

This manual explains how the company runs the LECIPM platform operationally. It is the single reference for **who does what, when, and how** in marketplace operations, trust & safety, support, growth, finance, AI, monitoring, crisis, compliance, and expansion. It aligns with the [Platform Mission](vision/PLATFORM-MISSION.md), [Platform Defense Layer](defense/PLATFORM-DEFENSE.md), [Founder Command Center](FOUNDER-COMMAND-CENTER.md), [90-Day Execution Plan](90-DAY-EXECUTION-PLAN.md), and [24-Month Scaling Roadmap](24-MONTH-SCALING-ROADMAP.md).

---

# Section 1 — Platform Mission

## Mission

**To connect people, licensed professionals, and investors in a trusted and verified digital ecosystem**—enabling confident property discovery, professional guidance, and long-term value through relationship-driven real estate and lifestyle services.

## Purpose of the platform

- **Unified ecosystem:** One place for real estate (sale, long-term rental), short-term stays (BNHub), broker tools, owner tools, deals, and investment analytics.
- **Trust first:** Verification (identity, professional credentials, property) and transparency are the foundation. Reputation and governance replace uncertainty.
- **Relationships over transactions:** Long-term professional and user relationships drive value; the platform supports repeat use and loyalty.

## Long-term vision

Build **trusted digital infrastructure** for real estate, accommodation, and property investment—globally. Every operational decision (onboarding, moderation, support, enforcement, expansion) should advance trust, transparency, and sustainable scale.

---

# Section 2 — Core Platform Modules

## Major modules and daily operational purpose

| Module | Operational purpose | Daily focus |
|--------|---------------------|-------------|
| **Real Estate Marketplace** | Discovery and transactions for sale and long-term rental; verified listings. | Listing quality, search relevance, transaction support, verification status. |
| **BNHub Stays Marketplace** | Short-term rental: list, search, book, pay, message, review. | Listings live, bookings flowing, payments and payouts correct, reviews and messaging moderated. |
| **Broker CRM** | Clients, leads, listings, and pipeline for licensed brokers. | Broker onboarding, listing linkage, support, subscription and usage. |
| **Owner Dashboard** | Listings, bookings, revenue, and communication for owners. | Owner onboarding, dashboard usability, payout and reporting accuracy. |
| **Deal Marketplace** | Deals and off-market opportunities for investors and professionals. | Deal listing quality, discovery, and transaction support. |
| **Investment Analytics** | Rental yield, ROI, market insights. | Data accuracy, access control, subscription delivery. |
| **Trust & Safety System** | Verification, fraud, incidents, disputes, moderation, enforcement. | Verification queues, fraud alerts, incident triage, dispute resolution, enforcement actions. |
| **AI Control Center** | Fraud, pricing, demand, search, moderation, recommendations. | Model performance, overrides, audits, human-in-the-loop for high-stakes decisions. |

## How each module operates daily

- **Marketplace and BNHub:** Operations and product ensure listings are approved, bookings and payments run, and the funnel is monitored. Support handles guest and host questions.
- **Broker CRM and Owner Dashboard:** Growth and ops onboard brokers and owners; support assists with tools and billing. Product and engineering maintain availability and features.
- **Deal Marketplace and Investment Analytics:** Listings and data are curated; access and subscriptions are managed; support handles professional users.
- **Trust & Safety:** T&S team runs verification, moderation, fraud review, incidents, and enforcement per playbooks; escalates to leadership when needed.
- **AI Control Center:** Engineering and product monitor models; ops and T&S use overrides and reviews when AI output is wrong or policy requires human decision.

---

# Section 3 — Marketplace Operations

## How the marketplace runs day-to-day

Marketplace operations are responsible for **supply health, transaction flow, and listing quality** so that guests can find and book, and hosts can list and get paid.

## Responsibilities

| Area | Responsibility | Frequency |
|-----|----------------|-----------|
| **Listing approvals** | Review new or updated listings per moderation workflow; approve or reject within SLA (e.g. 24–48h); document reason for rejection; re-review when appealed. | Continuous / daily |
| **Host onboarding** | Guide new hosts through signup, verification, and first listing; track activation rate; follow up on drop-off. | Daily |
| **Broker onboarding** | Onboard broker accounts; verify credentials where required; link to listings and CRM; track broker activity. | Daily |
| **Booking monitoring** | Monitor booking creation, completion, and cancellation rates; identify and escalate payment or availability failures; track conversion funnel. | Daily |
| **Payment monitoring** | Ensure guest charges succeed; track payment success rate; escalate failures to engineering or payment provider; align with finance on reconciliation. | Daily |
| **Review monitoring** | Monitor new reviews for policy violations or abuse; queue for moderation if needed; track rating trends and host response to negative reviews. | Daily |

## Daily responsibilities of marketplace operations teams

- **Start of day:** Review overnight bookings, payment success, listing queue, and any alerts (e.g. conversion drop, payment failure spike).
- **Through day:** Process listing approvals, respond to host/broker onboarding issues, triage booking and payment failures, and handle review moderation queue.
- **End of day:** Confirm critical metrics (e.g. bookings, payment success, approval SLA); hand off any open incidents to on-call or next shift.
- **Weekly:** Review supply targets, activation rates, and funnel metrics; report to leadership and align with growth on acquisition.

---

# Section 4 — Trust and Safety Operations

## How platform safety is managed

Trust & Safety (T&S) protects users and the platform through **verification, fraud prevention, incident handling, dispute resolution, and enforcement**. All actions must be documented and consistent with policy.

## Responsibilities

| Area | Responsibility | Escalation |
|-----|----------------|-------------|
| **Listing verification** | Verify listing accuracy and rights (e.g. ownership, registration); approve or flag; use evidence and compliance records where needed. | Unclear ownership or legal risk → Legal/Compliance. |
| **Identity verification** | Run identity verification for hosts (and guests if policy requires); handle failures and retries; maintain verification status in product. | Systematic failure or abuse → Engineering + Leadership. |
| **Fraud monitoring** | Review fraud alerts and risk flags; apply payout holds or account restrictions per policy; refer to enforcement when threshold met. | Large or coordinated fraud → Leadership + Finance. |
| **Incident reports** | Triage safety and policy incidents; assign severity; gather evidence; coordinate with support and ops; close with outcome documented. | High-severity or legal → Leadership + Legal. |
| **Dispute resolution** | Intake disputes; collect evidence; message parties; apply policy; resolve within SLA (e.g. &lt;7 days); log in Platform Defense. | Unusual or precedent-setting → Policy + Legal. |
| **Enforcement actions** | Apply warnings, restrictions, freezes, suspensions, or bans per policy; log reason codes and evidence; process appeals per playbook. | Appeals, high-profile users, or legal risk → Leadership + Legal. |

## Escalation procedures

- **Level 1 (T&S):** Standard verification, fraud review, dispute, or enforcement per playbook.
- **Level 2 (T&S lead / Ops):** Unclear policy, repeat offender, or elevated user complaint.
- **Level 3 (Leadership + Legal):** Legal threat, regulatory contact, major incident, or public/safety risk.
- **Documentation:** All escalations and outcomes are recorded (e.g. in admin tools, Platform Defense, or incident log). Evidence is preserved per [Platform Defense](defense/PLATFORM-DEFENSE.md).

---

# Section 5 — Customer Support Operations

## How support teams operate

Support handles **guest and host (and broker/owner) inquiries** so that users get timely help and issues are triaged to T&S, ops, or engineering when needed.

## Responsibilities

| Area | Responsibility | Response expectation |
|-----|----------------|----------------------|
| **Ticket handling** | Triage by category and severity; assign and route; resolve or escalate; close with clear outcome. | First response within target (e.g. &lt;4h business hours); resolution per SLA by category. |
| **Booking support** | Help with search, booking, modification, cancellation, and post-booking questions; escalate payment or availability bugs to ops/engineering. | Same as above. |
| **Refund requests** | Process per policy; coordinate with payments and T&S if dispute or fraud; document reason and outcome. | Per refund policy SLA; disputed refunds to T&S. |
| **Dispute support** | Provide status and next steps; do not decide outcome—T&S owns resolution; collect and pass evidence. | Inform user of process and SLA; hand off to T&S. |
| **Host assistance** | Help with listing creation, calendar, pricing, payouts, and tools; escalate technical or payout issues. | Same as above. |

## Support response expectations

- **First response:** Target median &lt;4 hours during business hours (adjust by market and capacity).
- **Resolution:** Target by category (e.g. billing &lt;48h, booking &lt;24h where possible); document when SLA is missed and why.
- **Escalation:** Define which categories auto-escalate to T&S or ops (e.g. safety, fraud, refund dispute); support documents and hands off; T&S/ops acknowledge and own.
- **Quality:** Sample tickets for clarity, accuracy, and policy alignment; use feedback to update FAQs and playbooks.

---

# Section 6 — Growth Operations

## How the platform grows supply and demand

Growth is responsible for **supply acquisition (hosts, brokers, partners)** and **demand activation (marketing, referrals)** so that listings and bookings grow in a measurable, sustainable way.

## Responsibilities

| Area | Responsibility | Monitoring |
|-----|----------------|-------------|
| **Host acquisition** | Outreach, landing pages, nurture, incentives (if any); track signup → first listing → first booking. | New hosts, activation rate, cost per activated host. |
| **Broker acquisition** | Partner outreach, value proposition, onboarding; track signup → verified → active (listing or CRM use). | New brokers, activity rate, listings from brokers. |
| **Referral programs** | Structure, tracking, payouts; prevent abuse (link to Platform Defense and T&S). | Referral signups, conversion to listing/booking, cost per conversion. |
| **Marketing campaigns** | Demand campaigns (e.g. paid, organic, seasonal); track spend, impressions, clicks, signups, bookings. | CAC, conversion by channel, ROI. |
| **Partnerships** | Property managers, channel managers, local partners; contracts and onboarding; supply or distribution. | Partner-sourced listings, bookings, and revenue. |

## How growth performance is monitored

- **Dashboard:** Use [Founder Command Center — Supply & Growth](FOUNDER-COMMAND-CENTER.md#dashboard-3--supply-and-growth) and internal growth views: new hosts/brokers, referral conversions, listing growth rate, host activation rate, broker activity rate, market expansion.
- **Cadence:** Weekly review of supply targets, activation, and CAC; monthly review of channel mix and LTV; align with ops on onboarding quality and with product on funnel improvements.

---

# Section 7 — Financial Operations

## How financial activity is monitored

Finance and ops ensure **revenue is correctly recorded**, **payouts are accurate and on time**, and **refunds and chargebacks are tracked and handled**. Oversight prevents leakage and supports reporting.

## Responsibilities

| Area | Responsibility | Oversight |
|-----|----------------|-----------|
| **Booking revenue monitoring** | Track guest charges and commission (guest + host fee); reconcile with payment provider; investigate failures or gaps. | Daily/weekly revenue reconciliation; variance explanation. |
| **Subscription revenue monitoring** | Track MRR and subscription revenue (broker CRM, owner, analytics); churn and upgrades; billing issues. | Monthly MRR and churn review. |
| **Promotion revenue monitoring** | Track promotion and paid listing revenue; reconcile with product and billing. | Monthly with other revenue streams. |
| **Payout monitoring** | Ensure host (and broker) payouts run on schedule; track success rate and failures; resolve holds with T&S when risk-flagged. | Daily payout success; weekly payout report. |
| **Refund tracking** | Volume and value of refunds; reason codes; trend vs bookings; escalate if abuse or policy issue. | Weekly refund rate; alignment with T&S on dispute-driven refunds. |
| **Chargeback handling** | Receive and respond to chargebacks; submit evidence per payment provider rules; track chargeback rate and value; root cause with T&S and product. | Per dispute; monthly chargeback rate review. |

## Financial oversight responsibilities

- **Reconciliation:** Revenue and payout data reconciled with payment provider and internal systems on a defined schedule (e.g. daily for payouts, weekly for revenue).
- **Reporting:** Accurate GMV, revenue by stream, and payout reporting for leadership and [Command Center](FOUNDER-COMMAND-CENTER.md#dashboard-2--revenue-and-financial-performance).
- **Controls:** Payout release follows policy and Platform Defense (e.g. financial risk flags, approval where required); no single person can bypass controls without audit trail.

---

# Section 8 — AI Operations

## How AI systems operate

AI supports **fraud detection, pricing, demand forecasting, search ranking, and recommendations**. Operations and product monitor performance and intervene when models are wrong or policy requires a human decision.

## Responsibilities

| Area | Responsibility | Human intervention when |
|-----|----------------|---------------------------|
| **Fraud detection monitoring** | Review fraud scores and alerts; tune thresholds to balance catch rate and false positives; act on high-risk (e.g. hold payout). | High-stakes user or large payout; contested decision; model drift or spike in alerts. |
| **Pricing recommendation monitoring** | Ensure pricing suggestions are reasonable and explainable; track adoption and revenue impact; flag systematic errors. | Host complaints; obvious mispricing; A/B test or policy change. |
| **Demand forecasting review** | Compare forecasts to actuals; use for supply and marketing planning; flag large errors. | Persistent bias or error; use in strategic decisions. |
| **Search ranking tuning** | Monitor CTR and conversion by ranking; run experiments; avoid policy violations (e.g. discrimination). | Ranking bug; legal or policy concern; major algorithm change. |
| **Model performance monitoring** | Latency, error rate, drift; dashboard in AI Control Center; retrain or rollback when needed. | Accuracy drop; drift; fairness or safety issue. |

## When human intervention is required

- **Override:** T&S or ops overrides AI decision (e.g. fraud hold, ranking) when policy or evidence warrants; override is logged and reviewed.
- **Appeal:** User appeals AI-driven outcome (e.g. payout hold); human review per appeal playbook; outcome and reason logged.
- **Policy:** New policy or region may require model or rule changes; product and Eng own; ops and T&S informed.
- **Incident:** AI failure or abuse of AI (e.g. gaming ranking); engineering and T&S investigate; fix and communicate as needed.

---

# Section 9 — Platform Monitoring

## How platform health is monitored

Engineering and ops monitor **availability, performance, and business-critical flows** so that issues are detected and resolved quickly. Dashboards and alerts drive response.

## Monitoring areas

| Area | What is monitored | Workflow |
|------|-------------------|----------|
| **System uptime** | Service and dependency health; alert on outage or degradation. | On-call or ops responds; status page updated; post-incident review if major. |
| **Service performance** | Latency, error rate, throughput of key APIs and pages. | Alert on SLO breach; investigate and fix; capacity planning. |
| **Booking funnel monitoring** | Search → detail → book → pay conversion; drop-off by step. | Daily/weekly review; alert on significant drop; ops and product investigate. |
| **Payment success monitoring** | Charge and payout success rates; alert if below threshold (e.g. 95%). | Immediate alert; engineering and payment provider; finance and ops informed. |
| **Fraud alerts** | Volume and severity of fraud signals; spike or new pattern. | T&S and ops review; escalate if coordinated or large loss. |

## Monitoring workflows

- **Dashboards:** [Founder Command Center](FOUNDER-COMMAND-CENTER.md) and internal ops/engineering dashboards (health, funnel, payments, fraud).
- **Alerts:** Configured for uptime, SLO, payment success, and critical fraud; on-call or designated responder; escalation to leadership for major incidents.
- **Cadence:** Real-time or near real-time for alerts; daily review of funnel and payments; weekly review of trends and capacity.

---

# Section 10 — Crisis Management

## Procedures for major incidents

When a **major incident** occurs (payment outage, fraud spike, system failure, regulatory issue, security breach), a clear process limits damage and restores normal operation.

## Incident types and response

| Type | Examples | Response |
|------|----------|----------|
| **Payment outages** | Provider down; bulk charge failure; payout failure. | Eng + payment provider; status page; support script; finance and ops informed; post-incident review. |
| **Fraud spikes** | Coordinated fraud; large loss; new attack vector. | T&S lead; optional payout freeze or policy tightening; leadership and finance; evidence preserved; post-incident review. |
| **System failures** | Broad outage; data issue; critical bug. | Eng on-call; restore service; communicate to users and support; post-incident review and follow-up. |
| **Regulatory issues** | Authority inquiry; compliance failure; new regulation. | Legal and compliance lead; document and respond; leadership informed; policy and product changes if needed. |
| **Security breaches** | Unauthorized access; data exposure. | Security and Eng lead; contain and remediate; legal and compliance; user and authority notification per law; post-incident review. |

## Escalation chains

- **Level 1:** On-call or designated ops/Eng/T&S handles per runbook.
- **Level 2:** Team lead or manager if impact is broad or runbook does not apply.
- **Level 3:** Leadership (founder or designated exec) for: multi-hour outage, material financial or safety impact, regulatory or legal, or public/partner communication.
- **Documentation:** All incidents are logged (start, end, impact, actions, follow-ups); major incidents get a written post-mortem and improvement plan.

---

# Section 11 — Compliance and Legal Oversight

## How the platform manages regulatory compliance

Compliance and legal ensure the platform **meets regulatory requirements** and can **respond to authorities** and **preserve evidence** when needed.

## Responsibilities

| Area | Responsibility |
|-----|----------------|
| **Policy management** | Maintain and version platform policies (terms, privacy, listing standards, conduct); ensure acceptance is recorded (Platform Defense legal layer); communicate material changes to users. |
| **Compliance review workflows** | Run compliance reviews per market (e.g. listing registration, tax, permits); use [Platform Defense — compliance](defense/PLATFORM-DEFENSE.md) queues and status; resolve gaps and document. |
| **Regulatory response processes** | Designate owner for regulatory contact; document requests and responses; involve legal; preserve evidence and correspondence. |
| **Legal evidence preservation** | Use Platform Defense evidence and legal event logs; chain-of-custody and access logging; export for investigations or legal proceedings per policy. |

## Coordination

- **T&S and ops** execute verification and compliance reviews; **legal and compliance** set policy and handle regulatory contact; **product and Eng** implement policy and compliance features. Regular sync between compliance and operations.

---

# Section 12 — Market Expansion Operations

## How new markets are launched

New markets (cities or regions) follow a **repeatable playbook** so that launch is controlled and compliant. Use the [90-Day Execution Plan](90-DAY-EXECUTION-PLAN.md) and [24-Month Scaling Roadmap](24-MONTH-SCALING-ROADMAP.md) for sequence; below is the operational checklist.

## Market readiness checklist

- **Product:** Market enabled (region, currency, language); listing and booking rules configured; payment and payout support for market.
- **Compliance:** Local requirements (registration, tax, permits) documented; compliance workflows and evidence in place; legal sign-off where needed.
- **Operations:** Support and T&S capacity; runbooks and escalation for the market; local or bilingual support if required.
- **Growth:** Host and broker acquisition plan; referral and marketing plan; supply and demand targets for first 90 days.

## Host acquisition strategy

- Adapt messaging and channels to the market; use learnings from pilot and previous launches; track activation and retention by market.

## Compliance preparation

- Before launch: list applicable regulations; implement checks and evidence (e.g. registration, tax); train ops and T&S; document exceptions and escalation.

## Operational support preparation

- Staffing and hours; FAQs and playbooks; payment and payout testing; T&S and escalation paths; go-live and hypercare plan.

---

# Section 13 — Performance Reviews

## How leadership reviews platform performance

Regular reviews keep leadership aligned on **operations, business, and strategy** and ensure decisions are data-driven.

## Review types

| Review | Cadence | Content | Participants |
|--------|---------|---------|--------------|
| **Weekly operational review** | Weekly | Metrics from Command Center (marketplace, revenue, growth, T&S, product); incidents and blockers; priorities for next week. | Ops, T&S, support, growth, product, Eng leads; founder or delegate. |
| **Monthly business review** | Monthly | Full business metrics; GMV, revenue, supply/demand, CAC/LTV; compliance and risk summary; budget and forecast. | Leadership; finance; growth; product. |
| **Quarterly strategy review** | Quarterly | Progress vs roadmap and 24-month plan; market expansion; product and AI roadmap; strategic bets and resources. | Leadership; key product and growth; optional board. |

## Use of data

- **Founder Command Center** and internal dashboards are the source for metrics; same definitions and filters across reviews. Action items and owners are recorded; follow-up in next review.

---

# Section 14 — Platform Evolution

## How the platform evolves over time

The platform improves through **product, AI, expansion, and innovation** while staying aligned with mission and operations.

## Levers

| Lever | Description |
|------|-------------|
| **Feature improvements** | Prioritized by product and leadership from support feedback, ops pain points, and strategy; delivered in sprints; communicated to users and support. |
| **AI model improvements** | New data and feedback improve fraud, pricing, ranking, and recommendations; retraining and rollout per AI ops; human-in-the-loop and override preserved. |
| **Market expansion** | New markets per [24-Month Scaling Roadmap](24-MONTH-SCALING-ROADMAP.md); each launch uses the same readiness checklist and playbook. |
| **Product innovation** | New modules or experiences (e.g. deal marketplace, analytics, travel) per strategy; piloted and rolled out with ops, compliance, and support readiness. |

## Governance

- **Roadmap** is owned by product and leadership; **ops, T&S, support, and compliance** are consulted for operational impact and readiness. **Platform Defense** and **compliance** remain non-negotiable for every change that touches users, payments, or data.

---

# Section 15 — Operating Principles

## Guiding principles for running the platform

All teams should operate according to these principles when making daily decisions.

| Principle | Meaning |
|-----------|---------|
| **Prioritize trust** | Verification, transparency, and fair enforcement come before short-term growth or revenue. |
| **Maintain transparency** | Fees, policies, and material changes are clear to users; internal decisions affecting users are documented and reviewable. |
| **Protect users** | Safety, privacy, and fair treatment of guests, hosts, brokers, and partners are paramount. |
| **Scale responsibly** | Growth and expansion only when operations, T&S, and compliance can support the new load and market. |
| **Automate where possible** | Use AI and product to reduce manual work and improve consistency—but keep human oversight and override for high-stakes decisions. |
| **Keep governance strong** | Policy engine, Platform Defense, compliance, and audit trails are maintained and used; no bypassing for convenience. |

## Applying the principles

- **Disputes and enforcement:** Prefer policy and evidence over speed; document reasons; allow appeal.
- **Expansion:** Launch new markets only when readiness checklist is satisfied and compliance is in place.
- **Revenue and growth:** Do not compromise trust or compliance for GMV or growth targets.
- **Crisis:** In major incidents, protect users and the platform first; then restore service and learn.

---

# Document control

- **Owner:** Leadership / Operations.
- **Audience:** Founders, platform ops, trust & safety, support, growth, compliance, and relevant product and engineering leads.
- **Related docs:** [Platform Mission](vision/PLATFORM-MISSION.md), [Platform Defense](defense/PLATFORM-DEFENSE.md), [Founder Command Center](FOUNDER-COMMAND-CENTER.md), [90-Day Execution Plan](90-DAY-EXECUTION-PLAN.md), [24-Month Scaling Roadmap](24-MONTH-SCALING-ROADMAP.md), [Montreal Launch Playbook](launch/LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md).
- **Review:** Update when org structure, playbooks, or major processes change; at least annually.
