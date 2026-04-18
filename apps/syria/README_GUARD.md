# Darlink (`apps/syria`) — isolation guard (`darlink_strict_isolation_system`)

This directory is **Darlink**, the **Syria-only** web app. It is **not** the Canada LECIPM web product (`apps/web`).

## Forbidden

- Importing **anything** from `apps/web`, `apps/uae`, `@lecipm/web`, `@lecipm/uae`, or paths that resolve into another country app tree
- OACIQ / Québec regulatory **logic** or Canadian broker licensing assumptions in code paths (marketing copy outside the Syria app is out of scope)
- Reusing Stripe / North American payment flows unless you deliberately integrate a Syria-approved PSP
- Embedding LECIPM-specific modules, Prisma schema, or CRM flows from `apps/web`

### Examples of forbidden imports

```text
import x from "../../../web/..."
import x from "apps/web/..."
import x from "@lecipm/web"
```

## Allowed

- `@/*` → `./src/*` only (see `tsconfig.json`)
- Workspace packages under `packages/*` when they contain **generic** helpers (see `packages/README.md`)

## Enforcement

| Mechanism | Purpose |
|-----------|---------|
| `src/lib/guard.ts` | Runtime: `assertDarlinkRuntimeEnv()` — production requires `APP_CONTEXT=darlink`. |
| `src/lib/assertContext.ts` | Re-exports the same guards for a stable import path. |
| ESLint `monorepo-isolation/no-cross-app-imports` | **Error** on forbidden import paths (`mode: "syria"`). |
| `pnpm check:isolation` (repo root) | Static scan of `apps/syria/src`, selected `apps/web` trees, `apps/uae`, and `packages/*`. |
| `src/instrumentation.ts` | Node bootstrap: asserts context when the runtime loads. |

Workspace npm name `@lecipm/syria` is technical only — product identity is **Darlink**.

## Env (production)

```bash
APP_CONTEXT=darlink
```

See `.env.example`.

## Before commit / CI

From monorepo root: `pnpm check:isolation`

See also: `.cursor/rules/isolation.txt`, `scripts/check-isolation.ts`.
