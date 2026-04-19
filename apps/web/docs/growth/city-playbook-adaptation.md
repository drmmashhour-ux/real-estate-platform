# City playbook adaptation (internal)

**Guided replication intelligence** for operators: compare other markets to a **reference city** from the Fast Deal city comparison, list **gaps in logged metrics**, and surface **human-review suggestions**. This is not automation, not a public feature, and not proof of causality.

## How the reference (top) city is selected

1. Input: `FastDealCityComparison` from the city comparison engine (same window and city list).
2. Filter to cities that satisfy **all** of:
   - `confidence` is **medium** or **high** (low is rejected)
   - `meta.sampleSize` ≥ **25** (`TOP_CITY_MIN_SAMPLE_SIZE` in `city-playbook-selector.service.ts`)
3. Among those, pick the **highest** `performanceScore` (sort descending). Ties are broken by sort order only.
4. If none qualify, the bundle has `topCity: null` and every city is listed under `skippedTargets` with a reason.

## How patterns are extracted

`extractCityPlaybookTemplate` and `buildCityPlaybookSignal` read **only** fields present on the reference row:

- Fixed internal floors label “strong” patterns (e.g. capture ratio ≥ 0.18 when defined).
- `baselineRates` copies numeric `derived` + `avgCompletionTimeHours` when present for gap math.
- Template **confidence** blends pattern density with the reference row’s comparison confidence and sample size.

Nothing is imputed; missing metrics stay out of baselines.

## How adaptations are generated

For each other city in `rankedCities` (excluding the reference):

1. Skip entirely when sample size is below **8** (`MIN_TARGET_SAMPLE`) — recorded in `skippedTargets`.
2. `compareCityToTemplate` builds **gaps** where the target trails the reference on comparable rates/times (only when both sides have values, except explicit “missing metric” gaps).
3. `applyAdaptationRules` maps gap kinds to **deterministic** suggestion strings (max **4** per city after truncation).
4. Each row gets **constraints** (internal review only, no auto-execution) and **warnings** (including “do not copy wholesale”).

## Adaptation rule mapping (exact)

Implemented in `city-playbook-adaptation-rules.service.ts`:

| Gap kind | Typical suggestion |
|----------|-------------------|
| `thin_data` | Collect more attributed Fast Deal events before tightening expectations. |
| `capture` (severity-driven) | Increase sourcing activity / refine queries — capture trails reference. |
| `playbook` | Focus on completing playbook steps inside the 48h window. |
| `progression` | Improve qualification and broker matching checks. |
| `completion_time` | Prioritize faster follow-up in the first 24h — slower than reference. |

Base **constraints** on every row:

- Internal operator review only — no automated outreach or playbook sends.
- Treat suggestions as hypotheses; verify attribution and CRM hygiene first.

If **no** comparable channels overlap (`comparableChannels === 0`), suggestions are replaced with a single **data collection** line and an explicit warning.

## Low-confidence behavior

- Per-city `confidence` is **low** when: target or template confidence is low, target sample &lt; 12, or severe gaps with few comparable channels (see `adaptationConfidence` in `city-playbook-adaptation.service.ts`).
- Insights cap at **5** lines and stress non-causality and thin data.

## Limitations (explicit)

- **No causality:** correlation of logged metrics with city labels does not prove that tactics in one city will work in another.
- **No automation:** no API sends outreach, Stripe, or bookings.
- **No “copy exactly”:** warnings and UI copy forbid treating the reference city as a template to clone.

## Monitoring

Logs use prefix **`[fast-deal:adaptation]`** (`bundle_built` with adaptation count, low-confidence count, skipped count). Handlers never throw.

## Feature flags

- `FEATURE_CITY_PLAYBOOK_ADAPTATION_V1` — engine + admin API.
- `FEATURE_CITY_PLAYBOOK_ADAPTATION_PANEL_V1` — Growth Machine panel (typically enabled with `FEATURE_FAST_DEAL_CITY_COMPARISON_V1`).

Default: **off**.
