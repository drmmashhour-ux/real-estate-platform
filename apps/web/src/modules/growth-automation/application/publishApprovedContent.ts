import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { publishBlog } from "@/src/modules/growth-automation/adapters/blogAdapter";
import { publishEmail } from "@/src/modules/growth-automation/adapters/emailAdapter";
import { publishInstagram } from "@/src/modules/growth-automation/adapters/instagramAdapter";
import { publishLinkedIn } from "@/src/modules/growth-automation/adapters/linkedinAdapter";
import { publishTikTok } from "@/src/modules/growth-automation/adapters/tiktokAdapter";
import { publishYouTube } from "@/src/modules/growth-automation/adapters/youtubeAdapter";
import { ensureFreshAccessToken } from "@/src/modules/growth-automation/infrastructure/channelTokens";
import {
  findPublishedDuplicateFingerprint,
  getContentItem,
  updateContentItemStatus,
} from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";
import { validateDraftForPlatform } from "@/src/modules/growth-automation/policies/growthAutomationPolicyService";

export async function publishApprovedContent(itemId: string) {
  const item = await getContentItem(itemId);
  if (!item) throw new Error("Content item not found");
  if (item.status !== "APPROVED" && item.status !== "SCHEDULED") {
    throw new Error("Only approved or scheduled items can be published");
  }
  if (!item.marketingChannelId && item.platform !== "BLOG" && item.platform !== "EMAIL") {
    throw new Error("Link a marketing channel for this platform before publishing");
  }
  const draft = item.draftPayload as DraftPayload;
  const v = validateDraftForPlatform(item.platform, draft);
  if (!v.ok) throw new Error(v.reason);

  if (item.publishFingerprint) {
    const dup = await findPublishedDuplicateFingerprint(item.publishFingerprint, itemId);
    if (dup) {
      throw new Error("Duplicate publish blocked (same fingerprint already published)");
    }
  }

  const tokens = item.marketingChannelId
    ? await ensureFreshAccessToken(item.marketingChannelId)
    : null;
  if (item.platform !== "BLOG" && item.platform !== "EMAIL" && !tokens) {
    throw new Error("Could not load channel tokens");
  }
  if (tokens && tokens.platform !== item.platform) {
    throw new Error("Marketing channel platform does not match content item");
  }

  let result = await dispatchPublish({
    platform: item.platform,
    draft,
    accessToken: tokens?.accessToken ?? "",
    externalAccountId: tokens?.externalAccountId ?? "",
  });

  if (!result.ok) {
    await updateContentItemStatus(itemId, {
      status: "FAILED",
      lastError: result.message,
      retryCount: item.retryCount + 1,
    });
    return result;
  }

  await updateContentItemStatus(itemId, {
    status: "PUBLISHED",
    publishedAt: new Date(),
    externalPostId: result.externalPostId,
    publishPayload: result.raw ?? { ok: true },
    lastError: null,
  });
  return result;
}

async function dispatchPublish(args: {
  platform: import("@prisma/client").GrowthMarketingPlatform;
  draft: DraftPayload;
  accessToken: string;
  externalAccountId: string;
}) {
  switch (args.platform) {
    case "INSTAGRAM":
      return publishInstagram({
        igUserId: args.externalAccountId,
        accessToken: args.accessToken,
        draft: args.draft,
      });
    case "LINKEDIN":
      return publishLinkedIn({
        accessToken: args.accessToken,
        authorUrn: args.externalAccountId,
        draft: args.draft,
      });
    case "YOUTUBE":
      return publishYouTube({ accessToken: args.accessToken, draft: args.draft });
    case "TIKTOK":
      return publishTikTok({ accessToken: args.accessToken, draft: args.draft });
    case "BLOG":
      return publishBlog({ draft: args.draft });
    case "EMAIL": {
      const meta = args.draft.metadata ?? {};
      const to =
        (typeof meta.emailTo === "string" && meta.emailTo.includes("@")
          ? meta.emailTo
          : null) || process.env.GROWTH_EMAIL_DEFAULT_TO?.trim();
      if (!to) {
        return {
          ok: false as const,
          code: "EMAIL_TO_MISSING",
          message: "Set draft.metadata.emailTo or GROWTH_EMAIL_DEFAULT_TO for email publishing",
        };
      }
      return publishEmail({ draft: args.draft, to });
    }
    default:
      return { ok: false as const, code: "PLATFORM", message: `Unsupported platform ${args.platform}` };
  }
}
