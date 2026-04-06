# Arabic RTL (web)

## Root `dir` / `lang`

- `app/layout.tsx` sets `<html lang={bcp47} dir={rtl ? "rtl" : "ltr"}>` from the resolved initial locale.
- `I18nProvider` updates `document.documentElement.lang` and `dir` on client locale changes (`applyHtmlLang`).

## Helpers

- `getDirection(locale)` in `apps/web/lib/i18n/types.ts` returns `"rtl"` only for `ar`.
- Prefer logical CSS where practical: `ms-*` / `me-*`, `text-start` / `text-end`, flex with `gap` instead of asymmetric `ml`/`mr` only.

## Mixed content

- IDs, emails, URLs, and ISO codes can stay LTR inside Arabic paragraphs; use `dir="ltr"` on inline spans when layout inverts incorrectly.

## Mobile

- `apps/mobile/src/i18n/I18nProvider.tsx`: RTL is applied only for `ar`; `en` and `fr` remain LTR.
