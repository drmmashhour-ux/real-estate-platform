# AI Auto-fix (Listing Autopilot)

BNHub hosts can run **optimization runs** on stay listings. The system **detects weak spots**, **generates AI-backed suggestions** (title, description, CTA, photo order, pricing snapshot), and either **queues changes for approval** or **auto-applies low-risk fixes** depending on **autopilot mode** and per-toggle settings.

This complements the [listing quality & health system](./listing-quality-system.md): after text or photo changes, quality scores are recomputed where applicable.

## Autopilot modes (`ListingAutopilotMode`)

| Mode | Behavior |
| ---- | -------- |
| `off` | No automatic runs from autopilot flows; manual API runs may still be invoked where product allows. |
| `assist` | Generate suggestions only; nothing is applied without explicit user action. |
| `safe_autopilot` | Low-risk suggestions that pass validators and toggles may be applied automatically after a run (see below). |
| `approval_required` | Every applicable suggestion is queued; nothing is auto-applied from the run pipeline. |

Per-host settings live in `listing_autopilot_settings` (`ListingAutopilotSetting`): toggles for titles, descriptions, photo reorder, content generation, and whether **price suggestions** are allowed (suggestions only — never auto-applied to live price).

## Risk levels (`OptimizationRiskLevel`)

| Level | Typical fields | Auto-apply in `safe_autopilot` |
| ----- | ---------------- | ------------------------------ |
| `low` | Title, description, CTA, photo order, generated copy grounded in listing data | Yes, when toggles allow and validators pass |
| `medium` | Reserved for future use | Not auto-applied in MVP unless explicitly promoted by product rules |
| `high` | Pricing suggestions, policy/legal wording, unsupported factual claims | Never auto-applied |

**Pricing (MVP):** suggestions are **high risk**. Approving a price suggestion records audit intent (e.g. acknowledged / not applied to `nightPriceCents`) — live price is not changed by autopilot in MVP.

## Auto-apply rules

Auto-apply runs only when:

1. Mode is `safe_autopilot` (not `approval_required`, `assist`, or `off` for the auto-apply path).
2. The suggestion is **low risk** and **`autoApplyAllowed`** is true after generation.
3. The field is **not** blocked by validators (e.g. legal/compliance-only edits are not auto-applied).
4. Host toggles (`autoFixTitles`, `autoFixDescriptions`, etc.) permit that category.

**Never auto-applied:** price changes, policy/legal copy, invented amenities or claims, anything not grounded in existing listing data per generator rules.

## Issue detection

Runs attach a short **summary** of detected issues using existing signals where available: quality score, content depth, CTR/conversion metrics, photo count/order, missing fields, trust/reputation hints, and peer pricing heuristics (for messaging — not as a forced price change).

## Audit trail (`ListingOptimizationAudit`)

Each meaningful action writes a row with:

- `listingId`, optional `suggestionId`
- `action` (e.g. apply, reject, price acknowledgment)
- `oldValue` / `newValue` where applicable
- `performedByUserId` when a human triggers approve/reject/apply

This supports traceability; **reversibility** is operational (restore from audit + listing history), not a dedicated undo stack in MVP.

## APIs (App Router)

- `POST /api/autopilot/listings/[listingId]/run` — run optimization for a listing
- `GET /api/autopilot/listings/[listingId]/suggestions` — list suggestions for a listing
- `POST /api/autopilot/listings/[listingId]/apply-safe` — apply pending safe fixes (respects mode/toggles)
- `POST /api/autopilot/suggestions/[suggestionId]/approve` — approve (applies when low-risk; price = acknowledge only)
- `POST /api/autopilot/suggestions/[suggestionId]/reject`
- `GET` / `POST /api/autopilot/settings` — host autopilot settings

**Authorization:** listing owner (host/broker context) or **admin**; admins can inspect across listings where implemented.

## UI

- Host: `/dashboard/autopilot` — overview, pending items, settings
- Listing: `/dashboard/listings/[id]/quality` — suggestions panel, approve/reject, apply safe fixes, before/after where shown
- Admin: `/admin/autopilot` — aggregate runs, applied fixes, pending high-risk-style items, repeat-flagged listings

## Score feedback loop

After fields that affect scoring are updated, **listing quality** is recomputed (`updateListingQuality` / scheduled recompute) so hosts can see before/after impact alongside ranking-related inputs already wired from quality scores.

## Safety boundaries

- Generators must **not invent facts** or amenities; rewrites stay tied to supplied listing context.
- **No unsupported legal claims** in auto-applied copy.
- **Pricing** remains suggestion + approval/audit only for MVP.

## Future extensions

- Undo from audit snapshots per field
- Medium-risk fields with stricter confidence thresholds
- Deeper integration with moderation and fraud review before auto-apply
- A/B testing titles/descriptions with measured CTR lift

## Migration

Apply migration containing `listing_optimization_*` and `listing_autopilot_settings` (see `prisma/migrations` for the listing optimization autopilot migration name).
