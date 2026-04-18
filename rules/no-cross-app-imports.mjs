/**
 * Canonical entry for the custom ESLint rule set used by country apps + shared packages.
 * Implementation: ./eslint/monorepo-isolation-plugin.mjs (rule id: monorepo-isolation/no-cross-app-imports).
 */
export { default } from "./eslint/monorepo-isolation-plugin.mjs";
export { isCrossAppImport, ISOLATION_ESLINT_MESSAGE } from "./eslint/monorepo-isolation-plugin.mjs";
