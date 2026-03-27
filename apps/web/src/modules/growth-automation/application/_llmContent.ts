import { growthAutomationJsonCompletion } from "@/src/modules/growth-automation/infrastructure/growthAutomationLlm";
import type { ContentFamily, DraftPayload, StructuredContent } from "@/src/modules/growth-automation/domain/growth-automation.types";

export async function generateStructuredDraft(args: {
  channelLabel: string;
  topic: string;
  contentFamily: ContentFamily;
  productOrFeature: string;
  link?: string;
  extraRules?: string;
}): Promise<DraftPayload> {
  const res = await growthAutomationJsonCompletion<StructuredContent & { hashtags?: string[]; title?: string }>({
    system: `You write LECIPM marketing copy for ${args.channelLabel}. Quebec real estate legal-tech. Simple language, strong hook, one CTA. JSON only.`,
    user: `Topic: ${args.topic}
Content family: ${args.contentFamily}
Product/feature: ${args.productOrFeature}
Link: ${args.link ?? "none"}
${args.extraRules ?? ""}
Return JSON: { "hook", "body", "cta", "sourceProductOrFeature", "channelNotes?", "hashtags?", "title?" }`,
    label: `draft_${args.channelLabel}`,
  });
  if (!res.ok) {
    return {
      hook: `Before you sign: ${args.topic}`,
      body: `Quick take: focus on ${args.productOrFeature}. ${args.topic}. Keep documents and negotiation steps in one auditable place.`,
      cta: "See how LECIPM structures your deal — request access.",
      sourceProductOrFeature: args.productOrFeature,
    };
  }
  const d = res.data;
  return {
    hook: d.hook,
    body: d.body,
    cta: d.cta,
    sourceProductOrFeature: d.sourceProductOrFeature || args.productOrFeature,
    channelNotes: d.channelNotes,
    hashtags: d.hashtags,
    title: d.title,
  };
}
