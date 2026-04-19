# Broker specialization and service-area profiles

## Purpose

Structured, **explicit** broker profile data improves **recommendation-first** lead routing quality while staying **fair**, **explainable**, and **manually overridable**. The system does **not** add payment or commission logic, does **not** auto-send leads externally, and does **not** auto-assign in a risky way by default.

## Profile fields (declared)

Persisted as JSON on `BrokerServiceProfile` (see `modules/broker/profile/broker-profile.types.ts`):

| Group | Fields |
|--------|--------|
| **Service areas** | `country?`, `city`, `area?`, `priorityLevel` (primary / secondary / occasional) |
| **Specializations** | `propertyType` (residential, condo, commercial, land, rental, bnhub, luxury, investor), `confidenceSource` (self_declared, observed, admin_verified), `enabled` |
| **Lead preferences** | `leadType` (buyer, seller, renter, investor, host, consultation), `priorityLevel` (preferred, standard, avoid) |
| **Languages** | `code`, `label`, `proficiency` (native, fluent, working) |
| **Capacity** | `maxActiveLeads?`, `preferredActiveRange?`, `acceptingNewLeads` |
| **Notes** | Free text for human context (not auto-verified) |
| **Admin** | `adminVerifiedAt?` — when set, confidence weighting may treat admin_verified rows as higher trust (no auto-creation of “expertise”) |

## How routing uses them

Gated by `FEATURE_BROKER_SPECIALIZATION_ROUTING_V1` (default off). The distribution layer (`broker-lead-routing.service.ts`) adds a **capped** profile bonus via `computeProfileRoutingBonus` (`broker-profile-routing-bonus.service.ts`):

- **Service area** match against lead city/area hints
- **Property type** match when a lead property bucket is inferable
- **Lead-type preference** (preferred / standard / avoid) vs inferred lead intent
- **Language** when the lead’s user has a `preferredUiLocale` and the broker lists a matching code
- **Capacity** — not accepting or over max active leads **reduces** score; light load + accepting can add a small **advisory** positive
- **Observed CRM sample** (read-only) can add a small **advisory** nudge when declared data is thin — **never** overwrites the stored profile

**Hard cap:** `PROFILE_ROUTING_SCORE_DELTA_CAP` (8 points) on the final profile delta; raw internal sum is also bounded so one field cannot monopolize the score.

## Profile confidence (declared)

`buildProfileConfidenceAndMergeNotes` (`broker-profile-confidence.service.ts`) scores **completeness of declared data** only (more fields filled → higher `profileConfidence`: low / medium / high). That confidence **scales down** routing bonuses when the profile is sparse — **sparse profiles must not bury brokers unfairly**; they receive **neutral baseline** routing from Smart Routing V1 plus smaller profile deltas.

## Observed signals (read-only)

`broker-observed-profile-signals.service.ts` aggregates **historical CRM touches** (cities and coarse property buckets). These are **evidence counts**, not certifications:

- Do **not** overwrite declared profiles automatically
- Do **not** claim expertise as fact
- Surfaced to admins for explanation and optional confidence context

## Fairness

- Profile bonuses are **deterministic** and **capped**
- Existing signals — performance, assignment velocity, active load, discipline hints — remain primary; profile is additive within bounds
- Incomplete profiles: **lower confidence**, **smaller** profile deltas, **no auto-exclusion** solely for missing data

## Feature flags

| Env | Meaning |
|-----|---------|
| `FEATURE_BROKER_SERVICE_PROFILE_V1` | Persistence + core APIs |
| `FEATURE_BROKER_SERVICE_PROFILE_PANEL_V1` | Broker hub editor + GET/PATCH `/api/broker/service-profile` |
| `FEATURE_BROKER_SPECIALIZATION_ROUTING_V1` | Profile-aware bonuses in lead distribution routing |

All default **off** unless set to true.

## Monitoring

Prefix `[broker:profile]` — counters for upserts, updates, routing runs that applied profile signals, and sparse-profile fallbacks (`broker-service-profile-monitoring.service.ts`). Logging **never throws**.
