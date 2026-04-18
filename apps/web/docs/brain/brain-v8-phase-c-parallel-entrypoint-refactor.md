# Brain V8 Phase C — parallel entry-point refactor

## Why the earlier inline wiring was not fully compliant

The strictest **legacy-path protection** rule expects **read-only snapshot loaders** that predate Phase C to keep returning **raw** `buildBrainSnapshot()` semantics without injecting `applyBrainV8PresentationOverlay` / `buildBrainOutputWithV8Routing` on every call.

Previously, `loadPlatformCoreDashboardPayload` and `getBrainSnapshotAction` called `buildBrainOutputWithV8Routing` inline, so **all** consumers of those symbols implicitly ran Phase C (and Phase D when primary is on) even when they only needed the legacy brain truth shape.

## What was corrected

| Area | Change |
|------|--------|
| `platform-history.service.ts` | `loadPlatformCoreDashboardPayload` now resolves the brain slice via `resolveDashboardBrainPayload("legacy_snapshot")` — **raw** `buildBrainSnapshot()` only. |
| `lib/platform-core/admin-actions.ts` | `getBrainSnapshotAction` returns `buildBrainSnapshot()` only. V8 presentation is **`getBrainSnapshotWithV8OverlayAction`**. |
| Growth UI | Uses new server component `PlatformCoreSectionWithBrainV8Overlay` that calls `loadPlatformCoreDashboardPayloadWithBrainV8Overlay` — **explicit opt-in** at the page. |
| `PlatformCoreSectionClient` | Optional `brainRefreshMode`: legacy vs `v8_overlay` refresh action. |

**Not removed:** `brain-v8-influence.service.ts`, feature flags, `buildBrainOutputWithV8Routing`, or influence/primary-routing tests.

## New parallel entry points

| Symbol | Role |
|--------|------|
| `resolveDashboardBrainPayload(mode)` | Shared resolver: `"legacy_snapshot"` or `"v8_overlay"`. |
| `loadPlatformCoreDashboardPayloadWithBrainV8Overlay()` | Full platform dashboard payload with V8 routing on the brain slice. |
| `getBrainSnapshotWithV8OverlayAction()` | Admin server action — snapshot after `buildBrainOutputWithV8Routing`. |
| `PlatformCoreSectionWithBrainV8Overlay` | RSC wrapper for Growth (opt-in UI). |

Legacy equivalents remain:

- `loadPlatformCoreDashboardPayload()`
- `getBrainSnapshotAction()`
- `PlatformCoreSection` (unchanged default: legacy loader)

## Legacy vs V8-enhanced paths

- **Legacy:** Same object reference returned from `buildBrainSnapshot()` (no Phase C shallow copy from the overlay path).
- **V8-enhanced:** Runs `buildBrainOutputWithV8Routing` after the snapshot — Phase C overlay when influence flag is on; Phase D primary when configured; fallbacks unchanged inside that module.

## How to opt in safely

1. **Dashboard data:** import `loadPlatformCoreDashboardPayloadWithBrainV8Overlay` instead of `loadPlatformCoreDashboardPayload`, or compose with `resolveDashboardBrainPayload("v8_overlay")` for custom pages.
2. **Admin refresh:** call `getBrainSnapshotWithV8OverlayAction` from client actions when V8 presentation is intended.
3. **UI:** render `PlatformCoreSectionWithBrainV8Overlay` or pass `brainRefreshMode="v8_overlay"` to `PlatformCoreSectionClient`.

## Observability

Structured logs use namespace **`[brain:v8:parallel-entry]`** on legacy vs overlay resolution (dashboard + server actions). Existing `[brain:v8:primary]` / influence logs are unchanged.

## Anti-break compliance

Legacy symbols no longer **implicitly** enable Phase C/D. Callers that need presentation influence must use the **named** parallel APIs, which improves traceability and reduces accidental coupling of new features to legacy loaders.

## Validation

From `apps/web`:

```bash
pnpm exec vitest run modules/platform-core/brain-v8-dashboard-brain-resolve.test.ts lib/platform-core/admin-actions.brain-parallel.test.ts modules/platform-core/brain-v8-influence.test.ts modules/platform-core/brain-v8-primary-routing.test.ts
```
