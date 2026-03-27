# Immo high-conversion contact flow — implementation report

## Summary

Replaced **form-first** Immo entry on BNHub broker listings with an **AI-first** funnel: CTAs open `ClientCommunicationChat` (embedded sheet) with auto-bootstrap greeting, short qualification, phone → name → optional email, CRM lead creation, broker email, and Immo acknowledgement when the client provides a real email.

## Conversion-oriented behavior

| Area | Implementation |
|------|------------------|
| **CTAs** | **Contact broker**, **Book a visit**, **Get more info** (all open the same AI chat; sticky bar mobile + desktop dock). |
| **Trust** | `ImmoContactTrustRow`: verified broker, fast response, secure inquiry. |
| **AI-first** | No form before chat; opening message matches product copy (`Hi! 👋 I can help you with this property…`). |
| **Qualification** | Timeline → budget → financing (pre-approved / cash); visit/tour phrases set `visitIntent` without killing the funnel. |
| **Contact capture** | Phone first (“Perfect 👍…”), then name, then **optional** email (skip allowed). |
| **HOT / WARM / COLD** | Rule-based tier; HOT includes soon + (pre-approved \| cash), soon + visit intent, or visit + (pre-approved \| cash). |
| **Broker handoff** | `sendLeadNotificationToBroker` + transcript/summary in `message`; placeholder CRM email if client skips email (`*@immocontact.placeholder`) with note in body. |
| **Client confirmation** | In-chat: “Thanks! A broker will contact you shortly 👍 Usually within a few minutes.” Email: `immoContactAckEmail` updated with same timing line when email provided. |
| **Follow-up SMS** | Jobs: ~`minutesToSecondTouch` (default 20), `hoursToDayOneTouch` (24), `daysToFinalTouch` (3). EN/FR templates aligned to nurture check copy. |
| **Compliance** | Québec disclaimer retained; no legal/negotiation path; viewing requests qualify instead of hard chat stop. |
| **Tracking** | `/api/ai/activity`: `immo_ai_chat_started`, `immo_ai_qualification_complete`, `immo_ai_contact_captured`, `immo_ai_hot_lead` (+ existing `listing_contact_click`). **Requires signed-in user** (same as other activity events). |
| **CRM** | `leadSource`: `immo_ai_chat` when `flow: immo_high_conversion`; `aiExplanation` includes `immoHighConversion`, `clientEmailProvided`, `listingTitle`. |

## Files touched (high level)

- `lib/ai/client-communication-chat.ts` — greeting, visit intent, tier rules, phone/name/optional email, confirmations.
- `app/api/ai/client-chat/route.ts` — optional email leads, placeholder email, Immo ack, `immo_ai_chat` source.
- `components/ai/ClientCommunicationChat.tsx` — `embedded`, `autoBootstrap`, `flow`, `variant`, Immo activity logging.
- `components/bnhub/ListingStickyContactBar.tsx` — AI sheet, trust row, three CTAs, `introducedByBrokerId`.
- `components/immo/ImmoContactTrustRow.tsx` — trust strip.
- `app/bnhub/[id]/page.tsx` — passes broker id + city into sticky bar.
- `app/listings/[id]/page.tsx` — public CRM listing: AI-first overlay (no `ImmoContactModal`).
- `app/api/ai/activity/route.ts` — new allowed event types.
- `lib/email/templates.ts`, `lib/ai/follow-up/templates.ts` — copy updates.
- Tests: `client-communication-chat.test.ts`, `templates.lead.test.ts`.

## Issues / limitations

1. **Activity tracking & auth** — Funnel analytics events return 401 for anonymous users; only logged-in users are recorded in `AiUserActivityLog`.
2. **SMS follow-up** — Requires consent checkboxes + Twilio (or internal log when not configured).
3. **CRM listing page** — `introducedByBrokerId` is not wired from payload; broker routing relies on global notification email.
4. **`ImmoContactModal`** — Still in repo for other entry points; primary BNHub broker path is AI chat only.

## Recommendations

- Add **guest-safe** analytics (hashed session id) if marketing needs anonymous funnel metrics.
- Pass **CTA intent** (`contact_broker` \| `book_visit` \| `more_info`) into chat context to tweak first assistant line (e.g. visit CTA acknowledges scheduling).
- **E2E test** (Playwright): CTA → sheet → qualify → skip email → assert `Lead` row + broker notification mock.

## How to test manually

1. Open a **broker** BNHub listing → tap **Contact broker** → confirm greeting → answer soon / budget / pre-approved → phone → name → skip email → see confirmation; check CRM lead and team inbox.
2. Repeat with **Book a visit** early in chat → ensure funnel continues (no hard stop).
3. Sign in and confirm `immo_ai_*` rows in activity log (if desired).

## Conversion hypotheses

- **Higher start rate**: removing the form wall should increase chat starts.
- **Higher completion**: fewer fields at capture (email optional) should improve phone+name completion.
- **Better HOT routing**: visit intent + soon surfaces motivated buyers earlier for broker callback.
