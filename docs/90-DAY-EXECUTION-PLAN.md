# LECIPM 90-Day Execution Plan

**Structured plan to launch the first operational pilot market (Montreal)**

This document converts the platform architecture into concrete, week-by-week actions across product, engineering, operations, trust & safety, and market launch. It aligns with the [Montreal Launch Playbook](launch/LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md), [Build Order](engineering/LECIPM-BUILD-ORDER.md), and [Platform Architecture Deck](PLATFORM-ARCHITECTURE-DECK.md).

---

# Section 1 — Launch Objective

## Objective of the first 90 days

The primary objective is to **launch the first operational pilot market (Montreal)** in a controlled, repeatable way—proving that the platform can run end-to-end with real supply, demand, and operations.

### Goals

| Goal | Description |
|------|-------------|
| **Complete core product build** | Authentication, users, listings, search, booking, payments, messaging, and reviews are production-ready for the pilot scope. Host dashboard, admin tools, and basic trust & safety workflows are live. |
| **Onboard first listings and hosts** | A minimum viable supply of verified listings (e.g. 50–100+ for soft launch, scaling toward 150–300+ by day 90) and active hosts in Greater Montreal. |
| **Onboard brokers** | First broker accounts created; CRM and marketplace value demonstrated; brokers can list or refer supply. |
| **Run the first successful booking transactions** | End-to-end flow: guest searches → books → pays → stay (or simulated) → review. Payment capture and host payout (or scheduled payout) verified. |
| **Validate operational workflows** | Support, moderation, dispute handling, and trust & safety run in production; SLAs and escalation paths tested. |
| **Prepare for market expansion** | Pilot metrics, playbooks, and runbooks documented so the same model can be applied to the next city or region. |

### Outcome

By day 90, the platform has **real listings, real (or pilot) bookings, real payments**, and **operational confidence** to scale supply, demand, and geography.

---

# Section 2 — Launch Success Metrics

## Measurable success indicators

Track these from day 1; report weekly.

| Metric | Target (by day 90) | Measurement |
|--------|--------------------|-------------|
| **Listings onboarded** | 100–300+ live BNHub listings in pilot region | Count of listings with status = live in pilot market |
| **Active hosts** | 50–150+ hosts with at least one live listing | Unique host accounts with ≥1 live listing |
| **Brokers onboarded** | 10–30+ broker accounts | Broker role accounts created and verified |
| **Successful bookings completed** | 20–100+ completed (or pilot) bookings | Bookings in status completed (or pilot-equivalent) |
| **Payment success rate** | ≥ 95% | (Successful charges / Attempted charges) × 100 |
| **Payout success rate** | ≥ 98% | (Successful payouts / Scheduled payouts) × 100 |
| **Dispute resolution time** | Median &lt; 72 hours to first response, &lt; 7 days to resolution | From dispute opened to closed |
| **Support response time** | Median &lt; 4 hours (business hours) | First response to ticket |
| **Listing approval time** | Median &lt; 24–48 hours | From submit for review to approved/rejected |
| **Search-to-book conversion** | Baseline established; improve week over week | (Bookings / Search sessions) or similar |
| **Host/guest satisfaction** | Qualitative feedback; NPS or satisfaction score optional | Survey or support feedback |

### Reporting cadence

- **Daily:** Listings live, new bookings, payment/payout success, critical incidents.
- **Weekly:** All metrics above; trends and blockers.
- **End of each 30-day block:** Formal review against targets and go/no-go for next phase.

---

# Section 3 — Team Streams

## Operational teams and roles during launch

| Stream | Role during launch |
|--------|---------------------|
| **Engineering** | Deliver and stabilize core product: auth, listings, search, booking, payments, messaging, reviews, host dashboard, admin/moderation, trust & safety workflows, dispute system, payouts. Deploy to staging then production; fix critical bugs; support on-call if defined. |
| **Product** | Prioritize pilot scope; define and lock MVP flows (search, book, pay, host dashboard, admin). Accept/reject scope changes; align engineering and operations on workflows; own success metrics and product backlog. |
| **Design** | Finalize pilot UX for guest and host flows; ensure consistency with design system. Support any last-mile changes for onboarding, checkout, and support flows. |
| **Trust & Safety** | Define and run verification, moderation, dispute, and enforcement workflows. Train ops and support on policies; monitor fraud and abuse signals; own dispute resolution time and quality. |
| **Operations** | Execute host and broker onboarding; listing approval; booking and payment monitoring. Own operational playbooks, support workflows, and escalation paths. Coordinate with Growth on supply targets. |
| **Growth** | Recruit hosts and brokers; source initial listings; run referral and pilot marketing. Own supply and demand targets; feed feedback to Product and Operations. |
| **Customer Support** | Handle guest and host inquiries; triage disputes and incidents to Trust & Safety; document common issues and FAQs. Own response time and satisfaction. |

### Coordination

- **Weekly launch sync:** All streams; metrics, blockers, and next-week priorities.
- **Product/Engineering:** Sprint or bi-weekly planning; scope strictly aligned to 90-day milestones.
- **Operations/Growth/Support:** Shared playbooks (onboarding, moderation, disputes, escalation).

---

# Section 4 — Days 1–30 (Platform Foundation)

## Focus: Minimal operational product ready for supply onboarding

### Weekly breakdown

| Week | Theme | Key outcomes |
|------|--------|----------------|
| **Week 1 (Days 1–7)** | Environment & auth | Staging stable; auth and user system production-ready; roles (guest, host, broker, admin) enforced. |
| **Week 2 (Days 8–14)** | Listings & search | Listings CRUD and moderation flow live; search and discovery working; image upload and basic filters. |
| **Week 3 (Days 15–21)** | Booking & payments | Booking engine and availability; payment capture (guest charge); refund flow; booking confirmation. |
| **Week 4 (Days 22–30)** | Messaging, reviews, staging deploy | Messaging and reviews integrated; staging fully deployable; host onboarding materials and support workflows drafted. |

---

### Engineering tasks (Days 1–30)

| Task | Owner | By when |
|------|--------|---------|
| Finalize authentication and user systems (register, login, roles, profile) | Engineering | Week 1 |
| Deploy and stabilize staging environment; CI/CD and env config | Engineering | Week 1 |
| Complete listings system (create, edit, media, status, moderation) | Engineering | Week 2 |
| Complete search and discovery (index, filters, geo, availability) | Engineering | Week 2 |
| Finalize booking engine (availability check, create booking, confirm, cancel) | Engineering | Week 3 |
| Integrate payment processing (guest charge, receipt, refund) | Engineering | Week 3 |
| Enable messaging (threads, send, basic moderation hook) | Engineering | Week 4 |
| Enable reviews (submit, display, moderation hook) | Engineering | Week 4 |
| Host-facing listing management (view/edit own listings, status) | Engineering | Week 4 |

---

### Operations tasks (Days 1–30)

| Task | Owner | By when |
|------|--------|---------|
| Prepare host onboarding materials (how to list, verify, set availability) | Operations | Week 2 |
| Prepare broker onboarding materials (CRM value, listing process) | Operations | Week 2 |
| Build support workflows (ticketing, triage, escalation to T&S) | Operations / Support | Week 3 |
| Define moderation workflows (listing review, approve/reject, SLA) | Trust & Safety / Ops | Week 3 |
| Define pilot market config (Montreal region, currency CAD, language) | Operations / Product | Week 1 |
| Draft runbooks for payment failure, booking conflict, verification failure | Operations | Week 4 |

---

### Growth tasks (Days 1–30)

| Task | Owner | By when |
|------|--------|---------|
| Recruit early hosts (outreach list, criteria, incentives if any) | Growth | Week 2–4 |
| Recruit early brokers (partner list, value proposition) | Growth | Week 2–4 |
| Identify initial listings (target 20–50 potential listings by day 30) | Growth | Week 3–4 |
| Set up pilot landing page / signup flow for hosts and brokers | Growth / Product | Week 4 |

---

# Section 5 — Days 31–60 (Marketplace Activation)

## Focus: Activate supply and run first real transactions

### Weekly breakdown

| Week | Theme | Key outcomes |
|------|--------|----------------|
| **Week 5 (Days 31–37)** | Host dashboard & onboarding | Host dashboard live; first hosts onboarded; first listings submitted and approved. |
| **Week 6 (Days 38–44)** | Admin & trust & safety | Admin moderation tools in use; trust & safety workflows (verification, fraud checks) running; dispute system available. |
| **Week 7 (Days 45–51)** | First bookings & payouts | First real (or pilot) bookings completed; payment capture verified; payout system tested with at least one host payout. |
| **Week 8 (Days 52–60)** | Scale supply & stabilize | More listings and hosts; support and T&S handling real volume; referral program or pilot marketing live. |

---

### Engineering tasks (Days 31–60)

| Task | Owner | By when |
|------|--------|---------|
| Launch host dashboard (listings, bookings, revenue view, messages) | Engineering | Week 5 |
| Launch admin moderation tools (listing queue, approve/reject, user lookup) | Engineering | Week 5 |
| Enable trust & safety workflows (verification status, fraud signals, holds) | Engineering | Week 6 |
| Implement dispute system (create, message, attach evidence, resolve) | Engineering | Week 6 |
| Finalize payout system (schedule, amount, fees, payout to host) | Engineering | Week 7 |
| Policy acceptance and legal event logging for bookings | Engineering | Week 6 |
| Basic operational controls (e.g. listing freeze, payout hold) if needed | Engineering | Week 7 |
| Fix critical bugs from first transactions; improve error handling | Engineering | Week 7–8 |

---

### Operations tasks (Days 31–60)

| Task | Owner | By when |
|------|--------|---------|
| Onboard first hosts (invite, verify, train on listing creation) | Operations / Growth | Week 5 |
| Onboard first brokers (invite, verify, link to listings if applicable) | Operations / Growth | Week 5 |
| Approve listings per moderation workflow; hit target listing count | Operations / Trust & Safety | Week 5–8 |
| Monitor booking flows (success, failure, support issues) | Operations | Week 7–8 |
| Train support staff on booking, payment, dispute, and escalation | Operations / Support | Week 6 |
| Run first payout(s); verify amount and timing | Operations / Finance | Week 7 |
| Document all incidents and resolutions for playbook updates | Operations | Week 8 |

---

### Growth tasks (Days 31–60)

| Task | Owner | By when |
|------|--------|---------|
| Recruit additional listings (target 75–150+ live by day 60) | Growth | Week 5–8 |
| Launch referral program (structure, tracking, abuse checks) | Growth | Week 7 |
| Begin pilot marketing (e.g. Montreal-focused demand campaigns) | Growth | Week 7–8 |
| Collect early feedback from hosts and brokers | Growth / Product | Week 8 |

---

# Section 6 — Days 61–90 (Pilot Market Launch)

## Focus: Real marketplace activity and operational stability

### Weekly breakdown

| Week | Theme | Key outcomes |
|------|--------|----------------|
| **Week 9 (Days 61–67)** | Go-live & monitoring | Pilot “launch” declared; daily monitoring dashboard in use; all streams focused on stability and metrics. |
| **Week 10 (Days 68–74)** | Optimize & support | Search ranking and booking flow improvements; support and dispute handling at steady state. |
| **Week 11 (Days 75–81)** | Analytics & controls | Analytics dashboards and operational control tools in use; fraud and abuse monitored. |
| **Week 12 (Days 82–90)** | Review & expansion prep | 90-day metrics reviewed; pilot evaluation report; post-pilot expansion plan updated. |

---

### Engineering tasks (Days 61–90)

| Task | Owner | By when |
|------|--------|---------|
| Improve search ranking and relevance (pilot data) | Engineering | Week 9–10 |
| Optimize booking flows (speed, errors, mobile) | Engineering | Week 9–10 |
| Enable analytics dashboards (bookings, revenue, listings, key metrics) | Engineering | Week 11 |
| Deploy operational control tools (freezes, holds, admin overrides) | Engineering | Week 11 |
| Monitor system health (latency, errors, payment success); alerting | Engineering | Week 9–12 |
| Performance and load checks for current and near-term volume | Engineering | Week 10 |
| Address technical debt and bugs that block operations | Engineering | Ongoing |

---

### Operations tasks (Days 61–90)

| Task | Owner | By when |
|------|--------|---------|
| Monitor bookings daily; report and escalate anomalies | Operations | Week 9–12 |
| Handle disputes within SLA; document patterns | Operations / Trust & Safety | Week 9–12 |
| Monitor fraud signals; act on high-risk cases | Trust & Safety | Week 9–12 |
| Support hosts and guests (response time, satisfaction) | Support / Operations | Week 9–12 |
| Weekly operational summary and metrics to leadership | Operations | Week 9–12 |
| Complete pilot runbooks and handoff notes | Operations | Week 12 |

---

### Growth tasks (Days 61–90)

| Task | Owner | By when |
|------|--------|---------|
| Increase listing supply toward 150–300+ live in pilot | Growth | Week 9–12 |
| Expand marketing campaigns (demand) within pilot budget | Growth | Week 10–12 |
| Collect user feedback (hosts, guests, brokers); summarize for Product | Growth | Week 11–12 |
| Referral and partner pipeline for next market | Growth | Week 12 |

---

# Section 7 — Launch Monitoring Dashboard

## Metrics to monitor daily (and weekly)

Track on a **launch dashboard** (spreadsheet or internal tool) from day 31; daily review from day 61.

| Metric | Frequency | Owner | Notes |
|--------|-----------|--------|--------|
| **Daily bookings** | Daily | Operations | Count by status (completed, cancelled, pending). |
| **Search conversion rate** | Daily / weekly | Product | Sessions → search → booking (or funnel steps). |
| **Listing approval rate** | Weekly | Operations | Approved / (Approved + Rejected); time to decision. |
| **Booking cancellation rate** | Daily / weekly | Operations | Cancelled / Total bookings. |
| **Payment success rate** | Daily | Engineering / Operations | Successful charges / attempts. |
| **Payout success rate** | As payouts run | Operations / Finance | Successful payouts / scheduled. |
| **Dispute rate** | Weekly | Trust & Safety | Disputes / bookings; open vs resolved. |
| **Dispute resolution time** | Weekly | Trust & Safety | Median time to resolution. |
| **Fraud alerts** | Daily | Trust & Safety | Count and severity; actions taken. |
| **Host response time** | Weekly | Product / Operations | Time to first response to guest message (if tracked). |
| **Support ticket volume & response time** | Daily / weekly | Support | Open, resolved, median first response. |
| **System health** | Daily | Engineering | Uptime, error rate, latency (key endpoints). |

### Alerts

- Payment success rate &lt; 90%.
- Payout failure.
- Critical fraud or safety incident.
- System outage or severe degradation.
- Dispute or support backlog above threshold.

---

# Section 8 — Risk Management

## Launch risks and mitigation

| Risk | Mitigation |
|------|------------|
| **Low supply of listings** | Growth and Operations prioritize host recruitment from day 1; incentives or partner deals if needed; broker channel for supply; weekly supply targets and backup list. |
| **Fraud attempts** | Trust & Safety and Engineering: verification and fraud signals live by day 45; payout hold for high-risk; daily review of alerts; playbooks for common fraud patterns. |
| **Payment failures** | Strong integration testing; clear error handling and user messaging; support runbook; monitor success rate daily; escalate to payment provider if needed. |
| **Poor user experience** | Product owns pilot scope; no scope creep in 90 days; Design and Engineering focus on critical paths (search, book, pay); feedback loops from Support and Growth. |
| **Support overload** | Onboard support early; FAQs and runbooks; triage to T&S; consider tiered response (critical vs normal); temporary capacity increase if launch spike. |
| **Regulatory or compliance issue** | Legal and compliance review before launch; pilot market (Montreal) requirements documented; Platform Defense and compliance workflows used; legal contact for escalations. |
| **Key person or vendor dependency** | Document runbooks and decisions; cross-train Operations and Support; critical vendor contacts and SLAs documented. |

### Escalation

- **Critical:** Payment or safety incident → immediate T&S and leadership.
- **High:** Sustained payment failure, dispute backlog, or system outage → daily standoff until resolved.
- **Medium:** Supply below target, support backlog → weekly plan to correct.

---

# Section 9 — Pilot Evaluation

## How to evaluate the pilot market (by day 90)

Conduct a **pilot evaluation** (document or meeting) using the criteria below. Use it for go/no-go on expansion and for product/ops improvements.

| Dimension | Questions | Evidence |
|-----------|-----------|----------|
| **Product performance** | Are search, booking, payment, and host dashboard stable and usable? What are the main pain points? | Stability metrics, bug counts, user feedback, support tickets. |
| **Operational readiness** | Can we onboard, moderate, support, and pay at target volume? Are runbooks and SLAs met? | Ops metrics, SLA compliance, runbook usage. |
| **Host satisfaction** | Would hosts list again? What would they improve? | Feedback, NPS or survey (optional), retention. |
| **Guest satisfaction** | Would guests book again? How was checkout and support? | Feedback, reviews, support tickets. |
| **Transaction reliability** | Are payments and payouts reliable? Are disputes handled fairly and in time? | Payment/payout success rates, dispute resolution time, dispute rate. |
| **Trust and safety effectiveness** | Are verification, moderation, and fraud controls effective? Any critical safety or fraud failures? | Fraud alerts, verification coverage, moderation stats, incident log. |
| **Supply and demand** | Did we hit listing and booking targets? Is demand sufficient for next phase? | Success metrics from Section 2. |
| **Readiness for expansion** | Can we repeat this in another city with current playbooks and product? | Yes/no plus list of gaps to close before next market. |

### Deliverables

- **Pilot evaluation report** (short document) with scores or conclusions per dimension.
- **Lessons learned** and prioritized improvements for product, operations, and growth.
- **Go/no-go recommendation** for Phase 2 (e.g. next city or region) with conditions if “go.”

---

# Section 10 — Post-Pilot Expansion Plan

## After the first 90 days

Once the pilot evaluation is complete and go-ahead is given:

| Initiative | Description |
|------------|-------------|
| **Expand to additional cities** | Apply the same 90-day playbook to the next city (e.g. Toronto, Vancouver, or next region); reuse onboarding, ops, and support playbooks; adapt for local regulation and language. |
| **Scale host acquisition** | Increase recruitment budget and channels; broker and partner pipelines; referral program optimization; aim for higher listing targets per market. |
| **Improve AI systems** | Use pilot data to tune fraud, pricing, and search; expand AI-OS features (e.g. demand forecasting, better ranking); keep human-in-the-loop for high-stakes decisions. |
| **Strengthen monetization** | Confirm commission and fee capture in production; add or refine subscription tiers for brokers and owners; pilot promoted listings and analytics subscriptions. |
| **Prepare international markets** | Identify next country or region; regulatory and compliance prep; localization (currency, language, terms); integrate with Platform Defense and compliance layer. |
| **Product and ops hardening** | Address pilot evaluation gaps; reduce technical debt; improve dashboards, controls, and support tools; document and train for scale. |

### Timeline (illustrative)

- **Days 91–120:** Pilot evaluation and expansion prep; fix critical gaps.
- **Days 121–180:** Second market launch using this 90-day plan.
- **Ongoing:** AI, monetization, and international prep in parallel with market rollout.

---

# Summary: 90-day at a glance

| Phase | Days | Focus |
|-------|------|--------|
| **Platform foundation** | 1–30 | Auth, listings, search, booking, payments, messaging, reviews; staging; onboarding and support prep; early host/broker recruitment. |
| **Marketplace activation** | 31–60 | Host dashboard; admin and T&S; disputes and payouts; first real bookings; scale supply; referral and pilot marketing. |
| **Pilot market launch** | 61–90 | Go-live; monitoring; optimization; analytics and controls; 90-day review; pilot evaluation; expansion plan. |

---

*This plan aligns with [Montreal Launch Playbook](launch/LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md), [Build Order](engineering/LECIPM-BUILD-ORDER.md), and [Platform Architecture Deck](PLATFORM-ARCHITECTURE-DECK.md). Update targets and dates as the team and market conditions evolve.*
