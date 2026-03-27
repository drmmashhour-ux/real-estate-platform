# Marketing machine — BNHub + LECIPM (100K path)

Unified engine: **content + paid + SEO** pointing to **city landing pages** and **BNHub search**, with one weekly optimization loop.

---

## Channels

| Channel | Job | Owner output |
|---------|-----|----------------|
| **TikTok** | Volume + hooks | 3–5 shorts/day ([content-machine.md](content-machine.md)) |
| **Instagram** | Reels + Stories retarget | Same cuts, native captions |
| **YouTube Shorts** | Long-tail discovery | Repurpose top 2 weekly |
| **Meta ads** | Predictable guest + host signups | CAC-controlled scaling ([ads-scaling.md](ads-scaling.md)) |
| **TikTok ads** | Gen-Z guest demand | Creative testing |
| **SEO** | City + intent pages | `/montreal`, `/toronto`, … + blog/FAQ supporting pillars |

---

## Funnel alignment

1. **Awareness** — Shorts, ads, SERPs.  
2. **Intent** — City LP with trust + listings grid + CTA to `/bnhub/stays?city=…`.  
3. **Action** — Search → listing → pay.  
4. **Retention** — Email/push + loyalty tiers.

UTM every outbound link; map winning `utm_campaign` to CRM `source`.

---

## Content pillars (repeat weekly)

- Guest: price clarity, verification, trip ideas per city.  
- Host: fees, calendar, “first booking in 14 days” stories.  
- Brand: LECIPM + BNHub crossover (trust, data, local expertise).

---

## Paid rules

- Never scale national until **Montreal** (or active core) hits dashboard liquidity targets.  
- Separate campaigns: **guest demand** vs **host supply** vs **retargeting**.  
- Use `buildAdvancedAutopilotBrief()` for weekly creative briefs.

---

## SEO (city-based)

- Unique title/description per domination city (`dominationCityMetadata`).  
- Internal links: city LP ↔ `/city/*` explorer where available ↔ BNHub search.  
- Add FAQ schema later for “short-term rental rules in [city]” when legal approves.

---

## Measurement

- **Top:** impressions, CTR, CPC.  
- **Mid:** LP sessions, signup rate.  
- **Bottom:** bookings, GMV, take rate.  
- **Retention:** repeat booking rate, tier distribution (when instrumented).

Dashboard: `/admin/growth-dashboard`.

---

## Execution checklist (daily)

- [ ] Post scheduled shorts  
- [ ] Check ad delivery + comments  
- [ ] Log 1 learning in weekly doc  
- [ ] Refresh under-supplied city host creative if needed  
