import { publishFacebookPageVideo } from "@/lib/integrations/meta/facebook-post";
import { getFacebookPageCredentialsForUser } from "./social-accounts";
import { publishToInstagram, type InstagramPublishInput } from "./publish-instagram";
import { scheduleForExternalPlatforms } from "@/lib/integrations/scheduler/post";
import type { SocialContentPayload } from "./social-payload";

export type PostTargetPlatform = "instagram" | "facebook" | "tiktok";

export type PostToPlatformResult =
  | {
      ok: true;
      channel: "meta_instagram" | "meta_facebook" | "scheduler" | "manual";
      externalPostId?: string;
      externalPlatformId?: string;
      detail?: unknown;
    }
  | { ok: false; channel: "meta_instagram" | "meta_facebook" | "scheduler" | "manual"; error: string; detail?: unknown };

/**
 * Routes: Instagram/Facebook → Meta Graph; TikTok → third-party scheduler (Metricool/Buffer); else manual fallback signal.
 */
export async function postToPlatform(args: {
  platform: PostTargetPlatform;
  actorUserId: string;
  payload: SocialContentPayload;
  mode?: "draft" | "direct";
  scheduledAt?: Date;
  schedulerPreference?: "metricool" | "buffer" | "auto";
}): Promise<PostToPlatformResult> {
  const mode = args.mode ?? "direct";
  const videoUrl = args.payload.mediaUrl;

  if (args.platform === "instagram") {
    if (!videoUrl?.trim() && !thumb?.trim()) {
      return { ok: false, channel: "manual", error: "No image or video URL for Instagram" };
    }
  } else if (args.platform === "tiktok") {
    if (!videoUrl?.trim()) {
      return { ok: false, channel: "manual", error: "No video URL for TikTok scheduling" };
    }
  } else if (args.platform === "facebook") {
    if (!videoUrl?.trim()) {
      return { ok: false, channel: "manual", error: "No video URL for Facebook Page" };
    }
  }

  if (args.platform === "instagram") {
    const input: InstagramPublishInput = {
      videoUrl: videoUrl ?? "",
      imageUrl: args.payload.thumbnailUrl,
      caption: args.payload.formattedCaption,
      mode,
      userId: args.actorUserId,
    };
    const r = await publishToInstagram(input);
    if (r.ok) {
      return {
        ok: true,
        channel: "meta_instagram",
        externalPostId: r.externalPostId,
        externalPlatformId: r.creationId,
        detail: r,
      };
    }
    return { ok: false, channel: "meta_instagram", error: r.error, detail: r };
  }

  if (args.platform === "facebook") {
    const creds = await getFacebookPageCredentialsForUser(args.actorUserId);
    if (!creds || !videoUrl) {
      return {
        ok: false,
        channel: "manual",
        error: "Facebook Page not connected or no video URL",
      };
    }
    const r = await publishFacebookPageVideo({
      pageId: creds.pageId,
      pageAccessToken: creds.pageAccessToken,
      videoUrl,
      description: args.payload.formattedCaption,
    });
    if (r.ok) {
      return { ok: true, channel: "meta_facebook", externalPostId: r.videoId, detail: r };
    }
    return { ok: false, channel: "meta_facebook", error: r.error, detail: r };
  }

  if (args.platform === "tiktok") {
    const when = args.scheduledAt ?? new Date(Date.now() + 120_000);
    const sch = await scheduleForExternalPlatforms({
      userId: args.actorUserId,
      caption: args.payload.formattedCaption,
      mediaUrls: videoUrl ? [videoUrl] : [],
      scheduledAt: when,
      platforms: ["tiktok"],
      preference: args.schedulerPreference ?? "auto",
    });
    if (sch.ok && sch.externalId) {
      return {
        ok: true,
        channel: "scheduler",
        externalPlatformId: sch.externalId,
        externalPostId: sch.externalId,
        detail: sch.raw,
      };
    }
    return {
      ok: false,
      channel: "manual",
      error: sch.ok ? "Scheduler returned no id" : sch.error,
      detail: sch,
    };
  }

  return { ok: false, channel: "manual", error: "Unsupported platform" };
}
