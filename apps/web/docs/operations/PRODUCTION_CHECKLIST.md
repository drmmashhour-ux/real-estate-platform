# Production checklist

Before each major release:

- [ ] Migrations reviewed and tested on a staging copy.
- [ ] Environment variables documented and set in the hosting provider.
- [ ] Feature flags default to safe values for production.
- [ ] Stripe webhooks and signing secrets verified.
- [ ] Rate limits and CORS settings appropriate for public API routes.
- [ ] Smoke tests pass (`pnpm test` / `npm test` in `apps/web`).
- [ ] Rollback plan: previous image tag and DB migration down strategy (if applicable).
