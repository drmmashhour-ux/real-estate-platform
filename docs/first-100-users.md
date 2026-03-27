# First 100 users — acquisition system (BNHub / LECIPM)

Scale from **manual** outreach to a **semi-automated**, **measurable** growth engine. Builds on **`first-10-users.md`** and **`first-10-tracking.md`**.

---

## Strategy overview

| Phase | Users | Focus |
|-------|-------|--------|
| **0–10** | Proof | Manual DMs, fix product, obsess over first bookings (**`first-10-users.md`**). |
| **10–100** | Repeat | Channels + content + referrals + light CRM + weekly optimization (**this doc**). |
| **100+** | Scale | Paid spend, partnerships, automation—only after funnel metrics are stable. |

**North star for 100:** repeatable **message → reply → signup → active** with known rates.

---

## Acquisition channels

1. **Direct outreach** — DMs, email, SMS (manual + copy-paste templates + **`/admin/early-users`**).  
2. **Social content** — TikTok / Reels / Shorts (**`content-plan.md`**).  
3. **Facebook groups / communities** — value-first posts, then DM interested people.  
4. **Referrals** — existing **`Referral`** model + `user.referralCode`; signup with `?ref=CODE` (**`lib/referrals.ts`**). Reward: credits already in schema; **host featured placement** = ops decision + product flag.  
5. **Local partnerships** — brokers, cleaners, small hotels; one-pager + revenue share or lead fee.

---

## Scripts (v2 — scale tone)

### Host — opening

> Hi! We’re **launching BNHub** in your area and promoting a **small group of early hosts**.
>
> We bring **extra visibility**, **lower fees**, and **active marketing**.
>
> Would you like to get **early bookings** and be **featured**?

### Guest — opening

> Hey! We’re launching a **new platform** with **better prices** and **verified listings**.
>
> We’re giving **early users** priority deals and support.
>
> Want to try it?

### Follow-up (both)

> Just checking in — we’re **actively promoting** early users and listings right now, so it’s a **good time to join**.

### Closing

> Great — I’ll get you set up now. **Under 5 minutes.**

(Full template library in **`/admin/early-users`** UI.)

---

## Daily execution engine

| Track | Daily target | Owner |
|-------|----------------|--------|
| **Outreach messages sent** | **30–50** | Growth + sales |
| **Replies** | **10–15** (stretch) | — |
| **Signups** | **5–10** (stretch) | — |
| **Content** | **2–3** short videos | Growth |
| **Host onboarding** | Close **2+** live listings | Sales |

**Split**

- **Growth:** posting, DMs at scale, UTMs, landing **`/early-access`**.  
- **Sales:** calls, listing setup, partnerships, CRM hygiene in admin.

Log everything in **`early_users_tracking`** + **`growth_lead_captures`**.

---

## Tracking

- **CRM:** **`/admin/early-users`** — filter by **status**, **source**, **follow-up date**.  
- **Landing leads:** same admin page — **Growth leads** table.  
- **Funnel:** export weekly; compute rates (**`growth-review.md`**).

### Referrals (existing backend)

- No new `referrals` table — use **`Referral`** (`referrerId`, `usedByUserId`, `rewardCreditsCents`, `usedAt`).  
- Share link pattern: `https://YOUR_DOMAIN/signup?ref=USER_REFERRAL_CODE` (or `/auth/signup?ref=…` — query `ref` is read in `app/api/auth/register/route.ts`).

---

## Optimization loop

1. **Measure** — message→reply, reply→signup, signup→active (**`growth-review.md`**).  
2. **Hypothesis** — one change (script, channel, onboarding step).  
3. **Ship** — 3–5 day experiment.  
4. **Keep** what wins; **kill** what doesn’t.

---

## Related docs

| Doc | Topic |
|-----|--------|
| **`content-plan.md`** | Daily video themes + posting |
| **`growth-review.md`** | Weekly retrospective |
| **`first-10-users.md`** | First cohort scripts |
| **`7day-execution-plan.md`** | Parallel launch week |
