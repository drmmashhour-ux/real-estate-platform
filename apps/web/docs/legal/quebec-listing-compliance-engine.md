# Québec listing compliance engine (Phase 8)

This layer provides a **deterministic platform checklist** for Canadian / Québec FSBO flows. It **does not** certify statutory legality outside the platform or replace professional advice.

## What it checks

- Core listing facts (address, price, property type, moderation posture).
- Ownership and identity pathways aligned with structured records and uploads.
- Broker-managed inventory identifiers when the listing is broker-owned.
- Rental / short‑term pathways where deal type or declaration implies those modes.
- Operational compliance markers surfaced by legal intelligence and deterministic fraud/rule extracts.

## What it does **not** certify

- Criminal or administrative “legality” labels.
- Absolute regulatory conclusions about off‑platform conduct.

Platform‑safe wording uses: *verification required*, *missing requirement*, *non‑compliant for publish requirements*, *needs review*. Admin tooling may reference **blocked by Québec compliance policy** where appropriate.

## Hard blocks at publish

When publish gates are enabled, Stripe checkout activation and unpaid dev activation both consult the same deterministic gate helpers. **`COMPLIANCE_BLOCK`** responses include readiness and legal‑risk indexes without exposing raw documents.

See `FEATURE_QUEBEC_COMPLIANCE_V1`, `FEATURE_QUEBEC_LISTING_COMPLIANCE_V1`, `FEATURE_COMPLIANCE_AUTO_BLOCK_V1`, `FEATURE_LISTING_PREPUBLISH_AUTO_BLOCK_V1`.
