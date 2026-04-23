# UAE app guard — `apps/uae`

This directory is the **UAE product** (`APP_CONTEXT=uae`). It must never become a dumping ground for Canada (LECIPM) or Syria (Darlink) business logic.

## Forbidden

- Importing from `apps/web`, `apps/syria`, or paths like `@lecipm/web`, `@lecipm/syria`
- Quebec / OACIQ / Canadian regulatory product flows
- Darlink-specific marketplace or Syria-only compliance rules
- Centralizing UAE **business** rules inside `packages/*` (only generic helpers belong there)

## Allowed

- Imports from **generic** workspace packages (`packages/ui`, `packages/utils`, …) that contain **no** country-specific pricing, payments, or compliance
- This app’s own modules under `apps/uae/**`

## Examples of forbidden imports

```ts
// BAD
import { foo } from "../../web/lib/foo";
import { bar } from "@lecipm/syria/bar";

// GOOD
import { cn } from "@workspace/utils"; // generic only — verify package policy
```

Run **`pnpm check:isolation`** before pushing. ESLint **`monorepo-isolation/no-cross-app-imports`** is set to **error** for this app.
