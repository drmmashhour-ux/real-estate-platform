# Multilingual SEO helpers

## Metadata builder

`buildLocalizedPageMetadata` in `apps/web/lib/content/seo-head.ts` returns Next.js `Metadata` with:

- Localized `title` / `description`
- `alternates.canonical` — pass an **absolute** URL in production
- Open Graph locale (`en_CA`, `fr_CA`, `ar`)

## hreflang

Next.js `metadata.alternates.languages` should map locale → **absolute** URL for each variant. Build this in the page/layout when all localized routes are known; keep routing unified (one app).

## JSON-LD

Add structured data per page type in the same locale as visible copy; reuse factual fields from the CMS/listing row—do not invent ratings or offers.

## RTL

Arabic body copy should live in `dir="rtl"` containers on public pages; layout-level `dir` is already driven by locale for the main shell.
