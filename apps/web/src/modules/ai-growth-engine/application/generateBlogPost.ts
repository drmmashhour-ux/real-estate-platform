import type { BlogPost } from "@/src/modules/ai-growth-engine/domain/growth.types";
import { growthJsonCompletion } from "@/src/modules/ai-growth-engine/infrastructure/growthLlm";

const SYSTEM = `You write SEO-aware blog outlines for a Quebec real estate platform. Simple language. Include meta description. No legal advice. JSON only.`;

export async function generateBlogPost(args: { topic: string; keywords?: string[] }): Promise<BlogPost> {
  const out = await growthJsonCompletion<BlogPost>({
    system: SYSTEM,
    user: JSON.stringify({
      topic: args.topic,
      keywords: args.keywords ?? [],
      shape: {
        title: "string",
        slugSuggestion: "string",
        excerpt: "string",
        sections: [{ heading: "string", body: "string" }],
        cta: "string",
        metaDescription: "string",
      },
    }),
  });
  if (!out.ok) {
    return {
      title: args.topic,
      slugSuggestion: args.topic.toLowerCase().replace(/\s+/g, "-").slice(0, 48),
      excerpt: "Educational overview — not legal advice.",
      sections: [
        { heading: "Overview", body: "Plain-language context for Quebec readers." },
        { heading: "What to verify", body: "Checklist-style points; consult a professional for your case." },
      ],
      cta: "Talk to a licensed broker or notary for binding guidance.",
      metaDescription: `${args.topic} — educational article on LECIPM.`,
    };
  }
  return out.data;
}
