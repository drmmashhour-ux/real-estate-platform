import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isOpenAiConfigured } from "@/lib/ai/openai";
import { generateTikTokScripts, toTikTokListingInput, type TikTokScriptsPayload } from "@/lib/bnhub/tiktok-scripts";
import { collectListingImageUrls } from "@/lib/bnhub/content-pipeline/collect-images";
import {
  contentPipelineIncludeDrafts,
  contentPipelineMinIntervalMs,
  getVideoTool,
  getSocialScheduler,
} from "@/lib/bnhub/content-pipeline/env";
import { buildVerticalVideoPayload, dispatchToVideoTool } from "@/lib/bnhub/content-pipeline/video-tool";
import { dispatchToSocialScheduler } from "@/lib/bnhub/content-pipeline/social-scheduler";
import { isContentMachineEnabled } from "@/lib/content-machine/env";
import { runContentMachineForListing } from "@/lib/content-machine/pipeline";

async function shouldThrottle(listingId: string): Promise<boolean> {
  const minMs = contentPipelineMinIntervalMs();
  if (minMs === 0) return false;
  const since = new Date(Date.now() - minMs);
  const recent = await prisma.contentGenerated.findFirst({
    where: { listingId, createdAt: { gte: since } },
    select: { id: true },
  });
  return Boolean(recent);
}

/**
 * End-to-end: OpenAI/deterministic TikTok pack → video payload → optional video + scheduler → `content_generated` row.
 */
export async function runListingContentPipeline(
  listingId: string,
  trigger: "create" | "update" | "manual",
  opts?: { force?: boolean }
): Promise<{ id: string } | { skipped: true; reason: string }> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: {
      listingPhotos: { select: { url: true, isCover: true, sortOrder: true } },
    },
  });

  if (!listing) {
    return { skipped: true, reason: "listing_not_found" };
  }

  if (
    !opts?.force &&
    listing.listingStatus !== ListingStatus.PUBLISHED &&
    !contentPipelineIncludeDrafts()
  ) {
    return { skipped: true, reason: "not_published" };
  }

  if (!opts?.force && trigger === "update" && (await shouldThrottle(listingId))) {
    return { skipped: true, reason: "throttled" };
  }

  const images = collectListingImageUrls(listing, listing.listingPhotos);
  const base = toTikTokListingInput({
    title: listing.title,
    city: listing.city,
    nightPriceCents: listing.nightPriceCents,
    photos: listing.photos,
  });
  const input = { ...base, images: images.length ? images : base.images };

  const pack: TikTokScriptsPayload = await generateTikTokScripts(input);

  const primaryScript = pack.scripts[0]!;
  const caption = pack.captions[0] ?? `${listing.title} · ${listing.city}`;
  const source: "openai" | "deterministic" = isOpenAiConfigured() ? "openai" : "deterministic";

  const videoPayload = buildVerticalVideoPayload(
    {
      title: listing.title,
      city: listing.city,
      listingCode: listing.listingCode,
      nightPriceCents: listing.nightPriceCents,
      currency: listing.currency,
    },
    pack,
    primaryScript,
    images
  );

  const videoTool = getVideoTool();
  const videoResult = await dispatchToVideoTool(videoPayload);

  const schedulerResult = await dispatchToSocialScheduler({
    listingId: listing.id,
    caption: `${caption}\n\n${pack.hashtags.slice(0, 12).join(" ")}`,
    hashtags: pack.hashtags,
    videoUrl: videoResult.videoUrl,
    title: listing.title,
  });

  const schedulerName = getSocialScheduler();

  const notes = [videoResult.skippedReason, schedulerResult.skippedReason].filter(Boolean).join(" · ");

  const row = await prisma.contentGenerated.create({
    data: {
      listingId,
      trigger,
      scriptsJson: pack.scripts as unknown as object[],
      captionsJson: pack.captions as unknown as object[],
      hashtagsJson: pack.hashtags as unknown as object[],
      generationSource: source,
      videoTool: videoTool === "none" ? null : videoTool,
      videoPayloadJson: videoPayload as object,
      videoUrl: videoResult.videoUrl,
      videoStyle: "short_form_vertical",
      primaryScriptJson: primaryScript as object,
      publishedCaption: caption,
      schedulerProvider: schedulerName === "none" ? null : schedulerName,
      scheduledFor: schedulerResult.scheduledFor,
      schedulerExternalId: schedulerResult.externalId,
      metricsViews: null,
      metricsClicks: null,
      metricsConversions: null,
      metricsSyncedAt: null,
      pipelineStatus:
        videoResult.videoUrl || schedulerResult.externalId ? "scheduled" : "generated",
      errorMessage: notes || null,
    },
  });

  if (isContentMachineEnabled()) {
    void runContentMachineForListing(listingId, { force: opts?.force }).catch((err) => {
      console.error("[content-machine] listing pipeline hook", listingId, err);
    });
  }

  return { id: row.id };
}
