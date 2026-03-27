# 100K users domination system — BNHub + LECIPM

Scale from **~10K → 100K** users while **owning density** in priority cities, compounding **network effects**, and scaling **monetization** without losing trust. Builds on [10k-scaling-system.md](10k-scaling-system.md).

**Admin:** `/admin/growth-dashboard` (domination markets, network-effect ratio, rough GMV/guest). **City LPs:** `/montreal`, `/laval`, `/quebec-city`, `/toronto`, `/vancouver`.

---

## Market domination strategy

1. **Win one city at a time** — deepest supply + demand in a single metro beats thin national presence.
2. **Montreal first** — bilingual hub, operational proximity, regulatory familiarity; prove repeat bookings and host economics.
3. **Roll Canada in waves** — only expand spend when prior wave hits liquidity targets (bookings per 1k listings, not vanity MAU).
4. **LECIPM + BNHub together** — real-estate authority feeds trust for short-term; stays feed data and brand frequency.

---

## Geographic expansion plan

| Phase | Cities | Objective |
|-------|--------|-------------|
| **A — Core** | Montreal | Highest listing + booking density; agency partnerships |
| **B — Ring** | Laval, Quebec City | Commute + tourism corridors; shared creative |
| **C — National** | Toronto, Vancouver | Scale winners; higher CAC — enter only with playbook + capital |

**Goal:** strongest **supply + demand density per city** (not equal spend per city). Use dashboard “domination markets” table to reallocate weekly.

Configs live in `apps/web/lib/growth/domination-cities.ts`.

---

## Growth systems

- **Full funnel:** ads + content + SEO → city LPs → onboarding → booking → retention ([marketing-machine.md](marketing-machine.md)).
- **CRM + automation:** `/admin/growth-crm` (1K engine) + `ai-autopilot` / `ai-autopilot-advanced`.
- **Network effects:** `lib/growth/network-effects.ts` — highlight high-booking listings, rank top hosts for campaigns.

---

## Automation layers

| Layer | Role |
|-------|------|
| **Daily** | `buildAdvancedAutopilotBrief()` — content, outreach, ad angles, drop-off hints, city opportunities |
| **CRM** | Follow-ups, lead tiers |
| **Balance** | Under-supplied vs top-supply cities |
| **Retention** | `services/growth/retention.ts` + `lib/growth/loyalty-program.ts` |

---

## Monetization scaling

| Lever | How it scales |
|-------|----------------|
| **Booking commission** | Take rate stable; volume from liquidity |
| **Featured / sponsored** | More inventory → auction or tiered placement |
| **Premium host tools** | Channel manager, analytics, boosts — sell in liquid markets first |
| **Ads placements** | LECIPM + BNHub inventory — only after UX guardrails |

Avoid discounting take rate to buy share unless strategic and time-boxed.

---

## Retention + loyalty

- **Repeat guests:** tiered perks in `loyalty-program.ts` (wire to billing when ready).
- **Hosts:** faster payout visibility, performance dashboards, referral + visibility for recruiters.
- **Lifecycle copy:** `reengagementMessage()` for dormant segments.

---

## Competitive positioning

- **Vs OTAs:** verification, local ops, fairer host narrative, LECIPM trust layer.
- **Vs generic classifieds:** end-to-end booking, payments, guarantees.
- **Narrative:** “Real-estate-grade short-term stays” — not anonymous listings.

---

## Network effect engine (product + data)

- **More hosts → more listings → more guests** — measure `bookingsPerThousandListings` on dashboard.
- **More guests → more bookings → more hosts** — publish host earnings stories per city LP.
- **Highlight active listings** — `getActiveListingIdsByBookings()` for homepage/merchandising.
- **Promote high performers** — `getTopHostIdsByBookings()` for spotlights and partner outreach.
- **Reward active users** — loyalty tiers + referral credits + ops “visibility boost” for top recruiters.

---

## Trust + safety (scale requirements)

- Keep **verification** strict as volume grows; automate checks, don’t skip manual edge cases in new markets.
- **Reviews** post-stay — default flows in retention templates.
- **Fraud** — existing BNHub pipelines; watch chargeback rate per city as you scale Toronto/Vancouver.
- **Guarantees** — keep messaging visible on city LPs and checkout.

---

## Performance + infrastructure

- **Traffic spikes:** CDN, image optimization, rate limits on search APIs, DB indexes on booking/listing hot paths.
- **Mobile web:** city LPs and checkout must be sub-3s LCP on 4G; PWA optional later.
- **Native app:** push notifications and offline-light flows — see Mobile domination below.

---

## Mobile domination

- **Push:** booking confirmations, check-in reminders, price-drop on saved search (when product ships).
- **UX bar:** fewer steps to first search than large OTAs; saved payments where compliant.
- Execution is **product roadmap**; this doc sets the bar competitors must beat.

---

## AI autopilot (advanced)

`services/growth/ai-autopilot-advanced.ts` — heuristic bundle: ad budget suggestions, pricing from comps, funnel drop-offs, city growth opportunities, channel ranking. **Human** approves spend and brand.

---

## Host domination system

- Aggressive onboarding: `HOST_ONBOARDING_FLOW` in `host-onboarding-playbook.ts`.
- **Early-host visibility:** featured modules + city LPs + paid boost where ROI positive.
- **Agencies:** property managers — white-glove API later; today: partner list + `source=partner` in CRM.

---

## Analytics + decision engine

- **Dashboard upgrades:** city performance, GMV/guest proxy, network-effect KPI.
- **Weekly loop:** [domination-review.md](domination-review.md).

---

## Code map

| Path | Purpose |
|------|---------|
| `lib/growth/domination-cities.ts` | Market definitions + listing filters |
| `lib/growth/bnhub-city-performance.ts` | Per-city supply + bookings + GMV |
| `lib/growth/network-effects.ts` | Flywheel metrics + ranking helpers |
| `lib/growth/loyalty-program.ts` | Tiers + copy |
| `services/growth/ai-autopilot-advanced.ts` | Advanced daily / strategic brief |
| `components/marketing/BnhubDominationCityPage.tsx` | City LP shell |

---

## Validation

- [ ] Montreal liquidity target owned by one exec metric  
- [ ] Dashboard domination row reviewed weekly  
- [ ] City LPs linked from ads and organic  
- [ ] Trust metrics (disputes, refunds) tracked per city as you expand  
- [ ] Revenue mix (commission vs featured vs subs) reported monthly  

---

## Conversion optimization (ongoing)

- Listing pages: total price clarity, photo quality, instant book badge.
- Checkout: minimal fields, explicit fees, guarantee reminder.
- Signup: social proof + single primary CTA on city LPs.

---

## Automation at scale

Marketing cadence, onboarding emails, CRM follow-ups, and recommendation rails should **default on** with **human overrides** for brand and crisis moments.

---

## Enterprise layer

For multi-region **governance**, trust/compliance playbooks, partnership patterns, and the **enterprise dashboard**, see [enterprise-scaling-system.md](enterprise-scaling-system.md).
