# Global Expansion Engine (LECIPM)

## Purpose

Operates a **configurable, multi-country** view for deployment: languages, currency display, per-country feature/hub enablement, **regulatory awareness** (not legal advice), and **auditable** launch checklists. It complements `config/countries.ts` with expansion-specific metadata, pipeline scoring, and integration hints toward Market Domination, City Launch, Growth Brain, and Revenue Predictor.

## Country model

`CountryConfig` (see `global.types.ts`) includes:

- Identity: `countryCode`, `name`, `supportedCities`
- `defaultLanguage` / `supportedLanguages`
- `currency`, `timezone`
- `activeHubs` (buyer, seller, broker, BNHub, etc.)
- `enabledFeatures` (listings, bnhub, mortgage, …)
- `regulatoryFlags` (operator tokens — must be mapped to real obligations with counsel)
- `paymentProvider`, `contactRules`, `dataHandlingMode`
- `expansionStatus` and `expansionReadinessScore`

Canada and Syria are loaded from the canonical `countries` definition; France and UAE exist as **planning** examples until product routing enables them.

## Regulation layer

`getRegulationViewFromConfig` returns **allowed** and **restricted** action *labels* plus **admin warnings** and a fixed **disclaimer**: this is not legal advice. Replace token lists with counsel-approved runbooks in production.

## Localization

`global-localization.service.ts` provides a small `tUi` dictionary (en / fr / ar placeholder) and `marketingAdaptationPlan` for human-in-the-loop content adaptation — not machine translation of the whole product.

## Currency

`global-currency.service.ts` formats with `Intl` and provides indicative CAD normalization using static rate placeholders — use treasury-approved FX for contracts.

## Expansion workflow

1. Review **Global** admin dashboard for country status, pipeline, and proxy performance.
2. Open a **country detail** page for hubs, flags, and integration notes.
3. Use **Launch** (or `launchCountry` API) to run the checklist: regulation view, localization stub, city playbook generation for a pilot territory, and hub listing — with audit lines stored in local demo state.
4. Wire **data isolation** in warehouse + RLS: this module only documents intent.
5. Mobile admins use `GET /api/mobile/admin/global/summary` and `.../countries` and `.../global/{countryCode}`.

## Tests

`apps/web/modules/global-expansion/__tests__/global-expansion.test.ts` covers config loading, regulation disclaimer, localization, currency, flags via dashboard, launch flow, and country detail.

## Acceptance

Multiple countries, localization helpers, currency display, per-country feature/hub config, functional dashboards, integration hooks, and tests align with the engine goals; legal compliance remains an external process.
