# Ads scaling — 1K → 10K users

How to **increase spend without blowing CAC**, and when to **kill** underperformers.

---

## Increase budget gradually

- **Rule of thumb:** raise daily budget by **10–20%** when **CAC is stable or falling** for 5–7 days.
- **Ceiling:** never raise more than **30%** in a single step unless launching a new geo with separate campaign.
- **Learning phase:** after structural change (new pixel event, new landing), wait **50 conversions / week** minimum before judging.

---

## Test multiple creatives

- Run **3–5 hooks** per audience: price clarity, trust, host supply, social proof, urgency.
- Refresh **2 new concepts / week**; keep one “control” winner from last week.
- Use `suggestAdCreatives()` in `services/growth/ai-autopilot.ts` as a starting brief for designers.

---

## Kill low-performing ads

Pause when **any** of:

- **CTR** in bottom **30%** of active ads after ≥3k impressions.
- **CPC** > **1.5×** account median for same objective and geo.
- **Landing signup rate** < **50%** of your best landing for 200+ clicks.

---

## Scale winners

- Duplicate winning ad set → increase budget on duplicate (protects learning on original).
- Expand **geo** only after CPA is stable in core city.
- Move **10–20%** of budget monthly toward the top 2 sources from `identifyHighPerformingChannels()`.

---

## Track CAC (cost per user)

\[
\text{CAC} = \frac{\text{ad spend (period)}}{\text{attributed signups (period)}}
\]

Use CRM `source` + UTMs for organic/paid split. Dashboard shows **cost per signup** from manual ad spend (LECIPM marketing settings) ÷ traffic signups.

---

## Track ROAS (return on ad spend)

Define **revenue** for ROAS (pick one and stick to it):

- **ROAS (gross):** attributed **booking GMV** ÷ ad spend (optimistic).
- **ROAS (net):** **platform take** from those bookings ÷ ad spend (recommended for decisions).

\[
\text{ROAS} = \frac{\text{attributed revenue}}{\text{ad spend}}
\]

At 10K scale, move from “signup ROAS” to **booking ROAS** for guest campaigns.

---

## Weekly cadence

| Day | Action |
|-----|--------|
| Mon | Review CAC, ROAS, creative leaderboard; update budgets |
| Wed | Launch 1–2 new hooks; cut losers |
| Fri | Snapshot spend vs plan; log in growth review |

Align narrative with [weekly-growth-review.md](weekly-growth-review.md).
