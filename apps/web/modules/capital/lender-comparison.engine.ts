import type { InvestmentPipelineFinancingOffer } from "@prisma/client";
import type { OfferComparisonResult } from "@/modules/capital/capital.types";

function scoreCompleteness(o: InvestmentPipelineFinancingOffer): number {
  let n = 0;
  let d = 0;
  const fields = [
    o.principalAmount,
    o.interestRateText,
    o.amortizationText,
    o.termText,
    o.feesText,
    o.recourseType,
    o.covenantSummary,
  ] as const;
  for (const f of fields) {
    d += 1;
    if (f != null && String(f).trim() !== "") n += 1;
  }
  return d === 0 ? 0 : n / d;
}

function constraintBurdenHint(o: InvestmentPipelineFinancingOffer): number {
  let burden = 0;
  const cov = (o.covenantSummary ?? "").length;
  burden += Math.min(cov / 400, 1);

  const risks = o.risksJson;
  if (Array.isArray(risks)) burden += Math.min(risks.length * 0.08, 0.5);

  const str = `${o.feesText ?? ""} ${o.termText ?? ""}`.toLowerCase();
  if (str.includes("covenant")) burden += 0.05;
  if (str.includes("report")) burden += 0.03;
  return burden;
}

/**
 * Rank offers heuristically; never asserts a single “best” when data is incomplete.
 */
export function compareFinancingOffers(offers: InvestmentPipelineFinancingOffer[]): OfferComparisonResult {
  const explanation: string[] = [];

  if (offers.length === 0) {
    return {
      offers: [],
      ranking: [],
      strongestOfferId: null,
      lowestConstraintOfferId: null,
      mostFlexibleOfferId: null,
      highestExecutionRiskOfferId: null,
      explanation: ["No financing offers recorded for comparison."],
    };
  }

  const incomplete = offers.some((o) => scoreCompleteness(o) < 0.55);
  if (incomplete) {
    explanation.push(
      "Several offers appear incomplete — ranking is indicative only and requires further clarification on missing terms."
    );
  }

  const scored = offers.map((o) => ({
    o,
    completeness: scoreCompleteness(o),
    burden: constraintBurdenHint(o),
    principal: o.principalAmount ?? 0,
  }));

  scored.sort((a, b) => {
    const byComp = b.completeness - a.completeness;
    if (Math.abs(byComp) > 1e-6) return byComp;
    const byPrincipal = b.principal - a.principal;
    if (Math.abs(byPrincipal) > 1e-6) return byPrincipal;
    return a.burden - b.burden;
  });

  const ranking = scored.map((s) => s.o.id);

  let lowestConstraintOfferId: string | null = null;
  let minBurden = Infinity;
  for (const s of scored) {
    if (s.burden < minBurden) {
      minBurden = s.burden;
      lowestConstraintOfferId = s.o.id;
    }
  }

  let mostFlexibleOfferId = lowestConstraintOfferId;

  let highestExecutionRiskOfferId: string | null = null;
  let maxRiskScore = -Infinity;
  for (const o of offers) {
    const risks = o.risksJson;
    const riskScore = Array.isArray(risks) ? risks.length : 0;
    if (riskScore > maxRiskScore) {
      maxRiskScore = riskScore;
      highestExecutionRiskOfferId = o.id;
    }
  }

  const strongestOfferId = scored[0]?.o.id ?? null;

  explanation.push(
    strongestOfferId ?
      `Offer ${strongestOfferId} appears strongest based on currently available terms (completeness-weighted — not underwriting advice).`
    : "Unable to designate a strongest offer."
  );
  explanation.push(
    lowestConstraintOfferId ?
      `Lowest modeled covenant / fee burden among rows with comparable text fields: ${lowestConstraintOfferId}.`
    : "Constraint comparison skipped."
  );

  return {
    offers: offers.map((o) => ({
      id: o.id,
      label: o.offerName,
      scoreHint: scoreCompleteness(o),
    })),
    ranking,
    strongestOfferId,
    lowestConstraintOfferId,
    mostFlexibleOfferId,
    highestExecutionRiskOfferId:
      maxRiskScore > 0 ? highestExecutionRiskOfferId : null,
    explanation,
  };
}
