import { platformPostingRules } from "@/src/modules/ai-growth-engine/domain/growth.policies";
import type { GrowthPlatform, PlatformAdaptation } from "@/src/modules/ai-growth-engine/domain/growth.types";

/** Deterministic adaptation (no LLM) — keeps behavior testable and platform-safe. */
export function adaptContentForPlatform(args: {
  platform: GrowthPlatform;
  baseCopy: string;
  title?: string;
}): PlatformAdaptation {
  const rule = platformPostingRules(args.platform);
  switch (args.platform) {
    case "tiktok":
      return {
        platform: "tiktok",
        body: `${args.baseCopy.slice(0, 280)}\n\n#RealEstate #Quebec`,
        extras: { rule, maxChars: "300" },
      };
    case "youtube":
      return {
        platform: "youtube",
        body: `${args.title ? `Title: ${args.title}\n\n` : ""}${args.baseCopy}\n\nChapters: (0:00) Hook (0:20) Context (1:00) Takeaway`,
        extras: { rule, description: "Long-form description + timestamps" },
      };
    case "instagram":
      return {
        platform: "instagram",
        body: `📌 ${args.title ?? "Tip"}\n\n${args.baseCopy.slice(0, 2000)}`,
        extras: { rule, visualNote: "Pair with a still or carousel" },
      };
    case "linkedin":
      return {
        platform: "linkedin",
        body: `${args.baseCopy}\n\n— Educational context only; not legal advice.`,
        extras: { rule },
      };
    case "blog":
      return {
        platform: "blog",
        body: `# ${args.title ?? "Article"}\n\n${args.baseCopy}\n\n_Last updated: auto-generated draft_`,
        extras: { rule, seo: "Add meta title/description in CMS" },
      };
    case "email":
      return {
        platform: "email",
        body: args.baseCopy,
        extras: { rule, footer: "Include unsubscribe + physical address in production sends" },
      };
    case "x":
      return {
        platform: "x",
        body: args.baseCopy.slice(0, 260),
        extras: { rule },
      };
    default:
      return { platform: "linkedin", body: args.baseCopy, extras: { rule } };
  }
}
