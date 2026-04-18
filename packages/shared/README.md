# Shared packages (optional layer)

See [`packages/README.md`](../README.md) for the mapping of repo packages to the shared-layer model.

Use `packages/*` **only** for:

- Pure utilities (dates, formatting, generic TS helpers)
- Types that are truly cross-cutting and jurisdiction-agnostic

Do **not** place:

- Syria/Darlink-specific listing or payment rules
- Canada/LECIPM broker or Stripe-specific flows

Those belong exclusively in `apps/syria` or `apps/web` respectively.
