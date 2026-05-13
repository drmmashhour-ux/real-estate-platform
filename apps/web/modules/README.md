# Domain module boundary

`apps/web/modules` is the preferred home for server-safe domain, application, and infrastructure code that is imported through `@/modules/*`.

- Keep route handlers in `app/api` thin and delegate durable business rules here.
- Do not instantiate `PrismaClient`; use `@/lib/db` or injected repositories.
- Avoid importing client components from this tree.
- Add an `index.ts` only when a module exposes a stable public surface.
- Prefer tests in `__tests__` or `*.test.ts` near the module.

TODO(modules): replace the remaining `apps/web/src/modules` versus `apps/web/modules` split with a staged boundary ADR before moving files.
