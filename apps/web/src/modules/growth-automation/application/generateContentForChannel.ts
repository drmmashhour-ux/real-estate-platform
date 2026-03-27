import type { GrowthMarketingPlatform } from "@prisma/client";
import type { ContentFamily } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { generateBlogPost } from "@/src/modules/growth-automation/application/generateBlogPost";
import { generateEmailDraft } from "@/src/modules/growth-automation/application/generateEmailDraft";
import { generateInstagramCaption } from "@/src/modules/growth-automation/application/generateInstagramCaption";
import { generateLinkedInPost } from "@/src/modules/growth-automation/application/generateLinkedInPost";
import { generateShortVideoScript } from "@/src/modules/growth-automation/application/generateShortVideoScript";
import { generateTikTokCaption } from "@/src/modules/growth-automation/application/generateTikTokCaption";
import { generateYouTubeScript } from "@/src/modules/growth-automation/application/generateYouTubeScript";

export async function generateContentForChannel(args: {
  platform: GrowthMarketingPlatform;
  topic: string;
  contentFamily: ContentFamily;
  productOrFeature: string;
  link?: string;
}) {
  const base = {
    topic: args.topic,
    contentFamily: args.contentFamily,
    productOrFeature: args.productOrFeature,
    link: args.link,
  };
  switch (args.platform) {
    case "LINKEDIN":
      return { platform: args.platform, kind: "post", payload: await generateLinkedInPost(base) };
    case "INSTAGRAM":
      return { platform: args.platform, kind: "caption", payload: await generateInstagramCaption(base) };
    case "TIKTOK":
      return {
        platform: args.platform,
        kind: "short_script+caption",
        payload: {
          script: await generateShortVideoScript({
            topic: args.topic,
            contentFamily: args.contentFamily,
            productOrFeature: args.productOrFeature,
          }),
          caption: await generateTikTokCaption(base),
        },
      };
    case "YOUTUBE":
      return { platform: args.platform, kind: "long_script", payload: await generateYouTubeScript(base) };
    case "BLOG":
      return { platform: args.platform, kind: "article", payload: await generateBlogPost(base) };
    case "EMAIL":
      return { platform: args.platform, kind: "email", payload: await generateEmailDraft(base) };
    default:
      throw new Error(`Unsupported platform ${args.platform}`);
  }
}
