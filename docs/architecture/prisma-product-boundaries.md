# Prisma and product boundaries

## Current state (practical)

- **`apps/web`** owns the primary LECIPM Prisma schema (`apps/web/prisma/schema.prisma`) and generates the client used by that app.
- **`apps/syria`** owns a **separate** Prisma schema for Darlink (`apps/syria/prisma/schema.prisma`).
- **Services** under `services/*` may have their own schemas for bounded contexts (listings, bookings, etc.).

This is intentional **physical separation** where each deployable owns its persistence story.

## Application-level separation

Even when multiple products share infrastructure in the future (one cluster, one vendor), **product isolation is enforced in application code**:

- No importing another app’s Prisma client or server actions.
- No “shared” Prisma schema that mixes Canadian broker compliance entities with Syria marketplace entities unless there is an explicit, reviewed shared kernel — which this repo **does not** assume today.

## When to add a discriminator field

Consider a `tenantId`, `productId`, or `countryCode` column when:

- Multiple products **must** share one database **and** one schema for operational reasons, **and**
- You need hard query guards to prevent cross-tenant reads.

Do **not** add discriminators everywhere “just in case.” Prefer separate schemas or databases until a merged model is required.

## Review triggers

- New models that encode **regulatory** or **fee** rules → must live in the **correct app’s** schema, not in a generic package.
- Copying models from `apps/web` into `apps/syria` (or vice versa) → stop and split by product ownership instead.

## Related

- `docs/architecture/multi-country-scaling.md`
- `pnpm check:isolation` — blocks cross-app import strings in source.
