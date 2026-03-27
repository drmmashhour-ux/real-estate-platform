# Funnel metrics — BNHub + LECIPM growth

End-to-end view from **impressions → bookings**. Use the same definitions every week so numbers are comparable.

---

## Stages

| Stage | Definition | Typical source |
|-------|------------|----------------|
| **Impressions** | Ad or organic views | Platforms + analytics |
| **Clicks** | Clicks on CTA / profile link | Ads manager + short links |
| **Landing visits** | `/early-access`, `/bnhub/stays`, `/host/apply` | Analytics |
| **Lead capture** | `GrowthLeadCapture` row or CRM contact | DB / admin |
| **Signup** | Account created | Auth / `User` |
| **Active user** | Meaningful action (e.g. search, listing draft, booking) | Product analytics — define 1–2 events |
| **Booking** | Confirmed booking | Booking service |

**CRM mapping:** `EarlyUserTracking.status`

- `CONTACTED` ≈ outreach sent  
- `REPLIED` ≈ engaged  
- `SIGNED_UP` ≈ signed  
- `ONBOARDED` ≈ active in playbook terms  

---

## Core rates

- **Message → reply** = replies ÷ outbound touches (manual count or CRM moves).  
- **Reply → signup** = signups ÷ replies.  
- **Signup → active** = actives ÷ signups.  
- **Click → signup** = signups ÷ clicks (per channel).  
- **CPA** = ad spend ÷ attributed signups.  
- **CP active** = ad spend ÷ attributed active users (stricter).

---

## Attribution

- **Outbound / DM:** `source=dm` (or `instagram`, `tiktok`).  
- **Paid:** `source=meta_ads` | `tiktok_ads` + UTMs on links.  
- **Organic SEO:** `source=seo`.  
- **Referral:** `source=referral` + `ref` / `ref_kind=HOST` on signup.

---

## Dashboards

- **Product:** event funnel (when instrumented).  
- **Growth CRM:** `/admin/growth-crm` — counts by `status` and `source`.  
- **Weekly sheet:** one row per week with spend, signups, and rates — see [growth-optimization.md](growth-optimization.md).

---

## Targets (illustrative — tune per city)

| Metric | Early scale | Notes |
|--------|-------------|--------|
| DM reply rate | 5–15% | Cold outbound |
| Reply → signup | 20–40% | With strong offer |
| Click → signup (paid) | 2–8% | LP + creative dependent |

Document your **actual** baselines in week 1 and improve against those, not generic benchmarks.
