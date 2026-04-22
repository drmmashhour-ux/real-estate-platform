# AI sales scripts — lead → conversion

Automated nurture copy for LECIPM. Use with **CASL**, **Law 25**, and carrier rules for SMS/email; honor **opt-in** before promotional SMS.

**Objective:** Move leads toward **booking a demo**, **signing up**, and **becoming active users**.

**Positioning:** *LECIPM not only brings leads — it converts them into deals.*

---

## Script 1 — First contact (after lead)

**Intent:** Friendly opener + AI analysis hook.

**Core message**

> Hi, I saw you were interested in this property.
> We’ve prepared an AI-powered analysis to help you understand its real value.
>
> Would you like me to show you the insights?

---

## Script 2 — Engagement

**Intent:** Elevate curiosity; introduce deal intelligence.

**Core message**

> This property has strong potential, but there are a few important factors most buyers miss.
>
> I can show you the deal score and risk level.

---

## Script 3 — Value push

**Intent:** Differentiate LECIPM vs “browse-only” portals.

**Core message**

> With LECIPM, you don’t just see listings —
> you understand whether it’s a good deal or not.

---

## Script 4 — Urgency

**Intent:** Appropriate scarcity (no deception); prompt next step.

**Core message**

> Good opportunities move fast.
> Do you want me to walk you through this one before it’s gone?

---

## Script 5 — Close

**Intent:** Demo CTA — low friction.

**Core message**

> Let’s do a quick demo — it takes 5 minutes and you’ll see how to identify better deals instantly.

---

## Channel variants

### SMS (short; single CTA)

| Script | Example SMS body |
|--------|------------------|
| 1 | Hi — you showed interest in a property. We have an AI analysis of its value. Want the key insights? Reply YES. |
| 2 | Quick heads-up: buyers often miss risk factors here. I can share deal score + risk. Interested? |
| 3 | LECIPM helps you judge if it’s a good deal, not just browse listings. Want a 2‑min overview? |
| 4 | Good listings move fast. Want a quick walkthrough before it’s gone? Reply YES. |
| 5 | Free 5‑min demo — see how to spot better deals. Book: [link] |

### Email (subject + body)

Use **subject lines** that match script intent (e.g. Script 1: “Your AI analysis is ready”). Body can expand with bullet benefits and one primary **Book demo** / **View insights** button.

### In-app chat

Use the **full script** messages above verbatim (or lightly personalized with `{firstName}`, listing address). Add **quick replies:** “Show insights”, “Book 5‑min demo”, “Not now”.

---

## Automation pairing

- **Triggers → scripts** are implemented in `apps/web/modules/sales/` (`sales-engine.ts`, `lead-conversation.flow.ts`, `message-generator.ts`).
- **Logs:** `[sales]`, `[conversion]` (and broker flow: `[onboarding]`) — see server logs and `launch_events` for onboarding completion metrics.

---

## Activation metrics (`launch_events`)

| Event | Meaning |
|--------|---------|
| `broker_lecipm_onboarding_step_complete` | Step finished (payload includes `stepIndex`, optional flags). |
| `broker_lecipm_onboarding_completed` | Full wizard finished. |
| `broker_lecipm_onboarding_skip` | User exited early (`fromStepIndex`). |
| `broker_activation_first_listing_cta` | User chose “Generate your first AI listing”. |
| `broker_activation_first_lead_cta` | User chose “View your leads”. |

**Suggested KPIs:** completion rate = completed ÷ started (infer started from first `step_complete` or dedicated visit log); **first listing** / **first lead** from CTA events (confirm with listing-create and CRM hooks when wired).
