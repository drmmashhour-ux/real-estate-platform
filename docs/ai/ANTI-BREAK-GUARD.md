# Anti-break guard — emergency enforcement (V8)

Use this when a change set looks **destructive**, **too large**, or **touches protected systems** (Brain, Stripe, bookings, Prisma truth tables). These are **corrective prompts** for humans and AI tools — paste as-is to stop forward motion until scope is safe.

**Related:** `docs/engineering/V8-SAFE-RULE-SHORT.md`, `docs/ai/V8-COMMAND-LIBRARY.md`, `pnpm validate:v8`.

---

## Hard stop (paste first)

```
STOP. Do not merge, deploy, or continue implementation until:
1) pnpm validate:v8 passes OR every reported violation is explicitly reviewed and accepted in writing.
2) The diff contains no unrelated file deletes and no bulk rewrites unless AUTHORIZED DELETION was stated by the user for exact paths.
3) Brain learning/outcome ingestion, Stripe webhooks, and booking payment capture are not refactored in the same change as “cleanup.”
Propose the smallest additive alternative or split into multiple PRs.
```

---

## When `validate:v8` reports FILE_DELETED or LARGE_REMOVAL

```
The V8 validator flagged deletions or large line removals. Revert unrelated deletes, restore files from HEAD, or split the PR so only intentional removals remain. Do not “fix” by disabling the validator — fix the diff.
```

---

## When Prisma / schema churn is flagged

```
PRISMA_SCHEMA_LARGE_DIFF or destructive SQL patterns were detected. Pause: confirm migrations are additive, document rollback, and run prisma validate. Do not drop columns/tables in place without a coordinated migration plan. Prefer new nullable columns or new tables.
```

---

## When EXPORTED_SYMBOL_REMOVED or ROUTE_HANDLER_REMOVED appears

```
A removed export or route handler was heuristically detected. Verify whether this is a breaking public API change. If unintentional, restore the export or add a re-export shim. Document deprecation if removal is required.
```

---

## When Brain / payments / webhooks are in the diff

```
Protected surface detected. Confirm: no changes to Brain outcome writers, weight adaptation, or outcome ingestion unless explicitly in scope. For Stripe: no changes to idempotency, charge amounts, or webhook ordering. For bookings: no silent state transitions on paid stays. If the task only asked for logging, restrict the diff to read paths and structured logs.
```

---

## When shadow mode was bypassed

```
The task required shadow/observation first. Roll back live influence or primary routing changes; re-implement as parallel logging only behind flags, then comparison metrics, then (separate phase) optional influence with default-off flag.
```

---

## Self-healing runaway

```
Retries or healers must not hammer external APIs or mutate authoritative rows without caps and idempotency keys. Add max attempts, exponential backoff, and admin visibility. Disable auto-repair until logs prove safe dry-runs.
```

---

## Escalation checklist

- [ ] `pnpm validate:v8` result captured (PASS or waived violations listed)
- [ ] Rollback = one sentence (env vars / flags / revert commit)
- [ ] No silent behavior change for flag-off users
- [ ] Tests or manual proof for the touched path
