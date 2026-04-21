import {
  INVESTOR_MEMO_VERSION,
  type InvestorMemoPayload,
  type InvestorMemoType,
} from "@/modules/investor/investor.types";
import type { InvestorListingContext } from "@/modules/investor/investor-context.loader";
import { buildExecutiveSummaries } from "@/modules/investor/investor-summary.engine";
import { buildRiskStructuredSummary } from "@/modules/investor/investor-risk-summary.engine";
import { buildEsgNarrativeParts, confidenceFromEsg } from "@/modules/investor/investor-esg-summary.engine";
import { buildAcquisitionSummary } from "@/modules/investor/investor-acquisition-summary.engine";
import { buildRetrofitSummaryText } from "@/modules/investor/investor-retrofit-summary.engine";
import {
  frameInvestmentDecision,
  reconcileProceedGuard,
} from "@/modules/investor/investor-decision-framing.service";

const INTERNAL_DISCLAIMER =
  "LECIPM generates this memo from internal scoring and uploaded artifacts. It is not an offering memorandum, appraisal, or regulated disclosure.";

const ADVICE_DISCLAIMER =
  "Not financial, legal, tax, insurance, or investment advice. Estimates require diligence confirmation.";

function memoTitle(memoType: InvestorMemoType, listingTitle: string): string {
  switch (memoType) {
    case "PRELIMINARY":
      return `Preliminary investor memo — ${listingTitle}`;
    case "ACQUISITION":
      return `Acquisition memo — ${listingTitle}`;
    case "ESG":
      return `ESG investor memo — ${listingTitle}`;
    case "INVESTMENT_UPDATE":
      return `Investment update memo — ${listingTitle}`;
    default:
      return `Investor memo — ${listingTitle}`;
  }
}

export function buildInvestorMemoPayload(
  ctx: InvestorListingContext,
  memoType: InvestorMemoType
): InvestorMemoPayload {
  const risks = buildRiskStructuredSummary(ctx);
  const esgParts = buildEsgNarrativeParts(ctx);
  const acq = buildAcquisitionSummary(ctx);
  const retrofit = buildRetrofitSummaryText(ctx);
  const decision = frameInvestmentDecision(ctx);

  const rec = reconcileProceedGuard(decision.recommendation, risks.criticalRisks.length);

  const strengths = [...risks.strengths].slice(0, 8);
  const riskLines = [...risks.criticalRisks, ...risks.highRisks, ...risks.mediumRisks].slice(0, 12);

  const financingTop = ctx.financingOptions.slice(0, 4).map((f) => `${f.financingType}: ${f.name}${f.provider ? ` (${f.provider})` : ""}`);

  const opt = ctx.optimizerPlan;
  const optimizerSummary = {
    selectedStrategy: opt?.strategyType ?? null,
    objectiveMode: opt?.objectiveMode ?? null,
    headline: opt?.headlineRecommendation ?? opt?.executiveSummary ?? null,
    topRecommendedActions: opt?.actions.slice(0, 6).map((a) => a.title) ?? [],
    expectedDirectionalImprovement:
      typeof opt?.planJson === "object" && opt?.planJson !== null && "expectedReadinessShift" in opt.planJson ?
        String((opt.planJson as { expectedReadinessShift?: unknown }).expectedReadinessShift ?? "")
      : opt?.confidenceLevel ?? null,
  };

  const dataGaps: string[] = [];
  if (!ctx.city && !ctx.province) dataGaps.push("City / province not structured on CRM listing row — location narrative uses title only.");
  if (ctx.yearBuilt == null) dataGaps.push("Year built not on file in linked structured fields.");
  if (ctx.esgProfile == null) dataGaps.push("ESG profile missing — run ESG ensure / scoring.");
  if (ctx.investmentOpportunity == null) dataGaps.push("No stored acquisition opportunity snapshot for scored fit narrative.");

  const confidence = decision.confidenceLevel;

  const esgOneLiner = `${esgParts.scoreLine} ${esgParts.carbonLine}`;
  const acqOneLiner = acq.whyItPassesOrFails;
  const riskOneLiner =
    `${risks.criticalRisks.length} critical / ${risks.highRisks.length} high platform risk lines (advisory).`;
  const nextStepHint =
    decision.proceedConditions[0] ?? "Confirm blockers in Action Center and attach primary evidence.";

  const summaries = buildExecutiveSummaries({
    memoTypeLabel: memoTitle(memoType, ctx.listing.title),
    listingTitle: ctx.listing.title,
    recommendationLabel: rec,
    confidence,
    esgOneLiner,
    acquisitionOneLiner: acqOneLiner,
    riskOneLiner,
    nextStepHint,
  });

  const verifiedDisclaimer =
    "Verified fields come from uploaded documents when parsed successfully; all other quantitative fields should be treated as estimated unless separately confirmed.";

  const partialOutput = dataGaps.length >= 3 || (ctx.esgProfile == null && ctx.investmentOpportunity == null);

  const payload: InvestorMemoPayload = {
    schemaVersion: INVESTOR_MEMO_VERSION,
    memoType,
    generatedAt: new Date().toISOString(),
    listing: {
      id: ctx.listing.id,
      title: ctx.listing.title,
      city: ctx.city,
      province: ctx.province,
      buildingType: ctx.listing.listingType,
      yearBuilt: ctx.yearBuilt,
      area: ctx.buildingFootprintHint,
      askingPriceIfAvailable: ctx.listing.price,
      priceLabel: "LISTED_ASK",
    },
    dataGaps,
    headline: {
      recommendation: rec,
      confidenceLevel: decision.confidenceLevel,
      shortSummary: decision.rationale.slice(0, 500),
    },
    executiveSummary: summaries.concise,
    executiveSummaryBoard: summaries.boardReady,
    strengths,
    risks: riskLines,
    esgSummary: {
      esgScore: ctx.esgProfile?.compositeScore ?? null,
      esgGrade: ctx.esgProfile?.grade ?? null,
      confidenceLevel: confidenceFromEsg(ctx),
      evidenceCoveragePercent: ctx.esgProfile?.dataCoveragePercent ?? null,
      topDrivers: esgParts.drivers.length > 0 ? esgParts.drivers : ["No positive drivers distinguished beyond base profile fields."],
      keyGaps: esgParts.gaps.length > 0 ? esgParts.gaps : ["Evidence depth not yet sufficient for narrow ESG assertions."],
      carbonSummary: esgParts.carbonLine,
      verifiedVsEstimatedNote: esgParts.verifiedNote,
    },
    acquisitionSummary: {
      acquisitionScore: acq.acquisitionScore,
      acquisitionGrade: acq.acquisitionGrade,
      screenStatus: acq.screenStatus,
      investorFit: acq.investorFit,
      whyItPassesOrFails: acq.whyItPassesOrFails,
    },
    retrofitSummary: {
      planType: retrofit.planType,
      topActions: retrofit.topActions,
      costBand: retrofit.costBand,
      impactBand: retrofit.impactBand,
      timelineBand: retrofit.timelineBand,
    },
    financingSummary: {
      financingFit: retrofit.financingFit,
      topOptions: financingTop,
    },
    optimizerSummary,
    keyAssumptions: [
      "Platform scores and bands are directional and depend on ingestion freshness.",
      "Acquisition opportunity row, when present, is an internal estimate — not third-party validated.",
    ],
    keyOpenQuestions: [
      ...decision.proceedConditions.map((s) => `Condition / diligence: ${s}`),
      ...dataGaps.map((g) => `Data gap: ${g}`),
    ].slice(0, 12),
    nextSteps: [
      ...ctx.esgActionsOpen
        .filter((a) => ["CRITICAL", "HIGH"].includes(a.priority))
        .slice(0, 5)
        .map((a) => `Prioritize Action Center item: ${a.title}`),
      `Re-evaluate recommendation after evidence confidence moves materially (current tier: ${confidenceFromEsg(ctx)}).`,
    ],
    disclaimers: {
      verifiedVsEstimated: verifiedDisclaimer,
      internalToolDisclaimer: INTERNAL_DISCLAIMER,
      adviceDisclaimer: ADVICE_DISCLAIMER,
    },
    decisionTrace: {
      rationale: decision.rationale,
      sourceSignals: decision.sourceSignals,
    },
    partialOutput,
  };

  return payload;
}

export { memoTitle };
