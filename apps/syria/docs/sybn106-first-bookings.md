# ORDER SYBNB-106 — First bookings (10 requests → ≥3 confirmed stays)

Goal: secure **10 booking requests** quickly, with **at least 3 confirmed stays** through tight manual coordination.

**Assumes:** production live ([SYBNB-105](./sybn105-launch-day-plan.md)), stays/SYBNB flows enabled per env (`SYBNB_PAYMENTS_ENABLED` may stay manual/off — coordination still runs).

---

## 1. Pick the best listings (supply side)

Curate a shortlist **before** pushing traffic:

| Criterion | Why |
|-----------|-----|
| **Price looks fair** vs comparable stays in the same city | Higher conversion on first DM |
| **3+ photos** | Trust + clarity reduces back-and-forth |
| **Electricity + Wi‑Fi** (amenities present on listing) | Matches traveler expectations; fewer objections |

Use admin/browse filters + listing detail to verify amenities and image count.

---

## 2. When a user shows interest

Ask **once**, clearly:

- **Dates** (check-in / check-out)
- **Number of guests**
- **Budget** (nightly or total — whatever matches how you quote)

Keep messages short; avoid long questionnaires.

---

## 3. Send **only 1–2** options

- Do **not** dump the whole catalog.
- Offer **one** strong match; add **one** backup only if dates/budget don’t fit the first.
- Deep-link to **those** listing URLs only.

---

## 4. Close fast

Use a single closing line that pushes confirmation:

**Arabic:**

> إذا مناسب، فينا نأكد الحجز الآن 👍

*(Adapt locale spelling/tone to your audience; keep intent: confirm **now** if terms work.)*

---

## 5. Manual coordination (ops-critical)

For each serious lead:

1. **Contact the seller immediately** (phone/WhatsApp per listing preferences).
2. **Confirm availability** for the exact dates + guest count.
3. **Guide both sides** — calendar, price, house rules, payment route you actually support (manual PSP / on-platform when enabled).

Document outcomes in your tracker (spreadsheet or CRM): requested → confirmed → stayed.

---

## Success metrics

| Metric | Target |
|--------|--------|
| Booking **requests** | **10** |
| **Confirmed** stays | **≥ 3** |

*(Define “request” vs “confirmed” consistently — e.g. host accepted / deposit rule / calendar blocked.)*

---

## Related

- Launch sequencing: [SYBNB-105](./sybn105-launch-day-plan.md)
- Deploy / isolation: [Environment & deployment](./env-deployment.md)
- Daily scorecard (what to measure ongoing): [SYBNB-107](./sybn107-daily-metrics.md)
