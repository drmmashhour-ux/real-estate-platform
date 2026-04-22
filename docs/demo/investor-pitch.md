# LECIPM investor demo — under 5 minutes

Use **Canada + English** URLs unless you are demoing another market: base path **`/en/ca/`**.

**Before you go live:** log in as a **broker** (or operator) account, confirm **senior residences** exist in the DB or staging, and open routes once in a clean tab to avoid cold-cache errors.

---

## Clock (target ~4:30 + buffer)

| Block        | Time   | Content                                      |
|-------------|--------|----------------------------------------------|
| Problem     | ~30s   | Fragmented, slow, inefficient transactions   |
| Solution    | ~30s   | LECIPM as AI-powered real estate OS          |
| Live demo   | ~3:00  | Six steps below (smooth tab order)           |
| Impact      | ~20s   | Friction, conversion, scalable marketplace   |
| Ask         | ~10s   | Raising to scale                             |

---

## Part 1 — Problem (~30 seconds)

**Say (adapt to room):**

> “Real estate transactions are still fragmented across portals, spreadsheets, email, and paper. That makes everything slower, harder to trust, and expensive to operate — for consumers and for professionals.”

---

## Part 2 — Solution (~30 seconds)

**Say:**

> “LECIPM is an **AI-powered real estate operating system**: one place where discovery, matching, lead capture, transaction files, and analytics connect — so teams run the full lifecycle instead of stitching tools together.”

---

## Part 3 — Live demo (~3 minutes)

Perform steps **in order**. Keep commentary short; let the product carry the story.

### Step 1 — Homepage → Senior hub (~25s)

1. Open **`/en/ca/`** (homepage).
2. Say one line: *“This is the front door — multi-hub, one platform.”*
3. Navigate to **`/en/ca/senior-living`** (Senior Living hub).
4. **Line:** *“Here’s a dedicated path for senior living — simple UX, built for families and operators.”*

### Step 2 — Matching → results (~35s)

1. From the hub, complete the **search / matching flow** (city, needs, or guide — whatever your build exposes).
2. Land on **`/en/ca/senior-living/results`** or the results view after submit.
3. **Line:** *“Matching turns intent into a short list of suitable residences — that’s conversion at the top of the funnel.”*

### Step 3 — Request visit → lead (~35s)

1. Open a **residence detail**: **`/en/ca/senior-living/[id]`** (pick a real ID from results).
2. Submit **visit request** or **contact** (the flow your environment uses).
3. **Line:** *“Every serious click becomes structured demand — not a lost email.”*

### Step 4 — Operator dashboard → lead received (~40s)

1. Switch to your **logged-in broker/operator** session (second browser or incognito for consumer, normal window for ops).
2. Open **`/en/ca/dashboard/broker/crm`** or **`/en/ca/dashboard/broker/intake`** — wherever inbound leads surface for your role.
3. Show the **new lead / inquiry** tied to the contact you just sent.
4. **Line:** *“The same event is already in the operator workspace — attribution intact.”*

### Step 5 — Transaction system → SD number (~40s)

1. Open **`/en/ca/dashboard/transactions`** (transaction file list).
2. Open one **transaction**: **`/en/ca/dashboard/transactions/[id]`**.
3. Point to the **SD / transaction number** and (if available) **documents / timeline**.
4. **Line:** *“Deals get a durable file — Centris-style SD numbering — so compliance and handoffs aren’t reinvented per deal.”*

### Step 6 — AI + analytics (~25s)

Pick **one** surface so you stay under time:

- **Broker AI / leads:** **`/en/ca/dashboard/broker/ai-leads`** or **`/en/ca/dashboard/broker/market-insights`**, **or**
- **Admin KPI / automation (if your audience is technical):** **`/en/ca/dashboard/admin/kpi`** or **`/en/ca/dashboard/admin/automation`**.

**Line:** *“AI and analytics sit on top of the same data model — scoring, routing, and reporting without exporting to spreadsheets.”*

---

## Part 4 — Impact (~20 seconds)

**Say:**

> “This reduces **friction** for buyers and sellers, increases **conversion** because intent becomes structured data, and creates a **scalable marketplace** — same rails for operators, brokers, and future hubs.”

---

## Part 5 — Ask (~10 seconds)

**Say:**

> “We’re **raising capital to scale** this stack — product, GTM, and depth in priority markets. Happy to walk through the round and milestones.”

---

## Acceptance checklist (your Part 5)

- [ ] **Total time &lt; 5 minutes** (rehearse once with a timer).
- [ ] **Flow is linear** — bookmarks in order: home → senior hub → results → detail → broker CRM → transactions → one AI/analytics screen.
- [ ] **No errors** — staging seeded, accounts ready, no paywalls blocking the path mid-demo.

---

## Quick reference — URLs

| Step | Path pattern |
|------|----------------|
| Home | `/en/ca/` |
| Senior hub | `/en/ca/senior-living` |
| Results | `/en/ca/senior-living/results` |
| Residence | `/en/ca/senior-living/[id]` |
| Broker CRM / intake | `/en/ca/dashboard/broker/crm`, `/en/ca/dashboard/broker/intake` |
| Transactions | `/en/ca/dashboard/transactions`, `/en/ca/dashboard/transactions/[id]` |
| AI / insights (pick one) | `/en/ca/dashboard/broker/ai-leads`, `/en/ca/dashboard/broker/market-insights`, `/en/ca/dashboard/admin/kpi` |

---

## Final result

You deliver a **clear narrative** (problem → OS → proof in product → impact → ask) with a **repeatable &lt; 5 minute** path through **senior discovery → lead → operator → transaction file → intelligence**.
