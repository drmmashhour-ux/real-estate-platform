# Checklist — add a new country app

Use this when creating `apps/<iso-or-name>` for a new market.

## 1. Scaffold

- [ ] Create `apps/<country>/` with its own `package.json` (`private: true`), `tsconfig.json`, and `README_GUARD.md`.
- [ ] Add `config/country.ts` with **local** defaults: `appContext`, `productKey`, `legalMarket`, `defaultCurrency`, `defaultLocales`.
- [ ] Add `lib/assertContext.ts` (or `src/lib/...` if mirroring Syria) with `assert<Country>RuntimeEnv()` checking `APP_CONTEXT`.
- [ ] Add `.env.example` with `APP_CONTEXT=<value>` documented.

## 2. Isolation

- [ ] Add `eslint.config.mjs` using `monorepo-isolation/no-cross-app-imports` — extend `rules/eslint/monorepo-isolation-plugin.mjs` if you need a **new mode** (forbid imports from all other country apps).
- [ ] Extend `scripts/check-isolation.ts` to walk the new app’s source roots and forbid strings/imports that indicate the wrong product (mirror `scanUae`).
- [ ] Register the app in root `eslint.config.mjs` **ignore** list if it has its own flat config (same pattern as `apps/web`, `apps/uae`).

## 3. Runtime wiring

- [ ] When using Next.js, call the assert from `instrumentation.ts` (Node) at cold start for server bundles.

## 4. Currency, language, branding

- [ ] Set currency and locale defaults only in **this app’s** `country.ts` — not in `packages/*`.
- [ ] Keep logos, CSS variables, and market copy inside the app or app-scoped theme files.

## 5. Monetization & compliance

- [ ] Payment provider selection, tax, and broker rules live in this app’s modules — not in shared packages.

## 6. Shared packages

- [ ] Only depend on **generic** `packages/*` modules; verify they contain no other country’s business logic.

## 7. Verify

- [ ] `pnpm check:isolation`
- [ ] `pnpm lint` (root and/or `--filter` the new app)
- [ ] Grep for accidental `apps/web` / `apps/syria` path strings in the new app.

## 8. CI

- [ ] Confirm CI runs `pnpm check:isolation` (already in `.github/workflows/ci.yml`).
