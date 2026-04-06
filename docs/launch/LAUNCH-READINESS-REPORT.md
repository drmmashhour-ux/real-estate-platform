# Launch readiness (legacy snapshot)

**Canonical go / no-go report:** [`../LAUNCH-READINESS-REPORT.md`](../LAUNCH-READINESS-REPORT.md) — migrations, core flows, Stripe BNHub script, fraud run, **FINAL STATUS**.

The sections below remain useful reference for **i18n, launch flags, and rollout order** (not re-executed on every run).

---

## Subsystem status (reference)

| Subsystem | Status | Notes |
|-----------|--------|--------|
| EN default + FR/AR | **Green** | `UI_LOCALE_CODES`, parity test on `en`/`fr`/`ar` keys, `LanguageSwitcher` respects allow-list |
| Arabic RTL | **Green** | Root `dir`/`lang`; client sync in `I18nProvider`; see `docs/i18n/ARABIC-RTL.md` |
| Syria / manual-first | **Green/Yellow** | Resolver + BNHub booking logic exists; verify end-to-end on staging with real admin settings |
| Launch flags | **Green** | `config/feature-flags.ts` + `resolveLaunchFlags()` + DB `launch:*` overrides; `GET /api/launch/flags` |
| AI / autopilot locale | **Green** | Orchestrator + autopilot use `translateServer` + user locale; Syria-safe constraint strings |
| Content engine | **Yellow** | Prisma tables + review/publish + admin UI; run migrations; template-first generators |
| Admin ops | **Green** | `/admin/content`, `/admin/launch-ops`, market settings API (existing) |
| Health | **Green** | `/api/health`, `/api/ready` (DB + i18n bundles + market) |
| Mobile | **Yellow** | `en`/`fr`/`ar` + RTL for `ar`; parity with web feature flags not fully unified |

## Files to know

- i18n types: `apps/web/lib/i18n/types.ts`, `locales.ts`, `resolve-initial-locale.ts`, `validate-locale-parity.ts`
- Launch: `apps/web/lib/launch/resolve-launch-flags.ts`, `app/api/launch/flags/route.ts`
- Market: `apps/web/lib/markets/*`, `hooks/useMarketConfig.ts`
- Content: `apps/web/lib/content/*`, Prisma `lecipm_generated_content*`
- Env strict: `apps/web/lib/env/production.ts` (`STRICT_LAUNCH_ENV`, `FAIL_LAUNCH_ON_MISSING_ENV`)

## Tests run (examples)

```bash
cd apps/web && pnpm exec vitest run lib/i18n/__tests__/locale-parity.test.ts lib/content/__tests__/content-workflow.test.ts
```

## Migrations

- Apply Prisma migrations including `lecipm_generated_content` before using the content admin UI.

## Rollback

- See `docs/launch/ROLLBACK-PLAN.md`; disable `launch:*` flags in DB or unset env; turn off `ENABLE_AI_CONTENT_PUBLISH`.

## Recommended launch order

1. Migrate DB → verify `/api/ready`.
2. Set market to default; confirm online booking path.
3. Enable Syria profile on a staging tenant; run request + manual payment QA.
4. Enable FR/AR in production (`ENABLE_*` unset = on); use DB `launch:*` to disable per locale if needed.
5. Enable `ENABLE_AI_CONTENT_PUBLISH` only when editorial workflow is staffed.
