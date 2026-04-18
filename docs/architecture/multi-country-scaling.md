# Multi-country scaling (monorepo)

This repository ships **separate country products** as separate Next.js (or future) apps. **No cross-imports** between country apps are allowed.

## Products

| Directory | Product | `APP_CONTEXT` |
|-----------|---------|----------------|
| `apps/web` | LECIPM (Canada) | `lecipm` |
| `apps/syria` | Darlink (Syria) | `darlink` |
| `apps/uae` | UAE (scaffold / future) | `uae` |

## What belongs in shared packages (`packages/*`)

- Generic UI building blocks (buttons, layout primitives) without embedded legal copy or market pricing.
- Pure utilities: dates, formatting, small math helpers, HTTP helpers without domain assumptions.
- Generic TypeScript types that describe transport shapes, not Canadian or Syrian law.
- **Not allowed:** country-specific pricing, broker acquisition, compliance flows, marketplace ranking rules, payment rail selection, or admin workflows tied to one regulator.

## What belongs in each country app

- Branding, locale defaults, currency defaults (`config/country.ts` beside each app).
- Monetization, fees, broker rules, verification flows.
- Compliance and legal copy for that jurisdiction.
- App-specific Prisma schema and migrations (when the app owns its database).

## How to launch a new country app safely

1. Copy the checklist in `docs/architecture/new-country-checklist.md`.
2. Add `apps/<country>` with its own `APP_CONTEXT`, `README_GUARD.md`, `config/country.ts`, and `eslint.config.mjs` using `monorepo-isolation/no-cross-app-imports` with `mode` set to that app’s slug (extend `rules/eslint/monorepo-isolation-plugin.mjs` if you add a new mode).
3. Extend `scripts/check-isolation.ts` with scans for the new tree and forbidden tokens.
4. Run `pnpm check:isolation` and app-level `pnpm lint`.

## Enforcement layers

1. **ESLint** — `monorepo-isolation/no-cross-app-imports` (`syria` | `web` | `uae` | `package`).
2. **Static scan** — `pnpm check:isolation` (imports + keyword heuristics).
3. **Runtime** — `assert*RuntimeEnv()` in each app’s `assertContext.ts` / instrumentation.
4. **Git / CI** — pre-commit hook and `.github/workflows/ci.yml` run `check:isolation`.

## Examples of forbidden sharing

- Importing `apps/web/lib/...` from `apps/syria`.
- Putting Stripe Connect onboarding helpers used only by Canada into `packages/utils`.
- Encoding OACIQ disclaimer text inside `packages/ui`.

## References

- `apps/*/README_GUARD.md`
- `.cursor/rules/isolation.txt`
- `docs/architecture/prisma-product-boundaries.md`
