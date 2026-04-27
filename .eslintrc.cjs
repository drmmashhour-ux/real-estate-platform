/**
 * ESLint 9+ uses the flat config file `eslint.config.mjs` at the repo root.
 * Cross-app import rules are implemented in `rules/eslint/monorepo-isolation-plugin.mjs`
 * and applied per app in `apps/web`, `apps/syria`, and `apps/hadialink` via `eslint.config.mjs`.
 *
 * CI / pre-commit: `pnpm run check:isolation`
 */
module.exports = {
  root: true,
  ignorePatterns: ["**/*"],
};
