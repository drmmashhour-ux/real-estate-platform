import type { ContentFamily } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { generateStructuredDraft } from "@/src/modules/growth-automation/application/_llmContent";

export async function generateTikTokCaption(args: {
  topic: string;
  contentFamily: ContentFamily;
  productOrFeature: string;
  link?: string;
}) {
  return generateStructuredDraft({
    channelLabel: "TikTok caption (very short, punchy)",
    topic: args.topic,
    contentFamily: args.contentFamily,
    productOrFeature: args.productOrFeature,
    link: args.link,
    extraRules: "body under 400 chars. High-energy hook.",
  });
}
