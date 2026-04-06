# E2E self-healing failure analysis

## What it does

When a launch scenario finishes with `FAIL` or `BLOCKED` (including runner crashes), the Playwright runner:

1. Builds an **`E2EFailureContext`** (scenario, step, locale, market, role, route, booking/listing IDs, API hints, error text).
2. **Classifies** the failure with deterministic rules (`classify-failure.ts`).
3. **Suggests fix zones** and likely files (`suggest-fix.ts`).
4. Writes **JSON + Markdown** under `apps/web/e2e/reports/failures/`.
5. Emits **`[E2E][FAILURE]`** lines to the console.
6. Emits a **structured JSON log line** via `logOpsCorrelation` (`channel: lecipm_ops`) for log aggregation.

After the full suite, **`e2e/reports/latest-run.json`** and **`e2e/reports/e2e-summary.md`** are updated.

## Enriching context from scenarios

Optional: import `setE2eDiagnosticContext` from `e2e/utils/diagnostic-context.ts` and set `lastStepName`, `activeLocale`, `activeMarket`, `activeRole`, `lastRoute`, `paymentMode`, `lastBookingStatus`, `lastManualPaymentStatus`, `lastApiStatus`, `lastApiBodySnippet` on `ctx.state` before assertions fail.

## Rerunning a single scenario

From code that already holds a Playwright `page` (e.g. a focused spec):

```ts
import { rerunScenarioWithFreshData } from "./e2e/failures/rerun-scenario";

await rerunScenarioWithFreshData(page, "scenario-2-syria-manual");
```

Or use `runSingleScenarioById(page, 2)` from `e2e/runner.ts`.

**Do not** rerun payment scenarios against dirty market state: restore `platform_market_launch_settings` and clear cookies as the Syria scenarios do in `finally` blocks.

## Tests

- `apps/web/tests/e2e-failures/classify-failure.test.ts`
- `apps/web/tests/e2e-failures/suggest-fix.test.ts`
