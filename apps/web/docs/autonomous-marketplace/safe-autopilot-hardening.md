# Safe autopilot hardening (Phase 9 hooks)

Enabled with `FEATURE_AUTOPILOT_HARDENING_V1`.

## Behaviour

- After `EXECUTED`, `verifyActionOutcome` runs deterministically.
- If verification fails and the action is marked reversible, `rollbackControlledAction` records audit intent (full reversibility depends on executor support).

## Limits

- Listing/lead executors currently simulate (`DRY_RUN`); verification treats dry-run as verified with no live mutations.
