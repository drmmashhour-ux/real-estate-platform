# AI Autopilot — Messaging Assist (Leads domain, V8 safe)

## Purpose

Give operators **draft-only** suggested replies for CRM `Lead` rows so they can copy text into their own email/SMS/tools. **Humans send messages manually.** This phase does not automate outbound communication.

## What it does

- When `FEATURE_AI_AUTOPILOT_MESSAGING_ASSIST_V1` is on, the **Early users / CRM** admin view (`LeadIntelligenceSection`) can show a **Suggested reply** column with:
  - Short preview, **tone** badge (friendly / professional / short), and **rationale** (explainability).
  - **Copy** (clipboard only), **Expand / collapse**, **Regenerate** (refreshes server-rendered data — deterministic templates).
- **Hot leads** and rows with **high** AI priority or **`needs_followup`** tag get stronger visual emphasis (“Draft ready” / “Needs follow-up”). This does **not** mean a message was sent.
- After **controlled leads autopilot execution** (`executeLeadsAutopilotLayer`), drafts are generated in-process and **optionally merged** into `Lead.aiExplanation.aiMessagingAssist` (additive JSON merge — does not replace the lead’s original `message` field).
- **Monitoring**: in-process counters and `[autopilot:messaging]` logs (generation, bulk runs, copy/view telemetry from admin UI). No “sent” events because nothing is sent by this feature.

## What it does NOT do

- Does **not** send email, SMS, WhatsApp, or any external message.
- Does **not** modify Stripe, bookings, ads, CRO, or ranking.
- Does **not** overwrite the lead’s submitted **message** body.
- Does **not** imply that a draft was delivered to the contact.

## Template logic (deterministic)

`buildLeadReplyDraft` uses fixed templates (no LLM in this phase). Inputs include name, optional listing code/id, message length, `aiScore` / `aiPriority` / `aiTags`, and contact fields.

- **`FEATURE_AI_AUTOPILOT_MESSAGING_TEMPLATES_V1` off**: tone is always **professional** (stable, conservative).
- **Templates on**: tone is chosen from rules (e.g. `low_info` → short, high intent / high priority → friendly).

Copy avoids guaranteed outcomes, legal/financial advice, and fake urgency.

## Admin workflow

1. Enable `FEATURE_AI_AUTOPILOT_MESSAGING_ASSIST_V1` (and optionally templates).
2. Open **Admin → Early users** (`/admin/.../early-users` — locale/country prefix as routed).
3. Review **Suggested reply** cells; expand, copy, and send via your normal channels outside this feature.

## Safety guarantees

- Draft-only; reviewable; reversible (operators ignore or edit drafts; persisted assist JSON can be cleared by updating `aiExplanation` if needed).
- No outbound messaging code paths in the messaging-assist service module.
- Failures in generation or persistence do not break the lead list page (best-effort).

## Validation commands

From the web app package (e.g. `apps/web`):

```bash
pnpm exec vitest run modules/growth/__tests__/ai-autopilot-messaging-assist.test.ts
```

Optional broader regression (if you touch execution):

```bash
pnpm exec vitest run modules/growth/__tests__/ai-autopilot-controlled-execution.test.ts
```

Typecheck (if your workspace exposes it):

```bash
pnpm exec tsc --noEmit -p tsconfig.json
```

---

**Reminder:** Drafts are suggestions only. **Humans** send messages manually; there is **no** external automation for sending in this phase.
