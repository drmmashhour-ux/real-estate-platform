# AI client communication — Québec real estate (compliance-first)

Rule-based assistant: **fast replies**, **qualification**, **contact capture** (warm/hot only), **broker handoff** for hot leads.  
**Not** a licensed courtier; **no** legal/tax advice; **no** price negotiation (OACIQ-regulated brokerage is explicit in copy).

## Final output checklist

| Item | Status |
|------|--------|
| Chat working | `POST /api/ai/client-chat` + `ClientCommunicationChat` |
| Leads captured | Warm/hot only → `Lead` + email to broker (when configured) |
| Hot leads identified | Rule: **soon + (pre-approved OR cash)** → tier **hot**, message **HOT LEAD**, automation events |
| Issues / limits | No automated closing; availability is **non-binding** until a broker confirms; run DB migration |

## Entry points

1. **Listing / site** — `ListingContactChatLauncher` (Contact button → modal chat).  
2. **Floating widget** — `/properties` uses `PropertiesPageChat`.  
3. **Embed (Wix)** — iframe ` /embed/ai-chat?city=Mirabel&title=...&listingId=...&brokerId=... `  
4. **API** — any client can `POST` messages (CORS via `AI_CLIENT_CHAT_CORS_ORIGINS`).

## Conversation flow (spec)

1. **Opening:** `Hi! 👋 I can help you with {title}. Is it the one in {city} you're interested in?` + compliance notice + first question.  
2. **Core questions:** Timeline → Budget → Financing (exact prompts in code).  
3. **Tier:** **Hot** = soon + pre-approved **or** cash · **Cold** = later / browsing · **Warm** = other completed cores.  
4. **Contact:** Asked **only** if warm or hot (name + phone prompt, then email).  
5. **Hot handoff:** “Great! I'll connect you with a broker right away 👍” + broker notification + `HOT LEAD` in lead message + `AiAutomationEvent`.

## Data stored

- **`Lead`** — warm/hot with `aiExplanation` including `conversationHistory`, `leadLabel: HOT LEAD` when hot, `complianceTag: quebec_real_estate_v1`.  
- **`AiClientChatSession`** — transcript + answers + tier + score (cold sessions without PII in `answers` name field).  
- **Migration:** `20260321120000_ai_client_chat_sessions`.

## Compliance rules implemented

- Does **not** give legal/notarial advice, negotiate, or act as broker.  
- States assistant role + **Québec regulated brokerage** + **OACIQ** reference in disclaimer.  
- Availability and price answers defer to a **licensed broker** for binding facts.

## Automation

- Email: existing `sendLeadNotificationToBroker` (needs `BROKER_EMAIL` / notification address).  
- Events: `hot_lead_alert`, `client_chat_handoff`, `client_chat_escalation`.  
- **CRM:** use your worker to read `AiAutomationEvent` / webhook; not fully wired here.

## Testing

```bash
cd apps/web && npx vitest run lib/ai/client-communication-chat.test.ts
```

## Deploy

```bash
npx prisma migrate deploy
```

## Goal

Visitors → **qualified leads** → **broker** → deals. The AI **assists**; humans **close**.
