# First paying operator in ≤ 7 days (GTM playbook)

**North star:** 1 **paying** operator + 1 **paid** lead, with a **satisfied** operator (not just a card charge).

**Reality check:** “Complete only if real payment + satisfied” is a **business outcome**—ship a clear offer, book demos, and use **Stripe** (Payment Link or Checkout) for the first commercial lead. The app’s `POST /api/billing/checkout` is for **storage plan** upgrades, not senior-residence PPL—use **Stripe Dashboard** (or a one-off Checkout) for operator billing until productized.

---

## Part 1 — Target list (same city)

**Goal:** **10 small residences** (operators you can reach in days), **one metro area**.

**Where to build the list (60–90 min once):**

| Source | Use for |
|--------|---------|
| Google Maps | “résidence pour personnes âgées”, “senior residence”, neighbourhood name |
| Provincial / regional registries | Québec: inform yourself on licensed housing where applicable |
| Associations / chambers | Local seniors’ networks, healthcare referral lists (public directories) |
| Warm intros | One friendly contact who knows a director |

**Pick one city** (e.g. Greater Montréal Laval corridor, Québec City metro, Ottawa–Gatineau) so visits and referrals stay credible.

**Track in a sheet:** Residence name · address · phone · GM/director email · beds/units · notes · contact date · next follow-up.

---

## Part 2 — Outreach rhythm (daily)

**Daily minimum:**

- **10 outbound touches** (mix: call → voicemail + email → LinkedIn only if relevant).
- **Follow-ups:** same-day short email after any voicemail; Day 3 and Day 7 pings for warm threads.

**Cadence (example week):**

| Day | Focus |
|-----|--------|
| 1–2 | List + first pass (intro + ask for 15 min) |
| 3–5 | Demo slots + referrals (“who else runs a 30–80 bed residence?”) |
| 6–7 | Close trial terms + send payment link after first qualified lead |

**Templates (keep under 120 words):**

**Email / DM:**

> Subject: Qualified families → visits at [Residence Name]  
> Hi [Name],  
> We work with families looking for senior living in **[City]**. LECIPM matches them to suitable residences and sends **qualified visit requests**—not cold lists.  
> Open to **15 minutes** this week to show you how it works for operators like you?  
> [Your name] · [Phone]

**Follow-up:**

> Quick bump — happy to share how other small residences in [region] use warm introductions vs. generic portals. Still good for a short call?

---

## Part 3 — Offer (pitch)

**One sentence (memorize):**

> **“We send you qualified families who are ready to visit—not random clicks.”**

**Supporting bullets (only if they ask):**

- Intent is captured in-product (needs, timing, geography).
- You get structured leads you can **call back** and **schedule**.
- We’re **not** promising census fill—promise **fit** and **process**.

---

## Part 4 — Close (after demo)

**Structure:**

1. **Trial:** First **N** qualified leads **free** (pick **N** you can afford: often **1–3**).
2. **Then:** **Pay per lead** (flat $X per delivered qualified lead or per booked visit—**define “qualified” in one line**, e.g. “family confirmed budget band + desired move-in window + requested your residence”).

**Verbal close:**

> “Let’s start with **[N] leads on us**. When you’re happy with quality, we switch to **$X per lead**—I’ll send a **Stripe** link for the first paid one so it’s clean and recorded.”

Put **N**, **X**, and **definition of a billable lead** in a **one-page email** after the call.

---

## Part 5 — Payment (Stripe)

**Fastest path (no code):**

1. **Stripe Dashboard** → **Product catalogue** → create product e.g. “LECIPM — Senior qualified lead (per lead)”.
2. **Payment Link** → price in **CAD**, one-time → share URL in email after they agree.
3. Optional: add **metadata** (residence name, city) in the link if your Stripe plan supports prefilled/custom fields.

**When first billable lead happens:**

- Send the Payment Link with invoice-like text: *“Lead #1 — [Family initial] — [Date] — [Your definition].”*
- Record payment in your sheet and confirm **operator acknowledgment** (reply “received” / call).

**In-app:** Existing **`POST /api/billing/checkout`** is tied to **storage plans** (`apps/web/app/api/billing/checkout/route.ts`), not PPL—use Dashboard links for this sprint unless you build a dedicated endpoint.

**Env:** Production **`STRIPE_SECRET_KEY`**, **`STRIPE_WEBHOOK_SECRET`**, **`NEXT_PUBLIC_APP_URL`** must match your live site so future Checkout flows stay consistent.

---

## Part 6 — Success metrics

| Metric | Target |
|--------|--------|
| Paying operator | **≥ 1** (signed terms + paid at least once) |
| Paid lead | **≥ 1** Stripe payment tied to a defined lead |
| Satisfaction | Operator says quality is **acceptable** to continue (call or email) |

---

## Part 7 — Acceptance (your bar)

Treat the sprint as **validated revenue** only when:

1. **Real payment** settled in Stripe (not test mode unless explicitly a pilot).
2. **Operator satisfied** enough to **continue** (renewal path or second lead).

If they pay but ghost—**follow up** to fix process before scaling messaging.

---

## Final result

You’ve **earned proof**: someone paid for **outcomes your system can repeat**, not a slide deck.

**Optional internal:** Link this doc from `README` or Notion; keep the **target sheet** as the single source of truth for the 7-day sprint.
