# Darlink (`apps/syria`) — hard isolation

**This is DARLINK** — the **Syria-only** platform (`APP_CONTEXT=darlink`).  
It is **not** LECIPM (`apps/web`, Canada).

## Forbidden

- Importing **anything** from `apps/web`, `apps/uae`, `@lecipm/web`, `@lecipm/uae`, or paths outside this app except approved `packages/*`.
- **Québec / OACIQ** regulatory logic, Canadian broker licensing models, or Canada-specific compliance **code paths**.
- **LECIPM-specific** modules, Prisma schema, Stripe/NA payment rails copied from `apps/web` without a deliberate Syria integration.
- Product tokens like **`lecipm`** in runnable source (comments/docs in guard allowlists only).

### Example forbidden imports

```text
import x from "../../../web/..."
import x from "apps/web/..."
import x from "@lecipm/web"
```

## Allowed

- `@/*` → `./src/*` only (`tsconfig.json`).
- **`packages/*`** when content is **generic** (no Canada/Syria business rules).

## Enforcement (fail loudly)

| Layer | Mechanism |
|-------|-----------|
| ESLint | `monorepo-isolation/no-cross-app-imports` with `{ mode: "syria" }` → **error** |
| Runtime | `src/lib/assertContext.ts` — `APP_CONTEXT=darlink` in production; `src/instrumentation.ts` |
| Scripts | `pnpm check:cross-contamination`, `pnpm check:isolation`, `pnpm check:darlink-isolation` |
| CI | Same scans in GitHub Actions |

**Unified error copy:** `rules/isolation-constants.mjs`.

See also: `apps/web/README_GUARD.md`, `.cursor/rules/isolation.txt`, `scripts/check-cross-contamination.ts`.
