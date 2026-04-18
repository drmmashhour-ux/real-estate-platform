# LECIPM (`apps/web`) — hard isolation

**This directory is LECIPM** — the **Canada-focused** marketplace web app (`APP_CONTEXT=lecipm`).  
It is **not** Darlink (`apps/syria`) and **not** the UAE hub (`apps/uae`).

## Forbidden

- Importing **anything** from `apps/syria`, `apps/uae`, `@lecipm/syria`, `@lecipm/uae`, or paths that resolve into another country app.
- Embedding **Darlink** UI, Syria pricing, or Syria-specific business rules here.
- Treating shared monorepo packages as a shortcut to ship **another country’s** product logic.

### Example forbidden imports

```text
import x from "../../../syria/..."
import x from "apps/syria/..."
import x from "@lecipm/syria"
import x from "apps/uae/..."
```

## Allowed

- This app’s path aliases (`@/*`, `@/modules/*`, … — see `tsconfig.json`).
- **`packages/*`** only for **generic**, non-country-specific utilities (see `packages/README.md`).

## Enforcement (fail loudly)

| Layer | Mechanism |
|-------|-----------|
| ESLint | `monorepo-isolation/no-cross-app-imports` with `{ mode: "web" }` → **error** |
| Runtime | `lib/assertContext.ts` — `APP_CONTEXT=lecipm` required in production |
| Scripts | `pnpm check:isolation`, `pnpm check:darlink-isolation` (repo root) |
| CI | `.github/workflows/ci.yml` runs isolation checks |

**Unified error copy:** see `rules/isolation-constants.mjs`.

See also: `apps/syria/README_GUARD.md`, `.cursor/rules/isolation.txt`, `scripts/check-isolation.ts`.
