# 7-Day Execution Plan — BNHub / LECIPM

Launch fast with **real users**, **real listings**, and **validated learning**. Execute in order; adjust numbers to your market size, but **do not skip outputs**.

**Metrics:** Log daily numbers in **`7day-metrics.md`**.  
**Team rhythm:** **`daily-execution.md`**, **`communication.md`**.  
**Ship safely:** **`release-strategy.md`**, **`team-workflow.md`**.

---

## How to use this doc

1. **Day 0 (30 min):** Assign owners (E/D/G/S below). Open **`7day-metrics.md`** and zero the sheet.  
2. **Each morning:** Pick **3 must-dos** from the day block.  
3. **Each evening:** Update metrics + one-line learnings in **`7day-metrics.md`**.

**Legend — who does what**

| Tag | Role |
|-----|------|
| **E** | Engineer(s) |
| **D** | Designer |
| **G** | Growth |
| **S** | Sales / ops |

---

## Day 1 — Foundation

**Goal:** Platform stable enough for strangers to sign up, list, and book without you in the room.

### Product (E + smoke-test by S)

- [ ] **Signup / login** — email + OAuth if you ship it; password reset works.
- [ ] **Add property / listing** — host can publish a draft → live (or your equivalent flow).
- [ ] **Booking** — guest can complete a booking path on **staging first**, then **production** if ready.
- [ ] **Payments** — test mode or small real charge; webhook/receipt path verified.
- [ ] **Fix blocking bugs** — anything that stops the four bullets above (P0 only).

### Tech (E)

- [ ] **Full platform smoke** — `pnpm run build:ci` green; deploy to **staging** per **`release-strategy.md`**.
- [ ] **Web** — critical paths in Chrome + Safari (or Edge).
- [ ] **Mobile** — open app or mobile web; login + browse + start booking.
- [ ] **Maps** — search/map loads; pin or list result opens listing.
- [ ] **Calendar** — host/guest availability or booking dates behave correctly for one happy path.

### Output

- [ ] **Demo script** — 5 min screen recording or checklist S can run alone.
- [ ] **`7day-metrics.md`:** baseline users/listings/bookings = starting counts.

---

## Day 2 — Listings + Supply

**Goal:** Marketplace does not look empty; real inventory and real hosts.

### Listings (S + E support)

- [ ] **20–50 real listings** — manual entry or import; mix of price points and neighborhoods.
- [ ] **Per listing:** cover image, **3+ photos**, title, description, **amenities** filled, **nightly price** + fees clear.
- [ ] **Spot-check 10** on mobile + desktop.

### Host onboarding (S)

- [ ] **3–5 real hosts** — accounts created, at least one listing each live (or clearly “coming soon” only if unavoidable).
- [ ] **Host knows:** how to edit calendar, price, and who to ping for support.

### Output

- [ ] **Not empty** — browse/search returns meaningful results in your launch city.
- [ ] **`7day-metrics.md`:** listings count, hosts onboarded.

---

## Day 3 — UX + Trust

**Goal:** A cautious user would still click “Book.”

### Listing & booking UX (D + E)

- [ ] **Listing page** — image gallery readable; above-the-fold price + total estimate if you show it.
- [ ] **Amenities** — grouped or scannable; no wall of JSON.
- [ ] **Pricing** — nightly + fees + taxes (if applicable) understandable in one screen scroll.

### Trust (E + D)

- [ ] **Reviews** — show existing reviews or honest “New listing” state; no broken empty components.
- [ ] **Signals** — verification badge, host response time, or “ID verified” if product supports it.
- [ ] **Copy** — cancellation / house rules visible before pay.

### Safety (S + E)

- [ ] **Review listings** — flag or remove duplicates, obvious scams, wrong city.
- [ ] **Escalation path** — support email or form tested once.

### Output

- [ ] **3 non-team people** — 10-min look at 2 listings each; collect friction notes; fix top 3 (E/D).

---

## Day 4 — Growth launch

**Goal:** First **external** traffic—not only friends.

### Content (G)

- [ ] **5–10 short videos** (15–60s) — themes e.g. “Find your stay in [city]”, “Earn hosting on BNHub”, one trust hook.
- [ ] **Post** — TikTok, Instagram Reels, Facebook (cross-post ok); **link in bio** → landing or app store.
- [ ] **UTM** on links — `utm_source` / `utm_campaign=7day-d4` for **`7day-metrics.md`**.

### Landing (G + D + E)

- [ ] **Homepage / LP** — headline = one clear promise; single primary CTA (search / list property / sign up).
- [ ] **Mobile LP** — loads fast; no broken hero on small screens.

### Output

- [ ] **Traffic** — nonzero sessions from social in analytics (even small).
- [ ] **`7day-metrics.md`:** sessions, signups attributed where possible.

---

## Day 5 — Sales + outreach

**Goal:** Real conversations; pipeline for supply and demand.

### Host outreach (S)

- [ ] **20–50 contacts** — Airbnb hosts (other cities ok), FB groups, local landlord forums (respect ToS and etiquette).
- [ ] **Pitch** — 3 bullets: why BNHub, your city focus, “we help you onboard.”
- [ ] **≥5 hosts** — agreed to next step (call, listing draft, or signup).

### Guest / user tests (S + G)

- [ ] **10–20 outreach** — friends-of-friends, local communities, **not** only employees.
- [ ] **Ask** — “Try to find a stay for [date] and tell us where you stopped.”
- [ ] **Bookings attempted** — count starts or completions in **`7day-metrics.md`**.

### Output

- [ ] **Written log** — objections (price, trust, inventory) → feed Day 6 fixes.

---

## Day 6 — Optimization

**Goal:** Remove the biggest leaks; speed up what works.

### Analyze (E + G)

- [ ] **Funnel** — signup → search → listing view → book start → pay (where do people drop?).
- [ ] **Errors** — Vercel/runtime logs, Sentry if any, `console` on staging.
- [ ] **Slow** — one slow page fixed (LCP or API) if data shows it.

### Fix (E + D)

- [ ] **Top 3 UX frictions** from Day 3 tests + Day 5 objections.
- [ ] **Booking flow** — fewer fields, clearer total, better error messages.
- [ ] **Pricing clarity** — if confusion repeated, fix copy or UI.

### Output

- [ ] **Ship to staging → prod** if low risk; else flag for week 2.
- [ ] **`7day-metrics.md`:** note conversion before/after if measurable.

---

## Day 7 — Scale + review

**Goal:** Decide what to double down on for the next 30 days.

### Review (whole team — 60 min)

- [ ] **Users acquired** (signups, MAU if tracked)
- [ ] **Listings added** (net new)
- [ ] **Hosts onboarded** (active)
- [ ] **Bookings attempted / completed**
- [ ] **Conversion rates** — search→view, view→book start, book→pay (best effort)

### Decide

- [ ] **What worked** — channel, message, feature, city segment.
- [ ] **What failed** — kill or park.
- [ ] **One bet** — e.g. “Double down on host outbound” or “Content + paid test $X”.

### Prepare

- [ ] **Next 30-day plan** — 3 outcomes, 3 metrics, owners (1 page in Notion or `docs/`).

### Output

- [ ] **Go / adjust / pivot** — Founder documents one paragraph decision + date.

---

## Daily assignment cheat sheet

| Day | Engineer | Designer | Growth | Sales |
|-----|----------|----------|--------|--------|
| **1** | Flows, bugs, web/mobile/maps/calendar | — | — | Smoke-test as user |
| **2** | Listing bugs, imports | Listing card polish | — | Listings + hosts |
| **3** | Reviews, badges, trust UI | Listing page, pricing clarity | — | Safety review |
| **4** | LP deploy, analytics | LP visuals | Video + posts | — |
| **5** | Quick fixes from calls | — | Boost posts if needed | Outreach both sides |
| **6** | Perf, bugs, funnel fixes | UX fixes | Read metrics | Share objections |
| **7** | Tech debt top 1 | — | Channel recap | Pipeline recap |

---

## After day 7

- Keep **`7day-metrics.md`** as a template for weekly reviews.  
- Align with **`growth-execution.md`**, **`sales-execution.md`**, **`performance.md`**.
