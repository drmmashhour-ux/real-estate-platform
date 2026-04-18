# Conversion engine rollout checklist

Use this before toggling conversion flags or rollout modes in production. The conversion engine adds UX layers only; business rules and APIs stay unchanged.

## Required flags (see `apps/web/.env.example`)

| Variable | Purpose |
|----------|---------|
| `FEATURE_CONVERSION_UPGRADE_V1` | Conversion surfaces (home, get-leads, listings, property, broker preview). |
| `FEATURE_INSTANT_VALUE_V1` | Rich insight tiles (where surfaces support them). |
| `FEATURE_REAL_URGENCY_V1` | Advisory urgency lines on property when upgrade is on. |
| `CONVERSION_ROLLOUT_MODE` | `off` \| `internal` \| `partial` \| `full` — gates who sees conversion features. |
| `CONVERSION_ROLLOUT_PARTIAL_PATHS` | Comma-separated path prefixes (normalized after locale), e.g. `/get-leads,/listings`. |
| `FEATURE_CONVERSION_KILL_SWITCH` | Set `1` or `true` to disable **all** conversion features immediately (server). |
| `NEXT_PUBLIC_FEATURE_CONVERSION_KILL_SWITCH` | Same for client bundles at build time. |
| `NEXT_PUBLIC_CONVERSION_ROLLOUT_MODE` / `NEXT_PUBLIC_CONVERSION_ROLLOUT_PARTIAL_PATHS` | Optional mirrors for client-only reads. |

## Pages to test

1. **Homepage** — Conversion boost section when upgrade is effective; instant-value tiles only when both upgrade + instant value are on.
2. **`/get-leads`** — With upgrade on and instant value off: headline/trust/CTA without empty insight blocks; `recordLeadFormStart` once per tab session; `recordLeadSubmit` only after successful POST.
3. **Listings browse** — Grid CTAs and optional top summary when flags + rollout allow.
4. **Property (`/listings/[id]`)** — Server-built conversion surface; if the builder throws, layout falls back to base listing UI.
5. **Broker preview** — Pipeline / preview card; CTA monitoring event on click.

## Expected behavior

- **Rollout `off`**: No conversion features for anyone (same as kill switch outcome for gating).
- **`internal`**: Only active `ADMIN` / `ACCOUNTANT` users see conversion features (matches admin surface roles).
- **`partial`**: Only paths matching `CONVERSION_ROLLOUT_PARTIAL_PATHS` (after stripping `/{locale}/{country}/`) receive features; empty allowlist turns conversion **off** everywhere (safe default).
- **`full`**: Everyone receives whatever the raw feature flags allow, unless kill switch is on.

## Monitoring expectations

- Dashboard: **`/{locale}/{country}/admin/conversion-monitoring`** (requires admin surface login).
- Counters are **non-persistent (per Node.js process)** — they reset on deploy/restart and are not shared across instances.
- Alerts are heuristic (e.g. submits stuck at zero with engagement); confirm with logs and reproduction before acting.

## Known limitations

- In-process counters are not billing-grade analytics and do not survive restarts.
- Browser-only events (e.g. lead form start dedupe via `sessionStorage`) do not appear on SSR-only paths.
- Partial path matching relies on normalized paths; include both `/foo` style prefixes in `CONVERSION_ROLLOUT_PARTIAL_PATHS`.

## Safe enable sequence (recommended)

1. Confirm `FEATURE_CONVERSION_KILL_SWITCH` is unset or `0` in all environments.
2. Set `CONVERSION_ROLLOUT_MODE=internal` and verify with an admin session on homepage, `/get-leads`, listings, and a listing detail.
3. Switch to `partial` with a narrow allowlist (e.g. `/get-leads` only); smoke-test anonymous traffic on those routes.
4. Expand allowlist or move to `full` when satisfied.
5. If anything misbehaves, flip **`FEATURE_CONVERSION_KILL_SWITCH=1`** first, then investigate.
