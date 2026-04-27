# HadiaLink — DR.BRAIN future wiring

The HadiaLink workspace (`apps/hadialink`) is currently a **reserved slot** with minimal tooling.

DR.BRAIN integration points when the app grows:

1. Add **`DATABASE_URL`** for a **dedicated** Postgres instance (never LECIPM/Syria URLs — enforced by `@repo/db/env-guard`).
2. Implement **`apps/hadialink/src/lib/drbrain.ts`** `runHadialinkDrBrainReport()` — already stubs **`appId: "hadialink"`** with isolated env usage only.
3. Provide a **`dbPing`** callback using **only** HadiaLink’s Prisma client once introduced — **do not** reuse `@lecipm/web` or `@lecipm/syria` clients.
4. Extend **`scripts/drbrain-check.ts`** only if HadiaLink should participate in CI before it has a DB (today it **skips** when `DATABASE_URL` is unset).

No cross-app imports; alerts use prefix **`[DR.BRAIN][HADIALINK]`**.
