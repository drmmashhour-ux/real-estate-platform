import { SimulationConfidence } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import type { ListingSimulationContext } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";

export const SIMULATOR_DISCLAIMER =
  "This simulator uses platform data only. It is an advisory review tool — not legal, tax, or investment advice. It does not predict acceptance, price, or timing. No offer is created here; your professional must review any real transaction.";

export function computeSimulationConfidence(ctx: ListingSimulationContext): SimulationConfidence {
  if (ctx.blockerCount > 0 || ctx.contradictionCount > 0) return SimulationConfidence.Low;
  if (ctx.completenessPercent < 75) return SimulationConfidence.Low;
  if (ctx.completenessPercent < 90 || ctx.warningCount > 4) return SimulationConfidence.Medium;
  return SimulationConfidence.High;
}

export function softenStrategyLine(confidence: SimulationConfidence, line: string): string {
  if (confidence === SimulationConfidence.Low) {
    return `${line} (Uncertainty is high — treat as discussion-only until documents and blockers are cleared.)`;
  }
  if (confidence === SimulationConfidence.Medium) {
    return `${line} (Verify details with your broker before relying on this illustration.)`;
  }
  return line;
}

export function assertOfferInputs(offerPriceCents: number, listPriceCents: number): string | null {
  if (!Number.isFinite(offerPriceCents) || offerPriceCents <= 0) return "offerPriceCents must be a positive number.";
  if (!Number.isFinite(listPriceCents) || listPriceCents <= 0) return "Listing price missing or invalid.";
  return null;
}
