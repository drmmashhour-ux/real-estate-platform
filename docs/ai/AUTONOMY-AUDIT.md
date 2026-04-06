# LECIPM Manager — Autonomy audit

**Product:** LECIPM Manager — AI-managed real estate & stays marketplace  
**Date:** 2026-04-02  
**Purpose:** Map what exists, what is safe to automate, and where humans must stay in the loop.

---

## 1. Auth and roles

- **Source of truth:** `User.role` (`PlatformRole` in `apps/web/prisma/schema.prisma`).
- **Relevant roles for autonomy:**
  - `USER` / `CLIENT` — guests, general signed-in users.
  - `HOST` — BNHub listing owners; subject to host agreement + Stripe Connect for payouts.
  - `ADMIN` — platform operations; automation admin APIs and trust/dispute queues.
  - Other roles (broker, seller, etc.) use separate CRM/listing flows; Manager AI routing treats `ADMIN` and `HOST` distinctly in `lib/ai/routing/agent-router.ts`.
- **Session:** `getGuestId()` / `requireAuthenticatedUser()` in dashboard; API routes combine session + `isPlatformAdmin()` where required.

---

## 2. Prisma — core entities (Manager AI layer)

Existing models (reuse; do not duplicate):

| Model | Role |
|--------|------|
| `ManagerAiConversation` / `ManagerAiMessage` | Persisted chat threads |
| `ManagerAiAgentRun` | Agent invocations, summaries, payloads/results |
| `ManagerAiActionLog` | Executed or suggested actions (audit) |
| `ManagerAiRecommendation` | Active/dismissed recommendations for users |
| `ManagerAiApprovalRequest` | Human approval queue for risky actions |
| `ManagerAiAutomationRule` | Rule registry: enabled, frequency, last/next run |
| `ManagerAiNotificationLog` | AI-related notification audit |
| `ManagerAiPlatformSettings` | Singleton `default`: global mode, automations on/off, per-agent JSON |
| `ManagerAiHostAutopilotSettings` | Per-host toggles + `autopilotMode` |

**Core marketplace entities** used by tools and rules:

- `ShortTermListing`, `Booking`, `User` (Stripe Connect fields), `Dispute`, `Review`, `Notification`, payments/payout tables via existing `lib/payments` and Stripe webhooks.

---

## 3. Listings and edit flows

- **Server:** `apps/web/lib/bnhub/listings.ts` — `createListing`, `updateListing`, `setListingPhotos`, availability, fraud recheck hooks.
- **Host autopilot:** `enqueueHostAutopilot` from `lib/ai/autopilot/triggers.ts` is used on **mobile** host listing PATCH and on **booking** events; **web** `updateListing` should enqueue the same trigger for parity (implemented in this pass).

---

## 4. Short-term booking lifecycle

- **Enum:** `BookingStatus` — `PENDING`, `AWAITING_HOST_APPROVAL`, `CONFIRMED`, cancellations, `COMPLETED`, `DISPUTED`.
- **Automation:** `stalled_booking` rule flags stale `PENDING` / `AWAITING_HOST_APPROVAL` (see `lib/ai/actions/automation-engine.ts`).
- **Realtime (optional):** `lib/realtime/lecipm-booking-events.ts` publishes to Redis for Socket.IO bridge — not required for autonomy core.

---

## 5. Payments and payouts

- **Stripe:** Webhooks and `lib/payments/payout.ts` — scheduling payouts, orchestrated ledger.
- **Autonomy boundary:** No direct edits to payment/payout records; no auto-refund unless explicit future policy + approval flow. Tools expose **read** status where implemented (`toolGetPaymentStatus`, `toolGetPayoutStatus`).

---

## 6. Notifications and email

- **In-app:** `prisma.notification` (e.g. host autopilot nudges via `lib/ai/autopilot/notify-host.ts`).
- **Email:** `lib/email/resend.ts`, `lib/email/send.ts`, booking confirmations, etc.
- **Policy:** Autonomous **external** email only through approved template families and existing send paths; otherwise in-app + logs.

---

## 7. Admin dashboards

- **AI UI:** `apps/web/app/(dashboard)/ai/*` — routes resolve to `/ai` (overview, recommendations, approvals, logs, automations, settings).
- **Platform admin:** Various `/admin/*` routes; AI automations POST requires admin (`/api/ai/automations/run`).

---

## 8. AI / chat code present

- **Orchestrator:** `lib/ai/orchestrator.ts` — OpenAI, tools, structured output, compliance disclaimer.
- **Agents (prompts + routing):** `lib/ai/agents/*`, `lib/ai/prompts/registry.ts`.
- **Policies:** `lib/ai/policies/action-policy.ts`, `risk-policy.ts`, `compliance-policy.ts`.
- **Safe execution:** `lib/ai/actions/safe-execute.ts`, approval routes under `/api/ai/actions/*`.
- **Host autopilot engine:** `lib/ai/autopilot/host-autopilot-engine.ts` + `host-config.ts`.
- **Automation:** `lib/ai/actions/automation-rules.ts`, `automation-engine.ts`, `automation-runner.ts`.

---

## 9. Cron / scheduled jobs

- **Pattern:** `POST /api/cron/*` with `Authorization: Bearer $CRON_SECRET`.
- **Example:** `app/api/cron/growth-scheduled-publish/route.ts`.
- **Autonomy:** New `POST /api/cron/autonomy-tick` runs bounded automation cycle when cron is configured (optional in dev).

---

## 10. Mobile app

- **Path:** `apps/mobile` — `AIAssistantScreen`, `sendMessage` → `POST /api/ai/chat` with `lecipmManager: true`.
- **Extension:** AI control / autonomy status screen calling new `/api/ai/autonomy/status` (read-only for hosts).

---

## 11. Reusable components (do not reimplement)

- `getManagerAiPlatformSettings` / `updateManagerAiPlatformSettings` — `lib/manager-ai/platform-settings.ts`
- `logManagerAgentRun`, `logManagerAction` — `lib/ai/logger.ts`
- `executeSafeManagerAction` — `lib/ai/actions/safe-execute.ts`
- `runAllAutomations` / `runAutomationRule` — automation layer
- `runHostAutopilotTrigger` — host-scoped autopilot
- BNHub listing/booking Prisma access via existing libs

---

## 12. Safe autonomous surfaces

- Draft / recommend listing copy; store as `ManagerAiRecommendation`.
- Apply **non-financial** listing fields when policy + host autopilot mode allow (existing host engine paths).
- Internal tasks, support summaries, promotion **suggestions** (not live price changes without approval).
- Automation rules that only **create recommendations** or **in-app notifications** from real DB state.
- Chat assistance grounded in tools (bookings, listings, payout **status** read-only).

---

## 13. Blocked / high-risk domains

- Fabricated metrics, legal determinations, fake users/bookings/reviews.
- Direct mutation of payment records, arbitrary refunds, payout config changes without approval.
- Auto-resolving trust/safety disputes without admin path.
- Unapproved **novel** outbound messages to guests/customers.

---

## 14. Recommended autonomy boundaries

| Layer | Behavior |
|--------|-----------|
| Global kill switch | Stops automation runner; chat may still respond per product choice (configurable via `OFF`). |
| Per-domain pause | JSON map on platform settings (e.g. `trust_safety`, `booking_ops`). |
| Host autopilot | Scoped to host’s listings/bookings; respects `ManagerAiHostAutopilotSettings`. |
| Approvals | `ManagerAiApprovalRequest` for keys classified `requires_approval` in `action-policy.ts`. |

---

## 15. New artifacts in this implementation

- `lib/ai/autonomy/*` — engine, config, state, runner, router, scheduler, rules + rule-runner.
- `lib/ai/policies/domain-policy.ts` — domain ↔ risk mapping.
- `lib/ai/planning/*`, `execution/*`, `observability/*`, `recovery/*`, `evals/*` — modular wrappers around existing logs and safe-execute.
- `lib/ai/actions/communications-engine.ts` — template-gated comms + notification log.
- `lib/realtime/lecipm-ai-events.ts` — optional Redis fan-out for AI events.
- Prisma: `globalKillSwitch`, `domainKillSwitchesJson`, `autonomyPausedUntil` on platform settings; `ManagerAiOverrideEvent`, `ManagerAiHealthEvent`, `ManagerAiOutcomeEval`.
- Docs under `docs/ai/*.md`.

This audit is descriptive only — **no performance or traction numbers** are asserted.
