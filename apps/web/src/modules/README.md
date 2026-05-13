# Feature module boundary

`apps/web/src/modules` contains feature-module UI, newer vertical modules, and orchestration code that has not yet migrated to the canonical `@/modules/*` domain tree.

- Keep client UI isolated under `ui` or `components` folders.
- Keep server integrations in `infrastructure` and route them through API handlers or server actions.
- Do not import admin-only code into public surfaces.
- Keep barrels narrow; avoid exporting entire feature trees by default.

TODO(src-modules): inventory every public import and migrate stable server/domain code to `apps/web/modules` incrementally.
