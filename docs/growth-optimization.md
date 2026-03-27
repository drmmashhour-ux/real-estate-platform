# Growth optimization loop (weekly)

Use this every **Monday (or your planning day)** for 30–45 minutes with whoever owns growth + supply.

---

## 1. Pull numbers

- CRM funnel: `/admin/growth-crm` (or export).  
- Paid: spend, clicks, signups by campaign.  
- Product: signups, activation events, bookings (if live).

Compute: message→reply, reply→signup, click→signup, CPA.

---

## 2. What worked

- Top 1–2 **sources** (`meta_ads`, `dm`, `referral`, …).  
- Top 1–2 **creatives** or script variants.  
- Any **partnership** that moved multiple hosts.

Write one bullet each — specific (“IG Reel #host-fees — 12 signups”) not vague (“social did well”).

---

## 3. What failed

- Cut or pause: ads, hooks, audiences, channels below your floor CPA or reply rate.  
- List **one UX friction** (e.g. host form field, mobile CTA).

---

## 4. Changes this week

| Area | Action |
|------|--------|
| **Scripts** | Edit one host + one guest opener (`services/growth/ai-outreach.ts` + CRM templates) |
| **Ads** | New hook or audience; shift 10–20% budget to winner |
| **CRM** | Run automation dry-run; clear `followUpAt` backlog for hot tiers |
| **UX** | One small fix (copy, button, step removal) |

---

## 5. Automation rules (baseline)

- **Follow-up:** stale `CONTACTED` leads get `followUpAt` via `POST /api/admin/growth-crm/automation` (dry run first).  
- **Scoring:** set `conversionScore`; tiers sync HIGH ≥70, MEDIUM ≥40, else LOW.  
- **Prioritization:** sort outreach by `leadTier` + soonest `followUpAt`.

---

## 6. Exit criteria for “next scale step”

When **CPA is stable** and **host supply** can serve demand:

- Increase geo or budget 20–30%.  
- Add second creative pod (UGC partners).  
- Formalize referral incentives in-app (already have codes + credits — align messaging).

Long-form narrative review: [growth-review.md](growth-review.md). Strategy doc: [first-1000-users.md](first-1000-users.md).
