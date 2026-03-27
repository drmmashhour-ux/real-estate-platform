import type { GrowthMarketingPlatform } from "@prisma/client";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";
import type { NormalizedPublishPayload } from "@/src/modules/growth-automation/adapters/types";

export function normalizeDraftPayload(
  platform: GrowthMarketingPlatform,
  draft: DraftPayload,
): NormalizedPublishPayload {
  const meta = draft.metadata ?? {};
  const imageUrl = typeof meta.mediaUrl === "string" ? meta.mediaUrl : undefined;
  const link = typeof meta.linkUrl === "string" ? meta.linkUrl : undefined;
  const videoUrl = typeof meta.videoUrl === "string" ? meta.videoUrl : undefined;
  return {
    platform,
    text: `${draft.hook}\n\n${draft.body}\n\n${draft.cta}`.trim(),
    title: draft.title,
    link,
    imageUrl,
    videoUrl,
    raw: draft,
  };
}
