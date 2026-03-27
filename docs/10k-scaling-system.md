# 10K users scaling system — BNHub + LECIPM

Scale from **~1K → 10K** users with **semi-autonomous growth**, **marketplace liquidity**, and **revenue discipline**. This layer sits on top of [first-1000-users.md](first-1000-users.md) and [first-100-users.md](first-100-users.md).

**Admin surfaces:** `/admin/growth-dashboard` (metrics + balance), `/admin/growth-crm` (leads + funnel + automation).

---

## Scaling strategy

1. **Liquidity first** — Without enough published stays, guest CAC is wasted. Monitor **supply by city** and **bookings/GMV** on the growth dashboard; shift budget to host acquisition in under-supplied metros.
2. **Full-funnel ownership** — Same weekly review covers ads, content, CRM, product conversion, and retention (see [weekly-growth-review.md](weekly-growth-review.md)).
3. **Automation that compounds** — Deterministic autopilot (`services/growth/ai-autopilot.ts`) + existing CRM rules + retention templates (`services/growth/retention.ts`); humans approve spend and creative.
4. **Revenue clarity** — Take rate on bookings, featured placement, and host premium tools must be documented and tracked (below).

---

## Growth channels

| Layer | Tactics |
|-------|---------|
| **Top — demand gen** | Paid social (Meta / TikTok), organic shorts, SEO landing pages |
| **Middle — conversion** | `/early-access`, BNHub `/bnhub/stays`, signup → first search |
| **Bottom — transactions** | Listing detail → checkout → confirmed booking |
| **Retention** | Email/push using `retention.ts` templates; host listing-completion nudges |

Channel scaling rules: [ads-scaling.md](ads-scaling.md). Content volume: [content-machine.md](content-machine.md).

---

## Full funnel (growth engine)

```
Ads + content + SEO
        ↓
Landing pages (/early-access, city LPs, BNHub home)
        ↓
Onboarding (guest tips on /bnhub/stays, host playbook in lib/growth/host-onboarding-playbook.ts)
        ↓
Booking (search → listing → pay)
        ↓
Retention + referrals (reactivation, reviews, ref codes)
```

---

## Automation layers

| Layer | Implementation |
|-------|----------------|
| **Daily brief** | `buildDailyAutopilotBrief()` — content ideas, outreach, ad angles |
| **Channel pick** | `identifyHighPerformingChannels()` — sort by signups / visits / CAC |
| **CRM** | `POST /api/admin/growth-crm/automation` (follow-ups + tier sync) |
| **Balance** | `getUnderSuppliedCities()` / `getTopSupplyCities()` — `lib/growth/marketplace-balance.ts` |
| **Host path** | `HOST_ONBOARDING_FLOW` — `lib/growth/host-onboarding-playbook.ts` |
| **Retention copy** | `reengagementMessage()` — `services/growth/retention.ts` |

---

## Revenue model

| Stream | Notes |
|--------|--------|
| **Commission per booking** | Platform fee on guest and/or host (existing BNHub payment model — keep transparent on listing/checkout) |
| **Featured listings** | Sponsored placement in search / homepage modules — align with `SponsoredListings` and marketing campaigns |
| **Premium host plans** | Channel manager, analytics, boosts — bundle for power hosts in liquid markets |

Track **GMV** and **net revenue** separately on the dashboard; ROAS ties to ad spend logged in LECIPM marketing settings.

---

## Retention strategy

- **Guests:** dormant 7d / 30d, wishlist reminders, post-stay review ask (`retention.ts`).
- **Hosts:** incomplete listing, dormant 14d after signup, payout/verification prompts.
- **Product:** saved searches and price-drop alerts when you ship them — until then, email is the backbone.

---

## Analytics + optimization

- **Dashboard:** `/admin/growth-dashboard` → `GET /api/admin/growth/scale-metrics` (BNHub + LECIPM funnel + city balance).
- **Conversion UX:** listing pages — clear total price, trust badges, cancellation summary; checkout — minimal steps, explicit fees ([growth-optimization.md](growth-optimization.md) patterns from 1K still apply).
- **Performance:** keep listing and search routes fast (lazy maps, image optimization, mobile-first layouts) — non-negotiable at 10K MAU.

---

## Code map

| Path | Purpose |
|------|---------|
| `services/growth/ai-autopilot.ts` | Daily ideas, outreach, ad suggestions, channel ranking |
| `services/growth/retention.ts` | Re-engagement templates + guest tips |
| `lib/growth/bnhub-scale-metrics.ts` | Users, listings, bookings, GMV, supply-by-city |
| `lib/growth/marketplace-balance.ts` | Under-supplied vs top-supply cities |
| `lib/growth/host-onboarding-playbook.ts` | Guided host steps + pricing helper |
| `components/growth/GuestOnboardingTips.tsx` | First-search tips on `/bnhub/stays` |

---

## Referral engine (full)

- **User → user:** `ref` on signup + credits (`lib/referrals.ts`).
- **Host → host:** `ref_kind=HOST` for supply recruiting; leaderboard on `/admin/growth-crm`.
- **Bonus visibility (ops):** rotate top referrers / new liquid markets in newsletter, social, and “featured host” slots — document winners weekly.

---

## Automation rules (summary)

- Auto follow-ups + lead scoring: CRM automation API (1K engine).
- **Priority users / cities:** sort CRM by `leadTier`; ads and outbound target `underSuppliedCities` first.

---

## Validation checklist

- [ ] Dashboard loads with real DB  
- [ ] At least one city has supply target and host sprint owner  
- [ ] Weekly review doc completed Monday  
- [ ] Retention emails wired OR manual sends from `retention.ts` copy  
- [ ] ROAS / CAC reviewed before budget increases ([ads-scaling.md](ads-scaling.md))

---

## Next tier (100K domination)

When approaching **10K+** active users, layer in [100k-domination-system.md](100k-domination-system.md): Montreal-first city sequence, `ai-autopilot-advanced.ts`, network-effect KPIs, and city landing pages (`/montreal`, `/toronto`, …).
