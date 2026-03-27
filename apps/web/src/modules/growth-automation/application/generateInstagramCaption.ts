import type { ContentFamily } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { generateStructuredDraft } from "@/src/modules/growth-automation/application/_llmContent";

export async function generateInstagramCaption(args: {
  topic: string;
  contentFamily: ContentFamily;
  productOrFeature: string;
  link?: string;
}) {
  return generateStructuredDraft({
    channelLabel: "Instagram caption (visual-first, 3–8 short lines + hashtags)",
    topic: args.topic,
    contentFamily: args.contentFamily,
    productOrFeature: args.productOrFeature,
    link: args.link,
    extraRules: "Include 3–6 relevant hashtags in the hashtags field.",
  });
}
