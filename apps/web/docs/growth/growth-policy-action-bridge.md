# Growth policy action bridge

The growth policy layer evaluates signals and emits **advisory findings** (`GrowthPolicyResult`). The **action bridge** turns those findings into **operator-facing next steps**: short explanations, resolution hints, and **safe navigation targets** on the Growth dashboard (and broker admin where relevant).

## What it does

1. **`buildGrowthPolicyActions`** maps each finding to a **`GrowthPolicyAction`** with title, rationale, domain, severity, resolution label, deterministic notes (from `buildGrowthPolicyResolution`), and a stable `targetSurface` token (`dashboard:<domain>`).
2. **`buildGrowthPolicyActionBundle`** dedupes by **domain** (keeps the strictest severity), sorts, caps at **8** actions, runs **`selectTopPolicyAction`**, and attaches **`generatedAt`**.
3. **`GET /api/growth/policy`** includes **`actionBundle`** when **`FEATURE_GROWTH_POLICY_ACTIONS_V1`** is enabled (still requires **`FEATURE_GROWTH_POLICY_V1`** for the route).
4. **`GrowthPolicyPanel`** shows the **top next step**, a compact **resolution queue**, per-domain **“What to do”** copy, and **Open / Review** links when **`FEATURE_GROWTH_POLICY_ACTIONS_PANEL_V1`** is also on.

Navigation URLs use `?from=growth-policy&policyId=…` and scroll targets from `POLICY_DOMAIN_SECTION_HASH` (see `growth-policy-navigation.ts`).

## Top action

**`topAction`** is the single best next step among the capped, deduped list. Selection order:

1. **Severity** (critical → warning → info).
2. Among ties: **governance blockers** (governance domain and not `info`) before non-governance items.
3. Then **action type** (`review` preferred over `navigate`, etc.).
4. Then **`policyId`** lexicographically for full determinism.

It does **not** execute anything; it only ranks navigation affordances.

## What the system does **not** do

- No **autonomous execution** (no API posts, jobs, or state mutations from this bridge).
- No changes to **payments, checkout, booking, or pricing** behavior.
- No automatic updates to **leads, brokers, or content** records.
- Clearing a finding still requires operators to fix upstream signals and refresh context — the bridge only **guides** and **routes**.

## Warnings vs critical

- **Critical**: treat as immediate operational risk (capacity, governance posture, pipeline failure modes). Use **Top next step** first.
- **Warning / info**: prioritize when volume is low; still follow links to verify tracking, creative, or routing before scaling spend or traffic.

## Monitoring

Client and server paths log with prefix **`[growth:policy-actions]`** (bundles built, domain→surface mapping, link clicks). Handlers never throw from logging.

## Attribution and evidence (conservative)

- **Links stay explicit** — every destination is a normal URL with `from=growth-policy&policyId=…`; nothing is auto-followed or auto-marked complete.
- **Do not infer causation** — navigation suggestions are **where to work next**, not proof that work there changed metrics.
- **Live findings remain primary** — the policy API response is unchanged by history, trends, or reviews.
- See **`growth-policy-attribution.md`** for the full policy → action → outcome framing.
