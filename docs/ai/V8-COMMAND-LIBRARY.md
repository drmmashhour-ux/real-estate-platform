# V8 command library (safe prompts)

Reusable **copy-paste prompts** for AI-assisted work in this monorepo. They align with **V8 Safe Mode**: **additive** changes, **default-off** flags where applicable, **shadow / observation** before influence, **no** replacement of authoritative logic, **no** silent behavior changes, and **read-only** validation where possible.

**Related:** `docs/engineering/V8-SAFE-RULE-SHORT.md`, `docs/ai/ANTI-BREAK-GUARD.md` (corrective prompts when diffs look destructive), `.cursor/rules/v8-safe-mode.mdc` (if present).

---

## Global preamble (paste before any domain task)

```
Work in STRICT V8 SAFE MODE for this repo:
- Additive changes only; do not delete production code or drop Prisma columns/tables.
- Do not refactor unrelated modules; do not replace authoritative Brain, payments, or webhook logic.
- Gate risky behavior with FEATURE_* / env flags; default off in production templates unless already standard.
- Prefer parallel shadow paths, logging, and comparison layers before any live influence or cutover.
- Read-only validation where possible; document rollback (which env vars unset / flags off).
- Run non-destructive checks from repo root before merge: pnpm validate:v8
```

---

## Brain (platform-core / Brain V2 / V8)

**Shadow observation (monitoring only)**  
> Implement or extend **Brain V8 shadow observation** in strict safe mode: read-only evaluation against stored outcomes; **do not** modify learning loops, outcome ingestion, stored weights, or trust computation used for live decisions. Gate with existing `FEATURE_BRAIN_V8_SHADOW_OBSERVATION_V1` / `FEATURE_BRAIN_V8_SHADOW_PERSISTENCE_V1`. Add tests for flag-off = no shadow path. No deletion of existing Brain code.

**Shadow vs current comparison (Phase B — analysis only)**  
> Extend **Brain V8 Phase B** comparison: compare shadow outputs to current Brain snapshot signals using read-only normalization and `[brain:v8:comparison]` logs. **Do not** mutate DTOs, outcomes, or weights. Do not duplicate the shadow evaluator — call existing `buildBrainV8ShadowVsCurrentComparison` / observer wiring. See `docs/brain/brain-v8-phase-b-comparison.md`.

**Phase C–style influence (only when explicitly in scope)**  
> Add **bounded, reversible** presentation influence behind `FEATURE_BRAIN_V8_INFLUENCE_V1` (default off). **Do not** replace `buildBrainSnapshot` authority; apply overlay **after** snapshot build on a **copy** only. Log `[brain:v8:influence]` with counts; skip when comparison quality is weak. Document rollback (unset env).

**Audit Brain write surface**  
> List all files that **write** Brain outcomes, weights, or learning runs. Confirm the requested change touches **none** of them, or stop and propose a read-only alternative.

---

## Ads (autopilot / automation loop)

**V8 rollout monitoring**  
> Extend **Ads Autopilot V8** in **monitoring-only** mode: `buildProposedActionsAdsAutomationLoop()` (or the documented single proposal source) remains the **only** returned proposal source for live behavior. Gate shadow scheduling with `FEATURE_ADS_AUTOPILOT_V8_ROLLOUT_V1` and related shadow flags. Log adapter namespace (e.g. `[ads:autopilot:adapter]`) with `path: "legacy"` vs `"v8_rollout"`. **Do not** return influenced actions as live output unless the task explicitly authorizes cutover.

**Shadow diff (non-blocking)**  
> Add **non-blocking** shadow pipeline: shadow scheduling must not throw uncaught errors or block the live promise. Persistence optional and failure-safe.

**Safe Ads change (generic)**  
> Touch only ads autopilot modules and tests; preserve idempotency keys and admin audit expectations; add additive tests for flag-off behavior.

---

## CRO (V8 CRO / funnel)

**Analysis-only bundle**  
> Implement **read-only** CRO V8 analysis behind `croOptimizationV8Flags` / `FEATURE_CRO_V8_*`. **Do not** change live funnel routing, assignments, or checkout without a separate flag and product sign-off. Prefer shadow recommendations in dashboard/API only.

**Experiment hooks**  
> Expose **readiness** or metadata for experiments; **do not** auto-assign users or change production behavior when flags are off.

**CRO instrumentation without behavior change**  
> Add logging or read-only metrics for conversion steps; **do not** alter assignment or pricing truth.

---

## Ranking (search / listings / cross-domain)

**Shadow ranking**  
> Add **shadow** ranking or diff logging **without** replacing production ranking output. Any nudge must be flag-gated, bounded, and reversible. **Do not** mutate persisted ranking weights in shadow-only phases.

**Safe integration point**  
> Identify a **single** read path (e.g. after ranking aggregation) for optional overlay; avoid multiple call sites.

**Ranking parity check**  
> Log top-N IDs from shadow vs production for sampling; **do not** change user-visible ordering unless a dedicated influence flag is on and documented.

---

## Booking (BNBHUB / stays / trips)

**Observation layer**  
> Add **logging or shadow** comparison for booking/listing flows without changing confirmation, pricing truth, or guest/host obligations. Webhooks and payment capture stay authoritative.

**Feature flag**  
> Gate any new behavior with an explicit env flag; default off in production templates.

**Operational read-only**  
> Expose dashboards or API read models for ops; **do not** auto-cancel or auto-refund without existing product rules.

---

## Stripe (payments / checkout / webhooks / Connect)

**Non-destructive rule**  
> **Do not** modify webhook idempotency, charge semantics, or Connect transfer logic for “V8” experiments. If adding **V8 safe wrappers**, apply only around **read** paths (e.g. `retrieve`) or logging; **never** change amount, currency, customer, or payment intent truth.

**Safety wrapper pattern**  
> Describe timeouts, retries, and audit logs for **read-only** Stripe calls; no replacement of core checkout creation.

**Shadow pricing suggestion (if ever needed)**  
> Compute suggested amounts in parallel; log `[stripe:v8:shadow]`; live checkout uses existing path only.

---

## Prisma / database

**Additive schema**  
> Prefer **new** optional fields or **new** tables over altering critical columns in place. If migrations are required, document rollback and run `pnpm validate:v8` before commit; run `prisma validate` when the schema changes.

**Destructive guard**  
> Do not use `db push` / `migrate reset` against production; follow repo workflow and local guards from root scripts.

**Read-only reporting**  
> Add views or read models for analytics without changing write paths used by payments or Brain ingestion.

---

## Shadow mode (generic implementations)

**Definition of done**  
> Shadow path: **parallel** computation, **no** writes to production truth tables when the master flag is off, **no** user-visible behavior change. Influence (if any) is a **separate** phase behind its own flag.

**Observability**  
> Structured logs: namespace e.g. `[domain:v8:shadow]` or `[brain:v8:comparison]`; include run id, sample size, failure counts, and explicit “live unaffected” on errors.

**Comparison before cutover**  
> For Brain-style systems, implement **observation → comparison metrics → (optional) influence** in separate PRs/phases; never skip comparison when risk is non-trivial.

**Failure semantics**  
> Shadow failures must be caught and logged; live path must proceed unchanged.

---

## Marketplace (listings / multi-tenant commerce)

**Read-first integrations**  
> Add **read-only** catalog or listing insights behind flags; **do not** change published listing truth, inventory locks, or seller payout rules without explicit product sign-off.

**Shadow pricing / visibility**  
> Compute alternative sort orders or badges in parallel; log `[marketplace:v8:shadow]`; user-visible changes require a dedicated flag and rollback notes.

**Cross-tenant safety**  
> Never broaden RLS or tenant filters in “V8” experiments; additive fields only.

---

## Feature flags (`config/feature-flags`, env)

**Default-off for risk**  
> New behavior ships behind `FEATURE_*` or env; production templates document safe defaults. **Do not** invert existing flag semantics without migration notes.

**Naming & discovery**  
> Add flags next to related domains; document in the nearest module README or `docs/ai/V8-COMMAND-LIBRARY.md` Versioning section.

**Flag-off tests**  
> Add or extend tests proving **flag off = legacy path unchanged** for the touched surface.

---

## Safe refactor (structure without behavior change)

**Extract-only**  
> Move code to new files with **identical** runtime behavior; preserve public exports unless deprecation is explicitly approved. Run `pnpm validate:v8` after moves.

**No drive-by cleanup**  
> Do not mix refactors with feature work in the same commit; avoid deleting “unused” code without proof and review.

**Mechanical verification**  
> Prefer typecheck/tests on touched packages; for pure moves, assert diff is rename + import path updates only.

---

## Self-healing (retries, recovery, cron)

**Non-authoritative**  
> Retries and reconcilers may **read** state and enqueue recovery tasks; **do not** overwrite financial truth rows or Brain outcomes without idempotent, audited writers.

**Backoff & caps**  
> Log `[self-heal:v8]` with attempt counts; cap retries; fail open to human review for payments and bookings.

**Shadow dry-run**  
> Where possible, log “would repair X” before first live repair in a new pipeline.

---

## Repo hygiene (any domain)

**Pre-merge**  
> Confirm **additive** diff: no unrelated deletes, no refactors of unrelated modules. Run `pnpm validate:v8` from repo root and report PASS/FAIL.

**Rollback**  
> Document **one-line** rollback: which env vars to unset and which flags disable the new path.

**Tests**  
> Prefer small deterministic tests next to the module; do not claim CI passed without running the relevant command.

---

## Quick validation commands

From **repository root**:

```bash
pnpm validate:v8
```

From **`apps/web`** (TypeScript non-destructive helper, when applicable):

```bash
pnpm validate:v8-safe
```

Targeted tests (examples):

```bash
cd apps/web && npx vitest run modules/platform-core/brain-v8-shadow-comparison.test.ts
```

---

## Versioning

Update this file when new domains or flag families are introduced. Keep prompts specific to this monorepo (`apps/web`, `config/feature-flags.ts`, `scripts/v8-validate-nondestructive.js`).
