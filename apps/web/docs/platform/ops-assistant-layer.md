# Ops assistant layer (platform improvement)

## What it is

A **suggest-only** layer on the Platform Improvement page. For each priority it offers **1–3** low-risk, deterministic **suggested actions** (copy prefills, safe admin navigation, or “review controls” links).

`targetSurface` tags where the improvement applies (homepage, get_leads, listings, property, bnhub, broker, growth, revenue) — **routing hints only**, not automatic publishing.

Operators **always confirm** in a modal before anything happens client-side:

- **navigate** → SPA navigation to an admin route with `?from=ops-assistant&priorityId=…`
- **edit_copy** → Clipboard write **only after** Confirm (never automatic)
- **adjust_setting** → Checklist / config text to copy, or open a review `href` when present; **does not toggle** env or database

Nothing in this layer calls product execution APIs for Stripe, bookings, rankings, pricing engines, or lead monetization.

## What it does **not** do

- No autopilot or background jobs
- No automatic DB writes or env changes
- No payments, payouts, bookings, ranking, or checkout mutations
- No scraping or hallucinated metrics — prefills use **templates + priority context** only

## Safety rules

- `riskLevel` is **`low` only** in generators
- Suggestions with forbidden path hints (e.g. `stripe`, `checkout`, `/booking`, `payment`, `ranking`, pricing engines) are **dropped**
- Every suggestion has `requiresConfirmation: true`

## Monitoring

Logs use prefix **`[ops-assistant]`**. Counters live in-memory on the server process; POST `/api/platform/ops-assistant/event` records click / confirm / cancel / complete when the modal is used (admin + same feature gate as platform improvement).

## Operator usage

1. Expand a priority → **Suggested actions**.
2. Click **Try this** → read modal — **Nothing changes until you confirm.** Prefill text is editable where shown.
3. **Confirm** to navigate (admin route + `from=ops-assistant&priorityId=…`) or copy to clipboard; **Cancel** to stop. No backend writes from this layer.
4. Perform real edits in the target admin surface — the assistant does not replace your CMS or feature-flag workflow.

UI note shown in-panel: **This is a suggested improvement. You stay in control.**

## Feature gate

Uses the same flag as Platform Improvement: **`FEATURE_PLATFORM_IMPROVEMENT_REVIEW_V1`**.
