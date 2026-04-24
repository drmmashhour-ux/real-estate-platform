# AI follow-up system — voice + WhatsApp/SMS + broker handoff

**Date:** 2026-03-19  
**Status:** Core platform implemented; external providers require env + cron.

## Channels implemented

| Channel | Status |
|--------|--------|
| **SMS** | Twilio REST (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`). If unset, first-touch is logged as `LeadCommMessage` with `NOT_SENT_NO_PROVIDER` for dev visibility. |
| **WhatsApp** | Stub (`META_WHATSAPP_*`); orchestrator prefers WA when enabled + configured, else SMS. |
| **Voice** | **Queue only**: hot + `consentVoice` + `enableVoice` creates `LeadCommMessage` `channel: voice`, `status: queued` + timeline `voice_call_queued`. Integrate Twilio Voice / vendor separately. |
| **Email** | Existing lead + escalation emails; `sendFollowUpEscalationEmail` for inbound SMS safety escalations. |

## Automation flows

1. **Triggers** (orchestrator `triggerAiFollowUpForLead`):
   - Project lead form: `POST /api/lecipm/leads` (after create).
   - Contact page: `POST /api/contact`.
   - AI client chat: after persisted lead from chat (`leadSource: ai_chat`).

2. **Consent** (`LeadContactConsent`): SMS/WhatsApp and voice flags, locale, `sourcePage`, hashed IP, user-agent.  
   - **UI:** Contact form + `ClientCommunicationChat` checkboxes.  
   - **Rules:** If `requireExplicitConsent` (default **true** in DB settings), instant SMS only when `consentSmsWhatsapp === true` and phone present.

3. **Sequence** (`LeadFollowUpJob`):
   - `nudge_30m` — `minutesToSecondTouch` (default 20).
   - `day1` — `hoursToDayOneTouch` (default 24).
   - `day3` — `daysToFinalTouch` (default 3).
   - `voice_hot` — `voiceDelayMinutes` after create (default 5), only if hot + voice consent + voice enabled.

4. **Cron:** `POST /api/cron/follow-up-jobs` with `Authorization: Bearer <CRON_SECRET>`.

## Lead pipeline (`Lead.pipelineStatus`)

Default **`new`**. Values: `new` | `contacted` | `awaiting_reply` | `qualified` | `broker_assigned` | `closed` | `lost`.  
`PATCH /api/lecipm/leads` with `status: closed` / `lost` syncs pipeline to `closed` / `lost`.

Legacy `Lead.status` (e.g. `contact_inquiry`) unchanged for compatibility.

## Broker handoff rules

- **Chat:** `classifyInboundSafety` + expanded Québec chat rules — viewing, offer/negotiation, regulated financing, legal/contract, callback, discrimination → short reply *“A broker will help you with that directly”* + `recordClientChatEscalation` / `recordClientChatHandoff` when a lead exists.
- **Inbound SMS:** same classifier → `escalateLeadToBroker` + optional `SAFETY_REPLY` SMS.
- **Hot leads:** timeline `hot_lead_automation_armed`; existing `recordHotLeadAlert` / broker email from lead creation remains.

## Compliance safeguards

- SMS body includes **assistant disclosure** (not a licensed broker).
- Consent recorded before automated SMS when `requireExplicitConsent` is true.
- **STOP** / **ARRÊT** / **unsubscribe** → `optedOutOfFollowUp`, pipeline `lost`.
- Chat + SMS safety filters for regulated / discriminatory content.

## CRM / timeline

- `LeadTimelineEvent` — capture, consent, sends, skips, opt-out, voice queued, escalations.
- `LeadCommMessage` — inbound/outbound audit.
- `GET /api/lecipm/leads/[id]/timeline` — broker/admin.

## Admin settings

- `GET` / `PATCH` `/api/admin/follow-up-settings` — **ADMIN only** (`getGuestId` + role).
- Toggles: WhatsApp, SMS, voice; timing; hot threshold; `requireExplicitConsent`; `brokerNotifyEmail`; optional `templatesJson` overrides (wired in code via `renderFollowUpTemplate` — extend to read DB overrides in a follow-up).

## Broker dashboard

- **Hub:** Broker → **AI follow-up** (`/dashboard/broker/ai-follow-up`).
- **API:** `GET /api/broker/ai-follow-up-metrics` — hot needing callback, AI-contacted count, awaiting human, voice queued.

## Multilingual templates

Built-in **en / fr / ar / es** for all template keys in `lib/ai/follow-up/templates.ts`. Locale from consent record or `navigator.language` (chat/contact).

## Analytics (query-based)

Use `LeadCommMessage`, `LeadTimelineEvent`, and `Lead.pipelineStatus` for:

- Response rate by channel, time-to-first-outbound, handoff rate, language (from `locale` on messages).

Optional: extend `POST /api/ai/activity` with dedicated `eventType` values in a later pass.

## Testing performed

- Vitest: `lib/ai/follow-up/__tests__/safety.test.ts` (classifier + copy).
- **Manual:** consent on `/contact` and chat; Twilio webhook form POST; cron with `CRON_SECRET`; admin PATCH settings.

## Remaining limitations

1. **DB migration:** Run `npx prisma db push` or `prisma migrate dev` where `DATABASE_URL` is set (failed in CI sandbox without DB).
2. **WhatsApp** not implemented (stub).
3. **Voice** not dialed — only queued row + script text.
4. **Twilio signature validation** on webhook not implemented (add for production).
5. **Template overrides** from `templatesJson` not yet merged in `renderFollowUpTemplate`.
6. **Calendar booking** — collects preferences in chat state only; no Cal.com/Google hook.
7. **“Abandoned inquiry”** trigger not wired (needs session/beacon integration).

## Recommended next steps

1. Production Twilio: Messaging + verified webhook URL + signature validation.
2. Implement Meta WhatsApp Cloud send + inbound webhook.
3. Voice: Twilio `<Gather>` or vendor with the stored `voice_script_intro` text.
4. Read `templatesJson` in `renderFollowUpTemplate` for admin-editable copy.
5. Add Playwright flow: contact form → consent → mock SMS log row.

## Env reference

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+1...
CRON_SECRET=
META_WHATSAPP_TOKEN=   # optional
META_WHATSAPP_PHONE_ID=
```
