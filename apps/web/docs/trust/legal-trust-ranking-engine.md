# Legal + trust ranking engine

LECIPM blends **trust posture** with **publish readiness / legal‑risk indexes** into a **bounded multiplier** for marketplace ordering experiments. Defaults keep legacy ordering unless `FEATURE_LEGAL_TRUST_RANKING_V1` is enabled.

## Behaviour

- **Restricted exposure** when prepublish gates would block unpublished inventory.
- **Mild boosts** only when readiness is strong, legal friction is low, and trust indicators are favourable — caps prevent runaway boosting.
- **Strong dampening** when legal‑risk indexes cross elevated / high thresholds.

Multiplier outputs are surfaced in previews and admin APIs for debugging — no raw document payloads are returned.
