# AI / template content engine

## Location

- Domain types & policies: `apps/web/lib/content/`
- Generators: `apps/web/lib/content/generators/`
- Growth helpers: `apps/web/lib/growth/`
- Persistence: Prisma `LecipmGeneratedContent` + `LecipmGeneratedContentAuditLog`

## Generation modes

| Mode | When |
|------|------|
| `generate_native` | No approved English source; target locale is primary |
| `translate_from_source` | Approved English exists and target locale ≠ `en` |
| `hybrid_localize` | Cultural / market adaptation (e.g. Syria profile) |

Resolver: `resolveCreationMode` in `lib/content/creation-mode.ts`.

## Locales

- `en` default, `fr` LTR (Canadian French copy in bundles), `ar` RTL in UI.
- Prompt / constraint strings use `translateServer` / `t()` from `contentEngine.*` keys in `apps/web/locales/{en,fr,ar}.json`.

## Syria / contact-first

- `buildMarketConstraintAppendix` injects contact-first rules when `ResolvedMarket.contactFirstEmphasis` or manual payment emphasis is on.
- Generators append this appendix; they do **not** imply instant payment or automated rails.

## Safety

- High-risk surfaces (`notification`, `email_campaign`, `market_banner`, `faq_answer`, listing surfaces) default to review-oriented statuses.
- Publishing AI/hybrid rows is gated by `ENABLE_AI_CONTENT_PUBLISH=1` (`launchFlags.enableAiContentPublish`).
- `publishApprovedContent` only transitions `approved` → `published` and writes an audit snapshot for rollback.

## Admin UI

- `/admin/content` — filter, approve/reject, publish, rollback (template demo row).
- `/admin/launch-ops` — market snapshot + queue counts + launch flags.

## Migration

After pulling schema changes:

```bash
cd apps/web && pnpm exec prisma migrate dev --name lecipm_generated_content
```
