import { ContentAutomationAssetType } from "@prisma/client";
import type { ContentAsset } from "@prisma/client";
import { formatSocialCaption } from "./caption-format";

export type SocialContentPayload = {
  caption: string;
  hashtags: string[];
  cta: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  /** Full caption for APIs */
  formattedCaption: string;
};

export function buildSocialPayloadFromAssets(assets: ContentAsset[]): SocialContentPayload {
  const cap = assets.find((a) => a.assetType === ContentAutomationAssetType.CAPTION);
  const tags = assets.find((a) => a.assetType === ContentAutomationAssetType.HASHTAG_SET);
  const ctaRow = assets.find((a) => a.assetType === ContentAutomationAssetType.CTA);
  const video = assets.find((a) => a.assetType === ContentAutomationAssetType.VIDEO);
  const thumb = assets.find((a) => a.assetType === ContentAutomationAssetType.THUMBNAIL);

  const caption = cap?.textContent?.trim() ?? "";
  let hashtags: string[] = [];
  if (tags?.textContent) {
    try {
      const parsed = JSON.parse(tags.textContent) as unknown;
      if (Array.isArray(parsed)) {
        hashtags = parsed.map((x) => String(x));
      } else if (typeof parsed === "string") {
        hashtags = parsed.split(/\s+/).filter(Boolean);
      }
    } catch {
      hashtags = tags.textContent.split(/\s+/).filter(Boolean);
    }
  }
  const cta = ctaRow?.textContent?.trim() ?? null;

  const formattedCaption = formatSocialCaption({ caption, hashtags, cta: cta ?? undefined });

  return {
    caption,
    hashtags,
    cta,
    mediaUrl: video?.mediaUrl ?? null,
    thumbnailUrl: thumb?.mediaUrl ?? null,
    formattedCaption,
  };
}
