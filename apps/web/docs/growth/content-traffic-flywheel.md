# Content → traffic flywheel (closed loop)

```
Content
   ↓
Traffic
   ↓
Listings
   ↓
Booking
   ↓
Data
   ↓
Optimization
   ↓
MORE content  ─────────┐
   ↑                   │
   └───────────────────┘
```

**One line:** Content → Traffic → Listings → Booking → Data → Optimization → **MORE content**.

## Intent

Each stage feeds the next. **Optimization** closes the loop: it decides **which listings, angles, and channels** get the next batch of content — not random volume.

## How this maps in LECIPM

| Stage | Meaning | Examples in product |
|-------|---------|---------------------|
| **Content** | Short-form scripts, vertical assets, scheduled posts | Content machine, TikTok generator, `MachineGeneratedContent` |
| **Traffic** | Visits, ad clicks, listing views | `TrafficEvent`, Meta Pixel, UTM, BNHUB listing URLs |
| **Listings** | Demand lands on stays (discovery, views, saves) | Search, maps, SEO, retargeting → BNHUB listing URLs |
| **Booking** | Intent → checkout → paid stay | BNHUB booking, Stripe, `booking_started` / Pixel `Purchase` |
| **Data** | Events + outcomes per listing / style / channel | `TrafficEvent`, piece metrics, CRM, dashboards |
| **Optimization** | What to scale, kill, duplicate, where to expand | [paid-social-scaling-playbook](./paid-social-scaling-playbook.md), `runContentOptimizationLoop`, style leaderboards |
| **MORE content** | Feed winners — not more noise | New packs for top listings, extra variants for best **style**, new cities after local proof |

## Operating rule

**Data without optimization is noise.** The loop only compounds when you **feed winners** (listings + content angles + markets) and **cut losers** on a fixed review cadence.

## Related

- [listing-to-traffic-funnel.md](./listing-to-traffic-funnel.md) — listing-first linear path  
- [paid-social-scaling-playbook.md](./paid-social-scaling-playbook.md) — scale / kill / duplicate  
- [retargeting-playbook.md](./retargeting-playbook.md) — warm traffic back to listings  
