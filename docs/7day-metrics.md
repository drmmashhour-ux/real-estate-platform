# 7-Day metrics tracker — BNHub / LECIPM

Copy this table into **Sheets**, **Notion**, or a GitHub wiki—update **once per day** (evening). Keep definitions stable for 7 days so numbers are comparable.

**Plan:** **`7day-execution-plan.md`**

---

## Definitions (set on Day 0)

| Metric | How you count it |
|--------|------------------|
| **Users** | Unique signups (email verified if you require it) or accounts created. |
| **Listings** | Published, bookable listings in launch geography. |
| **Hosts onboarded** | Hosts with ≥1 live listing OR completed onboarding checklist. |
| **Bookings attempted** | Checkout started (payment step reached) or “Request to book” submitted. |
| **Bookings completed** | Paid or confirmed reservation in your system. |
| **Sessions (traffic)** | Analytics sessions; use UTM `7day-d4` for social if possible. |

**Conversion rates (calculate when you have volume):**

- `signup_rate = signups / sessions` (landing or home)
- `view_to_attempt = bookings_attempted / listing_detail_views` (or proxy: unique listing views)
- `attempt_to_complete = bookings_completed / bookings_attempted`

---

## Daily log (template)

| Day | Date | Users (cum.) | Listings (cum.) | Hosts (cum.) | Bookings attempted | Bookings completed | Sessions | Notes / learnings |
|-----|------|--------------|-----------------|--------------|---------------------|-------------------|----------|-------------------|
| 0 baseline | | | | | | | | Starting counts |
| 1 | | | | | | | | |
| 2 | | | | | | | | |
| 3 | | | | | | | | |
| 4 | | | | | | | | |
| 5 | | | | | | | | |
| 6 | | | | | | | | |
| 7 | | | | | | | | |

---

## End-of-week rollup

| Metric | Start (D0) | End (D7) | Delta |
|--------|------------|----------|-------|
| Users | | | |
| Listings | | | |
| Hosts | | | |
| Bookings attempted | | | |
| Bookings completed | | | |

**Qualitative (bullet list)**

- What worked:
- What did not:
- Next 30-day #1 priority:

---

## Optional: source breakdown (Day 4–7)

| Source | Sessions | Signups |
|--------|----------|---------|
| Organic / direct | | |
| TikTok | | |
| Instagram | | |
| Facebook | | |
| Outreach (host) | | — |
| Outreach (guest) | | — |

---

## Honesty rule

If a number is unknown, write **`N/A`** and fix instrumentation in Week 2—do not invent data.
