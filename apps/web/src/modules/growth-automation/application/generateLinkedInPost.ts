import type { ContentFamily } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { generateStructuredDraft } from "@/src/modules/growth-automation/application/_llmContent";

export async function generateLinkedInPost(args: {
  topic: string;
  contentFamily: ContentFamily;
  productOrFeature: string;
  link?: string;
}) {
  return generateStructuredDraft({
    channelLabel: "LinkedIn (professional, line breaks OK)",
    topic: args.topic,
    contentFamily: args.contentFamily,
    productOrFeature: args.productOrFeature,
    link: args.link,
    extraRules: "Max ~2200 chars. No hashtag spam. 1–3 short paragraphs.",
  });
}
