# Testing in the monorepo

- **Main web app (`@lecipm/web`):** Vitest — `pnpm --filter @lecipm/web test` (or `pnpm test` from `apps/web`).
- **Services:** each package that defines a `test` script runs under `pnpm -r run test --if-present` from the repo root.
- **CI:** `.github/workflows/ci.yml` runs Prisma validation on `apps/web` and optional service tests (e.g. auth-service).

Add colocated `*.test.ts` / `*.test.tsx` next to modules or under `__tests__/`, matching existing patterns in `apps/web`.
