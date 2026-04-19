# Lead intake enrichment and geo routing

## Goals

- Improve **explainable** broker routing using **explicit** location and light intake context.
- **Never** fabricate cities, provinces, or budgets.
- **Recommendation-first** — no external auto-assignment; internal ranking only.

## Lead location model

See `modules/lead/lead-location.types.ts`. `LeadLocation` includes optional `country`, `province`, `city`, `area`, `postalCode`, optional `lat`/`lng` (only when sourced later from user/device — not invented here), `confidenceLevel`, and `source` (`user_input` | `inferred` | `partial`).

Extraction lives in `modules/lead/lead-location.service.ts` (`extractLeadLocation`). Sources:

- Optional ImmoContact fields (`preferredCity`, `preferredProvince`, …) merged into `aiExplanation.property` on the CRM lead.
- `purchaseRegion`, evaluation / AI snapshot (`extractEvaluationSnapshot`), Immo listing location line, and conservative message patterns (`City:` line).

Canadian postal codes may **only** contribute a province hint when a postal code string is present (FSA letter → province); no invented city.

## Enrichment

`modules/lead/lead-enrichment.service.ts` (`buildLeadEnrichment`) produces `LeadEnrichment`: location, coarse intent, urgency, optional budget/property/timeline/language strings, and `completenessScore` (0–1) from **honest** field presence — no guessed finances.

## Geo matching

`modules/broker/distribution/broker-geo-match.service.ts` (`computeGeoMatch`) compares `LeadLocation` to broker **declared** `BrokerServiceProfile.serviceAreas`.

Match types (best wins across areas):

| Type | Meaning |
|------|---------|
| `area_match` | Same city + compatible neighbourhood / area strings |
| `exact_city` | Same city (Quebec City / Québec aliases normalize) |
| `same_region` | Province alignment using lead province + broker city → province hints (explicit broker cities only) |
| `none` | Weak fit — **geoScore floor** keeps brokers in play |

Scores map to 0–1; routing adds **capped** points (`GEO_ROUTING_WEIGHT_POINTS`, max 6) so geo **does not dominate** performance, fairness, or load balancing.

### Quebec → Québec routing

Leads mentioning **Quebec City** / **Québec** share a canonical bucket with broker-declared **Quebec City** service rows (deterministic string normalization — not a claim of precision on every variant).

## Soft vs strict geo

- **Default (soft):** `FEATURE_GEO_ROUTING_V1` defaults **on** unless set to `false`/`0`. Geo adds capped bonuses; full pool remains eligible.
- **Strict:** `FEATURE_STRICT_GEO_ROUTING_V1=true` reorders recommendations so **exact_city** / **area_match** brokers appear **before** others when any exist; if **none**, the system **falls back** to the full scored list (graceful degradation).

## Fairness

Assignment velocity, active pipeline load, and discipline signals from `broker-lead-routing.service.ts` still apply. Geo is an additional **bounded** signal.

## Monitoring

Prefixes: `[lead:geo]`, `[lead:enrichment]` — counters/logging only; never throws.

## Feature flags

| Variable | Default |
|----------|---------|
| `FEATURE_LEAD_ENRICHMENT_V1` | **on** unless `false`/`0` |
| `FEATURE_GEO_ROUTING_V1` | **on** unless `false`/`0` |
| `FEATURE_STRICT_GEO_ROUTING_V1` | **off** unless `true`/`1` |
