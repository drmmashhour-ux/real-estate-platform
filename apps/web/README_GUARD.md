# LECIPM (`apps/web`) — isolation guard

This directory is **LECIPM**, the **Canada**-focused web application (Montreal / Québec operations as configured in product copy — not enforced in code as regulatory logic).

## Forbidden

- Importing **anything** from `apps/syria`, `apps/uae`, `@lecipm/syria`, or `@lecipm/uae`
- Embedding **Darlink** product UI, themes, or Syria-specific business rules intended for `apps/syria`
- Treating `apps/web` Prisma schema or Stripe flows as reusable inside **Darlink** without explicit product decisions

## Examples of forbidden imports

```text
import x from "../../../syria/..."
import x from "apps/syria/..."
import x from "@lecipm/syria"
```

## Allowed

- Workspace packages under `packages/*` that contain **generic** utilities (no Syria-only or Canada-only business rules mixed in one module without clear naming)
- This app’s own aliases: `@/*`, `@/modules/*`, `@/components/*`, etc. (see `tsconfig.json`)

## Enforcement

- ESLint rule `monorepo-isolation/no-cross-app-imports` with `{ mode: "web" }`
- Runtime: `lib/assertContext.ts` — `APP_CONTEXT=lecipm` in production
- Repo script: `pnpm check:isolation` (from monorepo root)

See also: `apps/syria/README_GUARD.md`, `apps/uae/README_GUARD.md`, `.cursor/rules/isolation.txt`, `scripts/check-isolation.ts`.
