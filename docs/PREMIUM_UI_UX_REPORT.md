# Premium UI/UX system — implementation report

## Goals addressed

| Area | Status | Notes |
|------|--------|--------|
| Design tokens | Done | CSS variables in `app/globals.css` (`:root`) + Tailwind `@theme` for `--font-sans` |
| Typography | Done | **Inter** via `next/font/google` on `<html>` + body |
| Buttons / cards / forms | Done | `.btn-primary`, `.btn-secondary`, `.card-premium`, `.property-card-premium`, `.input-premium` |
| Components | Done | `components/ui/Button`, `Card`, `FormField`, `TrustStrip`, `VerifiedBrokerBadge`, `LoadingShimmer` |
| Homepage | Done | Hero gradients, trust chips, **Buy / Rent / Invest** row, hub cards, CTA |
| Search bar | Done | `MainSearchBar` — elevation, teal focus ring, token-aligned colors |
| Broker dashboard | Done | Stat card shadows; **GrowthPlaceholder** activity strip |
| AI surfaces | Done | `RecommendedForYou` uses `.ai-panel-premium` |
| Checkout / payments | Done | `TrustStrip` + copy on tax transparency; card shadows |
| Invoices / billing | Done | `.invoice-doc-row` + `.dark-invoice` for list rows |
| Branding | Done | `public/favicon.svg` (teal mark); metadata `icons.icon` |
| Animations | Done | `animate-fade-in`, `animate-slide-up`, `page-enter` (respects `prefers-reduced-motion`) |
| i18n shell | Done | **EN / FR / ES / AR** via `LanguageSwitcher` + `mi_locale` cookie; `LocaleAttributes` sets `lang` + **RTL** for `ar` |
| Mobile | Partial | Header language + nav patterns unchanged; homepage sections are responsive |

## Design tokens (reference)

- **Brand / CTA:** `--color-cta` `#0d9488`, hover `--color-cta-hover`
- **Secondary:** `--color-secondary` (deep blue)
- **Accent / gold:** `--color-gold` (projects, premium accents)
- **Neutrals:** stone palette on marketing shell; slate remains on dark hubs

## Files touched (high level)

- `app/globals.css` — tokens, utilities, RTL note, invoice/AI/dashboard classes
- `app/layout.tsx` — Inter, favicon, `LocaleAttributes`
- `app/page.tsx` — marketing homepage upgrade
- `components/layout/HeaderClient.tsx` — language switcher, `btn-primary` signup, fixed extra closing `</div>`
- `components/search/MainSearchBar.tsx`
- `components/hub/HubStatCard.tsx`, `PremiumSectionCard.tsx`
- `app/bnhub/checkout/checkout-client.tsx`
- `app/(dashboard)/dashboard/billing/billing-content.tsx`
- `app/(dashboard)/dashboard/broker/page.tsx`
- `components/ai/RecommendedForYou.tsx`
- `lib/i18n/*`, `components/i18n/*`

## Testing

```bash
cd apps/web && npm test -- lib/i18n/locales.test.ts
cd apps/web && npm run build   # optional full check
```

### Manual QA checklist (recommended)

- [ ] Homepage: hero, search, intent cards, featured grid, footer contrast
- [ ] Switch **العربية** → layout RTL, no horizontal overflow
- [ ] BNHub checkout: trust strip + breakdown
- [ ] Billing: invoice rows + print/download
- [ ] Broker dashboard: stats + activity placeholder
- [ ] iPhone width: header, mobile menu, homepage grids

## Issues / follow-ups

1. **Copy translation:** Only `lang` / `dir` and a language picker are implemented; page strings are still English-first.
2. **Noto Sans Arabic:** For production Arabic typography, add a second font and apply when `dir=rtl`.
3. **Admin dashboard:** Not restyled in this pass; reuse `HubStatCard` / `PremiumSectionCard` patterns.
4. **Map on search:** Still optional / not added.
5. **E2E visual regression:** No Percy/Chromatic; rely on manual passes above.

## Consistency guidance for future UI

- Prefer `.btn-primary` / `.btn-secondary` over one-off blacks on marketing pages.
- Property grids: `property-card-premium`.
- Dark hub panels: keep slate/emerald; add `shadow-lg shadow-black/20` for depth.
- Trust-sensitive flows: include `TrustStrip` near the pay CTA.
