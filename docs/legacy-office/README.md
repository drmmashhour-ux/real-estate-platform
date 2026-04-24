# Legacy office module (informational)

Operational map for **multi-entity** structures, editable governance notes, and qualitative continuity/risk themes.

## Disclaimer

**Not legal, tax, or fiduciary advice.** This module does not form entities, interpret statutes, or describe tax consequences. Users must rely on qualified counsel. All fields are **user-edited** placeholders for internal clarity.

## Entity model (`entity.types.ts`)

- **`LegacyOfficeEntity`** — discriminated by `entityType`:
  - `FAMILY_OFFICE`
  - `HOLDING`
  - `OPERATING`
  - `INVESTMENT_VEHICLE`
  - `TRUST_LIKE_INFO` (label only; not a trust instrument)
- Shared fields: `id`, `name`, `parentEntityId`, `jurisdiction`, `ownershipNotes`, `governanceNotes`, optional `informationalParentHeldFraction` (0–1, parent’s modeled stake in the child — **informational**).
- **`TrustLikeControlProfile`** — separate record with `informationalOnly: true` and narrative fields (trustee/beneficiary/amendment **notes only**).

## Ownership graph (`ownership-graph.service.ts`)

- **`buildOwnershipGraph(state)`** — adjacency from `parentEntityId` → children; detects roots (no parent).
- **`getChildren(graph, entityId)`**
- **`getParentChain(graph, entityId)`** — immediate parent first, up to root.
- **`computeEffectiveOwnership(graph, entityId)`** — multiplies `informationalParentHeldFraction` along the chain from the entity toward the root. Returns `null` if any step lacks a valid fraction or if a cycle is detected. **Not** legal beneficial ownership.

## Control rules (`control-rules.service.ts`)

Per-entity, editable text (no enforcement):

- Voting / control
- Reserved matters
- Capital allocation authority
- Succession
- Board / manager roles

Helpers: `resolveControlRules`, `upsertControlRules`.

## Capital buckets (`capital-buckets.service.ts`)

Self-reported **stewardship** sleeves (not accounting or tax classes):

- Operating capital  
- Investment capital  
- Reserve capital  
- Philanthropic capital  
- Family capital  

## Continuity (`continuity.service.ts`)

**`buildContinuitySnapshot`** combines graph shape, governance text heuristics (e.g. “founder”, “key person”), and optional global notes. Outputs are **flags for discussion**, not assessments.

## Risk view (`risk.service.ts`)

**`buildLegacyRiskView`** returns qualitative categories:

- Concentration  
- Governance complexity  
- Cash dependency (from bucket mix heuristics)  
- Operator dependency (from continuity hints)  

Severity labels are **relative and illustrative**.

## Dashboard

- Route: **`/dashboard/legacy-office`** (login required).
- UI: entity tree, edge list, effective-interest panel, per-entity governance + control forms, capital buckets, operating/investment lists, continuity + risk panels.

## Success metric (product)

Founders can see **explicit parent/child relationships**, **editable governance**, **capital sleeves**, and **discussion-only** continuity/risk themes in one place — without the product asserting legal or tax outcomes.
