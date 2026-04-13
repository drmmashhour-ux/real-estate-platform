import {
  ContentAutomationAssetType,
  ContentAutomationJobStatus,
  ContentSocialPlatform,
  ContentSocialPostStatus,
  ContentSocialPublishMode,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { validateListingForContentPipeline } from "./validators";
import { trackEvent } from "@/src/modules/analytics/eventTracker";
import { appendContentJobLog } from "./job-log";
import { buildSocialPayloadFromAssets } from "./social-payload";
import { scheduleForExternalPlatforms } from "@/lib/integrations/scheduler/post";

export async function scheduleContentJob(args: {
  jobId: string;
  scheduledAt?: Date;
  platforms?: ("tiktok" | "instagram" | "facebook")[];
  captionAssetId?: string;
  actorUserId: string;
}): Promise<
  | { ok: true; provider: "metricool" | "buffer"; externalId?: string }
  | { ok: true; provider: "draft_only"; warning: string }
  | { ok: false; error: string }
> {
  const job = await prisma.contentJob.findUnique({
    where: { id: args.jobId },
    include: {
      shortTermListing: { include: { listingPhotos: true } },
      assets: true,
    },
  });
  if (!job) return { ok: false, error: "Not found" };

  const v = validateListingForContentPipeline(job.shortTermListing, {
    requirePublishedForSchedule: true,
  });
  if (!v.ok) {
    return { ok: false, error: v.reasons.join("; ") };
  }

  const payload = buildSocialPayloadFromAssets(job.assets);
  const captionRow =
    job.assets.find((a) => a.id === args.captionAssetId) ??
    job.assets.find((a) => a.assetType === ContentAutomationAssetType.CAPTION);
  const caption = captionRow?.textContent ?? payload.formattedCaption;
  const videoRow = job.assets.find((a) => a.assetType === ContentAutomationAssetType.VIDEO);
  const mediaUrls = videoRow?.mediaUrl ? [videoRow.mediaUrl] : [];

  const when = args.scheduledAt ?? new Date(Date.now() + 3600_000);
  const platforms = args.platforms?.length
    ? args.platforms
    : (["tiktok", "instagram"] as ("tiktok" | "instagram" | "facebook")[]);

  const scheduled = await scheduleForExternalPlatforms({
    userId: args.actorUserId,
    caption,
    mediaUrls,
    scheduledAt: when,
    platforms: [...platforms],
  });

  if (scheduled.ok) {
    for (const pl of platforms) {
      await prisma.contentSocialPost.create({
        data: {
          contentJobId: job.id,
          platform:
            pl === "tiktok"
              ? ContentSocialPlatform.TIKTOK
              : pl === "facebook"
                ? ContentSocialPlatform.FACEBOOK
                : ContentSocialPlatform.INSTAGRAM,
          publishMode: ContentSocialPublishMode.SCHEDULED,
          scheduledAt: when,
          status: ContentSocialPostStatus.SCHEDULED,
          externalPostId: scheduled.externalId,
          externalPlatformId: scheduled.externalId,
          externalStatus: "scheduled",
          externalResponse: JSON.parse(JSON.stringify(scheduled)) as Prisma.InputJsonValue,
        },
      });
    }
    await prisma.contentJob.update({
      where: { id: job.id },
      data: { status: ContentAutomationJobStatus.SCHEDULED },
    });
    await trackEvent("social_post_scheduled", { jobId: job.id, listingId: job.listingId });
    await appendContentJobLog({
      contentJobId: job.id,
      eventType: "scheduled",
      message: `${scheduled.provider} schedule OK`,
      metadataJson: { externalId: scheduled.externalId ?? null, provider: scheduled.provider },
    });
    return { ok: true, provider: scheduled.provider, externalId: scheduled.externalId };
  }

  for (const pl of platforms) {
    await prisma.contentSocialPost.create({
      data: {
        contentJobId: job.id,
        platform:
          pl === "tiktok"
            ? ContentSocialPlatform.TIKTOK
            : pl === "facebook"
              ? ContentSocialPlatform.FACEBOOK
              : ContentSocialPlatform.INSTAGRAM,
        publishMode: ContentSocialPublishMode.DRAFT,
        status: ContentSocialPostStatus.DRAFT,
        lastError: scheduled.error,
        externalStatus: "failed",
        analyticsJson: { error: scheduled.error, caption, mediaUrls, manualFallback: true },
      },
    });
  }
  await trackEvent("social_post_failed", {
    jobId: job.id,
    listingId: job.listingId,
    phase: "schedule_draft_fallback",
    reason: scheduled.error,
  });
  return { ok: true, provider: "draft_only", warning: scheduled.error };
}
