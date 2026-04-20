# Growth policy review history

Operators need **memory**: whether a policy finding keeps coming back, whether someone triaged it, and whether it was marked resolved while the rule is quiet.

This layer adds **fingerprints**, **evaluation history**, and **explicit reviews**. It does **not** execute growth actions, mutate leads/brokers, or auto-clear live policy output.

## How history entries are created

On each **`GET /api/growth/policy`** (when `FEATURE_GROWTH_POLICY_HISTORY_V1` is on), after policies are evaluated the server runs **`recordPolicyEvaluationHistory(policies)`**:

- For each current finding, a **fingerprint** is computed with `buildGrowthPolicyFingerprint` (stable hash from domain, canonical `policy.id`, normalized title + description snippet).
- The in-memory doc (optional JSON backing under `.data/growth-policy-history.json` or `GROWTH_POLICY_HISTORY_JSON_PATH`) upserts one row per fingerprint:
  - **`seenCount`** increments **each time that fingerprint appears in an evaluation**.
  - **`lastSeenAt`** updates when present; dormant rows keep prior timestamps.
- Rows **not** present in the latest evaluation stay in the doc but move to **`inactive`** or **`resolved_reviewed`** depending on the latest human review (see recurrence rules).

Live **`policies`** returned to the client are **never** filtered by history.

## Recurrence rules

Derived by **`deriveGrowthPolicyHistoryStatus`**:

| Situation | Status |
|-----------|--------|
| Finding **present now**, first time (`seenCount` 1, no dormant return) | **`active`** |
| Finding **present now** and `seenCount >= 2` | **`recurring`** |
| Finding **present now** after the row was **`inactive`** or **`resolved_reviewed`** | **`recurring`** |
| Finding **absent now** and latest review is **`resolved`** | **`resolved_reviewed`** (absence ≠ proof of fix; only means the rule is not firing) |
| Finding **absent now** and latest review is not **`resolved`** (or no review) | **`inactive`** |

## Review decisions

All values are **typed** and **human-selected** (`POST /api/growth/policy/review`):

| Decision | Meaning (operator intent) |
|----------|-------------------------|
| **`acknowledged`** | Seen; no action logged yet beyond triage. |
| **`monitoring`** | Watching; expect to revisit. |
| **`resolved`** | Operator considers the underlying issue addressed; **does not remove** live findings — if the rule still fires, evaluation output stays warning/critical until signals change. |
| **`recurring`** | Explicitly tagging a repeat pattern. |
| **`false_alarm`** | Interprets the finding as noise for this workspace. |

Latest review drives **history row metadata** (`lastNote`, `lastReviewedAt`, **`currentStatus`** when combined with absence/presence rules). It never auto-updates Stripe, pricing, CRM, or marketing state.

## What the system does **not** do

- **No autonomous execution** and no auto-approvals.
- **No auto-resolution**: a `resolved` review does not hide or delete current policy results.
- **No mutations** to leads, brokers, bookings, checkout, or content.
- **No hidden grouping**: fingerprints are deterministic from policy content; operators can inspect the JSON store in admin contexts.

## Weekly operator review

1. Open **Growth machine** → **Growth policy** for current warnings.
2. Scroll to **Policy history** (with history + review flags) for **recurring** rows and counts.
3. Use **Open** on a row, add a **review** (decision + note). This records intent for the next week; cross-check whether the finding is **absent** on a later evaluation before treating it as calm.
4. Prefer **`resolved`** only after you believe upstream metrics or process truly changed — the engine will still fire the rule if signals warrant it.

Log prefix for this subsystem: **`[growth:policy-history]`**.

## Attribution

Reviews are **manual labels** — they **do not auto-resolve** live findings, **do not auto-link** to actions without operator intent in the UI, and **do not prove** root cause. Absence of a finding after a `resolved` review means the rule is **not firing in that evaluation**, not guaranteed remediation. See **`growth-policy-attribution.md`**.
