# Shared packages — approved generic layer

Country products live under `apps/web` (LECIPM Canada), `apps/syria` (Darlink), `apps/uae` (UAE), and future `apps/*`. **Business rules stay in the app.** These packages are for **generic** reuse only.

**Allowed here:** generic UI, generic utils, generic types, generic non-business infrastructure.

**Not allowed here:** pricing rules, marketplace monetization, broker acquisition, payment/business flows, country compliance, country-specific dashboards or copy.

**If unsure → keep code in the country app.** Prefer duplication over cross-country coupling.

## Mapping (target architecture ↔ repo)

| Intended shared layer | Package in this repo |
|-----------------------|----------------------|
| Generic UI primitives | `packages/ui`, `packages/ui-components` |
| Generic utilities | `packages/utils`, `packages/shared-utils` |
| Generic types | `packages/types` |
| Generic config helpers | `packages/config` (TS bases only — not market rules) |
| API client shells | `packages/api-client`, `packages/api` |

## Hard rules

- No Quebec/OACIQ/broker licensing logic, no Syria marketplace rules, no UAE payment rails — unless you are clearly in an **app** package.
- Packages **must not** import `apps/web`, `apps/syria`, `apps/uae`, or `@lecipm/web` / `@lecipm/syria` / `@lecipm/uae` (enforced by ESLint `mode: "package"` and `pnpm check:isolation`).

## Adding code here

Before moving code from an app into `packages/*`, ask: “If we launch another country tomorrow, would this code still make sense unchanged?” If not, keep it in the country app.

See `docs/architecture/multi-country-scaling.md`.
