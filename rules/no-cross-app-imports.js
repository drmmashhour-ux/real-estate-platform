/**
 * LEGACY DISCOVERY PATH — the real ESLint rule is implemented as ESM:
 *
 *   `rules/eslint/monorepo-isolation-plugin.mjs`
 *
 * Rule ID (flat config): `monorepo-isolation/no-cross-app-imports`
 *
 * Per-app configs enable it with:
 *   - apps/syria:  `{ mode: "syria" }`  — blocks apps/web, apps/uae, @lecipm/web, @lecipm/uae
 *   - apps/web:    `{ mode: "web" }`    — blocks apps/syria, apps/uae, @lecipm/syria, @lecipm/uae
 *   - apps/uae:    `{ mode: "uae" }`   — blocks apps/web, apps/syria
 *   - packages:    `{ mode: "package" }` — blocks any `apps/*` import
 *
 * Violations are **error** severity. Message prefix is imported from `rules/isolation-constants.mjs`.
 *
 * This CommonJS stub remains so grep/docs pointing at `rules/no-cross-app-imports.js` still resolve.
 */

module.exports = {};
