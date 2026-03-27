# @lecipm/config

Shared **tooling** for the monorepo:

| File | Purpose |
|------|---------|
| `tsconfig.base.json` | Strict baseline for Node-oriented packages |
| `tsconfig.nextapp.json` | Extends base with JSX + bundler resolution for Next apps |
| `eslint.shared.mjs` | Common ignore globs for ESLint flat config |
| `postcss.preset.mjs` | Tailwind v4 PostCSS preset (`@tailwindcss/postcss`) |
| `src/index.ts` | Runtime config helpers (env-shaped object for services) |

**Apps:** `apps/web/tsconfig.json` extends `tsconfig.nextapp.json` and adds path aliases (`@ui/*`, `@api/*`, …).
