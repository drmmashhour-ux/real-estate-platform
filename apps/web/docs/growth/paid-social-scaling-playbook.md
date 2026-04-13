# Paid social — scaling playbook (BNHUB stays)

Operational checklist before and during Meta / paid social scale. Pair with [retargeting-playbook.md](./retargeting-playbook.md) and funnel events in `lib/analytics/funnel-events.ts` (stored on `traffic_events.event_type`).

---

## Step 1 — Find your winner (gates)

**Winning signals (need all three before you scale):**

| Signal | What “good” means | First-party hooks |
|--------|-------------------|-------------------|
| People clicking | CTAs get use | `ad_click` (UTM landings), `cta_click`, `booking_click` |
| People staying on listing | Engagement, not instant leave | `listing_view`, `scroll_50` |
| People starting booking | Intent becomes a booking record | `booking_started` (API may accept alias `booking_start`) |

**Do not scale if:**

- No meaningful clicks on primary CTAs  
- High bounce / exit before `scroll_50` or the dates section  
- No `booking_started` at sustainable volume  

---

## Step 2 — Budget ramp (safe)

**Start:** about **$20/day** for testing.

**Example ramp (never jump more than ~20–30% per step):**

| Day | Daily budget (example) |
|-----|-------------------------|
| 1 | $20 |
| 3 | $30 |
| 5 | $45 |
| 7 | $65 |

**Rule:** never double budget in one shot.

---

## Step 3 — Duplicate winners instead of only raising one ad

When an ad works:

- Prefer **duplicating** the winning ad/set at a similar budget (e.g. Ad A at $20 → duplicate → Ad A2 at $20 → ~$40 total with less shock than one $40 ad).

---

## Step 4 — Scale creatives, not only budget

Per **winning listing**, run **3–5 creative angles**, for example:

- Price / value shock  
- Lifestyle / neighborhood  
- POV / guest story  
- Comparison vs hotels or other stays  

More distinct creatives usually improves reach and learning without relying on a single fatigued asset.

---

## Step 5 — Geographic expansion

**Order of operations:**

1. Win locally (e.g. Montreal, Laval).  
2. Only then expand (e.g. Toronto, Québec City).  

**Rule:** expand geography after the offer and landing are proven in core markets.

---

## Step 6 — Retargeting scale (often highest ROI)

**Audiences (see [retargeting-playbook.md](./retargeting-playbook.md)):**

- Visited listing (`ViewContent` / `listing_view`)  
- Clicked / engaged but did not book (`AddToCart` / `InitiateCheckout` minus `Purchase`, or first-party funnel)  

**Message examples:**

- “Still thinking about this stay?”  
- “Only a few nights left at this rate…”  

Retargeting is often cheaper CPC/CPA and higher conversion once cold traffic is qualified.

---

## Step 7 — Budget split (rule of thumb)

| Bucket | Share |
|--------|--------|
| Cold / prospecting | ~60% |
| Retargeting | ~40% |

Tune based on measured CPA and inventory.

---

## Step 8 — Landing optimization while scaling

As volume grows, keep improving:

- **Speed** (Core Web Vitals, images)  
- **CTA** (Reserve, clarity, “not charged yet”)  
- **Trust** (verified listing, secure booking, Stripe)  

---

## Step 9 — Kill losers quickly

After roughly **$10–$20** on a cell with **no meaningful signal** (clicks, engagement, or starts), pause or replace — don’t let budget bleed on dead concepts.

---

## Step 10 — Scale listings

Once **one listing** works:

- Scale that winner.  
- Add **listing 2, 3…** as **new tests** (don’t assume transfer; validate each).  

Pattern: **Listing 1 proven → scale → parallel tests for more listings.**

---

## Step 11 — Daily operating rhythm

Each day:

1. Review spend and key metrics.  
2. Cut underperformers.  
3. Scale or duplicate what works (within ramp rules).  
4. Refresh or add creatives to fight fatigue.  

---

## Scaling model (summary)

```
1 listing → ~3 ad concepts
       ↓
1 winning ad
       ↓
duplicate + new variations
       ↓
gradual budget increase
       ↓
retargeting on warm audiences
       ↓
add more listings (tested one by one)
       ↓
repeat
```

---

## Common mistakes

- Raising budget too fast on one ad  
- Scaling without event / pixel coverage  
- One tired creative  
- Weak or slow listing page  

## Success looks like

- Cost per click stable or down  
- Booking rate (views → `booking_start` → paid) up  
- Revenue and contribution after fees trending the right way  

---

## Related docs

- [meta-retargeting.md](./meta-retargeting.md) — Pixel setup  
- [retargeting-playbook.md](./retargeting-playbook.md) — Audiences and creative angles  
