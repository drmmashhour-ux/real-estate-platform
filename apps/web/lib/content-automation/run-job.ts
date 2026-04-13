import {
  ContentAutomationApprovalMode,
  ContentAutomationAssetType,
  ContentAutomationContentStyle,
  ContentAutomationJobStatus,
  ContentAutomationPlatformTarget,
  ContentSocialPlatform,
  ContentSocialPostStatus,
  ContentSocialPublishMode,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/src/modules/analytics/eventTracker";
import { parseDefaultPlatformTarget, resolveApprovalMode } from "./config";
import { generateContentPacksStructured } from "./generate-content-pack";
import { buildLearningAugmentationForListing } from "@/lib/content-intelligence/learning-context";
import { generateVideoWithPictory } from "./generate-video-pictory";
import { generateVideoWithRunway } from "./generate-video-runway";
import { appendContentJobLog } from "./job-log";
import type { ContentPackItem, ListingContentInput } from "./types";
import { selectBestImagesForVideo, selectListingImageUrls } from "./select-listing-media";
import { validateListingForContentPipeline } from "./validators";
import { canAutoPublish, canAutoSchedule } from "./rules";
import { scheduleForExternalPlatforms } from "@/lib/integrations/scheduler/post";
import { postToPlatform } from "./post-to-platform";
import { buildSocialPayloadFromAssets } from "./social-payload";

function amenityStrings(listing: { amenities: Prisma.JsonValue }): string[] {
  const a = listing.amenities;
  if (Array.isArray(a)) {
    return a.filter((x): x is string => typeof x === "string").slice(0, 24);
  }
  return [];
}

function toListingInput(
  listing: Parameters<typeof validateListingForContentPipeline>[0],
  platformTarget: ContentAutomationPlatformTarget
): ListingContentInput {
  const urls = selectListingImageUrls(listing);
  const tp =
    platformTarget === "BOTH"
      ? ("both" as const)
      : platformTarget === "TIKTOK"
        ? ("tiktok" as const)
        : ("instagram" as const);
  const nh =
    (listing as { neighborhoodDetails?: string | null }).neighborhoodDetails?.trim().slice(0, 120) ?? null;
  return {
    title: listing.title,
    city: listing.city,
    region: listing.region,
    neighborhood: nh,
    country: listing.country,
    nightPriceCents: listing.nightPriceCents,
    currency: listing.currency,
    propertyType: listing.propertyType,
    roomType: listing.roomType,
    maxGuests: listing.maxGuests,
    amenities: amenityStrings(listing),
    imageUrls: urls,
    targetPlatform: tp,
    brandTone: process.env.CONTENT_AUTOMATION_BRAND_TONE?.trim() || "trustworthy, warm, concise",
    descriptionExcerpt: (listing.description ?? "").replace(/\s+/g, " ").trim().slice(0, 600) || null,
    listingKind: "bnhub",
  };
}

function pickPrimaryScript(packs: ContentPackItem[]): string {
  const valid = packs.find((p) => p.valid && p.style !== "price_shock" && p.script.trim());
  const anyScript = packs.find((p) => p.script.trim());
  return (valid ?? anyScript)?.script ?? "";
}

export type RunPipelineOptions = {
  jobId: string;
  skipVideo?: boolean;
};

async function maybePostReadyAutomation(jobId: string): Promise<void> {
  const job = await prisma.contentJob.findUnique({
    where: { id: jobId },
    include: {
      shortTermListing: true,
      assets: true,
    },
  });
  if (!job) return;

  const listing = job.shortTermListing;
  const mode = job.approvalMode;

  if (mode === ContentAutomationApprovalMode.MANUAL) {
    await appendContentJobLog({
      contentJobId: jobId,
      eventType: "automation_skipped",
      message: "Approval mode is manual; no auto schedule/publish.",
    });
    return;
  }

  const videoAsset = job.assets.find((a) => a.assetType === ContentAutomationAssetType.VIDEO);
  const captionAsset = job.assets.find((a) => a.assetType === ContentAutomationAssetType.CAPTION);
  const caption = captionAsset?.textContent ?? "";
  const mediaUrls = videoAsset?.mediaUrl ? [videoAsset.mediaUrl] : [];

  if (mode === ContentAutomationApprovalMode.AUTO_SCHEDULE) {
    const gate = canAutoSchedule({ listing, approvalMode: mode });
    if (!gate.ok) {
      await appendContentJobLog({
        contentJobId: jobId,
        eventType: "auto_schedule_blocked",
        message: gate.reason ?? "blocked",
      });
      return;
    }
    const when = new Date(Date.now() + 3_600_000);
    const platforms = ["tiktok", "instagram"] as const;
    const res = await scheduleForExternalPlatforms({
      userId: listing.ownerId,
      caption,
      mediaUrls,
      scheduledAt: when,
      platforms: [...platforms],
    });
    if (res.ok) {
      for (const pl of platforms) {
        await prisma.contentSocialPost.create({
          data: {
            contentJobId: job.id,
            platform: pl === "tiktok" ? ContentSocialPlatform.TIKTOK : ContentSocialPlatform.INSTAGRAM,
            publishMode: ContentSocialPublishMode.SCHEDULED,
            scheduledAt: when,
            status: ContentSocialPostStatus.SCHEDULED,
            externalPostId: res.externalId,
            externalPlatformId: res.externalId,
            externalStatus: "scheduled",
          },
        });
      }
      await prisma.contentJob.update({
        where: { id: job.id },
        data: { status: ContentAutomationJobStatus.SCHEDULED },
      });
      await appendContentJobLog({
        contentJobId: jobId,
        eventType: "auto_scheduled",
        message: `${res.provider} schedule OK`,
        metadataJson: { externalId: res.externalId ?? null, provider: res.provider },
      });
      await trackEvent("social_post_scheduled", { jobId: job.id, listingId: listing.id, source: `${res.provider}_auto` });
    } else {
      await appendContentJobLog({
        contentJobId: jobId,
        eventType: "auto_schedule_failed",
        message: res.error,
      });
    }
    return;
  }

  if (mode === ContentAutomationApprovalMode.AUTO_PUBLISH) {
    const gate = canAutoPublish({ listing, approvalMode: mode });
    if (!gate.ok) {
      await appendContentJobLog({
        contentJobId: jobId,
        eventType: "auto_publish_blocked",
        message: gate.reason ?? "blocked",
      });
      return;
    }
    if (!videoAsset?.mediaUrl) {
      await appendContentJobLog({
        contentJobId: jobId,
        eventType: "auto_publish_failed",
        message: "No video asset for direct publish.",
      });
      return;
    }
    const payload = buildSocialPayloadFromAssets(job.assets);
    const actorUserId = listing.ownerId;
    const tt = await postToPlatform({
      platform: "tiktok",
      actorUserId,
      payload: { ...payload, mediaUrl: videoAsset.mediaUrl },
      mode: "direct",
    });
    const ig = await postToPlatform({
      platform: "instagram",
      actorUserId,
      payload: { ...payload, mediaUrl: videoAsset.mediaUrl },
      mode: "direct",
    });
    await appendContentJobLog({
      contentJobId: jobId,
      eventType: "auto_publish_attempt",
      message: "Direct TikTok (scheduler) / Instagram (Meta) publish.",
      metadataJson: { tiktok: tt, instagram: ig },
    });
  }
}

/**
 * Executes copy generation and optional video step for an existing ContentJob row.
 */
export async function runContentAutomationPipeline(opts: RunPipelineOptions): Promise<{
  ok: boolean;
  error?: string;
}> {
  const job = await prisma.contentJob.findUnique({
    where: { id: opts.jobId },
    include: {
      shortTermListing: { include: { listingPhotos: { orderBy: { sortOrder: "asc" } } } },
    },
  });

  if (!job) return { ok: false, error: "Job not found" };

  const listing = job.shortTermListing;
  const scheduleRules = { requirePublishedForSchedule: false };
  const v = validateListingForContentPipeline(listing, scheduleRules);
  if (!v.ok) {
    await prisma.contentJob.update({
      where: { id: job.id },
      data: {
        status: ContentAutomationJobStatus.FAILED,
        errorMessage: v.reasons.join("; "),
      },
    });
    await appendContentJobLog({
      contentJobId: job.id,
      eventType: "validation_failed",
      message: v.reasons.join("; "),
    });
    return { ok: false, error: v.reasons.join("; ") };
  }

  await prisma.contentJob.update({
    where: { id: job.id },
    data: { status: ContentAutomationJobStatus.GENERATING_COPY, errorMessage: null },
  });
  await appendContentJobLog({ contentJobId: job.id, eventType: "copy_started", message: "Generating structured packs" });

  await trackEvent("content_generated", { jobId: job.id, listingId: listing.id });
  await trackEvent("content_automation_copy_started", { jobId: job.id, listingId: listing.id });

  const input = toListingInput(listing, job.platformTarget);
  let learning: Awaited<ReturnType<typeof buildLearningAugmentationForListing>> = null;
  try {
    learning = await buildLearningAugmentationForListing(input);
  } catch {
    learning = null;
  }
  const { packs, source } = await generateContentPacksStructured(input, { learning });

  await prisma.contentAsset.deleteMany({ where: { contentJobId: job.id } });

  for (const pack of packs) {
    await prisma.contentAsset.create({
      data: {
        contentJobId: job.id,
        assetType: ContentAutomationAssetType.SCRIPT,
        textContent: pack.script,
        metadataJson: {
          pack,
          generationSource: source,
        } as Prisma.InputJsonValue,
      },
    });
    await prisma.contentAsset.create({
      data: {
        contentJobId: job.id,
        assetType: ContentAutomationAssetType.CAPTION,
        textContent: pack.caption,
        metadataJson: { style: pack.style, valid: pack.valid } as Prisma.InputJsonValue,
      },
    });
    await prisma.contentAsset.create({
      data: {
        contentJobId: job.id,
        assetType: ContentAutomationAssetType.HASHTAG_SET,
        textContent: pack.hashtags.join(" "),
        metadataJson: { style: pack.style, hashtags: pack.hashtags } as Prisma.InputJsonValue,
      },
    });
    await prisma.contentAsset.create({
      data: {
        contentJobId: job.id,
        assetType: ContentAutomationAssetType.OVERLAY_TEXT,
        textContent: pack.overlayText.join("\n"),
        metadataJson: { style: pack.style } as Prisma.InputJsonValue,
      },
    });
    await prisma.contentAsset.create({
      data: {
        contentJobId: job.id,
        assetType: ContentAutomationAssetType.CTA,
        textContent: pack.cta,
        metadataJson: { style: pack.style } as Prisma.InputJsonValue,
      },
    });
  }

  await prisma.contentAsset.create({
    data: {
      contentJobId: job.id,
      assetType: ContentAutomationAssetType.METADATA,
      textContent: null,
      metadataJson: {
        listingId: listing.id,
        packs: packs.map((p) => ({
          style: p.style,
          valid: p.valid,
          invalidReason: p.invalidReason ?? null,
        })),
        generationSource: source,
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.contentJob.update({
    where: { id: job.id },
    data: { lastCopyProvider: source === "openai" ? "openai" : "deterministic" },
  });

  await trackEvent("content_automation_copy_ready", {
    jobId: job.id,
    listingId: listing.id,
    packCount: packs.length,
    source,
  });

  if (!opts.skipVideo && !v.blockVideo) {
    await prisma.contentJob.update({
      where: { id: job.id },
      data: { status: ContentAutomationJobStatus.GENERATING_VIDEO },
    });
    await appendContentJobLog({ contentJobId: job.id, eventType: "video_started", message: "Video generation" });

    const mediaUrls = selectBestImagesForVideo(listing, { min: 3, max: 6 });
    const hero = mediaUrls[0];
    const primaryScript = pickPrimaryScript(packs);
    const prompt = `Vertical 9:16 vacation rental promo. ${primaryScript.slice(0, 500)} No fake claims.`;

    let videoUrl: string | null = null;
    let thumb: string | undefined;
    let videoProvider: "runway" | "pictory" | null = null;

    if (hero && mediaUrls.length >= 3) {
      const rw = await generateVideoWithRunway({
        prompt,
        imageUrl: hero,
        durationSec: 8,
      });
      if (rw.ok) {
        videoUrl = rw.videoUrl;
        thumb = rw.thumbnailUrl;
        videoProvider = "runway";
      } else {
        await appendContentJobLog({
          contentJobId: job.id,
          eventType: "runway_failed",
          message: rw.error,
        });
        const pic = await generateVideoWithPictory({
          script: primaryScript,
          imageUrls: mediaUrls,
          aspectRatio: "9:16",
        });
        if (pic.ok) {
          videoUrl = pic.videoUrl;
          videoProvider = "pictory";
        } else {
          await appendContentJobLog({
            contentJobId: job.id,
            eventType: "pictory_failed",
            message: pic.error,
          });
        }
      }
    } else {
      await appendContentJobLog({
        contentJobId: job.id,
        eventType: "video_skipped",
        message: "Insufficient images for video (need >= 3).",
      });
    }

    if (videoUrl) {
      await prisma.contentAsset.create({
        data: {
          contentJobId: job.id,
          assetType: ContentAutomationAssetType.VIDEO,
          mediaUrl: videoUrl,
          metadataJson: {
            ratio: "9:16",
            thumbnailUrl: thumb ?? null,
            provider: videoProvider,
          } as Prisma.InputJsonValue,
        },
      });
      if (thumb) {
        await prisma.contentAsset.create({
          data: {
            contentJobId: job.id,
            assetType: ContentAutomationAssetType.THUMBNAIL,
            mediaUrl: thumb,
            metadataJson: {} as Prisma.InputJsonValue,
          },
        });
      }
      await prisma.contentJob.update({
        where: { id: job.id },
        data: { lastVideoProvider: videoProvider },
      });
      await trackEvent("video_generated", { jobId: job.id, listingId: listing.id, provider: videoProvider });
    }

    await trackEvent("content_automation_video_ready", {
      jobId: job.id,
      listingId: listing.id,
      hasVideo: Boolean(videoUrl),
    });
  } else if (v.blockVideo) {
    await appendContentJobLog({
      contentJobId: job.id,
      eventType: "video_skipped",
      message: "Blocked by media/validation rules.",
    });
  }

  await prisma.contentJob.update({
    where: { id: job.id },
    data: { status: ContentAutomationJobStatus.READY },
  });

  await trackEvent("content_automation_job_ready", { jobId: job.id, listingId: listing.id });
  await appendContentJobLog({ contentJobId: job.id, eventType: "ready", message: "Pipeline copy (+ optional video) complete" });

  await maybePostReadyAutomation(job.id);

  return { ok: true };
}

export async function createContentJob(args: {
  listingId: string;
  platformTarget?: ContentAutomationPlatformTarget;
  contentStyle?: ContentAutomationContentStyle;
  approvalRequired?: boolean;
  approvalMode?: ContentAutomationApprovalMode;
}): Promise<{ id: string }> {
  const job = await prisma.contentJob.create({
    data: {
      listingId: args.listingId,
      platformTarget: args.platformTarget ?? parseDefaultPlatformTarget(),
      contentStyle: args.contentStyle ?? ContentAutomationContentStyle.ALL_FIVE,
      approvalRequired: args.approvalRequired ?? true,
      approvalMode: resolveApprovalMode(args.approvalMode ?? null),
      status: ContentAutomationJobStatus.QUEUED,
    },
  });
  await trackEvent("content_automation_job_created", { jobId: job.id, listingId: args.listingId });
  return { id: job.id };
}
