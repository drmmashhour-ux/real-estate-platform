# Self-optimizing platform roadmap

Roadmap for introducing **safe** automation and feedback loops without destabilizing production. Each stage assumes existing governance (`POLICIES.md`, `GUARDRAILS.md`, BNHub autonomy modes in `AUTONOMY.md`) stays **strictly higher priority** than any new automation router.

---

## Stage 1 — Recommendations only (current baseline + v1 modules)

**Goals**

- Unified recommendation types across hubs (explainable, logged).
- No autonomous mutation of prices, listings, leads, or messages.

**Deliverables**

- `ai-assist` recommendation surfaces; admin Automation Center read-only summaries.
- Deterministic/heuristic ranking where ML is not yet wired — **never invent metrics** (see `ANTI-BREAK-GUARD.md`).

**Exit criteria**

- Operators can trace every surfaced suggestion to inputs (DB signals).

---

## Stage 2 — Low-risk autopilot with approval

**Goals**

- Drafts for content, listing improvements, notifications.
- Human approval queue before publish or send.

**Deliverables**

- Approval Queue UI wired to governance notifications.
- Template-bound sends for recurring operational comms (explicit allow-list).

**Exit criteria**

- 100% of outbound drafts either human-sent or template-approved automation.

---

## Stage 3 — Semi-autonomous safe actions

**Goals**

- Auto-tagging (taxonomy only).
- Auto-prioritization (ordering only).
- Safe internal task generation (CRM tasks, not customer-facing).

**Deliverables**

- Policy matrix by hub (`automation-policies.service.ts`).
- Event triggers with audit logs (`automation-events.service.ts`).

**Exit criteria**

- Kill switch tested per hub; rollback path documented per action class.

---

## Stage 4 — Bounded self-optimization

**Goals**

- Scenario testing in sandbox or shadow mode.
- Threshold proposals (e.g. suggest SLA targets — human accepts).
- Budget/pricing suggestions with caps; controlled rollout (percentage traffic).

**Deliverables**

- Alignment with BNHub autonomy experiments (`AutonomyExperiment` holdouts) and counterfactual uplift learning where enabled.
- Portfolio-level reporting for investors (still no capital automation).

**Exit criteria**

- Experiment ethics review for any customer-visible behavioral change.

---

## Not on this roadmap (explicit)

- Unrestricted LLM-to-production write access.
- Cross-tenant learning without consent and audit.

---

## References

- [ai-automation-master-plan.md](./ai-automation-master-plan.md)
- [event-trigger-automation-spec.md](./event-trigger-automation-spec.md)
- [AUTONOMY.md](./AUTONOMY.md)
