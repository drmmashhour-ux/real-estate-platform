# 0 → 10,000 users — phased growth plan

Operational playbook for LECIPM / BNHub-style marketplace growth. Tactics are human-led until monitoring and autonomy levels justify automation.

## Phase 1 — First ~100 users (manual + targeted)

- Recruit **~20 hosts** personally; help them publish high-quality listings (photos, pricing, policies).
- Run **first real bookings** (friends & network) through EN + FR + AR and **Syria manual** path where relevant.
- Fix friction surfaced by **E2E suite** and **`/admin/monitoring`** (booking success, manual delays, errors).

## Phase 2 — ~100 → 1,000

- **City landing pages** + localized SEO (EN / FR / AR).
- Short-form distribution (TikTok / Instagram) pointing to **contact-host** funnel for contact-first markets (e.g. Syria).
- **Referral links** for hosts and guests; track via existing growth funnel events.

## Phase 3 — ~1,000 → 5,000

- Turn on **AI content** and **SEO page generation** only under **SAFE_AUTOPILOT** + human QA for published pages.
- **Featured listings** and email/push — template-based, no risky auto-messaging without review.
- Use **`lib/growth/engine.ts`** opportunity scan in weekly ops review.

## Phase 4 — ~5,000 → 10,000

- Paid acquisition and partnerships; **ranking engine** weights tuned from `lib/learning/listing-weight-hints.ts` outcomes.
- Retention: saved listings, price-drop alerts, re-engagement campaigns (approval-gated where content is personalized).

## Safety (all phases)

- Never auto-execute: **payments, refunds, disputes, legal messages** — see `lib/system-brain/safety-guardrails.ts`.
- **Pricing suggestions** from `lib/revenue/pricing-engine.ts` require explicit approval before apply (`pricing_or_fee_change`).
