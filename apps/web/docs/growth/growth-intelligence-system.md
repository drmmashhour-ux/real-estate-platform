# Growth Intelligence (Phase 6)

## Purpose

Growth Intelligence is a **deterministic, explainable** layer that surfaces SEO, funnel, campaign, regional, and trust-adjacent signals from **existing platform data**. It produces **prioritized internal opportunities** and **draft briefs** for human review. It does **not** replace editorial, legal, or marketing approval.

## Supported signals

| Signal type | Meaning (summary) |
|-------------|-------------------|
| `seo_gap` | Region/city inventory thin vs peers — localized surface may be missing |
| `content_gap` | High-intent topic with stale or missing content metadata |
| `low_conversion_page` | Meaningful traffic with weak contact conversion |
| `high_intent_search_opportunity` | Demand proxy rising vs coverage |
| `underexposed_listing_cluster` | Inventory cluster under-ranked vs peers |
| `high_performing_region` | Region converting above baseline |
| `demand_supply_imbalance` | Buyer/renter demand proxy exceeds inventory proxy |
| `lead_form_dropoff` | Views/clicks without completions |
| `campaign_efficiency_shift` | Campaign source efficiency diverges from median |
| `trust_conversion_opportunity` | Strong trust/readiness but weaker exposure band |
| `trend_reversal` | Fewer positive timeline events (e.g. `action_allowed`, `listing_published`) in trailing 30d vs prior 30d |
| `stalled_funnel` | Workflow entities with submission/review activity but no approval in the comparison window |
| `repeat_dropoff_pattern` | Same document entity accumulates repeated `document_rejected` events |

Timeline aggregates require **`FEATURE_EVENT_TIMELINE_V1`** so `EventRecord` rows can be read safely; otherwise snapshot notes record `event_timeline_disabled`.

Exact thresholds live in `modules/growth-intelligence/growth.config.ts`.

## Opportunity types

Mapped one-to-one from signals into actionable **internal** opportunity records (e.g. `recommend_seo_refresh`, `improve_cta`, `recommend_campaign_review`, `recommend_trust_upgrade`). See `growth-opportunity.service.ts`.

## Prioritization

`growth-priority.service.ts` computes a **weighted composite score** from fixed component scores (revenue relevance, conversion impact, trust/compliance leverage, regional value, ease, repeatability, severity, **timeline persistence**, **worsening vs prior window**, **trust leverage unused**). Same inputs always yield the same ordering.

## Brief generation

`growth-content-brief.service.ts` builds **structured outlines** (title, audience, sections, CTAs, disclaimers). Briefs always include an internal-only footer stating that **public publishing requires governance approval**. No fabricated KPIs: content is derived from opportunity context and snapshot references.

## Policy / governance integration

Rules in `modules/autonomous-marketplace/policy/rules/growth-intelligence.rules.ts`:

- **Block** metadata that implies autonomous public publish, external messaging, or budget spend.
- **Warn / dry-run** for compliance-heavy or high-tier internal tasks until explicitly approved.

Registered in `policy/all-rules.ts` and optionally attached via `policy-context-builder` when Growth Intelligence flags are enabled.

## What the system does **not** do

- Automatic public publishing or CMS pushes  
- Ads budget changes or vendor API calls  
- Outbound email/SMS/automated outreach  
- Non-deterministic ranking or ML black boxes  
- Exposure of raw internal scores to end users  

## Persistence & audit

Opportunities and briefs persist through `growth-repository.ts` using existing autonomy-compatible records where possible. Metadata is **operational JSON** suitable for audit trails, not raw PII dumps.

## Monitoring

`growth-monitoring.service.ts` emits `[growth-intelligence]` log lines for lifecycle events **without PII**.

## Feature flags

- `FEATURE_GROWTH_INTELLIGENCE_V1`
- `FEATURE_GROWTH_BRIEFS_V1`
- `FEATURE_GROWTH_OPPORTUNITIES_V1`
- `FEATURE_EVENT_TIMELINE_V1` (required for DB-backed timeline aggregates in `buildGrowthSnapshot`)

Defined in `config/feature-flags.ts` (`growthIntelligenceFlags`, `eventTimelineFlags`). Defaults follow repo conventions (typically off unless env set).

## Future extensions

- Human-reviewed publishing pipeline with explicit editorial states  
- Experimentation framework tied to policy engine  
- ROI attribution from billing and CRM joins  
- Localized content ops playbooks  
- CRM enrichment loops with consent boundaries  
