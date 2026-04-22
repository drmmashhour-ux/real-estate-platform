# LECIPM Video Content Engine (v1)

Template-based short-form marketing packages from platform data: scripts, overlay copy, ranked imagery, JSON render manifests, and optional Marketing Hub drafts. **Nothing is auto-posted** to social networks; ops confirm scheduling or export manually.

## Supported templates

| Template key | Source |
| --- | --- |
| `listing_spotlight` | CRM `Listing` |
| `luxury_property_showcase` | `FsboListing` |
| `bnhub_stay_spotlight` | `ShortTermListing` + BNHub photos |
| `investor_opportunity_brief` | `AmfCapitalDeal` |
| `residence_services_highlight` | `SeniorResidence` |
| `deal_of_the_day` | Latest public-marketing deal |
| `top_5_listings_area` | Top FSBO inventory by city |

Each project stores `scriptJson`, `renderManifestJson`, and optional `mediaPackageJson` on `lecipm_video_engine_projects`.

## Generation flow

1. **Script** — `video-script.service` builds hooks, ordered scenes, captions, hashtags, CTA, and compliance notes (investor disclaimers, residence non-medical copy).
2. **Media** — `video-media.service` pulls URLs (cover-first where available); `rankMediaUrls` dedupes and clamps to 4–8 assets with warnings when thin.
3. **Assembly** — `video-assembly.service` normalizes per-scene durations to the target (15 / 30 / 45s), assigns images to non-CTA scenes, emits `VideoRenderManifestVm` (+ optional FFmpeg-friendly steps).
4. **Persistence** — New rows default to **`preview`** status with manifest ready for admin review.

## Review workflow

States: `draft` → **`preview`** → **`approved`** → **`scheduled`** → **`published`** (or **`rejected`**).

- Admin UI: `/[locale]/[country]/dashboard/marketing/videos`
- APIs under `/api/dashboard/marketing/video-engine/…` require admin session.
- **Marketing Hub bridge** — `POST …/video-engine/[id]/hub-draft` creates a `lecipm_marketing_hub_posts` row (`contentType: video_reel`, `pending_approval`) linked via `marketingHubPostId`.

## Export model

- **Download** — `GET /api/dashboard/marketing/video-engine/[id]/manifest` returns script + manifest + media package JSON for external renderers or editors.
- **Scheduler package** — Same JSON can be handed to an external scheduler; in-app scheduling records `scheduledAt` on the video project only (no automatic network post).

## Performance tracking

`video-performance.service` appends lifecycle events (`video_created`, `video_preview`, `video_approved`, `video_scheduled`, `video_published`) into `performanceJson.events`. Roll-up counters (`impressions`, `clicks`, `conversions`) can be synced via `syncVideoPerformanceMetrics`; funnel attribution merges under `performanceJson.attribution`.

Mapping **video → social post → landing target** is stored as hints under `landingHints` / `attribution` and should be enriched when UTM or Hub IDs are known.

## Brand constraints

- Visual tokens: near-black `#050505`, gold accent `#D4AF37` (see `VIDEO_BRAND`).
- Copy: `sanitizeCaption` reduces spam patterns and risky finance phrasing in scripts.
- Residence content avoids medical outcome claims; investor flows include eligibility / non-guarantee language.

## Related code

- Module root: `apps/web/modules/video-engine/`
- Prisma: `LecipmVideoEngineProject`, `LecipmMarketingHubPost.videoProjects`

After schema changes run `pnpm prisma generate` (and apply migrations for your environment).
