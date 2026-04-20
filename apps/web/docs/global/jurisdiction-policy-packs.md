# Jurisdiction policy packs

## Purpose

Encode **which engines apply** in a region (Québec checklist, trust ranking, fraud rules) without running unsupported logic.

## Registry

`apps/web/modules/legal/jurisdiction/jurisdiction-policy-pack-registry.ts` maps `PlatformRegionCode` → `JurisdictionPolicyPack`.

## Behaviour

- **Québec (`ca_qc`)**: Full checklist + trust + fraud + ranking flags enabled in pack metadata; actual evaluation still respects feature flags.
- **Syria (`sy`)**: Checklist disabled (Québec civil stack not applicable); trust/fraud subsets can be enabled as products mature.

Callers must treat packs as **availability metadata** — unsupported regions yield notes, not hard errors.
