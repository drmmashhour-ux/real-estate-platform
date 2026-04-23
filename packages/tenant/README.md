# @repo/tenant

Workspace package for host-based tenant resolution (`resolveTenantFromHost`), Next.js **`getTenantContext`** / **`getTenantContextOptional`**, Prisma **`withTenantScope`**, and **`assertTenantRole`**.

Depends on **`@repo/db`** (shared Prisma client).

The canonical Prisma schema remains in **`apps/web/prisma/schema.prisma`**.

## Errors

| Function | Missing tenant behavior |
|----------|-------------------------|
| `getTenantContext` | throws `TENANT_NOT_FOUND` |
| `getTenantContextOptional` | returns `null` |

Legacy app wrapper `apps/web/lib/tenant/context.ts` exposes `requireTenantContext()` which throws `TENANT_NOT_RESOLVED` for existing routes.
