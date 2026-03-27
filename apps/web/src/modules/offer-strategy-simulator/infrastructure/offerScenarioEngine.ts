import { prisma } from "@/lib/db";
import { getLegalGraphSummary } from "@/src/modules/legal-intelligence-graph/application/getLegalGraphSummary";
import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";
import { ImpactBand } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import type {
  ImpactVector,
  ListingSimulationContext,
  OfferScenarioInput,
  OfferSimulationResult,
} from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import {
  SIMULATOR_DISCLAIMER,
  computeSimulationConfidence,
  softenStrategyLine,
} from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioPolicyService";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function bandFromScore(score: number): ImpactBand {
  if (score >= 72) return ImpactBand.Favorable;
  if (score >= 48) return ImpactBand.Neutral;
  if (score >= 28) return ImpactBand.Caution;
  return ImpactBand.Elevated;
}

/** Raw risk 0–100; higher = more risk. Maps to bands (Elevated = highest risk). */
function bandForRisk(raw: number): ImpactBand {
  if (raw >= 72) return ImpactBand.Elevated;
  if (raw >= 52) return ImpactBand.Caution;
  if (raw >= 32) return ImpactBand.Neutral;
  return ImpactBand.Favorable;
}

function impactVectorRisk(rawRisk: number): ImpactVector {
  return {
    score: clamp(Math.round(rawRisk), 0, 100),
    band: bandForRisk(rawRisk),
    summary: "Higher means more modeled risk to resolve before firming (price vs list, file gaps, conditions).",
  };
}

/** Risk score: higher = more risk for proceeding (deterministic). */
function riskScoreForScenario(input: OfferScenarioInput, ctx: ListingSimulationContext): number {
  const ratio = input.offerPriceCents / listPrice(ctx);
  let r = 40 + (ctx.riskScore ?? 35) * 0.25;
  if (ratio < 0.9) r += 22;
  else if (ratio < 0.95) r += 12;
  else if (ratio > 1.02) r += 8;
  r += ctx.blockerCount * 10;
  r += ctx.contradictionCount * 12;
  r += Math.max(0, 85 - ctx.completenessPercent) * 0.35;
  if (input.depositAmountCents != null && input.depositAmountCents < input.offerPriceCents * 0.03) r += 6;
  if (!input.financingCondition) r += 8;
  if (!input.inspectionCondition) r += 6;
  if (!input.documentReviewCondition) r += 5;
  return clamp(Math.round(r), 0, 100);
}

function listPrice(ctx: ListingSimulationContext): number {
  return Math.max(1, ctx.listPriceCents);
}

function dealScore(input: OfferScenarioInput, ctx: ListingSimulationContext): number {
  const ratio = input.offerPriceCents / listPrice(ctx);
  let s = 55 + (ctx.trustScore ?? 50) * 0.2;
  if (ratio >= 0.98 && ratio <= 1.01) s += 12;
  else if (ratio < 0.95) s -= 10;
  else if (ratio > 1.03) s -= 5;
  s -= ctx.blockerCount * 5;
  return clamp(Math.round(s), 0, 100);
}

function leverageScore(input: OfferScenarioInput, ctx: ListingSimulationContext): number {
  const ratio = input.offerPriceCents / listPrice(ctx);
  let l = 50;
  if (ratio < 0.97) l += 15;
  if (input.financingCondition && input.inspectionCondition && input.documentReviewCondition) l += 12;
  else l -= 8;
  if (ctx.blockerCount > 0) l -= 10;
  l += (ctx.trustScore ?? 50) * 0.1;
  return clamp(Math.round(l), 0, 100);
}

function readinessScore(input: OfferScenarioInput, ctx: ListingSimulationContext): number {
  let r = ctx.completenessPercent * 0.65;
  r += (input.financingCondition ? 8 : 0) + (input.inspectionCondition ? 8 : 0) + (input.documentReviewCondition ? 7 : 0);
  r -= ctx.blockerCount * 12;
  r -= ctx.contradictionCount * 10;
  if (input.occupancyDate && input.signatureDate) r += 4;
  return clamp(Math.round(r), 0, 100);
}

function vector(score: number, highIsGood: boolean, kind: "deal" | "leverage" | "risk" | "readiness"): ImpactVector {
  const display = highIsGood ? score : 100 - score;
  const band = bandFromScore(display);
  const summaries: Record<string, string> = {
    deal: "How the illustrated offer lines up with the listing price and listing signals on file.",
    leverage: "Illustrative balance of conditions vs. price position — not a prediction of acceptance.",
    risk: "Higher means more items to resolve before firming (file gaps, conditions, or price position).",
    readiness: "How prepared the file and conditions look for next steps in this model only.",
  };
  return {
    score: display,
    band,
    summary: summaries[kind],
  };
}

export async function loadListingSimulationContext(propertyId: string): Promise<ListingSimulationContext | null> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: propertyId },
    select: { id: true, priceCents: true, riskScore: true, trustScore: true },
  });
  if (!listing) return null;

  const draft = await prisma.sellerDeclarationDraft.findFirst({
    where: { listingId: propertyId },
    orderBy: { updatedAt: "desc" },
    select: { draftPayload: true },
  });
  const payload = (draft?.draftPayload ?? {}) as Record<string, unknown>;
  const validation = runDeclarationValidationDeterministic(payload);

  let graphBlockers = 0;
  let graphWarnings = 0;
  try {
    const g = await getLegalGraphSummary(propertyId);
    graphBlockers = g.blockingIssues.length;
    graphWarnings = g.warnings.length;
  } catch {
    /* optional */
  }

  return {
    propertyId: listing.id,
    listPriceCents: listing.priceCents,
    riskScore: listing.riskScore,
    trustScore: listing.trustScore,
    completenessPercent: validation.completenessPercent,
    blockerCount: graphBlockers,
    warningCount: graphWarnings + validation.warningFlags.length,
    contradictionCount: validation.contradictionFlags.length,
  };
}

export function runOfferScenarioSimulation(
  input: OfferScenarioInput,
  ctx: ListingSimulationContext,
): OfferSimulationResult {
  const d = dealScore(input, ctx);
  const lv = leverageScore(input, ctx);
  const rk = riskScoreForScenario(input, ctx);
  const rd = readinessScore(input, ctx);

  const dealImpact = vector(d, true, "deal");
  const leverageImpact = vector(lv, true, "leverage");
  const riskImpact = impactVectorRisk(rk);
  const readinessImpact = vector(rd, true, "readiness");

  const confidence = computeSimulationConfidence(ctx);
  const warnings: string[] = [];
  if (ctx.blockerCount > 0) warnings.push(`Legal graph: ${ctx.blockerCount} blocking issue(s) on file — clarify before firming.`);
  if (ctx.contradictionCount > 0) warnings.push("Declaration validation flagged possible contradictions — resolve with your representative.");
  if (input.offerPriceCents / listPrice(ctx) < 0.92) warnings.push("Offer is far below list price on file — higher risk of rejection or counter (illustration only).");
  if (ctx.completenessPercent < 85) warnings.push("Disclosure completeness is not full — protections and timelines are especially important.");
  if (!input.financingCondition || !input.inspectionCondition) warnings.push("Missing common conditions — risk may be understated for your situation.");

  const protections: string[] = [];
  if (input.financingCondition) protections.push("Keep financing condition dates aligned with your lender pre-approval.");
  if (input.inspectionCondition) protections.push("Inspection clause with realistic deadlines (professional inspection required).");
  if (input.documentReviewCondition) protections.push("Document review / title review consistent with your lawyer’s advice.");
  if (protections.length === 0) protections.push("Consider adding financing, inspection, and document-review conditions — discuss with your broker.");

  const nextActions: string[] = [];
  if (ctx.blockerCount > 0) nextActions.push("Clear or document legal graph blockers shown in the case.");
  nextActions.push("Confirm offer price and deposit against your client instructions.");
  if (ctx.completenessPercent < 100) nextActions.push("Complete outstanding disclosure fields where possible.");
  nextActions.push("Have your broker or lawyer review before any binding offer.");

  let strategy = "Balanced: keep conditions explicit and align dates with lender and inspector availability.";
  if (rk >= 70) strategy = "Caution: reduce risk first — clarify file issues and tighten conditions before aggressive price moves.";
  else if (rd >= 70 && rk < 45) strategy = "Proceed-with-conditions: file readiness is reasonable; keep standard protections.";
  if (input.userStrategyMode?.includes("flip") || input.userStrategyMode?.includes("invest")) {
    strategy = `${strategy} (Investor mode: stress-test costs outside this tool.)`;
  }
  strategy = softenStrategyLine(confidence, strategy);

  return {
    dealImpact,
    leverageImpact,
    riskImpact,
    readinessImpact,
    recommendedStrategy: strategy,
    keyWarnings: warnings.slice(0, 8),
    recommendedProtections: protections,
    nextActions,
    confidence,
    disclaimer: SIMULATOR_DISCLAIMER,
  };
}
