import type { AiCeoExplanation, AiCeoPlatformContext, AiCeoSignalRef } from "@/modules/ai-ceo/ai-ceo.types";

export function buildExplanation(params: {
  title: string;
  signals: AiCeoSignalRef[];
  triggers: string[];
  whyItMatters: string;
  ifIgnored: string;
  dataBasisNote: string;
  confidenceRationale: string;
}): AiCeoExplanation {
  return {
    dataTriggers: params.triggers,
    signalsContributing: params.signals,
    whyItMatters: params.whyItMatters,
    ifIgnored: params.ifIgnored,
    dataBasisNote: params.dataBasisNote,
    confidenceRationale: params.confidenceRationale,
  };
}

export function thinDataDisclaimer(ctx: AiCeoPlatformContext): string {
  if (ctx.coverage?.thinDataWarnings?.length) {
    return `Coverage gaps: ${ctx.coverage.thinDataWarnings.join("; ")} — interpret confidence as directional only.`;
  }
  return "Signals are aggregated from production telemetry where available; sparse regions reduce statistical power.";
}
