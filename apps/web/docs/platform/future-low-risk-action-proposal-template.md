# Future low-risk action proposal template

A **standard form** for adjacent, **internal-only** action ideas before they are even considered for the [future review candidate registry](future-review-candidate-registry.md). This is a **governance and documentation** layer only.

## What a proposal is

- A `FutureLowRiskActionProposal` with a **fixed set of fields** and a **mandatory review checklist** (11 items).
- A **draft** that must be **explicitly submitted** after checklist + narrative completeness checks pass.
- Optionally moved through **submitted** → **under_review**, then **accepted_to_registry**, which creates or updates an **inactive** registry row tied via `sourceProposalId`.

## What it is not

- **Not** activation — proposals never call approval execution handlers or widen `APPROVAL_EXECUTABLE_ACTION_KINDS`.
- **Not** rollout — no feature flags flip from proposal APIs.
- **Not** a bypass of governance — measured outcomes and manual reviews remain separate processes.

Operator copy in product: **`PROPOSALS_CANNOT_ACTIVATE_RULE`** and **`PROPOSAL_ACCEPTANCE_NOT_ENABLED_MESSAGE`** in `future-low-risk-proposal.types.ts`.

## Required checklist (submission gate)

Submission is **blocked** unless **every** item is confirmed:

| Key | Meaning |
| --- | --- |
| internalOnlyConfirmed | Intended for internal operators only |
| reversibleConfirmed | Effects can be undone or rolled back |
| noPaymentImpact | No Stripe / billing / payout behaviour |
| noBookingCoreImpact | Does not alter booking lifecycle core |
| noAdsCoreImpact | Does not alter ads serving core |
| noCroCoreImpact | Does not alter conversion experiments core |
| noExternalSendImpact | No outbound email/SMS/push from this idea |
| noLivePricingImpact | No live rent/rank/pricing mutations |
| adjacentToCurrentLowRiskScope | Fits next to existing approval-execution posture |
| clearRollbackExists | Documented rollback path |
| clearAuditabilityExists | Observable in audit trails |

Labels are exposed as `CHECKLIST_LABELS` in `future-low-risk-proposal.service.ts`.

## Acceptance rules

1. **Draft** — editable; cannot submit until **all checklist items are true** and **all template fields** (including risk headline) are non-empty.
2. **Submit** — moves to **submitted**; does nothing to runtime systems.
3. **Begin review** — optional transition to **under_review**.
4. **Accept to registry** — only from **submitted** or **under_review** → **accepted_to_registry**; calls `upsertFutureReviewCandidateFromAcceptedProposal` with **`sourceProposalId`** set; registry row stays **inactive** (`proposed` status until operators promote triage separately — still not execution).

## Proposal vs registry vs activation

| Stage | Purpose |
| --- | --- |
| **Proposal** | Structured intake + checklist filtering |
| **Registry** | Durable backlog row for prioritisation discussion |
| **Activation** | Only via **explicit engineering** changes to code allowlists and ops policy |

## Examples

**Acceptable**

- “Add internal-only reminder variant that mirrors existing `createOperatorReminder` patterns, undo by deleting reminder id.”
- “Draft prefill helper for a new config key that writes only to existing internal draft store.”

**Unacceptable (should fail checklist or narrative)**

- Anything that touches **payments**, **booking core**, **ads**, **CRO**, **external send**, or **live pricing** without a redesign (checklist requires **no** on those domains).
- “Shadow execute for buyers” — fails internal-only / adjacent scope.

## Persistence & monitoring

- Optional **`FUTURE_LOW_RISK_PROPOSALS_JSON_PATH`** — default `data/future-low-risk-proposals.json`.
- Logs: **`[ops-assistant:proposal]`** (`future-low-risk-proposal-monitoring.service.ts`).

## Related docs

- `approval-execution-manual-review.md`
- `future-review-candidate-registry.md`
