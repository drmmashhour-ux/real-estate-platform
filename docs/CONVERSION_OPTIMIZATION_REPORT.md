# Conversion optimization — implementation report

## Objectives addressed

End-to-end funnel improvements: **search → listing → guided chat → qualified lead → broker handoff → follow-up**, with tracking and a broker-facing funnel view.

## 1. Search results (listing cards)

**File:** `app/search/bnhub/bnhub-search-client.tsx`

- Stronger card affordance: `min-h`, `border-2`, hover/active states, **View details →** CTA line.
- **Price** overlay on image; **city** as primary location line; **beds / baths / guests**; **property type** + room type.
- **Listing ID** (`listingCode`) when present.
- **Badges** from API: **New** (≤14 days), **Featured** (active FEATURED promotion), **Price drop** (reserved; `false` until price history exists).
- **Analytics:** `funnel_listing_card_click` on card tap (signed-in users only).

**API:** `app/api/bnhub/search/route.ts` — enriches ranked results with `_conversionBadges` after `rankListings()`.

## 2. Listing page

**Files:** `app/bnhub/[id]/page.tsx`, `components/bnhub/BrokerListingTopCtaStrip.tsx`, `components/bnhub/ListingStickyContactBar.tsx`

- **Sticky top rail** (broker listings): **Contact broker**, **Book a visit**, **Ask a question** — opens the **same** Immo AI sheet as the bottom/dock CTAs via `immo-open-chat` custom event (`lib/immo/immo-chat-events.ts`).
- Bottom **sticky bar** (mobile) + **desktop dock** unchanged; third CTA renamed from “Get more info” to **Ask a question**.
- Trust row remains near mobile CTAs (`ImmoContactTrustRow`).

## 3. AI chat (guided conversion)

**File:** `lib/ai/client-communication-chat.ts`

- Opener: **“Hi! I can help you with this property…”** then timeline question.
- Flow: **timeline → budget → financing → preferred contact time** (warm/hot only; cold exits before schedule).
- **Contact capture (after intent):** **full name → phone → email** (email still skippable with placeholder in CRM).
- **Callback / “speak to broker”** phrases set `brokerSpeakIntent` and **no longer hard-stop** the funnel (same idea as visit intent).
- **HOT** tier also considers **broker speak intent** with soon / visit / financing-ready signals.
- Junk phrases (`thanks`, `that's everything`, …) are **not** stored as contact time.

**API:** `app/api/ai/client-chat/route.ts` — persists `preferredContactTime`, `brokerSpeakIntent`; logs **hot handoff** to `AiUserActivityLog` as `funnel_broker_handoff_logged` when user is signed in.

## 4. Lead qualification & broker handoff

- Existing **broker email + CRM lead** flow retained; snapshot includes new fields in `aiExplanation` / chat session answers.
- **HOT** leads additionally write `funnel_broker_handoff_logged` (for signed-in users).

## 5. Follow-up automation

- Unchanged intervals: **~20 min** / **24 h** / **3 d** via `AiFollowUpSettings` and `LeadFollowUpJob` (still **15–30 min** compatible).
- Copy already aligned to short, action-oriented nudges (`lib/ai/follow-up/templates.ts` from prior pass).

## 6. Trust & credibility

- Top rail reuses **ImmoContactTrustRow** (desktop); listing hero already includes verification / broker badges / `TrustStrip`.

## 7. Conversion tracking & dashboard

**Activity types** (`app/api/ai/activity/route.ts`):  
`funnel_listing_card_click`, `funnel_broker_handoff_logged` (plus existing `search`, `listing_view`, `listing_contact_click`, `immo_ai_*`).

**Broker dashboard:**  
- **Route:** `GET /api/broker/conversion-funnel?days=14`  
- **UI:** `/dashboard/broker/conversion-funnel`  
- **Nav:** Hub navigation entry **Conversion funnel**.

Aggregates **platform-wide** event counts (signed-in users only) and **CRM lead** totals; shows **directional rates** (search→view, view→contact, etc.).

## 8. Mobile-first

- Cards and CTAs use **≥44px** touch targets; listing links use **listing code** in URL when available.

## 9. Retention (existing)

- **Save listing**, **saved searches**, **similar properties** already on BNHub listing / search — called out in UX copy where relevant.

## 10. Tests

- `lib/ai/client-communication-chat.test.ts` — greeting, tier rules (visit + broker speak), hot path with `preferredContactTime`.

## Remaining risks / next steps

| Risk | Mitigation idea |
|------|------------------|
| **Analytics only for signed-in users** | Add cookie/session funnel endpoint for anonymous hashed sessions. |
| **Price drop badge** | Wire `ListingPromotion` or price history when available. |
| **Funnel rates** | Can be skewed when denominators are small; show confidence / raw counts only. |
| **Duplicate CTAs** | A/B test top rail vs bottom-only on broker listings. |

## Files touched (summary)

- `app/api/bnhub/search/route.ts`
- `app/search/bnhub/bnhub-search-client.tsx`
- `app/bnhub/[id]/page.tsx`
- `components/bnhub/BrokerListingTopCtaStrip.tsx` (new)
- `components/bnhub/ListingStickyContactBar.tsx`
- `lib/immo/immo-chat-events.ts` (new)
- `lib/ai/client-communication-chat.ts` + `.test.ts`
- `app/api/ai/client-chat/route.ts`
- `app/api/ai/activity/route.ts`
- `app/api/broker/conversion-funnel/route.ts` (new)
- `app/(dashboard)/dashboard/broker/conversion-funnel/page.tsx` (new)
- `lib/hub/navigation.ts`
- `components/ai/ClientCommunicationChat.tsx`
- `app/listings/[id]/page.tsx`
