# Syria region preview and stable listing identity

## Why stable region listing keys exist

LECIPM serves multiple regional data stores under one `apps/web` deployment. Listing IDs can collide across namespaces (for example the same opaque id string in web CRM `Listing` and Syria `syria_*` properties). A **bare `listingId` string is therefore ambiguous** unless paired with an explicit **source** or a **stable region listing key**.

Region listing keys remove ambiguity for admin intelligence, preview pipelines, and dashboards without merging Prisma schemas or writing cross-region data.

## Wire format

Canonical string (deterministic):

```text
{regionCode}:{source}:{listingId}
```

Examples:

- `ca_qc:web:clxxxxxxxx` — main web CRM listing (Québec routing tag).
- `sy:syria:clxxxxxxxx` — Syria regional marketplace row (`syria_*` tables).

Rules:

- `source` is one of `web`, `syria`, `external`.
- `listingId` must not contain `:` (CUIDs satisfy this).

Parsing never throws; invalid strings yield a null key and a machine-readable fallback note.

## Syria preview (read-only)

When `FEATURE_SYRIA_PREVIEW_V1` and `FEATURE_SYRIA_REGION_ADAPTER_V1` are enabled, the autonomous marketplace **preview** path can load Syria rows through `syria-preview-adapter.service.ts`:

- Builds an `ObservationSnapshot` with target type `syria_listing`.
- Runs the preview detector registry (FSBO-oriented detectors typically yield **no opportunities** for non-FSBO targets — this is expected; availability notes explain the gap).
- Evaluates listing preview policy in **DRY_RUN** only.
- Surfaces **capability notes** from `syria-region-capabilities.service.ts`.

**No execution:** Syria does not use controlled execution, governance execution, or Québec compliance engines in this phase. Metadata includes `execution_unavailable_for_syria_region`.

## Region capability notes

`syria-region-capabilities.service.ts` exposes deterministic booleans:

- Preview: supported (read-only).
- Autonomy / controlled execution / Québec compliance: **off** for Syria from web.
- Trust overlay: **limited summary** only (aggregate fraud / booking markers — never raw consumer-facing fraud labels outside approved surfaces).

These notes are merged into unified intelligence (Syria branch) and dashboard summaries where relevant.

## Future path: Syria-side autonomy

Future phases may introduce a Syria-local execution boundary (policies, approvals, and eventual Syria-owned writers) **without** merging schemas into web Prisma. Until then, `apps/web` remains read-only against Syria tables and preview remains **DRY_RUN** only.

## Preview detectors and signals

Listing-level Syria signals, opportunities, and signal-driven policy hints are documented in [`syria-region-detectors.md`](./syria-region-detectors.md).
