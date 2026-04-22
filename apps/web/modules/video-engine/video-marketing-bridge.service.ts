import { prisma } from "@/lib/db";

import type { VideoScriptVm } from "./video-engine.types";

function mapScriptToMarketingPlatform(tp: VideoScriptVm["targetPlatform"]): "instagram" | "tiktok" | "linkedin" {
  if (tp === "linkedin") return "linkedin";
  if (tp === "tiktok" || tp === "youtube_shorts") return "tiktok";
  return "instagram";
}

/**
 * Creates a Marketing Hub draft linked to a video project — **does not auto-publish**.
 */
export async function createMarketingDraftFromVideoProject(
  videoProjectId: string,
  script: Pick<VideoScriptVm, "suggestedCaption" | "hashtags" | "title" | "targetPlatform">,
): Promise<string> {
  const post = await prisma.lecipmMarketingHubPost.create({
    data: {
      contentType: "video_reel",
      sourceKind: "video_engine",
      sourceId: videoProjectId,
      title: script.title.slice(0, 500),
      caption: script.suggestedCaption.slice(0, 12000),
      hashtagsJson: script.hashtags,
      mediaRefsJson: [],
      suggestedPlatform: mapScriptToMarketingPlatform(script.targetPlatform),
      targetPlatform: mapScriptToMarketingPlatform(script.targetPlatform),
      status: "pending_approval",
    },
  });

  await prisma.lecipmVideoEngineProject.update({
    where: { id: videoProjectId },
    data: { marketingHubPostId: post.id },
  });

  return post.id;
}

export async function createMarketingDraftFromStoredVideoProject(videoProjectId: string): Promise<string> {
  const row = await prisma.lecipmVideoEngineProject.findUnique({
    where: { id: videoProjectId },
    select: { scriptJson: true },
  });
  if (!row?.scriptJson || typeof row.scriptJson !== "object") throw new Error("script_missing");
  const script = row.scriptJson as VideoScriptVm;
  return createMarketingDraftFromVideoProject(videoProjectId, script);
}
