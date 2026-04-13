# Listing → traffic (intended funnel)

```
Listing added
       ↓
Content generated
       ↓
Video created
       ↓
Posted automatically
       ↓
Traffic comes in
```

**“Listing added”** here means the stay is **published** (not draft). Drafts do not run the machine until the listing goes live.

## How this maps in LECIPM

| Step | Product behavior | Where it lives |
|------|------------------|----------------|
| **Listing added** | Published BNHUB stay triggers pipelines in the background when env flags are on. | `lib/bnhub/content-pipeline/enqueue.ts` → `runListingContentPipeline` (optional) + `runContentMachineForListing` when `CONTENT_PIPELINE_ENABLED` / `CONTENT_MACHINE_ENABLED`. |
| **Content generated** | Five style variants (hook → visual → value → CTA) + captions/hashtags. | `lib/bnhub/tiktok-scripts.ts`, `lib/content-machine/generate.ts` → `generated_contents` / `MachineGeneratedContent`. |
| **Video created** | Vertical 9:16 **JPEG card** (hook overlay) today; Runway/Pictory path for MP4 later. | `lib/content-machine/video.ts`; legacy pipeline: `run-pipeline.ts` + `video-tool.ts`. |
| **Posted automatically** | **Rows** in `content_schedules` (TikTok + Instagram targets) + cron; **live post** to networks needs Metricool/Later tokens or direct API — see `lib/bnhub/content-pipeline/social-scheduler.ts`. | `lib/content-machine/scheduler.ts`, `GET /api/cron/content-machine?secret=…` |
| **Traffic comes in** | Organic + paid landings; measure listing views, `?cc=` content attribution, bookings. | `TrafficEvent`, `ListingViewedBeacon`, Meta Pixel, GA, BNHUB URLs. |

## What “fully automatic” requires

- **Generate + video + schedule rows in DB:** `CONTENT_MACHINE_ENABLED=1`, published listing, cron for backlog (`CRON_SECRET` + `/api/cron/content-machine`).
- **Actual publish to TikTok/IG:** wire `METRICOOL_API_TOKEN` / `LATER_API_TOKEN` (or implement HTTP in `dispatchToSocialScheduler`) — until then, schedules are **queued locally** with optional stub external ids.

See also: [content-traffic-flywheel.md](./content-traffic-flywheel.md), [paid-social-scaling-playbook.md](./paid-social-scaling-playbook.md), [retargeting-playbook.md](./retargeting-playbook.md).
