import { ImpactBand } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import { SimulationConfidence } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import type { OfferSimulationResult, ScenarioComparisonResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";

/** Client-facing risk label — no numeric scores. */
export function riskLevelLabel(band: ImpactBand): string {
  switch (band) {
    case ImpactBand.Favorable:
      return "Lower concern";
    case ImpactBand.Neutral:
      return "Moderate";
    case ImpactBand.Caution:
      return "Needs attention";
    case ImpactBand.Elevated:
      return "Higher concern";
    default:
      return "Moderate";
  }
}

export function readinessStatusLabel(band: ImpactBand): string {
  switch (band) {
    case ImpactBand.Favorable:
      return "Ready to discuss";
    case ImpactBand.Neutral:
      return "Mostly ready";
    case ImpactBand.Caution:
      return "Needs more prep";
    case ImpactBand.Elevated:
      return "Not ready yet";
    default:
      return "Mostly ready";
  }
}

function riskExplanation(band: ImpactBand): string {
  switch (band) {
    case ImpactBand.Favorable:
      return "This illustration looks relatively balanced for the information on file.";
    case ImpactBand.Neutral:
      return "There are a few moving parts — worth confirming before you commit.";
    case ImpactBand.Caution:
      return "Some items should be cleared up before you treat this as final.";
    case ImpactBand.Elevated:
      return "Several items need attention before this scenario is comfortable to rely on.";
    default:
      return "Review the details with your advisor.";
  }
}

/** Strip internal parentheticals from engine strategy line for client view. */
export function presentationStrategyLine(result: OfferSimulationResult): string {
  let s = result.recommendedStrategy
    .replace(/\s*\([^)]*Uncertainty[^)]*\)/gi, "")
    .replace(/\s*\([^)]*Verify details[^)]*\)/gi, "")
    .replace(/\s*\([^)]*discussion-only[^)]*\)/gi, "")
    .trim();
  if (result.confidence === SimulationConfidence.Low) {
    s = `${s} We suggest treating this as a conversation starter, not a conclusion.`.trim();
  }
  return s.length > 320 ? `${s.slice(0, 317)}…` : s;
}

export function presentationSummaryLines(result: OfferSimulationResult): string[] {
  const strategy = presentationStrategyLine(result);
  const first = strategy.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ") || strategy;
  const lines: string[] = [];
  if (first) lines.push(first);
  if (lines.length < 2) {
    lines.push(`Risk picture: ${riskLevelLabel(result.riskImpact.band).toLowerCase()}. Readiness: ${readinessStatusLabel(result.readinessImpact.band).toLowerCase()}.`);
  }
  return lines.slice(0, 3);
}

export function whyThisStrategy(result: OfferSimulationResult): string {
  const r = riskLevelLabel(result.riskImpact.band);
  const ready = readinessStatusLabel(result.readinessImpact.band);
  if (result.confidence === SimulationConfidence.Low) {
    return `With limited certainty from the file, we still show how this offer mix lines up. Focus on clearing open items with your advisor before you rely on these numbers.`;
  }
  if (result.riskImpact.band === ImpactBand.Elevated || result.riskImpact.band === ImpactBand.Caution) {
    return `This combination is on the ${r.toLowerCase()} side in our illustration — usually because price, conditions, or missing information pull in different directions. ${ready} is what we’d expect until those pieces align.`;
  }
  return `This mix is a reasonable way to frame price and conditions for discussion. The ${ready.toLowerCase()} signal means your next step is mostly about confirming details, not fixing major gaps.`;
}

export function primaryNextStep(result: OfferSimulationResult): string {
  const first = result.nextActions[0]?.trim();
  if (first) {
    return first
      .replace(/legal graph/gi, "file")
      .replace(/blockers/gi, "open items")
      .replace(/case\./gi, "file.");
  }
  return "Review this illustration with your broker or lawyer before making an offer.";
}

export function filterPresentationWarnings(warnings: string[]): string[] {
  return warnings
    .map((w) =>
      w
        .replace(/Legal graph:/gi, "On file:")
        .replace(/blocking issue/gi, "item to clarify")
        .replace(/Declaration validation/gi, "Review"),
    )
    .filter(Boolean)
    .slice(0, 3);
}

export function formatMoneyCents(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function timelineLine(occupancyDate: string | null, signatureDate: string | null): string {
  const parts: string[] = [];
  if (signatureDate) parts.push(`Target signing: ${signatureDate}`);
  if (occupancyDate) parts.push(`Occupancy: ${occupancyDate}`);
  if (parts.length === 0) return "Timeline: not set in this illustration — add dates with your advisor.";
  return parts.join(" · ");
}

export function riskNarrative(result: OfferSimulationResult): string {
  return riskExplanation(result.riskImpact.band);
}

/** Compare view: no internal ids, no confidence. */
export function clientCompareIntro(c: ScenarioComparisonResult): string {
  const best = c.scenarios.find((s) => s.id === c.bestRiskAdjustedScenarioId)?.label ?? "one of these";
  return `These three are illustrations only — not predictions. In this model, ${best} shows the lightest strain. Your advisor can help you pick what fits your situation.`;
}
