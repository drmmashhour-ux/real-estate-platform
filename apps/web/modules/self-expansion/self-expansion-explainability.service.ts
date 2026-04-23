import type { ExpansionExplanation, ExpansionSignalRef, TerritoryExpansionProfile } from "@/modules/self-expansion/self-expansion.types";

export function thinExpansionDisclaimer(ctx: { thinDataWarnings: string[] }): string {
  if (ctx.thinDataWarnings.length) {
    return `Coverage gaps: ${ctx.thinDataWarnings.join("; ")} — scores are directional; validate with market counsel before commitments.`;
  }
  return "Signals blend domination dashboard seeds, playbook proxies, and configurable readiness — not a compliance determination.";
}

export function buildExpansionExplanation(params: {
  territory: TerritoryExpansionProfile;
  signals: ExpansionSignalRef[];
  whyPrioritized: string;
  whyThisHub: string;
  majorRisks: string[];
  phaseRationale: string;
  dataBasisNote: string;
}): ExpansionExplanation {
  return {
    dataContributors: params.signals,
    whyPrioritized: params.whyPrioritized,
    whyThisHub: params.whyThisHub,
    majorRisks: params.majorRisks,
    phaseRationale: params.phaseRationale,
    dataBasisNote: params.dataBasisNote,
  };
}
