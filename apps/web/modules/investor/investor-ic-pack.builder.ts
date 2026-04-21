import { INVESTOR_IC_PACK_VERSION, type InvestorIcPackPayload } from "@/modules/investor/investor.types";
import type { InvestorListingContext } from "@/modules/investor/investor-context.loader";
import { buildRiskStructuredSummary } from "@/modules/investor/investor-risk-summary.engine";
import { buildEsgNarrativeParts, confidenceFromEsg } from "@/modules/investor/investor-esg-summary.engine";
import { buildAcquisitionSummary } from "@/modules/investor/investor-acquisition-summary.engine";
import { buildRetrofitSummaryText } from "@/modules/investor/investor-retrofit-summary.engine";
import {
  frameInvestmentDecision,
  reconcileProceedGuard,
} from "@/modules/investor/investor-decision-framing.service";

const INTERNAL_DISCLAIMER =
  "Internal LECIPM committee support document. Not for public distribution. Not a securities offering or investment advice.";

const ADVICE_DISCLAIMER =
  "All figures and scores are based on available platform data; third-party professional review is required for credit, legal, and tax decisions.";

export function buildInvestorIcPackPayload(
  ctx: InvestorListingContext,
  options?: { decisionStage?: string }
): InvestorIcPackPayload {
  const stage = options?.decisionStage?.trim() || "IC_REVIEW";
  const risks = buildRiskStructuredSummary(ctx);
  const esg = buildEsgNarrativeParts(ctx);
  const acq = buildAcquisitionSummary(ctx);
  const retrofit = buildRetrofitSummaryText(ctx);
  const decision = frameInvestmentDecision(ctx);
  const rec = reconcileProceedGuard(decision.recommendation, risks.criticalRisks.length);

  const openActions = ctx.esgActionsOpen;
  const topImmediate = openActions
    .filter((a) => a.priority === "CRITICAL" || a.status === "BLOCKED")
    .slice(0, 6)
    .map((a) => `${a.title} [${a.status}]`);
  const quickWins = openActions
    .filter((a) => a.reasonCode.includes("QUICK") || a.title.toLowerCase().includes("document"))
    .slice(0, 5)
    .map((a) => a.title);
  const strategic = openActions
    .filter((a) => a.priority === "HIGH" || a.priority === "MEDIUM")
    .slice(0, 6)
    .map((a) => a.title);

  const opt = ctx.optimizerPlan;
  const optActions = opt?.actions.map((a) => a.title) ?? [];
  const optDirection =
    opt?.headlineRecommendation ?? opt?.executiveSummary ?? "See optimization plan JSON in source system (directional).";

  const loc = [ctx.city, ctx.province].filter(Boolean).join(", ") || "Location not structured in CRM — use title and external records.";

  const blockers: string[] = [];
  for (const c of risks.criticalRisks) blockers.push(c);
  for (const a of openActions.filter((x) => x.status === "BLOCKED")) blockers.push(`Blocked: ${a.title}`);

  const requiredDiligence: string[] = [
    "Title, environmental, and zoning review by qualified professionals.",
    "Validate any **estimated** ESG and financial fields with source documents.",
    ...decision.proceedConditions,
  ].slice(0, 12);

  const dataGaps: string[] = [];
  if (ctx.esgProfile == null) dataGaps.push("ESG profile absent");
  if (ctx.investmentOpportunity == null) dataGaps.push("No investment opportunity record");
  if (ctx.evidenceCounts.documents === 0) dataGaps.push("No ESG documents ingested");

  const partialOutput = dataGaps.length >= 2;

  return {
    schemaVersion: INVESTOR_IC_PACK_VERSION,
    generatedAt: new Date().toISOString(),
    cover: {
      listingTitle: ctx.listing.title,
      date: new Date().toISOString().slice(0, 10),
      reportType: `Investment Committee Pack (${stage})`,
      recommendation: rec,
      confidenceLevel: decision.confidenceLevel,
      listingCode: ctx.listing.listingCode,
    },
    investmentThesis: {
      summary: `Institutional review of **${ctx.listing.title}** using LECIPM’s structured ESG, action, and (where present) acquisition screens. All judgements are conservative and evidence-tied.`,
      whyNow: `Asking context: **$${ctx.listing.price.toLocaleString()}** (list / CRM; not a valuation). ${esg.carbonLine.slice(0, 220)}`,
      whyThisAsset:
        ctx.retrofitPlan ?
          `Retrofit pathway modeled (${ctx.retrofitPlan.strategyType}) — execution depends on capex and incentive eligibility confirmation.`
        : "Retrofit planner output may not be present — decarbonization path is not yet fully specified in-tool.",
      strategicFit: acq.investorFit ? `Screening fit tag: ${acq.investorFit}.` : "Screening fit not available from stored opportunity row.",
    },
    assetSnapshot: {
      location: loc,
      type: ctx.listing.listingType,
      size: ctx.buildingFootprintHint,
      yearBuilt: ctx.yearBuilt,
      assetHighlights: strengthsHighlights(ctx),
    },
    decisionFrame: {
      recommendation: rec,
      proceedConditions: decision.proceedConditions,
      noGoTriggers: decision.noGoTriggers,
    },
    riskAssessment: {
      criticalRisks: risks.criticalRisks.slice(0, 12),
      highRisks: risks.highRisks.slice(0, 12),
      mediumRisks: risks.mediumRisks.slice(0, 10),
      mitigants: risks.mitigants.slice(0, 10),
    },
    esgSection: {
      esgScore: ctx.esgProfile?.compositeScore ?? null,
      confidenceLevel: confidenceFromEsg(ctx),
      carbonSummary: esg.carbonLine,
      evidenceStrength:
        ctx.evidenceCounts.documents > 2 ?
          `Moderate ingestion depth (${ctx.evidenceCounts.documents} docs, ${ctx.evidenceCounts.evidenceRows} evidence rows).`
        : "Thin evidence trail — expand uploads before relying on numeric scores.",
      redFlags: [...risks.criticalRisks, ...risks.highRisks].slice(0, 8),
      opportunities: esg.drivers.length > 0 ? esg.drivers : ["Opportunity set depends on verified upgrades — see retrofit planner."],
    },
    acquisitionSection: {
      acquisitionScore: acq.acquisitionScore,
      screenStatus: acq.screenStatus,
      investorFit: acq.investorFit,
      blockers: blockers.slice(0, 12),
      requiredDiligence,
    },
    actionPlan: {
      topImmediateActions: topImmediate.length > 0 ? topImmediate : ["No CRITICAL/BLOCKED items — continue monitoring Action Center."],
      quickWins: quickWins.length > 0 ? quickWins : ["Review documentation quick wins when generator proposes them."],
      strategicActions: strategic.length > 0 ? strategic : openActions.slice(0, 5).map((a) => a.title),
    },
    retrofitPlan: {
      selectedPlan: retrofit.planType,
      phaseRoadmap: retrofit.topActions,
      financingMatches: ctx.financingOptions.slice(0, 6).map((f) => `${f.name} — ${f.financingType}`),
    },
    optimizerSection: {
      selectedStrategy: opt?.strategyType ?? null,
      objectiveMode: opt?.objectiveMode ?? null,
      topRecommendedActions: optActions.slice(0, 10),
      expectedDirectionalImprovement: optDirection,
    },
    finalRecommendation: {
      recommendation: rec,
      rationale: decision.rationale,
      requiredApprovals: [
        "Sponsor / deal lead confirmation of facts",
        "ESG & technical review of retrofit + evidence plan",
        "Finance / IC per internal mandate (if applicable)",
      ],
      followUpItems: decision.proceedConditions,
    },
    appendices: {
      methodologyNotes: [
        "Scores compose from energy, carbon, sustainability inputs and ingestion coverage (see platform ESG methodology notes).",
        "Retrofit bands are directional cost/impact ranges — not quotes.",
      ],
      evidenceSummary: [
        `${ctx.evidenceCounts.documents} document(s); ${ctx.evidenceCounts.evidenceRows} evidence link(s); ${ctx.evidenceCounts.events} score event(s).`,
      ],
      scoringVersions: [
        `MEMO:${INVESTOR_IC_PACK_VERSION}`,
        `Decision stage: ${stage}`,
        `Optimizer plan status: ${opt?.status ?? "none"}`,
      ],
    },
    disclaimers: {
      verifiedVsEstimated: esg.verifiedNote,
      internalToolDisclaimer: INTERNAL_DISCLAIMER,
      adviceDisclaimer: ADVICE_DISCLAIMER,
    },
    decisionTrace: {
      rationale: decision.rationale,
      sourceSignals: decision.sourceSignals,
    },
    partialOutput,
  };
}

function strengthsHighlights(ctx: InvestorListingContext): string[] {
  const out: string[] = [];
  if (ctx.esgProfile?.compositeScore != null && ctx.esgProfile.compositeScore >= 55) {
    out.push(`ESG composite at or above typical internal display threshold (${ctx.esgProfile.compositeScore.toFixed(0)}).`);
  }
  if (ctx.retrofitPlan) out.push(`Formal retrofit strategy on file (${ctx.retrofitPlan.strategyType}).`);
  if (ctx.optimizerPlan && ctx.optimizerPlan.status !== "DRAFT") {
    out.push(`Optimization plan present (${ctx.optimizerPlan.status}).`);
  }
  if (out.length === 0) out.push("Awaiting stronger verified highlights — current record is sparse.");
  return out.slice(0, 8);
}
