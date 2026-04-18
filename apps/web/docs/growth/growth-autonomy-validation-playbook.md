# Growth autonomy — internal validation playbook

Use this during the **internal pilot** before `FEATURE_GROWTH_AUTONOMY_ROLLOUT` moves beyond `internal`.

## 1. Required flags

| Purpose | Env / flag |
| --- | --- |
| Growth Machine hub | `FEATURE_GROWTH_MACHINE_V1` |
| Autonomy layer | `FEATURE_GROWTH_AUTONOMY_V1` |
| Autonomy panel UI | `FEATURE_GROWTH_AUTONOMY_PANEL_V1` |
| Rollout stage | `FEATURE_GROWTH_AUTONOMY_ROLLOUT` = `internal` \| `partial` \| `full` \| `off` |
| Autonomy mode | `FEATURE_GROWTH_AUTONOMY_MODE` = `OFF` \| `ASSIST` \| `SAFE_AUTOPILOT` |
| Policy enforcement (recommended) | `FEATURE_GROWTH_POLICY_ENFORCEMENT_V1` |
| Kill switch (emergency off) | `FEATURE_GROWTH_AUTONOMY_KILL_SWITCH` |
| Internal pilot allowlist (production) | `GROWTH_AUTONOMY_INTERNAL_OPERATOR_USER_IDS` — comma-separated user IDs |
| Staged UI bypass (non-secret, build-time) | `NEXT_PUBLIC_GROWTH_AUTONOMY_INTERNAL_UI=1` |
| Debug query | `?growthAutonomyDebug=1` on autonomy API requests |

## 2. Rollout modes

| Mode | Meaning |
| --- | --- |
| `off` | No staged visibility; autonomy layer stays logically off for rollout purposes. |
| `internal` | Production snapshots limited to admins, allowlisted operators, debug, or internal UI bypass. |
| `partial` | **Future**: cohort-selected exposure only — confirm cohort membership if autonomy is missing. |
| `full` | Wide visibility per product policy — still advisory-first; no new execution powers from this playbook. |

## 3. Operator test scenarios (A–E)

- **A — suggest_only:** Autonomy ON, enforcement ON, catalog rows in `suggest_only` — advisory only.
- **B — blocked:** Autonomy ON, enforcement ON, targets blocked or frozen — row visible with rationale.
- **C — approval_required:** Autonomy ON, enforcement ON — explicit review before treating path as cleared.
- **D — enforcement off:** Autonomy ON, enforcement OFF or snapshot missing — reduced guardrails; still read-only UX.
- **E — kill switch:** `FEATURE_GROWTH_AUTONOMY_KILL_SWITCH` ON — autonomy suppressed; rest of dashboard unchanged.

## 4. What to validate

- Rollout status strip matches your flags and explains gating.
- Snapshot “last built” time updates when you refresh; partial-input warnings make sense.
- Checklist items can be completed without errors; notes fields persist for your session/device.
- Prefills only navigate or copy — no silent writes.
- Telemetry does not throw if POST fails (browser offline).

## 5. What must never happen

- Automatic execution of payments, bookings core, ads core sends, or risky outbound messaging from autonomy UI.
- Hiding blocked / frozen / approval-required outcomes to “clean up” the UI.
- Expanding enforcement domains or autonomy catalog entries during this pilot without an explicit change request.

## 6. Kill switch

Set `FEATURE_GROWTH_AUTONOMY_KILL_SWITCH=true` (or `1`). Operators should see the suppressed state immediately after refresh; API returns no snapshot. Roll back app config when safe.

## 7. Escalation

1. Capture rollout mode, flags, and the rollout status strip (screenshot).
2. Note whether enforcement snapshot was partial.
3. File an issue / ping platform admin with **validation notes** from the Growth Machine checklist (what worked, what confused, follow-ups).

## 8. Moving internal → partial (criteria)

Promote only when **all** apply:

- Internal pilot checklist completed by at least one operator with no open **follow-up** items for safety.
- Kill switch drill performed (on → verify suppression → off → verify recovery).
- Enforcement snapshot stable (not perpetually partial without explanation).
- Observability counters (API reads, telemetry) visible in non-production or debug without errors.
- Product sign-off on cohort definition for `partial` (allowlist / segment — implementation is environment-specific).

Nothing in this document broadens rollout by itself — flip `FEATURE_GROWTH_AUTONOMY_ROLLOUT` only with explicit approval.
