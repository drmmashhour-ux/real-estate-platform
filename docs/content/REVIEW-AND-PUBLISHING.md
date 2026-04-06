# Review and publishing lifecycle

## States

`draft` → `pending_review` → `approved` → `published`  
Side path: `pending_review` → `rejected` → `draft`

## APIs (server)

- `transitionContentStatus` — draft/review/approve/reject (not publish).
- `publishApprovedContent` — only from `approved`; sets `publishedAt` / `publishedByUserId`; logs audit `publish` with snapshot.
- `rollbackLastPublish` — `published` → `approved`, restores fields from last publish snapshot when present.

## Audit log

`LecipmGeneratedContentAuditLog` stores `action`, `fromStatus`, `toStatus`, optional `snapshot` and `payload`.

## Host listing fields

Host overwrite policies (`append_suggestion`, `replace_ai_field_only`, `manual_review_required`) are stored on the row; **apply** to `ShortTermListing` (or other targets) in a dedicated sync job—never silently overwrite manual host edits unless policy + explicit consent.

## Kill switch

Set `ENABLE_AI_CONTENT_PUBLISH` unset/false to block publishing rows whose `generationSource` is `ai` or `hybrid` (template-only rows can still publish when approved).
