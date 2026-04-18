# LECIPM V8 Master System — Safe autonomous engineering

This document is the **human-readable** companion to the Cursor rule `.cursor/rules/v8-safe-mode.mdc`. It does not change runtime behavior; it defines how we extend a **live, learning, revenue-critical** platform without destructive change.

**Runtime vs governance:** Turning features on or off is done with environment-backed flags (for example `FEATURE_PLATFORM_CORE_*`, `FEATURE_ONE_BRAIN_*`) and code guards. This document does **not** enable or disable any feature by itself.

## Principles

- **Non-destructive by default** — extend, don’t replace.
- **Attribution and financial truth** — never mutate historical records to “fix” appearance.
- **Reversibility** — risky behavior behind flags; shadow before action.

## Non-goals

- Mass refactors that delete working paths.
- Silent changes to Stripe, bookings, or brain ingestion.
- Breaking schema or API contracts without migration strategy and authorization.

## Allowed mechanisms

| Mechanism | Use when |
|-----------|----------|
| Wrapper | You need to enrich or validate outputs of existing code. |
| Adapter | Boundaries between domains (e.g. new scorer consuming existing metrics only). |
| Feature flag | Any behavior that could affect production outcomes. |
| Shadow mode | New decision logic must be compared to current behavior before enablement. |
| Patch layer | Bugs — add guards/fallbacks **around** unstable calls, not rewrite core blindly. |

## Authorized deletion (only exception)

Deletion or removal is allowed **only** if the request contains exactly:

`AUTHORIZED DELETION: [exact target]`

## Rollout strategy (high level)

1. **Observe** — metrics, logs, baseline behavior.  
2. **Shadow** — new logic alongside legacy; compare; no forced cutover.  
3. **Recommend** — surfaced as suggestions with confidence/risk.  
4. **Gated execution** — narrow scope + feature flags.  
5. **Expand** — only after validation.

For Platform Core **Phase A** operational checks (flags, priority, what should not happen), see `docs/platform-core/phase-a-checklist.md`.

## Related docs

- Platform safety: `docs/git-safety.md`, `docs/security/README.md` (as applicable).
- Architecture overviews: `docs/architecture/`.
- Short copy-paste prompt: `docs/engineering/V8-SAFE-RULE-SHORT.md`.
