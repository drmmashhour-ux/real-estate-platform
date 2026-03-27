/**
 * Shared ESLint ignore globs for monorepo packages and apps.
 * Import from app-level eslint.config.mjs alongside Next/service rules.
 */
export const sharedIgnores = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.next/**",
  "**/build/**",
  "**/coverage/**",
  "**/.turbo/**",
  "**/out/**",
];
