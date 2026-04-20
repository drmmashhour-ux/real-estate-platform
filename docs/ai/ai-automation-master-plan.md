# LECIPM — AI automation master plan

This document defines **domains** for AI-assisted operations across LECIPM (residential brokerage, CRM, investor portal) and BNHub (short-term rentals). It is **normative for product intent** but **does not enable silent execution**: governance, kill switches, approval queues, and hub-specific policies remain authoritative.

## Principles

1. **Recommendations first** — surface insights before any mutation.
2. **Explain everything** — every automated or suggested action carries `reasonCodes` / human-readable rationale tied to data.
3. **Hub isolation** — a broker automation never mutates BNHub pricing without explicit scope and policy.
4. **Measurable outcomes** — each domain lists KPIs so we can audit uplift vs noise.

---

## 1. Listing optimization

| Aspect | Detail |
|--------|--------|
| **Purpose** | Improve discovery, conversion, and compliance completeness for CRM listings and BNHub stays. |
| **Triggers** | Low completion score; stale photos; missing mandatory fields; search uptick without bookings; QA flags. |
| **Actions** | Field suggestions; photo checklist; SEO title variants; BNHub amenity prompts (**recommendation / draft only** in v1). |
| **Level of autonomy** | Stage 1–2: advisory. Stage 3+: drafts behind approval. |
| **Approval** | Publish / go-live changes require seller or host confirmation unless **explicit SAFE_AUTOPILOT** policy allows bounded edits. |
| **Measurable outcome** | Completion %; detail-page CTR; inquiry rate; booking conversion (BNHub). |

---

## 2. Host operations (BNHub)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Reduce host time on pricing, availability, messaging prep, and payout visibility. |
| **Triggers** | Occupancy bands; revenue deltas; response SLA risk; payout anomalies (see event spec). |
| **Actions** | Pricing **suggestions**; availability nudges; canned response drafts; task reminders. |
| **Level of autonomy** | v1: suggestions only for live pricing. Autonomy engine already gates execution separately (`AUTONOMY.md`). |
| **Approval** | Night-rate changes follow `pricingMode` + autonomy policy — never bypass listing lock. |
| **Measurable outcome** | RevPAR; occupancy; response time; cancellation rate. |

---

## 3. Broker productivity

| Aspect | Detail |
|--------|--------|
| **Purpose** | Prioritize leads, surface next-best-action, reduce CRM friction. |
| **Triggers** | New lead; SLA breach risk; high-score lead idle; deal stage stagnation. |
| **Actions** | Ranked lead list; suggested tasks; draft follow-up (**no automatic send** in v1). |
| **Level of autonomy** | Ranking and ordering only; outbound messaging stays human or explicitly approved template sends. |
| **Approval** | Marketing sends and mass messages always approval-gated or template-bound. |
| **Measurable outcome** | Time-to-first-response; conversion by tier; pipeline velocity. |

---

## 4. Investor insights

| Aspect | Detail |
|--------|--------|
| **Purpose** | Consolidate BNHub/investment signals into digestible opportunities — **not trading advice**. |
| **Triggers** | New recommendation row; score change; portfolio drift vs benchmark (internal). |
| **Actions** | Summaries; ranked opportunity list; scenario notes (**informational**). |
| **Level of autonomy** | Read-only narratives; no capital movement or order execution. |
| **Approval** | N/A for read-only; any outbound investor comms follows communications policy. |
| **Measurable outcome** | Engagement with summaries; saves/bookmarks; advisor follow-ups (if enabled). |

---

## 5. Admin intelligence

| Aspect | Detail |
|--------|--------|
| **Purpose** | Operators detect anomalies, hub health, and fraud signals faster. |
| **Triggers** | Metric thresholds; queue depth; spike in errors; geographic anomalies. |
| **Actions** | Daily summary; drill-down links; suggested ticket routing (**no auto-ban** without policy module). |
| **Level of autonomy** | Summaries automated; destructive actions remain manual or policy workflows. |
| **Approval** | Enforcement actions follow existing moderation / fraud playbooks. |
| **Measurable outcome** | MTTR; false-positive rate on alerts; coverage of reviewed queues. |

---

## 6. Messaging assistance

| Aspect | Detail |
|--------|--------|
| **Purpose** | Faster, consistent tone for brokers and hosts without impersonation risk. |
| **Triggers** | User opens composer; SLA warning; template gap detected. |
| **Actions** | Draft replies; bullet summaries of thread; tone variants. |
| **Level of autonomy** | Draft-only unless user clicks send; optional **approved snippets** automation later. |
| **Approval** | Always human send for external channels in v1. |
| **Measurable outcome** | Time-to-send; edit distance from draft; escalation rate. |

---

## 7. Revenue / risk alerts

| Aspect | Detail |
|--------|--------|
| **Purpose** | Early warning on revenue dips, payout issues, concentration risk. |
| **Triggers** | Revenue band breach; payout mismatch; single-listing concentration; booking anomalies. |
| **Actions** | In-app alerts; digest emails (opt-in); suggested playbook steps. |
| **Level of autonomy** | Notifications can auto-fire **low-severity** informational alerts; money movement never automatic here. |
| **Approval** | Refunds/chargebacks follow payments governance. |
| **Measurable outcome** | Alert precision; time to resolution; revenue recovery actions taken. |

---

## 8. Content generation

| Aspect | Detail |
|--------|--------|
| **Purpose** | Marketing, SEO, and listing copy assistance with brand guardrails. |
| **Triggers** | New listing; SEO gap; campaign slot; blog calendar event. |
| **Actions** | Drafts for review; meta descriptions; social snippets. |
| **Level of autonomy** | Draft-only in v1–2; publish requires editor/admin role. |
| **Approval** | Editorial / legal for sensitive jurisdictions. |
| **Measurable outcome** | Publish rate from drafts; organic traffic; compliance rejection rate. |

---

## 9. Pricing suggestions

| Aspect | Detail |
|--------|--------|
| **Purpose** | Data-informed price bands for listings and stays — distinct from **autonomy execution** (`docs/ai/AUTONOMY.md`). |
| **Triggers** | Occupancy/revenue signals; competitor proxy data **when ingested**; seasonality rules. |
| **Actions** | Suggested band; rationale chart; sensitivity note. |
| **Level of autonomy** | Suggest → host approves → optional autopilot modules apply within caps. |
| **Approval** | CRM list price changes; BNHub night rate tied to `pricingMode` + autonomy policy. |
| **Measurable outcome** | Uplift vs counterfactual (BNHub autonomy stack where enabled). |

---

## 10. Portfolio insights (multi-asset)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Investors and power hosts see cross-listing performance and risk. |
| **Triggers** | Scheduled digest; material KPI change; new asset linked. |
| **Actions** | Portfolio summary; diversification hints; capex reminders (**no auto-rebalance**). |
| **Level of autonomy** | Reporting; scenario “what-if” sliders (client-side + server validation). |
| **Approval** | Capital deployment always human. |
| **Measurable outcome** | Dashboard engagement; actions taken from recommendations. |

---

## Cross-links

- Agent inventory: [ai-agents-and-autopilot-matrix.md](./ai-agents-and-autopilot-matrix.md)
- Staged rollout: [self-optimizing-platform-roadmap.md](./self-optimizing-platform-roadmap.md)
- Triggers & notifications: [event-trigger-automation-spec.md](./event-trigger-automation-spec.md)
- UI: [ai-actions-ui-spec.md](./ai-actions-ui-spec.md)
- Governance: [POLICIES.md](./POLICIES.md), [GUARDRAILS.md](./GUARDRAILS.md), [OVERRIDES.md](./OVERRIDES.md)
