# Localization QA

## Process

1. **Switch UI** — Language switcher + `mi_locale` cookie + `localStorage` mirror (`I18nContext`).
2. **RTL** — Arabic: `dir="rtl"` on `<html>`, verify cards, tables, and modals without overflow.
3. **Keys** — No raw `common.foo` visible in UI; fallback to English when a key is missing.
4. **Parity** — Admin report: `/admin/reports/launch-quality` (flattened JSON key diff vs `en.json`).
5. **SEO** — Per-route metadata where implemented; verify FR/AR titles/descriptions on marketing pages.

## References

- `docs/i18n.md`, `docs/i18n/README.md`, `docs/i18n/ARABIC-RTL.md`
