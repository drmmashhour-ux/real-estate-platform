/**
 * CUSTOM ESLINT RULE — monorepo isolation (country apps must remain isolated).
 *
 * ESLint 9 flat config imports the plugin from:
 * - `rules/eslint/monorepo-isolation-plugin.mjs` (implementation)
 * - `rules/no-cross-app-imports.mjs` (ESM re-export)
 *
 * Rule id: `monorepo-isolation/no-cross-app-imports`
 *
 * This `.js` file exists for discovery by tooling that expects a `rules/no-cross-app-imports.js` path.
 */

module.exports = {};
