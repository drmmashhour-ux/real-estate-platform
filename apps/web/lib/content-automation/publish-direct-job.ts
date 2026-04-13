import {
  ContentAutomationAssetType,
  ContentSocialPlatform,
  ContentSocialPostStatus,
  ContentSocialPublishMode,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { validateListingForContentPipeline } from "./validators";
import { appendContentJobLog } from "./job-log";
import { trackEvent } from "@/src/modules/analytics/eventTracker";
import { buildSocialPayloadFromAssets } from "./social-payload";
import { postToPlatform } from "./post-to-platform";
import { getInstagramCredentialsForUser, getFacebookPageCredentialsForUser } from "./social-accounts";

export async function publishContentJobDirect(args: {
  jobId: string;
  platform: "tiktok" | "instagram" | "facebook";
  mode?: "draft" | "direct";
  /** Admin user performing publish — resolves connected social accounts */
  actorUserId: string;
}): Promise<{ ok: boolean; error?: string; detail?: unknown }> {
  const job = await prisma.contentJob.findUnique({
    where: { id: args.jobId },
    include: { shortTermListing: true, assets: true },
  });
  if (!job) return { ok: false, error: "Not found" };

  const v = validateListingForContentPipeline(job.shortTermListing, {
    requirePublishedForSchedule: true,
  });
  if (!v.ok) {
    return { ok: false, error: v.reasons.join("; ") };
  }

  const payload = buildSocialPayloadFromAssets(job.assets);
  const videoRow = job.assets.find((a) => a.assetType === ContentAutomationAssetType.VIDEO);
  if (!videoRow?.mediaUrl && args.platform !== "instagram") {
    return { ok: false, error: "No video asset; generate video first." };
  }
  if (!videoRow?.mediaUrl && args.platform === "instagram" && !payload.thumbnailUrl) {
    return { ok: false, error: "No video or thumbnail for Instagram." };
  }

  const mode = args.mode ?? "direct";

  const result = await postToPlatform({
    platform: args.platform,
    actorUserId: args.actorUserId,
    payload: {
      ...payload,
      mediaUrl: payload.mediaUrl ?? videoRow?.mediaUrl ?? null,
    },
    mode,
  });

  const platformEnum =
    args.platform === "tiktok"
      ? ContentSocialPlatform.TIKTOK
      : args.platform === "facebook"
        ? ContentSocialPlatform.FACEBOOK
        : ContentSocialPlatform.INSTAGRAM;

  let platformAccountId: string | null = null;
  if (args.platform === "instagram") {
    const ig = await getInstagramCredentialsForUser(args.actorUserId);
    platformAccountId = ig?.socialAccountId ?? null;
  } else if (args.platform === "facebook") {
    const fb = await getFacebookPageCredentialsForUser(args.actorUserId);
    platformAccountId = fb?.socialAccountId ?? null;
  }

  const status = result.ok ? ContentSocialPostStatus.PUBLISHED : ContentSocialPostStatus.FAILED;

  await prisma.contentSocialPost.create({
    data: {
      contentJobId: job.id,
      platform: platformEnum,
      publishMode: ContentSocialPublishMode.DIRECT,
      status,
      externalPostId: result.ok ? result.externalPostId ?? null : null,
      externalPlatformId: result.ok ? result.externalPlatformId ?? null : null,
      externalStatus: result.ok ? "published" : "failed",
      externalResponse: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue,
      platformAccountId,
      publishedAt: result.ok ? new Date() : null,
      lastError: !result.ok ? result.error : null,
    },
  });

  const eventKey = `publish_${args.platform}`;
  await appendContentJobLog({
    contentJobId: job.id,
    eventType: eventKey,
    message: result.ok ? `${args.platform} publish OK` : JSON.stringify(result),
    metadataJson: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue,
  });
  await trackEvent(result.ok ? "social_post_published" : "social_post_failed", {
    jobId: job.id,
    listingId: job.listingId,
    platform: args.platform,
  });

  if (!result.ok) {
    return { ok: false, error: result.error, detail: result };
  }
  return { ok: true, detail: result };
}
