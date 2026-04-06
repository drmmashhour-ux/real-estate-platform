# AI content engine

## Location

Application code under `apps/web/lib/content/` (generated content models, review workflow helpers, and admin-facing flows).

## Rules

- Content has **locale** (`en` | `fr` | `ar`) and **status** (`draft` | `approved` | `published`).
- **Never auto-publish**: publishing requires an explicit human review step in the admin pipeline.
- SEO and multilingual notes: [docs/content/MULTILINGUAL-SEO.md](./content/MULTILINGUAL-SEO.md), [docs/content/REVIEW-AND-PUBLISHING.md](./content/REVIEW-AND-PUBLISHING.md).

## AI locale

Orchestration and managed chat pass a **UI locale** into prompts; system hints steer French/Arabic/English output. See `apps/web/lib/i18n/ai-response-locale.ts` and AI routes under `apps/web/app/api/ai/`.
