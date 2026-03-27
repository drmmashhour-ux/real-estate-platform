# ImmoContact system — smart lead capture

**Public name:** “Contact broker” / “Book a visit” / chat CTA  
**Internal name:** ImmoContact (`leadSource: immo_contact`)

## What shipped

| Area | Implementation |
|------|------------------|
| **Entry points** | BNHub broker listings: sticky dock — **Contact broker**, **Book a visit**, **Chat** open `ImmoContactModal` with the right `source`. CRM public listing page `/listings/[id]`: **Contact broker** opens the same modal (`source: form`). |
| **Form** | Full name, phone, email, optional message; smart fields: buying soon, budget range, pre-approved; optional SMS/WhatsApp + voice consent. |
| **Auto context** | Server resolves listing: BNHub (`listingKind: bnhub`) or CRM `Listing` (`crm`); stores `listingId`, `listingCode` (LEC), title, location in lead body + `aiExplanation.immoContact`. |
| **Scoring** | `scoreImmoLead()` wraps `scoreLead` + bonuses (timeline, pre-approval, budget). **HOT** → `pipelineStatus: qualified`, `recordHotLeadAlert` when an attributed broker exists. |
| **CRM** | `POST /api/immo/contact` → `prisma.lead.create` with `leadSource: immo_contact`, full message blob, JSON snapshot. |
| **Broker notify** | `sendLeadNotificationToBroker` with listing code + URL. |
| **Client ack** | `sendImmoContactAcknowledgement` — *“Thanks! A broker will contact you shortly.”* (+ listing title). |
| **Follow-up** | `triggerAiFollowUpForLead` with consent + jobs; `loadListingMeta` extended for **CRM `Listing`** titles (SMS templates). Timeline event `immo_contact_captured` includes `similarSearchUrl` (BNHub search by city or `/search/bnhub`). |
| **AI continuation** | After success, BNHub flows show floating **ClientCommunicationChat** (optional qualification). CRM copy explains broker will call/email. |
| **UI** | Modal: dark theme, large tap targets, stacked layout on small screens; `ImmoContactModal` + `ListingStickyContactBar` integration. |

## Files (reference)

- `app/api/immo/contact/route.ts` — API
- `components/immo/ImmoContactModal.tsx` — UI
- `lib/immo/resolve-listing.ts`, `score-immo-lead.ts`, `types.ts`
- `components/bnhub/ListingStickyContactBar.tsx` — Immo wiring
- `lib/email/templates.ts` — `immoContactAckEmail`
- `lib/ai/follow-up/orchestrator.ts` — CRM listing title for follow-ups

## Testing

- `npx vitest run lib/immo/score-immo-lead.test.ts`
- Manual: broker BNHub listing → Contact broker → submit → check Lead in CRM, email inboxes, timeline + tier.

## Known issues / next steps

1. **`/listings/[id]`** uses design-studio payload id — must match Prisma `Listing.id` or Immo returns 404; align IDs or add resolve-by-code.
2. **Non-broker BNHub stays** still use legacy **Messages** links (host contact).
3. **Similar listings** in automated SMS: timeline stores URL; template wiring for “no reply” nudges can consume `similarSearchUrl` in a future job step.
4. **E2E** Playwright not added; recommend one happy-path test for `/api/immo/contact`.

## Goal check

- Centralized capture: **yes** (one API + modal).  
- Qualified + routed: **yes** (score, HOT, broker attribution, notifications, follow-up hooks).  
- Simple UX: **yes** (single modal, minimal copy).
