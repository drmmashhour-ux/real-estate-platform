# BNHub — Full platform roadmap

This document is the **single STR marketplace roadmap** for BNHub: what to build, in what order, and how phases roll up into **MVP**, **production hardening**, **differentiation**, and **expansion**. It aligns booking, payouts, messaging, and reviews so the product can operate as a **serious STR marketplace**, not only a booking page.

**Success metric:** BNHub can operate end-to-end as an STR marketplace—discovery → book → pay → stay → message → review → host earnings—with trust, compliance, and growth loops appropriate to Québec and BNHub’s positioning.

---

## Suggested code organization

Prefer cohesive domains under versioned or namespaced packages (exact repo layout may vary):

| Area | Suggested module prefix | Owns (conceptually) |
|------|------------------------|---------------------|
| Listings & host listing UX | `modules/bnhub/listings/*` | Draft → publish, media, amenities, house rules, pricing surfaces, instant book vs request |
| Calendar & availability | `modules/bnhub/calendar/*` | ICS/import, blocks, booked nights, overlap rules, host calendar API |
| Host dashboard | `modules/bnhub/host-dashboard/*` | Listings, bookings ops, earnings summaries, occupancy hints (UI + BFF) |
| Guest discovery & trips | `apps/web` + shared libs | Search, filters, PDP, checkout, trip history (can split to `modules/bnhub/guest/*` later) |
| Reservation engine | `lib/bnhub/booking` + DB | Holds, confirmation, cancellation, pricing snapshot |
| Payments | existing Stripe / BNHub payment docs | Guest charge, Connect, payouts, fees |
| Messaging | existing `BookingMessage` / threads | Guest ↔ host, booking-linked, audit |
| Reviews | new `modules/bnhub/reviews/*` (recommended) | Post-stay, dedupe, host↔guest flows |
| Trust & safety | policy + flags + disputes | Verification hooks, abuse, disputes |
| AI / host intelligence | existing agent stack | Suggestions only in safe modes; see `docs/ai/AGENTS.md` |

Related existing docs: `docs/bnhub/stripe-connect-marketplace.md`, `docs/bnhub/platform-architecture-mobile.md`, `docs/bnhub/map-search-roadmap.md`, `docs/bnhub/listing-media-storage.md`.

---

## Roadmap splits (how to read the phases below)

### MVP (ship a credible marketplace)

Minimum to **list, discover, book, pay, message, and complete a stay** with basic host and guest dashboards.

- **Phase 1 — Host listing core:** calendar blocking; booking request vs instant book; house rules; photos & amenities (backed by `modules/bnhub/listings/*`, `modules/bnhub/calendar/*`, `modules/bnhub/host-dashboard/*` as APIs/UI consolidate).
- **Phase 2 — Guest product core:** search, filters, listing detail, checkout, booking management, trip history.
- **Phase 3 — Reservation engine:** production-grade schema, **overlap protection**, pricing snapshot, hold → confirm → cancel flows.
- **Phase 5 — Messaging (MVP slice):** guest ↔ host on **booking-linked threads**; basic auditability (timestamps, actor, booking id).
- **Phase 6 — Reviews (MVP slice):** guest reviews listing/host after completed stay; anti-duplicate; optional host reviews guest.
- **Phase 10 — Dashboards (MVP slice):** host dashboard + guest trips; minimal booking ops and revenue visibility.

### Production hardening (scale, money, and risk)

Everything that makes the system **safe under load and money movement**.

- **Phase 4 — Payments + host payouts:** Stripe guest checkout; host payout **readiness**; payout status tracking; platform fee tracking. **Do not auto-release payouts** without explicit lifecycle rules (manual review windows, dispute holds, market mode).
- **Phase 3 (depth):** idempotent holds, race-safe overlap checks, cancellation policy enforcement tied to snapshots.
- **Phase 8 — Trust & safety (foundation):** identity/verification hooks; fraud/suspicious booking signals; cancellation abuse tracking; dispute/support event model.
- Observability, rate limits, and admin tooling for the above (tie to `docs/bnhub/testing/READINESS.md` patterns).

### Differentiation (moat and BNHub-specific value)

What makes BNHub **not a generic clone**.

- **Phase 7 — Host intelligence:** pricing suggestions; listing improvements; occupancy insights; green score / upgrade potential; **host autopilot only in safe modes** (suggestions and gated actions—aligned with agent keys in `docs/ai/AGENTS.md`).
- **Phase 11 — Marketplace differentiation:** AI-managed host tools; Québec / green intelligence; Dream Home & lifestyle matching; portfolio / investor intelligence for STR operators; broker ↔ host crossover where compliance allows.

### Expansion roadmap (growth and ecosystem)

Features that **compound** after core liquidity exists.

- **Phase 9 — Growth loops:** referrals; loyalty / repeat booking; wishlists; alerts (price drops, availability).
- **Phase 11 (expansion):** deeper broker tools, B2B host portfolios, API partners.
- **Phase 12 — Documentation:** this file plus per-domain runbooks; keep **MVP vs production vs differentiation** labels when adding new epics.

---

## Phases 1–12 (detailed backlog)

### Phase 1 — Host listing core

| Theme | Deliverables |
|-------|----------------|
| Calendar blocking | Host UI + API for blocks; sync with booked nights; clear semantics (block vs maintenance vs owner stay). |
| Booking model | Per-listing: **request to book** vs **instant book**; host notification and timeout rules. |
| House rules | Structured fields + display on PDP; optional acknowledgment at checkout. |
| Photos / amenities | Media pipeline per `listing-media-*` docs; amenity taxonomy and validation. |

**Modules:** `modules/bnhub/listings/*`, `modules/bnhub/calendar/*`, `modules/bnhub/host-dashboard/*`.

### Phase 2 — Guest product core

- Search (text + geo; see map-search roadmap).
- Filters (price, guests, dates, amenities, instant book, etc.).
- Listing detail page (rules, calendar preview, policies).
- Checkout (dates, guests, fees, policies).
- Booking management (cancel/modify per policy).
- Trip history (upcoming / past, receipts, messages entry point).

### Phase 3 — Reservation engine

- Use **production booking schema** with **overlap protection** (DB constraints + transactional checks).
- **Pricing snapshot** at reservation time (nightly, fees, taxes as applicable).
- **Hold flow** (inventory lock or soft hold with TTL).
- **Confirmation flow** (payment + host rules for instant vs approval).
- **Cancellation flow** (policy-driven refunds; ledger alignment).

### Phase 4 — Payments + host payouts

- Guest checkout (Stripe PaymentIntents / Checkout as per existing integration).
- Host Connect onboarding and **payout readiness** gating.
- Payout status tracking (pending, in_transit, paid, failed, held).
- Platform fee tracking (explicit lines; reconcilable).
- **No silent auto-release** of payouts—document lifecycle in `stripe-connect-marketplace` and product policy.

### Phase 5 — Messaging

- Guest ↔ host conversation on **booking-linked** threads (existing `BookingMessage` model direction).
- Safety: rate limits, report/flag hooks, audit fields, optional moderation queue.
- Optional voice only if already present in stack; otherwise defer.

### Phase 6 — Reviews

- Guest → host/listing review after **completed stay** only.
- Optional host → guest review.
- **Anti-duplicate** (one review per booking per direction; idempotent submit).
- Display on listing and host profile with abuse reporting.

### Phase 7 — Host intelligence (AI)

- Pricing suggestions (explainable; not silent price changes).
- Listing improvement suggestions (copy, photos, amenities gaps).
- Occupancy insights (simple charts + narrative).
- Green score / upgrade potential (Québec-relevant signals).
- Autopilot: **safe modes only**—human-visible proposals, policy-bound execution.

### Phase 8 — Trust & safety

- Identity / verification hooks (document upload, provider placeholders).
- Fraud flags and suspicious booking signals (velocity, mismatch, payment risk).
- Cancellation abuse tracking.
- Dispute / support event model (timeline, assignments, resolutions).

### Phase 9 — Growth loops

- Referrals (attribution, rewards rules).
- Loyalty / repeat-booking incentives.
- Wishlists / saved stays.
- Alerts: price drops, availability opens (email/push per product).

### Phase 10 — Host / guest dashboards

- Host dashboard: listings, calendar, bookings, earnings, messaging inbox.
- Guest trips dashboard: upcoming/past, actions, support.
- Booking operations panel (host): approve/deny, special requests.
- Revenue / occupancy insights panel (aggregate, export-ready later).

### Phase 11 — Marketplace differentiation

- AI-managed host tools (workflow, not black box).
- Québec / green intelligence.
- Dream Home / lifestyle matching (retrieval + ranking).
- Portfolio / investor intelligence for STR operators.
- Broker + host crossover where legally and commercially viable.

### Phase 12 — Documentation / roadmap

- This file is the **north star**; add linked epics in issue tracker per phase.
- For each new initiative, tag: **MVP** | **hardening** | **differentiation** | **expansion**.

---

## Final alignment checklist

| System | Aligned when… |
|--------|----------------|
| Booking | Snapshot + overlap + state machine documented; cancel/refund rules tied to ledger. |
| Payouts | Statuses visible to host; releases follow explicit lifecycle; fees auditable. |
| Messaging | Threads scoped to bookings; audit trail; escalation path to trust tools. |
| Reviews | Eligibility = completed stay; duplicates impossible by constraint + API. |
| Host / guest value | Hosts earn with clarity; guests trust discovery and post-book support. |
| AI | Sits on a **strong core**—suggestions and gated actions, not a substitute for payments/booking correctness. |

---

## Revision history

- **2026-04-24:** Initial full-platform roadmap (phases 1–12 rolled into MVP / hardening / differentiation / expansion).
