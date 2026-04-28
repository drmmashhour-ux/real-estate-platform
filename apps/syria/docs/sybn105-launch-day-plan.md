# ORDER SYBNB-105 — Launch day plan

Goal: go live on production (`lecipm-syria` / e.g. `syria.lecipm.com`) and drive **immediate** real traffic and conversations.

**Before hour 0:** production deploy done ([SYBNB-102](./env-deployment.md)), Syria-only DB + secrets ([SYBNB-103](./env-deployment.md#order-sybnb-103--isolation-from-canada-platform)), env smoke OK.

---

## Hour 0–1 — Open production & smoke test

1. Open the **production** URL (not localhost).
2. Run through:
   - [ ] **Create listing** — publish path completes (sell/quick-post as you ship).
   - [ ] **Open listing** — detail page loads; images/gallery OK on slow network if possible.
   - [ ] **Contact** — **phone** / **WhatsApp** taps resolve (correct numbers, no broken `tel:`/`wa.me`).
   - [ ] **Report** — guest report submits without error (and appears in admin queue if applicable).

---

## Hour 1–3 — Seed supply

- Post **10–15** listings yourself (realistic copy; avoid duplicate spam patterns).
- **Mix cities:** **Damascus** + **Latakia** (spread categories/types per your vertical).

---

## Hour 3–6 — Direct outreach

- Send **20–30 DMs** (WhatsApp/Telegram/Facebook DM — channels you already use).

**Copy (Arabic):**

> نزلنا منصة جديدة للإيجارات بسوريا 🇸🇾  
> إذا بدك تنشر إعلانك أو تدور على إقامة، جربها 👍

*(Adapt tone for audience; keep link short / tracked if you use UTM.)*

---

## Hour 6–12 — Groups

- Post in **3–5** relevant **Facebook** groups (follow each group’s rules; pin/link comment once).

---

## Hour 12–24 — Close the loop

- Reply to **every** inbound message (speed builds trust on day one).
- **Manual help:** reset passwords, fix uploads, explain posting steps — ops-first.

---

## Success criteria

- **First real traffic** (analytics or server logs).
- **First conversations** (DMs, WhatsApp, in-app messages).

---

## Notes

- Keep **`SYBNB_PAYMENTS_ENABLED`** aligned with what you promise publicly ([env template](../.env.production.example)).
- Fraud/abuse: watch reports + `/admin` queues; Syria stays isolated from Canada ([SYBNB-103](./env-deployment.md#order-sybnb-103--isolation-from-canada-platform)).

**Next:** convert traffic into bookings — [ORDER SYBNB-106 — First bookings](./sybn106-first-bookings.md). Measure daily — [ORDER SYBNB-107](./sybn107-daily-metrics.md).
