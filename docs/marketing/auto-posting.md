# Marketing auto-posting & publish pipeline

Controlled, **server-only** publishing for AI marketing content. Nothing posts from the browser; provider keys stay in `apps/web` environment variables.

## Lifecycle statuses

| Status | Meaning |
|--------|---------|
| `DRAFT` | Editable; not eligible to schedule or publish |
| `APPROVED` | Ready to set channel, dry-run flag, schedule, or **Publish now** |
| `SCHEDULED` | `scheduled_at` set; due rows can be executed |
| `PUBLISHING` | Claimed by a publish run (short-lived) |
| `PUBLISHED` | Live send succeeded (email) or marked complete |
| `FAILED` | Last attempt failed — see publish job `errorMessage` |

Scheduling requires **APPROVED** or **SCHEDULED** (reschedule).

## Dry-run vs live

- **`publishDryRun` on content** (default `true`): safe default. Cron **skips** these rows.
- **Per-request `dryRun`** on `POST /api/marketing/publish`: overrides for a single run.
- **Social adapters** (X, LinkedIn, Instagram, TikTok): **stub / dry-run only** unless `MARKETING_SOCIAL_LIVE_SEND=1` *and* a real API client exists (not shipped yet; requests are blocked with a clear error if “live” is attempted without implementation).
- **Email**: uses existing **Resend** helper. Live sends require `RESEND_API_KEY`, `EMAIL_FROM`, **`MARKETING_EMAIL_LIVE_SEND=1`**, and recipients from **`MARKETING_EMAIL_TO`** (comma-separated) or the notification email fallback.

## APIs (admin session / `requireAdminSurfaceApi`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/marketing/publish` | Body: `{ contentId, channel?, dryRun? }` — immediate publish |
| POST | `/api/marketing/run-scheduled` | Body: `{ limit?, cronLiveOnly? }` — process due `SCHEDULED` rows |
| GET | `/api/marketing/publish-logs?contentId=` | Audit history |
| PATCH | `/api/marketing/content/[id]` | `publishChannel`, `publishTargetId`, `publishDryRun`, statuses |

## Cron (Vercel)

- **`GET/POST /api/cron/marketing-publish-due`** — `Authorization: Bearer $CRON_SECRET`
- Processes only **`publishDryRun = false`** (live-intent) due items.
- Configured in `apps/web/vercel.json` (every 15 minutes).

## Audit model

`marketing_publish_jobs`: channel, terminal status (`SUCCESS` | `FAILED` | `DRY_RUN`), timestamps, optional `external_post_id`, safe `response_summary` / `error_message`.

## Analytics (next)

Publish logs store `externalPostId` and `responseSummary` for future ingestion into `marketing_metrics` or external APIs (TODO hooks in `lib/marketing-publish/publish-content.ts`).

## Manual validation checklist

1. Approve a draft, set channel + dry-run defaults in `/admin/marketing` detail modal.
2. **Publish now** with “Force dry-run” checked → job `DRY_RUN`, content stays approved/scheduled as designed.
3. Uncheck content dry-run, set `MARKETING_EMAIL_LIVE_SEND=1` and recipients → optional real test send.
4. **Run due scheduled publishes** from UI (includes dry-run scheduled items).
5. Confirm cron path only picks live-intent rows.
