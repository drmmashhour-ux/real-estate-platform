# LECIPM — 90-Day Domination Launch Plan

**Purpose:** Execution roadmap for product-led traction. **Premium brand = fewer users, higher intent**—targets are directional until baselines exist.

**Operating assumptions:** Canada-first wedge (Quebec density where applicable), web + mobile live, Stripe + Supabase configured for production paths.

---

## PHASE 1 — Days 1–30: Foundation + controlled launch

### Objectives
1. Ship **production-critical paths** without heroics at 2am (checkout, auth, core dashboards).
2. Run a **controlled soft launch**: invite-only testers, explicit success criteria per flow.
3. Wire **instrumentation + admin visibility** so decisions are data-backed on day 31.

### Weekly priorities

| Week | Focus |
|------|--------|
| **W1** | Freeze scope for **homepage → search → listing detail → primary CTA** (contact / save / share). BNHub: **search → listing → checkout funnel** smoke-tested on staging → prod. Fix P0 bugs only. |
| **W2** | **Lead unlock + broker CRM entry** path validated end-to-end. **Seller FSBO publish** happy path. **Admin**: revenue/movements/transactions visibility + **notification routing** verified (test event → email/SMS/push where enabled). |
| **W3** | **Mobile**: signed-in flows on real devices (iOS + Android); push token registration + one admin-facing notification proof. Load **first 15–25 invited users** with a shared Slack/WhatsApp feedback loop. |
| **W4** | **KPI baseline**: dashboards populated from analytics DB / events table (even if sparse). **Go/No-Go** checkpoint for Phase 2 scale. |

### Owner suggestions (roles)
| Area | Owner |
|------|--------|
| Product flows & acceptance tests | Founder / PM |
| Engineering cut line & deploy | Tech lead |
| Stripe / webhooks / payments idempotency | Backend owner |
| Mobile QA + TestFlight / internal distribution | Mobile owner |
| Admin ops + tester comms | Founder / Ops |
| Analytics events + naming convention | Growth + Eng |

### KPIs (Phase 1)
| KPI | Target (directional) |
|-----|---------------------|
| **P0/P1 bugs open** | Trend to **zero** blocking checkout, auth, listing view |
| **Core funnel completion rate** (invited testers) | **≥60%** complete primary CTA once detail viewed |
| **BNHub test booking success** (staging→prod dry run) | **100%** success on golden path |
| **Webhook processing error rate** | **<1%** of events or zero unresolved after 24h |
| **Events instrumented** (named events fired) | **≥25** distinct event names covering funnel |
| **Time-to-first-feedback** from testers | **<48h** from invite |

### Risks
| Risk | Mitigation |
|------|------------|
| Scope creep | Written **cut list** for Phase 1; everything else → backlog |
| Payment edge cases | Idempotent keys, webhook replay playbook, manual reconciliation doc |
| Tester silence | Concierge onboarding + **calendar office hours** twice weekly |
| Vanity metrics obsession | Instrument **activation**, not impressions |

### Checkpoints
- **D15:** Homepage/search/detail green on prod; BNHub golden path passes twice from two accounts.
- **D22:** Admin sees **today’s revenue/movements** from real or seeded-live test payments.
- **D30:** **Phase 1 retrospective**: documented bugs, funnel drop-offs, KPI baseline CSV exported.

---

## PHASE 2 — Days 31–60: Traction + repeatability

### Objectives
1. Reach **first ~100 meaningful users** (accounts with intent—not scrap signups).
2. Run **segment offers** (broker / host / seller / buyer / investor) with **one hypothesis per segment**.
3. Turn on **daily content** minimum viable output + collect **proof** (quotes, clips, logs).

### Weekly priorities

| Week | Focus |
|------|--------|
| **W5** | Segment landing pages or **UTM discipline** (`?utm_campaign=broker_qc`). Launch **broker lead unlock** pilot with **3 brokerages or 10 individual brokers**. |
| **W6** | **Hosts:** 10 BNHub listings with photos + pricing + calendar rules; host onboarding session recorded (Loom). |
| **W7** | **Sellers:** FSBO pilot—**5 listings live** with operator review; fix friction from seller wizard analytics. |
| **W8** | **Investors / power users:** curated demo + **portfolio/dashboard** narrative; capture **3 testimonial drafts** (written or audio). |

### Owner suggestions
| Stream | Owner |
|--------|--------|
| Acquisition & outreach copy | Founder + Growth |
| Partnerships (brokerages, operators) | Founder |
| Content calendar | Growth (see `growth-content-engine.md`) |
| Product fixes from funnel drop-off | PM + Eng rotation |
| CRM for leads (Notion/Airtable OK) | Ops |

### KPIs (Phase 2)
| KPI | Target |
|-----|--------|
| **New verified signups** | **≥100** cumulative from launch baseline (adjust if baseline differs) |
| **Activation:** completed primary hub action | **≥35%** of signups (broker unlock, listing publish, booking request, saved search—segment-specific) |
| **Paid events** (lead unlock, booking fee, listing fee—whatever is live) | **≥10** cumulative **or** documented blocker per segment |
| **Weekly active users (WAU)** | **≥30** by D60 |
| **Content outputs** | **≥20** posts/emails combined |
| **Testimonials / case blurbs** | **≥5** usable quotes |

### Risks
| Risk | Mitigation |
|------|------------|
| Spray-and-pray marketing | **One primary segment per week** emphasis |
| Bad first reviews | Concierge fixes **before** asking for public testimonial |
| Supply without demand | Balance host listing push with **buyer traffic** (content + ads micro-budget) |

### Checkpoints
- **D45:** Mid-phase review—kill underperforming channel, double manual outreach where reply rate wins.
- **D60:** **Segment scorecard**: which hub had best activation + revenue signal.

---

## PHASE 3 — Days 61–90: Domination posture

### Objectives
1. **Double down** on best channel + best hub from Phase 2 data.
2. **Conversion optimization**: reduce steps to paid or qualified lead.
3. **Retention loops**: saved searches, alerts, host calendar, broker pipeline touchpoints—**whatever exists in product**, wired to notifications where possible.
4. **Investor pack**: refresh deck with **real verified metrics only** + narrative on what’s next.

### Weekly priorities

| Week | Focus |
|------|--------|
| **W9** | Funnel teardown: top 3 drop-offs from analytics → **two shipped fixes**. |
| **W10** | **Scale winning channel** (e.g. LinkedOutreach OR paid micro-test OR partnerships—pick **one**). |
| **W11** | Retention: email/push journeys for **D3/D7/D14** active drop-offs (see playbook). |
| **W12** | **Investor traction memo**: KPI table, screenshots, roadmap Q2. Press-ready **one founder narrative** paragraph. |

### Owner suggestions
| Area | Owner |
|------|--------|
| Growth experiments | Founder + Growth |
| Product polish sprint | PM |
| Investor materials | Founder |
| Partnership expansion | Founder |

### KPIs (Phase 3)
| KPI | Target |
|-----|--------|
| **WoW signup growth** | Positive **or** stable with **higher activation %** |
| **Paid conversion rate** | +**20% relative** vs Phase 2 baseline (if payments live) |
| **D30 retention** (cohort from D31) | Define baseline at D60; aim **≥15%** returning session if product allows measurement |
| **Best hub revenue share** | Document which hub carries **majority** of paid events |
| **Investor-ready KPI sheet** | Single source of truth updated **weekly** |

### Risks
| Risk | Mitigation |
|------|------------|
| Premature “domination” PR | Only claim what metrics prove |
| Burnout | Weekly kill list; **no new hubs** unless Phase 3 KPIs green |

### Checkpoints
- **D75:** Winning channel gets **70%** of outbound time.
- **D90:** **90-day review deck**: metrics, lessons, Q2 plan—board/investor ready.

---

## Cross-phase disciplines (non-negotiable)

1. **Weekly metric review** (30 min): funnel + revenue + errors + top user complaint.
2. **Incident log** for payments/auth—resolved within SLA.
3. **Single analytics dictionary** (`launch-kpis-dashboard-spec.md`)—no arguing about definitions.
4. **Luxury tone**: outreach and content stay **short, precise, confident**—no gimmicks.

---

## Appendix — suggested standing meetings

| Cadence | Agenda |
|---------|--------|
| Daily 15 min | Deploys, incidents, blocker |
| Weekly | KPI review + experiment results |
| Monthly | Investor update draft (even if private) |
