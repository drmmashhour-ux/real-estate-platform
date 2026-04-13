# BNHub social integrations (content automation)

This document describes how generated BNHub content is published or scheduled using **official APIs only** (Meta Graph, TikTok Content Posting where enabled) and **third-party schedulers** (Metricool, Buffer). There is **no** scraping or unofficial posting.

## Supported paths

| Target | Mechanism |
|--------|-----------|
| **Instagram** (Business) | Meta Graph [Content Publishing API](https://developers.facebook.com/docs/instagram-api/guides/content-publishing): create media container → poll `status_code` → `media_publish`. |
| **Facebook Page** | Meta Graph `/{page-id}/videos` with `file_url` and page access token from `/me/accounts`. |
| **TikTok** | Direct Content Posting API requires an audited app and user OAuth. In this codebase, TikTok is routed through **Buffer** or **Metricool** (scheduler APIs) or **manual** copy/paste in the TikTok app. |
| **Scheduler** | `scheduleForExternalPlatforms` in `lib/integrations/scheduler/post.ts`: prefers Buffer when credentials exist, else Metricool. |

## Environment variables

**Meta (Instagram + Facebook OAuth)**

- `META_APP_ID`, `META_APP_SECRET`
- `META_OAUTH_REDIRECT_URI` — must match the callback URL registered in the Meta app (e.g. `https://your-domain.com/api/social/meta/callback`).
- Optional: `META_GRAPH_API_VERSION` (default `v21.0`).
- `OAUTH_STATE_SECRET` — HMAC secret for OAuth `state` (falls back to `META_APP_SECRET` if unset).

**Fallback env publishing (no DB connection)**

- `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID` — long-lived user token + IG user id (legacy/dev).

**Encryption at rest**

- `GROWTH_TOKEN_ENCRYPTION_KEY` (64 hex chars) or `GROWTH_TOKEN_ENCRYPTION_SECRET` — used by `encryptGrowthSecret` for `SocialAccount` tokens.

**Buffer**

- OAuth: `BUFFER_CLIENT_ID`, `BUFFER_CLIENT_SECRET`, `BUFFER_OAUTH_REDIRECT_URI` (e.g. `https://your-domain.com/api/social/buffer/callback`).
- Server-wide fallback: `BUFFER_ACCESS_TOKEN`, `BUFFER_PROFILE_IDS` (comma-separated profile ids from Buffer `/profiles`).

**Metricool**

- `METRICOOL_API_TOKEN`, `METRICOOL_BLOG_ID`
- Optional: `METRICOOL_API_BASE_URL` if your workspace uses a different scheduler endpoint.

**Routing**

- `SCHEDULER_PROVIDER` — `auto` (default), `buffer`, or `metricool` for `scheduleForExternalPlatforms`.

**Post-OAuth redirect**

- `ADMIN_OAUTH_SUCCESS_PATH` — e.g. `/en/ca/admin/social` (default).

## Database

- `SocialAccount` — encrypted `accessTokenEncrypted` / `refreshTokenEncrypted`, `platform`, `accountId`, `metadataJson` (e.g. `igUserId`, `bufferProfileIds`).
- `ContentSocialPost` — `externalPostId`, `externalPlatformId`, `externalStatus`, `externalResponse`, `platformAccountId`, `lastError`.
- Enum `ContentSocialPlatform` includes `TIKTOK`, `INSTAGRAM`, `FACEBOOK`.

Apply Prisma migrations after pulling changes that alter enums or models.

## API routes (admin-only)

- `POST /api/social/connect` — body `{ "provider": "meta" | "buffer" | "metricool" }`; returns OAuth URL or instructions.
- `GET /api/social/accounts` — safe account list (no tokens).
- `GET /api/social/meta/callback` — Meta OAuth callback (redirects to admin social page).
- `GET /api/social/buffer/callback` — Buffer OAuth callback.
- `POST /api/content/[id]/publish` — `ContentJob` id; body `{ "platform": "instagram" | "facebook" | "tiktok", "mode": "direct" }`.
- `POST /api/content/[id]/schedule-external` — schedule via Buffer/Metricool.

Existing routes still work: `POST /api/content-automation/publish/direct`, `POST /api/content-automation/schedule` (both pass the acting admin user for scheduler/social resolution).

## Admin UI

- **Social connections:** `/admin/social` — connect Meta and Buffer, view token validity (by expiry) and last sync.
- **Content job:** actions include **Publish now**, **Schedule externally**, **Copy for manual posting**, and media link for download/open.

## Limitations

- Instagram/Facebook: respect [Graph API rate limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting); errors surface as `FAILED` rows with `lastError`.
- Video URLs must be **public HTTPS** for Meta container creation.
- TikTok: unattended post requires TikTok’s official posting product; until then use schedulers or manual flow.
- Metricool REST shape may vary by workspace — adjust `METRICOOL_API_BASE_URL` and payload with vendor docs.

## Caption format

`formatSocialCaption` (`lib/content-automation/caption-format.ts`) builds: body, optional CTA, then hashtags on a new block at the end (max 2200 chars for Instagram).
