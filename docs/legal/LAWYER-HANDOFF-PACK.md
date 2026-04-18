# Lawyer handoff package — LECIPM

**Status:** **DRAFT — internal briefing for counsel.**  
**Not legal advice.** Does **not** replace review of the underlying policy drafts in this folder.  
**Not** a representation of legal compliance, regulatory approval, or fitness for any particular use.

---

## How to use this document

- Use it to **orient** review of: `TERMS-OF-SERVICE-DRAFT.md`, `PRIVACY-POLICY-DRAFT.md`, `ACCEPTABLE-USE-POLICY-DRAFT.md`, `NDA-MUTUAL-DRAFT.md`, `NDA-CONTRACTOR-IP-ASSIGNMENT-DRAFT.md`.  
- Cross-check every operational claim against **actual** product behavior, **actual** vendor contracts, and **actual** data flows before relying on this text in any filing or customer-facing material.

---

## A. Business overview (factual description — verify against product)

### What LECIPM is

LECIPM is a **digital real estate platform** (web and related surfaces) that connects **property stakeholders** and supports workflows such as **listings**, **leads**, **bookings** (where the product implements them), and **payments** (where integrated). The codebase and `docs/legal/` materials describe a **Canada / Québec–oriented** operating context; **confirm** geographic scope and any licensing implications with counsel.

### Key features (non-exhaustive — verify in product)

| Area | Plain-language description (for discussion) |
|------|-----------------------------------------------|
| Listings | Owners/sellers (and in some flows, brokers) can publish or manage property-related listings subject to product rules and moderation where implemented. |
| Leads | Users can express interest; messages and contact details may be captured as **leads** for follow-up. |
| Bookings | Short-stay / BNHub-style booking flows may exist where enabled — **confirm** which modules are live for your review scope. |
| Payments | Card and related payments are typically processed via **Stripe** (platform and/or Connect patterns as implemented). **Do not** infer escrow or trust status from this summary. |
| AI layer | AI-assisted features (e.g. drafting, ranking, recommendations, scoring) may appear — outputs are **informational** unless product and contracts say otherwise. |

### Who uses the platform (illustrative)

- **Landlords / hosts** — list or promote properties; manage inquiries or bookings where applicable.  
- **Sellers / FSBO** — list properties, sometimes with broker-related options depending on configuration.  
- **Buyers / tenants / guests** — browse, inquire, book, or pay depending on feature set.  
- **Brokers / professionals** — where roles exist in the product.  
- **Administrators** — moderation, support, configuration.

### Geographic scope

- Materials under `docs/legal/` are structured as **Canada / Québec–friendly**; **English** drafts may require **French** counterparts for certain Québec public-facing obligations — **Bill 96** and consumer law — **specialist counsel** required (see `LEGAL-IMPLEMENTATION-NOTES.md`, `JURISDICTION-CHECKLIST.md`).

### Revenue model (commercial — align with actual price lists & Stripe)

**Internal commercial framing** (including growth experiments) may reference:

| Element | Notes for counsel |
|---------|-------------------|
| Free first listing | Promotional/onboarding offer — **must match** actual checkout and marketing copy. |
| Paid listing (e.g. nominal listing fee) | Example figures may appear in internal docs — **verify** against live Stripe products and tax treatment. |
| Pay-per-qualified-lead | High **dispute** potential — definition of “qualified,” refunds, and **disclaimers** need product–legal alignment. |
| Subscriptions / upgrades | May exist for certain roles or hubs — **map** each SKU to contracts and ToS sections. |

**Placeholder:** Attach a **current** schedule of fees, taxes, and refund rules as implemented in admin/Stripe.

---

## B. Data flow summary (high level — confirm with engineering)

**This is a briefing aid, not a data map.** A **Record of Processing Activities (RoPA)** and architecture review should confirm details.

| Topic | Summary for discussion |
|-------|-------------------------|
| **What is collected** | Account data (e.g. name, email, phone), listing/property content, lead messages, booking/payment metadata, logs/technical identifiers, and **inputs/outputs** where AI features are used — see table in `PRIVACY-POLICY-DRAFT.md` §3. |
| **Sources** | User entry, integrations, automated logging, support channels. |
| **Storage** | Application data is stored in **PostgreSQL** (e.g. via Prisma) in typical deployments; **Supabase** may be used for auth/storage depending on environment — **confirm** actual subprocessors and regions in production. |
| **Payments** | **Stripe** handles card data per Stripe’s terms; platform typically receives **transaction metadata**, not full card numbers — **confirm** in integration docs and Privacy Policy. |
| **Third parties** | Hosting, email (e.g. transactional), analytics, AI providers, maps, etc. — **subprocessor table** in Privacy Policy is a **placeholder** until completed. |

**Sharing:** Personal information may be disclosed to **service providers** under agreements, and where **required by law**. **Cross-border** transfers need explicit analysis (see `LAW25-PRIVACY-CHECKLIST.md`).

---

## C. User journeys (simplified — verify paths)

1. **Landlord/seller posts a listing** — Registration → create listing → optional verification/moderation → publication.  
2. **Contact / lead** — Buyer/tenant sends inquiry → message stored as lead → notifications to listing party / broker as implemented.  
3. **Booking / payment** (where applicable) — Search → book → pay via Stripe → confirmation; disputes per ToS/refund rules **TBD with counsel**.  
4. **Admin** — Moderation, user support, fraud checks, legal requests — internal access controls and logging should align with `LAW25-PRIVACY-CHECKLIST.md`.

---

## D. AI usage (important)

**Draft policies** address AI in `PRIVACY-POLICY-DRAFT.md` §13 (automated decision-making / AI placeholder). Product behavior should be described consistently:

- **No guarantee** that AI outputs are accurate, complete, or suitable for any transaction.  
- **Advisory / assistive** role — users remain responsible for listings, pricing, and compliance with law (including real-estate and advertising rules).  
- **No autonomous execution** of financial transactions beyond what the user explicitly triggers through the UI and payment flows.  
- **Ranking / recommendations / scoring** — if used, should be framed to avoid misleading “endorsement” or investment advice — **counsel** to align marketing and ToS.

---

## E. Known legal risk areas (non-exhaustive — not conclusions)

These are **topics** for counsel to assess — **not** an admission of liability.

| Area | Why it matters |
|------|----------------|
| **Lead quality disputes** | Pay-per-lead or promotion claims can conflict with user expectations; refunds and definitions need clarity. |
| **Payment / refund disputes** | Stripe chargebacks, subscription cancellations, promotional pricing — align ToS with consumer rules. |
| **Misuse of listings** | Fraud, discrimination, illegal rentals — AUP enforcement and monitoring disclaimers. |
| **Scraping / copying** | Competitors or bots — ToS/AUP and technical controls; see `TERMS-OF-SERVICE-DRAFT.md` §4, `ACCEPTABLE-USE-POLICY-DRAFT.md` §2. |
| **Privacy / consent** | Law 25, marketing consent, cookies, AI data — `LAW25-PRIVACY-CHECKLIST.md`. |
| **Platform misuse** | Spam, harassment, circumvention — enforcement and liability limits. |
| **Brokerage / regulatory** | If OACIQ or other licensing concepts apply to specific flows — **specialist** real-estate regulatory counsel may be needed beyond generic ToS review. |

---

## Related internal files

- `REVIEW-NOTES-FOR-COUNSEL.md` — section-by-section review prompts.  
- `JURISDICTION-CHECKLIST.md`, `LIABILITY-RISK-SUMMARY.md`, `QUESTIONS-FOR-LAWYER.md`.  
- `LEGAL-IMPLEMENTATION-NOTES.md` — app surfaces and processes.

**Effective as briefing:** **DRAFT** — update when material product or vendor facts change.
