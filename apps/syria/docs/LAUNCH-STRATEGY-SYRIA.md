# Darlink — Syria launch strategy (first 90 days)

Operational playbook for **دارلينك | Darlink** — “بوابتك العقارية في سوريا”.  
This document is **business / growth strategy**, not runtime configuration.

---

## Goal — first 30 days

| Metric | Target |
|--------|--------|
| Listings | 300–800 |
| Users | 1,000–3,000 |
| Revenue | First revenue recorded |

---

## Part 1 — Soft launch (days 1–10)

### Posture

- Launch **quietly** (no paid ads yet).
- **Prioritize supply** (listings > perfection).

### Where to source listings

- Facebook Marketplace (Syria)
- Facebook groups (e.g. عقارات دمشق، شقق للإيجار في حلب)
- WhatsApp groups
- Local brokers (including informal)

### Strategy

You are **not** waiting for organic users first — **seed the platform**:

- Manually add **100–300** listings so the product feels alive on day one.

### Outreach script (Arabic)

Use when contacting brokers / group admins:

> مرحبا، نحن نطلق منصة جديدة للعقارات في سوريا (دارلينك)  
> يمكنك نشر عقارك مجاناً حالياً والوصول لعدد أكبر من العملاء

### Offer

- **FREE listings** for the **first 30 days** (adjust dates to match real launch).

---

## Part 2 — First ~1,000 users (realistic channels)

### 1. Facebook (highest priority)

- Post daily with inventory hooks: location + price + image.
- Example angles: “شقة للإيجار في دمشق 🔥”, “فرصة استثمارية”.
- **CTA:** link to Darlink listing or city search.

### 2. TikTok

- Tours: “جولة داخل شقة”, “أفضل مناطق للسكن في دمشق”, “أسعار العقارات اليوم”.
- **CTA:** “شوف العقار كامل على دارلينك”.

### 3. Telegram

- Syndicate daily drops to relevant Syria property channels.

### 4. WhatsApp viral loop

- Every listing should be **easy to share** (see product backlog: share button on listing detail).

### Viral mechanic

**Listing page → share → traffic → more listings.**  
Measure shares via analytics when implemented.

---

## Part 3 — Monetization

### Principle

**Do not charge too early** — grow supply and trust first.

### Phase A — Launch

- **Free** standard listings.
- **Paid featured** only (homepage / boosted visibility).

### Phase B — After traction

1. **Listing fee** (example range: modest USD equivalent locally).
2. **Featured boost** (homepage / category visibility).
3. **BNHub** — **10–20%** platform fee on gross booking (align with config + legal copy).

Platform today supports **listing fees**, **featured payments**, **BNHub commission** via env + Prisma — tune amounts per market reality (SYP / policy).

---

## Part 4 — AI ranking (product direction)

### Goal

Surface **better** listings first without hiding new supply entirely.

### Example scoring model (illustrative)

```
score =
  + image_count * 2
  + description_length (normalized)
  + has_price
  + has_location (coords / city+area)
  + user_clicks * 3
  + booking_rate * 5
  - outdated_penalty
```

**Implementation note:** Today the app uses **featured / recency / price / distance** sorts; a **unified quality score** can layer on `listing-quality` + events (see engineering backlog).

---

## Part 5 — Fraud prevention

### Risks

- Fake listings, scams, duplicates.

### Mitigations

1. **Phone verification** before posting (product backlog).
2. **Duplicate detection** (same title / image hash → flag).
3. **Admin review** — every new listing → `PENDING_REVIEW` until published.

### Trust UX

- Badge copy along the lines of: **“تمت مراجعة هذا العقار”** for reviewed/published listings (align with existing “reviewed” UI where applicable).

---

## Part 6 — Growth engine (“autopilot” = assist only)

### Rules

- **No** full auto-execution — **suggestions only**.

### Suggestion examples

- “هذا العقار يحتاج صور أكثر”
- “الوصف ضعيف”
- “السعر غير تنافسي”

### Autopilot ideas (assist)

- High performers → suggest **featured boost**.
- Inactive listers → **reactivation** nudges.
- Hot areas → **content / SEO / featured zones**.

Platform has **autonomy / assist** hooks and **growth events** — extend carefully.

---

## Part 7 — Market domination timeline (illustrative)

| Month | Focus |
|-------|--------|
| 1 | Listings + FB/TikTok traffic |
| 2 | Monetization on; featured as main paid SKU |
| 3 | **Dominate one city** (e.g. Damascus) → expand Aleppo |

---

## Part 8 — Positioning

### You are not

- “Just another listing website.”

### You are

- **“أسهل طريقة لبيع وتأجير العقارات في سوريا”**  
  (Easiest way to sell and rent property in Syria — operational clarity + Syria-first UX.)

---

## Appendix — Alignment with `apps/syria` (engineering)

| Strategy item | In product today | Backlog / notes |
|---------------|------------------|------------------|
| Free listings / paid featured | Configurable fees; featured checkbox flow | Tune env amounts for “free period” |
| BNHub take rate | `SYRIA_PRICING` / config | Match 10–20% policy |
| Pending review | `PENDING_REVIEW` → admin publish | Keep strict early |
| Growth / analytics | Growth events, admin growth page | Expand KPIs |
| Listing quality hints | `listing-quality` assist | Wire score formula |
| Share button / WhatsApp deep link | — | Add on listing detail |
| Phone verification | — | OTP provider + schema |
| Duplicate detection | — | Title/image fingerprint job |
| Sort by “best” score | Featured / new / price / distance | Add `quality` sort when score exists |

---

## Final truth (execution)

Consistent execution on **supply + Facebook + trust** beats feature sprawl in the first 90 days. The codebase is built to stay **Syria-only** and **manual-payment-safe** — scale distribution and ops first.
