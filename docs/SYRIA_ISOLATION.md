# Syria / SYBNB Isolation

## Overview

`apps/syria` is a separate Next.js application for the Syria/SYBNB market. It is architecturally isolated from the main LECIPM platform (`apps/web`).

## Isolation Guarantees

| Guarantee | Status |
|---|---|
| `apps/web` does NOT import from `apps/syria` | Verified |
| `apps/syria` does NOT import from `apps/web` | Verified |
| Shared code lives only in `packages/*` | Verified |
| Syria env vars are NOT required by `apps/web` Vercel build | Verified |

## What is Shared

| Package | Purpose |
|---|---|
| `packages/db` | Database utilities (future shared use) |
| `packages/ui` | Shared UI component library |
| `packages/config` | Shared configuration constants |

## What is Intentionally Separate

| Concern | Notes |
|---|---|
| Prisma schema | Syria uses `syria_*` prefixed tables; may share the same `DATABASE_URL` but uses its own schema file |
| Routes | Completely separate Next.js `app/` directory |
| Components | Syria has its own component tree under `apps/syria/src/` |
| Business logic | No cross-imports between apps |
| Environment variables | Each app has its own set; Syria env vars do not affect apps/web |

## Build & Deploy

- **apps/web builds do NOT trigger apps/syria builds** (and vice versa).
- Syria's `prisma generate` is **skipped** during CI/Vercel when building apps/web — it is not needed for the main platform deploy.
- Syria's postinstall does not run Prisma generation in CI (`prisma generate` is conditional).

## Deployment Plan

- **Current**: Syria is not yet deployed. Only `apps/web` targets Vercel.
- **Future**: `apps/syria` will be deployed as a **separate Vercel project** with:
  - Its own Vercel project and deployment pipeline
  - Its own environment variables
  - Its own `DATABASE_URL` (may point to the same PostgreSQL instance but uses `syria_*` tables)
  - Independent deploy schedule from `apps/web`

## Rules

1. Never add imports from `apps/web` into `apps/syria` or vice versa.
2. If both apps need the same utility, move it to a `packages/*` workspace.
3. Syria environment variables must never be added to the `apps/web` Vercel project.
4. Database tables for Syria are prefixed with `syria_` to avoid collision.
