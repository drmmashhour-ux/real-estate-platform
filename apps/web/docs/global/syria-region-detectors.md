# Syria region detectors (preview signals)

Read-only Syria intelligence augments the autonomous marketplace **preview** path when `source = "syria"`. No execution, no writes to Syria, and **no Québec compliance rules** apply.

## Signal types

| Signal | Meaning (from explicit observation facts only) |
|--------|-----------------------------------------------|
| `low_conversion_high_views` | `listingViewCount` present in facts, above threshold, with low booking count |
| `low_booking_activity` | Booking count below meaningful threshold |
| `potential_fraud_pattern` | `fraudFlag` true or fraud-marked bookings in stats |
| `listing_stale` | Published listing with `daysSinceListingUpdate` beyond stale threshold |
| `payout_anomaly` | Pending vs paid payout counts or `payoutStateHint` |
| `review_backlog` | Status `PENDING_REVIEW` |
| `inactive_listing` | Non-published terminal/administrative statuses |

Thresholds live in `syria-signal-thresholds.ts` (for example stale days **90**, view floor **50**, payout dominance margin **2**).

## Views and inference

View-based signals fire **only** when `facts.listingViewCount` is supplied by the Syria preview adapter (or tests). The adapter does **not** infer views from other fields.

## Opportunities

At most **five** advisory `SyriaOpportunity` rows are emitted, prioritized by severity then a fixed type order. Suggested actions are human-review oriented strings — **not** executable automation.

## Explainability

`explainSyriaSignals` returns short, deterministic sentences mapped from signal types (no legal claims).

## Policy influence (Syria-only)

`evaluateSyriaPreviewPolicyFromSignals`:

- Any **critical** signal → `requires_local_approval`
- Else any **warning** → `caution_preview`
- Else → `allow_preview`

This is separate from FSBO listing preview policy and Québec routing.

## Dashboard rollup

`syriaSignalRollup` on the marketplace dashboard summarizes **aggregate SQL proxies**, not a sum of every listing-level preview run:

- Severity buckets approximate fraud-flagged listings, pending review (+ optional payout stress unit), and stale published listings (90-day rule aligned with preview).
- See rollup `notes` for interpretation hints.

## Limitations

- Preview remains **DRY_RUN**; Syria has **no execution** path from web.
- Signal counts on the dashboard are regional aggregates — use listing preview for property-level signals.

## Next phase candidates

- Surface explicit view counts in the Syria read adapter when available in `syria_*` tables.
- Typed approval workflow keyed off `requires_local_approval` without enabling automation.
