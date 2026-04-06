# Internationalization (web & mobile)

## Canonical locale typing

- **`apps/web/lib/i18n/types.ts`**: `UI_LOCALE_CODES`, `LocaleCode`, `getDirection()`, `LOCALE_META` (labels + dir).
- **`apps/web/lib/i18n/locales.ts`**: cookie helpers + `UI_LOCALES` (BCP‑47 + rtl flags aligned with `LOCALE_META`).
- **Parity (dev/CI)**: `validateLocaleKeyParity()` in `lib/i18n/validate-locale-parity.ts` — `fr`/`ar` must contain every dot-key present in `en`. Covered by `lib/i18n/__tests__/locale-parity.test.ts`.

## Architecture

- **Source strings**: nested JSON in `apps/web/locales/{en,fr,ar}.json`, grouped by domain (`common`, `auth`, `bookings`, `market`, `ai`, `autopilot`, etc.).
- **Mobile (minimal set)**: `apps/mobile/src/locales/{en,fr,ar}.json` — same key paths as the shared mobile bundle; extend when new screens use `t()`.
- **Runtime dictionary (web)**: `apps/web/lib/i18n/flatten-messages.ts` flattens nested JSON to dot keys (e.g. `bookings.manualPaymentTitle`).
- **Client (web)**: `I18nProvider` + `useI18n().t(key, vars)` in `apps/web/lib/i18n/I18nContext.tsx`. Interpolation uses `{name}` placeholders.
- **Server (web)**: `translateServer(locale, key, vars)` in `apps/web/lib/i18n/server-translate.ts` for notifications, emails, AI system hints, and autopilot copy.
- **SSR locale (web)**: `resolveInitialLocale` — `mi_locale` cookie → signed-in `User.preferredUiLocale` → **`getResolvedMarket().suggestedDefaultLocale`** (e.g. Syria → `ar`) → English (`apps/web/lib/i18n/resolve-initial-locale.ts`).
- **Launch allow-list**: root layout calls `resolveLaunchFlags()` + `localeAllowListFromFlags()` so `ENABLE_FRENCH=false` / `ENABLE_ARABIC=false` hide options in `LanguageSwitcher` and clamp SSR locale to `en`. DB overrides: `feature_flag.key = launch:enableFrench`, `launch:enableArabic`, etc. (`lib/launch/resolve-launch-flags.ts`, `GET /api/launch/flags`).

### Supported UI languages

| Code | Layout | Notes |
|------|--------|--------|
| `en` | LTR | Default; fallback for missing keys |
| `fr` | LTR | Canadian French copy where noted in translations |
| `ar` | RTL | Arabic UI; layout follows RTL via `dir` / theme |

There is a single app and marketplace; language is a preference, not a fork.

## Adding a key

1. Add the string under the right domain in `locales/en.json`.
2. Mirror the **same nested path and key names** in `fr.json` and `ar.json`.
3. Use `t("domain.key")` on the client or `translateServer(locale, "domain.key")` on the server.

### Fallback rules

1. If a key is missing in the active locale, **English** is used (`MESSAGES.en`).
2. If still missing, the **key string** is returned (helps spot gaps in development).

## AI & autopilot

- Manager chat sends `uiLocale` (and `context.uiLocale`) from the client so replies match the UI before the profile is read; the orchestrator also loads `User.preferredUiLocale` when needed.
- Autopilot engines use `getUserUiLocaleCode(userId)` and `translateServer` for titles, descriptions, and in-app notifications (`autopilot.*` keys).
- LLM system prompts append a language appendix from `lib/i18n/ai-response-locale.ts` (BCP‑47: `en-CA`, `fr-CA`, `ar`).

## Formatting

- Use `formatDateForUiLocale`, `formatNumberForUiLocale` from `apps/web/lib/i18n/format-ui.ts` for user-visible dates and numbers aligned with the active UI locale.

## Language persistence (web)

- Guests: `mi_locale` cookie (365-day max-age).
- Signed-in users: PATCH `/api/me/ui-locale` updates `User.preferredUiLocale` and refreshes the cookie. The language switcher triggers this automatically.

## Mobile

- `MobileI18nProvider` loads `en`, `fr`, and `ar`; only `ar` forces RTL (`I18nManager`).
- Device language `fr` / `ar` maps to those locales; otherwise `en`.
