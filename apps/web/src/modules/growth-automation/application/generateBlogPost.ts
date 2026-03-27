import { growthAutomationJsonCompletion } from "@/src/modules/growth-automation/infrastructure/growthAutomationLlm";
import type { ContentFamily } from "@/src/modules/growth-automation/domain/growth-automation.types";

export type BlogPostDraft = {
  title: string;
  metaDescription: string;
  slugSuggestion: string;
  outline: string[];
  bodyMarkdown: string;
  cta: string;
  sourceProductOrFeature: string;
};

export async function generateBlogPost(args: {
  topic: string;
  contentFamily: ContentFamily;
  productOrFeature: string;
  link?: string;
}): Promise<BlogPostDraft> {
  const res = await growthAutomationJsonCompletion<BlogPostDraft>({
    system: "SEO-aware blog draft for LECIPM. Markdown body. No keyword stuffing. JSON only.",
    user: JSON.stringify(args),
    label: "blog_post",
  });
  if (!res.ok) {
    return {
      title: args.topic,
      metaDescription: `${args.topic} — practical notes for Quebec real estate buyers and brokers.`,
      slugSuggestion: args.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48),
      outline: ["Context", "Framework", "How LECIPM fits", "Next steps"],
      bodyMarkdown: `## ${args.topic}\n\n${args.productOrFeature} helps teams keep negotiation and documents aligned.\n`,
      cta: "Explore LECIPM for your next deal.",
      sourceProductOrFeature: args.productOrFeature,
    };
  }
  return res.data;
}
