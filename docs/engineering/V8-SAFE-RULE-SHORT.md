# V8 Safe Mode — short reference (versioned fallback)

Use this file if `.cursor/rules/` is missing locally or you need a **paste-in prompt** for another tool.

## One-paragraph rule

LECIPM changes must be **additive only**: no deletions, no in-place rewrites of production-critical paths, no breaking schema changes. Use **wrappers**, **feature flags**, **shadow/parallel** paths, and **patch/guard layers**. Deletion is allowed **only** when the request contains exactly: `AUTHORIZED DELETION: [exact target]`. Protect Brain, attribution, bookings, Stripe, and historical metrics.

## Copy-paste prompt (Cursor / reviews)

```
Follow LECIPM V8 Safe Mode: additive-only changes; do not delete or replace production logic; do not drop/rename DB columns; gate risky behavior with FEATURE_* flags; prefer wrapper/shadow/adapter; protect brain-*, payments, attribution. If removal is required, stop unless the user wrote AUTHORIZED DELETION: [exact target].
```

## Anti-break guard (before merge)

- [ ] No files removed; no dropped Prisma columns/tables.
- [ ] Default-off or safe-default for new behavior.
- [ ] No mutation of historical financial or attribution rows.
- [ ] Rollback = disable env flag / revert commit (no data repair scripts unless specified).

Canonical rule: `.cursor/rules/v8-safe-mode.mdc` — prefer that file when present.
