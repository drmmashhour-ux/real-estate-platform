# LECIPM / BNHub CI policy

Concise reference for what GitHub Actions enforces and how to respond when it fails.

## Security workflows (separate jobs)

Security scanning runs in **dedicated workflows** (not merged into `ci.yml`) to keep failures visible and optional gates independent:

- **CodeQL** — [`.github/workflows/codeql.yml`](../.github/workflows/codeql.yml)
- **Snyk** — [`.github/workflows/snyk.yml`](../.github/workflows/snyk.yml) (requires `SNYK_TOKEN` for full runs)
- **Gitleaks** — [`.github/workflows/gitleaks.yml`](../.github/workflows/gitleaks.yml)
- **ZAP** — [`.github/workflows/security-zap.yml`](../.github/workflows/security-zap.yml) (scheduled / manual / post-merge; uses `ZAP_TARGET_URL` etc.)

Policy for which checks block merges: [docs/security/pr-security-gates.md](./security/pr-security-gates.md).

## What CI blocks

On every push to `main` / `develop` and on pull requests, the **CI** workflow fails the job if any of these fail:

1. **Prisma schema** — `prisma validate` for `apps/web` (invalid schema blocks downstream work).
2. **Integrity gate** — structural checks for BNHub + stays + critical paths (runs **before** build). Missing files, empty files, or broken wiring between listing page → view → gallery / booking / calendar fail the job.
3. **TypeScript** — `tsc --noEmit` in `apps/web` (no emit; catches type and many import issues).
4. **Next.js production build** — `next build --webpack` for `apps/web`.
5. **Platform validations** — safe scripts only: **Vitest** unit run by default; **`validate:flows`** runs only when `DATABASE_URL` or `CI_DATABASE_URL` is set (otherwise explicitly **skipped**, not a false pass).

**ESLint (web)** — `pnpm run ci:lint` runs `eslint .` under `apps/web`. It is **not** a CI gate today because the web app still has a large lint backlog; run it locally when touching those files. When the backlog is cleared, add the lint step back to `.github/workflows/ci.yml`.

CI does **not** run destructive git commands, database migrations, or production secrets.

## Scripts (root → web)

| Script | Purpose |
|--------|---------|
| `pnpm run ci:integrity` | Write `apps/web/.integrity-report.json` and exit non-zero on critical issues |
| `pnpm run ci:typecheck` | Typecheck `apps/web` |
| `pnpm run ci:build` | Production Next build for `apps/web` |
| `pnpm run ci:lint` | ESLint for `apps/web` (local / optional; not enforced in CI yet) |
| `pnpm run ci:validate:platform` | Vitest + optional DB-backed flows |
| `pnpm run ci:all` | Local orchestration: integrity → typecheck → build → validate (same order as CI) |
| `pnpm run prepush:check` | Manual pre-push: integrity + typecheck + optional build (`PREPUSH_SKIP_BUILD=1` skips build) |
| `pnpm run validate:ci-system` | Self-check that workflow + scripts + policy doc exist |

## Critical integrity (meaning)

The integrity script treats a fixed set of **paths and content expectations** as critical for BNHub and stays (e.g. BNHub listing route, shared listing view, booking form, gallery, availability calendar, Prisma schema, auth segment). Anything listed as critical that is missing, empty, or incorrectly wired is a **hard failure** in CI.

## When CI fails

1. Open the failed job log in GitHub Actions.
2. If **integrity** failed, download the **lecipm-ci-debug** artifact (when uploaded) and inspect `apps/web/.integrity-report.json`, or run locally: `pnpm run ci:integrity`.
3. For **typecheck** / **build**, logs are also attached as `typecheck-ci.log` and `next-build-ci.log` in the same artifact when those steps ran.
4. Fix the underlying issue and push again.

## Local vs CI

| Check | CI | Local |
|--------|----|--------|
| Integrity | Always runs | Same; report file is gitignored (`apps/web/.integrity-report.json`) |
| Typecheck / lint / build | Always runs | Use `pnpm run prepush:check` or individual `ci:*` scripts |
| `validate:flows` | Only if `DATABASE_URL` / `CI_DATABASE_URL` is configured | Requires a real DB + seeded users as today |
| Vitest | Runs unless `CI_SKIP_VITEST=1` | `pnpm --filter @lecipm/web test` |

## Optional: pre-push hook

Husky is installed (`prepare`: husky), but there is **no** default `pre-push` hook wired to `prepush:check`. To opt in, add `.husky/pre-push` that runs `pnpm run prepush:check` (or `PREPUSH_SKIP_BUILD=1 pnpm run prepush:check` for a faster push).

## Full monorepo build

The workflow intentionally gates **apps/web** for speed and determinism. A broader release build (`pnpm run build:ci`) can still be run locally or in a separate workflow when you need admin/modules/packages built in CI.
