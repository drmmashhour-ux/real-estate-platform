# LECIPM Founder Command Center — Dashboard Design

**Executive dashboards for real-time platform monitoring**

This document defines the **Founder Command Center**: five dashboards plus a top-level layout that allow founders and leadership to monitor marketplace health, revenue, growth, trust & safety, and product experience in one place. Metrics are chosen to be **actionable** and **decision-oriented**; complexity is minimized.

---

# Command Center Layout

## Structure

The Founder Command Center is a **single entry view** (e.g. `/admin/command-center` or `/founder`) with:

| Element | Description |
|---------|-------------|
| **Top-level executive summary panel** | 5–8 headline KPIs (e.g. GMV, bookings today, active listings, revenue MTD, dispute rate, new hosts this week). One number per card; optional sparkline. Visible without scrolling. |
| **Links to each dashboard** | Five tiles or nav items: Marketplace Health, Revenue & Financial, Supply & Growth, Trust & Safety & Risk, Product & UX. One click to full dashboard. |
| **Market filters** | Global filter: All markets, or single market (e.g. Montreal, Toronto). Persisted in session; applied to all dashboards when set. |
| **Time filters** | Presets: Today, Last 7 days, Last 30 days, MTD, QTD, YTD. Applied to all dashboards; default Last 7 days or MTD for financial. |
| **Anomaly alerts** | Small alert strip or sidebar: e.g. "Payment success rate below 95%", "Dispute backlog > 24h", "Fraud alerts spike". Click-through to relevant dashboard or incident. |
| **Trend graphs** | On the summary panel or first dashboard: 1–2 trend charts (e.g. GMV last 30 days, Bookings last 30 days) so leadership sees direction at a glance. |

## Access and permissions

- **Role:** Restricted to founder / executive role (e.g. `founder`, `executive`, or specific admin permission).
- **Audit:** Viewing the Command Center can be logged (e.g. via Platform Defense or admin audit) for compliance.

---

# Dashboard 1 — Marketplace Health

## Purpose

Monitor **core marketplace activity** so leadership can see whether the flywheel (listings → search → bookings) is healthy and where to act.

## Metrics

| Metric | Definition | Why it matters |
|--------|------------|----------------|
| **Total active listings** | Count of listings with status = live in selected market(s) and time window. | Core supply; trend indicates supply growth or churn. |
| **New listings per day** | Listings created (or went live) per day. | Supply velocity; drop may indicate onboarding or product issues. |
| **Listings by market** | Active listings grouped by market (if multi-market). | Balance of supply across markets; expansion progress. |
| **Search volume** | Searches or search sessions per day. | Demand signal; correlates with marketing and discovery. |
| **Search-to-booking conversion rate** | (Bookings / Search sessions) or (Bookings / Detail views) in period. | Funnel health; low rate suggests UX, pricing, or supply quality. |
| **Bookings per day** | Completed bookings per day (or created, depending on product). | Core activity; primary driver of GMV and revenue. |
| **Cancellation rate** | Cancelled bookings / Total bookings in period. | High rate can indicate trust, policy, or product issues. |
| **Average listing rating** | Mean rating of listings with ≥1 review. | Quality signal; affects conversion and trust. |
| **Host response time** | Median time to first host response to guest message (e.g. last 7 days). | Guest experience and conversion; slow response hurts bookings. |

## How these indicate marketplace health

- **Supply:** Active listings and new listings per day show whether supply is growing and stable.
- **Demand:** Search volume and bookings per day show engagement and transaction volume.
- **Efficiency:** Search-to-booking conversion shows how well the product turns interest into transactions.
- **Quality:** Rating and cancellation rate indicate satisfaction and friction; host response time is a leading indicator of experience.

**Red flags:** Falling listings, flat or declining search, dropping conversion, rising cancellation rate, or declining ratings warrant immediate review.

## Example widgets

| Widget | Content | Chart type |
|--------|---------|------------|
| **Active listings** | Single number + sparkline (last 30 days) | KPI card + line |
| **New listings per day** | Bar chart by day (last 14 days) | Bar |
| **Listings by market** | Horizontal bar or table (market, count) | Bar / table |
| **Search volume** | Line chart by day | Line |
| **Search-to-booking conversion** | Single number + prior period comparison | KPI card |
| **Bookings per day** | Line or bar by day | Line / bar |
| **Cancellation rate** | Single number + trend | KPI card + line |
| **Average listing rating** | Single number + distribution (optional) | KPI card |
| **Host response time** | Single number (e.g. median hours) + trend | KPI card |

## Update frequency

- **Real-time or near real-time:** Active listings, bookings per day (if high volume).
- **Every 15–60 minutes:** Search volume, conversion, new listings, cancellation rate.
- **Daily:** Rating and host response time (often computed in batch).

**Recommended:** Refresh every 15–30 minutes for the summary; full dashboard on load and on filter change.

---

# Dashboard 2 — Revenue and Financial Performance

## Purpose

Track **financial performance** so leadership can see revenue, GMV, and key flows (commissions, subscriptions, promotion, refunds, payouts).

## Metrics

| Metric | Definition | Why it matters |
|--------|------------|----------------|
| **Gross marketplace volume (GMV)** | Sum of booking value (or transaction value) in period. | Scale of marketplace activity; base for commission revenue. |
| **Platform revenue** | Total revenue (all streams) in period. | Top-line performance. |
| **Booking commission revenue** | Revenue from guest + host fees on BNHub (or short-term) bookings. | Core accommodation revenue. |
| **Real estate commission revenue** | Revenue from sale/long-term lease commissions. | Real estate segment contribution. |
| **Subscription revenue** | MRR or period revenue from broker CRM, owner, analytics subscriptions. | Recurring revenue; predictability. |
| **Promotion revenue** | Revenue from promoted listings and paid visibility. | Diversification and yield per listing. |
| **Refund volume** | Total refunded amount in period. | Risk and satisfaction; high refunds can indicate issues. |
| **Payout volume** | Total amount paid out to hosts (and brokers if applicable) in period. | Cash flow and partner satisfaction. |
| **Revenue by market** | Platform revenue (or GMV) grouped by market. | Geographic mix; expansion contribution. |

## How these indicate financial health

- **Scale:** GMV and platform revenue show growth and size.
- **Mix:** Commission vs subscription vs promotion shows business model balance and diversification.
- **Risk:** Refund volume and rate (refund / GMV) indicate dispute and satisfaction pressure.
- **Liquidity:** Payout volume and success rate (from ops) ensure hosts are paid on time.

**Red flags:** GMV up but revenue flat (take rate issue); rising refund rate; payout failures or delays.

## Example widgets

| Widget | Content | Chart type |
|--------|---------|------------|
| **GMV** | Single number (period) + sparkline (daily or weekly) | KPI card + line |
| **Platform revenue** | Single number (period) + prior period % change | KPI card |
| **Revenue by stream** | Stacked bar or pie: booking, real estate, subscription, promotion | Stacked bar / donut |
| **Booking commission revenue** | Single number + trend | KPI card |
| **Subscription revenue (MRR)** | Single number + growth % | KPI card |
| **Refund volume** | Single number + refund rate % of GMV | KPI card |
| **Payout volume** | Single number + success rate if available | KPI card |
| **Revenue by market** | Bar or table by market | Bar / table |

## Update frequency

- **Daily:** GMV, revenue, refunds, payouts (often from daily batch or finance system).
- **Real-time optional:** Revenue counter if transactions are streamed.

**Recommended:** Daily refresh; MTD/QTD/YTD on demand via time filter.

---

# Dashboard 3 — Supply and Growth

## Purpose

Monitor **platform growth** so leadership can see supply acquisition, activation, and expansion progress.

## Metrics

| Metric | Definition | Why it matters |
|--------|------------|----------------|
| **New hosts onboarded** | New accounts with host role (or first listing created) per period. | Supply pipeline. |
| **New brokers onboarded** | New broker accounts per period. | Professional supply and B2B growth. |
| **Referral conversions** | Signups or activated listings attributed to referral program. | Effectiveness of referral channel. |
| **Listing growth rate** | (New listings in period / Listings at start of period) or week-over-week. | Supply velocity. |
| **Host activation rate** | % of new hosts who create at least one live listing within N days (e.g. 14). | Onboarding and product effectiveness. |
| **Broker activity rate** | % of brokers with at least one listing or one action in period. | Engagement of broker segment. |
| **Market expansion progress** | Listings or revenue by market; new markets “launched” in period. | Geographic scaling. |

## How these guide growth strategy

- **Acquisition:** New hosts and brokers show pipeline; referral conversions show channel ROI.
- **Activation:** Host and broker activity rates show whether onboarding and product are converting signups into supply.
- **Expansion:** Market-level metrics show where to double down or expand next.

**Actions:** Low activation → improve onboarding or product; low referral conversion → tune incentives or targeting; uneven markets → adjust growth investment.

## Example widgets

| Widget | Content | Chart type |
|--------|---------|------------|
| **New hosts (period)** | Single number + bar chart by week | KPI card + bar |
| **New brokers (period)** | Single number + trend | KPI card |
| **Referral conversions** | Single number + conversion rate (referral → listing) | KPI card |
| **Listing growth rate** | Single number % + prior period comparison | KPI card |
| **Host activation rate** | Single number % (e.g. 14-day) + trend | KPI card |
| **Broker activity rate** | Single number % + trend | KPI card |
| **Market expansion** | Table: market, listings, hosts, revenue (or map) | Table / map |

## Update frequency

- **Daily:** New hosts, brokers, referral conversions, activation rates.
- **Weekly:** Growth rates and market summary.

**Recommended:** Daily refresh; weekly for activation and activity rates (cohort-based).

---

# Dashboard 4 — Trust, Safety, and Risk

## Purpose

Monitor **platform risk** so leadership can see fraud, disputes, incidents, and enforcement and act before issues escalate.

## Metrics

| Metric | Definition | Why it matters |
|--------|------------|----------------|
| **Fraud alerts** | Count of fraud signals or high-risk flags in period; optional by severity. | Fraud pressure; trend and spikes need review. |
| **Dispute rate** | Disputes / Bookings in period. | Conflict level; high rate may indicate product or policy issues. |
| **Incident reports** | Count of safety or policy incidents reported. | Safety and compliance exposure. |
| **Chargebacks** | Count and/or value of chargebacks in period. | Payment and fraud risk; dispute resolution quality. |
| **Account suspensions** | Count of accounts suspended in period. | Enforcement volume; repeat or spike may need policy review. |
| **Listing flags** | Count of listings flagged (moderation or user) in period. | Content and quality risk. |
| **Payout holds** | Count (and optional value) of payouts held for risk review. | Financial and fraud control; backlog risk. |
| **Repeat offenders** | Count of users with multiple abuse signals or enforcement actions. | Abuse concentration; need for stronger controls. |

## How these indicate safety levels

- **Fraud:** Alerts and chargebacks show financial and identity risk; payout holds show defensive actions.
- **Conflict:** Dispute rate and incident reports show user friction and safety.
- **Enforcement:** Suspensions and repeat offenders show platform discipline and abuse patterns.

**Red flags:** Spike in fraud alerts, rising dispute rate, chargeback spike, growing backlog of payout holds or disputes.

## Example widgets

| Widget | Content | Chart type |
|--------|---------|------------|
| **Fraud alerts** | Single number + trend (last 30 days) + by severity | KPI card + line |
| **Dispute rate** | Single number % + trend | KPI card |
| **Incident reports** | Single number + trend | KPI card |
| **Chargebacks** | Count + value + rate vs GMV | KPI card |
| **Account suspensions** | Single number + trend | KPI card |
| **Listing flags** | Single number + resolution rate | KPI card |
| **Payout holds** | Count + value (open) | KPI card |
| **Repeat offenders** | Single number or table (top N) | KPI card / table |

## Update frequency

- **Near real-time or hourly:** Fraud alerts, new disputes, new incidents (for alerting).
- **Daily:** Chargebacks, suspensions, flags, payout holds, repeat offenders.

**Recommended:** Alerts refreshed frequently; dashboard daily with optional real-time for alerts count.

---

# Dashboard 5 — Product and User Experience

## Purpose

Monitor **user satisfaction and usability** so leadership can see retention, completion, and support load and prioritize product improvements.

## Metrics

| Metric | Definition | Why it matters |
|--------|------------|----------------|
| **User retention** | % of users (guests or hosts) active in period who were also active in prior period; or cohort retention. | Stickiness and product fit. |
| **Booking completion rate** | Completed bookings / Created bookings in period. | Funnel quality; drop-off and cancellations. |
| **Time to first booking** | Median days from guest signup to first booking (for new guests). | Friction and conversion. |
| **Search success rate** | % of search sessions that lead to at least one detail view or booking. | Discovery and relevance. |
| **Support ticket volume** | Tickets opened per day or per week. | Load and friction; spike may indicate incident or UX issue. |
| **Average support resolution time** | Median time from ticket open to close. | Support efficiency and backlog risk. |
| **User satisfaction scores** | NPS or CSAT (if collected) for guests and/or hosts. | Satisfaction and loyalty. |

## How these help improve the platform

- **Retention:** Low retention suggests churn drivers (experience, value, or competition).
- **Completion:** Low booking completion or long time to first booking suggests friction in funnel or trust.
- **Search:** Low search success rate suggests ranking, filters, or supply gaps.
- **Support:** High volume or long resolution time suggests product or process improvements.

**Actions:** Prioritize fixes for steps with highest drop-off; invest in support capacity or self-serve if volume is high.

## Example widgets

| Widget | Content | Chart type |
|--------|---------|------------|
| **User retention** | Single number % (e.g. 30-day) + trend or cohort view | KPI card + line |
| **Booking completion rate** | Single number % + trend | KPI card |
| **Time to first booking** | Median days + distribution (optional) | KPI card |
| **Search success rate** | Single number % + trend | KPI card |
| **Support ticket volume** | Bar or line by day/week | Bar / line |
| **Avg resolution time** | Single number (hours) + trend | KPI card |
| **User satisfaction** | NPS or CSAT number + trend | KPI card |

## Update frequency

- **Daily:** Retention, completion rate, time to first booking, search success (batch).
- **Real-time or hourly:** Support volume and resolution time (if ticketing system allows).

**Recommended:** Daily for behavioral metrics; support metrics as often as ticket system permits.

---

# Summary: Dashboard Quick Reference

| Dashboard | Primary purpose | Key metrics | Default time range |
|-----------|-----------------|-------------|---------------------|
| **Marketplace Health** | Core activity and flywheel | Listings, search, conversion, bookings, cancellation, rating, host response | Last 7 days |
| **Revenue & Financial** | Financial performance | GMV, revenue by stream, refunds, payouts, by market | MTD / Last 30 days |
| **Supply & Growth** | Growth and expansion | New hosts/brokers, referrals, activation, listing growth, markets | Last 30 days |
| **Trust & Safety & Risk** | Risk and safety | Fraud, disputes, incidents, chargebacks, suspensions, flags, holds | Last 7–30 days |
| **Product & UX** | Satisfaction and usability | Retention, completion, time to first booking, search success, support | Last 30 days |

---

# Implementation notes

- **Data sources:** Metrics should be sourced from existing systems (bookings, payments, listings, disputes, fraud, support). Use analytics/reporting DB or data warehouse if available; otherwise aggregate from operational DB with care for performance.
- **Consistency:** Use same market and time filters across all dashboards; same definitions for “booking”, “listing”, “host” in every view.
- **Mobile:** Executive summary and key KPIs should be readable on tablet/mobile; full dashboards can be desktop-first.
- **Export:** Optional export (CSV or PDF) for revenue and growth dashboards for board or investor reporting.
- **Alerts:** Anomaly alerts (e.g. conversion drop, fraud spike, payment failure rate) can be driven by the same metrics with thresholds; link from alert to the relevant dashboard and time range.

---

*This design aligns with the [Platform Architecture Deck](PLATFORM-ARCHITECTURE-DECK.md), [90-Day Execution Plan](90-DAY-EXECUTION-PLAN.md), [24-Month Scaling Roadmap](24-MONTH-SCALING-ROADMAP.md), and existing admin/executive surfaces. Implement under `/admin/command-center` or equivalent with role-based access.*
