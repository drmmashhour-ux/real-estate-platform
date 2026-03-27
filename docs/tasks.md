# Task management

How we name, classify, and track work so **git**, **boards**, and **communication** stay aligned.

---

## Task types

| Type | Purpose | Typical owner |
|------|---------|----------------|
| **Feature** | New capability or material UX change | Eng + design |
| **Bug** | Incorrect behavior or regression | Eng |
| **Growth** | Acquisition, content, ads, experiments | Growth |
| **Chore** | Tooling, deps, refactors without user-visible change | Eng |
| **Ops** | Host/broker onboarding, support, partnerships | Ops/sales |

---

## Naming (branches + tickets)

Align **branch names** with **`team-workflow.md`**:

| Prefix | Use for | Example branch |
|--------|---------|----------------|
| `feature/*` | Features | `feature/host-calendar-export` |
| `fix/*` | Bugs | `fix/checkout-double-charge` |
| `growth/*` | Growth initiatives (optional branch if code) | `growth/landing-ab-test` |
| `hotfix/*` | Urgent production | `hotfix/payment-webhook-timeout` |

**Ticket / issue title:** same prefix in brackets optional, e.g. `[growth] Montreal host LP v2`.

---

## Board columns (minimal)

1. **Backlog** — Triaged, not started  
2. **This week** — Committed for the current week  
3. **In progress** — WIP limit: **2** per person where possible  
4. **In review** — PR open or design review  
5. **Done** — Merged + deployed to **staging** or **prod** per **`release-strategy.md`**

---

## Definition of Done

- **Feature:** Merged to `develop`, tested on **staging**, docs or flags updated if needed.  
- **Bug:** Repro → fix → test → merged; linked to issue.  
- **Growth:** Hypothesis stated, shipped, metric + learning recorded (**`performance.md`**).

---

## Related

- **`daily-execution.md`** — Daily rhythm  
- **`team-workflow.md`** — Git and PR rules  
- **`growth-execution.md`** / **`sales-execution.md`** — Non-code execution tracks  
