# AI marketing engine (BNHub / LECIPM)

Internal **admin-only** tool for drafting social copy, captions, emails, and growth ideas. All LLM calls run **only on the server** (`OPENAI_API_KEY` in `apps/web` — never sent to the browser).

## Content lifecycle

1. **Generate** — `POST /api/ai/social-post` | `/api/ai/caption` | `/api/ai/email` | `/api/ai/growth-ideas`
2. **Draft** — optional persistence when `saveDraft: true` or `save: true` → row in `marketing_content` with `status = DRAFT`
3. **Approved** — `PATCH /api/marketing/content/[id]` with `{ "status": "APPROVED" }`
4. **Scheduled** — **`POST /api/marketing/schedule`** with `{ "contentId", "scheduledAt" }` (ISO string) → `status = SCHEDULED`, `scheduled_at` set (content must already be **APPROVED** or **SCHEDULED**).  
   - Legacy: `POST /api/ai/schedule` delegates to the same handler (prefer `/api/marketing/schedule`).
5. **Publishing** — `POST /api/marketing/publish` (admin) runs the provider pipeline; content moves through `PUBLISHING` briefly, then **`PUBLISHED`** (live success) or back to **APPROVED** / **`SCHEDULED`** after a **dry-run**, or **`FAILED`** on error.  
6. **Due scheduler** — `POST /api/marketing/run-scheduled` (admin) or **`/api/cron/marketing-publish-due`** (Bearer `CRON_SECRET`) processes past-due `SCHEDULED` rows. Cron only picks rows with **`publishDryRun=false`** (live-intent).

Full publish semantics, env gates, and audit fields: **[auto-posting.md](./auto-posting.md)**.

**Manual “Mark published”** — `PATCH` with `{ "status": "PUBLISHED" }` remains available for workflows outside the pipeline.

**Clear a mistaken schedule time** — `PATCH /api/marketing/content/[id]` with `{ "clearScheduledAt": true }` (does not set a new time; use the schedule endpoint for that).

**Metrics** — `POST /api/marketing/track` appends rows to `marketing_metrics` (append-only snapshots). Payload must include **at least one** of: `views`, `clicks`, `conversions`, or non-empty `notes`.

## API response shapes

### Success

- Generation routes return `{ ok: true, source: "openai" | "fallback", contentId: string | null, ... }`.  
  - `contentId` is `null` when the draft was not saved.  
  - Extra fields: `text` (social, caption), `subject` / `body` / `cta` (email), `ideas` + `text` (growth).

### Errors

All marketing-related routes use:

```json
{ "ok": false, "error": "Human-readable message", "code": "OPTIONAL_MACHINE_CODE" }
```

Examples: `INVALID_JSON`, `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `INTERNAL`.

Invalid or empty JSON bodies are handled without crashing.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ai/social-post` | Generate social post |
| POST | `/api/ai/caption` | Generate caption |
| POST | `/api/ai/email` | Generate email |
| POST | `/api/ai/growth-ideas` | Generate growth ideas |
| POST | `/api/marketing/schedule` | Set scheduled time + `SCHEDULED` |
| GET | `/api/marketing/content` | List (`type`, `status` query params) |
| GET | `/api/marketing/content/[id]` | Single row + metric history |
| PATCH | `/api/marketing/content/[id]` | Update status, copy, email fields, `clearScheduledAt` |
| POST | `/api/marketing/track` | Append metric snapshot |
| POST | `/api/marketing/publish` | Execute publish pipeline (dry-run or live email when configured) |
| POST | `/api/marketing/run-scheduled` | Run due scheduled publishes (admin) |
| GET | `/api/marketing/publish-logs?contentId=` | Publish job audit log |

Guards: same **admin surface** as other `/admin` tooling (`requireAdminSurfaceApi` — platform admin surface). Cron routes use `CRON_SECRET`.

## Schema (Prisma)

- **`MarketingContent`** — as before, plus `publishChannel`, `publishTargetId`, `publishDryRun` (default `true`), statuses `PUBLISHING` / `FAILED`.
- **`MarketingMetric`** — FK `contentId`, optional `views` / `clicks` / `conversions`, optional `notes`, `createdAt` (append-only usage).
- **`MarketingPublishJob`** — audit log per publish attempt (channel, terminal status, dry-run flag, safe summaries).

## Limitations (current)

- **Social “live”** — adapters are stubs until OAuth; enabling `MARKETING_SOCIAL_LIVE_SEND` without a real client returns a controlled error.
- **Email** — internal / test-style sends via Resend when explicitly enabled; not a bulk consumer mailer.
- **Legacy hooks** — `lib/ai-marketing/future-automation-hooks.ts` remains for broader automation experiments.
- **No external analytics ingestion** — metrics are manual API posts or future sync jobs; publish logs hold `externalPostId` for future use.

## How to test manually

1. Sign in as an admin user and open `/admin/marketing`.
2. Generate content (any channel); optionally enable save draft.
3. Confirm the row appears in the list; open the detail modal and copy text.
4. Approve → set publish channel → schedule (date/time) → confirm status and `scheduledAt`.
5. Use **Publish now** (dry-run) and inspect publish log rows; optional **Run due scheduled publishes**.
6. `POST /api/marketing/track` with `contentId` and at least one metric or `notes`.
7. Mark **Published** manually if you skip the pipeline.

## Analytics & A/B (internal)

- **Aggregation** — sums `marketing_metrics` per content; CTR, conversion rate, optional **open rate** (opens ÷ views when you log both).
- **APIs** — `GET /api/marketing/analytics/content/[id]`, `GET /api/marketing/analytics/top`, `GET /api/marketing/analytics/variants/[parentId]` (admin).
- **Variants** — `variantCount` 1–3 on generate endpoints; parent row = variant A, linked rows B/C. `POST /api/marketing/variants/winner` marks the winning row.
- **Prompts** — generation merges manual feedback with **DB-derived hints** (top themes/snippets, weak-theme warning) unless `skipAnalyticsHints: true`.

## Automated tests (no external services)

Vitest mocks OpenAI and DB service layer where needed:

- `app/api/ai/social-post/route.test.ts`
- `app/api/ai/caption-email-growth.test.ts` (caption, email, growth-ideas)
- `app/api/marketing/content/route.test.ts`
- `app/api/marketing/content-item-route.test.ts`
- `app/api/marketing/schedule/route.test.ts`
- `app/api/marketing/track/route.test.ts`
- `app/api/marketing/publish/route.test.ts`
- `lib/marketing-publish/__tests__/email-provider.test.ts`
- `lib/ai-marketing/__tests__/*`

Run from `apps/web`:

```bash
pnpm exec vitest run app/api/marketing app/api/ai lib/ai-marketing
```

## Next steps (product)

1. **Auto-posting system** — OAuth, approval gate, worker calling publish hooks.  
2. **Analytics engine** — import platform stats; rollups; feed `pastPerformance` / `bestThemes` from data.  
3. **Email sending system** — transactional/campaign provider wired to stored email fields.
