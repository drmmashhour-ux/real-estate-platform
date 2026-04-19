# Future review candidate registry

Structured **backlog** for possible adjacent **low-risk** approval-execution-style actions. Used by internal operators after governance review — **consideration only**.

## What the registry is

- A durable list of **candidates** (`FutureReviewCandidate`) with evidence, posture, and lifecycle status.
- Populate manually (POST `/api/platform/ops-assistant/future-review-candidates`) or automatically when governance marks **`reviewed_future_review`** on an action row — row becomes **`eligible_for_review`** in the registry.
- Operators may **Hold**, **Reject**, or **Archive** rows — explicit status changes only.

## What it is not

- **Not** execution enablement — nothing here adds keys to `APPROVAL_EXECUTABLE_ACTION_KINDS` or routes requests through handlers.
- **Not** rollout or autonomy expansion — no flags flip from this module.
- **Not** an approval queue — execution still flows through the existing approval execution service + allowlist.

See **`FUTURE_REVIEW_REGISTRY_CANNOT_ACTIVATE_RULE`** in `future-review-candidate.types.ts`: candidates are stored **out-of-band** from execution routing.

## How candidates get added

1. **Governance sync** — Human chooses **Eligible for future review** on a governance review row → `upsertFutureReviewCandidateFromGovernanceReview` creates or updates `frc_<actionType>` with evidence from the review record; status **`eligible_for_review`**.
2. **Manual intake** — Authenticated admin POST with `actionType`, descriptions, and evidence → status **`proposed`** by default.

## Why registry ≠ activation

Execution is gated by:

- Strict allowlist in code (`approval-execution.types.ts`).
- Runtime checks in `approval-execution.service.ts` / handlers.

The registry **never imports** those execution paths for enablement; widening scope requires an **explicit code + policy change**.

## Statuses

| Status | Meaning |
| --- | --- |
| **proposed** | Recorded manually or imported — not yet promoted to eligible backlog. |
| **eligible_for_review** | Ready for structured discussion (often from governance **future_review**). Still inactive. |
| **held** | Paused — needs more evidence or time; **no** execution implied. |
| **rejected** | Declined as a backlog item; **no** deletion of audit trails. |
| **archived** | Closed out of the active backlog view; retained for audit. |

## Who should use it

Platform / internal ops engineers and admins who already access **Platform improvement** with ops-assistant approval flags — same visibility as governance review APIs.

## Persistence

Optional **`FUTURE_REVIEW_CANDIDATES_JSON_PATH`** (see `.env.example`). Default file: `data/future-review-candidates.json`.

## Monitoring

Logs use prefix **`[ops-assistant:future-review]`** (`future-review-candidate-monitoring.service.ts`). Never throws.

## Related

- `approval-execution-manual-review.md` — governance decisions.
- `approval-execution-results.md` — measured outcomes.
