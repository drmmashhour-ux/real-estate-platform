# End-to-end (Playwright)

Playwright config: `apps/web/playwright.config.cjs`.

For **LECIPM Full System Validation v1** (deterministic DB + HTTP tunnels + JSON report), use:

```bash
pnpm --filter @lecipm/web run validate:lecipm-system
```

With the Next.js dev server running, set `VALIDATION_BASE_URL` (e.g. `http://127.0.0.1:3001`) so HTTP security and mobile tunnels exercise real routes.
