import type { ContentAudience, ContentGoal } from "@/modules/marketing-content/content-calendar.types";

import type { GeneratedMarketingPack } from "./marketing-ai.types";

export type GeneratorInput = {
  audience: ContentAudience;
  goal: ContentGoal;
  topic: string;
  /** Optional tone tweak */
  trend?: string;
};

function audienceVoice(a: ContentAudience): string {
  switch (a) {
    case "BROKER":
      return "broker building a predictable pipeline";
    case "INVESTOR":
      return "investor evaluating yield and risk";
    case "BUYER":
      return "buyer navigating a noisy market";
    default:
      return "professional audience exploring LECIPM / BNHub";
  }
}

function goalAngle(g: ContentGoal): string {
  switch (g) {
    case "LEADS":
      return "qualified conversations";
    case "CONVERSION":
      return "signed deals and revenue";
    default:
      return "trust and recall";
  }
}

/**
 * Deterministic, template-first generation (no external LLM).
 * Replace with LLM adapter later while keeping the same contract.
 */
export function generateMarketingPack(input: GeneratorInput): GeneratedMarketingPack {
  const trend = input.trend?.trim();
  const topic = input.topic.trim() || "market momentum";
  const hook = `Want more ${goalAngle(input.goal)} without chasing noise? Here’s one move on “${topic}”${trend ? ` (${trend})` : ""}.`;

  const script = [
    `[0-3s] Hook: ${hook.split("?")[0]}?`,
    `[3-12s] Proof: one concrete outcome LECIPM users see in ${audienceVoice(input.audience)}.`,
    `[12-22s] How: one workflow — capture → qualify → book → close.`,
    `[22-28s] CTA: comment “PIPELINE” or tap link — we’ll route you.`,
  ].join("\n");

  const caption = `${hook}\n\nBNHub · LECIPM — built for serious operators.\n\n#RealEstate #BNHub #LECIPM`;

  const cta =
    input.goal === "LEADS"
      ? "Book a 15-min pipeline review — link in bio."
      : input.goal === "CONVERSION"
        ? "See pricing fit for your market — DM “CLOSE”."
        : "Follow for weekly plays that compound.";

  return { hook, script, caption, cta };
}
