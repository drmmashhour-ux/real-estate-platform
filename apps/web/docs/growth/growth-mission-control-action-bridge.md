# Growth Mission Control — Action Bridge

Mission Control remains the **top-level advisory surface**. The **action bridge** adds deterministic **navigation hints** so operators move from summary to the right dashboard section or admin screen—**never auto-execution**.

## What Mission Control does now

- Builds the usual **status, mission focus, checklist, risks, reviews, governance domains, notes** (unchanged orchestration).
- Computes a **`MissionControlActionBundle`**: **one optional top action** plus **up to five additional actions**, each with **rationale**, **what to verify**, and **what “done” roughly means**.
- URLs include safe query markers such as `from=mission-control` and `reason=…` for observability only.

## How actions are mapped (`buildMissionControlActionBundle`)

Implementation: `modules/growth/growth-mission-control-action.service.ts` plus ranking in `growth-mission-control-top-action.service.ts`.

1. **Collect** candidates from the summary (frozen/blocked domains, mission focus, top risks, human review queue, simulation/strategy lines, checklist keyword heuristics, deterministic note patterns, weak-status executive nudge).
2. **Rank** by priority (high → low) and source weight (focus → risk → …), then **dedupe by `navTarget`** so the operator does not see duplicate destinations.
3. **Split**: first ranked item → **`topAction`**; next up to **five** → **`actionItems`** (no duplicate of top).

Rules are **deterministic** (same summary → same bundle).

## What it does **not** do

- No autonomous execution, no writes, no approvals, no Stripe/campaign mutations.
- No modification of upstream growth builders or fusion/governance cores—only reads the published **summary** JSON shape.
- Query params and **prefillData** are **strings only** (safe hints); panels remain authoritative.

## Operator workflow

1. Read **Mission Control** for posture and narrative (focus, risks, reviews).
2. Use **Top operator action** first: one high-urgency, clear destination aligned with posture.
3. Use **Next actions** for parallel tracks (still max five).
4. Click **Go** / **Open admin** → lands on **`/dashboard/growth#…`** or **`/admin/broker-team`** with `from=mission-control`; **nothing runs** until the operator acts in that UI.
5. Cross-check **Today / Top risks / Human review** lists in the panel—they explain *why* items exist; the bridge explains *where* to look next.

### Top action vs checklist vs risks vs review

| Source | Role |
|--------|------|
| **Top action** | Single best **next navigation** step after dedupe and urgency ranking. |
| **Today checklist** | Narrative operational lines; bridge may map the **first** line to a panel by keyword. |
| **Top risks** | Severity-tagged signals; mapped by **severity + keyword + risk.source** string heuristics. |
| **Human review** | Queue items routed to governance console, fusion, learning, or policy enforcement surfaces by `source`. |

## Monitoring

Prefix: **`[growth:mission-control]`**.

Counts (see `growth-mission-control-monitoring.service.ts`): bundles built, actions emitted, top actions, **click counts**, and clicks **by nav target**. Click telemetry is fired from the panel client via `POST /api/growth/mission-control/action-click` (auth-gated like the summary API).

## Tests

Vitest coverage in `modules/growth/__tests__/growth-mission-control-action-bridge.test.ts` for deterministic mapping, bounds, dedupe, and navigation URL safety.
