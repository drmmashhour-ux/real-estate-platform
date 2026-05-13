# API and DB Safety Report

Status: hardening only. No migrations, schema recreation, deployment, or production DB operation was performed.

## DB boundaries

| Check                                    | Result                                                           | Risk                                                                                                  | Status                                           |
| ---------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Runtime Prisma entrypoint                | App runtime uses `@/lib/db` -> `lib/db/prisma.ts`.               | Import-time Prisma construction is still a build/tooling risk if non-runtime code imports DB modules. | Postponed.                                       |
| Direct `PrismaClient` outside entrypoint | Found in scripts, Prisma seeds, and realtime socket sidecar.     | Acceptable for CLI/sidecar but must stay out of app routes.                                           | Documented.                                      |
| Build-time DB connection                 | `prisma generate` is used; no migration/deploy in build scripts. | Blog static params can query DB if available but falls back.                                          | Postponed.                                       |
| Placeholder/malformed DB URL             | Neon `channel_binding` normalization exists.                     | Needs regression coverage.                                                                            | Fixed now: `normalize-database-url` tests added. |

## API boundaries

| Issue                                                              | Severity | Affected modules                        | Recommended fix strategy                                                                 | Status                                     |
| ------------------------------------------------------------------ | -------- | --------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------ |
| Middleware failures lacked visibility.                             | High     | Core/API gateway                        | Structured log the fallback path with route and method.                                  | Fixed now.                                 |
| Raw card payload blocking needed tests.                            | High     | Billing, middleware, API                | Add focused tests for direct PAN, nested payment method data, and safe Stripe summaries. | Fixed now.                                 |
| Listing API returned raw exception messages on create failure.     | High     | Homes, BNHub listings                   | Return stable public error and log internals.                                            | Fixed now.                                 |
| FSBO upload returned raw exception messages on 500.                | High     | Homes, uploads                          | Return generic upload error and log listing-scoped server metadata.                      | Fixed now.                                 |
| API JSON parsing is inconsistent.                                  | Medium   | Listings, mortgage, mobile, forms       | Add schema validation to high-risk routes first; reject invalid JSON explicitly.         | Partially fixed for `/api/listings`.       |
| Fire-and-forget `.catch(() => {})` hides telemetry/email failures. | Medium   | Growth, mortgage, leads, demo telemetry | Replace with structured warning/error logging where failures affect money/compliance.    | Partially fixed for middleware demo event. |
| Internal route protection is per-route.                            | Medium   | Admin, growth, BNHub cron               | Standardize internal auth helper and manifest test.                                      | Postponed.                                 |
| Prisma errors are inconsistently classified.                       | Medium   | API, DB, readiness                      | Use `classifyDbError` on high-traffic and payment-adjacent routes.                       | Postponed.                                 |

## Applied safety changes

- Added structured middleware fallback visibility.
- Added structured server logging for `/api/listings` errors.
- Added safe FSBO upload failure response.
- Added invalid JSON rejection for listing creation.
- Added tests for launch flags, compliance fail-closed behavior, raw card rejection, public browse paths, demo allowlist, and DB URL normalization.
