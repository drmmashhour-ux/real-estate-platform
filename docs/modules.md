# Modules index

## Web application modules

Primary location: **`apps/web/modules/`**

Use this when adding domain logic. Prefer a **new** `*.service.ts` under the closest domain folder over scattering helpers in `app/`.

### Inventory (non-exhaustive)

Run `ls apps/web/modules` locally — the set evolves. Common areas include:

- `daily-action-center/`, `push-system/`, `mobile-approvals/` — broker mobile v1
- `growth-engine-audit/` — structured audit events
- `investor-narrative/`, `pitch-content/`, `founder-export/` — founder/investor tooling
- `pricing/`, `monetization/` — revenue and plans
- `launch-simulation/` — revenue simulation

## Platform registry

See **[architecture/MODULES-REGISTRY.md](architecture/MODULES-REGISTRY.md)** for cross-repo services (`services/*`) and app boundaries.

## Rule of thumb

If it touches money, legal execution, or PII, it must be **server-side**, **audited**, and behind **flags** when rolling out.
