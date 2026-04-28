# ORDER SYBNB-107 — Daily metrics

Goal: **clear visibility** into what drives Syria adoption so you can make **fast decisions**—without waiting for a perfect BI stack.

---

## Track **daily** (same local-time cutoff each day)

| # | Metric | Notes |
|---|--------|--------|
| 1 | **Listings added** | Net new published (or created→published—pick one definition and keep it). |
| 2 | **New users / messages** | Sign-ups if you track them; **guest→seller messages** (`listing_messages` / inbox counts). |
| 3 | **Contact clicks (phone reveal)** | WhatsApp + `tel` taps (`whatsapp_clicks` / `phone_clicks` on listings—your pipeline should expose daily deltas). |
| 4 | **Booking requests** | Stay booking **requests** created (SYBNB flow—match your product definition). |
| 5 | **Confirmed bookings** | Host-approved / confirmed state—same definition every day. |
| 6 | **Revenue (if any)** | Manual PSP, featured fees, etc.—even **0** is a valid row. |

---

## Simple tracking (pick one)

### Option A — Google Sheet (recommended day one)

One row per **date**, columns = table above + optional notes (`campaign`, `DMs sent`, incidents).

- Formula row for **7-day averages** or WoW once you have history.
- Share view-only with partners; **one owner** edits.

### Option B — Admin surfaces (later / parallel)

Use existing Syria admin hubs when helpful—examples:

- **`/admin/stats`** — money / F1 tier aggregates where wired.
- **`/admin/growth`** — growth operating metrics (when populated).
- **`/admin/sybnb/performance`** — SYBNB listing/host signals.
- **`/admin/payments-monitor`** — payment events when payments are on.

These complement but **do not replace** a single daily scorecard unless you explicitly consolidate into one view.

---

## Decision rules (review **weekly**, adjust **daily** if needed)

| Signal | Action |
|--------|--------|
| **No growth** (flat listings/users/contacts) | **Increase DMs** and outbound (see [SYBNB-105](./sybn105-launch-day-plan.md)); widen tasteful group posts; shorten response time. |
| **No bookings** despite traffic | **Improve listings:** more/better **photos**, sharper **pricing**, clearer amenities (electricity/Wi‑Fi), faster seller replies ([SYBNB-106](./sybn106-first-bookings.md)). |

---

## Success criteria

- **Clear visibility** — anyone on the team can answer “how yesterday went” in **under two minutes**.
- **Fast decisions** — metrics reviewed **daily**; experiments (DM volume, pricing help, photo audits) ship within **48h** of a bad streak.

---

## Related

- First bookings playbook: [SYBNB-106](./sybn106-first-bookings.md)
- Launch day: [SYBNB-105](./sybn105-launch-day-plan.md)
