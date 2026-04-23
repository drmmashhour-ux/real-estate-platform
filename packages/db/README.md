# @repo/db

Exports a singleton **`prisma`** `PrismaClient` for CLI scripts and workspace packages.

- Schema and migrations live under **`apps/web/prisma`** (see root `package.json` `prisma.schema`).
- Run **`pnpm --filter @lecipm/web exec prisma generate`** before typechecking scripts that import `@repo/db`.
