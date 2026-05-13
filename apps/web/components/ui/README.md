# Design-system boundary

`components/ui` contains local, mature UI primitives used by the web app.

- Keep primitives free of Prisma, route handlers, feature flags, and domain copy.
- Use `index.ts` only for stable, reusable primitives.
- Prefer colocated route components for feature-specific UI.
- Do not move primitives to `packages/ui` until their props and consumers are stable.

TODO(design-system): add visual coverage before broad primitive migrations.
