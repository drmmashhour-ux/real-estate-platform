/**
 * Single source of truth for operator-facing isolation errors (ESLint + scan scripts).
 * Imported by `rules/eslint/monorepo-isolation-plugin.mjs`.
 *
 * TypeScript scanners import the same string from this file via `import ... from "../rules/isolation-constants.mjs"`.
 */

export const ISOLATION_BOUNDARY_VIOLATION =
  "❌ Cross-app import detected: This breaks Darlink/LECIPM isolation";
