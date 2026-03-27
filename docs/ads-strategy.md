# Paid ads strategy — Meta, Instagram, TikTok (BNHub + LECIPM)

Goal: **predictable top-of-funnel** toward 1000 users while keeping **CPA** under a sustainable target (set per market; revisit weekly).

---

## Target audience

| Segment | Angle | Platforms |
|---------|--------|-----------|
| **Guests 22–45** | Better prices, verified listings, less spam | IG, TikTok, Meta Feed |
| **Aspiring hosts 28–55** | Lower fees / more control / local support | Meta, IG |
| **Retargeting (site visitors)** | Social proof + limited early perks | Meta, IG |

Use **1-mile / 1-city** geo at first; expand only when CPA is stable.

---

## Creatives

- **9:16 video** first — hook in 1s, demo in 5–12s, CTA end card.  
- **Static + carousel** for retargeting and host B2C angles.  
- **3 variants minimum** per campaign (hook A/B/C); kill losers after ~3k impressions or clear CTR gap.

**CTAs:** “Find your stay” → `/early-access?utm_source=meta&utm_medium=paid&utm_campaign=...` or `/bnhub/stays` with same UTMs. Hosts → `/host/apply?...`.

---

## Budget allocation (starting point)

| Bucket | % of paid budget | Notes |
|--------|------------------|--------|
| **Prospecting (guest)** | 50% | Broad + interest stacks |
| **Prospecting (host)** | 30% | Job titles + real estate interests |
| **Retargeting** | 20% | 7–14 day site / engagers |

**TikTok vs Meta:** start 60/40 or 50/50 where your creative is strongest; shift weekly by **cost per landing click** and **cost per signup** (see [funnel-metrics.md](funnel-metrics.md)).

---

## Platforms

### TikTok Ads

- Spark Ads if using organic posts; otherwise in-feed.  
- Lead Gen optional later — until then, **landing** on `/early-access` for email capture.

### Instagram Ads

- Reels + Stories placement; same creative as TikTok when possible.

### Facebook Ads

- Feed + Reels; use for **slightly older host** segments.

---

## Tracking: clicks, conversions, cost per user

| Signal | How |
|--------|-----|
| **Clicks** | Ad platform + UTM on URL |
| **Signups** | CRM `source=tiktok_ads` / `meta_ads` + product signup events |
| **Cost per signup** | Spend ÷ attributed signups (weekly) |
| **Cost per active / booking** | Phase 2 — tie to `ONBOARDED` + booking table |

Log weekly spend in a sheet with: date, platform, spend, clicks, landing visits (if available), signups. Align campaign names with `utm_campaign` for sanity.

---

## Optimization rhythm

- **Daily:** spend cap check, broken ads, comments.  
- **Weekly:** kill bottom 30% creatives; scale top 20%. See [growth-optimization.md](growth-optimization.md).
