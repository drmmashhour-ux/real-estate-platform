# i18n architecture (LECIPM web)

## Stack

- **Messages:** `apps/web/lib/i18n/messages.ts`, `locales.ts`, `flatten-messages.ts`
- **Server translation:** `server-translate.ts`
- **User locale:** `user-ui-locale.ts`, `resolve-initial-locale.ts`
- **AI output locale:** `ai-response-locale.ts`
- **RTL / direction:** `direction.ts` — Arabic uses RTL; French LTR
- **UI formatters:** `format-ui.ts`

## Rules

- **English** is the default fallback for missing keys.
- **Do not** hardcode user-visible strings in new hub surfaces — use label keys (see Hub Engine `hub-i18n`) or i18n dictionaries.
- **RTL:** Set `dir` from `direction.ts` for Arabic layouts when rendering full-page Arabic content.

## Relation to markets

- `ResolvedMarket.suggestedDefaultLocale` is a **hint** only; user preference wins.
- Legal copy may vary by market via message keys + market-specific disclaimers (see `lib/markets` disclaimer keys).
