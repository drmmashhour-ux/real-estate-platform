# LECIPM Founder Control Dashboard

**Single executive view: the ~20 critical metrics that determine platform health and success**

This document defines the **Founder Control Dashboard**: a daily executive view that summarizes the most important indicators of marketplace activity, revenue, growth, trust & safety, product experience, and platform health. It is a **focused subset** of the broader [Founder Command Center](FOUNDER-COMMAND-CENTER.md), optimized for founder daily review. Metrics are actionable and decision-oriented.

---

# Section 1 — Marketplace Activity

## Metrics that show whether the marketplace is active

| # | Metric | Definition | Why it matters |
|---|--------|-------------|----------------|
| 1 | **Total active listings** | Count of listings with status = live in selected market(s). | Core supply; trend shows whether inventory is growing or shrinking. |
| 2 | **New listings per week** | Listings created or went live in the last 7 days. | Supply velocity; a drop can signal onboarding or product issues. |
| 3 | **Active hosts** | Unique hosts with ≥1 live listing (or ≥1 booking in period). | Supply-side participation; retention and breadth of supply. |
| 4 | **Active brokers** | Brokers with account and activity (e.g. listing or CRM use) in period. | Professional supply and B2B health. |
| 5 | **Search volume** | Searches or search sessions in period. | Demand signal; correlates with marketing and discovery. |
| 6 | **Bookings per day** | Completed (or created) bookings per day. | Core transaction activity; primary driver of GMV. |
| 7 | **Booking conversion rate** | Bookings / Search sessions (or Detail views) in period. | Funnel health; low rate suggests UX, pricing, or supply quality. |

**Healthy state:** Listings and hosts trending up or stable; search and bookings growing; conversion rate stable or improving. **Act when:** Listings or bookings drop for 2+ days; conversion rate drops meaningfully week over week.

---

# Section 2 — Revenue Performance

## Metrics that show financial health

| # | Metric | Definition | How it indicates growth |
|---|--------|-------------|---------------------------|
| 8 | **Gross marketplace volume (GMV)** | Sum of booking/transaction value in period. | Scale of marketplace; base for commission revenue. |
| 9 | **Platform revenue** | Total revenue (all streams) in period. | Top-line performance; growth vs prior period. |
| 10 | **Booking commission revenue** | Revenue from guest + host fees on BNHub (or short-term) bookings. | Core accommodation revenue; scales with bookings. |
| 11 | **Subscription revenue** | MRR or period revenue from broker CRM, owner, analytics subscriptions. | Recurring revenue; predictability and diversification. |
| 12 | **Promoted listing revenue** | Revenue from paid visibility in search/discovery. | Yield per listing; optional stream. |
| 13 | **Average revenue per listing** | Platform revenue / Active listings (or per-listing commission + promotion). | Monetization efficiency; trend over time. |

**Healthy state:** GMV and platform revenue growing; subscription revenue and promoted revenue contributing; revenue per listing stable or improving. **Act when:** GMV up but revenue flat (take rate issue); revenue or GMV drop; subscription churn spike.

---

# Section 3 — Growth Indicators

## Metrics showing supply and demand growth

| # | Metric | Definition | What healthy growth looks like |
|---|--------|-------------|--------------------------------|
| 14 | **Host acquisition rate** | New host signups (or first listing) per week. | Steady or growing week over week; aligned with targets. |
| 15 | **Broker acquisition rate** | New broker accounts per week. | Positive trend; quality over pure volume. |
| 16 | **Referral conversions** | Signups or activated listings attributed to referral program. | Conversions growing; cost per conversion acceptable. |
| 17 | **Listing growth rate** | (New listings in period / Listings at start) or week-over-week % change. | Positive; sustainable with ops capacity. |
| 18 | **User activation rate** | % of new guests (or hosts) who complete first booking (or first live listing) within N days. | Benchmark and improve over time; drop signals friction. |

**Healthy state:** Acquisition and activation rates on or above plan; referral ROI positive; listing growth without unsustainable ops load. **Act when:** Activation rate drops; acquisition cost spikes; growth lags targets for 2+ weeks.

---

# Section 4 — Trust and Safety Indicators

## Metrics that monitor risk

| # | Metric | Definition | Thresholds that indicate risk |
|---|--------|-------------|-------------------------------|
| 19 | **Fraud alerts per week** | Count of fraud signals or high-risk flags in last 7 days. | Spike vs baseline; sustained high volume needs review. |
| 20 | **Dispute rate** | Disputes / Bookings in period. | Rising trend or above target (e.g. >2–3%); backlog growing. |
| 21 | **Chargebacks** | Count and/or value of chargebacks in period. | Spike vs prior period; rate vs GMV above benchmark. |
| 22 | **Listing flags** | Listings flagged (moderation or user) in period. | Sudden increase; resolution rate falling. |
| 23 | **Account suspensions** | Accounts suspended in period. | Spike may indicate abuse wave or policy issue. |

**Healthy state:** Alerts and dispute rate stable or declining; chargebacks low; flags and suspensions handled within SLA. **Act when:** Any metric spikes; dispute backlog >24h; chargeback rate above acceptable (e.g. >0.5% of GMV); fraud loss material.

---

# Section 5 — Product Experience

## Metrics showing user experience quality

| # | Metric | Definition | How they guide product improvements |
|---|--------|-------------|-------------------------------------|
| 24 | **Booking completion rate** | Completed bookings / Created bookings in period. | Low rate → identify drop-off (payment, UX, trust); improve funnel. |
| 25 | **Cancellation rate** | Cancelled bookings / Total bookings. | High rate → policy, communication, or trust; refine policies and UX. |
| 26 | **Host response time** | Median time to first host response to guest message. | Slow → prompts, nudges, or host quality; target e.g. <24h. |
| 27 | **Support ticket volume** | Tickets opened per day or week. | Spike → incident or UX issue; categorize and fix root cause. |
| 28 | **Average support resolution time** | Median time from ticket open to close. | Rising → capacity or complexity; add capacity or self-serve. |

**Healthy state:** Completion rate high; cancellation and ticket volume stable; resolution time within target. **Act when:** Completion or cancellation worsens; ticket volume or resolution time spikes; negative feedback trend.

---

# Section 6 — Platform Health

## Metrics that monitor technical stability

| # | Metric | Definition | How they indicate system health |
|---|--------|-------------|----------------------------------|
| 29 | **Platform uptime** | % of time core services are available (e.g. 99.9%). | Below target → incidents; root cause and prevent recurrence. |
| 30 | **API response times** | p50/p95 latency for key APIs (e.g. search, booking, payment). | Degradation → performance regression or load; optimize or scale. |
| 31 | **Payment success rate** | Successful charges / Attempted charges. | Below threshold (e.g. 95%) → integration or provider issue; immediate fix. |
| 32 | **Search performance** | Search latency or error rate. | Degradation → discovery and conversion suffer; fix quickly. |

**Healthy state:** Uptime at or above target; latency and error rates stable; payment success ≥95%. **Act when:** Uptime drop; latency or errors spike; payment success below 95%.

---

# Section 7 — Dashboard Layout

## How the Founder Control Dashboard should appear

### Top executive summary panel

- **5–7 headline numbers** visible without scrolling, e.g.:
  - Active listings
  - Bookings (today or last 7 days)
  - GMV (MTD or last 30 days)
  - Platform revenue (MTD or last 30 days)
  - Payment success rate
  - Dispute rate (or open disputes)
  - Fraud alerts (last 7 days)
- Each with **prior period comparison** (e.g. % change) and optional **sparkline** (last 7–30 days).
- **Single status indicator** if desired: e.g. “Healthy” / “Review” / “Critical” based on rules (e.g. payment success, dispute backlog, uptime).

### Grouped metric sections

- **Six sections** in order: Marketplace Activity → Revenue Performance → Growth Indicators → Trust and Safety → Product Experience → Platform Health.
- Each section: **3–7 metrics** as KPI cards (number + trend + optional sparkline).
- **Consistent format:** Same card style and density so the eye can scan quickly.

### Trend charts

- **1–2 summary trends** near the top: e.g. “Bookings last 30 days” and “Platform revenue last 30 days” (line or bar).
- **Section-level trends** where helpful: e.g. “Listings and hosts last 30 days” in Marketplace; “GMV and revenue last 30 days” in Revenue.
- **Time axis:** Default last 7 days or last 30 days; switchable via time filter.

### Alerts for abnormal values

- **Visual cues** when a metric crosses a threshold, e.g.:
  - Payment success rate < 95% → red or “Critical”
  - Dispute rate above target → amber
  - Fraud alerts spike (e.g. >2× 7-day average) → amber
  - Uptime < 99% → red
- **Alert strip or sidebar:** List of current alerts with link to relevant dashboard or runbook.
- **Optional:** Push or email for critical (e.g. payment success, major outage).

### Market filters

- **Global filter:** All markets or single market (e.g. Montreal, Toronto).
- **Persisted** in session; applied to all metrics that are market-scoped (listings, bookings, revenue, etc.).

### Time filters

- **Presets:** Today, Last 7 days, Last 30 days, MTD, QTD.
- **Default:** Last 7 days for activity/growth/safety; MTD or Last 30 days for revenue.
- Applied globally to the dashboard.

---

# Metric Count and Categories Summary

| Category | Metrics (count) | Metrics (#) |
|----------|------------------|-------------|
| Marketplace Activity | 7 | 1–7 |
| Revenue Performance | 6 | 8–13 |
| Growth Indicators | 5 | 14–18 |
| Trust and Safety | 5 | 19–23 |
| Product Experience | 5 | 24–28 |
| Platform Health | 4 | 29–32 |
| **Total** | **32** | (Dashboard can show ~20 “critical” by picking 3–4 per category or the top 20 by priority.) |

### The Founder Control 20 (recommended daily set)

For a **single executive view of ~20 critical metrics**, use this set:

| # | Metric | Category |
|---|--------|----------|
| 1 | Total active listings | Marketplace |
| 2 | New listings per week | Marketplace |
| 3 | Active hosts | Marketplace |
| 5 | Search volume | Marketplace |
| 6 | Bookings per day | Marketplace |
| 7 | Booking conversion rate | Marketplace |
| 8 | GMV | Revenue |
| 9 | Platform revenue | Revenue |
| 10 | Booking commission revenue | Revenue |
| 11 | Subscription revenue | Revenue |
| 14 | Host acquisition rate | Growth |
| 17 | Listing growth rate | Growth |
| 18 | User activation rate | Growth |
| 19 | Fraud alerts per week | Trust & Safety |
| 20 | Dispute rate | Trust & Safety |
| 21 | Chargebacks | Trust & Safety |
| 24 | Booking completion rate | Product |
| 25 | Cancellation rate | Product |
| 29 | Platform uptime | Platform Health |
| 31 | Payment success rate | Platform Health |

These 20 give a complete picture of **activity**, **revenue**, **growth**, **risk**, **experience**, and **stability** in one screen. Expand to full 32 (or Command Center) when drilling into a category.

---

# Suggested Update Frequency

| Metric type | Update frequency | Notes |
|-------------|-------------------|--------|
| **Real-time / near real-time** | Uptime, payment success, API latency, fraud alert count | For alerts and immediate response. |
| **Hourly** | Bookings per day, search volume, ticket volume | Good enough for daily review. |
| **Daily** | Listings, hosts, brokers, GMV, revenue, acquisition, activation, dispute rate, chargebacks, flags, suspensions, completion/cancellation, resolution time | Batch or hourly rollups; dashboard refreshed daily. |
| **Weekly** | Growth rates, referral conversions, some revenue breakdowns | Cohort or 7-day aggregates. |

**Recommendation:** Dashboard **refresh**: every 15–30 minutes for the summary panel; full load on open and when filters change. **Founder review:** once per day (e.g. morning); deep dives in Command Center when an indicator is off.

---

# Example Widgets and Chart Types

| Widget | Content | Chart type |
|--------|---------|------------|
| Active listings | Number + sparkline (30d) | KPI card + line |
| Bookings per day | Number + bar chart (14d) | KPI card + bar |
| GMV | Number (period) + % change | KPI card |
| Platform revenue | Number (period) + trend line | KPI card + line |
| Payment success rate | Number % + status (green/amber/red) | KPI card |
| Dispute rate | Number % + trend | KPI card |
| Fraud alerts | Number + trend (7d) | KPI card |
| Host acquisition rate | Number + prior week | KPI card |
| Booking conversion rate | Number % + trend | KPI card |
| Uptime | Number % + status | KPI card |

---

# Document control

- **Purpose:** Single executive view for founder daily review; ~20 critical metrics in 6 categories.
- **Related:** [Founder Command Center](FOUNDER-COMMAND-CENTER.md) (full dashboards), [Platform Operating Manual](PLATFORM-OPERATING-MANUAL.md) (who acts on metrics), [Control Blueprint](CONTROL-BLUEPRINT.md) (governance).
- **Implementation:** Implement under `/admin/command-center` or `/admin/founder-control` with role-based access; reuse existing metrics and APIs where available.
