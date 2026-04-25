# Global market entry playbook (LECIPM)

This document describes a **repeatable process** for entering a new market, how **localization** and **regulation** fit in, and how **brand consistency** stays intact. It complements code in `apps/web/modules/global/` and `modules/global-expansion/`.

## Phase A — Localize before you scale (multi-language, currency, UX)

- **Language**: Use the platform UI locale list (`en` / `fr` / `ar`) and the country’s `defaultLanguage` / `supportedLanguages` in expansion config. Runtime copy lives in product i18n; the **localization engine** composes which locales apply per market and marketing adaptation notes.
- **Currency**: Display money with the market’s ISO currency via `formatMarketCurrency` / `formatCurrencyDisplay`. Treasury-settlement truth stays in payments — UI formatting is not a price guarantee.
- **Local UX**: Adapt tone, CTA, and **RTL** where Arabic is first-class. Respect `timezone` for scheduling. Do not copy another market’s legal or marketing strings wholesale.

## Phase B — Regulation layer (awareness, not legal advice)

- Use **`regulation.engine`**: it aggregates **rules** (allowed / restricted / warning labels from the regulation view plus config flags) and **constraints** (data, payments, marketing baselines). Qualified counsel must approve market-specific playbooks; this engine is for **governance UI and audits**, not compliance certification.

## Phase C — Entry strategy (pilot, early adopters, feedback)

- **`entry.engine`** encodes a structured plan: **pilot** (territory, duration, success criteria), **early adopters** (segments, onboarding), and **feedback loop** (channels, cadence, metrics).
- **`runPilotLaunchSequence`** calls the existing `launchCountry` orchestration, which records audit lines and flips expansion state — it does **not** provision cloud infrastructure.
- **Early adopters**: start with a narrow, high-trust cohort; document learnings before broad marketing.
- **Feedback loop**: tie product changes to the same **core metrics** each review cycle so expansion stays measurable.

## Phase D — New market checklist (how to enter)

1. Add or update **country config** (routing, currency, features, flags).
2. Run **regulation** review with counsel; update **regulatory** tokens in config.
3. Confirm **payment** and **data** constraints for the market.
4. **Pilot** one or two cities with `launchCountry` and city playbooks.
5. **Measure** proxy performance and growth; pause or scale based on **readiness** score and ops load.
6. **Scale** only with repeatable onboarding and support capacity.

## Phase E — How to scale

- Reuse the same **playbook** with added cities; split attribution by `countryCode` / `marketCityId` in reporting.
- Automate **alerts** when readiness is high or growth spikes — but **never** auto-enable legal or payment changes without human gates.
- Keep **isolation** (tenant routing, warehouse segmentation) explicit in design reviews.

## Global brand consistency (LECIPM identity, consistent UX)

- **Name & voice**: LECIPM remains the product identity; local copy should feel native while preserving **trust, clarity, and premium** positioning.
- **Visual system**: Reuse the existing dashboard shell (e.g. zinc/amber) for admin and global tools so internal users see **one** product, not a per-market fork.
- **No bait-and-switch**: Do not promise returns, guaranteed bookings, or unverified regulatory claims; tie external claims to counsel-approved text per market.
- **Accessibility**: Locale switches and RTL should not break **focus order** or **contrast**; test critical flows in each supported script.

## Success metrics (product)

- **Successful entry**: pilot completes with no unresolved regulatory escalations and stable ops metrics.
- **Sustainable growth**: growth rate stays aligned with support/compliance capacity; underperformance triggers review before more spend.

## Related code

- `modules/global/regulation.engine.ts` — rules + constraints
- `modules/global/entry.engine.ts` — pilot, adopters, feedback
- `modules/global/localization.engine.ts` — language, currency, UX hints
- `app/dashboard/global` — markets, performance, readiness overview
